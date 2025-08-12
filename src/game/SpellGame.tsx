
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Application, Container, Graphics, Ticker } from "pixi.js";
import { BloomFilter, GlowFilter, ShockwaveFilter, GodrayFilter } from "pixi-filters";
import type { Element } from "./spells/data";
import { resolveCombo, chargeMultiplier, chargeTierFromLoudness, elementalMultiplier } from "./combat/systems";

export interface SpellGameRef {
  castSpell: (element: Element, power: number, from?: 'player' | 'enemy') => void;
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
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  
  // Combo tracking
  const lastCastRef = useRef<{ element: Element; time: number } | null>(null);
  const [comboChain, setComboChain] = useState(0);

  useEffect(() => {
    let destroyed = false;
    
    const initializeGame = async () => {
      const app = new Application();
      const width = mountRef.current?.clientWidth || 960;
      const height = mountRef.current?.clientHeight || 540;
      
      try {
        await app.init({ width, height, backgroundAlpha: 0, antialias: true });
        if (destroyed) return;
        
        appRef.current = app;
        heightRef.current = height;

        const world = new Container();
        app.stage.addChild(world);
        worldRef.current = world;

        // Enhanced background with magical atmosphere
        const bg = new Graphics();
        bg.rect(0, 0, width, height)
          .fill({ color: 0x0a0a0a });
        world.addChild(bg);

        // Enhanced filters for magical effects
        const godray = new GodrayFilter({ 
          parallel: false, 
          gain: 0.4, 
          lacunarity: 2.5,
          time: 0
        });
        const bloom = new BloomFilter({ 
          strength: 1.5, 
          quality: 4,
          resolution: app.renderer.resolution
        });
        app.stage.filters = [godray, bloom] as any;

        // Animated star field with multiple layers
        const starsFar = new Graphics();
        const starsNear = new Graphics();
        const starsMid = new Graphics();
        
        // Far stars
        for (let i = 0; i < 150; i++) {
          const x = Math.random() * width * 1.5;
          const y = Math.random() * height;
          const size = 0.5 + Math.random() * 1;
          starsFar.circle(x, y, size).fill(0x333333);
        }
        
        // Mid stars
        for (let i = 0; i < 80; i++) {
          const x = Math.random() * width * 1.2;
          const y = Math.random() * height;
          const size = 1 + Math.random() * 1.5;
          starsMid.circle(x, y, size).fill(0x555555);
        }
        
        // Near stars (twinkling)
        for (let i = 0; i < 40; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = 1.5 + Math.random() * 2;
          starsNear.circle(x, y, size).fill(0x777777);
        }
        
        world.addChild(starsFar, starsMid, starsNear);

        // Enhanced player and enemy with magical auras
        const groundY = height - 100;
        
        const player = new Graphics();
        player.circle(0, 0, 20).fill(0x4a90e2).stroke({ color: 0x87ceeb, width: 3 });
        // Add magical aura
        const playerAura = new Graphics();
        playerAura.circle(0, 0, 35).stroke({ color: 0x4a90e2, width: 2, alpha: 0.3 });
        player.addChild(playerAura);
        player.x = playerX.current;
        player.y = groundY;
        
        const enemy = new Graphics();
        enemy.circle(0, 0, 20).fill(0xff4444).stroke({ color: 0xff6b6b, width: 3 });
        // Add enemy aura
        const enemyAura = new Graphics();
        enemyAura.circle(0, 0, 35).stroke({ color: 0xff4444, width: 2, alpha: 0.3 });
        enemy.addChild(enemyAura);
        enemyX.current = width - 120;
        enemy.x = enemyX.current;
        enemy.y = groundY;
        
        world.addChild(player, enemy);

        // Enhanced parallax and atmospheric effects
        let time = 0;
        const ticker = () => {
          time += 0.016;
          
          // Parallax movement
          starsFar.x -= 0.03;
          if (starsFar.x < -width * 0.5) starsFar.x = 0;
          
          starsMid.x -= 0.08;
          if (starsMid.x < -width * 0.2) starsMid.x = 0;
          
          starsNear.x -= 0.15;
          if (starsNear.x < -width) starsNear.x = 0;
          
          // Animate godrays
          godray.time = time * 0.3;
          
          // Pulse auras
          const pulse = 0.7 + Math.sin(time * 2) * 0.3;
          playerAura.alpha = pulse * 0.4;
          enemyAura.alpha = pulse * 0.4;
          
          // Twinkling stars
          starsNear.alpha = 0.6 + Math.sin(time * 1.5) * 0.4;
        };
        
        Ticker.shared.add(ticker);

        // Setup resize observer
        const ro = new ResizeObserver((entries) => {
          const cr = entries[0]?.contentRect;
          if (!cr || !app.renderer) return;
          
          app.renderer.resize(cr.width, cr.height);
          heightRef.current = cr.height;
          enemyX.current = cr.width - 120;
          
          if (enemy) {
            enemy.x = enemyX.current;
          }
          
          bg.clear().rect(0, 0, cr.width, cr.height).fill({ color: 0x0a0a0a });
        });
        
        if (mountRef.current) {
          ro.observe(mountRef.current);
          resizeObserverRef.current = ro;
          mountRef.current.appendChild(app.canvas);
        }
      } catch (error) {
        console.error("Failed to initialize PIXI app:", error);
      }
    };

    initializeGame();

    return () => {
      destroyed = true;
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, []);

  const castSpell = (element: Element, power: number, from: 'player' | 'enemy' = 'player') => {
    const app = appRef.current;
    const world = worldRef.current;
    if (!app || !world || !app.renderer) {
      console.warn("Game not ready for spell casting");
      return;
    }

    // Check for combos
    const now = Date.now();
    const lastCast = lastCastRef.current;
    const withinWindow = lastCast && (now - lastCast.time) <= 2500; // 2.5s window
    const combo = resolveCombo(lastCast?.element || null, element, power, withinWindow || false);
    
    // Update combo chain
    if (combo) {
      setComboChain(prev => Math.min(3, prev + 1));
    } else if (!withinWindow) {
      setComboChain(0);
    }

    // Calculate final power with multipliers
    const chargeTier = chargeTierFromLoudness(power);
    const chargeBonus = chargeMultiplier(chargeTier);
    const comboBonus = comboChain > 0 ? 1 + (comboChain * 0.1) : 1;
    const finalPower = Math.min(1, power * chargeBonus * comboBonus);

    const color = elementColors[element];
    const size = 12 + finalPower * 15;
    const projectile = new Graphics()
      .circle(0, 0, size)
      .fill(color);

    const startX = from === 'player' ? playerX.current : enemyX.current;
    const targetX = from === 'player' ? enemyX.current : playerX.current;
    const groundY = heightRef.current - 100;
    projectile.x = startX;
    projectile.y = groundY;

    // Enhanced glow effect
    const glow = new GlowFilter({ 
      distance: 30 + finalPower * 20, 
      outerStrength: 3 + finalPower * 3, 
      color,
      quality: 0.5
    });
    projectile.filters = [glow] as any;

    // Enhanced trail system
    const trail = new Graphics();
    world.addChild(trail);
    world.addChild(projectile);

    // Combo visual enhancement
    if (combo) {
      const comboText = new Graphics();
      comboText.circle(startX, groundY - 50, 30)
        .fill({ color: 0xffd700, alpha: 0.8 });
      world.addChild(comboText);
      
      setTimeout(() => {
        if (world && comboText) {
          world.removeChild(comboText);
          comboText.destroy();
        }
      }, 1000);
    }

    const duration = Math.max(15, 35 - Math.floor(finalPower * 20));
    let t = 0;

    const update = () => {
      t += 1;
      const progress = Math.min(1, t / duration);
      const x = startX + (targetX - startX) * progress;
      const arcHeight = 50 + finalPower * 40;
      const y = groundY - Math.sin(progress * Math.PI) * arcHeight;

      // Enhanced trail with fade
      const trailAlpha = 0.6 - (progress * 0.3);
      trail.moveTo(projectile.x, projectile.y);
      trail.lineTo(x, y).stroke({ 
        color, 
        width: 3 + finalPower * 2, 
        alpha: trailAlpha 
      });

      projectile.x = x;
      projectile.y = y;

      // Rotate projectile for visual appeal
      projectile.rotation += 0.1 + finalPower * 0.05;

      if (progress >= 1) {
        // Enhanced impact effects
        world.removeChild(projectile);
        projectile.destroy();

        // Create impact explosion
        const impact = new Graphics();
        const impactSize = 40 + finalPower * 60;
        impact.circle(targetX, groundY, impactSize)
          .fill({ color, alpha: 0.7 });
        world.addChild(impact);

        // Shockwave effect
        const shock = new ShockwaveFilter({
          amplitude: 30 + finalPower * 50,
          wavelength: 80,
          brightness: 1.2 + finalPower * 0.5,
          radius: 150 + finalPower * 150,
          center: { x: targetX, y: groundY },
        });

        const prevFilters = (app.stage.filters || []) as any[];
        const enhancedBloom = new BloomFilter({ 
          strength: 2 + finalPower * 1.5,
          quality: 4
        });
        app.stage.filters = [...prevFilters, shock, enhancedBloom] as any;

        let impactTime = 0;
        const impactTicker = () => {
          impactTime += 0.02;
          shock.time = impactTime;
          
          // Enhanced camera shake based on power
          const shakeIntensity = finalPower * 12;
          world.x = (Math.random() - 0.5) * shakeIntensity;
          world.y = (Math.random() - 0.5) * shakeIntensity * 0.7;
          
          // Fade impact
          impact.alpha = Math.max(0, 0.7 - impactTime * 1.2);
          
          if (impactTime > 0.8) {
            app.ticker.remove(impactTicker);
            app.stage.filters = prevFilters as any;
            world.x = 0;
            world.y = 0;
            
            if (world.children.includes(impact)) {
              world.removeChild(impact);
              impact.destroy();
            }
            if (world.children.includes(trail)) {
              world.removeChild(trail);
            }
            trail.destroy();
          }
        };
        
        app.ticker.add(impactTicker);
        app.ticker.remove(update);
      }
    };

    app.ticker.add(update);
    
    // Update last cast for combo tracking
    lastCastRef.current = { element, time: now };
  };

  useImperativeHandle(ref, () => ({ castSpell }), []);

  return (
    <div className="w-full h-[60vh] md:h-[70vh] rounded-lg border bg-background relative overflow-hidden">
      <div ref={mountRef} className="w-full h-full" />
      {comboChain > 0 && (
        <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1 rounded-full text-sm font-bold animate-pulse">
          Combo x{comboChain + 1}!
        </div>
      )}
    </div>
  );
});

SpellGame.displayName = "SpellGame";
