import { Particle, ParticleType } from '../types/game';

export class ParticleSystem {
  public particles: Particle[] = [];
  private readonly maxParticles: number = 800;

  public clear() {
    this.particles = [];
  }

  // --- Particle Spawning Core ---
  public addParticle(p: Particle) {
    if (this.particles.length >= this.maxParticles) {
      // Recycle the oldest particle
      this.particles.shift();
    }
    this.particles.push(p);
  }

  // --- Emitters ---

  /**
   * 1. TANK EXPLOSION
   * Multi-phase explosion: Core flash, double shockwave, fireball burst,
   * high-speed burning shrapnel sparks, spinning armor plates, and smoke plume.
   */
  public emitTankExplosion(x: number, y: number, radius: number = 30, tintColor: string = '#f97316', isBoss: boolean = false) {
    const scale = isBoss ? 1.6 : 1.0;
    const finalRadius = radius * scale;

    // 1. Blinding white core flash
    this.addParticle({
      x,
      y,
      vx: 0,
      vy: 0,
      drag: 1,
      size: finalRadius * 0.8,
      startSize: 5,
      endSize: finalRadius * 1.2,
      life: 0.12,
      maxLife: 0.12,
      color: '#ffffff',
      alpha: 1.0,
      type: 'flash',
      shape: 'circle',
    });

    // 2. Primary Fast Shockwave
    this.addParticle({
      x,
      y,
      vx: 0,
      vy: 0,
      drag: 1,
      size: 4,
      startSize: 4,
      endSize: finalRadius * 2.2,
      life: 0.28 * scale,
      maxLife: 0.28 * scale,
      color: '#ffffff',
      alpha: 0.95,
      type: 'shockwave',
      shape: 'ring',
    });

    // 3. Secondary Colored Pressure Wave
    this.addParticle({
      x,
      y,
      vx: 0,
      vy: 0,
      drag: 1,
      size: 8,
      startSize: 8,
      endSize: finalRadius * 1.6,
      life: 0.38 * scale,
      maxLife: 0.38 * scale,
      color: tintColor,
      alpha: 0.85,
      type: 'shockwave',
      shape: 'ring',
    });

    // 4. Fiery Fireball Burst
    const flameCount = Math.floor(18 * scale);
    for (let i = 0; i < flameCount; i++) {
      const ang = Math.random() * Math.PI * 2;
      const speed = (20 + Math.random() * 85) * scale;
      const colors = ['#ffffff', '#fef08a', '#f97316', '#ef4444', '#b91c1c'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const life = 0.35 + Math.random() * 0.35 * scale;

      this.addParticle({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed - 15, // slight thermal lift
        drag: 0.91,
        gravity: -10, // thermal rise
        size: 8 * scale,
        startSize: (6 + Math.random() * 6) * scale,
        endSize: (18 + Math.random() * 12) * scale,
        life,
        maxLife: life,
        color,
        alpha: 0.95,
        type: 'flame',
        shape: 'circle',
      });
    }

    // 5. High-Velocity Burning Metal Shrapnel Sparks
    const sparkCount = Math.floor(28 * scale);
    for (let i = 0; i < sparkCount; i++) {
      const ang = Math.random() * Math.PI * 2;
      const speed = (90 + Math.random() * 160) * scale;
      const life = 0.25 + Math.random() * 0.35;

      this.addParticle({
        x,
        y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        drag: 0.93,
        gravity: 60, // downward gravity
        size: 2.5,
        startSize: 3,
        endSize: 1,
        life,
        maxLife: life,
        color: Math.random() < 0.6 ? '#fef08a' : '#f97316',
        alpha: 1.0,
        type: 'spark',
        shape: 'spark_line',
      });
    }

    // 6. Spinning Heavy Armor Plate Debris Chunks
    const debrisCount = Math.floor(10 * scale);
    for (let i = 0; i < debrisCount; i++) {
      const ang = Math.random() * Math.PI * 2;
      const speed = (40 + Math.random() * 95) * scale;
      const life = 0.5 + Math.random() * 0.4;
      const w = 4 + Math.random() * 5 * scale;
      const h = 3 + Math.random() * 4 * scale;

      this.addParticle({
        x,
        y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        drag: 0.92,
        gravity: 70,
        size: Math.max(w, h),
        startSize: Math.max(w, h),
        endSize: Math.max(w, h) * 0.8,
        width: w,
        height: h,
        angle: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 16,
        life,
        maxLife: life,
        color: Math.random() < 0.5 ? '#334155' : tintColor,
        alpha: 1.0,
        type: 'debris',
        shape: 'rect',
      });
    }

    // 7. Lingering Smoke Plume
    const smokeCount = Math.floor(12 * scale);
    for (let i = 0; i < smokeCount; i++) {
      const ang = Math.random() * Math.PI * 2;
      const speed = (10 + Math.random() * 35) * scale;
      const life = 0.55 + Math.random() * 0.45 * scale;

      this.addParticle({
        x: x + (Math.random() - 0.5) * 15,
        y: y + (Math.random() - 0.5) * 15,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed - 25, // smoke lifts upward
        drag: 0.92,
        gravity: -15,
        size: 10 * scale,
        startSize: 8 * scale,
        endSize: (24 + Math.random() * 12) * scale,
        life,
        maxLife: life,
        color: Math.random() < 0.5 ? '#1e293b' : '#334155',
        alpha: 0.8,
        type: 'smoke',
        shape: 'circle',
      });
    }

    // If Boss: Chain secondary explosions
    if (isBoss) {
      for (let s = 1; s <= 3; s++) {
        setTimeout(() => {
          const offsetX = (Math.random() - 0.5) * 35;
          const offsetY = (Math.random() - 0.5) * 35;
          this.emitTankExplosion(x + offsetX, y + offsetY, radius * 0.65, '#f59e0b', false);
        }, s * 140);
      }
    }
  }

  /**
   * 2. WOODEN SUPPLY CRATE DESTRUCTION (THÙNG GỖ QUÂN SỰ BỊ BẮN VỠ)
   * Spinning timber plank splinters flying with bullet momentum, golden-amber sawdust puffs,
   * and flying metal corner-bracket nail sparks.
   */
  public emitBrickDestruction(x: number, y: number, bulletVx: number = 0, bulletVy: number = 0) {
    const bulletSpeed = Math.hypot(bulletVx, bulletVy) || 1;
    const impactDirX = bulletVx / bulletSpeed;
    const impactDirY = bulletVy / bulletSpeed;

    // 1. Spinning Timber Plank Splinters & Wood Fragments
    const chunkCount = 14;
    for (let i = 0; i < chunkCount; i++) {
      const spreadAngle = (Math.random() - 0.5) * 1.8;
      const baseAngle = Math.atan2(impactDirY, impactDirX) + spreadAngle;
      const speed = 45 + Math.random() * 105;
      const life = 0.38 + Math.random() * 0.35;
      const w = 4 + Math.random() * 6; // Rectangular timber splinter length
      const h = 2 + Math.random() * 2.5;

      const woodColors = ['#a16207', '#92400e', '#b45309', '#854d0e', '#6c3b12', '#d97706'];
      const color = woodColors[Math.floor(Math.random() * woodColors.length)];

      this.addParticle({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(baseAngle) * speed + (Math.random() - 0.5) * 30,
        vy: Math.sin(baseAngle) * speed + (Math.random() - 0.5) * 30,
        drag: 0.91,
        gravity: 95, // gravity pulls timber down
        size: Math.max(w, h),
        startSize: Math.max(w, h),
        endSize: Math.max(w, h) * 0.8,
        width: w,
        height: h,
        angle: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 22,
        life,
        maxLife: life,
        color,
        alpha: 1.0,
        type: 'debris',
        shape: 'rect',
      });
    }

    // 2. Soft Amber Sawdust & Wood Fluff Puffs
    const dustCount = 9;
    for (let i = 0; i < dustCount; i++) {
      const ang = Math.random() * Math.PI * 2;
      const speed = 18 + Math.random() * 40;
      const life = 0.45 + Math.random() * 0.25;

      this.addParticle({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        vx: Math.cos(ang) * speed + impactDirX * 20,
        vy: Math.sin(ang) * speed + impactDirY * 20,
        drag: 0.87,
        size: 5,
        startSize: 5,
        endSize: 15 + Math.random() * 7,
        life,
        maxLife: life,
        color: Math.random() < 0.6 ? '#fde68a' : '#f59e0b',
        alpha: 0.6,
        type: 'dust',
        shape: 'circle',
      });
    }

    // 3. Metal Bracket Nails & Corner Sparks
    for (let i = 0; i < 7; i++) {
      const ang = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 70;
      const life = 0.18 + Math.random() * 0.16;

      this.addParticle({
        x,
        y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        drag: 0.93,
        size: 2,
        startSize: 2.5,
        endSize: 1,
        life,
        maxLife: life,
        color: Math.random() < 0.5 ? '#f8fafc' : '#fde047',
        alpha: 1.0,
        type: 'spark',
        shape: 'spark_line',
      });
    }
  }

  /**
   * 3. STEEL WALL IMPACT & PENETRATION
   * High-intensity ricochet sparks bouncing back from armor, or heavy steel plates
   * if pierced by tier 4 cannon.
   */
  public emitSteelImpact(x: number, y: number, bulletVx: number = 0, bulletVy: number = 0, destroyed: boolean = false) {
    if (destroyed) {
      // Steel Breached: Heavy industrial steel plates, iron dust, shockwave
      this.addParticle({
        x,
        y,
        vx: 0,
        vy: 0,
        drag: 1,
        size: 6,
        startSize: 6,
        endSize: 32,
        life: 0.22,
        maxLife: 0.22,
        color: '#94a3b8',
        alpha: 0.9,
        type: 'shockwave',
        shape: 'ring',
      });

      // Steel plate chunks
      for (let i = 0; i < 14; i++) {
        const ang = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 110;
        const life = 0.45 + Math.random() * 0.3;
        const w = 4 + Math.random() * 5;
        const h = 3 + Math.random() * 4;

        this.addParticle({
          x,
          y,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          drag: 0.92,
          gravity: 80,
          size: Math.max(w, h),
          startSize: Math.max(w, h),
          endSize: Math.max(w, h) * 0.85,
          width: w,
          height: h,
          angle: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 20,
          life,
          maxLife: life,
          color: Math.random() < 0.5 ? '#64748b' : '#94a3b8',
          alpha: 1.0,
          type: 'debris',
          shape: 'rect',
        });
      }

      // Iron dust
      for (let i = 0; i < 8; i++) {
        const ang = Math.random() * Math.PI * 2;
        const speed = 20 + Math.random() * 40;
        const life = 0.35 + Math.random() * 0.25;

        this.addParticle({
          x,
          y,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          drag: 0.88,
          size: 6,
          startSize: 6,
          endSize: 16,
          life,
          maxLife: life,
          color: '#475569',
          alpha: 0.7,
          type: 'dust',
          shape: 'circle',
        });
      }
    } else {
      // Ricochet / Deflection: Brilliant spray of white/gold spark streaks bouncing outward
      const bulletSpeed = Math.hypot(bulletVx, bulletVy) || 1;
      const normalX = -bulletVx / bulletSpeed; // bounce opposite
      const normalY = -bulletVy / bulletSpeed;
      const baseAngle = Math.atan2(normalY, normalX);

      // Micro flash
      this.addParticle({
        x,
        y,
        vx: 0,
        vy: 0,
        drag: 1,
        size: 4,
        startSize: 2,
        endSize: 12,
        life: 0.08,
        maxLife: 0.08,
        color: '#ffffff',
        alpha: 1.0,
        type: 'flash',
        shape: 'circle',
      });

      // Directional spark streaks
      const sparkCount = 18;
      for (let i = 0; i < sparkCount; i++) {
        const spread = (Math.random() - 0.5) * 1.4;
        const angle = baseAngle + spread;
        const speed = 80 + Math.random() * 150;
        const life = 0.15 + Math.random() * 0.2;

        this.addParticle({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          drag: 0.93,
          gravity: 40,
          size: 2.5,
          startSize: 3,
          endSize: 1,
          life,
          maxLife: life,
          color: Math.random() < 0.7 ? '#ffffff' : '#fef08a',
          alpha: 1.0,
          type: 'spark',
          shape: 'spark_line',
        });
      }
    }
  }

  /**
   * 4. TANK HIT / ARMOR IMPACT
   * When a tank is hit but not destroyed: directional spark burst + armor paint chips.
   */
  public emitTankHit(x: number, y: number, bulletVx: number, bulletVy: number, tankColor: string) {
    const bulletSpeed = Math.hypot(bulletVx, bulletVy) || 1;
    const bounceAngle = Math.atan2(-bulletVy, -bulletVx);

    // Directional sparks
    for (let i = 0; i < 12; i++) {
      const spread = (Math.random() - 0.5) * 1.5;
      const angle = bounceAngle + spread;
      const speed = 70 + Math.random() * 120;
      const life = 0.14 + Math.random() * 0.18;

      this.addParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        drag: 0.92,
        gravity: 50,
        size: 2.5,
        startSize: 3,
        endSize: 1,
        life,
        maxLife: life,
        color: Math.random() < 0.6 ? '#ffffff' : '#fef08a',
        alpha: 1.0,
        type: 'spark',
        shape: 'spark_line',
      });
    }

