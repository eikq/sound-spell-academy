import { BotConfig } from '@/types/game';
import { Spell, Element } from '@/game/spells/data';
import spellsData from '@/game/spells/data';

export class BotOpponent {
  private config: BotConfig;
  private isActive: boolean = false;
  private mana: number = 100;
  private hp: number = 100;
  private castCallback?: (spell: Spell, accuracy: number, power: number) => void;
  private nextCastTimeout?: NodeJS.Timeout;
  private manaRegenInterval?: NodeJS.Timeout;
  private lastCastTime: number = 0;
  
  constructor(config: BotConfig) {
    this.config = {
      difficulty: config.difficulty || 'medium',
      accuracy: config.accuracy || [0.75, 0.95],
      castInterval: config.castInterval || [1200, 2500] // 1.2-2.5 seconds
    };
    
    console.log(`🤖 Bot created with difficulty: ${this.config.difficulty}`);
  }
  
  start(onCast: (spell: Spell, accuracy: number, power: number) => void) {
    if (this.isActive) {
      console.log("⚠️ Bot already active");
      return;
    }
    
    console.log("🚀 Starting bot opponent...");
    this.isActive = true;
    this.castCallback = onCast;
    this.mana = 100;
    this.hp = 100;
    this.lastCastTime = Date.now();
    
    // Start mana regeneration (10 mana per second)
    this.startManaRegen();
    
    // Schedule first cast
    this.scheduleNextCast();
    
    console.log("✅ Bot opponent started");
  }
  
  stop() {
    console.log("🛑 Stopping bot opponent...");
    this.isActive = false;
    this.castCallback = undefined;
    
    if (this.nextCastTimeout) {
      clearTimeout(this.nextCastTimeout);
      this.nextCastTimeout = undefined;
    }
    
    if (this.manaRegenInterval) {
      clearInterval(this.manaRegenInterval);
      this.manaRegenInterval = undefined;
    }
    
    console.log("✅ Bot opponent stopped");
  }
  
  takeDamage(damage: number): number {
    this.hp = Math.max(0, this.hp - damage);
    console.log(`🤖 Bot takes ${damage} damage, HP: ${this.hp}`);
    return this.hp;
  }
  
  getHP(): number {
    return this.hp;
  }
  
  getMana(): number {
    return this.mana;
  }
  
  private startManaRegen() {
    if (this.manaRegenInterval) {
      clearInterval(this.manaRegenInterval);
    }
    
    // Regenerate mana every 100ms (10 mana per second)
    this.manaRegenInterval = setInterval(() => {
      if (!this.isActive) return;
      
      if (this.mana < 100) {
        this.mana = Math.min(100, this.mana + 1); // 1 mana per 100ms = 10 per second
      }
    }, 100);
  }
  
  private scheduleNextCast() {
    if (!this.isActive) return;
    
    const [minInterval, maxInterval] = this.config.castInterval;
    const interval = minInterval + Math.random() * (maxInterval - minInterval);
    
    console.log(`🤖 Next cast scheduled in ${(interval/1000).toFixed(1)}s`);
    
    this.nextCastTimeout = setTimeout(() => {
      if (this.isActive) {
        this.attemptCast();
        this.scheduleNextCast(); // Schedule next cast
      }
    }, interval);
  }
  
