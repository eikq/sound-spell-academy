import { useRef, useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, VolumeX, Play, Pause, RotateCcw, Settings, Zap } from "lucide-react";
import { SpellGame } from "@/game/SpellGame";
import type { SpellGameRef } from "@/game/SpellGame";
import MicVisualizer from "@/components/game/MicVisualizer";
import spellsData from "@/game/spells/data";
import type { Spell, Element } from "@/game/spells/data";
import { useManaSystem } from "@/hooks/useManaSystem";
import { useAutoSpell, getBestMatch } from "@/hooks/useAutoSpell";
import { useSpeechRecognition } from "@/hooks/useSpeech";
import { useAutoCastGate } from "@/hooks/useAutoCastGate";
import { toast } from "sonner";
import { Settings as SettingsComponent } from "@/components/game/Settings";
import type { GameSettings } from "@/components/game/Settings";
import CastingIndicator from "@/components/game/CastingIndicator";
import QuickCastButton from "@/components/game/QuickCastButton";
import PronunciationFeedback from "@/components/game/PronunciationFeedback";
import DebugPanel from "@/components/game/DebugPanel";
import { PerfHUD } from "@/components/PerfHUD";
import type { VisualProfile } from "@/game/vfx/Profiles";
import { getStoredProfile, setStoredProfile } from "@/game/vfx/Profiles";

const STARTING_MANA = 100;
const MAX_MANA = 150;

const defaultSettings: GameSettings = {
  displayMode: 'canon',
  minAccuracy: 0.25, // Ultra-low for easier casting
  minConfidence: 0.2, // Ultra-low for easier casting 
  hotwordMode: false,
  audioGain: 1.0,
  visualEffects: true,
  autoRestartRecognition: true
};

