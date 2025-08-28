import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Volume2, CheckCircle, AlertCircle } from "lucide-react";
import type { PronunciationLetters } from "@/hooks/useSpeech";

interface PronunciationFeedbackProps {
  isVisible: boolean;
  onClose: () => void;
  targetSpell: string;
  userSaid: string;
  accuracy: number;
  letters: PronunciationLetters;
  confidence: number;
  didCast: boolean;
}

export default function PronunciationFeedback({ 
  isVisible, 
  onClose, 
  targetSpell, 
  userSaid, 
  accuracy, 
  letters, 
  confidence,
  didCast 
}: PronunciationFeedbackProps) {
  const [autoClose, setAutoClose] = useState(true);

  useEffect(() => {
    if (isVisible && autoClose && didCast) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto-close after 3s if spell cast successfully
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, autoClose, didCast]);

  if (!isVisible) return null;

  const getAccuracyColor = (acc: number) => {
    if (acc >= 70) return "text-green-400";
    if (acc >= 50) return "text-yellow-400";
    if (acc >= 30) return "text-orange-400";
    return "text-red-400";
  };

  const getAccuracyLabel = (acc: number) => {
    if (acc >= 70) return "Excellent!";
    if (acc >= 50) return "Good";
    if (acc >= 30) return "Fair";
    return "Keep trying!";
  };

  return (
    <div className="fixed top-20 right-4 z-50 w-80 animate-fade-in">
      <Card className="bg-card/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              {didCast ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Spell Cast!
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  Pronunciation Help
                </>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Target vs Spoken */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Target spell:</div>
            <div className="font-mono text-sm bg-muted/50 p-2 rounded">
              {targetSpell}
            </div>
            
            <div className="text-xs text-muted-foreground">You said:</div>
            <div className="font-mono text-sm bg-muted/50 p-2 rounded">
              {userSaid || "(nothing detected)"}
            </div>
          </div>

          {/* Letter-by-letter feedback */}
          {letters.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Pronunciation breakdown:</div>
              <div className="flex flex-wrap gap-1 p-2 bg-muted/30 rounded">
                {letters.map((letter, index) => (
                  <span
                    key={index}
                    className={`px-1 py-0.5 rounded text-xs font-mono ${
                      letter.correct 
                        ? "bg-green-500/20 text-green-400" 
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {letter.char}
                  </span>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="text-green-400">■</span> Correct pronunciation  
                <span className="ml-3 text-red-400">■</span> Needs work
              </div>
            </div>
          )}

          {/* Accuracy & Confidence */}
          <div className="flex gap-3">
            <Badge variant="outline" className="flex-1">
              <div className="text-center w-full">
                <div className={`font-bold ${getAccuracyColor(accuracy)}`}>
                  {Math.round(accuracy)}%
                </div>
                <div className="text-xs">Accuracy</div>
              </div>
            </Badge>
            <Badge variant="outline" className="flex-1">
              <div className="text-center w-full">
                <div className={`font-bold ${confidence > 0.5 ? "text-green-400" : confidence > 0.3 ? "text-yellow-400" : "text-red-400"}`}>
                  {Math.round(confidence * 100)}%
                </div>
                <div className="text-xs">Confidence</div>
              </div>
            </Badge>
          </div>

          {/* Status & Tips */}
          <div className={`p-3 rounded-lg ${didCast ? "bg-green-500/10 border border-green-500/20" : "bg-yellow-500/10 border border-yellow-500/20"}`}>
            <div className={`font-medium text-sm ${didCast ? "text-green-400" : "text-yellow-400"}`}>
              {didCast ? "✨ Spell successfully cast!" : getAccuracyLabel(accuracy)}
            </div>
            
            {!didCast && (
              <div className="text-xs text-muted-foreground mt-1">
                {accuracy < 30 
                  ? "Try speaking more clearly and closer to your microphone"
                  : accuracy < 50
                  ? "Good attempt! Try emphasizing each syllable"
                  : "Very close! The spell will cast with lower accuracy"
                }
              </div>
            )}

            {didCast && accuracy < 60 && (
              <div className="text-xs text-green-300 mt-1">
                💡 Spell cast successfully despite low accuracy! Keep practicing for more powerful casts.
              </div>
            )}
          </div>

          {/* Tips for improvement */}
          {!didCast && userSaid && (
            <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded">
              <div className="font-medium mb-1">💡 Pronunciation tips:</div>
              <div>• Speak clearly and at normal speed</div>
              <div>• Try breaking the spell into syllables</div>
              <div>• Make sure your microphone can hear you clearly</div>
              <div>• Even partial matches can cast spells!</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}