  private attemptCast() {
    if (!this.isActive || !this.castCallback) {
      console.log("🤖 Cannot cast - bot inactive or no callback");
      return;
    }
    
    const now = Date.now();
    
    // Global cooldown check
    if (now - this.lastCastTime < 800) {
      console.log("🤖 Bot in global cooldown, skipping cast");
      return;
    }
    
    // Select a spell to cast
    const spell = this.selectSpell();
    if (!spell) {
      console.log("🤖 No available spells to cast");
      return;
    }
    
    // Check if bot has enough mana
    if (this.mana < spell.manaCost) {
      console.log(`🤖 Insufficient mana for ${spell.displayName}: need ${spell.manaCost}, have ${this.mana}`);
      return;
    }
    
    // Consume mana
    this.mana = Math.max(0, this.mana - spell.manaCost);
    
    // Generate accuracy within configured range
    const [minAcc, maxAcc] = this.config.accuracy;
    const accuracy = Math.floor(minAcc * 100 + Math.random() * (maxAcc - minAcc) * 100);
    
    // Calculate power (0.6 to 1.0)
    const power = 0.6 + Math.random() * 0.4;
    
    this.lastCastTime = now;
    
    console.log(`🤖 Bot casts ${spell.displayName}! Accuracy: ${accuracy}%, Power: ${power.toFixed(2)}, Mana: ${this.mana}`);
    
    // Execute the cast
    this.castCallback(spell, accuracy, power);
  }
  
  private selectSpell(): Spell | null {
    // Filter spells by mana cost and difficulty
    let availableSpells = spellsData.filter(spell => {
      // Must have enough mana
      if (spell.manaCost > this.mana) return false;
      
      // Filter by difficulty
      switch (this.config.difficulty) {
        case 'easy':
          return spell.difficulty <= 2;
        case 'medium':
          return spell.difficulty <= 3;
        case 'hard':
          return spell.difficulty <= 5;
        default:
          return true;
      }
    });
    
    if (availableSpells.length === 0) {
      console.log("🤖 No spells available for bot difficulty/mana");
      return null;
    }
    
    // Strategy selection
    
    // 1. Use healing if low on HP (30% chance when HP < 40)
    if (this.hp < 40 && Math.random() < 0.3) {
      const healingSpells = availableSpells.filter(spell => 
        spell.category === 'Healing' || spell.displayName.toLowerCase().includes('heal')
      );
      if (healingSpells.length > 0) {
        console.log("🤖 Bot choosing healing spell");
        return healingSpells[Math.floor(Math.random() * healingSpells.length)];
      }
    }
    
    // 2. Prefer offensive spells (80% of the time)
    if (Math.random() < 0.8) {
      const offensiveSpells = availableSpells.filter(spell => 
        spell.basePower > 0 && 
        !['Healing', 'Utility'].includes(spell.category)
      );
      if (offensiveSpells.length > 0) {
        return offensiveSpells[Math.floor(Math.random() * offensiveSpells.length)];
      }
    }
    
    // 3. Use defensive spells occasionally (10% chance)
    if (Math.random() < 0.1) {
      const defensiveSpells = availableSpells.filter(spell =>
        spell.category === 'Defense' || spell.displayName.toLowerCase().includes('shield')
      );
      if (defensiveSpells.length > 0) {
        console.log("🤖 Bot choosing defensive spell");
        return defensiveSpells[Math.floor(Math.random() * defensiveSpells.length)];
      }
    }
    
    // 4. Default to random available spell
    return availableSpells[Math.floor(Math.random() * availableSpells.length)];
  }
  
  // Get preferred counter element (for advanced strategy)
  getPreferredCounter(lastPlayerElement?: Element): Element {
    if (!lastPlayerElement) {
      const elements: Element[] = ['fire', 'ice', 'lightning', 'shadow', 'nature', 'arcane'];
      return elements[Math.floor(Math.random() * elements.length)];
    }
    
    // Simple counter system
    const counters: Record<Element, Element> = {
      fire: 'ice',
      ice: 'fire',
      lightning: 'shadow',
      shadow: 'lightning',
      nature: 'fire',
      arcane: 'arcane'
    };
    
    // Bot strategy: 60% counter, 20% same element, 20% random
    const rand = Math.random();
    if (rand < 0.6) {
      return counters[lastPlayerElement] || 'arcane';
    } else if (rand < 0.8) {
      return lastPlayerElement; // Copy player
    } else {
      const elements: Element[] = ['fire', 'ice', 'lightning', 'shadow', 'nature', 'arcane'];
      return elements[Math.floor(Math.random() * elements.length)];
    }
  }
}