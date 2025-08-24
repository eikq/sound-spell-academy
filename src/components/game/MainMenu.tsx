import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GameScene } from "@/types/game";
import { Swords, Target, Settings, HelpCircle, LogOut } from "lucide-react";

interface MainMenuProps {
  onSceneChange: (scene: GameScene) => void;
  onShowSettings: () => void;
  onShowHelp: () => void;
}

export default function MainMenu({ onSceneChange, onShowSettings, onShowHelp }: MainMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const menuItems = [
    {
      icon: Swords,
      title: "Play",
      description: "Enter the arena and face worthy opponents",
      onClick: () => onSceneChange('menu_play'),
      dataEvent: "menu_play"
    },
    {
      icon: Target,
      title: "Practice",
      description: "Hone your magical pronunciation skills",
      onClick: () => onSceneChange('practice'),
      dataEvent: "menu_practice"
    },
    {
      icon: Settings,
      title: "Settings",
      description: "Customize your magical experience",
      onClick: onShowSettings,
      dataEvent: "menu_settings"
    },
    {
      icon: HelpCircle,
      title: "How to Play",
      description: "Learn the ancient art of voice spellcasting",
      onClick: onShowHelp,
      dataEvent: "menu_help"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Animated background sigils */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 opacity-10 animate-float">
          <div className="w-full h-full rounded-full border-2 border-primary"></div>
        </div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 opacity-10 animate-float" style={{ animationDelay: '1s' }}>
          <div className="w-full h-full rounded-full border-2 border-primary"></div>
        </div>
      </div>

      <header className="text-center mb-12 z-10">
        <h1 className="text-5xl md:text-7xl font-bold mb-4 glow-text">
          Arcane Diction
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
          Master the ancient art of spellcasting through perfect pronunciation
        </p>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full z-10">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card 
              key={item.title}
              className={`glass-card hover-scale group cursor-pointer ${
                selectedIndex === index ? 'ring-2 ring-primary animate-pulse-glow' : ''
              }`}
              onClick={item.onClick}
              data-event={item.dataEvent}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-6 rounded-full bg-gradient-to-br from-primary/20 to-purple-600/20 group-hover:from-primary/30 group-hover:to-purple-600/30 transition-all animate-pulse-glow">
                  <Icon className="w-12 h-12 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-2xl glow-text">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </main>

      {/* Keyboard navigation hint */}
      <footer className="mt-8 text-sm text-muted-foreground z-10">
        Use ↑↓ or ←→ to navigate • Enter to select • ESC to exit
      </footer>
    </div>
  );
}