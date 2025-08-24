import { Spell } from "@/game/spells/data";

export interface ComboData {
  count: number;
  multiplier: number;
  lastSpellElement?: string;
  lastCastTime: number;
  streak: Spell[];
}

export interface ElementalReaction {
  name: string;
  elements: [string, string];
  effect: string;
  damageMultiplier: number;
  description: string;
}

export const ELEMENTAL_REACTIONS: ElementalReaction[] = [
  {
    name: "Overload",
    elements: ["fire", "lightning"],
    effect: "explosive_damage",
    damageMultiplier: 1.5,
    description: "Fire + Lightning creates explosive damage"
  },
  {
    name: "Steam",
    elements: ["fire", "ice"],
    effect: "steam_cloud",
    damageMultiplier: 1.3,
    description: "Fire + Ice creates obscuring steam"
  },
  {
    name: "Superconductor",
    elements: ["ice", "lightning"],
    effect: "chain_lightning",
    damageMultiplier: 1.4,
    description: "Ice + Lightning creates chain lightning"
  },
  {
    name: "Wither",
    elements: ["shadow", "nature"],
    effect: "damage_over_time",
    damageMultiplier: 1.2,
    description: "Shadow + Nature creates withering damage"
  },
  {
    name: "Arcane Fusion",
    elements: ["arcane", "fire"],
    effect: "piercing_damage",
    damageMultiplier: 1.6,
    description: "Arcane + Any element creates piercing energy"
  }
];

export class ComboSystem {
  private static readonly COMBO_DECAY_TIME = 3000; // 3 seconds
  private static readonly MAX_COMBO = 10;

  static updateCombo(
    currentCombo: ComboData,
    newSpell: Spell,
    accuracy: number
  ): ComboData {
    const now = Date.now();
    const timeSinceLastCast = now - currentCombo.lastCastTime;
    
    // Reset combo if too much time has passed or accuracy is too low
    if (timeSinceLastCast > this.COMBO_DECAY_TIME || accuracy < 70) {
      return {
        count: 1,
        multiplier: 1,
        lastSpellElement: newSpell.element,
        lastCastTime: now,
        streak: [newSpell]
      };
    }

    // Increase combo
    const newCount = Math.min(currentCombo.count + 1, this.MAX_COMBO);
    const newMultiplier = 1 + (newCount - 1) * 0.1; // 10% per combo level
    
    return {
      count: newCount,
      multiplier: newMultiplier,
      lastSpellElement: newSpell.element,
      lastCastTime: now,
      streak: [...currentCombo.streak.slice(-4), newSpell] // Keep last 5 spells
    };
  }

  static checkElementalReaction(
    lastElement: string | undefined,
    currentElement: string
  ): ElementalReaction | null {
    if (!lastElement || lastElement === currentElement) return null;

    return ELEMENTAL_REACTIONS.find(reaction =>
      (reaction.elements[0] === lastElement && reaction.elements[1] === currentElement) ||
      (reaction.elements[1] === lastElement && reaction.elements[0] === currentElement) ||
      (reaction.elements.includes("arcane") && 
       (lastElement === "arcane" || currentElement === "arcane"))
    ) || null;
  }

  static calculateDamage(
    baseDamage: number,
    combo: ComboData,
    reaction: ElementalReaction | null,
    accuracy: number,
    power: number
  ): {
    finalDamage: number;
    comboDamage: number;
    reactionDamage: number;
    totalMultiplier: number;
  } {
    const accuracyMultiplier = accuracy / 100;
    const comboMultiplier = combo.multiplier;
    const reactionMultiplier = reaction?.damageMultiplier || 1;
    
    const totalMultiplier = accuracyMultiplier * comboMultiplier * reactionMultiplier;
    const finalDamage = Math.round(baseDamage * power * totalMultiplier);
    
    return {
      finalDamage,
      comboDamage: Math.round(baseDamage * power * (comboMultiplier - 1)),
      reactionDamage: reaction ? Math.round(baseDamage * power * (reactionMultiplier - 1)) : 0,
      totalMultiplier
    };
  }
}