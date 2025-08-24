import { BotConfig } from '@/types/game';
import { Spell, Element } from '@/game/spells/data';
import spellsData from '@/game/spells/data';

export class BotOpponent {
  private config: BotConfig;
  private lastCastTime: number = 0;
  private hp: number = 100;
  private mana: number = 100;
  private isActive: boolean = false;
  private castCallback?: (spell: Spell, accuracy: number, power: number) => void;
  private intervalId?: number;
  
  constructor(config: BotConfig) {
    this.config = config;
  }
  
  start(onCast: (spell: Spell, accuracy: number, power: number) => void) {
    this.isActive = true;
    this.castCallback = onCast;
    this.scheduleNextCast();
  }
  
  stop() {
    this.isActive = false;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
    }
  }
  
  takeDamage(damage: number) {
    this.hp = Math.max(0, this.hp - damage);
    return this.hp;
  }
  
  getHP() {
    return this.hp;
  }
  
  private scheduleNextCast() {
    if (!this.isActive) return;
    
    const [minInterval, maxInterval] = this.config.castInterval;
    const interval = minInterval + Math.random() * (maxInterval - minInterval);
    
    this.intervalId = setTimeout(() => {
      this.castSpell();
      this.scheduleNextCast();
    }, interval) as any;
  }
  
  private castSpell() {
    if (!this.isActive || !this.castCallback) return;
    
    const now = Date.now();
    
    // Respect global cooldown
    if (now - this.lastCastTime < 1000) return;
    
    // Select random spell with some intelligence
    const spell = this.selectSpell();
    if (!spell) return;
    
    // Generate bot accuracy within configured range
    const [minAcc, maxAcc] = this.config.accuracy;
    const accuracy = minAcc + Math.random() * (maxAcc - minAcc);
    
    // Add some randomness to power calculation
    const loudness = 0.6 + Math.random() * 0.4; // 0.6-1.0
    const power = Math.min(1.0, 0.75 * accuracy + 0.25 * loudness);
    
    this.lastCastTime = now;
    this.castCallback(spell, Math.round(accuracy * 100), power);
  }
  
  private selectSpell(): Spell | null {
    // Filter spells by difficulty and preference
    let availableSpells = spellsData.filter(spell => {
      if (this.config.difficulty === 'easy') {
        return spell.difficulty <= 2;
      } else if (this.config.difficulty === 'medium') {
        return spell.difficulty <= 3;
      } else {
        return spell.difficulty <= 5;
      }
    });
    
    // Prefer offensive spells in combat
    const offensiveSpells = availableSpells.filter(spell => 
      spell.basePower > 0 && 
      !['Healing', 'Utility'].includes(spell.category)
    );
    
    // Use healing spells when low on HP
    if (this.hp < 30) {
      const healingSpells = availableSpells.filter(spell => 
        spell.category === 'Healing'
      );
      if (healingSpells.length > 0 && Math.random() < 0.7) {
        return healingSpells[Math.floor(Math.random() * healingSpells.length)];
      }
    }
    
    // Use defensive spells occasionally
    if (Math.random() < 0.2) {
      const defensiveSpells = availableSpells.filter(spell =>
        spell.category === 'Defense'
      );
      if (defensiveSpells.length > 0) {
        return defensiveSpells[Math.floor(Math.random() * defensiveSpells.length)];
      }
    }
    
    // Default to offensive spells
    const spellPool = offensiveSpells.length > 0 ? offensiveSpells : availableSpells;
    return spellPool[Math.floor(Math.random() * spellPool.length)];
  }
  
  // Bot behavior for elemental strategy
  getPreferredCounter(lastPlayerElement?: Element): Element {
    if (!lastPlayerElement) {
      // Random element when no context
      const elements: Element[] = ['fire', 'ice', 'lightning', 'shadow', 'nature', 'arcane'];
      return elements[Math.floor(Math.random() * elements.length)];
    }
    
    // Simple counter logic
    const counters: Record<Element, Element> = {
      fire: 'ice',
      ice: 'fire', 
      lightning: 'shadow',
      shadow: 'lightning',
      nature: 'fire',
      arcane: 'arcane' // Neutral
    };
    
    // Bot doesn't always play perfectly
    if (Math.random() < 0.3) {
      return lastPlayerElement; // Sometimes copy
    }
    
    return counters[lastPlayerElement] || 'arcane';
  }
}