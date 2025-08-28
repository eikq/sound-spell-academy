import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Zap, Volume2, Settings } from "lucide-react";

interface DebugPanelProps {
  autoMode: boolean;
  listening: boolean;
  autoListening: boolean;
  micEnabled: boolean;
  currentScene: string;
  playerMana: number;
  botMana: number;
  lastDetection?: any;
  onToggleAutoMode: () => void;
  onTestCast: () => void;
}

export default function DebugPanel({
  autoMode,
  listening,
  autoListening,
  micEnabled,
  currentScene,
  playerMana,
  botMana,
  lastDetection,
  onToggleAutoMode,
  onTestCast
}: DebugPanelProps) {
  return (
    <div className="fixed top-4 left-4 z-50 w-64">
      <Card className="bg-card/90 backdrop-blur-sm border shadow-lg">
        <CardContent className="p-4 space-y-3">
          <div className="text-sm font-medium text-primary">Debug Panel</div>
          
          {/* Status Indicators */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Scene:</span>
              <Badge variant="outline">{currentScene}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Mic Enabled:</span>
              <Badge variant={micEnabled ? "default" : "secondary"}>
                {micEnabled ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Auto Mode:</span>
              <Badge variant={autoMode ? "default" : "secondary"}>
                {autoMode ? "ON" : "OFF"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Manual Listening:</span>
              <Badge variant={listening ? "default" : "secondary"}>
                {listening ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Auto Listening:</span>
              <Badge variant={autoListening ? "default" : "secondary"}>
                {autoListening ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Player Mana:</span>
              <span className="font-mono">{playerMana}</span>
            </div>
            <div className="flex justify-between">
              <span>Bot Mana:</span>
              <span className="font-mono">{botMana}</span>
            </div>
          </div>

          {/* Last Detection */}
          {lastDetection && (
            <div className="text-xs space-y-1">
              <div className="font-medium">Last Detection:</div>
              <div className="bg-muted/50 p-2 rounded text-xs">
                <div>Spell: {lastDetection.spell?.displayName}</div>
                <div>Said: "{lastDetection.result?.transcript}"</div>
                <div>Accuracy: {Math.round(lastDetection.result?.accuracy || 0)}%</div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="space-y-2">
            <Button 
              size="sm" 
              variant={autoMode ? "destructive" : "default"}
              onClick={onToggleAutoMode}
              className="w-full"
            >
              {autoMode ? "Disable" : "Enable"} Auto-Cast
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={onTestCast}
              className="w-full"
            >
              Test Manual Cast
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}