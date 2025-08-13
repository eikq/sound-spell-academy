
import { useRef, useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import spellsData, { Spell, Element } from "@/game/spells/data";
import { SpellGame, SpellGameRef } from "@/game/SpellGame";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useSpeechRecognition } from "@/hooks/useSpeech";
import { useAutoSpell } from "@/hooks/useAutoSpell";
import FeedbackOverlay from "@/components/game/FeedbackOverlay";
import SpellBook from "@/components/game/SpellBook";
import MicVisualizer from "@/components/game/MicVisualizer";
import { SoundManager } from "@/game/sound/SoundManager";
import { resolveCombo } from "@/game/combat/systems";
import { toast } from "sonner";

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const Index = () => {
  const [mode, setMode] = useState<"practice" | "duel">("practice");
  const [selected, setSelected] = useState<Spell | null>(spellsData[0]);
  const [autoMode, setAutoMode] = useState(false);
  const gameRef = useRef<SpellGameRef>(null);

  const { listening, start, stop, result, error, loudness, pitchHz } = useSpeechRecognition();
  const auto = useAutoSpell(spellsData, { minAccuracy: 0.65, minConfidence: 0.5 });

  const [playerHP, setPlayerHP] = useState(100);
  const [enemyHP, setEnemyHP] = useState(100);
  const [lastPlayerCast, setLastPlayerCast] = useState<{ element: Element; time: number } | null>(null);
  const [lastEnemyCast, setLastEnemyCast] = useState<{ element: Element; time: number } | null>(null);
  const lastProcessedAutoTsRef = useRef<number>(0);

  // Handle errors with better UX
  useEffect(() => {
    if (error) {
      toast.error(`Microphone Error: ${error}`);
    }
    if (auto.error) {
      toast.error(`Auto-cast Error: ${auto.error}`);
    }
  }, [error, auto.error]);

  // Auto-mode toggle with proper cleanup
  useEffect(() => {
    if (autoMode) {
      stop(); // Stop manual recognition
      auto.start().then(() => {
        toast.success("Auto-cast activated! Speak any spell name.");
      }).catch((err) => {
        toast.error(`Failed to start auto-cast: ${err.message}`);
        setAutoMode(false);
      });
    } else {
      auto.stop();
      if (auto.listening) {
        toast.info("Auto-cast deactivated");
      }
    }
  }, [autoMode, auto, stop]);

  // Enhanced AI opponent with varied spells and timing
  useEffect(() => {
    if (mode !== "duel" || enemyHP <= 0 || playerHP <= 0) return;
    
    const aiAttackInterval = 2500 + Math.random() * 2000; // 2.5-4.5s variance
    const id = setTimeout(() => {
      const aiElement = randomWeightedElement();
      const aiPower = 0.5 + Math.random() * 0.4; // 50-90% power
      
      // Check for AI combos
      const now = Date.now();
      const withinWindow = lastEnemyCast && (now - lastEnemyCast.time) <= 2500;
      const combo = resolveCombo(lastEnemyCast?.element || null, aiElement, aiPower, withinWindow || false);
      
      if (combo) {
        SoundManager.combo([lastEnemyCast!.element, aiElement], aiPower);
        toast(`Enemy casts ${combo}!`, { 
          description: "The enemy unleashes a devastating combo!" 
        });
      } else {
        SoundManager.cast(aiElement, aiPower, 0);
      }
      
      gameRef.current?.castSpell(aiElement, aiPower, 'enemy');
      setLastEnemyCast({ element: aiElement, time: now });
      
      const damage = Math.round(aiPower * 15 * (combo ? 1.5 : 1));
      setPlayerHP((hp) => Math.max(0, hp - damage));
    }, aiAttackInterval);
    
    return () => clearTimeout(id);
  }, [mode, enemyHP, playerHP, lastEnemyCast]);

  // Game over conditions with better feedback
  useEffect(() => {
    if (mode === "duel") {
      if (enemyHP <= 0 && playerHP > 0) {
        toast.success("🎉 Victory!", { 
          description: "You have shattered your foe with superior pronunciation!" 
        });
      } else if (playerHP <= 0 && enemyHP > 0) {
        toast.error("💀 Defeat!", { 
          description: "Your opponent's spells proved too powerful. Train harder!" 
        });
      }
    }
  }, [mode, enemyHP, playerHP]);

  const onCast = async () => {
    if (!selected) {
      toast.warning("Select a spell first", { description: "Choose a spell from the spellbook" });
      return;
    }
    if (autoMode) {
      toast.info("Auto-cast is active", { description: "Turn off auto-cast to use manual casting" });
      return;
    }
    
    SoundManager.castStart(selected.element);
    await start(selected.name);
  };

  // Handle manual casting results
  useEffect(() => {
    if (!result || !selected) return;
    
    const accuracy = result.accuracy / 100;
    const power = clamp01(0.75 * accuracy + 0.25 * result.loudness);
    
    // Check for combos
    const now = Date.now();
    const withinWindow = lastPlayerCast && (now - lastPlayerCast.time) <= 2500;
    const combo = resolveCombo(lastPlayerCast?.element || null, selected.element, accuracy, withinWindow || false);
    
    if (combo) {
      SoundManager.combo([lastPlayerCast!.element, selected.element], power);
      toast.success(`${combo} Combo!`, { 
        description: `Incredible! Your pronunciation mastery unleashed a powerful combo!` 
      });
    } else {
      SoundManager.castRelease(selected.element, power);
    }
    
    gameRef.current?.castSpell(selected.element, power);
    setLastPlayerCast({ element: selected.element, time: now });
    
    if (mode === "duel") {
      const damage = Math.round(power * 15 * (combo ? 1.5 : 1));
      setEnemyHP((hp) => Math.max(0, hp - damage));
    }
    
    // Feedback based on accuracy
    if (accuracy >= 0.9) {
      toast.success("Perfect pronunciation!", { description: "Your spell reaches maximum power!" });
    } else if (accuracy >= 0.7) {
      toast.success("Good casting!", { description: "Your spell is strong and true." });
    } else if (accuracy >= 0.5) {
      toast("Decent attempt", { description: "Practice makes perfect!" });
    }
  }, [result, selected, mode, lastPlayerCast]);

  // Handle auto-cast results
  useEffect(() => {
    const detection = auto.lastDetected;
    if (!detection) return;
    if (lastProcessedAutoTsRef.current === detection.timestamp) return;

    // Deduplicate immediately to avoid React StrictMode double-effect casting
    lastProcessedAutoTsRef.current = detection.timestamp;
    
    const power = detection.power;
    const spell = detection.spell;
    
    const now = Date.now();
    // Same-spell cooldown: 3s
    if (lastPlayerCast && spell && lastPlayerCast.element === spell.element && (now - lastPlayerCast.time) < 3000) return;
    // Global minimal cooldown: 1s to avoid rapid back-to-back casts
    if (lastPlayerCast && (now - lastPlayerCast.time) < 1000) return;

    // Check for combos
    const withinWindow = lastPlayerCast && (now - lastPlayerCast.time) <= 2500;
    const combo = resolveCombo(lastPlayerCast?.element || null, spell.element, detection.result.accuracy / 100, withinWindow || false);
    
    if (combo) {
      SoundManager.combo([lastPlayerCast!.element, spell.element], power);
      toast.success(`${combo} Auto-Combo!`, { 
        description: `Your ${spell.name} triggered a devastating combination!` 
      });
    } else {
      SoundManager.castRelease(spell.element, power);
    }
    
    gameRef.current?.castSpell(spell.element, power);
    setLastPlayerCast({ element: spell.element, time: now });
    setSelected(spell); // Auto-select the cast spell
    
    if (mode === "duel") {
      const damage = Math.round(power * 15 * (combo ? 1.5 : 1));
      setEnemyHP((hp) => Math.max(0, hp - damage));
    }
    
    toast.success(`Auto-cast: ${spell.name}`, { 
      description: `Accuracy: ${Math.round(detection.result.accuracy)}%` 
    });
  }, [auto.lastDetected, mode, lastPlayerCast]);

  const resetDuel = () => {
    setEnemyHP(100);
    setPlayerHP(100);
    setLastPlayerCast(null);
    setLastEnemyCast(null);
    toast.info("Duel reset!", { description: "Prepare for magical combat!" });
  };

  const canonical = typeof window !== 'undefined' ? window.location.href : 'https://lovable.dev';
  const overlayTarget = (auto.lastDetected?.spell?.name ?? selected?.name) || "";
  const displayResult = auto.lastDetected?.result || result;
  const vizLoudness = autoMode ? auto.loudness : loudness;
  const vizPitch = autoMode ? auto.pitchHz || undefined : pitchHz || undefined;
  const isListening = listening || auto.listening;

  return (
    <>
      <Helmet>
        <title>Arcane Diction – Master Magic Through Perfect Pronunciation</title>
        <meta name="description" content="Cast spells with your voice! Master pronunciation to unleash fire, ice, lightning, and arcane magic. Real-time feedback, combo system, and magical duels await." />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Arcane Diction – Voice-Powered Spellcasting Game" />
        <meta property="og:description" content="Revolutionary pronunciation training through magical combat. Speak clearly to cast powerful spells and defeat your enemies!" />
      </Helmet>

      <header className="py-6">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-hero">
          Arcane Diction: Voice-Powered Magic
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Master the ancient art of spellcasting through perfect pronunciation. The clearer and more confident your voice, the more devastating your magical attacks.
        </p>
        {autoMode && (
          <div className="mt-3 text-sm bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-lg p-3">
            🎤 <strong>Auto-cast Active:</strong> Speak any spell name clearly to cast it automatically!
          </div>
        )}
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <section aria-label="Game Arena" className="lg:col-span-2 order-2 lg:order-1">
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="practice">Practice Mode</TabsTrigger>
              <TabsTrigger value="duel" onClick={resetDuel}>Magical Duel</TabsTrigger>
            </TabsList>
            
            <TabsContent value="practice" className="mt-4">
              <div className="grid gap-4">
                <FeedbackOverlay 
                  target={overlayTarget} 
                  result={displayResult} 
                  listening={isListening} 
                  loudness={vizLoudness} 
                />
                <MicVisualizer 
                  loudness={vizLoudness} 
                  pitchHz={vizPitch} 
                  listening={isListening} 
                />
                <div className="flex items-center gap-3 flex-wrap">
                  <Button 
                    variant="hero" 
                    onClick={onCast} 
                    className="hover-scale" 
                    disabled={autoMode || isListening}
                  >
                    {isListening ? "Listening..." : "Cast by Speaking"}
                  </Button>
                  {isListening && !autoMode && (
                    <Button variant="outline" onClick={stop}>Stop Listening</Button>
                  )}
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-sm text-muted-foreground">Auto-cast</span>
                    <Switch 
                      checked={autoMode} 
                      onCheckedChange={setAutoMode} 
                      aria-label="Toggle automatic spell casting" 
                    />
                  </div>
                </div>
                <SpellGame ref={gameRef} />
              </div>
            </TabsContent>
            
            <TabsContent value="duel" className="mt-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4 bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
                    <div className="text-sm text-muted-foreground mb-2">Your Magical Energy</div>
                    <div className="text-2xl font-bold mb-2">{playerHP}/100</div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500" 
                        style={{ width: `${playerHP}%` }} 
                      />
                    </div>
                  </div>
                  <div className="rounded-lg border p-4 bg-gradient-to-r from-red-500/5 to-orange-500/5">
                    <div className="text-sm text-muted-foreground mb-2">Enemy Magical Energy</div>
                    <div className="text-2xl font-bold mb-2">{enemyHP}/100</div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500" 
                        style={{ width: `${enemyHP}%` }} 
                      />
                    </div>
                  </div>
                </div>
                
                <FeedbackOverlay 
                  target={overlayTarget} 
                  result={displayResult} 
                  listening={isListening} 
                  loudness={vizLoudness} 
                />
                <MicVisualizer 
                  loudness={vizLoudness} 
                  pitchHz={vizPitch} 
                  listening={isListening} 
                />
                
                <div className="flex items-center gap-3 flex-wrap">
                  <Button 
                    variant="hero" 
                    onClick={onCast} 
                    className="hover-scale" 
                    disabled={autoMode || isListening || playerHP <= 0 || enemyHP <= 0}
                  >
                    {isListening ? "Casting..." : "Speak Your Spell"}
                  </Button>
                  {isListening && !autoMode && (
                    <Button variant="outline" onClick={stop}>Cancel Cast</Button>
                  )}
                  <Button variant="outline" onClick={resetDuel} className="ml-auto">
                    New Duel
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Auto-cast</span>
                    <Switch 
                      checked={autoMode} 
                      onCheckedChange={setAutoMode} 
                      aria-label="Toggle automatic spell casting" 
                      disabled={playerHP <= 0 || enemyHP <= 0}
                    />
                  </div>
                </div>
                
                <SpellGame ref={gameRef} />
              </div>
            </TabsContent>
          </Tabs>
        </section>

        <aside className="lg:col-span-1 order-1 lg:order-2">
          <div className="mb-3 text-sm text-muted-foreground">
            Spellbook {selected && `• Selected: ${selected.name}`}
          </div>
          <SpellBook 
            spells={spellsData} 
            selectedId={selected?.id} 
            onSelect={setSelected} 
            onCast={(spell) => { 
              setSelected(spell); 
              if (!autoMode && !isListening) {
                SoundManager.castStart(spell.element);
                gameRef.current?.castSpell(spell.element, 0.8);
                if (mode === 'duel') {
                  setEnemyHP((hp) => Math.max(0, hp - 12));
                }
                toast.success(`${spell.name} cast!`, { description: "Direct spell casting" });
              }
            }} 
          />
        </aside>
      </main>
    </>
  );
};

// Enhanced AI spell selection with element preferences
function randomWeightedElement(): Element {
  const elements: Element[] = ["fire", "ice", "lightning", "shadow", "nature", "arcane"];
  const weights = [0.2, 0.2, 0.15, 0.15, 0.15, 0.15]; // Fire and ice slightly more common
  
  const random = Math.random();
  let sum = 0;
  
  for (let i = 0; i < elements.length; i++) {
    sum += weights[i];
    if (random <= sum) return elements[i];
  }
  
  return elements[Math.floor(Math.random() * elements.length)];
}

export default Index;
