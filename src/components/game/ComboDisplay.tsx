import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ComboData, ELEMENTAL_REACTIONS } from "@/game/combat/ComboSystem";
import { Zap, Flame, Snowflake, Bolt, Skull, Leaf, Star, Crown } from "lucide-react";

interface ComboDisplayProps {
  combo: ComboData;
  className?: string;
}

const ELEMENT_ICONS = {
  fire: Flame,
  ice: Snowflake, 
  lightning: Bolt,
  shadow: Skull,
  nature: Leaf,
  arcane: Star
};

const ELEMENT_COLORS = {
  fire: "text-red-400",
  ice: "text-blue-400",
  lightning: "text-purple-400", 
  shadow: "text-gray-400",
  nature: "text-green-400",
  arcane: "text-cyan-400"
};

export default function ComboDisplay({ combo, className = "" }: ComboDisplayProps) {
  if (combo.count <= 1) {
    return null;
  }

  const lastElement = combo.lastSpellElement;
  const ElementIcon = lastElement ? ELEMENT_ICONS[lastElement as keyof typeof ELEMENT_ICONS] : Zap;
  const elementColor = lastElement ? ELEMENT_COLORS[lastElement as keyof typeof ELEMENT_COLORS] : "text-primary";

  // Check if player might get a reaction on next cast
  const possibleReactions = ELEMENTAL_REACTIONS.filter(reaction => 
    lastElement && (
      reaction.elements.includes(lastElement) || 
      reaction.elements.includes("arcane")
    )
  );

  return (
    <Card className={`glass-card animate-pulse-glow ${className}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            <div>
              <div className="text-lg font-bold text-primary">
                Combo x{combo.count}
              </div>
              <div className="text-xs text-muted-foreground">
                +{Math.round((combo.multiplier - 1) * 100)}% damage
              </div>
            </div>
          </div>
          
          {lastElement && (
            <div className="flex items-center gap-1">
              <ElementIcon className={`w-4 h-4 ${elementColor}`} />
              <span className="text-xs capitalize">{lastElement}</span>
            </div>
          )}
        </div>
        
        {/* Recent spell streak */}
        <div className="mt-2 flex gap-1">
          {combo.streak.slice(-5).map((spell, index) => {
            const Icon = ELEMENT_ICONS[spell.element as keyof typeof ELEMENT_ICONS];
            const color = ELEMENT_COLORS[spell.element as keyof typeof ELEMENT_COLORS];
            return (
              <div 
                key={index}
                className={`w-6 h-6 rounded-full bg-background/50 flex items-center justify-center ${
                  index === combo.streak.length - 1 ? 'ring-2 ring-primary' : ''
                }`}
                title={spell.displayName}
              >
                <Icon className={`w-3 h-3 ${color}`} />
              </div>
            );
          })}
        </div>
        
        {/* Possible reactions hint */}
        {possibleReactions.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            Next reaction: {possibleReactions[0].name}
          </div>
        )}
      </CardContent>
    </Card>
  );
}