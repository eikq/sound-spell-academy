import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Settings, Home, RotateCcw } from "lucide-react";

interface PauseMenuProps {
  onResume: () => void;
  onSettings: () => void;
  onQuit: () => void;
  onRestart?: () => void;
  vsBot?: boolean;
}

export default function PauseMenu({ onResume, onSettings, onQuit, onRestart, vsBot }: PauseMenuProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Game Paused</CardTitle>
          <CardDescription>
            {vsBot ? "The bot will wait for you" : "Your opponent has been notified"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <Button 
            onClick={onResume} 
            className="w-full" 
            size="lg"
            data-event="pause_resume"
          >
            <Play className="w-4 h-4 mr-2" />
            Resume
          </Button>
          
          {vsBot && onRestart && (
            <Button 
              onClick={onRestart} 
              variant="outline" 
              className="w-full"
              data-event="pause_restart"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Restart Match
            </Button>
          )}
          
          <Button 
            onClick={onSettings} 
            variant="outline" 
            className="w-full"
            data-event="pause_settings"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          
          <Button 
            onClick={onQuit} 
            variant="destructive" 
            className="w-full"
            data-event="pause_quit"
          >
            <Home className="w-4 h-4 mr-2" />
            Quit to Menu
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}