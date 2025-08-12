import type { Element } from "@/game/spells/data";

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
  return [1, 1.15, 1.35][tier];
}

// Elemental weakness multipliers (subset based on existing elements)
export function elementalMultiplier(attacker: Element, defender: Element): number {
  // Fire > Nature; Nature > Lightning; Ice dampens Fire slightly
  if (attacker === "fire" && defender === "nature") return 1.3;
  if (attacker === "nature" && defender === "lightning") return 1.25;
  if (attacker === "ice" && defender === "fire") return 1.1; // damp overheat
  // Arcane neutral but pierces 20% resist -> modeled as slight +0.1 bonus
  if (attacker === "arcane") return 1.1;
  return 1.0;
}

export type ComboId =
  | "inferno-cyclone"
  | "thunderstorm-surge"
  | "hail-tempest"
  | "blooming-torrent"
  | "aether-lance"
  | "umbral-shatter"
  | "magma-burst"
  | "overload-rebound"
  | "sanctified-vines"
  | "perfect-sigil"
  | null;

export function resolveCombo(prev: Element | null, current: Element, accuracy01: number, withinWindow: boolean): ComboId {
  if (!withinWindow || !prev) {
    // Special: Arcane + Any with >=95% accuracy triggers Perfect Sigil regardless
    if (current === "arcane" && accuracy01 >= 0.95) return "perfect-sigil";
    return null;
  }
  const a = prev;
  const b = current;
  if ((a === "shadow" && b === "ice") || (a === "ice" && b === "shadow")) return "umbral-shatter";
  if ((a === "arcane" || b === "arcane") && (accuracy01 >= 0.95)) return "perfect-sigil";
  // Other combos involve elements not yet present – placeholders for future
  return null;
}
