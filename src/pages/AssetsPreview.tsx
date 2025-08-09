import { useMemo, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SpellGame, SpellGameRef } from "@/game/SpellGame";
import { SoundManager } from "@/game/sound/SoundManager";

const elements = ["fire","ice","lightning","shadow","nature","arcane"] as const;

const AssetsPreview = () => {
  const gameRef = useRef<SpellGameRef>(null);

  const canonical = typeof window !== 'undefined' ? `${window.location.origin}/preview` : 'https://lovable.dev/preview';

  const [element, setElement] = useMemo(() => {
    let current: typeof elements[number] = "arcane";
    const setter = (v: string) => { current = (v as any) };
    return [current, setter];
  }, []);

  let charge: 0 | 1 | 2 = 0;
  let chain = 0;
  let power = 0.6;

  return (
    <>
      <Helmet>
        <title>Asset Preview – Arcane Diction</title>
        <meta name="description" content="Preview spell VFX, SFX, and combos across elements and charge tiers." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <header className="py-6">
        <h1 className="text-3xl font-bold">Asset Preview</h1>
        <p className="text-muted-foreground">Toggle elements, charge tier, chain stacks, and test casts.</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <section className="lg:col-span-2 order-2 lg:order-1">
          <SpellGame ref={gameRef} />
        </section>

        <aside className="lg:col-span-1 order-1 lg:order-2 space-y-4">
          <div className="space-y-2">
            <Label>Element</Label>
            <Select defaultValue="arcane" onValueChange={(v) => setElement(v)}>
              <SelectTrigger><SelectValue placeholder="Select element" /></SelectTrigger>
              <SelectContent>
                {elements.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Power</Label>
            <Slider defaultValue={[60]} max={100} step={1} onValueChange={(v) => { power = (v[0]||0)/100; }} />
          </div>

          <div className="space-y-2">
            <Label>Charge Tier</Label>
            <Slider defaultValue={[0]} max={2} step={1} onValueChange={(v) => { charge = (v[0]||0) as 0|1|2; }} />
          </div>

          <div className="space-y-2">
            <Label>Chain Stacks</Label>
            <Slider defaultValue={[0]} max={3} step={1} onValueChange={(v) => { chain = (v[0]||0); }} />
          </div>

          <div className="flex gap-3">
            <Button onClick={() => {
              SoundManager.cast(element, power, charge);
              (gameRef.current as any)?.castSpellAdvanced?.({ element, power, accuracy: 0.9, loudness: 0.6, pitch: 220, chargeTier: charge, chainStacks: chain, comboId: null });
            }}>Cast</Button>
            <Button variant="outline" onClick={() => SoundManager.impact(element, power)}>Impact SFX</Button>
          </div>
        </aside>
      </main>
    </>
  );
};

export default AssetsPreview;
