export type VisualProfile = "low" | "medium" | "high" | "ultra";

export interface VfxSettings {
  bloom: boolean;
  godray: boolean;
  shockwave: boolean;
  particles: number;      // max particle count
  dprCap: number;         // device pixel ratio clamp (e.g., 1.25, 1.5, 2)
  motionBlur: boolean;
}

export const PROFILES: Record<VisualProfile, VfxSettings> = {
  low:    { bloom:false, godray:false, shockwave:false, particles:150, dprCap:1.0, motionBlur:false },
  medium: { bloom:false, godray:false, shockwave:true,  particles:300, dprCap:1.25, motionBlur:false },
  high:   { bloom:true,  godray:true,  shockwave:true,  particles:450, dprCap:1.5,  motionBlur:true  },
  ultra:  { bloom:true,  godray:true,  shockwave:true,  particles:700, dprCap:2.0,  motionBlur:true  },
};

export function getStoredProfile(): VisualProfile {
  try {
    const stored = localStorage.getItem('vfxProfile') as VisualProfile;
    return (stored && stored in PROFILES) ? stored : 'medium';
  } catch {
    return 'medium';
  }
}

export function setStoredProfile(profile: VisualProfile) {
  try {
    localStorage.setItem('vfxProfile', profile);
  } catch {
    // Ignore storage errors
  }
}

export function getAutoProfile(fps: number): VisualProfile {
  if (fps >= 75) return 'high';
  if (fps >= 45) return 'medium';
  return 'low';
}