const GameController = () => {
  const gameRef = useRef<SpellGameRef>(null);
  const [activeTab, setActiveTab] = useState("practice");
  const [isGameActive, setIsGameActive] = useState(false);
  const [playerMana, setPlayerMana] = useState(STARTING_MANA);
  const [opponentMana, setOpponentMana] = useState(STARTING_MANA);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [opponentHealth, setOpponentHealth] = useState(100);
  const [autoMode, setAutoMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPerfHUD, setShowPerfHUD] = useState(false);
  const [visualProfile, setVisualProfile] = useState<VisualProfile>(getStoredProfile());
  const modeRef = useRef<"practice" | "duel">("practice");
  const [gameSettings, setGameSettings] = useState<GameSettings>(() => {
    try {
      const stored = localStorage.getItem('gameSettings');
      return stored ? JSON.parse(stored) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  // Player Mana System
  const playerManaSystem = useManaSystem({
    currentMana: playerMana,
    maxMana: MAX_MANA,
    onManaChange: setPlayerMana,
    regenRate: 3,
    enabled: true
  });

  // Opponent Mana System (for bot fights)
  const opponentManaSystem = useManaSystem({
    currentMana: opponentMana,
    maxMana: MAX_MANA,
    onManaChange: setOpponentMana,
    regenRate: 2.5,
    enabled: isGameActive
  });

  // Auto-cast gate system
  const { tryCast } = useAutoCastGate({
    cooldownMs: 1200,
    debounceMs: 300,
    rearmMs: 1500,
    minAccuracy: gameSettings.minAccuracy,
    minConfidence: gameSettings.minConfidence
  });

  // Auto-cast system
  const { 
    listening: autoListening, 
    lastDetected, 
    start: startAuto, 
    stop: stopAuto,
    error: autoError 
  } = useAutoSpell(spellsData, {
    minAccuracy: gameSettings.minAccuracy,
    minConfidence: gameSettings.minConfidence
  });

  // Manual speech recognition for practice
  const { 
    listening: manualListening, 
    start: startManual, 
    stop: stopManual, 
    result: manualResult,
    error: manualError,
    loudness: manualLoudness
  } = useSpeechRecognition();

  // Update mode reference
  useEffect(() => {
    modeRef.current = activeTab as "practice" | "duel";
  }, [activeTab]);

  // Auto-cast with gate system
  useEffect(() => {
    if (!autoMode || !lastDetected) return;

    const { spell, result, power } = lastDetected;
    const best = {
      spellId: spell.id,
      element: spell.element,
      accuracy: result.accuracy / 100,
      confidence: result.confidence,
      chargeTier: (result.loudness > 0.7 ? 2 : result.loudness > 0.4 ? 1 : 0) as 0|1|2,
      power
    };

    tryCast(modeRef.current, result, best, () => {
      const manaCost = 10 + (spell.difficulty * 5);
      if (playerManaSystem.consumeMana(manaCost)) {
        gameRef.current?.castSpell(spell.element as Element, power, "player");
        toast.success(`Cast ${spell.displayName}! (Power: ${Math.round(power * 100)}%)`);
      } else {
        toast.error("Not enough mana!");
      }
    });
  }, [lastDetected, autoMode, tryCast, playerManaSystem]);

  // Auto mode toggle handler
  const handleAutoToggle = async () => {
    console.log("Auto mode toggle:", !autoMode);
    
    if (!autoMode) {
      try {
        await startAuto();
        setAutoMode(true);
        toast.success("Voice casting enabled! Try saying spell names.");
      } catch (error: any) {
        console.error("Failed to start auto mode:", error);
        toast.error(error.message || "Failed to start voice recognition");
      }
    } else {
      stopAuto();
      setAutoMode(false);
      toast.info("Voice casting disabled");
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        setShowPerfHUD(prev => !prev);
      } else if (e.key === 'F10') {
        e.preventDefault();
        const profiles: VisualProfile[] = ["low", "medium", "high", "ultra"];
        const currentIndex = profiles.indexOf(visualProfile);
        const nextIndex = Math.max(0, currentIndex - 1);
        const newProfile = profiles[nextIndex];
        setVisualProfile(newProfile);
        setStoredProfile(newProfile);
        // Visual profile will be handled by SpellGame internally
      } else if (e.key === 'F11') {
        e.preventDefault();
        const profiles: VisualProfile[] = ["low", "medium", "high", "ultra"];
        const currentIndex = profiles.indexOf(visualProfile);
        const nextIndex = Math.min(profiles.length - 1, currentIndex + 1);
        const newProfile = profiles[nextIndex];
        setVisualProfile(newProfile);
        setStoredProfile(newProfile);
        // Visual profile will be handled by SpellGame internally
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visualProfile]);

  const handleProfileChange = (profile: VisualProfile) => {
    setVisualProfile(profile);
    setStoredProfile(profile);
    // Visual profile will be handled by SpellGame internally
  };

  // Bot fighting system
  const botIntervalRef = useRef<NodeJS.Timeout>();
  
  const startBotFight = () => {
    setIsGameActive(true);
    setOpponentHealth(100);
    setOpponentMana(MAX_MANA);
    
    // Bot casts spell every 3-5 seconds
    botIntervalRef.current = setInterval(() => {
      if (opponentHealth <= 0 || playerHealth <= 0) return;
      
      const randomSpell = spellsData[Math.floor(Math.random() * spellsData.length)];
      const manaCost = 10 + (randomSpell.difficulty * 5);
      
      if (opponentManaSystem.consumeMana(manaCost)) {
        gameRef.current?.castSpell(randomSpell.element as Element, 0.8, "enemy");
        const damage = Math.floor(15 + Math.random() * 20);
        setPlayerHealth(prev => Math.max(0, prev - damage));
        toast.info(`Bot casts ${randomSpell.displayName}! (-${damage} HP)`);
      }
    }, 3000 + Math.random() * 2000);
  };

  const stopBotFight = () => {
    setIsGameActive(false);
    if (botIntervalRef.current) {
      clearInterval(botIntervalRef.current);
      botIntervalRef.current = undefined;
    }
  };

  // Game state management
  const resetGame = () => {
    setPlayerHealth(100);
    setPlayerMana(STARTING_MANA);
    setOpponentHealth(100);
    setOpponentMana(STARTING_MANA);
    stopBotFight();
  };

  const handleQuickCast = (spell: Spell) => {
    const manaCost = 10 + (spell.difficulty * 5);
    if (playerManaSystem.consumeMana(manaCost)) {
      gameRef.current?.castSpell(spell.element as Element, 0.8, "player");
      toast.success(`Cast ${spell.displayName}!`);
      
      if (isGameActive) {
        const damage = Math.floor(spell.basePower * 20);
        setOpponentHealth(prev => Math.max(0, prev - damage));
      }
    } else {
      toast.error("Not enough mana!");
    }
  };

  const handleSettingsChange = (newSettings: GameSettings) => {
    setGameSettings(newSettings);
    localStorage.setItem('gameSettings', JSON.stringify(newSettings));
    setShowSettings(false);
    toast.success("Settings saved!");
  };

  const commonSpells = useMemo(() => 
    spellsData.filter(spell => spell.difficulty <= 2).slice(0, 6)
  , []);

  const renderQuickCastButtons = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
      {commonSpells.map((spell) => (
        <QuickCastButton
          key={spell.id}
          spell={spell}
          onCast={handleQuickCast}
          disabled={!playerManaSystem.canCast(10 + spell.difficulty * 5)}
          manaCost={10 + spell.difficulty * 5}
          currentMana={playerMana}
        />
      ))}
    </div>
  );

  // Start auto-cast automatically when entering bot match
  useEffect(() => {
    if (activeTab === "duel" && isGameActive && !autoMode) {
      console.log("Auto-starting voice for duel mode");
      handleAutoToggle();
    }
  }, [activeTab, isGameActive]);

  // Auto-start for practice mode when toggled on
  useEffect(() => {
    if (activeTab === "practice" && autoMode && !autoListening) {
      console.log("Ensuring auto-cast is running for practice mode");
      startAuto();
    }
  }, [activeTab, autoMode, autoListening]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto p-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Arcane Diction</h1>
          <p className="text-slate-300">Cast spells with perfect pronunciation</p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="practice">Practice Mode</TabsTrigger>
            <TabsTrigger value="duel">Duel Mode</TabsTrigger>
          </TabsList>

          <TabsContent value="practice" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>Practice Arena</span>
                  {autoMode && <Badge variant="secondary">Voice Active</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SpellGame ref={gameRef} />
                
                <div className="mt-4 flex flex-wrap gap-3 items-center">
                  <Button
                    onClick={handleAutoToggle}
                    variant={autoMode ? "default" : "outline"}
                    className="flex items-center gap-2"
                  >
                    {autoMode ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    {autoMode ? "Voice: ON" : "Voice: OFF"}
                  </Button>
                  
                  <Button variant="outline" onClick={() => setShowSettings(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  
                  <div className="text-sm text-muted-foreground">
                    Mana: {playerMana}/{MAX_MANA}
                  </div>
                </div>

                {renderQuickCastButtons()}
                
                <div className="mt-4">
                  <MicVisualizer 
                    listening={autoListening || manualListening}
                    loudness={autoMode ? autoListening ? 1 : 0 : manualLoudness}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="duel" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Player</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Health:</span>
                      <span className="text-red-500 font-bold">{playerHealth}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mana:</span>
                      <span className="text-blue-500 font-bold">{playerMana}/{MAX_MANA}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Opponent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Health:</span>
                      <span className="text-red-500 font-bold">{opponentHealth}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mana:</span>
                      <span className="text-blue-500 font-bold">{opponentMana}/{MAX_MANA}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>Battle Arena</span>
                  {isGameActive && <Badge variant="destructive">Active Battle</Badge>}
                  {autoMode && <Badge variant="secondary">Voice Active</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SpellGame ref={gameRef} />
                
                <div className="mt-4 flex flex-wrap gap-3 items-center">
                  {!isGameActive ? (
                    <Button onClick={startBotFight} className="flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      Start Bot Fight
                    </Button>
                  ) : (
                    <Button onClick={stopBotFight} variant="destructive" className="flex items-center gap-2">
                      <Pause className="h-4 w-4" />
                      Stop Fight
                    </Button>
                  )}
                  
                  <Button onClick={resetGame} variant="outline" className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                  
                  <Button
                    onClick={handleAutoToggle}
                    variant={autoMode ? "default" : "outline"}
                    className="flex items-center gap-2"
                  >
                    {autoMode ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    {autoMode ? "Voice: ON" : "Voice: OFF"}
                  </Button>
                </div>

                {renderQuickCastButtons()}
                
                <div className="mt-4">
                  <MicVisualizer 
                    listening={autoListening || manualListening}
                    loudness={autoMode ? autoListening ? 1 : 0 : manualLoudness}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Casting Indicator */}
        <CastingIndicator 
          isListening={autoListening || manualListening}
          autoMode={autoMode}
          micEnabled={true}
          lastSpellCast={lastDetected?.spell?.displayName || ""}
          loudness={autoMode ? (autoListening ? 1 : 0) : manualLoudness}
        />

        {/* Debug Panel (Development only) */}
        {process.env.NODE_ENV === 'development' && (
          <DebugPanel
            autoMode={autoMode}
            listening={manualListening}
            autoListening={autoListening}
            micEnabled={true}
            currentScene={activeTab}
            playerMana={playerMana}
            botMana={opponentMana}
            lastDetection={lastDetected}
            onToggleAutoMode={handleAutoToggle}
            onTestCast={() => {
              if (spellsData[0]) {
                handleQuickCast(spellsData[0]);
              }
            }}
          />
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsComponent
          settings={gameSettings}
          onSettingsChange={handleSettingsChange}
        >
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </SettingsComponent>
      )}

      <PerfHUD 
        visible={showPerfHUD} 
        onProfileChange={handleProfileChange}
      />
    </div>
  );
};

export default GameController;