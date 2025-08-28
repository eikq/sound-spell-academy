import React, { useEffect, useRef } from "react";

interface MicVisualizerProps {
  loudness: number; // 0..1
  pitchHz?: number | null; // ~80..400 typical
  listening?: boolean;
}

// Maps pitch to hue between teal (190) and amber (35)
function hueFromPitch(pitch?: number | null) {
  if (!pitch || pitch <= 0) return 190; // default teal
  const min = 80;
  const max = 400;
  const clamped = Math.max(min, Math.min(max, pitch));
  const t = (clamped - min) / (max - min); // 0..1
  // interpolate from teal(190) to amber(35)
  return 190 + (35 - 190) * t;
}

const MicVisualizer: React.FC<MicVisualizerProps> = ({ loudness, pitchHz, listening }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    const draw = () => {
      if (!running) return;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const baseRadius = Math.min(w, h) * 0.35;
      const radius = baseRadius * (0.85 + 0.3 * Math.min(1, loudness));
      const hue = hueFromPitch(pitchHz);

      // Outer rune ring
      ctx.save();
      ctx.translate(cx, cy);

      ctx.strokeStyle = `hsla(${hue}, 90%, 60%, ${listening ? 0.9 : 0.35})`;
      ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.02);
      ctx.shadowColor = `hsla(${hue}, 90%, 60%, 0.6)`;
      ctx.shadowBlur = Math.min(w, h) * 0.03;

      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Runes (ticks)
      const ticks = 24;
      for (let i = 0; i < ticks; i++) {
        const a = (i / ticks) * Math.PI * 2 + (Date.now() * 0.001);
        const r1 = radius * 0.9;
        const r2 = radius * 0.98;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
        ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
        ctx.stroke();
      }

      // Inner bar graph (12 bars)
      const bars = 12;
      for (let i = 0; i < bars; i++) {
        const a = (i / bars) * Math.PI * 2;
        const mag = Math.pow(loudness, 0.6) * (0.5 + 0.5 * Math.sin(Date.now() * 0.003 + i));
        const r1 = radius * 0.4;
        const r2 = r1 + mag * radius * 0.4;
        ctx.strokeStyle = `hsla(${hue}, 90%, ${50 + 10 * mag}%, ${0.8})`;
        ctx.lineWidth = Math.max(1.5, Math.min(w, h) * 0.01);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
        ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
        ctx.stroke();
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [loudness, pitchHz, listening]);

  return (
    <div className="relative w-full h-48 rounded-lg border bg-card/60 backdrop-blur">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center space-y-1">
          <div className="text-xs text-muted-foreground">
            {listening ? "Mic active – speak clearly" : "Mic idle"}
          </div>
          {/* FIXED: Throttled updates to prevent lag */}
          {listening && loudness > 0.1 && (
            <div className="text-xs text-muted-foreground/80">
              Voice: {Math.round(loudness * 100)}%
              {pitchHz && pitchHz > 100 && ` • ${Math.round(pitchHz)}Hz`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MicVisualizer;
