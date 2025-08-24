import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GameScene, BotConfig } from "@/types/game";
import { ArrowLeft, Users, Bot, Share, UserPlus, Zap, Clock, Target } from "lucide-react";
import { toast } from "sonner";

interface PlayMenuProps {
  onSceneChange: (scene: GameScene) => void;
  onStartMatch: (mode: 'quick' | 'code' | 'bot', config?: any) => void;
  isSearching: boolean;
}

export default function PlayMenu({ onSceneChange, onStartMatch, isSearching }: PlayMenuProps) {
  const [roomCode, setRoomCode] = useState("");
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [createdRoomCode, setCreatedRoomCode] = useState("");

  const handleQuickMatch = () => {
    if (isSearching) {
      // Cancel search if already searching
      onStartMatch('cancel' as any);
      return;
    }
    onStartMatch('quick');
  };

  const handleCreateRoom = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCreatedRoomCode(code);
    toast.success("Room created!", { description: `Room code: ${code}` });
  };

  const handleJoinRoom = () => {
    if (!roomCode.trim()) {
      toast.error("Enter a room code");
      return;
    }
    if (roomCode.length !== 6) {
      toast.error("Room code must be 6 characters");
      return;
    }
    onStartMatch('code', { roomCode: roomCode.toUpperCase() });
  };

  const handleBotMatch = () => {
    const botConfig: BotConfig = {
      difficulty: botDifficulty,
      accuracy: botDifficulty === 'easy' ? [0.55, 0.7] : 
                botDifficulty === 'medium' ? [0.65, 0.85] : [0.8, 0.95],
      castInterval: botDifficulty === 'easy' ? [2500, 3200] :
                    botDifficulty === 'medium' ? [1800, 2400] : [1200, 1800]
    };
    onStartMatch('bot', { botConfig });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(createdRoomCode);
    toast.success("Room code copied to clipboard!");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <header className="text-center mb-8">
        <Button 
          variant="ghost" 
          onClick={() => onSceneChange('menu')}
          className="mb-4"
          data-event="menu_back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Main Menu
        </Button>
        <h1 className="text-4xl font-bold mb-2">Choose Your Battle</h1>
        <p className="text-muted-foreground">Select your preferred way to duel</p>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full">
        {/* Quick Match */}
        <Card className="hover-scale glass-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10 animate-pulse-glow">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="glow-text">Quick Match</CardTitle>
            <CardDescription>Find an opponent instantly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleQuickMatch}
              className="w-full"
              data-event="menu_play_quick"
            >
              {isSearching ? "Cancel Search" : "Find Opponent"}
            </Button>
            {isSearching && (
              <div className="text-center text-sm text-muted-foreground">
                <div className="animate-pulse">Looking for worthy adversary...</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Friend Invite */}
        <Card className="hover-scale glass-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Invite Friend</CardTitle>
            <CardDescription>Create or join a private room</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button 
                onClick={handleCreateRoom}
                variant="outline"
                className="w-full"
                data-event="menu_play_create"
              >
                <Share className="w-4 h-4 mr-2" />
                Create Room
              </Button>
              {createdRoomCode && (
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="text-sm text-muted-foreground">Room Code:</div>
                  <div className="font-mono text-lg font-bold">{createdRoomCode}</div>
                  <Button size="sm" variant="ghost" onClick={copyRoomCode}>
                    Copy Code
                  </Button>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="roomCode">Join Room</Label>
              <Input
                id="roomCode"
                placeholder="Enter 6-char code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <Button 
                onClick={handleJoinRoom}
                variant="outline"
                className="w-full"
                data-event="menu_play_join"
              >
                Join Room
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Play vs Bot */}
        <Card className="hover-scale glass-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Play vs Bot</CardTitle>
            <CardDescription>Practice against AI opponent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Difficulty</Label>
              <RadioGroup value={botDifficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setBotDifficulty(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="easy" id="easy" />
                  <Label htmlFor="easy" className="flex items-center">
                    <Target className="w-4 h-4 mr-2 text-green-500" />
                    Easy (55-70% accuracy)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium" className="flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                    Medium (65-85% accuracy)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hard" id="hard" />
                  <Label htmlFor="hard" className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-red-500" />
                    Hard (80-95% accuracy)
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <Button 
              onClick={handleBotMatch}
              className="w-full"
              data-event="menu_play_bot"
            >
              Start Bot Match
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}