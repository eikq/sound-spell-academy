import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Player } from "@/types/game";
import { Volume2, VolumeX, Mic, MicOff, Pause, Settings, Zap, Shield } from "lucide-react";
import MicVisualizer from "./MicVisualizer";

interface MatchHUDProps {
  player: Player;
  opponent: Player;
  isListening: boolean;
  loudness: number;
  pitchHz?: number;
  onPause: () => void;
  onMicToggle: () => void;
  onVoiceToggle: () => void;
  micEnabled: boolean;
  voiceEnabled: boolean;
  vsBot?: boolean;
}

export default function MatchHUD({ 
  player, 
  opponent, 
  isListening, 
  loudness, 
  pitchHz,
  onPause, 
  onMicToggle, 
  onVoiceToggle,
  micEnabled,
  voiceEnabled,
  vsBot = false
}: MatchHUDProps) {
  const [connectionState, setConnectionState] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');

  return (
    <div className="absolute top-0 left-0 right-0 p-4 z-20">
      {/* Top HUD Bar */}
      <div className="flex justify-between items-start mb-4">
        {/* Player Info */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="text-sm font-medium text-primary glow-text">{player.nick}</div>
              <div className="flex items-center space-x-2">
                <div className="text-xs text-red-400">HP</div>
                <Progress value={player.hp} className="w-20 h-2 hp-bar" />
                <div className="text-xs font-mono font-bold">{player.hp}</div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-xs text-blue-400">MP</div>
                <Progress value={player.mana} className="w-16 h-2 mana-bar" />
                <div className="text-xs font-mono font-bold">{player.mana}</div>
              </div>
              {player.combo > 0 && (
                <Badge variant="secondary" className="animate-pulse-glow">
                  <Zap className="w-3 h-3 mr-1" />
                  Combo x{player.combo}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMicToggle}
            className={`${micEnabled ? 'text-green-400 hover:text-green-300' : 'text-red-400 hover:text-red-300'} transition-colors`}
            data-event="mic_toggle"
          >
            {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </Button>
          
          {!vsBot && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onVoiceToggle}
              className={`${voiceEnabled ? 'text-green-400 hover:text-green-300' : 'text-red-400 hover:text-red-300'} transition-colors`}
              data-event="voice_toggle"
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onPause}
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-event="match_pause"
          >
            <Pause className="w-4 h-4" />
          </Button>
        </div>

        {/* Opponent Info */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="text-sm font-medium">
                {opponent.nick}
                {vsBot && <Badge variant="outline" className="ml-2 border-orange-500 text-orange-400">AI</Badge>}
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-xs text-red-400">HP</div>
                <Progress value={opponent.hp} className="w-20 h-2 hp-bar" />
                <div className="text-xs font-mono font-bold">{opponent.hp}</div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-xs text-blue-400">MP</div>
                <Progress value={opponent.mana} className="w-16 h-2 mana-bar" />
                <div className="text-xs font-mono font-bold">{opponent.mana}</div>
              </div>
              {opponent.combo > 0 && (
                <Badge variant="secondary" className="animate-pulse-glow">
                  <Shield className="w-3 h-3 mr-1" />
                  Combo x{opponent.combo}
                </Badge>
              )}
              
              {/* Connection indicator */}
              <div className={`w-2 h-2 rounded-full ${
                opponent.connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
              }`} />
              
              {!vsBot && opponent.micActive && (
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" 
                     title="Opponent is speaking" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Mic Visualizer */}
      <div className="flex justify-center mb-4">
        <Card className="glass-card">
          <CardContent className="p-3">
            <MicVisualizer 
              loudness={loudness} 
              pitchHz={pitchHz} 
              listening={isListening}
            />
            {/* Voice status indicator */}
            <div className="mt-2 text-center">
              <div className={`text-xs ${isListening ? 'text-green-400' : 'text-muted-foreground'}`}>
                {isListening ? 'Listening for spells...' : 'Voice inactive'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connection Status */}
      {connectionState !== 'connected' && (
        <div className="flex justify-center animate-fade-in">
          <Card className="bg-yellow-500/10 border-yellow-500/20 glass-card">
            <CardContent className="p-3">
              <div className="text-sm text-yellow-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                {connectionState === 'reconnecting' ? 'Reconnecting...' : 'Connection lost'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}