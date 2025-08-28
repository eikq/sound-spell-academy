import { Graphics, Container } from "pixi.js";

export class GraphicsPool {
  private pool: Graphics[] = [];
  
  constructor(private create: () => Graphics) {}
  
  acquire() { 
    return this.pool.pop() ?? this.create(); 
  }
  
  release(g: Graphics, parent?: Container) {
    if (parent && g.parent === parent) {
      parent.removeChild(g);
    }
    
    // Reset graphics state
    g.alpha = 1; 
    g.visible = true; 
    g.scale.set(1); 
    g.rotation = 0;
    g.clear();
    g.filters = null;
    
    this.pool.push(g);
  }
  
  destroy() {
    this.pool.forEach(g => g.destroy());
    this.pool.length = 0;
  }
}

export class ParticlePool {
  private particles: Graphics[] = [];
  private active: Set<Graphics> = new Set();
  
  constructor(private maxCount: number, private createParticle: () => Graphics) {}
  
  emit(x: number, y: number, color: number, velocity: { x: number; y: number }, lifetime: number) {
    if (this.active.size >= this.maxCount) return null;
    
    const particle = this.particles.pop() ?? this.createParticle();
    particle.x = x;
    particle.y = y;
    particle.tint = color;
    particle.alpha = 1;
    particle.visible = true;
    
    // Store animation data on particle
    (particle as any).vx = velocity.x;
    (particle as any).vy = velocity.y;
    (particle as any).lifetime = lifetime;
    (particle as any).age = 0;
    
    this.active.add(particle);
    return particle;
  }
  
  update(deltaMS: number) {
    const toRemove: Graphics[] = [];
    
    for (const particle of this.active) {
      const data = particle as any;
      data.age += deltaMS;
      
      if (data.age >= data.lifetime) {
        toRemove.push(particle);
        continue;
      }
      
      // Update position
      particle.x += data.vx * deltaMS * 0.001;
      particle.y += data.vy * deltaMS * 0.001;
      
      // Fade out
      particle.alpha = 1 - (data.age / data.lifetime);
    }
    
    // Return expired particles to pool
    for (const particle of toRemove) {
      this.active.delete(particle);
      particle.visible = false;
      this.particles.push(particle);
    }
  }
  
  destroy() {
    this.particles.forEach(p => p.destroy());
    this.active.forEach(p => p.destroy());
    this.particles.length = 0;
    this.active.clear();
  }
}