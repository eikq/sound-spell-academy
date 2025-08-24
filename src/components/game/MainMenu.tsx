import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GameScene } from "@/types/game";
import { Play, BookOpen, Settings, HelpCircle, LogOut } from "lucide-react";

interface MainMenuProps {
  onSceneChange: (scene: GameScene) => void;
  onShowSettings: () => void;
  onShowHelp: () => void;
}

export default function MainMenu({ onSceneChange, onShowSettings, onShowHelp }: MainMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const menuItems = [
    {
      icon: Play,
      title: "Play",
      description: "Challenge others online or practice with bots",
      onClick: () => onSceneChange('menu_play'),
      dataEvent: "menu_play"
    },
    {
      icon: BookOpen,
      title: "Practice",
      description: "Master spells in safe training environment",
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-hero">
      {/* Animated background sigils */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 opacity-10 animate-pulse">
          <div className="w-full h-full rounded-full border-2 border-primary"></div>
        </div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 opacity-10 animate-pulse" style={{ animationDelay: '1s' }}>
          <div className="w-full h-full rounded-full border-2 border-brand"></div>
        </div>
      </div>

      <header className="text-center mb-12 z-10">
        <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-hero">
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
              className={`group cursor-pointer transition-all duration-200 hover:scale-105 ${
                selectedIndex === index ? 'ring-2 ring-primary' : ''
              }`}
              onClick={item.onClick}
              data-event={item.dataEvent}
              onMouseEnter={() => setSelectedIndex(index)}
              style={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)' }}
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">{item.title}</CardTitle>
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