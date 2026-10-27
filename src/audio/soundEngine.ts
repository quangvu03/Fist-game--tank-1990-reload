/**
 * Procedural Web Audio synthesizer for arcade tank battle sounds
 * Zero external audio assets required; zero latency; 100% crash-proof.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.6;
  private initialized: boolean = false;

  constructor() {
    try {
      const savedMute = localStorage.getItem('tank_game_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
    } catch {
      // LocalStorage blocked
    }
  }

  private init() {
    if (this.initialized && this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0.0001 : Math.max(0.0001, this.volume), this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch {
      // AudioContext unavailable or blocked
    }
  }

  private resumeCtx() {
    try {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {
      // Ignore
    }
  }

  public resumeAudio() {
    this.resumeCtx();
  }

  public setMuted(muted: boolean) {
    try {
      this.isMuted = muted;
      localStorage.setItem('tank_game_muted', String(muted));
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(muted ? 0.0001 : Math.max(0.0001, this.volume), this.ctx.currentTime);
      }
    } catch {
      // Ignore
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public setVolume(vol: number) {
    try {
      this.volume = Math.max(0, Math.min(1, vol));
      if (this.masterGain && this.ctx && !this.isMuted) {
        this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.volume), this.ctx.currentTime);
      }
    } catch {
      // Ignore
    }
  }

  // --- Cannon Shoot Sound ---
  public playShoot(isPlayer: boolean = true, isHeavy: boolean = false) {
    if (this.isMuted) return;
    try {
      this.resumeCtx();
      if (!this.ctx || !this.masterGain) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isHeavy ? 'triangle' : 'square';
      const startFreq = isPlayer ? (isHeavy ? 180 : 260) : 150;
      const endFreq = 40;

      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.12);

      gain.gain.setValueAtTime(isPlayer ? 0.28 : 0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

      // Noise punch
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isHeavy ? 800 : 1800, t);
      filter.frequency.exponentialRampToValueAtTime(200, t + 0.08);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(isHeavy ? 0.35 : 0.22, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      osc.connect(gain);
      gain.connect(this.masterGain);

      noise.start(t);
      osc.start(t);
      osc.stop(t + 0.13);
    } catch {
      // Audio failure safe guard
    }
  }

  // --- Bullet Hit Steel / Ricochet ---
  public playHitMetal() {
    if (this.isMuted) return;
    try {
      this.resumeCtx();
      if (!this.ctx || !this.masterGain) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(1400, t + 0.05);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.06);
    } catch {
      // Safe guard
    }
  }

  // --- Wooden Crate Break & Splinter Sound (Âm thanh vỡ thùng gỗ tiếp tế) ---
  public playBrickCrumble() {
    if (this.isMuted) return;
    try {
      this.resumeCtx();
      if (!this.ctx || !this.masterGain) return;

      const t = this.ctx.currentTime;

      // 1. Hollow wooden box impact thud
      const woodOsc = this.ctx.createOscillator();
      const woodGain = this.ctx.createGain();
      woodOsc.type = 'triangle';
      woodOsc.frequency.setValueAtTime(210, t);
      woodOsc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
      woodGain.gain.setValueAtTime(0.3, t);
      woodGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      woodOsc.connect(woodGain);
      woodGain.connect(this.masterGain);
      woodOsc.start(t);
      woodOsc.stop(t + 0.1);

      // 2. Crisp wood fracture noise burst
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.11);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.6);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(950, t);
      filter.Q.setValueAtTime(2.2, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.32, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(t);
    } catch {
      // Safe guard
    }
  }

  // --- Tank Explosion Sound ---
  public playExplosion(isLarge: boolean = false) {
    if (this.isMuted) return;
    try {
      this.resumeCtx();
      if (!this.ctx || !this.masterGain) return;

      const t = this.ctx.currentTime;
      const duration = isLarge ? 0.55 : 0.35;

      // Sub rumble
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(isLarge ? 90 : 130, t);
      subOsc.frequency.exponentialRampToValueAtTime(25, t + duration);

      subGain.gain.setValueAtTime(isLarge ? 0.45 : 0.35, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      subOsc.connect(subGain);
      subGain.connect(this.masterGain);
      subOsc.start(t);
      subOsc.stop(t + duration);

      // Noise blast
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isLarge ? 1200 : 900, t);
      filter.frequency.exponentialRampToValueAtTime(100, t + duration);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(isLarge ? 0.4 : 0.3, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      noise.start(t);
    } catch {
      // Safe guard
    }
  }

  // --- Tactical Fuel Barrel Detonation Sound ---
  public playBarrelExplosion() {
    if (this.isMuted) return;
    try {
      this.resumeCtx();
      if (!this.ctx || !this.masterGain) return;

      const t = this.ctx.currentTime;
      const duration = 0.48;

      // 1. High-pressure canister metal rupture crack
      const metalOsc = this.ctx.createOscillator();
      const metalGain = this.ctx.createGain();
      metalOsc.type = 'sawtooth';
      metalOsc.frequency.setValueAtTime(480, t);
      metalOsc.frequency.exponentialRampToValueAtTime(80, t + 0.12);
      metalGain.gain.setValueAtTime(0.35, t);
      metalGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      metalOsc.connect(metalGain);
      metalGain.connect(this.masterGain);
      metalOsc.start(t);
      metalOsc.stop(t + 0.12);

      // 2. Heavy Sub-bass Concussive Shockwave
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(160, t);
      subOsc.frequency.exponentialRampToValueAtTime(25, t + duration);
      subGain.gain.setValueAtTime(0.48, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      subOsc.connect(subGain);
      subGain.connect(this.masterGain);
      subOsc.start(t);
      subOsc.stop(t + duration);

      // 3. Fiery roar noise burst
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.2);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100, t);
      filter.frequency.exponentialRampToValueAtTime(140, t + duration);
      filter.Q.setValueAtTime(1.8, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.45, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      noise.start(t);
    } catch {
      // Safe guard
    }
  }

  // --- Power-Up Picked Up ---
  public playPowerUp() {
    if (this.isMuted) return;
    try {
      this.resumeCtx();
      if (!this.ctx || !this.masterGain) return;

      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.05);

        gain.gain.setValueAtTime(0.001, t + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.25, t + idx * 0.05 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.12);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t + idx * 0.05);
        osc.stop(t + idx * 0.05 + 0.13);
      });
    } catch {
      // Safe guard
    }
  }

  // --- Base Warning Siren ---
  public playBaseAlert() {
    if (this.isMuted) return;
    try {
      this.resumeCtx();
      if (!this.ctx || !this.masterGain) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.linearRampToValueAtTime(800, t + 0.1);
      osc.frequency.linearRampToValueAtTime(600, t + 0.2);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.22);
    } catch {
      // Safe guard
    }
  }

  // --- Base Shield Deflection Zap ---
  public playShieldDeflect() {
    if (this.isMuted) return;
    try {
      this.resumeCtx();
      if (!this.ctx || !this.masterGain) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.exponentialRampToValueAtTime(700, t + 0.08);

      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.09);
    } catch {
      // Safe guard
    }
  }

  // --- Base Shield Break Sound ---
  public playShieldBreak() {
    if (this.isMuted) return;
    try {
      this.resumeCtx();
      if (!this.ctx || !this.masterGain) return;

      const t = this.ctx.currentTime;
      // High-to-low electrical discharge buzz
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(950, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.25);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.28);
    } catch {
      // Safe guard
    }
  }

  // --- Base Shield Recharge Hum ---
  public playShieldRecharge() {
    if (this.isMuted) return;
    try {
      this.resumeCtx();
      if (!this.ctx || !this.masterGain) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.18);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch {
      // Safe guard
    }
  }

  // --- Base Upgrade Fanfare ---
  public playBaseUpgrade() {
    if (this.isMuted) return;
    try {
      this.resumeCtx();
      if (!this.ctx || !this.masterGain) return;

      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);

        gain.gain.setValueAtTime(0.25, t + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.22);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.22);
      });
    } catch {
      // Safe guard
    }
  }

  // --- Base Destroyed ---
  public playBaseDestroyed() {
    if (this.isMuted) return;
    try {
      this.resumeCtx();
      if (!this.ctx || !this.masterGain) return;

      this.playExplosion(true);
      const t = this.ctx.currentTime + 0.1;
      const notes = [330, 293, 261, 196];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.15);

        gain.gain.setValueAtTime(0.2, t + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.15 + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t + idx * 0.15);
        osc.stop(t + idx * 0.15 + 0.3);
      });
    } catch {
      // Safe guard
    }
  }

  // --- Victory Fanfare ---
  public playVictory() {
    if (this.isMuted) return;
    try {
      this.resumeCtx();
      if (!this.ctx || !this.masterGain) return;

      const t = this.ctx.currentTime;
      const notes = [
        { f: 392, d: 0.1 },
        { f: 523.25, d: 0.1 },
        { f: 659.25, d: 0.1 },
        { f: 783.99, d: 0.12 },
        { f: 659.25, d: 0.08 },
        { f: 1046.5, d: 0.4 },
      ];

      let offset = 0;
      notes.forEach((item) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(item.f, t + offset);

        gain.gain.setValueAtTime(0.25, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + item.d + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t + offset);
        osc.stop(t + offset + item.d + 0.05);
        offset += item.d;
      });
    } catch {
      // Safe guard
    }
  }

  // --- Defeat Sound ---
  public playDefeat() {
    if (this.isMuted) return;
    try {
      this.resumeCtx();
      if (!this.ctx || !this.masterGain) return;

      const t = this.ctx.currentTime;
      const freqs = [392, 370, 349, 311];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t + idx * 0.2);

        gain.gain.setValueAtTime(0.2, t + idx * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.2 + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t + idx * 0.2);
        osc.stop(t + idx * 0.2 + 0.3);
      });
    } catch {
      // Safe guard
    }
  }
}

export const soundEngine = new SoundEngine();
