
// Enhanced WebAudio SFX with ADSR, pitch modulation, and layered effects
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

const elementWaveforms: Record<string, OscillatorType> = {
  fire: "sawtooth",
  ice: "sine",
  lightning: "square",
  shadow: "triangle",
  nature: "sine",
  arcane: "triangle",
};

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3; // Master volume
    masterGain.connect(audioCtx.destination);
  }
  return { ctx: audioCtx!, master: masterGain! };
}

function createReverb(ctx: AudioContext, roomSize: number = 0.3, decay: number = 2) {
  const convolver = ctx.createConvolver();
  const length = ctx.sampleRate * decay;
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const n = length - i;
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(n / length, roomSize);
    }
  }
  
  convolver.buffer = impulse;
  return convolver;
}

export function playLayeredSound({
  element,
  power = 0.7,
  chargeTier = 0,
  adsr = defaultADSR,
  layers = 1,
  reverb = false,
}: {
  element: keyof typeof elementBaseFreq;
  power?: number;
  chargeTier?: 0 | 1 | 2;
  adsr?: ADSR;
  layers?: number;
  reverb?: boolean;
}) {
  try {
    const { ctx, master } = getCtx();
    const base = elementBaseFreq[element] || 300;
    const waveform = elementWaveforms[element] || "sine";
    
    const layerGain = ctx.createGain();
    layerGain.gain.value = Math.max(0.05, Math.min(0.8, power)) / layers;
    
    // Add reverb if requested
    if (reverb) {
      const reverbNode = createReverb(ctx, 0.4, 1.5);
      const dryGain = ctx.createGain();
      const wetGain = ctx.createGain();
      
      dryGain.gain.value = 0.7;
      wetGain.gain.value = 0.3;
      
      layerGain.connect(dryGain);
      layerGain.connect(reverbNode);
      reverbNode.connect(wetGain);
      
      dryGain.connect(master);
      wetGain.connect(master);
    } else {
      layerGain.connect(master);
    }

    const now = ctx.currentTime;
    const totalDuration = adsr.attack + adsr.decay + 0.1 + adsr.release;

    for (let layer = 0; layer < layers; layer++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      // Layer frequency variations
      const freqMultiplier = layer === 0 ? 1 : (layer === 1 ? 0.5 : 2);
      const jitter = (Math.random() * 0.08 - 0.04) * base; // ±4%
      const chargeBonus = chargeTier * 40;
      const finalFreq = (base * freqMultiplier) + jitter + chargeBonus;
      
      osc.frequency.value = finalFreq;
      osc.type = waveform;
      
      // Enhanced ADSR envelope
      const peak = Math.max(0.1, power * (layer === 0 ? 1 : 0.6));
      gain.gain.setValueAtTime(0, now);
      gain.gain.exponentialRampToValueAtTime(peak, now + adsr.attack);
      gain.gain.exponentialRampToValueAtTime(peak * adsr.sustain, now + adsr.attack + adsr.decay);
      gain.gain.setValueAtTime(peak * adsr.sustain, now + adsr.attack + adsr.decay + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + totalDuration);

      // Add subtle frequency modulation for magic feel
      if (element === "arcane" || element === "shadow") {
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 4 + Math.random() * 3; // 4-7 Hz
        lfoGain.gain.value = finalFreq * 0.02; // 2% modulation
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(now);
        lfo.stop(now + totalDuration);
      }

      osc.connect(gain);
      gain.connect(layerGain);
      
      osc.start(now);
      osc.stop(now + totalDuration);
    }
  } catch (e) {
    console.warn("Sound error:", e);
  }
}

export const SoundManager = {
  setVolume(sfxVolume: number, musicVolume: number) {
    if (masterGain) {
      masterGain.gain.value = sfxVolume * 0.3; // Scale to reasonable level
    }
  },
  
  cast(element: keyof typeof elementBaseFreq, power: number, chargeTier: 0 | 1 | 2) {
    playLayeredSound({ 
      element, 
      power, 
      chargeTier, 
      layers: 2,
      reverb: true,
      adsr: { attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.3 }
    });
  },
  
  impact(element: keyof typeof elementBaseFreq, power: number) {
    playLayeredSound({ 
      element, 
      power: Math.min(1, power + 0.3), 
      layers: 3,
      reverb: true,
      adsr: { attack: 0.01, decay: 0.15, sustain: 0.4, release: 0.4 }
    });
  },
  
  castStart(element: keyof typeof elementBaseFreq) {
    playLayeredSound({ 
      element, 
      power: 0.5, 
      layers: 1,
      adsr: { attack: 0.05, decay: 0.1, sustain: 0.3, release: 0.2 }
    });
  },
  
  castRelease(element: keyof typeof elementBaseFreq, power: number) {
    playLayeredSound({ 
      element, 
      power: Math.min(1, 0.6 + power * 0.8), 
      layers: 2,
      reverb: element === "arcane" || element === "shadow",
      adsr: { attack: 0.02, decay: 0.12, sustain: 0.5, release: 0.3 }
    });
  },
  
  combo(elements: (keyof typeof elementBaseFreq)[], power: number) {
    // Play layered combo sound
    elements.forEach((element, index) => {
      setTimeout(() => {
        playLayeredSound({
          element,
          power: power * (1 - index * 0.2),
          layers: 3,
          reverb: true,
          adsr: { attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.4 }
        });
      }, index * 50);
    });
  }
};
