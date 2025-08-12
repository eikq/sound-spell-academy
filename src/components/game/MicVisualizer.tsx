import React, { useEffect, useRef } from 'react';

interface MicVisualizerProps {
  loudness: number; // 0..1
  pitchHz?: number | null; // ~80..400 typical
  listening?: boolean;
}

function hueFromPitch(pitch?: number | null) {
  if (!pitch || pitch <= 0) return 190;
  const min = 80;
  const max = 400;
  const clamped = Math.max(min, Math.min(max, pitch));
  const t = (clamped - min) / (max - min);
  return 190 + (35 - 190) * t;
}

const MicVisualizer: React.FC<MicVisualizerProps> = ({ loudness, pitchHz, listening }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;
    const dpr = window.devicePixelRatio || 1;
    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    const bars = 48;
    const draw = () => {
      if (!running) return;
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const hue = hueFromPitch(pitchHz);
      const base = Math.max(0, Math.min(1, loudness));
      ctx.fillStyle = `hsla(${hue}, 80%, 20%, ${listening ? 0.25 : 0.1})`;
      ctx.fillRect(0, 0, rect.width, rect.height);

      const barW = rect.width / bars;
      for (let i = 0; i < bars; i++) {
        const t = i / (bars - 1);
        const amp = base * (0.6 + 0.4 * Math.sin((t + base) * Math.PI));
        const h = amp * rect.height * 0.8;
        const x = i * barW;
        const y = rect.height - h;
        ctx.fillStyle = `hsla(${hue}, 90%, ${40 + 20 * Math.sin(t * Math.PI)}%, ${0.6 + 0.35 * base})`;
        ctx.fillRect(x + 2, y, barW - 4, h);
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [loudness, pitchHz, listening]);

  return (
    <div className="relative w-full h-48 rounded-lg border bg-card/60 backdrop-blur">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-xs text-muted-foreground">
          {listening ? 'Mic active – speak clearly' : 'Mic idle'}
        </div>
      </div>
    </div>
  );
};

export default MicVisualizer;
