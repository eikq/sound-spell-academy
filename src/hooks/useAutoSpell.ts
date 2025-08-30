import { useCallback, useEffect, useRef, useState } from "react";
import { distance } from "fastest-levenshtein";
import doubleMetaphone from "double-metaphone";
import DiffMatchPatch from "diff-match-patch";
import type { Spell } from "@/game/spells/data";
import type { PronunciationResult } from "@/hooks/useSpeech";

const dmp = new DiffMatchPatch();

// Normalize text for comparison
function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Create letter-by-letter highlights
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

// Calculate accuracy scores
function computeScores(targetPhrase: string, spokenPhrase: string, aliases: string[] = [], phonemes: string[] = []) {
  const t = normalize(targetPhrase);
  const s = normalize(spokenPhrase);

  // Direct name matching (60% weight)
  const maxLen = Math.max(t.length, s.length) || 1;
  const charDist = distance(t, s);
  const nameAcc = 1 - charDist / maxLen;

  // Alias matching (25% weight)
  let aliasAcc = 0;
  for (const alias of aliases) {
    const aliasNorm = normalize(alias);
    const aliasMaxLen = Math.max(aliasNorm.length, s.length) || 1;
    const aliasDist = distance(aliasNorm, s);
    const aliasScore = 1 - aliasDist / aliasMaxLen;
    aliasAcc = Math.max(aliasAcc, aliasScore);
  }

  // Phoneme matching (15% weight)
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
  const accuracy = Math.max(0, Math.min(1, 0.60 * nameAcc + 0.25 * aliasAcc + 0.15 * phonemeAcc));
  const letters = letterHighlights(t, s);
  return { accuracy: accuracy * 100, phoneticScore: phonemeAcc * 100, letters };
}

