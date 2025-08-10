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
import { toast } from "sonner";
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const Index = () => {
  const [mode, setMode] = useState<"practice" | "duel">("practice");
  const [selected, setSelected] = useState<Spell | null>(spellsData[0]);
  const [autoMode, setAutoMode] = useState(false);
  const gameRef = useRef<SpellGameRef>(null);

  const { listening, start, stop, result, error, loudness, pitchHz } = useSpeechRecognition();
  const auto = useAutoSpell(spellsData);

  const [playerHP, setPlayerHP] = useState(100);
  const [enemyHP, setEnemyHP] = useState(100);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (autoMode) {
      stop();
      auto.start();
    } else {
      auto.stop();
    }
  }, [autoMode, auto, stop]);

  useEffect(() => {
    if (mode !== "duel") return;
    if (enemyHP <= 0 || playerHP <= 0) return;
    // Simple AI that "attacks" every 3s
    const id = setInterval(() => {
      const aiPower = 0.4 + Math.random() * 0.4; // 40-80%
      gameRef.current?.castSpell(randomElement(), aiPower, 'enemy');
      setPlayerHP((hp) => Math.max(0, hp - Math.round(aiPower * 12)));
    }, 3000);
    return () => clearInterval(id);
  }, [mode, enemyHP, playerHP]);

  useEffect(() => {
    if (mode === "duel") {
      if (enemyHP <= 0) toast.success("Victory! You shattered your foe.");
      if (playerHP <= 0) toast.error("Defeat! Regain your focus and try again.");
    }
  }, [mode, enemyHP, playerHP]);

  const onCast = async () => {
    if (!selected) return toast("Select a spell first");
    SoundManager.castStart(selected.element);
    await start(selected.name);
  };

  useEffect(() => {
    if (!result || !selected) return;
    const accuracy = result.accuracy / 100;
    const power = clamp01(0.75 * accuracy + 0.25 * result.loudness);
    gameRef.current?.castSpell(selected.element, power);
    SoundManager.castRelease(selected.element, power);
    if (mode === "duel") {
      setEnemyHP((hp) => Math.max(0, hp - Math.round(power * 15)));
    }
  }, [result, selected, mode]);

  useEffect(() => {
    const det = auto.lastDetected;
    if (!det) return;
    const power = det.power;
    gameRef.current?.castSpell(det.spell.element, power);
    SoundManager.castRelease(det.spell.element, power);
    if (mode === "duel") {
      setEnemyHP((hp) => Math.max(0, hp - Math.round(power * 15)));
    }
    setSelected(det.spell);
  }, [auto.lastDetected, mode]);

  const resetDuel = () => {
    setEnemyHP(100);
    setPlayerHP(100);
  };

  const canonical = typeof window !== 'undefined' ? window.location.href : 'https://lovable.dev';
  const overlayTarget = (auto.lastDetected?.spell?.name ?? selected?.name) || "";
  const displayResult = auto.lastDetected?.result || result;
  const vizLoudness = autoMode ? auto.loudness : loudness;
  const vizPitch = autoMode ? auto.pitchHz || undefined : pitchHz || undefined;

  return (
    <>
      <Helmet>
        <title>Arcane Diction – Pronunciation Spellcasting Game</title>
        <meta name="description" content="Master pronunciation by casting spells! Speak clearly to unleash fire, ice, lightning, and arcane forces with real-time feedback." />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Arcane Diction – Pronunciation Spellcasting Game" />
        <meta property="og:description" content="Speak spells into your mic to cast powerful magic. Real-time accuracy, loudness, and VFX-driven feedback." />
      </Helmet>

      <header className="py-6">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-hero">Arcane Diction: Speak to Cast</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">Train pronunciation through spellcraft. The clearer and bolder your voice, the stronger your magic.</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <section aria-label="Spellbook" className="lg:col-span-2 order-2 lg:order-1">
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
            <TabsList>
              <TabsTrigger value="practice">Practice</TabsTrigger>
              <TabsTrigger value="duel" onClick={resetDuel}>Duel</TabsTrigger>
            </TabsList>
            <TabsContent value="practice" className="mt-4">
              <div className="grid gap-4">
                <FeedbackOverlay target={overlayTarget} result={displayResult} listening={listening || auto.listening} loudness={vizLoudness} />
                <MicVisualizer loudness={vizLoudness} pitchHz={vizPitch} listening={listening || auto.listening} />
                <div className="flex items-center gap-3">
                  <Button variant="hero" onClick={onCast} className="hover-scale" disabled={autoMode}>Cast by Speaking</Button>
                  {listening && !autoMode && (
                    <Button variant="outline" onClick={stop}>Stop</Button>
                  )}
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-sm text-muted-foreground">Auto-cast</span>
                    <Switch checked={autoMode} onCheckedChange={setAutoMode} aria-label="Toggle auto-cast" />
                  </div>
                </div>
                <SpellGame ref={gameRef} />
              </div>
            </TabsContent>
            <TabsContent value="duel" className="mt-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground mb-1">Your Vitality</div>
                    <div className="h-2 bg-muted rounded">
                      <div className="h-full bg-[hsl(var(--brand))] transition-all" style={{ width: `${playerHP}%` }} />
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground mb-1">Opponent Vitality</div>
                    <div className="h-2 bg-muted rounded">
                      <div className="h-full bg-destructive transition-all" style={{ width: `${enemyHP}%` }} />
                    </div>
                  </div>
                </div>
                <FeedbackOverlay target={overlayTarget} result={displayResult} listening={listening || auto.listening} loudness={vizLoudness} />
                <MicVisualizer loudness={vizLoudness} pitchHz={vizPitch} listening={listening || auto.listening} />
                <div className="flex items-center gap-3">
                  <Button variant="hero" onClick={onCast} className="hover-scale" disabled={autoMode}>Speak Your Spell</Button>
                  {listening && !autoMode && (
                    <Button variant="outline" onClick={stop}>Stop</Button>
                  )}
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-sm text-muted-foreground">Auto-cast</span>
                    <Switch checked={autoMode} onCheckedChange={setAutoMode} aria-label="Toggle auto-cast" />
                  </div>
                </div>
                <SpellGame ref={gameRef} />
              </div>
            </TabsContent>
          </Tabs>
        </section>

        <aside className="lg:col-span-1 order-1 lg:order-2">
          <div className="mb-3 text-sm text-muted-foreground">Spellbook</div>
          <SpellBook spells={spellsData} selectedId={selected?.id} onSelect={setSelected} onCast={(s) => { setSelected(s); gameRef.current?.castSpell(s.element, 0.7); if (mode === 'duel') setEnemyHP((hp) => Math.max(0, hp - Math.round(0.7 * 15))); }} />
        </aside>
      </main>
    </>
  );
};

function randomElement(): Element {
  const all: Element[] = ["fire","ice","lightning","shadow","nature","arcane"];
  return all[Math.floor(Math.random() * all.length)];
}

export default Index;
