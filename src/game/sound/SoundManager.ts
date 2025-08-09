// Minimal temp synth SFX using WebAudio with ADSR and slight pitch jitter
export type ADSR = { attack: number; decay: number; sustain: number; release: number };

const defaultADSR: ADSR = { attack: 0.02, decay: 0.08, sustain: 0.6, release: 0.2 };

const elementBaseFreq: Record<string, number> = {
  fire: 220,
  ice: 330,
  lightning: 440,
  shadow: 180,
  nature: 262,
  arcane: 392,
};

let audioCtx: AudioContext | null = null;
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return audioCtx!;
}

export function playOneShot({
  element,
  power = 0.7,
  chargeTier = 0,
  adsr = defaultADSR,
  type = "sine",
}: {
  element: keyof typeof elementBaseFreq;
  power?: number; // 0..1
  chargeTier?: 0 | 1 | 2;
  adsr?: ADSR;
  type?: OscillatorType;
}) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const base = elementBaseFreq[element] || 300;

    const jitter = (Math.random() * 0.06 - 0.03) * base; // ±3%
    osc.frequency.value = base + jitter + chargeTier * 30;
    osc.type = type;

    const now = ctx.currentTime;
    const peak = Math.max(0.05, Math.min(1, power));

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + adsr.attack);
    gain.gain.linearRampToValueAtTime(peak * adsr.sustain, now + adsr.attack + adsr.decay);
    gain.gain.setValueAtTime(peak * adsr.sustain, now + adsr.attack + adsr.decay + 0.05);
    gain.gain.linearRampToValueAtTime(0.0001, now + adsr.attack + adsr.decay + 0.05 + adsr.release);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + adsr.attack + adsr.decay + 0.05 + adsr.release + 0.02);
  } catch (e) {
    // no-op
    console.warn("Sound error", e);
  }
}

export const SoundManager = {
  cast(element: keyof typeof elementBaseFreq, power: number, chargeTier: 0 | 1 | 2) {
    playOneShot({ element, power, chargeTier, type: element === "lightning" ? "triangle" : "sine" });
  },
  impact(element: keyof typeof elementBaseFreq, power: number) {
    playOneShot({ element, power: Math.min(1, power + 0.2), type: "square" });
  },
};
