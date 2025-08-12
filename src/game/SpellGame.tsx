import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Application, Container, Graphics } from 'pixi.js';
import type { Element } from './spells/data';
import { elementalMultiplier } from './combat/systems';

export interface SpellGameRef {
  castSpell: (element: Element, power: number, from?: 'player' | 'enemy') => void;
}

const elementColor: Record<Element, number> = {
  fire: 0xff6b3d,
  ice: 0x7ad0ff,
  lightning: 0xf6e05e,
  shadow: 0x6b46c1,
  nature: 0x48bb78,
  arcane: 0x9f7aea,
};

type Projectile = {
  g: Graphics;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
};

export const SpellGame = forwardRef<SpellGameRef>((_, ref) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const worldRef = useRef<Container | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let destroyed = false;

    const init = async () => {
      const app = new Application();
      const width = mountRef.current?.clientWidth || 960;
      const height = mountRef.current?.clientHeight || 540;

      await app.init({ width, height, backgroundAlpha: 0, antialias: true });
      if (destroyed) return;
      appRef.current = app;

      const world = new Container();
      app.stage.addChild(world);
      worldRef.current = world;

      // ground
      const ground = new Graphics();
      ground.rect(0, height - 80, width, 80).fill(0x0b1020);
      world.addChild(ground);

      // simple loop to fade projectiles and move
      app.ticker.add(() => {
        if (!world) return;
        for (const child of world.children.slice()) {
          const anyChild = child as any;
          if (anyChild.__proj) {
            const p = anyChild.__proj as Projectile;
            p.g.x += p.vx;
            p.g.y += p.vy;
            p.life += 1;
            const t = p.life / p.maxLife;
            p.g.alpha = Math.max(0, 1 - t);
            if (p.life >= p.maxLife) {
              world.removeChild(p.g);
              p.g.destroy();
            }
          }
        }
      });

      setInitialized(true);
    };

    init();

    return () => {
      destroyed = true;
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
        appRef.current = null;
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    castSpell: (element, power, from = 'player') => {
      if (!appRef.current || !worldRef.current) return;
      const app = appRef.current;
      const world = worldRef.current;
      const w = app.renderer.width;
      const h = app.renderer.height;

      const color = elementColor[element];
      const scale = Math.max(0.4, Math.min(2.0, power * elementalMultiplier(element)));
      const speed = 6 * Math.max(0.6, power);

      // spawn
      const proj = new Graphics();
      proj.circle(0, 0, 10 * scale).fill(color).stroke({ color: 0xffffff, width: 1, alpha: 0.5 });
      const startX = from === 'player' ? 120 : w - 120;
      const dir = from === 'player' ? 1 : -1;
      proj.x = startX;
      proj.y = h - 120;
      world.addChild(proj);

      const projData: any = {
        g: proj,
        vx: dir * speed,
        vy: -1.5 * speed + Math.random() * 1.0 * speed,
        life: 0,
        maxLife: Math.floor(60 + 40 * power),
      };
      (proj as any).__proj = projData;

      // small impact marker when it "expires"
      setTimeout(() => {
        if (!world.children.includes(proj)) return;
        const impact = new Graphics();
        impact.circle(0, 0, 18 * scale).stroke({ color: color, width: 3, alpha: 0.8 });
        impact.x = proj.x;
        impact.y = proj.y;
        world.addChild(impact);
        let i = 0;
        const tick = () => {
          i += 1;
          impact.scale.set(1 + i * 0.04);
          impact.alpha = Math.max(0, 0.8 - i * 0.04);
          if (impact.alpha <= 0) {
            appRef.current?.ticker.remove(tick);
            if (world.children.includes(impact)) {
              world.removeChild(impact);
              impact.destroy();
            }
          }
        };
        appRef.current?.ticker.add(tick);
      }, (Math.floor(60 + 40 * power) / 60) * 1000);
    },
  }), []);

  return <div className="w-full h-[60vh] md:h-[70vh] rounded-lg border bg-background relative overflow-hidden"><div ref={mountRef} className="w-full h-full" /></div>;
});

SpellGame.displayName = 'SpellGame';

export default SpellGame;
