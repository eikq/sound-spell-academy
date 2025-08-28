import React from "react";
import { Button } from "@/components/ui/button";
import { Zap, Flame, Snowflake, Bolt, Moon, Leaf, Sparkles } from "lucide-react";
import { Spell } from "@/game/spells/data";

interface QuickCastButtonProps {
  spell: Spell;
  onCast: (spell: Spell) => void;
  disabled?: boolean;
  manaCost: number;
  currentMana: number;
}

const elementIcons = {
  fire: Flame,
  ice: Snowflake,
  lightning: Bolt,
  shadow: Moon,
  nature: Leaf,
  arcane: Sparkles,
};

export default function QuickCastButton({ 
  spell, 
  onCast, 
  disabled, 
  manaCost, 
  currentMana 
}: QuickCastButtonProps) {
  const IconComponent = elementIcons[spell.element as keyof typeof elementIcons] || Zap;
  const canAfford = currentMana >= manaCost;

  return (
    <Button
      variant={canAfford ? "default" : "outline"}
      size="sm"
      onClick={() => onCast(spell)}
      disabled={disabled || !canAfford}
      className={`
        min-w-[120px] transition-all duration-200 
        ${canAfford 
          ? 'bg-gradient-to-r from-primary/80 to-primary hover:from-primary hover:to-primary/80 shadow-lg' 
          : 'opacity-50 cursor-not-allowed'
        }
      `}
      data-event="quick_cast"
      data-spell={spell.id}
    >
      <IconComponent className="w-4 h-4 mr-2" />
      <div className="flex flex-col items-start text-xs">
        <span className="font-medium">{spell.displayName}</span>
        <span className="text-xs opacity-75">{manaCost} MP</span>
      </div>
    </Button>
  );
}