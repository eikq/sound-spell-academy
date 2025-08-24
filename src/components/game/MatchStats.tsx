import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spell } from "@/game/spells/data";
import { Zap, Trophy, Target, Clock, Star } from "lucide-react";

interface MatchStatsProps {
  castHistory: Array<{
    spell: Spell;
    accuracy: number;
    power: number;
    timestamp: number;
  }>;
  matchDuration?: number;
  playerHP: number;
  opponentHP: number;
}

export default function MatchStats({ 
  castHistory, 
  matchDuration = 0, 
  playerHP, 
  opponentHP 
}: MatchStatsProps) {
  const [stats, setStats] = useState({
    totalCasts: 0,
    avgAccuracy: 0,
    bestAccuracy: 0,
    totalDamage: 0,
    castsPerMinute: 0,
    perfectCasts: 0
  });

  useEffect(() => {
    if (castHistory.length === 0) return;

    const totalCasts = castHistory.length;
    const accuracies = castHistory.map(cast => cast.accuracy);
    const avgAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / totalCasts;
    const bestAccuracy = Math.max(...accuracies);
    const perfectCasts = castHistory.filter(cast => cast.accuracy >= 95).length;
    
    const totalDamage = castHistory.reduce((sum, cast) => {
      return sum + Math.round(cast.spell.basePower * cast.power * 15);
    }, 0);
    
    const durationMinutes = matchDuration > 0 ? matchDuration / 60000 : 1;
    const castsPerMinute = totalCasts / durationMinutes;

    setStats({
      totalCasts,
      avgAccuracy: Math.round(avgAccuracy),
      bestAccuracy: Math.round(bestAccuracy),
      totalDamage,
      castsPerMinute: Math.round(castsPerMinute * 10) / 10,
      perfectCasts
    });
  }, [castHistory, matchDuration]);

  if (castHistory.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Cast some spells to see your stats!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return "text-green-400";
    if (accuracy >= 75) return "text-yellow-400";
    return "text-red-400";
  };

  const getRank = () => {
    if (stats.avgAccuracy >= 90 && stats.perfectCasts >= 3) return { name: "Spellmaster", color: "text-purple-400" };
    if (stats.avgAccuracy >= 80) return { name: "Expert", color: "text-blue-400" };
    if (stats.avgAccuracy >= 70) return { name: "Adept", color: "text-green-400" };
    if (stats.avgAccuracy >= 60) return { name: "Apprentice", color: "text-yellow-400" };
    return { name: "Novice", color: "text-gray-400" };
  };

  const rank = getRank();

  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Rank */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className={`w-5 h-5 ${rank.color}`} />
              <span className={`font-bold ${rank.color}`}>{rank.name}</span>
            </div>
            <Badge variant="outline" className="border-primary/20">
              {stats.totalCasts} spells cast
            </Badge>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span>Avg: <span className={getAccuracyColor(stats.avgAccuracy)}>{stats.avgAccuracy}%</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-muted-foreground" />
              <span>Best: <span className={getAccuracyColor(stats.bestAccuracy)}>{stats.bestAccuracy}%</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-muted-foreground" />
              <span>Perfect: <span className="text-green-400">{stats.perfectCasts}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>Rate: <span className="text-primary">{stats.castsPerMinute}/min</span></span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Match Progress</div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(5, Math.min(95, (100 - playerHP) + (100 - opponentHP)))}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}