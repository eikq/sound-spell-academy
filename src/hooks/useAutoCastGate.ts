import { useRef, useCallback } from "react";

export interface AutoCastGateConfig {
  cooldownMs: number;      // 1000–1500
  debounceMs: number;      // 250–400
  rearmMs: number;         // 1200–1800
  minAccuracy: number;     // 0.65 default
  minConfidence: number;   // 0.50 default
}

export function useAutoCastGate(cfg: AutoCastGateConfig) {
  const state = useRef({
    lastAt: 0,
    lastKey: "",
    timer: 0 as unknown as number,
    lastTranscript: "",
  });

  const normalize = (s="") => s.toLowerCase().replace(/[^a-z]/g, "");

  /** Mode-aware edge trigger: practice|duel pass `mode` */
  const tryCast = useCallback((
    mode: "practice" | "duel",
    result: { transcript: string; loudness: number; confidence: number; isFinal?: boolean },
    best: { spellId: string; element: string; accuracy: number; confidence: number; chargeTier: 0|1|2; power: number },
    cast: () => void
  ) => {
    // debounce transcript stability
    clearTimeout(state.current.timer as any);
    state.current.timer = setTimeout(() => {
      const now = Date.now();
      const t = normalize(result.transcript);
      const key = `${mode}|${best.spellId}|${t}|${best.chargeTier}`;

      const cooldownOk = now - state.current.lastAt >= cfg.cooldownMs;
      const newKey = key !== state.current.lastKey;

      const thresholdsOk =
        best.accuracy >= cfg.minAccuracy &&
        (best.confidence ?? result.confidence) >= cfg.minConfidence;

      if (cooldownOk && newKey && thresholdsOk) {
        cast();
        state.current.lastAt = now;
        state.current.lastKey = key;
        setTimeout(() => {
          if (state.current.lastKey === key) state.current.lastKey = "";
        }, cfg.rearmMs);
      }
    }, cfg.debounceMs) as any;
  }, [cfg]);

  return { tryCast };
}