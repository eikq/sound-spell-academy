import type { Element } from '@/game/spells/data';

export type ChargeTier = 0 | 1 | 2; // 0: none, 1: >=50%, 2: >=85%

export function chargeTierFromLoudness(loudness: number): ChargeTier {
  if (loudness >= 0.85) return 2;
  if (loudness >= 0.5) return 1;
  return 0;
}

export function chainMultiplier(stacks: number): number {
  // stacks: 0..3 -> 1, 1.1, 1.2, 1.35
  return [1, 1.1, 1.2, 1.35][Math.max(0, Math.min(3, stacks))];
}

export function chargeMultiplier(tier: ChargeTier): number {
  switch (tier) {
    case 2: return 1.35;
    case 1: return 1.15;
    default: return 1.0;
  }
}

export function elementalMultiplier(element: Element): number {
  switch (element) {
    case 'fire': return 1.05;
    case 'ice': return 0.95;
    case 'lightning': return 1.1;
    case 'shadow': return 1.0;
    case 'nature': return 1.0;
    case 'arcane': return 1.15;
    default: return 1.0;
  }
}

export type ComboId =
  | 'inferno-cyclone'      // fire -> lightning
  | 'hail-tempest'         // ice -> shadow
  | 'blooming-torrent'     // nature -> fire
  | 'aether-lance'         // arcane -> lightning
  | null;

export function resolveCombo(prev: Element | null, current: Element): ComboId {
  if (!prev) return null;
  const key = `${prev}->${current}`;
  switch (key) {
    case 'fire->lightning': return 'inferno-cyclone';
    case 'ice->shadow': return 'hail-tempest';
    case 'nature->fire': return 'blooming-torrent';
    case 'arcane->lightning': return 'aether-lance';
    default: return null;
  }
}