    // Paint chip debris
    for (let i = 0; i < 6; i++) {
      const ang = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 60;
      const life = 0.25 + Math.random() * 0.2;
      const w = 2.5 + Math.random() * 2;
      const h = 2 + Math.random() * 2;

      this.addParticle({
        x,
        y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        drag: 0.91,
        gravity: 60,
        size: Math.max(w, h),
        startSize: Math.max(w, h),
        endSize: Math.max(w, h) * 0.8,
        width: w,
        height: h,
        angle: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 15,
        life,
        maxLife: life,
        color: tankColor,
        alpha: 1.0,
        type: 'debris',
        shape: 'rect',
      });
    }
  }

  /**
   * 5. BULLET VS BULLET CLASH
   * High-intensity starburst pop and micro shockwave
   */
  public emitBulletClash(x: number, y: number) {
    this.addParticle({
      x,
      y,
      vx: 0,
      vy: 0,
      drag: 1,
      size: 4,
      startSize: 3,
      endSize: 22,
      life: 0.18,
      maxLife: 0.18,
      color: '#fbbf24',
      alpha: 1.0,
      type: 'shockwave',
      shape: 'ring',
    });

    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      const speed = 75 + Math.random() * 95;
      const life = 0.16 + Math.random() * 0.15;

      this.addParticle({
        x,
        y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        drag: 0.92,
        size: 2.5,
        startSize: 3,
        endSize: 1,
        life,
        maxLife: life,
        color: Math.random() < 0.5 ? '#ffffff' : '#fde047',
        alpha: 1.0,
        type: 'spark',
        shape: 'spark_line',
      });
    }
  }

  /**
   * 6. WATER RIPPLE / SPLASH
   * Concentric expanding water rings & droplets
   */
  public emitWaterSplash(x: number, y: number) {
    // 2 Concentric Ripple rings
    this.addParticle({
      x,
      y,
      vx: 0,
      vy: 0,
      drag: 1,
      size: 3,
      startSize: 3,
      endSize: 20,
      life: 0.45,
      maxLife: 0.45,
      color: '#38bdf8',
      alpha: 0.8,
      type: 'water_ripple',
      shape: 'ring',
    });

    this.addParticle({
      x,
      y,
      vx: 0,
      vy: 0,
      drag: 1,
      size: 1,
      startSize: 1,
      endSize: 12,
      life: 0.35,
      maxLife: 0.35,
      color: '#7dd3fc',
      alpha: 0.9,
      type: 'water_ripple',
      shape: 'ring',
    });

    // White water droplet splashes
    for (let i = 0; i < 8; i++) {
      const ang = Math.random() * Math.PI * 2;
      const speed = 25 + Math.random() * 45;
      const life = 0.25 + Math.random() * 0.2;

      this.addParticle({
        x,
        y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        drag: 0.9,
        gravity: 50,
        size: 2,
        startSize: 2.5,
        endSize: 1,
        life,
        maxLife: life,
        color: '#e0f2fe',
        alpha: 0.9,
        type: 'dust',
        shape: 'circle',
      });
    }
  }

  /**
   * 7. MUZZLE FLASH
   * Directional flame cone + muzzle gas puff
   */
  public emitMuzzleFlash(x: number, y: number, angle: number, isHeavy: boolean = false) {
    const count = isHeavy ? 12 : 7;
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 0.45;
      const speed = 80 + Math.random() * 110;
      const life = 0.11 + Math.random() * 0.05;

      this.addParticle({
        x,
        y,
        vx: Math.cos(angle + spread) * speed,
        vy: Math.sin(angle + spread) * speed,
        drag: 0.88,
        size: 3,
        startSize: 3 + Math.random() * 2,
        endSize: 6 + Math.random() * 3,
        life,
        maxLife: life,
        color: Math.random() < 0.6 ? '#fef08a' : '#f97316',
        alpha: 1.0,
        type: 'flame',
        shape: 'circle',
      });
    }

    // Small smoke puff
    this.addParticle({
      x: x + Math.cos(angle) * 4,
      y: y + Math.sin(angle) * 4,
      vx: Math.cos(angle) * 20,
      vy: Math.sin(angle) * 20 - 5,
      drag: 0.85,
      size: 4,
      startSize: 4,
      endSize: 12,
      life: 0.25,
      maxLife: 0.25,
      color: '#475569',
      alpha: 0.6,
      type: 'smoke',
      shape: 'circle',
    });
  }

  /**
   * 8. MISSILE SMOKE TRAIL
   */
  public emitMissileTrail(x: number, y: number) {
    this.addParticle({
      x,
      y,
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15,
      drag: 0.9,
      size: 4,
      startSize: 4,
      endSize: 9,
      life: 0.3,
      maxLife: 0.3,
      color: Math.random() < 0.5 ? '#fb923c' : '#64748b',
      alpha: 0.75,
      type: 'smoke',
      shape: 'circle',
    });
  }

  /**
   * 9. SPAWN BURST
   */
  public emitSpawnBurst(x: number, y: number, color: string) {
    // Ring of warp sparks
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      const speed = 45;
      const life = 0.4;

      this.addParticle({
        x,
        y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        drag: 0.93,
        size: 3,
        startSize: 4,
        endSize: 1,
        life,
        maxLife: life,
        color,
        alpha: 1.0,
        type: 'spark',
        shape: 'spark_line',
      });
    }

    // Central flash
    this.addParticle({
      x,
      y,
      vx: 0,
      vy: 0,
      drag: 1,
      size: 4,
      startSize: 4,
      endSize: 24,
      life: 0.25,
      maxLife: 0.25,
      color,
      alpha: 0.8,
      type: 'shockwave',
      shape: 'ring',
    });
  }

  /**
   * 10. BASE SHIELD IMPACT & DEFLECTION
   * Electric matrix ripples, ricochet spark arcs, and energy flash
   */
  public emitBaseShieldImpact(x: number, y: number, bulletVx: number, bulletVy: number, shieldColor: string = '#38bdf8') {
    // Shield flash ring
    this.addParticle({
      x,
      y,
      vx: 0,
      vy: 0,
      drag: 1,
      size: 4,
      startSize: 4,
      endSize: 28,
      life: 0.2,
      maxLife: 0.2,
      color: shieldColor,
      alpha: 0.95,
      type: 'shockwave',
      shape: 'ring',
    });

    // Electric plasma sparks
    const spd = Math.hypot(bulletVx, bulletVy) || 1;
    const nx = -bulletVx / spd;
    const ny = -bulletVy / spd;
    const baseAngle = Math.atan2(ny, nx);

    for (let i = 0; i < 14; i++) {
      const spread = (Math.random() - 0.5) * 1.6;
      const velocity = 80 + Math.random() * 120;
      const life = 0.18 + Math.random() * 0.15;

      this.addParticle({
        x,
        y,
        vx: Math.cos(baseAngle + spread) * velocity,
        vy: Math.sin(baseAngle + spread) * velocity,
        drag: 0.91,
        size: 2.5,
        startSize: 3,
        endSize: 1,
        life,
        maxLife: life,
        color: Math.random() < 0.4 ? '#ffffff' : shieldColor,
        alpha: 1.0,
        type: 'spark',
        shape: 'spark_line',
      });
    }
  }

  /**
   * 11. BASE SHIELD OVERLOAD / BREAK
   * Dramatic energetic collapse ring and shattering plasma nodes
   */
  public emitShieldBreak(cx: number, cy: number, radius: number = 58, color: string = '#06b6d4') {
    // Large collapsing shockwave
    this.addParticle({
      x: cx,
      y: cy,
      vx: 0,
      vy: 0,
      drag: 1,
      size: radius,
      startSize: radius * 0.9,
      endSize: radius * 1.5,
      life: 0.35,
      maxLife: 0.35,
      color,
      alpha: 0.9,
      type: 'shockwave',
      shape: 'ring',
    });

    // 24 Radial discharge sparks around the perimeter
    for (let i = 0; i < 24; i++) {
      const ang = (i / 24) * Math.PI * 2;
      const px = cx + Math.cos(ang) * radius;
      const py = cy + Math.sin(ang) * radius;
      const speed = 40 + Math.random() * 60;
      const life = 0.3 + Math.random() * 0.2;

      this.addParticle({
        x: px,
        y: py,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        drag: 0.92,
        size: 3,
        startSize: 3,
        endSize: 1,
        life,
        maxLife: life,
        color: Math.random() < 0.5 ? '#ffffff' : color,
        alpha: 1.0,
        type: 'spark',
        shape: 'spark_line',
      });
    }
  }

  /**
   * 12. BASE UPGRADE CELEBRATION BURST
   * Ascending energy streams, double expanding ring, and celebratory sparkles
   */
  public emitBaseUpgradeBurst(cx: number, cy: number, color: string = '#facc15') {
    // Double shockwaves
    this.addParticle({
      x: cx,
      y: cy,
      vx: 0,
      vy: 0,
      drag: 1,
      size: 10,
      startSize: 10,
      endSize: 75,
      life: 0.45,
      maxLife: 0.45,
      color: '#ffffff',
      alpha: 1.0,
      type: 'shockwave',
      shape: 'ring',
    });

    this.addParticle({
      x: cx,
      y: cy,
      vx: 0,
      vy: 0,
      drag: 1,
      size: 12,
      startSize: 12,
      endSize: 85,
      life: 0.6,
      maxLife: 0.6,
      color,
      alpha: 0.85,
      type: 'shockwave',
      shape: 'ring',
    });

    // 32 Golden energetic particles bursting outward and upward
    for (let i = 0; i < 32; i++) {
      const ang = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 120;
      const life = 0.5 + Math.random() * 0.35;

      this.addParticle({
        x: cx,
        y: cy,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed - 35, // biased upwards
        drag: 0.94,
        gravity: 20,
        size: 3.5,
        startSize: 4,
        endSize: 1.5,
        life,
        maxLife: life,
        color: Math.random() < 0.4 ? '#ffffff' : color,
        alpha: 1.0,
        type: 'spark',
        shape: 'spark_line',
      });
    }
  }

  // --- Update Physics Loop ---
  public update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        p.dead = true;
        continue;
      }

      // Physics integration
      p.vx *= p.drag;
      p.vy *= p.drag;

      if (p.gravity) {
        p.vy += p.gravity * dt;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.vRot && p.angle !== undefined) {
        p.angle += p.vRot * dt;
      }

      // Progress curve
      const progress = 1 - Math.max(0, p.life / p.maxLife);

      // Interpolate size
      p.size = p.startSize + (p.endSize - p.startSize) * progress;

      // Interpolate alpha
      if (p.type === 'shockwave' || p.type === 'water_ripple') {
        p.alpha = Math.max(0, (1 - progress) * 0.9);
      } else if (p.type === 'flash') {
        p.alpha = Math.max(0, 1 - progress);
      } else if (p.type === 'smoke' || p.type === 'dust') {
        p.alpha = Math.max(0, (1 - progress) * 0.65);
      } else {
        p.alpha = Math.max(0, 1 - progress);
      }
    }

    // Clean up dead particles
    this.particles = this.particles.filter(p => !p.dead);
  }

  // --- Render Pipeline ---
  public render(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      if (p.dead) continue;
      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.shape === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.type === 'water_ripple' ? 1.5 : 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'rect') {
        // Spinning rectangular shard / debris
        ctx.translate(p.x, p.y);
        if (p.angle !== undefined) ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        const w = p.width || p.size;
        const h = p.height || p.size * 0.7;
        ctx.fillRect(-w / 2, -h / 2, w, h);
      } else if (p.shape === 'spark_line') {
        // High-speed spark streak drawn along velocity vector
        const spd = Math.hypot(p.vx, p.vy);
        const streakLen = Math.min(10, Math.max(3, spd * 0.05));
        const ang = Math.atan2(p.vy, p.vx);

        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - Math.cos(ang) * streakLen, p.y - Math.sin(ang) * streakLen);
        ctx.stroke();
      } else {
        // Soft circle / flame / smoke / dust
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}

export const particleSystem = new ParticleSystem();
