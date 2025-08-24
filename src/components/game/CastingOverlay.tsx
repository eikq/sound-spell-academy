import React from "react";
import { Spell } from "@/game/spells/data";
import { Progress } from "@/components/ui/progress";

interface CastingOverlayProps {
  isCasting: boolean;
  spell?: Spell;
  progress?: number;
  cooldowns: Record<string, { remaining: number; total: number }>;
}

const CastingOverlay: React.FC<CastingOverlayProps> = ({ 
  isCasting, 
  spell, 
  progress = 0,
  cooldowns 
}) => {
  if (!isCasting && Object.keys(cooldowns).length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* NEW: QoL - Casting animation */}
      {isCasting && (
        <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm border-2 border-primary/30 rounded-lg animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-primary mb-2">
                Casting {spell?.displayName || "Spell"}...
              </div>
              <Progress value={progress} className="w-32" />
            </div>
          </div>
        </div>
      )}

      {/* NEW: QoL - Cooldown indicators */}
      {Object.entries(cooldowns).map(([spellId, cooldown]) => {
        const percentage = ((cooldown.total - cooldown.remaining) / cooldown.total) * 100;
        return (
          <div
            key={spellId}
            className="absolute top-2 left-2 w-8 h-8 rounded-full border-2 border-muted-foreground/30"
            style={{
              background: `conic-gradient(from 0deg, hsl(var(--primary)) ${percentage}%, transparent ${percentage}%)`
            }}
          >
            <div className="absolute inset-1 bg-background rounded-full flex items-center justify-center">
              <div className="text-xs font-bold text-muted-foreground">
                {Math.ceil(cooldown.remaining / 1000)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CastingOverlay;