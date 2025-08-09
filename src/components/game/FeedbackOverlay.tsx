import React from "react";
import type { PronunciationResult } from "@/hooks/useSpeech";

interface Props {
  target: string;
  result: PronunciationResult | null;
  listening: boolean;
  loudness: number;
}

export const FeedbackOverlay: React.FC<Props> = ({ target, result, listening, loudness }) => {
  const accuracy = result?.accuracy ?? 0;
  const letters = result?.letters ?? target.split("").map((c) => ({ char: c, correct: false }));

  return (
    <div className="w-full rounded-lg border p-4 bg-card/70 backdrop-blur-md animate-enter">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">Spell</div>
          <div className="text-lg font-semibold">{target}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Accuracy</div>
          <div className="text-2xl font-bold">{accuracy.toFixed(0)}%</div>
        </div>
      </div>

      <div className="mt-3 h-2 w-full bg-muted rounded overflow-hidden" aria-label="Pronunciation accuracy bar">
        <div
          className="h-full bg-[hsl(var(--brand))] transition-all"
          style={{ width: `${Math.min(100, Math.max(0, accuracy))}%` }}
        />
      </div>

      <div className="mt-4 text-sm">
        <span className="text-muted-foreground">Letters: </span>
        <span>
          {letters.map((l, idx) => (
            <span
              key={idx}
              className={l.correct ? "text-[hsl(var(--success))]" : "text-destructive"}
            >
              {l.char}
            </span>
          ))}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Voice Loudness</span>
          <span>{Math.round(loudness * 100)}%</span>
        </div>
        <div className="h-2 w-full bg-muted rounded overflow-hidden">
          <div
            className="h-full bg-[linear-gradient(90deg,hsl(var(--brand)),hsl(var(--brand-2)))] transition-all"
            style={{ width: `${Math.min(100, Math.max(0, loudness * 100))}%` }}
          />
        </div>
        {listening && <div className="mt-2 text-xs text-accent-foreground">Listening... speak clearly into the mic</div>}
      </div>
    </div>
  );
};

export default FeedbackOverlay;