export function useAutoSpell(spells: Spell[], opts?: { minAccuracy?: number; minConfidence?: number }) {
  // State management
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

  // Audio and recognition refs
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const microphone = useRef<MediaStreamAudioSourceNode | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const recognition = useRef<any>(null);
  const animationFrame = useRef<number | null>(null);
  
  // Control refs
  const isActive = useRef(false);
  const isSpeaking = useRef(false);
  const lastSpeechTime = useRef(0);
  const segmentStartTime = useRef(0);
  const hasProcessedSegment = useRef(false);
  const lastProcessedTranscript = useRef("");
  const spellCooldowns = useRef<Record<string, number>>({});
  
  const minAccuracy = opts?.minAccuracy ?? 0.15;
  const minConfidence = opts?.minConfidence ?? 0.2;

  // Setup audio context and microphone
  const setupAudio = useCallback(async () => {
    try {
      console.log("🎤 Setting up audio...");
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      mediaStream.current = stream;
      
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      const analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 2048;
      analyserNode.smoothingTimeConstant = 0.8;
      
      const mic = ctx.createMediaStreamSource(stream);
      mic.connect(analyserNode);
      
      audioContext.current = ctx;
      analyser.current = analyserNode;
      microphone.current = mic;
      
      console.log("✅ Audio setup complete");
    } catch (err) {
      console.error("❌ Audio setup failed:", err);
      throw err;
    }
  }, []);

  // Cleanup audio
  const cleanupAudio = useCallback(() => {
    console.log("🧹 Cleaning up audio...");
    
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
    
    if (microphone.current) {
      try {
        microphone.current.disconnect();
      } catch (e) {}
      microphone.current = null;
    }
    
    if (audioContext.current) {
      audioContext.current.close().catch(() => {});
      audioContext.current = null;
    }
    
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(track => track.stop());
      mediaStream.current = null;
    }
    
    analyser.current = null;
  }, []);

  // Audio analysis loop
  const analyzeAudio = useCallback(() => {
    if (!analyser.current || !isActive.current) return;
    
    const bufferLength = analyser.current.fftSize;
    const dataArray = new Float32Array(bufferLength);
    analyser.current.getFloatTimeDomainData(dataArray);
    
    // Calculate RMS (loudness)
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / bufferLength);
    const normalizedLoudness = Math.max(0, Math.min(1, (rms - 0.01) / 0.15));
    
    setLoudness(normalizedLoudness);
    
    // Simple pitch detection
    const sampleRate = audioContext.current?.sampleRate || 44100;
    let pitch = null;
    if (rms > 0.01) {
      // Basic autocorrelation for pitch
      const threshold = 0.3;
      let maxCorr = 0;
      let bestPeriod = 0;
      
      for (let period = 50; period < 500; period++) {
        let correlation = 0;
        for (let i = 0; i < bufferLength - period; i++) {
          correlation += dataArray[i] * dataArray[i + period];
        }
        if (correlation > maxCorr) {
          maxCorr = correlation;
          bestPeriod = period;
        }
      }
      
      if (bestPeriod > 0 && maxCorr > threshold) {
        pitch = sampleRate / bestPeriod;
        if (pitch < 80 || pitch > 400) pitch = null; // Filter out invalid pitches
      }
    }
    
    setPitchHz(pitch);
    
    // Speech detection logic
    const now = Date.now();
    const speechThreshold = 0.03;
    const silenceTimeout = 500; // 500ms of silence before processing
    
    if (normalizedLoudness > speechThreshold) {
      if (!isSpeaking.current) {
        console.log("🗣️ Speech started");
        isSpeaking.current = true;
        segmentStartTime.current = now;
        hasProcessedSegment.current = false;
      }
      lastSpeechTime.current = now;
    } else if (isSpeaking.current && (now - lastSpeechTime.current) > silenceTimeout) {
      console.log("🔇 Speech ended, processing...");
      isSpeaking.current = false;
      
      // Will be processed by speech recognition results
    }
    
    animationFrame.current = requestAnimationFrame(analyzeAudio);
  }, []);

  // Setup speech recognition
  const setupSpeechRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      throw new Error("Speech Recognition not supported");
    }
    
    const speechRecognition = new SpeechRecognition();
    speechRecognition.continuous = true;
    speechRecognition.interimResults = true;
    speechRecognition.lang = "en-US";
    speechRecognition.maxAlternatives = 3;
    
    let finalTranscript = "";
    let lastFinalTime = 0;
    
    speechRecognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        
        if (result.isFinal) {
          let bestTranscript = "";
          let bestConfidence = 0;
          
          // Find best alternative
          for (let j = 0; j < Math.min(result.length, 3); j++) {
            const alternative = result[j];
            const transcript = (alternative.transcript || "").trim();
            const confidence = alternative.confidence || 0;
            
            if (transcript.length >= 2 && confidence > bestConfidence) {
              bestTranscript = transcript;
              bestConfidence = confidence;
            }
          }
          
          if (bestTranscript && bestTranscript !== lastProcessedTranscript.current) {
            finalTranscript = bestTranscript;
            lastFinalTime = Date.now();
            
            // Process the speech if we're not already speaking
            if (!isSpeaking.current && !hasProcessedSegment.current) {
              processSpokenText(bestTranscript, bestConfidence, lastFinalTime);
            }
          }
        }
      }
    };
    
    speechRecognition.onerror = (event: any) => {
      console.log(`🔴 Speech error: ${event.error}`);
      
      // Handle specific errors
      if (event.error === 'aborted' || event.error === 'no-speech') {
        // These are normal, don't show error
        return;
      }
      
      if (['not-allowed', 'service-not-allowed'].includes(event.error)) {
        setError('Microphone permission denied');
        isActive.current = false;
        setListening(false);
        return;
      }
      
      if (event.error === 'network') {
        setError('Network error - check connection');
        return;
      }
      
      // For other errors, just log
      console.warn(`⚠️ Speech warning: ${event.error}`);
    };
    
    speechRecognition.onend = () => {
      console.log("🔄 Speech recognition ended");
      
      if (isActive.current) {
        // Restart after a short delay
        setTimeout(() => {
          if (isActive.current && recognition.current) {
            try {
              console.log("🔄 Restarting speech recognition");
              recognition.current.start();
            } catch (e) {
              console.warn("Failed to restart speech recognition:", e);
            }
          }
        }, 100);
      }
    };
    
    return speechRecognition;
  }, []);

  // Process spoken text and find spell matches
  const processSpokenText = useCallback((transcript: string, confidence: number, timestamp: number) => {
    if (hasProcessedSegment.current) return;
    
    console.log(`🎙️ Processing: "${transcript}" (confidence: ${confidence.toFixed(2)})`);
    
    const now = Date.now();
    let bestMatch: { spell: Spell; score: number; detail: ReturnType<typeof computeScores> } | null = null;
    
    // Find best spell match
    for (const spell of spells) {
      const aliases = (spell as any).aliases || [];
      const phonemes = (spell as any).phonemes || [];
      const spellName = spell.canonical || spell.displayName;
      const detail = computeScores(spellName, transcript, aliases, phonemes);
      const score = detail.accuracy / 100;
      
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { spell, score, detail };
      }
    }
    
    if (!bestMatch) {
      console.log("❌ No spell matches found");
      return;
    }
    
    console.log(`🔍 Best match: ${bestMatch.spell.displayName} (${(bestMatch.score * 100).toFixed(1)}%)`);
    
    // Check if accuracy is sufficient
    if (bestMatch.score < minAccuracy || confidence < minConfidence) {
      console.log(`❌ Accuracy/confidence too low: ${(bestMatch.score * 100).toFixed(1)}%/${(confidence * 100).toFixed(1)}%`);
      return;
    }
    
    // Check spell cooldown
    const spellKey = bestMatch.spell.id;
    const lastCast = spellCooldowns.current[spellKey] || 0;
    const cooldownTime = 500; // 500ms per spell
    
    if (now - lastCast < cooldownTime) {
      console.log(`⏳ Spell on cooldown: ${bestMatch.spell.displayName}`);
      return;
    }
    
    // Cast the spell!
    const power = Math.max(0.4, Math.min(1.0, 0.7 + 0.3 * bestMatch.score));
    
    const result: PronunciationResult = {
      transcript,
      confidence,
      accuracy: bestMatch.detail.accuracy,
      phoneticScore: bestMatch.detail.phoneticScore,
      loudness: loudness,
      letters: bestMatch.detail.letters,
    };
    
    console.log(`✨ CASTING: ${bestMatch.spell.displayName} (power: ${power.toFixed(2)})`);
    
    setLastDetected({
      spell: bestMatch.spell,
      result,
      power,
      timestamp: now
    });
    
    spellCooldowns.current[spellKey] = now;
    lastProcessedTranscript.current = transcript;
    hasProcessedSegment.current = true;
    
  }, [spells, minAccuracy, minConfidence, loudness]);

  // Start the auto-spell system
  const start = useCallback(async () => {
    if (isActive.current) {
      console.log("⚠️ Auto-spell already active");
      return;
    }
    
    try {
      console.log("🚀 Starting auto-spell system...");
      setError(null);
      
      await setupAudio();
      
      const speechRecognition = setupSpeechRecognition();
      recognition.current = speechRecognition;
      
      isActive.current = true;
      setListening(true);
      
      // Start audio analysis
      analyzeAudio();
      
      // Start speech recognition
      speechRecognition.start();
      
      console.log("✅ Auto-spell system started");
      
    } catch (err: any) {
      console.error("❌ Failed to start auto-spell:", err);
      setError(err.message || "Failed to start auto-spell");
      setListening(false);
      isActive.current = false;
      cleanupAudio();
    }
  }, [setupAudio, setupSpeechRecognition, analyzeAudio, cleanupAudio]);

  // Stop the auto-spell system
  const stop = useCallback(() => {
    console.log("🛑 Stopping auto-spell system...");
    
    isActive.current = false;
    setListening(false);
    setError(null);
    
    if (recognition.current) {
      try {
        recognition.current.abort();
      } catch (e) {}
      recognition.current = null;
    }
    
    cleanupAudio();
    
    // Reset state
    isSpeaking.current = false;
    hasProcessedSegment.current = false;
    lastProcessedTranscript.current = "";
    
    console.log("✅ Auto-spell system stopped");
  }, [cleanupAudio]);

  // Cleanup on unmount
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
    lastDetected
  } as const;
}