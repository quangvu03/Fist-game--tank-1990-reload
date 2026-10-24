import { WeatherType } from '../types/game';
import { CANVAS_SIZE } from './constants';

export interface WeatherConfig {
  type: WeatherType;
  name: string;
  badge: string;
  icon: string;
  speedMultiplier: number;
  description: string;
}

export const WEATHER_CONFIGS: Record<WeatherType, WeatherConfig> = {
  CLEAR: {
    type: 'CLEAR',
    name: 'Quang đãng (Tắt hiệu ứng)',
    badge: 'TẮT',
    icon: '☀️',
    speedMultiplier: 1.0,
    description: 'Không có mưa/tuyết, tập trung tối đa cho người chơi.',
  },
  RAIN: {
    type: 'RAIN',
    name: 'Mưa nhẹ',
    badge: 'MƯA NHẸ',
    icon: '🌧️',
    speedMultiplier: 0.95,
    description: 'Hạt mưa dịu nhẹ, không che khuất đường đạn.',
  },
  SNOW: {
    type: 'SNOW',
    name: 'Tuyết nhẹ',
    badge: 'TUYẾT RƠI',
    icon: '❄️',
    speedMultiplier: 0.92,
    description: 'Bông tuyết êm đềm, hạn chế tối đa rối mắt.',
  },
};

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  alpha: number;
}

interface SnowFlake {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  driftSpeed: number;
  driftOffset: number;
  alpha: number;
}

interface WaterRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
}

export class WeatherSystem {
  public currentWeather: WeatherType = 'CLEAR';
  public isEnabled: boolean = false;
  public width: number = CANVAS_SIZE;
  public height: number = CANVAS_SIZE;
  private cycleTimer: number = 0;
  private readonly cycleDuration: number = 60;

  private raindrops: RainDrop[] = [];
  private snowflakes: SnowFlake[] = [];
  private ripples: WaterRipple[] = [];

  constructor() {
    // Check saved preference (default: false for maximum player focus)
    try {
      const saved = localStorage.getItem('tank_weather_enabled');
      if (saved === 'true') {
        this.isEnabled = true;
        this.currentWeather = 'RAIN';
      }
    } catch {
      // Ignore
    }
    this.initParticles();
  }

  public setBounds(w: number, h: number) {
    if (this.width !== w || this.height !== h) {
      this.width = Math.max(CANVAS_SIZE, w);
      this.height = Math.max(CANVAS_SIZE, h);
      this.initParticles();
    }
  }

  private initParticles() {
    // Subtle, low-density particle count to avoid visual clutter and eye strain
    this.raindrops = [];
    for (let i = 0; i < 45; i++) {
      this.raindrops.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        length: 8 + Math.random() * 8,
        speed: 260 + Math.random() * 140,
        alpha: 0.18 + Math.random() * 0.22, // Faint, translucent
      });
    }

    this.snowflakes = [];
    for (let i = 0; i < 35; i++) {
      this.snowflakes.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: 1.0 + Math.random() * 1.6,
        speedY: 28 + Math.random() * 25,
        driftSpeed: 1.0 + Math.random() * 1.5,
        driftOffset: Math.random() * Math.PI * 2,
        alpha: 0.25 + Math.random() * 0.25, // Soft, gentle
      });
    }
  }

  public setWeather(type: WeatherType) {
    this.currentWeather = type;
    this.isEnabled = type !== 'CLEAR';
    try {
      localStorage.setItem('tank_weather_enabled', String(this.isEnabled));
    } catch {
      // Ignore
    }
    this.cycleTimer = 0;
  }

  /**
   * One-click cycle: Tắt -> Mưa nhẹ -> Tuyết nhẹ -> Tắt
   */
  public toggleWeather(): { enabled: boolean; type: WeatherType } {
    if (!this.isEnabled) {
      this.isEnabled = true;
      this.currentWeather = 'RAIN';
    } else if (this.currentWeather === 'RAIN') {
      this.currentWeather = 'SNOW';
    } else {
      this.isEnabled = false;
      this.currentWeather = 'CLEAR';
    }

    try {
      localStorage.setItem('tank_weather_enabled', String(this.isEnabled));
    } catch {
      // Ignore
    }

    return { enabled: this.isEnabled, type: this.currentWeather };
  }

  public getSpeedMultiplier(): number {
    if (!this.isEnabled || this.currentWeather === 'CLEAR') return 1.0;
    return WEATHER_CONFIGS[this.currentWeather].speedMultiplier;
  }

  public update(dt: number) {
    if (!this.isEnabled || this.currentWeather === 'CLEAR') return;

    this.cycleTimer += dt;
    if (this.cycleTimer >= this.cycleDuration) {
      this.cycleTimer = 0;
      // Cycle between rain and snow only when weather is enabled
      this.currentWeather = this.currentWeather === 'RAIN' ? 'SNOW' : 'RAIN';
    }

    if (this.currentWeather === 'RAIN') {
      for (const drop of this.raindrops) {
        drop.y += drop.speed * dt;
        drop.x -= drop.speed * 0.18 * dt;

        if (drop.y > this.height) {
          drop.y = -8;
          drop.x = Math.random() * (this.width + 60);

          if (Math.random() < 0.15) {
            this.ripples.push({
              x: drop.x,
              y: this.height - Math.random() * 30,
              radius: 1,
              maxRadius: 3 + Math.random() * 3,
              life: 0.25,
              maxLife: 0.25,
            });
          }
        }
      }

      for (const rip of this.ripples) {
        rip.life -= dt;
        rip.radius += (rip.maxRadius - rip.radius) * 8 * dt;
      }
      this.ripples = this.ripples.filter((r) => r.life > 0);
    } else if (this.currentWeather === 'SNOW') {
      for (const flake of this.snowflakes) {
        flake.y += flake.speedY * dt;
        flake.driftOffset += flake.driftSpeed * dt;
        flake.x += Math.sin(flake.driftOffset) * 14 * dt;

        if (flake.y > this.height) {
          flake.y = -4;
          flake.x = Math.random() * this.width;
        }
        if (flake.x < -10) flake.x = this.width + 5;
        if (flake.x > this.width + 10) flake.x = -5;
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (!this.isEnabled || this.currentWeather === 'CLEAR') return;

    ctx.save();

    if (this.currentWeather === 'RAIN') {
      ctx.lineWidth = 1.0;
      ctx.lineCap = 'round';

      for (const drop of this.raindrops) {
        ctx.strokeStyle = `rgba(186, 230, 253, ${drop.alpha})`;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.length * 0.18, drop.y + drop.length);
        ctx.stroke();
      }

      for (const rip of this.ripples) {
        const progress = 1 - rip.life / rip.maxLife;
        const alpha = (1 - progress) * 0.3;
        ctx.strokeStyle = `rgba(186, 230, 253, ${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(rip.x, rip.y, rip.radius * 1.3, rip.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (this.currentWeather === 'SNOW') {
      for (const flake of this.snowflakes) {
        ctx.fillStyle = `rgba(241, 245, 249, ${flake.alpha})`;
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

export const weatherSystem = new WeatherSystem();
