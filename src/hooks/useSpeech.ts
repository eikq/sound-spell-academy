import { useCallback, useEffect, useRef, useState } from "react";
import { distance } from "fastest-levenshtein";
import doubleMetaphone from "double-metaphone";
import DiffMatchPatch from "diff-match-patch";

export type PronunciationLetters = { char: string; correct: boolean }[];

export interface PronunciationResult {
  transcript: string;
  confidence: number;
  accuracy: number; // 0–100
  phoneticScore: number; // 0–100
  loudness: number; // 0–1 (peak RMS during phrase)
  letters: PronunciationLetters;
}

const dmp = new DiffMatchPatch();

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function letterHighlights(target: string, spoken: string): PronunciationLetters {
  const diffs = dmp.diff_main(target, spoken);
  dmp.diff_cleanupSemantic(diffs);
  const letters: PronunciationLetters = [];
  let tIndex = 0;
  let sIndex = 0;
  for (const [op, text] of diffs as [number, string][]) {
    if (op === 0) {
      for (let i = 0; i < text.length; i++) {
        letters.push({ char: target[tIndex + i] || "", correct: true });
      }
      tIndex += text.length;
      sIndex += text.length;
    } else if (op === -1) {
      // deletion from target => missed letter
      for (let i = 0; i < text.length; i++) {
        letters.push({ char: target[tIndex + i] || "", correct: false });
      }
      tIndex += text.length;
    } else if (op === 1) {
      // insertion in spoken => skip
      sIndex += text.length;
    }
  }
  return letters;
}

function computeScores(targetPhrase: string, spokenPhrase: string) {
  const t = normalize(targetPhrase);
  const s = normalize(spokenPhrase);

  const maxLen = Math.max(t.length, s.length) || 1;
  const charDist = distance(t, s);
  const charAcc = 1 - charDist / maxLen; // 0–1

  const [tPh1] = doubleMetaphone(t);
  const [sPh1] = doubleMetaphone(s);
  const maxPhLen = Math.max(tPh1.length, sPh1.length) || 1;
  const phDist = distance(tPh1, sPh1);
  const phAcc = 1 - phDist / maxPhLen; // 0–1

  const accuracy = Math.max(0, Math.min(1, 0.6 * charAcc + 0.4 * phAcc));
  const letters = letterHighlights(t, s);
  return { accuracy: accuracy * 100, phoneticScore: phAcc * 100, letters };
}

export function useSpeechRecognition() {
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loudness, setLoudness] = useState(0);
  const [pitchHz, setPitchHz] = useState<number | null>(null);

  const targetRef = useRef<string>("");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const peakRmsRef = useRef(0);
  const recognitionRef = useRef<any>(null);

  const setupAudio = useCallback(async () => {
    if (audioCtxRef.current) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;

    const mic = audioCtx.createMediaStreamSource(stream);
    mic.connect(analyser);

    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;
    micSourceRef.current = mic;
  }, []);

  const stopAudio = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    if (micSourceRef.current) {
      try {
        (micSourceRef.current.mediaStream.getTracks() || []).forEach((t) => t.stop());
      } catch {}
      micSourceRef.current.disconnect();
      micSourceRef.current = null;
    }
  }, []);

  const estimatePitch = (buf: Float32Array, sampleRate: number): number | null => {
    // Autocorrelation method
    const SIZE = buf.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return null; // too quiet

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }

    const buf2 = buf.slice(r1, r2);
    const autocorr = new Array(buf2.length).fill(0);
    for (let lag = 0; lag < buf2.length; lag++) {
      for (let i = 0; i < buf2.length - lag; i++) {
        autocorr[lag] += buf2[i] * buf2[i + lag];
      }
    }

    let d = 0; while (autocorr[d] > autocorr[d + 1]) d++;
    let max = -1, maxPos = -1;
    for (let i = d; i < buf2.length; i++) {
      if (autocorr[i] > max) { max = autocorr[i]; maxPos = i; }
    }
    if (maxPos <= 0) return null;

    // Parabolic interpolation for better peak
    const x1 = autocorr[maxPos - 1] || 0;
    const x2 = autocorr[maxPos];
    const x3 = autocorr[maxPos + 1] || 0;
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    const shift = a ? -b / (2 * a) : 0;
    const period = maxPos + shift;
    if (!period || period === Infinity) return null;
    const freq = sampleRate / period;
    if (freq < 50 || freq > 600) return null;
    return freq;
  };

  const measure = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);

    // Loudness RMS
    let sumSquares = 0;
    for (let i = 0; i < buffer.length; i++) sumSquares += buffer[i] * buffer[i];
    const rms = Math.sqrt(sumSquares / buffer.length);
    const normalized = Math.max(0, Math.min(1, (rms - 0.02) / 0.25));
    peakRmsRef.current = Math.max(peakRmsRef.current, normalized);
    setLoudness(normalized);

    // Pitch
    const sr = audioCtxRef.current?.sampleRate || 44100;
    const freq = estimatePitch(buffer, sr);
    setPitchHz(freq ?? null);

    rafRef.current = requestAnimationFrame(measure);
  }, []);

  const start = useCallback(async (targetPhrase: string) => {
    try {
      setError(null);
      setResult(null);
      targetRef.current = targetPhrase;
      await setupAudio();
      peakRmsRef.current = 0;
      measure();

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError("Speech Recognition not supported in this browser.");
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onresult = (ev: any) => {
        const res = ev.results[0][0];
        const transcript = String(res.transcript || "");
        const confidence = Number(res.confidence || 0);
        const { accuracy, phoneticScore, letters } = computeScores(
          targetRef.current,
          transcript
        );
        const final: PronunciationResult = {
          transcript,
          confidence,
          accuracy,
          phoneticScore,
          loudness: peakRmsRef.current,
          letters,
        };
        setResult(final);
      };

      recognition.onerror = (ev: any) => {
        setError(ev.error || "Unknown error");
      };

      recognition.onend = () => {
        setListening(false);
        stopAudio();
      };

      recognitionRef.current = recognition;
      setListening(true);
      recognition.start();
    } catch (e: any) {
      setError(e?.message || "Microphone access denied");
      setListening(false);
      stopAudio();
    }
  }, [measure, setupAudio, stopAudio]);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop?.();
    } finally {
      setListening(false);
      stopAudio();
    }
  }, [stopAudio]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { listening, start, stop, result, error, loudness, pitchHz } as const;
}
