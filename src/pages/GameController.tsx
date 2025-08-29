import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { GameScene, MatchResult, Player, Room, BotConfig } from "@/types/game";
import type { GameSettings } from "@/types/game";
import { Spell } from "@/game/spells/data";
import spellsData from "@/game/spells/data";
import { useSpeechRecognition } from "@/hooks/useSpeech";
import { useAutoSpell } from "@/hooks/useAutoSpell";
import { useManaSystem } from "@/hooks/useManaSystem";
import { SpellGame, SpellGameRef } from "@/game/SpellGame";
import { SoundManager } from "@/game/sound/SoundManager";
import { ComboSystem, ComboData, ELEMENTAL_REACTIONS } from "@/game/combat/ComboSystem";
import { resolveCombo } from "@/game/combat/systems";
import { socketClient } from "@/game/multiplayer/SocketClient";
import { BotOpponent } from "@/game/bot/BotOpponent";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Components
import MainMenu from "@/components/game/MainMenu";
import PlayMenu from "@/components/game/PlayMenu";
import GameSettingsModal from "@/components/game/GameSettings";
import HelpModal from "@/components/game/HelpModal";
import MatchHUD from "@/components/game/MatchHUD";
import PauseMenu from "@/components/game/PauseMenu";
import ResultsScreen from "@/components/game/ResultsScreen";
import FeedbackOverlay from "@/components/game/FeedbackOverlay";
import SpellBook from "@/components/game/SpellBook";
import CastHistory from "@/components/game/CastHistory";
import CastingOverlay from "@/components/game/CastingOverlay";
import MicPermissionModal from "@/components/game/MicPermissionModal";
import SpellCooldownTracker from "@/components/game/SpellCooldownTracker";
import ComboDisplay from "@/components/game/ComboDisplay";
import MatchStats from "@/components/game/MatchStats";
import CastingIndicator from "@/components/game/CastingIndicator";
import QuickCastButton from "@/components/game/QuickCastButton";
import PronunciationFeedback from "@/components/game/PronunciationFeedback";
import DebugPanel from "@/components/game/DebugPanel";

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const GameController = () => {
  // Scene management
  const [currentScene, setCurrentScene] = useState<GameScene>('practice'); // Start in practice mode for testing
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [showMicPermission, setShowMicPermission] = useState(false);
  
  // Game state
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(spellsData[0]);
  const [autoMode, setAutoMode] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isCasting, setIsCasting] = useState(false);
  const gameRef = useRef<SpellGameRef>(null);
  
  // Match state
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [player, setPlayer] = useState<Player>({
    id: 'player',
    nick: 'Spellcaster',
    hp: 100,
    mana: 100,
    combo: 0,
    connected: true
  });
  const [opponent, setOpponent] = useState<Player>({
    id: 'opponent',
    nick: 'Worthy Adversary',
    hp: 100,
    mana: 100,
    combo: 0,
    connected: true
  });
  
  // Enhanced game state
  const [playerCombo, setPlayerCombo] = useState<ComboData>({
    count: 0,
    multiplier: 1,
    lastCastTime: 0,
    streak: []
  });
  const [opponentCombo, setOpponentCombo] = useState<ComboData>({
    count: 0,
    multiplier: 1,
    lastCastTime: 0,
    streak: []
  });
  const [vsBot, setVsBot] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  
  // Bot opponent
  const botRef = useRef<BotOpponent | null>(null);
  const [botConfig, setBotConfig] = useState<BotConfig>({
    difficulty: 'medium',
    accuracy: [0.65, 0.85],
    castInterval: [1800, 2400]
  });
  
  // Cast history and spam protection
  const [castHistory, setCastHistory] = useState<Array<{
    spell: Spell;
    accuracy: number;
    power: number;
    timestamp: number;
  }>>([]);
  const [lastCastSpell, setLastCastSpell] = useState<string>(''); // For UI feedback
  
  // Pronunciation feedback state
  const [showPronunciationFeedback, setShowPronunciationFeedback] = useState(false);
  const [pronunciationData, setPronunciationData] = useState<{
    targetSpell: string;
    userSaid: string;
    accuracy: number;
    letters: any[];
    confidence: number;
    didCast: boolean;
  } | null>(null);
  
  // Settings
  const [settings, setSettings] = useState<GameSettings>(() => {
    const saved = localStorage.getItem('arcane-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved settings:', e);
      }
    }
    return {
      language: 'en-US',
      sensitivity: 0.7,
      hotwordMode: false,
      ipSafeMode: false,
      micEnabled: true,
      pushToTalk: false,
      sfxVolume: 0.8,
      musicVolume: 0.6,
      voiceVolume: 0.8,
      highContrast: false,
      fontSize: 100
    };
  });
  
  // Speech recognition and auto-cast  
  const { listening, start, stop, result, error, loudness, pitchHz, micGranted } = useSpeechRecognition();
  const auto = useAutoSpell(spellsData, { minAccuracy: settings.sensitivity * 30, minConfidence: 0.2 }); // Ultra-easy thresholds
  
  // DEBUG: Log spells data on mount
  useEffect(() => {
    console.log(`📚 Loaded ${spellsData.length} spells for auto-cast:`, spellsData.map(s => s.displayName).slice(0, 5));
  }, []);
  
  // Mana system
  const playerMana = useManaSystem({
    currentMana: player.mana,
    maxMana: 100,
    onManaChange: (newMana) => setPlayer(prev => ({ ...prev, mana: Math.round(newMana) })),
    regenRate: 3, // 3 mana per second
    enabled: true
  });
  
  const opponentMana = useManaSystem({
    currentMana: opponent.mana,
    maxMana: 100,
    onManaChange: (newMana) => setOpponent(prev => ({ ...prev, mana: Math.round(newMana) })),
    regenRate: 2.5, // Slightly slower for opponent
    enabled: vsBot
  });
  
  // FIXED: Much more responsive spam protection
  const COOLDOWN_MS = 400;  // Reduced from 800ms for faster casting
  const ECHO_SUPPRESS_MS = 200;  // Reduced from 300ms
  const castGateRef = useRef<{
    lastAt: number;
    lastTranscript: string;
    lastTranscriptAt: number;
    isCasting: boolean;
  }>({
    lastAt: 0,
    lastTranscript: "",
    lastTranscriptAt: 0,
    isCasting: false,
  });

  // CRITICAL FIX: Auto-cast system startup - prevent infinite loops
  const autoModeRef = useRef(autoMode);
  const settingsRef = useRef(settings);
  
  useEffect(() => {
    autoModeRef.current = autoMode;
    settingsRef.current = settings;
  }, [autoMode, settings]);

  useEffect(() => {
    // Only trigger when actually changing auto mode, not on every render
    const shouldStart = autoMode && settings.micEnabled && !auto.listening;
    const shouldStop = (!autoMode || !settings.micEnabled) && auto.listening;
    
    if (shouldStart) {
      console.log("🎤 Starting auto-cast system...");
      auto.start().then(() => {
        console.log("✅ Auto-cast system started successfully");
        if (currentScene === 'practice' || currentScene === 'match') {
          toast.success("🎙️ Auto-cast activated! Speak any spell name!");
        }
      }).catch((err) => {
        console.error("❌ Failed to start auto-cast system:", err);
        setAutoMode(false);
        toast.error(`Auto-cast failed: ${err.message}`);
      });
    } else if (shouldStop) {
      console.log("🔇 Stopping auto-cast system...");
      auto.stop();
    }
  }, [autoMode, settings.micEnabled, currentScene]); // Remove auto.listening to prevent loops
  
  const normalizeKey = (s: string = "") => s.toLowerCase().replace(/[^a-z]/g, "");

  // Scene management with proper cleanup
  const handleSceneChange = (scene: GameScene) => {
    console.log(`🎬 Scene change: ${currentScene} → ${scene}`);
    setCurrentScene(scene);
    
    // Handle auto-cast based on scene
    if (scene === 'practice' || scene === 'match') {
      // Enable auto-cast for active scenes
      if (!autoMode && settings.micEnabled) {
        setAutoMode(true);
      }
    } else {
      // Disable for non-active scenes
      if (autoMode) {
        setAutoMode(false);
      }
      stop();
      auto.stop();
    }
    
    // Reset match state when leaving
    if (scene !== 'match' && currentRoom) {
      endMatch();
    }
  };
  
  // NEW: Matchmaking - Start match flow
  const handleStartMatch = async (mode: 'quick' | 'code' | 'bot' | 'cancel', config?: any) => {
    try {
      if (mode === 'cancel') {
        socketClient.emit('queue:cancel');
        setIsSearching(false);
        toast.info("Search cancelled");
        return;
      }
      
      if (mode === 'bot') {
        startBotMatch(config?.botConfig || botConfig);
      } else {
        setIsSearching(true);
        await socketClient.connect();
        
        socketClient.emit('queue:join', {
          mode,
          roomCode: config?.roomCode,
          nick: player.nick
        });
      }
    } catch (error) {
      toast.error("Failed to start match: " + (error as Error).message);
      setIsSearching(false);
    }
  };
  
  // NEW: Bot Match - Start bot battle
  const startBotMatch = (config: BotConfig) => {
    setBotConfig(config);
    setVsBot(true);
    setOpponent({
      id: 'bot',
      nick: `AI ${config.difficulty.charAt(0).toUpperCase() + config.difficulty.slice(1)}`,
      hp: 100,
      mana: 100,
      combo: 0,
      connected: true
    });
    
    // Create bot opponent
    botRef.current = new BotOpponent(config);
    
    setCurrentScene('match');
    toast.success(`Bot match started! Difficulty: ${config.difficulty}`);
    
    // Auto-enable microphone and auto-cast for matches
    setSettings(prev => ({ ...prev, micEnabled: true }));
    setAutoMode(true);
    
    // Auto-cast will be started by the useEffect above when autoMode is set
    
    // Start bot immediately with proper logging
    if (botRef.current) {
      console.log('🤖 Starting bot opponent...');
      botRef.current.start((spell, accuracy, power) => {
        console.log(`🤖 Bot casts ${spell.displayName} with ${accuracy}% accuracy`);
        handleBotCast(spell, accuracy, power);
      });
      console.log("✅ Bot opponent started successfully");
    }
  };
  
  // Bot match cleanup
  const endMatch = () => {
    console.log("🏁 Ending match...");
    if (botRef.current) {
      botRef.current.stop();
      botRef.current = null;
    }
    setVsBot(false);
    setCurrentRoom(null);
    setMatchResult(null);
    
    // Reset player states
    setPlayer(prev => ({ ...prev, hp: 100, mana: 100, combo: 0 }));
    setOpponent(prev => ({ ...prev, hp: 100, mana: 100, combo: 0 }));
    setCastHistory([]);
    
    // Mana regeneration is controlled by the enabled prop in useManaSystem
  };
  
  // FIXED: Bot casting with proper mana management
  const handleBotCast = (spell: Spell, accuracy: number, power: number) => {
    if (!vsBot || !botRef.current) return;
    
    console.log(`🤖 Bot attempting to cast ${spell.displayName} (need ${spell.manaCost}, have ${opponent.mana})`);
    
    // Check bot mana properly  
    if (opponent.mana < spell.manaCost) {
      console.log(`❌ Bot cannot cast ${spell.displayName} - insufficient mana`);
      return;
    }
    
    // Consume bot mana with proper update
    const newBotMana = Math.max(0, opponent.mana - spell.manaCost);
    setOpponent(prev => ({ ...prev, mana: newBotMana }));
    opponentMana.consumeMana(spell.manaCost);
    
    console.log(`✅ Bot casts ${spell.displayName}! Mana: ${opponent.mana} → ${newBotMana}`);
    
    // Update opponent combo
    const newCombo = ComboSystem.updateCombo(opponentCombo, spell, accuracy);
    setOpponentCombo(newCombo);
    setOpponent(prev => ({ ...prev, combo: newCombo.count }));
    
    // Check for elemental reaction
    const reaction = ComboSystem.checkElementalReaction(opponentCombo.lastSpellElement, spell.element);
    
    // Calculate enhanced damage
    const damageCalc = ComboSystem.calculateDamage(
      spell.basePower * 15,
      newCombo,
      reaction,
      accuracy,
      power
    );
    
    SoundManager.castRelease(spell.element, power);
    gameRef.current?.castSpell(spell.element, power, 'enemy');
    
    // Apply damage to player
    setPlayer(prev => ({
      ...prev,
      hp: Math.max(0, prev.hp - damageCalc.finalDamage)
    }));
    
    // Show reaction feedback
    if (reaction) {
      toast(`💥 ${reaction.name}! ${reaction.description}`, { 
        description: `Combo x${newCombo.count} + ${reaction.name} = ${damageCalc.finalDamage} damage!`
      });
    } else if (newCombo.count > 1) {
      toast(`🔥 Combo x${newCombo.count}!`, { 
        description: `${accuracy}% accuracy, ${damageCalc.finalDamage} damage` 
      });
    } else {
      toast(`Bot casts ${spell.displayName}!`, { 
        description: `${accuracy}% accuracy, ${damageCalc.finalDamage} damage` 
      });
    }
  };
  
  // Match end conditions
  useEffect(() => {
    if (currentScene === 'match') {
      if (player.hp <= 0 || opponent.hp <= 0) {
        const winner = player.hp > 0 ? 'player' : (vsBot ? 'bot' : 'enemy');
        const avgAccuracy = castHistory.length > 0 
          ? castHistory.reduce((sum, cast) => sum + cast.accuracy, 0) / castHistory.length
          : 0;
        
        setMatchResult({
          winner: winner as any,
          accuracy: avgAccuracy,
          totalCasts: castHistory.length,
          matchDuration: Date.now() - (castHistory[0]?.timestamp || Date.now())
        });
        
        // Stop bot
        if (botRef.current) {
          botRef.current.stop();
        }
        
        toast.success(winner === 'player' ? '🎉 Victory!' : '💀 Defeat!');
      }
    }
  }, [player.hp, opponent.hp, currentScene, castHistory, vsBot]);
  
  // Cast spell (manual mode)
  const onCast = async () => {
    if (!selectedSpell || autoMode || !settings.micEnabled) return;
    if (castGateRef.current.isCasting) return;
    
    // Check mana before starting
    if (!playerMana.canCast(selectedSpell.manaCost)) {
      toast.error(`Not enough mana! Need ${selectedSpell.manaCost}, have ${player.mana}`);
      return;
    }
    
    castGateRef.current.isCasting = true;
    setIsCasting(true);
    
    SoundManager.castStart(selectedSpell.element);
    await start(selectedSpell.displayName);
  };
  
  // Handle manual cast results with pronunciation feedback
  useEffect(() => {
    if (!result || !selectedSpell) return;
    
    const now = Date.now();
    const normalizedTranscript = normalizeKey(result.transcript);
    
    // FIX: Spam casting - Echo suppression
    if (normalizedTranscript === castGateRef.current.lastTranscript && 
        (now - castGateRef.current.lastTranscriptAt) < ECHO_SUPPRESS_MS) {
      castGateRef.current.isCasting = false;
      setIsCasting(false);
      return;
    }
    
    castGateRef.current.lastTranscript = normalizedTranscript;
    castGateRef.current.lastTranscriptAt = now;
    castGateRef.current.isCasting = false;
    setIsCasting(false);
    
    const accuracy = result.accuracy / 100;
    const power = clamp01(0.75 * accuracy + 0.25 * result.loudness);
    
    // Show pronunciation feedback regardless of whether spell casts
    const didCast = accuracy >= 0.15; // Cast with very low accuracy!
    setPronunciationData({
      targetSpell: selectedSpell.displayName,
      userSaid: result.transcript,
      accuracy: result.accuracy,
      letters: result.letters,
      confidence: result.confidence,
      didCast
    });
    setShowPronunciationFeedback(true);
    
    if (didCast) {
      handleSpellCast(selectedSpell, result.accuracy, power, 'player');
    }
  }, [result, selectedSpell]);
  
  // ENHANCED Auto-cast detection with better reliability
  useEffect(() => {
    if (!autoMode || !auto.lastDetected) return;
    
    const detection = auto.lastDetected;
    const { spell, power, result, timestamp } = detection;
    const now = Date.now();

    // Prevent duplicate processing
    if (now - timestamp > 5000) return; // Ignore old detections
    
    // Check cooldown to prevent spam casting
    if (now - castGateRef.current.lastAt < COOLDOWN_MS) {
      console.log(`⏳ Auto-cast blocked by cooldown (${COOLDOWN_MS}ms)`);
      return;
    }

    console.log(`🎯 Auto-cast detected: ${spell.displayName} (${Math.round(result.accuracy)}% accuracy, power: ${power.toFixed(2)})`);

    // Show pronunciation feedback for auto-cast
    setPronunciationData({
      targetSpell: spell.displayName,
      userSaid: result.transcript,
      accuracy: result.accuracy,
      letters: result.letters,
      confidence: result.confidence,
      didCast: true
    });
    setShowPronunciationFeedback(true);

    // Cast the spell
    handleSpellCast(spell, result.accuracy, power, 'player');
    castGateRef.current.lastAt = now;
    
    // Update last cast spell for UI feedback
    setLastCastSpell(spell.displayName);
  }, [auto.lastDetected, autoMode, COOLDOWN_MS]);

  // Cancel search when user leaves play menu
  useEffect(() => {
    if (currentScene !== 'menu_play' && isSearching) {
      socketClient.emit('queue:cancel');
      setIsSearching(false);
    }
  }, [currentScene, isSearching]);
  
  // Unified spell casting handler
  const handleSpellCast = (spell: Spell, accuracy: number, power: number, caster: 'player' | 'enemy') => {
    // FIXED: Check mana before casting
    if (!playerMana.canCast(spell.manaCost)) {
      console.log(`Player cannot cast ${spell.displayName} - need ${spell.manaCost}, have ${player.mana}`);
      if (caster === 'player') {
        toast.error(`Not enough mana! Need ${spell.manaCost}, have ${player.mana}`);
      }
      return;
    }
    
    console.log(`${caster} casting ${spell.displayName} (${Math.round(accuracy)}% accuracy, ${spell.manaCost} mana)`);
    
    // FIXED: Consume mana directly for player
    if (caster === 'player') {
      playerMana.consumeMana(spell.manaCost);
    }
    
    SoundManager.castRelease(spell.element, power);
    gameRef.current?.castSpell(spell.element, power, caster);
    
    if (caster === 'player') {
      // Update player combo
      const newCombo = ComboSystem.updateCombo(playerCombo, spell, accuracy);
      setPlayerCombo(newCombo);
      setPlayer(prev => ({ ...prev, combo: newCombo.count }));
      
      // Check for elemental reaction
      const reaction = ComboSystem.checkElementalReaction(playerCombo.lastSpellElement, spell.element);
      
      // Calculate enhanced damage
      const damageCalc = ComboSystem.calculateDamage(
        spell.basePower * 15,
        newCombo,
        reaction,
        accuracy,
        power
      );
      
      // Add to cast history
      setCastHistory(prev => [...prev, {
        spell,
        accuracy,
        power,
        timestamp: Date.now()
      }]);
      
      // Damage opponent
      if (currentScene === 'match') {
        if (vsBot && botRef.current) {
          const newHP = Math.max(0, opponent.hp - damageCalc.finalDamage);
          botRef.current.takeDamage(damageCalc.finalDamage);
          setOpponent(prev => ({ ...prev, hp: newHP }));
        } else {
          setOpponent(prev => ({
            ...prev,
            hp: Math.max(0, prev.hp - damageCalc.finalDamage)
          }));
        }
        
        // Show enhanced feedback
        if (reaction) {
          toast.success(`💥 ${reaction.name}! ${spell.displayName}`, { 
            description: `Combo x${newCombo.count} + ${reaction.name} = ${damageCalc.finalDamage} damage!`
          });
        } else if (newCombo.count > 1) {
          toast.success(`🔥 Combo x${newCombo.count}! ${spell.displayName}`, { 
            description: `${accuracy}% accuracy, ${damageCalc.finalDamage} damage` 
          });
        } else {
          toast.success(`Cast ${spell.displayName}!`, { 
            description: `${accuracy}% accuracy, ${damageCalc.finalDamage} damage` 
          });
        }
      } else {
        // Practice mode feedback
        toast.success(`Cast ${spell.displayName}!`, { 
          description: `${accuracy}% accuracy, Cost: ${spell.manaCost} mana` 
        });
      }
      
      // Set selected spell for auto-cast
      setSelectedSpell(spell);
      setLastCastSpell(spell.displayName); // Update for UI feedback
    }
  };
  
  // Socket event listeners for matchmaking
  useEffect(() => {
    socketClient.on('queue:waiting', () => {
      setIsSearching(true);
      toast.info("Searching for opponent...");
    });
    
    socketClient.on('match:found', (data) => {
      setIsSearching(false);
      setCurrentRoom({
        id: data.roomId,
        players: data.players,
        state: 'waiting',
        mode: 'quick',
        vsBot: data.vsBot
      });
      setVsBot(data.vsBot);
      setCurrentScene('match');
      
      // Auto-enable microphone and auto-cast for online matches
      setSettings(prev => ({ ...prev, micEnabled: true }));
      setAutoMode(true);
      
      toast.success("Match found! Auto-cast enabled.");
    });
    
    socketClient.on('queue:timeout', () => {
      setIsSearching(false);
      toast.warning("No opponent found. Try again?");
    });
    
    return () => {
      socketClient.off('queue:waiting', () => {});
      socketClient.off('match:found', () => {});
      socketClient.off('queue:timeout', () => {});
    };
  }, []);

  // Additional match cleanup for online matches
  const cleanupOnlineMatch = () => {
    setCurrentRoom(null);
    setIsSearching(false);
    setVsBot(false);
    setMatchResult(null);

    if (botRef.current) {
      botRef.current.stop();
      botRef.current = null;
    }

    // Reset players and combos
    setPlayer(prev => ({ ...prev, hp: 100, mana: 100, combo: 0 }));
    setOpponent(prev => ({ ...prev, hp: 100, mana: 100, combo: 0 }));
    setPlayerCombo({ count: 0, multiplier: 1, lastCastTime: 0, streak: [] });
    setOpponentCombo({ count: 0, multiplier: 1, lastCastTime: 0, streak: [] });
    setCastHistory([]);
  };
  
  // ENHANCED: Auto-mode toggle with proper error handling and scene awareness
  useEffect(() => {
    // Only manage auto-cast for active scenes
    if (currentScene !== 'practice' && currentScene !== 'match') return;
    
    if (autoMode && settings.micEnabled) {
      console.log("🎯 Starting auto-cast mode...");
      stop(); // Stop manual recognition first
      auto.start().then(() => {
        console.log("✅ Auto-cast activated successfully!");
        toast.success("🎤 Auto-cast activated! Just speak any spell name!");
      }).catch((err) => {
        console.error("❌ Auto-cast failed:", err);
        toast.error(`Failed to start auto-cast: ${err.message}`);
        setAutoMode(false);
      });
    } else if (!autoMode) {
      console.log("🔇 Stopping auto-cast mode...");
      auto.stop();
    }
  }, [autoMode, settings.micEnabled, currentScene]);
  
  // Error handling and mic permission
  useEffect(() => {
    if (error) {
      if (error.includes('denied') || error.includes('not-allowed') || micGranted === false) {
        setShowMicPermission(true);
      } else {
        toast.error(`Microphone Error: ${error}`);
      }
    }
    if (auto.error) {
      if (auto.error.includes('denied') || auto.error.includes('microphone')) {
        setShowMicPermission(true);
      } else {
        toast.error(`Auto-cast Error: ${auto.error}`);
      }
    }
  }, [error, auto.error, micGranted]);
  
  // Render current scene
  const renderScene = () => {
    switch (currentScene) {
      case 'menu':
        return (
          <MainMenu 
            onSceneChange={handleSceneChange}
            onShowSettings={() => setShowSettings(true)}
            onShowHelp={() => setShowHelp(true)}
          />
        );
        
      case 'menu_play':
        return (
          <PlayMenu 
            onSceneChange={handleSceneChange}
            onStartMatch={handleStartMatch}
            isSearching={isSearching}
          />
        );
        
      case 'practice':
        return (
          <div className="min-h-screen p-4">
            <header className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Practice Mode</h1>
              <p className="text-muted-foreground">Master your pronunciation in a safe environment</p>
            </header>
            
            <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className="lg:col-span-2">
                <FeedbackOverlay 
                  target={(auto.lastDetected?.spell?.displayName ?? selectedSpell?.displayName) || ""} 
                  result={auto.lastDetected?.result || result} 
                  listening={listening || auto.listening} 
                  loudness={autoMode ? auto.loudness : loudness} 
                />
                
                <div className="mt-4 grid gap-4">
                  <SpellGame ref={gameRef} />
                  
                  <div className="flex items-center gap-3 flex-wrap">
                    <button 
                      onClick={onCast}
                      className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                      disabled={autoMode || listening || !settings.micEnabled || isCasting}
                      data-event="cast"
                    >
                      {isCasting ? "Casting..." : listening ? "Listening..." : "Cast by Speaking"}
                    </button>
                    
                    <button
                      onClick={() => setAutoMode(!autoMode)}
                      className={`px-4 py-2 rounded-lg border ${autoMode ? 'bg-green-500 text-white' : 'bg-background'}`}
                      data-event="auto_mode_toggle"
                    >
                      Auto-cast: {autoMode ? 'ON' : 'OFF'}
                    </button>
                    
                    <button
                      onClick={() => handleSceneChange('menu')}
                      className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:opacity-90"
                      data-event="practice_exit"
                    >
                      Back to Menu
                    </button>
                  </div>
                </div>
              </section>
              
              <aside>
            <SpellBook 
              spells={spellsData}
              selectedId={selectedSpell?.id}
              onSelect={setSelectedSpell}
            />
            
            <CastHistory history={castHistory} />
              </aside>
            </main>
          </div>
        );
        
      case 'match':
        return (
          <div className="min-h-screen relative">
            <SpellGame ref={gameRef} />
            
            <MatchHUD 
              player={player}
              opponent={opponent}
              isListening={listening || auto.listening}
              loudness={autoMode ? auto.loudness : loudness}
              pitchHz={autoMode ? auto.pitchHz : pitchHz}
              onPause={() => setShowPause(true)}
              onMicToggle={() => {
                const newMicState = !settings.micEnabled;
                const newSettings = { ...settings, micEnabled: newMicState };
                setSettings(newSettings);
                localStorage.setItem('arcane-settings', JSON.stringify(newSettings));
                
                if (newMicState && currentScene === 'match') {
                  // Enable auto-cast when mic is turned on in match
                  setAutoMode(true);
                } else {
                  // Disable auto-cast when mic is turned off
                  setAutoMode(false);
                  stop();
                  auto.stop();
                }
              }}
              onVoiceToggle={() => setSettings(prev => ({ ...prev, voiceVolume: prev.voiceVolume > 0 ? 0 : 0.8 }))}
              micEnabled={settings.micEnabled}
              voiceEnabled={settings.voiceVolume > 0}
              vsBot={vsBot}
            />
            
          
          {/* Debug Panel (DEV) */}
          {process.env.NODE_ENV === 'development' && (
            <DebugPanel
              autoMode={autoMode}
              listening={listening}
              autoListening={auto.listening}
              micEnabled={settings.micEnabled}
              currentScene={currentScene}
              playerMana={player.mana}
              botMana={opponent.mana}
              lastDetection={auto.lastDetected}
              onToggleAutoMode={() => setAutoMode(!autoMode)}
              onTestCast={() => {
                if (spellsData[0]) {
                  handleSpellCast(spellsData[0], 75, 0.8, 'player');
                }
              }}
            />
          )}
          
          {/* Enhanced Casting Indicator */}
            <CastingIndicator 
              isListening={listening || auto.listening}
              autoMode={autoMode}
              micEnabled={settings.micEnabled}
              lastSpellCast={lastCastSpell}
              loudness={loudness}
            />

            {/* Quick Cast Panel for Manual Mode */}
            {!autoMode && (
              <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30">
                <div className="flex flex-col gap-2 p-3 bg-card/90 backdrop-blur-sm border rounded-lg shadow-lg">
                  <div className="text-xs text-muted-foreground text-center">Quick Cast (Manual Mode)</div>
                  <div className="flex gap-2 flex-wrap max-w-md">
                    {spellsData.slice(0, 6).map(spell => (
                      <QuickCastButton
                        key={spell.id}
                        spell={spell}
                        onCast={(spell) => {
                          if (playerMana.canCast(spell.manaCost)) {
                            handleSpellCast(spell, 75, 0.8, 'player'); // Default accuracy for quick cast
                          }
                        }}
                        disabled={!playerMana.canCast(spell.manaCost)}
                        manaCost={spell.manaCost}
                        currentMana={player.mana}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Match Casting Controls */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30">
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Manual Cast Button (for emergency) */}
                    <Button 
                      onClick={onCast}
                      disabled={!settings.micEnabled || isCasting || !selectedSpell}
                      className="px-6 py-3"
                      data-event="match_manual_cast"
                    >
                      {isCasting ? "Casting..." : listening ? "Listening..." : "Emergency Cast"}
                    </Button>
                    
                    {/* Auto-cast status */}
                    <div className={`px-3 py-2 rounded-lg text-sm ${autoMode ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      Auto-cast: {autoMode ? 'ACTIVE' : 'OFF'}
                    </div>
                    
                    {/* Current spell indicator */}
                    {selectedSpell && (
                      <div className="text-sm text-muted-foreground">
                        Ready: <span className="text-primary font-medium">{selectedSpell.displayName}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Spell Cooldown Tracker */}
            <div className="absolute bottom-6 right-6 z-30">
              <SpellCooldownTracker 
                recentCasts={castHistory}
                cooldownMs={COOLDOWN_MS}
              />
            </div>
            
            {/* Player Combo Display */}
            {playerCombo.count > 1 && (
              <div className="absolute top-32 left-6 z-30">
                <ComboDisplay combo={playerCombo} />
              </div>
            )}
            
            {/* Opponent Combo Display */}
            {opponentCombo.count > 1 && (
              <div className="absolute top-32 right-6 z-30">
                <ComboDisplay combo={opponentCombo} />
              </div>
            )}
            
            {/* Match Stats */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-30">
              <MatchStats 
                castHistory={castHistory}
                matchDuration={Date.now() - (castHistory[0]?.timestamp || Date.now())}
                playerHP={player.hp}
                opponentHP={opponent.hp}
              />
            </div>

            {isCasting && (
              <CastingOverlay 
                isCasting={isCasting}
                spell={selectedSpell}
                cooldowns={{}}
              />
            )}
          </div>
        );
        
      default:
        return <MainMenu onSceneChange={handleSceneChange} onShowSettings={() => setShowSettings(true)} onShowHelp={() => setShowHelp(true)} />;
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Arcane Diction – Master Magic Through Perfect Pronunciation</title>
        <meta name="description" content="Cast spells with your voice! Master pronunciation to unleash magical combat with real-time feedback, combos, and online multiplayer duels." />
        <meta property="og:title" content="Arcane Diction – Voice-Powered Spellcasting Game" />
        <meta property="og:description" content="Revolutionary pronunciation training through magical combat. Speak clearly to cast powerful spells!" />
      </Helmet>
      
      
      {/* Debug Panel - DEV ONLY */}
      {process.env.NODE_ENV === 'development' && (
        <DebugPanel
          currentScene={currentScene}
          micEnabled={settings.micEnabled}
          autoMode={autoMode}
          listening={listening}
          autoListening={auto.listening}
          playerMana={player.mana}
          botMana={opponent.mana}
          lastDetection={auto.lastDetected}
          onToggleAutoMode={() => setAutoMode(!autoMode)}
          onTestCast={() => {
            if (selectedSpell) {
              handleSpellCast(selectedSpell, 75, 0.8, 'player');
            }
          }}
        />
      )}
      
      {renderScene()}
      
          
          {/* Pronunciation Feedback */}
          {pronunciationData && (
            <PronunciationFeedback
              isVisible={showPronunciationFeedback}
              onClose={() => setShowPronunciationFeedback(false)}
              targetSpell={pronunciationData.targetSpell}
              userSaid={pronunciationData.userSaid}
              accuracy={pronunciationData.accuracy}
              letters={pronunciationData.letters}
              confidence={pronunciationData.confidence}
              didCast={pronunciationData.didCast}
            />
          )}
          
          {/* Modals */}
          {showSettings && (
            <GameSettingsModal 
              settings={settings}
              onSettingsChange={(newSettings) => {
                const oldSettings = settings;
                setSettings(newSettings);
                localStorage.setItem('arcane-settings', JSON.stringify(newSettings));
                
                // Apply audio settings immediately
                SoundManager.setVolume(newSettings.sfxVolume, newSettings.musicVolume);
                
                // Apply voice settings changes with proper state management
                if (newSettings.micEnabled !== oldSettings.micEnabled) {
                  if (newSettings.micEnabled && currentScene === 'match') {
                    // Enable auto-cast when mic is enabled in match
                    setAutoMode(true);
                  } else if (!newSettings.micEnabled) {
                    // Stop all voice recognition when mic is disabled
                    stop();
                    auto.stop();
                    setAutoMode(false);
                  }
                }
                
                // Apply sensitivity changes to auto-spell
                if (newSettings.sensitivity !== oldSettings.sensitivity && auto.listening) {
                  // Restart auto-spell with new sensitivity
                  auto.stop();
                  setTimeout(() => {
                    if (autoMode && settings.micEnabled) {
                      auto.start();
                    }
                  }, 300);
                }
              }}
              onClose={() => setShowSettings(false)}
            />
          )}
      
      {showHelp && (
        <HelpModal onClose={() => setShowHelp(false)} />
      )}
      
      {showPause && currentScene === 'match' && (
        <PauseMenu 
          onResume={() => setShowPause(false)}
          onSettings={() => {
            setShowPause(false);
            setShowSettings(true);
          }}
          onQuit={() => {
            setShowPause(false);
            cleanupOnlineMatch();
            handleSceneChange('menu');
          }}
          onRestart={vsBot ? () => {
            setShowPause(false);
            cleanupOnlineMatch();
            startBotMatch(botConfig);
          } : undefined}
          vsBot={vsBot}
        />
      )}
      
      {matchResult && (
        <ResultsScreen 
          result={matchResult}
          onPlayAgain={() => {
            setMatchResult(null);
            if (vsBot) {
              startBotMatch(botConfig);
            } else {
              handleStartMatch('quick');
            }
          }}
          onMainMenu={() => {
            setMatchResult(null);
            cleanupOnlineMatch();
            handleSceneChange('menu');
          }}
          castHistory={castHistory}
          vsBot={vsBot}
        />
      )}
      
      {/* Mic Permission Modal */}
      <MicPermissionModal 
        open={showMicPermission}
        onClose={() => setShowMicPermission(false)}
        onRetry={async () => {
          try {
            // Test microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            setShowMicPermission(false);
            toast.success("Microphone access granted!");
          } catch (e: any) {
            toast.error("Still unable to access microphone: " + e.message);
          }
        }}
        error={error || auto.error}
      />
    </>
  );
};

export default GameController;