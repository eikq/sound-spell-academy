import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatchResult } from "@/types/game";
import { Trophy, Target, Clock, Zap, RotateCcw, Home } from "lucide-react";

interface ResultsScreenProps {
  result: MatchResult;
  onPlayAgain: () => void;
  onMainMenu: () => void;
  castHistory: Array<{
    spell: { displayName: string; element: string };
    accuracy: number;
    power: number;
    timestamp: number;
  }>;
  vsBot?: boolean;
}

export default function ResultsScreen({ 
  result, 
  onPlayAgain, 
  onMainMenu, 
  castHistory,
  vsBot = false 
}: ResultsScreenProps) {
  const isVictory = result.winner === 'player';
  
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className={`mx-auto mb-4 p-4 rounded-full ${
            isVictory ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
          }`}>
            <Trophy className="w-12 h-12" />
          </div>
          
          <CardTitle className={`text-3xl ${
            isVictory ? 'text-green-500' : 'text-red-500'
          }`}>
            {isVictory ? 'Victory!' : 'Defeat'}
          </CardTitle>
          
          <CardDescription>
            {isVictory 
              ? vsBot 
                ? 'You have bested the AI opponent!'
                : 'Your pronunciation mastery proved superior!'
              : vsBot
                ? 'The AI opponent proved too challenging this time.'
                : 'Your opponent\'s spells were more powerful.'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Match Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{Math.round(result.accuracy)}%</div>
                <div className="text-sm text-muted-foreground">Avg Accuracy</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Zap className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold">{result.totalCasts}</div>
                <div className="text-sm text-muted-foreground">Spells Cast</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{formatTime(result.matchDuration)}</div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </CardContent>
            </Card>
          </div>

          {/* Cast History */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Recent Spells</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {castHistory.slice(-5).reverse().map((cast, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full`} style={{
                      background: cast.spell.element === 'fire' ? '#ef4444' :
                                 cast.spell.element === 'ice' ? '#3b82f6' :
                                 cast.spell.element === 'lightning' ? '#eab308' :
                                 cast.spell.element === 'shadow' ? '#8b5cf6' :
                                 cast.spell.element === 'nature' ? '#22c55e' : '#06b6d4'
                    }} />
                    <span className="font-medium">{cast.spell.displayName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={cast.accuracy >= 80 ? 'default' : cast.accuracy >= 60 ? 'secondary' : 'outline'}>
                      {Math.round(cast.accuracy)}%
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(cast.power * 100)}% power
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              onClick={onPlayAgain} 
              className="flex-1"
              data-event="result_play_again"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
            
            <Button 
              onClick={onMainMenu} 
              variant="outline" 
              className="flex-1"
              data-event="result_main_menu"
            >
              <Home className="w-4 h-4 mr-2" />
              Main Menu
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}