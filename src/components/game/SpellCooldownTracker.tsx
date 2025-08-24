import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spell } from "@/game/spells/data";
import { Clock, Zap, Target, Activity } from "lucide-react";

interface SpellCooldownTrackerProps {
  recentCasts: Array<{
    spell: Spell;
    timestamp: number;
    accuracy: number;
  }>;
  cooldownMs?: number;
}

export default function SpellCooldownTracker({ 
  recentCasts, 
  cooldownMs = 1200 
}: SpellCooldownTrackerProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, []);

  const activeCooldowns = recentCasts
    .filter(cast => (now - cast.timestamp) < cooldownMs)
    .slice(-3); // Show last 3 casts

  if (activeCooldowns.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="p-3">
          <div className="text-center text-muted-foreground text-sm">
            <Activity className="w-4 h-4 mx-auto mb-1" />
            Ready to cast
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground mb-2 text-center">Recent Casts</div>
        <div className="space-y-2">
          {activeCooldowns.map((cast, index) => {
            const elapsed = now - cast.timestamp;
            const remaining = Math.max(0, cooldownMs - elapsed);
            const progress = (elapsed / cooldownMs) * 100;
            
            return (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{cast.spell.displayName}</span>
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      <span>{Math.round(cast.accuracy)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1 mt-1">
                    <div 
                      className="h-1 rounded-full bg-primary transition-all duration-100"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                </div>
                {remaining > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {(remaining / 1000).toFixed(1)}s
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}