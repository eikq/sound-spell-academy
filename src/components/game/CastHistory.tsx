import React from "react";
import { Spell } from "@/game/spells/data";

interface CastHistoryEntry {
  spell: Spell;
  accuracy: number;
  power: number;
  timestamp: number;
}

interface CastHistoryProps {
  history: CastHistoryEntry[];
}

const CastHistory: React.FC<CastHistoryProps> = ({ history }) => {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground">Recent Casts</div>
      <div className="space-y-1">
        {history.slice(-3).reverse().map((entry, i) => (
          <div key={entry.timestamp} className="flex items-center justify-between text-xs p-2 rounded bg-muted/50">
            <span className="font-medium">{entry.spell.displayName}</span>
            <div className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 rounded ${
                entry.accuracy >= 90 ? 'bg-green-500/20 text-green-400' :
                entry.accuracy >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {Math.round(entry.accuracy)}%
              </span>
              <span className="text-muted-foreground">
                {Math.round(entry.power * 100)}%
              </span>
            </div>
          </div>
        ))}
        {history.length === 0 && (
          <div className="text-xs text-muted-foreground italic">No spells cast yet</div>
        )}
      </div>
    </div>
  );
};

export default CastHistory;