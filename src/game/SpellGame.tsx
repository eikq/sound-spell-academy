import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { Application, Container, Graphics, Ticker } from "pixi.js";
import { BloomFilter, GlowFilter, ShockwaveFilter, GodrayFilter } from "pixi-filters";
import type { Element } from "./spells/data";

export interface SpellGameRef {
  castSpell: (element: Element, power: number) => void;
}

const elementColors: Record<Element, number> = {
  fire: 0xff6b3d,
  ice: 0x7ad0ff,
  lightning: 0xf6e05e,
  shadow: 0x6b46c1,
  nature: 0x48bb78,
  arcane: 0x9f7aea,
};

export const SpellGame = forwardRef<SpellGameRef>((_, ref) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const worldRef = useRef<Container | null>(null);
  const playerX = useRef(120);
  const enemyX = useRef(0);
  const heightRef = useRef(0);

  useEffect(() => {
    let destroyed = false;
    (async () => {
      const app = new Application();
      const width = mountRef.current?.clientWidth || 960;
      const height = mountRef.current?.clientHeight || 540;
      await app.init({ width, height, backgroundAlpha: 0, antialias: true });
      if (destroyed) return;
      appRef.current = app;
      heightRef.current = height;

      const world = new Container();
      app.stage.addChild(world);
      worldRef.current = world;

      // Background gradient layer
      const bg = new Graphics();
      bg.rect(0, 0, width, height).fill({ color: 0x0a0a0a });
      world.addChild(bg);
      app.stage.filters = [new BloomFilter()] as any;

      // Godrays
      const godray = new GodrayFilter({ parallel: false, gain: 0.3, lacunarity: 2.5 });
      app.stage.filters = [godray, new BloomFilter(1.2)] as any;

      // Stars parallax
      const starsFar = new Graphics();
      const starsNear = new Graphics();
      for (let i = 0; i < 120; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        starsFar.circle(x, y, 1).fill(0x222222);
      }
      for (let i = 0; i < 60; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        starsNear.circle(x, y, 2).fill(0x383838);
      }
      world.addChild(starsFar, starsNear);

      // Player and enemy anchors
      const groundY = height - 100;
      const player = new Graphics().circle(0, 0, 18).fill(0xffffff).stroke({ color: 0x777777, width: 2 });
      player.x = playerX.current;
      player.y = groundY;
      const enemy = new Graphics().circle(0, 0, 18).fill(0xffffff).stroke({ color: 0x777777, width: 2 });
      enemyX.current = width - 120;
      enemy.x = enemyX.current;
      enemy.y = groundY;
      world.addChild(player, enemy);

      // subtle parallax
      Ticker.shared.add(() => {
        starsFar.x -= 0.02; if (starsFar.x < -width) starsFar.x = 0;
        starsNear.x -= 0.06; if (starsNear.x < -width) starsNear.x = 0;
        godray.time += 0.005;
      });

      // mount
      if (mountRef.current) mountRef.current.appendChild(app.canvas);

      const ro = new ResizeObserver((entries) => {
        const cr = entries[0]?.contentRect;
        if (!cr) return;
        app.renderer.resize(cr.width, cr.height);
        heightRef.current = cr.height;
        enemyX.current = cr.width - 120;
        bg.clear().rect(0, 0, cr.width, cr.height).fill({ color: 0x0a0a0a });
      });
      if (mountRef.current) ro.observe(mountRef.current);

      return () => {
        ro.disconnect();
      };
    })();

    return () => {
      destroyed = true;
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, []);

  const castSpell = (element: Element, power: number) => {
    const app = appRef.current;
    const world = worldRef.current;
    if (!app || !world) return;

    const color = elementColors[element];
    const projectile = new Graphics().circle(0, 0, 10 + power * 10).fill(color);
    projectile.x = playerX.current;
    projectile.y = heightRef.current - 100;

    const glow = new GlowFilter({ distance: 24, outerStrength: 2 + power * 2, color });
    projectile.filters = [glow] as any;

    const trail = new Graphics();
    world.addChild(trail);
    world.addChild(projectile);

    const duration = Math.max(20, 45 - Math.floor(power * 25));
    let t = 0;

    const update = () => {
      t += 1;
      const progress = Math.min(1, t / duration);
      const x = playerX.current + (enemyX.current - playerX.current) * progress;
      const y = (heightRef.current - 100) - Math.sin(progress * Math.PI) * (40 + power * 30);

      // draw trail
      trail.moveTo(projectile.x, projectile.y);
      trail.lineTo(x, y).stroke({ color, width: 2 + power * 1.5, alpha: 0.5 });

      projectile.x = x;
      projectile.y = y;

      if (progress >= 1) {
        // impact
        world.removeChild(projectile);
        projectile.destroy();

        const shock = new ShockwaveFilter({
          amplitude: 20 + power * 40,
          wavelength: 60,
          brightness: 1.0 + power * 0.3,
          radius: 120 + power * 120,
          center: { x: enemyX.current, y: heightRef.current - 100 },
        });
        const prevFilters = (app.stage.filters || []) as any[];
        app.stage.filters = [...prevFilters, shock, new BloomFilter(1 + power * 0.5)] as any;

        let time = 0;
        const shockTicker = () => {
          time += 0.016;
          shock.time = time;
          // camera shake
          world.x = (Math.random() - 0.5) * (power * 8);
          world.y = (Math.random() - 0.5) * (power * 6);
          if (time > 0.6) {
            app.ticker.remove(shockTicker);
            // restore
            app.stage.filters = prevFilters as any;
            world.x = 0; world.y = 0;
            trail.clear();
          }
        };
        app.ticker.add(shockTicker);
        app.ticker.remove(update);
      }
    };

    app.ticker.add(update);
  };

  useImperativeHandle(ref, () => ({ castSpell }), []);

  return (
    <div className="w-full h-[60vh] md:h-[70vh] rounded-lg border bg-background relative overflow-hidden">
      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
});

SpellGame.displayName = "SpellGame";
