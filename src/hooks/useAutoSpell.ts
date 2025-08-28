
import { useCallback, useEffect, useRef, useState } from "react";
import { distance } from "fastest-levenshtein";
import doubleMetaphone from "double-metaphone";
import DiffMatchPatch from "diff-match-patch";
import type { Spell } from "@/game/spells/data";
import type { PronunciationResult } from "@/hooks/useSpeech";

const dmp = new DiffMatchPatch();

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function letterHighlights(target: string, spoken: string) {
  const diffs = dmp.diff_main(target, spoken);
  dmp.diff_cleanupSemantic(diffs as any);
  const letters: { char: string; correct: boolean }[] = [];
  let tIndex = 0;
  for (const [op, text] of diffs as [number, string][]) {
    if (op === 0) {
      for (let i = 0; i < text.length; i++) {
        letters.push({ char: target[tIndex + i] || "", correct: true });
      }
      tIndex += text.length;
    } else if (op === -1) {
      for (let i = 0; i < text.length; i++) {
        letters.push({ char: target[tIndex + i] || "", correct: false });
      }
      tIndex += text.length;
    }
  }
  return letters;
}

function computeScores(targetPhrase: string, spokenPhrase: string, aliases: string[] = [], phonemes: string[] = []) {
  const t = normalize(targetPhrase);
  const s = normalize(spokenPhrase);

  // Direct name matching (weight: 0.55)
  const maxLen = Math.max(t.length, s.length) || 1;
  const charDist = distance(t, s);
  const nameAcc = 1 - charDist / maxLen;

  // Alias matching (weight: 0.25)
  let aliasAcc = 0;
  for (const alias of aliases) {
    const aliasNorm = normalize(alias);
    const aliasMaxLen = Math.max(aliasNorm.length, s.length) || 1;
    const aliasDist = distance(aliasNorm, s);
    const aliasScore = 1 - aliasDist / aliasMaxLen;
    aliasAcc = Math.max(aliasAcc, aliasScore);
  }

  // Phoneme matching (weight: 0.20)
  const [tPh1] = doubleMetaphone(t);
  const [sPh1] = doubleMetaphone(s);
  let phonemeAcc = 0;
  if (tPh1 && sPh1) {
    const maxPhLen = Math.max(tPh1.length, sPh1.length) || 1;
    const phDist = distance(tPh1, sPh1);
    phonemeAcc = 1 - phDist / maxPhLen;
  }

  // Enhanced phoneme matching with provided phonemes
  for (const phoneme of phonemes) {
    const phonemeNorm = normalize(phoneme.replace(/[-]/g, ' '));
    const [phMeta] = doubleMetaphone(phonemeNorm);
    if (phMeta && sPh1) {
      const pMaxLen = Math.max(phMeta.length, sPh1.length) || 1;
      const pDist = distance(phMeta, sPh1);
      const pScore = 1 - pDist / pMaxLen;
      phonemeAcc = Math.max(phonemeAcc, pScore);
    }
  }

  // Weighted final accuracy
  const accuracy = Math.max(0, Math.min(1, 0.55 * nameAcc + 0.25 * aliasAcc + 0.20 * phonemeAcc));
  const letters = letterHighlights(t, s);
  return { accuracy: accuracy * 100, phoneticScore: phonemeAcc * 100, letters };
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function getBestMatch(spells: Spell[], result: { transcript: string; loudness: number; confidence: number }, displayMode: 'canon' | 'original' = 'canon') {
  if (!result.transcript) return null;
  
  let bestMatch: { spell: Spell; accuracy: number; confidence: number; chargeTier: number; power: number } | null = null;
  
  for (const spell of spells) {
    const aliases = (spell as any).aliases || [];
    const phonemes = (spell as any).phonemes || [];
    const spellName = displayMode === 'canon' ? spell.canonical : spell.displayName;
    const detail = computeScores(spellName, result.transcript, aliases, phonemes);
    const accuracy = detail.accuracy / 100;
    
    // FIXED: Much easier difficulty thresholds for better user experience
    const thresholds = { 1: 0.35, 2: 0.40, 3: 0.45, 4: 0.50, 5: 0.55 }; // Significantly lowered
    const threshold = thresholds[spell.difficulty] || 0.40; // Lower default threshold
    
    if (accuracy >= threshold && result.confidence >= 0.3) { // Lowered confidence requirement
      const basePower = (spell as any).basePower || 1.0;
      const power = basePower * (0.6 + 0.4 * accuracy) * (0.9 + 0.2 * result.loudness);
      const clampedPower = Math.max(0.4, Math.min(2.0, power));
      const chargeTier = result.loudness > 0.7 ? 2 : result.loudness > 0.4 ? 1 : 0;
      
      if (!bestMatch || accuracy > bestMatch.accuracy) {
        bestMatch = { spell, accuracy, confidence: result.confidence, chargeTier, power: clampedPower };
      }
    }
  }
  
  return bestMatch;
}

export function useAutoSpell(spells: Spell[], opts?: { minAccuracy?: number; minConfidence?: number }) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loudness, setLoudness] = useState(0);
  const [pitchHz, setPitchHz] = useState<number | null>(null);
  const [lastDetected, setLastDetected] = useState<null | { 
    spell: Spell; 
    result: PronunciationResult; 
    power: number;
    timestamp: number;
  }>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const peakRmsRef = useRef(0);
  const recognitionRef = useRef<any>(null);
  const isStartingRef = useRef(false);
  const lastCastAtRef = useRef(0);
  const lastTranscriptRef = useRef("");
  const speakingRef = useRef(false);
  const lastVoiceAtRef = useRef(0);
  const segmentStartedAtRef = useRef(0);
  const segmentCastedRef = useRef(false);
  const lastFinalRef = useRef<{ transcript: string; confidence: number; time: number } | null>(null);
  const shouldListenRef = useRef(false);
  const lastSpellCastAtRef = useRef<Record<string, number>>({});
  
  const minAccuracy = opts?.minAccuracy ?? 0.40; // Much lower for easier casting
  const minConfidence = opts?.minConfidence ?? 0.3; // Lowered confidence requirement

  const setupAudio = useCallback(async () => {
    if (audioCtxRef.current || isStartingRef.current) return;
    
    try {
      isStartingRef.current = true;
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      
      const mic = audioCtx.createMediaStreamSource(stream);
      mic.connect(analyser);
      
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      micSourceRef.current = mic;
    } finally {
      isStartingRef.current = false;
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    
    if (micSourceRef.current) {
      try {
        micSourceRef.current.disconnect();
      } catch (e) {}
      micSourceRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    analyserRef.current = null;
    isStartingRef.current = false;
  }, []);

  const estimatePitch = useCallback((buf: Float32Array, sampleRate: number): number | null => {
    const SIZE = buf.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.008) return null; // Lower threshold for better detection

    // Improved autocorrelation
    let r1 = 0, r2 = SIZE - 1;
    const thres = rms * 0.3;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    }

    const buf2 = buf.slice(r1, r2);
    if (buf2.length < 100) return null;
    
    const autocorr = new Array(buf2.length).fill(0);
    for (let lag = 0; lag < buf2.length; lag++) {
      for (let i = 0; i < buf2.length - lag; i++) {
        autocorr[lag] += buf2[i] * (buf2[i + lag] || 0);
      }
    }

    let d = 0;
    while (d < autocorr.length - 1 && autocorr[d] > autocorr[d + 1]) d++;
    
    let max = -1, maxPos = -1;
    for (let i = d; i < buf2.length; i++) {
      if (autocorr[i] > max) { max = autocorr[i]; maxPos = i; }
    }
    
    if (maxPos <= 0 || max < autocorr[0] * 0.3) return null;

    // Parabolic interpolation
    const x1 = autocorr[maxPos - 1] || 0;
    const x2 = autocorr[maxPos];
    const x3 = autocorr[maxPos + 1] || 0;
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    const shift = a !== 0 ? -b / (2 * a) : 0;
    const period = maxPos + shift;
    
    if (!period || period === Infinity) return null;
    const freq = sampleRate / period;
    return (freq >= 60 && freq <= 500) ? freq : null;
  }, []);

  const measure = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    
    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);
    
    let sumSquares = 0;
    for (let i = 0; i < buffer.length; i++) {
      sumSquares += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sumSquares / buffer.length);
    const normalized = Math.max(0, Math.min(1, (rms - 0.015) / 0.3)); // Adjusted sensitivity
    
    peakRmsRef.current = Math.max(peakRmsRef.current * 0.98, normalized); // Decay peak slightly
    setLoudness(normalized);
    
    const freq = estimatePitch(buffer, audioCtxRef.current?.sampleRate || 44100);
    setPitchHz(freq);

    // Voice Activity + Silence segmentation
    const now = Date.now();
    const voiceThreshold = 0.05;
    if (normalized > voiceThreshold) {
      if (!speakingRef.current) {
        speakingRef.current = true;
        segmentStartedAtRef.current = now;
        segmentCastedRef.current = false;
      }
      lastVoiceAtRef.current = now;
    } else if (speakingRef.current && now - lastVoiceAtRef.current > 800) { // Faster end detection
      // Phrase ended: cast once using last final transcript if available
      if (!segmentCastedRef.current && lastFinalRef.current && lastFinalRef.current.time >= segmentStartedAtRef.current) {
        const { transcript, confidence } = lastFinalRef.current;
        const normalizedTranscript = normalize(transcript);
        const tooSoon = (now - lastCastAtRef.current) < 500; // Reduced to 500ms for responsiveness
        const isDuplicate = normalizedTranscript && lastTranscriptRef.current === normalizedTranscript && ((now - lastCastAtRef.current) < 1500); // Reduced duplicate window
        
        if (!tooSoon && !isDuplicate) {
          let bestMatch: { spell: Spell; score: number; detail: ReturnType<typeof computeScores> } | null = null;
          for (const spell of spells) {
            const aliases = (spell as any).aliases || [];
            const phonemes = (spell as any).phonemes || [];
            const spellName = spell.canonical || spell.displayName;
            const detail = computeScores(spellName, transcript, aliases, phonemes);
            const score = detail.accuracy / 100;
            if (!bestMatch || score > bestMatch.score) bestMatch = { spell, score, detail };
          }
          
          // BUG FIX: Check if bestMatch exists before using it
          if (bestMatch && bestMatch.score >= minAccuracy / 100 && confidence >= minConfidence) {
            const key = bestMatch.spell.id;
            const lastAt = lastSpellCastAtRef.current[key] ?? 0;
            if (now - lastAt >= 1000) { // Reduced to 1s for better responsiveness
              const power = clamp01(0.7 * bestMatch.score + 0.3 * peakRmsRef.current);
              const result: PronunciationResult = {
                transcript,
                confidence,
                accuracy: bestMatch.detail.accuracy,
                phoneticScore: bestMatch.detail.phoneticScore,
                loudness: peakRmsRef.current,
                letters: bestMatch.detail.letters,
              };
              setLastDetected({ spell: bestMatch.spell, result, power, timestamp: now });
              lastSpellCastAtRef.current[key] = now;
              lastCastAtRef.current = now;
              lastTranscriptRef.current = normalizedTranscript;
              lastFinalRef.current = null;
            } else {
              // Within same-spell cooldown: do not cast, but consume this segment
              lastTranscriptRef.current = normalizedTranscript;
              lastFinalRef.current = null;
            }
          }
        }
      }
      // Reset for next segment
      speakingRef.current = false;
      segmentCastedRef.current = true;
      peakRmsRef.current = 0;
    }
    
    rafRef.current = requestAnimationFrame(measure);
  }, [estimatePitch, spells, minAccuracy, minConfidence]);

  const start = useCallback(async () => {
    if (listening || isStartingRef.current) return;
    
    try {
      setError(null);
      await setupAudio();
      
      peakRmsRef.current = 0;
      measure();

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error("Speech Recognition not supported in this browser.");
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.maxAlternatives = 3; // Get multiple alternatives
      recognition.continuous = true;

      let lastProcessTime = 0;
      const PROCESS_THROTTLE = 100; // ms

      recognition.onresult = (ev: any) => {
        const now = Date.now();
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const res = ev.results[i];
          if (!res.isFinal) continue;
          // Choose best alternative by confidence
          let bestAlt: { transcript: string; confidence: number } | null = null;
          for (let j = 0; j < Math.min(res.length, 3); j++) {
            const alt = res[j];
            const t = String(alt.transcript || "").trim();
            const c = Number(alt.confidence || 0);
            if (t.length < 2) continue;
            if (!bestAlt || c > bestAlt.confidence) bestAlt = { transcript: t, confidence: c };
          }
          if (bestAlt) {
            lastFinalRef.current = { transcript: bestAlt.transcript, confidence: bestAlt.confidence, time: now };
          }
        }
      };

      recognition.onerror = (ev: any) => {
        console.error("Speech recognition error:", ev.error);
        setError(`Speech error: ${ev.error}`);
      };

      recognition.onend = () => {
        if (shouldListenRef.current && recognitionRef.current) {
          // Reduce restart frequency to prevent lag
          setTimeout(() => {
            try {
              if (shouldListenRef.current && recognitionRef.current) {
                recognitionRef.current.start();
              }
            } catch (e) {
              console.warn("Failed to restart recognition:", e);
            }
          }, 300); // Increased delay to reduce conflicts
        }
      };

      recognitionRef.current = recognition;
      shouldListenRef.current = true;
      setListening(true);
      recognition.start();
    } catch (e: any) {
      console.error("Auto-spell start error:", e);
      setError(e?.message || "Failed to access microphone");
      setListening(false);
      stopAudio();
    }
  }, [listening, setupAudio, stopAudio, spells, minAccuracy, minConfidence, measure]);

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    setListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    stopAudio();
  }, [stopAudio]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { 
    listening, 
    start, 
    stop, 
    error, 
    loudness, 
    pitchHz, 
    lastDetected,
    getBestMatch: (result: { transcript: string; loudness: number; confidence: number }, displayMode?: 'canon' | 'original') => 
      getBestMatch(spells, result, displayMode)
  } as const;
}
