import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Zap, Volume2 } from "lucide-react";

interface CastingIndicatorProps {
  isListening: boolean;
  autoMode: boolean;
  micEnabled: boolean;
  lastSpellCast?: string;
  loudness: number;
}

export default function CastingIndicator({ 
  isListening, 
  autoMode, 
  micEnabled, 
  lastSpellCast, 
  loudness 
}: CastingIndicatorProps) {
  const [showSpellFeedback, setShowSpellFeedback] = useState(false);

  // Show spell feedback briefly when a spell is cast
  useEffect(() => {
    if (lastSpellCast) {
      setShowSpellFeedback(true);
      const timer = setTimeout(() => setShowSpellFeedback(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastSpellCast]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {/* Main Status Badge */}
      <Badge 
        variant={isListening && autoMode ? "default" : "secondary"}
        className={`
          px-3 py-2 text-sm font-medium transition-all duration-300 backdrop-blur-sm
          ${isListening && autoMode 
            ? 'bg-green-500/20 border-green-400/50 text-green-300 shadow-lg shadow-green-500/20' 
            : 'bg-gray-500/20 border-gray-400/50 text-gray-300'
          }
        `}
      >
        <div className="flex items-center gap-2">
          {micEnabled ? (
            <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
          ) : (
            <MicOff className="w-4 h-4" />
          )}
          
          <span>
            {!micEnabled ? 'Mic Off' : 
             autoMode && isListening ? 'Auto-Cast Active' : 
             autoMode ? 'Auto-Cast Ready' : 
             'Manual Mode'}
          </span>
          
          {autoMode && isListening && (
            <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
          )}
        </div>
      </Badge>

      {/* Voice Activity Indicator */}
      {isListening && loudness > 0.1 && (
        <Badge variant="outline" className="bg-blue-500/20 border-blue-400/50 text-blue-300 animate-fade-in">
          <Volume2 className="w-3 h-3 mr-1" />
          Voice: {Math.round(loudness * 100)}%
        </Badge>
      )}

      {/* Last Spell Cast Feedback */}
      {showSpellFeedback && lastSpellCast && (
        <Badge variant="outline" className="bg-purple-500/20 border-purple-400/50 text-purple-300 animate-fade-in">
          <Zap className="w-3 h-3 mr-1" />
          Cast: {lastSpellCast}
        </Badge>
      )}

      {/* User Hint */}
      {autoMode && !isListening && micEnabled && (
        <div className="text-xs text-muted-foreground bg-black/30 backdrop-blur-sm rounded px-2 py-1">
          💡 Just speak any spell name!
        </div>
      )}
    </div>
  );
}