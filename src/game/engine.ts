import {
  Direction,
  EnemyType,
  TileType,
  Tank,
  Bullet,
  PowerUp,
  PowerUpType,
  FloatText,
  TrackMark,
  StageConfig,
  GameStats,
  ControlMode,
  GameMode,
  WeatherType,
} from '../types/game';
import {
  GRID_COLS,
  GRID_ROWS,
  TILE_SIZE,
  CANVAS_SIZE,
  TANK_SIZE,
  BULLET_RADIUS,
  MISSILE_RADIUS,
  ENEMY_CONFIGS,
  PLAYER_TIERS,
  DIR_VECTORS,
  BASE_TIERS,
  BASE_CENTER,
  BASE_SHIELD_RADIUS,
} from './constants';
import { soundEngine } from '../audio/soundEngine';
import { particleSystem } from './particleSystem';
import { weatherSystem } from './weatherSystem';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private terrainCanvas: HTMLCanvasElement;

  // Game state
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  public currentStageConfig: StageConfig;
  public gameMode: GameMode = 'CAMPAIGN';
  public controlMode: ControlMode = 'CLASSIC';

  // Grid & Base Systems
  public grid: number[][] = [];
  public baseHp: number = 2;
  public isBaseDestroyed: boolean = false;
  public baseTier: number = 1;
  public baseShieldHp: number = 0;
  public baseShieldMaxHp: number = 0;
  public baseTurretAngle: number = -Math.PI / 2;
  public baseAutoTurretCooldown: number = 0;
  private shieldOutOfCombatTimer: number = 0;
  private shieldHitFlashTimer: number = 0;
  private wallHealthMap: Map<string, number> = new Map();
  private shovelTimer: number = 0;
  private clockFreezeTimer: number = 0;

  // Entities
  public player: Tank | null = null;
  public enemies: Tank[] = [];
  public enemyQueue: EnemyType[] = [];
  public bullets: Bullet[] = [];
  public trackMarks: TrackMark[] = [];
  public powerUps: PowerUp[] = [];
  public floatTexts: FloatText[] = [];

  // Spawning
  private spawnPoints = [
    { x: 1 * TILE_SIZE, y: 1 * TILE_SIZE },
    { x: 12 * TILE_SIZE, y: 1 * TILE_SIZE },
    { x: 23 * TILE_SIZE, y: 1 * TILE_SIZE },
  ];
  private nextSpawnIndex: number = 0;
  private spawnCooldown: number = 1.0;

  // Death / Stage state guards
  private isPlayerDying: boolean = false;
  private isStageEnding: boolean = false;

  // Stats
  public stats: GameStats = {
    score: 0,
    highScore: 0,
    lives: 3,
    playerHp: 3,
    playerMaxHp: 3,
    playerTier: 1,
    stage: 1,
    totalStages: 10,
    kills: { SCOUT: 0, ASSAULT: 0, HEAVY: 0, ARTILLERY: 0, BOSS: 0 },
    totalKills: 0,
    baseHp: 2,
    baseMaxHp: 2,
    baseTier: 1,
    baseTierName: 'Căn Cứ Gạch Thường',
    baseShieldHp: 0,
    baseShieldMaxHp: 0,
    baseShieldActive: false,
    baseUpgradeCost: 800,
    canUpgradeBase: false,
    powerUpsCollected: 0,
    gameMode: 'CAMPAIGN',
    weather: 'CLEAR',
    isWeatherEnabled: weatherSystem.isEnabled,
  };

  // Juiciness & Game Feel
  private hitstopTimer: number = 0;
  private cameraShake: number = 0;
  private shakeOffsetX: number = 0;
  private shakeOffsetY: number = 0;

  // Input
  private keysHeld: Record<string, boolean> = {};
  public mousePos = { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 };
  private mouseAimActive: boolean = false;

  // Callbacks to UI
  private onStatsUpdate?: (stats: GameStats, remainingEnemies: number) => void;
  private onGameOver?: (won: boolean) => void;
  private onStageClear?: () => void;

  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private lastStatSyncTime: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    stageConfig: StageConfig,
    gameMode: GameMode,
    callbacks: {
      onStatsUpdate?: (stats: GameStats, remainingEnemies: number) => void;
      onGameOver?: (won: boolean) => void;
      onStageClear?: () => void;
    }
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;

    this.currentStageConfig = stageConfig;
    this.gameMode = gameMode;
    this.stats.gameMode = gameMode;
    this.stats.stage = stageConfig.id;

    // Load high score
    try {
      const savedHi = localStorage.getItem('tank_game_highscore');
      if (savedHi) this.stats.highScore = parseInt(savedHi, 10) || 0;
    } catch {
      // Ignore
    }

    this.onStatsUpdate = callbacks.onStatsUpdate;
    this.onGameOver = callbacks.onGameOver;
    this.onStageClear = callbacks.onStageClear;

    this.terrainCanvas = this.generateTerrainCanvas();
    this.initListeners();
    this.resetStage(stageConfig);
  }

  public resetStage(stageConfig: StageConfig, preservePlayerUpgrade: boolean = true) {
    this.currentStageConfig = stageConfig;
    this.stats.stage = stageConfig.id;

    // Clone grid
    this.grid = stageConfig.grid.map(row => [...row]);

    // Progressive base tiering based on stage advancement ("càng về sau căn cứ càng cứng hơn")
    let naturalStageTier = 1;
    if (this.gameMode === 'CAMPAIGN') {
      if (stageConfig.id >= 9) naturalStageTier = 5;
      else if (stageConfig.id >= 7) naturalStageTier = 4;
      else if (stageConfig.id >= 5) naturalStageTier = 3;
      else if (stageConfig.id >= 3) naturalStageTier = 2;
      else naturalStageTier = 1;
    } else if (this.gameMode === 'SURVIVAL') {
      naturalStageTier = Math.min(5, 1 + Math.floor((stageConfig.id - 1) / 2));
    } else {
      naturalStageTier = 4; // Boss rush provides tier 4 fortress
    }

    // Preserve player upgrades if they previously upgraded the base to a higher tier
    const finalTier = Math.max(naturalStageTier, this.baseTier);
    this.applyBaseTier(finalTier, false);

    this.isBaseDestroyed = false;
    this.isStageEnding = false;
    this.isPlayerDying = false;
    this.shovelTimer = 0;
    this.clockFreezeTimer = 0;
    this.shieldOutOfCombatTimer = 10;
    this.shieldHitFlashTimer = 0;

    // Clear particles
    particleSystem.clear();

    // Clone enemy queue
    this.enemyQueue = [...stageConfig.enemies];
    this.enemies = [];
    this.bullets = [];
    this.powerUps = [];
    this.floatTexts = [];
    this.trackMarks = [];

    // Player spawn
    const prevTier = (preservePlayerUpgrade && this.player) ? this.player.tier : 0;
    this.spawnPlayer(prevTier);

    this.spawnCooldown = 0.5;
    this.syncStats();
  }

  public applyBaseTier(tier: number, isUpgrade: boolean = false) {
    this.baseTier = Math.max(1, Math.min(5, tier));
    const cfg = BASE_TIERS[this.baseTier - 1];

    this.baseHp = cfg.maxHp;
    this.stats.baseHp = cfg.maxHp;
    this.stats.baseMaxHp = cfg.maxHp;
    this.baseShieldMaxHp = cfg.maxShield;
    this.baseShieldHp = cfg.maxShield;
    this.stats.baseTier = this.baseTier;
    this.stats.baseTierName = cfg.name;
    this.stats.baseShieldHp = cfg.maxShield;
    this.stats.baseShieldMaxHp = cfg.maxShield;
    this.stats.baseShieldActive = cfg.maxShield > 0;
    this.stats.baseUpgradeCost = cfg.upgradeCost;
    this.stats.canUpgradeBase = this.baseTier < 5 && this.stats.score >= cfg.upgradeCost;

    // Apply hardened perimeter walls around base footprint (cols 11-14, rows 23-25)
    for (let c = 11; c <= 14; c++) {
      this.grid[23][c] = cfg.wallType;
    }
    this.grid[24][11] = cfg.wallType;
    this.grid[25][11] = cfg.wallType;
    this.grid[24][14] = cfg.wallType;
    this.grid[25][14] = cfg.wallType;

    // Ensure base tiles are intact
    if (!this.isBaseDestroyed) {
      this.grid[24][12] = TileType.BASE;
      this.grid[24][13] = TileType.BASE;
      this.grid[25][12] = TileType.BASE;
      this.grid[25][13] = TileType.BASE;
    }

    // Reset wall durability map
    this.wallHealthMap.clear();

    // Prevent any tanks from being trapped inside the newly restored perimeter walls
    this.ejectTanksFromBasePerimeter();

    if (isUpgrade) {
      soundEngine.playBaseUpgrade();
      particleSystem.emitBaseUpgradeBurst(BASE_CENTER.x, BASE_CENTER.y, cfg.shieldColor);
      this.addFloatText(
        BASE_CENTER.x,
        BASE_CENTER.y - 28,
        `NÂNG CẤP CĂN CỨ: ${cfg.badge}!`,
        cfg.color
      );
      this.addCameraShake(4);
    }
  }

  public upgradeBase(): boolean {
    if (this.baseTier >= 5) {
      this.addFloatText(BASE_CENTER.x, BASE_CENTER.y - 15, 'CĂN CỨ ĐÃ ĐẠT CẤP TỐI ĐA!', '#38bdf8');
      return false;
    }

    const currentCfg = BASE_TIERS[this.baseTier - 1];
    if (this.stats.score < currentCfg.upgradeCost) {
      const needed = currentCfg.upgradeCost - this.stats.score;
      this.addFloatText(
        BASE_CENTER.x,
        BASE_CENTER.y - 15,
        `THIẾU ${needed.toLocaleString()} ĐIỂM ĐỂ NÂNG CẤP!`,
        '#f87171'
      );
      return false;
    }

    // Deduct cost and upgrade
    this.stats.score -= currentCfg.upgradeCost;
    this.applyBaseTier(this.baseTier + 1, true);
    this.syncStats();
    return true;
  }

  private initListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
  }

  public destroy() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    particleSystem.clear();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keysHeld[e.code] = true;

    // Direct fire on space
    if (e.code === 'Space') {
      e.preventDefault();
      this.firePlayerBullet();
    }

    // Upgrade base hotkey 'U'
    if (e.code === 'KeyU') {
      e.preventDefault();
      this.upgradeBase();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keysHeld[e.code] = false;
  };

  private handleBlur = () => {
    this.keysHeld = {};
  };

  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this.mousePos = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
    this.mouseAimActive = true;
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      this.firePlayerBullet();
    }
  };

  public setControlMode(mode: ControlMode) {
    this.controlMode = mode;
  }

  public simulateVirtualInput(action: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'FIRE', isHeld: boolean) {
    const codeMap: Record<string, string> = {
      UP: 'KeyW',
      DOWN: 'KeyS',
      LEFT: 'KeyA',
      RIGHT: 'KeyD',
      FIRE: 'Space',
    };
    const code = codeMap[action];
    if (!code) return;
    this.keysHeld[code] = isHeld;
    if (action === 'FIRE' && isHeld) {
      this.firePlayerBullet();
    }
  }

  // --- Spawning ---
  private spawnPlayer(tier: number = 0) {
    const playerTierConfig = PLAYER_TIERS[Math.min(tier, PLAYER_TIERS.length - 1)];
    const spawnX = 9 * TILE_SIZE;
    const spawnY = 24 * TILE_SIZE;

    this.player = {
      id: 'player',
      type: 'PLAYER',
      x: spawnX,
      y: spawnY,
      width: TANK_SIZE,
      height: TANK_SIZE,
      dir: 'UP',
      turretAngle: -Math.PI / 2,
      speed: playerTierConfig.speed,
      maxHp: playerTierConfig.maxHp,
      hp: playerTierConfig.maxHp,
      tier,
      isPlayer: true,
      isFlashing: false,
      reloadTimer: 0,
      reloadMax: playerTierConfig.reloadMax,
      shieldTime: 3.5,
      frozenTime: 0,
      scoreValue: 0,
      name: playerTierConfig.name,
      color: '#22c55e',
      tracksOffset: 0,
    };

    this.isPlayerDying = false;
    particleSystem.emitSpawnBurst(spawnX + TANK_SIZE / 2, spawnY + TANK_SIZE / 2, '#4ade80');
  }

  private spawnEnemy() {
    if (this.enemyQueue.length === 0) return;
    if (this.enemies.length >= this.currentStageConfig.maxActiveEnemies) return;

    const spawn = this.spawnPoints[this.nextSpawnIndex % this.spawnPoints.length];
    this.nextSpawnIndex++;

    const isBlocked = this.enemies.some(
      e => Math.hypot(e.x - spawn.x, e.y - spawn.y) < TANK_SIZE * 1.1
    ) || (this.player && Math.hypot(this.player.x - spawn.x, this.player.y - spawn.y) < TANK_SIZE * 1.1);

    if (isBlocked) return;

    const enemyType = this.enemyQueue.shift();
    if (!enemyType) return;

    const cfg = ENEMY_CONFIGS[enemyType];
    const isFlashing = Math.random() < 0.28 || enemyType === 'BOSS';
    const isBoss = enemyType === 'BOSS';
    const size = isBoss ? TANK_SIZE * 1.4 : TANK_SIZE;

    const enemy: Tank = {
      id: `enemy_${Date.now()}_${Math.random()}`,
      type: enemyType,
      x: spawn.x,
      y: spawn.y,
      width: size,
      height: size,
      dir: 'DOWN',
      turretAngle: Math.PI / 2,
      speed: cfg.speed,
      maxHp: cfg.hp,
      hp: cfg.hp,
      tier: isBoss ? 3 : 1,
      isPlayer: false,
      isFlashing,
      reloadTimer: Math.random() * 0.8,
      reloadMax: cfg.reloadMax,
      shieldTime: 0,
      frozenTime: 0,
      scoreValue: cfg.scoreValue,
      name: cfg.name,
      color: cfg.color,
      tracksOffset: 0,
      stuckTimer: 0,
      currentDecisionTimer: 0.5 + Math.random() * 1.0,
    };

    this.enemies.push(enemy);
    particleSystem.emitSpawnBurst(spawn.x + size / 2, spawn.y + size / 2, cfg.color);
  }

  // --- Main Game Loop (100% crash-proof & uninterrupted) ---
  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    if (!this.isRunning) {
      this.start();
      return;
    }
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  private loop = (timestamp: number) => {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(this.loop);

    try {
      const rawDt = (timestamp - this.lastTime) / 1000;
      this.lastTime = timestamp;
      const dt = Math.max(0.001, Math.min(rawDt, 0.05));

      if (!this.isPaused) {
        if (this.hitstopTimer > 0) {
          this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
        } else {
          this.update(dt);
        }
      }

      this.render();

      if (timestamp - this.lastStatSyncTime > 100) {
        this.syncStats();
        this.lastStatSyncTime = timestamp;
      }
    } catch (err) {
      console.error('Handled game simulation error:', err);
    }
  };

  // --- Update Simulation ---
  private update(dt: number) {
    // Weather System Update
    weatherSystem.update(dt);

    // Timers
    if (this.shovelTimer > 0) {
      this.shovelTimer -= dt;
      if (this.shovelTimer <= 0) {
        this.restoreBaseFortressToTierWalls();
      }
    }

    if (this.clockFreezeTimer > 0) {
      this.clockFreezeTimer -= dt;
    }

    // Base Shield Hit Flash Timer
    if (this.shieldHitFlashTimer > 0) {
      this.shieldHitFlashTimer = Math.max(0, this.shieldHitFlashTimer - dt);
    }

    // Base Shield Auto-Recharge (Starts after 5s out of combat)
    if (this.baseShieldMaxHp > 0 && !this.isBaseDestroyed) {
      this.shieldOutOfCombatTimer += dt;
      const cfg = BASE_TIERS[this.baseTier - 1];
      if (this.shieldOutOfCombatTimer >= 5.0 && this.baseShieldHp < this.baseShieldMaxHp) {
        const prevShield = this.baseShieldHp;
        this.baseShieldHp = Math.min(this.baseShieldMaxHp, this.baseShieldHp + cfg.shieldRechargeRate * dt);
        if (prevShield <= 0 && this.baseShieldHp > 0) {
          soundEngine.playShieldRecharge();
          this.addFloatText(BASE_CENTER.x, BASE_CENTER.y - 20, 'KHIÊN CĂN CỨ ĐÃ HỒI PHỤC!', cfg.shieldColor);
        }
      }
    }

    // Base Auto-Turret Defense (Tier 3+)
    const currentBaseCfg = BASE_TIERS[this.baseTier - 1];
    if (currentBaseCfg.hasAutoTurret && !this.isBaseDestroyed) {
      this.baseAutoTurretCooldown -= dt;
      let closestEnemy: Tank | null = null;
      let minDistance = 280;

      for (const enemy of this.enemies) {
        if (enemy && enemy.hp > 0) {
          const ex = enemy.x + enemy.width / 2;
          const ey = enemy.y + enemy.height / 2;
          const dist = Math.hypot(ex - BASE_CENTER.x, ey - BASE_CENTER.y);
          if (dist < minDistance) {
            minDistance = dist;
            closestEnemy = enemy;
          }
        }
      }

      if (closestEnemy) {
        const ex = closestEnemy.x + closestEnemy.width / 2;
        const ey = closestEnemy.y + closestEnemy.height / 2;
        this.baseTurretAngle = Math.atan2(ey - BASE_CENTER.y, ex - BASE_CENTER.x);

        if (this.baseAutoTurretCooldown <= 0) {
          this.fireBaseTurret(this.baseTurretAngle, currentBaseCfg.tier >= 4);
          this.baseAutoTurretCooldown = currentBaseCfg.turretFireRate;
        }
      }
    }

    // Camera shake decay
    if (this.cameraShake > 0) {
      this.cameraShake = Math.max(0, this.cameraShake - dt * 18);
      this.shakeOffsetX = (Math.random() * 2 - 1) * this.cameraShake;
      this.shakeOffsetY = (Math.random() * 2 - 1) * this.cameraShake;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }

    // Spawning enemies
    this.spawnCooldown -= dt;
    if (this.spawnCooldown <= 0) {
      this.spawnEnemy();
      this.spawnCooldown = 1.6 + Math.random() * 0.8;
    }

    // Update Player
    if (this.player && this.player.hp > 0 && !this.isPlayerDying) {
      this.updatePlayer(dt);
    }

    // Update Enemies
    for (const enemy of this.enemies) {
      if (enemy && enemy.hp > 0) {
        this.updateEnemy(enemy, dt);
      }
    }

    // Update Bullets
    this.updateBullets(dt);

    // Update Particle System
    particleSystem.update(dt);

    // Update Track marks decay
    for (let i = this.trackMarks.length - 1; i >= 0; i--) {
      this.trackMarks[i].alpha -= dt * 0.04;
      if (this.trackMarks[i].alpha <= 0) {
        this.trackMarks.splice(i, 1);
      }
    }

    // Update PowerUps
    for (const p of this.powerUps) {
      p.duration -= dt;
      p.blinkTimer += dt;
      if (p.duration <= 0) {
        p.dead = true;
        continue;
      }

      if (this.player && this.player.hp > 0 && !this.isPlayerDying) {
        const dist = Math.hypot(
          (this.player.x + this.player.width / 2) - p.x,
          (this.player.y + this.player.height / 2) - p.y
        );
        if (dist < TANK_SIZE * 0.85) {
          this.applyPowerUp(p.type);
          p.dead = true;
        }
      }
    }
    this.powerUps = this.powerUps.filter(p => !p.dead);

    // Update Float Texts
    for (const ft of this.floatTexts) {
      ft.life -= dt;
      ft.y -= dt * 35;
      if (ft.life <= 0) {
        ft.dead = true;
      }
    }
    this.floatTexts = this.floatTexts.filter(ft => !ft.dead);

    // Check Stage Victory
    if (
      this.enemyQueue.length === 0 &&
      this.enemies.length === 0 &&
      !this.isBaseDestroyed &&
      !this.isStageEnding
    ) {
      this.triggerStageClear();
    }
  }

  // --- Player Movement & Corner Smoothing ---
  private updatePlayer(dt: number) {
    if (!this.player) return;

    if (this.player.shieldTime > 0) {
      this.player.shieldTime -= dt;
    }
    if (this.player.reloadTimer > 0) {
      this.player.reloadTimer -= dt;
    }

    let moveX = 0;
    let moveY = 0;

    if (this.keysHeld['KeyW'] || this.keysHeld['ArrowUp']) moveY -= 1;
    if (this.keysHeld['KeyS'] || this.keysHeld['ArrowDown']) moveY += 1;
    if (this.keysHeld['KeyA'] || this.keysHeld['ArrowLeft']) moveX -= 1;
    if (this.keysHeld['KeyD'] || this.keysHeld['ArrowRight']) moveX += 1;

    let isMoving = false;
    let newDir = this.player.dir;

    if (moveX !== 0 || moveY !== 0) {
      isMoving = true;
      if (Math.abs(moveX) > Math.abs(moveY)) {
        moveY = 0;
        newDir = moveX > 0 ? 'RIGHT' : 'LEFT';
      } else {
        moveX = 0;
        newDir = moveY > 0 ? 'DOWN' : 'UP';
      }
    }

    this.player.dir = newDir;

    // Turret aiming
    if (this.controlMode === 'MOUSE_AIM' && this.mouseAimActive) {
      const pCenterX = this.player.x + this.player.width / 2;
      const pCenterY = this.player.y + this.player.height / 2;
      this.player.turretAngle = Math.atan2(this.mousePos.y - pCenterY, this.mousePos.x - pCenterX);
    } else {
      this.player.turretAngle = DIR_VECTORS[this.player.dir].angle;
    }

    if (isMoving) {
      const weatherMod = weatherSystem.getSpeedMultiplier();
      const step = this.player.speed * weatherMod * dt;

      if (moveY !== 0) {
        const nextY = this.player.y + moveY * step;
        if (!this.checkTankCollision(this.player.x, nextY, this.player.width, this.player.height, this.player.id)) {
          this.player.y = nextY;
        } else {
          // Sub-step closer to obstacle to rest flush against it without any jitter or teleportation
          let subStep = step;
          while (subStep > 0.15) {
            subStep /= 2;
            const tryY = this.player.y + moveY * subStep;
            if (!this.checkTankCollision(this.player.x, tryY, this.player.width, this.player.height, this.player.id)) {
              this.player.y = tryY;
            }
          }
        }
      }

      if (moveX !== 0) {
        const nextX = this.player.x + moveX * step;
        if (!this.checkTankCollision(nextX, this.player.y, this.player.width, this.player.height, this.player.id)) {
          this.player.x = nextX;
        } else {
          // Sub-step closer to obstacle to rest flush against it without any jitter or teleportation
          let subStep = step;
          while (subStep > 0.15) {
            subStep /= 2;
            const tryX = this.player.x + moveX * subStep;
            if (!this.checkTankCollision(tryX, this.player.y, this.player.width, this.player.height, this.player.id)) {
              this.player.x = tryX;
            }
          }
        }
      }

      this.player.tracksOffset += step;
      if (Math.random() < 0.2) {
        this.addTrackMark(
          this.player.x + this.player.width / 2,
          this.player.y + this.player.height / 2,
          DIR_VECTORS[this.player.dir].angle
        );
      }
    }
  }

  private firePlayerBullet() {
    if (!this.player || this.player.hp <= 0 || this.isPlayerDying || this.player.reloadTimer > 0) return;

    const tierCfg = PLAYER_TIERS[Math.min(this.player.tier, PLAYER_TIERS.length - 1)];
    this.player.reloadTimer = tierCfg.reloadMax;

    const pCenterX = this.player.x + this.player.width / 2;
    const pCenterY = this.player.y + this.player.height / 2;
    const angle = this.player.turretAngle;

    const barrelLength = this.player.width * 0.58;
    const muzzleX = pCenterX + Math.cos(angle) * barrelLength;
    const muzzleY = pCenterY + Math.sin(angle) * barrelLength;

    if (tierCfg.doubleShot) {
      const perpX = -Math.sin(angle) * 5;
      const perpY = Math.cos(angle) * 5;

      this.bullets.push({
        id: `pb_${Date.now()}_1`,
        x: muzzleX + perpX,
        y: muzzleY + perpY,
        vx: Math.cos(angle) * tierCfg.bulletSpeed,
        vy: Math.sin(angle) * tierCfg.bulletSpeed,
        radius: BULLET_RADIUS,
        damage: 1,
        ownerId: this.player.id,
        isPlayer: true,
        canBreakSteel: tierCfg.canBreakSteel,
      });

      this.bullets.push({
        id: `pb_${Date.now()}_2`,
        x: muzzleX - perpX,
        y: muzzleY - perpY,
        vx: Math.cos(angle) * tierCfg.bulletSpeed,
        vy: Math.sin(angle) * tierCfg.bulletSpeed,
        radius: BULLET_RADIUS,
        damage: 1,
        ownerId: this.player.id,
        isPlayer: true,
        canBreakSteel: tierCfg.canBreakSteel,
      });
      soundEngine.playShoot(true, true);
    } else {
      this.bullets.push({
        id: `pb_${Date.now()}`,
        x: muzzleX,
        y: muzzleY,
        vx: Math.cos(angle) * tierCfg.bulletSpeed,
        vy: Math.sin(angle) * tierCfg.bulletSpeed,
        radius: BULLET_RADIUS,
        damage: 1,
        ownerId: this.player.id,
        isPlayer: true,
        canBreakSteel: tierCfg.canBreakSteel,
      });
      soundEngine.playShoot(true, false);
    }

    // High fidelity muzzle flash particle burst
    particleSystem.emitMuzzleFlash(muzzleX, muzzleY, angle, tierCfg.doubleShot);
    this.addCameraShake(1.2);
  }

  // --- AI Tank Logic ---
  private updateEnemy(enemy: Tank, dt: number) {
    if (this.clockFreezeTimer > 0) return;

    if (enemy.reloadTimer > 0) {
      enemy.reloadTimer -= dt;
    }

    if (enemy.telegraphTimer && enemy.telegraphTimer > 0) {
      enemy.telegraphTimer -= dt;
      if (enemy.telegraphTimer <= 0) {
        enemy.isTelegraphing = false;
        this.fireEnemyBullet(enemy, true);
      }
    }

    if (!enemy.currentDecisionTimer) enemy.currentDecisionTimer = 1.0;
    enemy.currentDecisionTimer -= dt;

    if (enemy.currentDecisionTimer <= 0) {
      enemy.currentDecisionTimer = 0.8 + Math.random() * 1.5;
      this.decideEnemyDirection(enemy);
    }


    // Movement
    const vec = DIR_VECTORS[enemy.dir];
    const weatherMod = weatherSystem.getSpeedMultiplier();
    const step = enemy.speed * weatherMod * dt;
    const nextX = enemy.x + vec.x * step;
    const nextY = enemy.y + vec.y * step;

    const collided = this.checkTankCollision(nextX, nextY, enemy.width, enemy.height, enemy.id);
    if (!collided) {
      enemy.x = nextX;
      enemy.y = nextY;
      enemy.tracksOffset += step;
      enemy.stuckTimer = 0;
    } else {
      // Sub-step closer to obstacle to rest flush against it
      let subStep = step;
      while (subStep > 0.2) {
        subStep /= 2;
        const tryX = enemy.x + vec.x * subStep;
        const tryY = enemy.y + vec.y * subStep;
        if (!this.checkTankCollision(tryX, tryY, enemy.width, enemy.height, enemy.id)) {
          enemy.x = tryX;
          enemy.y = tryY;
          enemy.tracksOffset += subStep;
        }
      }
      enemy.stuckTimer = (enemy.stuckTimer || 0) + dt;
      if (enemy.stuckTimer > 0.2) {
        this.decideEnemyDirection(enemy, true);
        enemy.stuckTimer = 0;
      }
    }

    enemy.turretAngle = DIR_VECTORS[enemy.dir].angle;

    // AI Firing evaluation
    if (enemy.reloadTimer <= 0) {
      const shouldFire = this.evaluateEnemyFireLine(enemy);
      if (shouldFire) {
        if (enemy.type === 'ARTILLERY') {
          enemy.isTelegraphing = true;
          enemy.telegraphTimer = 0.65;
          enemy.reloadTimer = enemy.reloadMax;
          soundEngine.playBaseAlert();
        } else {
          this.fireEnemyBullet(enemy, false);
        }
      }
    }
  }

  private decideEnemyDirection(enemy: Tank, forceTurn: boolean = false) {
    const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    const targetX = 12.5 * TILE_SIZE;
    const targetY = 24.5 * TILE_SIZE;

    const dx = targetX - (enemy.x + enemy.width / 2);
    const dy = targetY - (enemy.y + enemy.height / 2);

    const weights: Record<Direction, number> = {
      UP: 1.0,
      DOWN: 2.2,
      LEFT: dx < 0 ? 2.0 : 0.8,
      RIGHT: dx > 0 ? 2.0 : 0.8,
    };

    if (dy > 0) weights.DOWN += 1.5;

    if (forceTurn) {
      weights[enemy.dir] = 0.05;
    }

    let totalWeight = 0;
    for (const d of directions) totalWeight += weights[d];
    let rand = Math.random() * totalWeight;

    for (const d of directions) {
      rand -= weights[d];
      if (rand <= 0) {
        enemy.dir = d;
        break;
      }
    }
  }

  private evaluateEnemyFireLine(enemy: Tank): boolean {
    if (Math.random() < 0.08) return true;

    const eCenterX = enemy.x + enemy.width / 2;
    const eCenterY = enemy.y + enemy.height / 2;
    const dirVec = DIR_VECTORS[enemy.dir];

    const baseCenterX = 13 * TILE_SIZE;
    if (enemy.dir === 'DOWN' && Math.abs(eCenterX - baseCenterX) < TANK_SIZE) {
      return true;
    }

    if (this.player && this.player.hp > 0 && !this.isPlayerDying) {
      const pCenterX = this.player.x + this.player.width / 2;
      const pCenterY = this.player.y + this.player.height / 2;

      if (enemy.dir === 'UP' && Math.abs(eCenterX - pCenterX) < TANK_SIZE && eCenterY > pCenterY) return true;
      if (enemy.dir === 'DOWN' && Math.abs(eCenterX - pCenterX) < TANK_SIZE && eCenterY < pCenterY) return true;
      if (enemy.dir === 'LEFT' && Math.abs(eCenterY - pCenterY) < TANK_SIZE && eCenterX > pCenterX) return true;
      if (enemy.dir === 'RIGHT' && Math.abs(eCenterY - pCenterY) < TANK_SIZE && eCenterX < pCenterX) return true;
    }

    const probeX = eCenterX + dirVec.x * TANK_SIZE;
    const probeY = eCenterY + dirVec.y * TANK_SIZE;
    const col = Math.floor(probeX / TILE_SIZE);
    const row = Math.floor(probeY / TILE_SIZE);
    if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
      if (this.grid[row][col] === TileType.BRICK) {
        return Math.random() < 0.4;
      }
    }

    return false;
  }

  private fireEnemyBullet(enemy: Tank, isMissile: boolean = false) {
    const cfg = ENEMY_CONFIGS[enemy.type as EnemyType];
    enemy.reloadTimer = cfg.reloadMax * (0.8 + Math.random() * 0.4);

    const eCenterX = enemy.x + enemy.width / 2;
    const eCenterY = enemy.y + enemy.height / 2;
    const angle = enemy.turretAngle;

    const barrelLength = enemy.width * 0.58;
    const muzzleX = eCenterX + Math.cos(angle) * barrelLength;
    const muzzleY = eCenterY + Math.sin(angle) * barrelLength;

    this.bullets.push({
      id: `eb_${Date.now()}_${Math.random()}`,
      x: muzzleX,
      y: muzzleY,
      vx: Math.cos(angle) * cfg.bulletSpeed,
      vy: Math.sin(angle) * cfg.bulletSpeed,
      radius: isMissile ? MISSILE_RADIUS : BULLET_RADIUS,
      damage: isMissile ? 2 : 1,
      ownerId: enemy.id,
      isPlayer: false,
      canBreakSteel: !!cfg.canBreakSteel,
      isMissile,
    });

    soundEngine.playShoot(false, isMissile);
    particleSystem.emitMuzzleFlash(muzzleX, muzzleY, angle, isMissile);
  }

  // --- Base Auto-Turret Cannon ---
  private fireBaseTurret(angle: number, isTwin: boolean = false) {
    const spawnDist = 48; // Projectiles spawn outside base core footprint
    const bulletSpeed = 340;

    if (isTwin) {
      // Twin plasma defense cannons
      const perpAngle = angle + Math.PI / 2;
      const offsetDist = 8;
      [-1, 1].forEach((sign) => {
        const sx = BASE_CENTER.x + Math.cos(perpAngle) * (offsetDist * sign) + Math.cos(angle) * spawnDist;
        const sy = BASE_CENTER.y + Math.sin(perpAngle) * (offsetDist * sign) + Math.sin(angle) * spawnDist;

        this.bullets.push({
          id: `turret_b_${Date.now()}_${Math.random()}`,
          x: sx,
          y: sy,
          vx: Math.cos(angle) * bulletSpeed,
          vy: Math.sin(angle) * bulletSpeed,
          radius: 3.5,
          damage: 1,
          ownerId: 'base_auto_turret',
          isPlayer: true,
          canBreakSteel: false, // Turret projectiles do not destroy friendly steel walls
        });

        particleSystem.emitMuzzleFlash(sx, sy, angle, false);
      });
    } else {
      const sx = BASE_CENTER.x + Math.cos(angle) * spawnDist;
      const sy = BASE_CENTER.y + Math.sin(angle) * spawnDist;

      this.bullets.push({
        id: `turret_b_${Date.now()}_${Math.random()}`,
        x: sx,
        y: sy,
        vx: Math.cos(angle) * bulletSpeed,
        vy: Math.sin(angle) * bulletSpeed,
        radius: 4,
        damage: 1,
        ownerId: 'base_auto_turret',
        isPlayer: true,
        canBreakSteel: false,
      });

      particleSystem.emitMuzzleFlash(sx, sy, angle, false);
    }

    soundEngine.playShoot(true, false);
  }

  // --- Bullets and Collision Physics with Particle Triggers ---
  private updateBullets(dt: number) {
    // 1. Move bullets
    for (const b of this.bullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Rocket exhaust trail particles
      if (b.isMissile && Math.random() < 0.8) {
        particleSystem.emitMissileTrail(b.x, b.y);
      }

      // Check boundary
      if (b.x < 0 || b.x > CANVAS_SIZE || b.y < 0 || b.y > CANVAS_SIZE) {
        b.dead = true;
      }
    }

    // 2. Check bullet vs bullet collision
    const bulletCount = this.bullets.length;
    for (let i = 0; i < bulletCount; i++) {
      const b1 = this.bullets[i];
      if (b1.dead) continue;

      for (let j = i + 1; j < bulletCount; j++) {
        const b2 = this.bullets[j];
        if (b2.dead) continue;

        if (b1.isPlayer !== b2.isPlayer) {
          const dist = Math.hypot(b1.x - b2.x, b1.y - b2.y);
          if (dist < b1.radius + b2.radius + 3) {
            b1.dead = true;
            b2.dead = true;
            // Trigger projectile impact starburst & shockwave
            particleSystem.emitBulletClash((b1.x + b2.x) / 2, (b1.y + b2.y) / 2);
            soundEngine.playHitMetal();
            break;
          }
        }
      }
    }

    // 3. Check Base Forcefield Shield Interception (Protects base + perimeter)
    for (const b of this.bullets) {
      if (b.dead || b.isPlayer) continue;

      if (this.baseShieldHp > 0 && !this.isBaseDestroyed) {
        const distToBase = Math.hypot(b.x - BASE_CENTER.x, b.y - BASE_CENTER.y);
        if (distToBase < BASE_SHIELD_RADIUS) {
          b.dead = true;
          const cfg = BASE_TIERS[this.baseTier - 1];

          // Calculate incoming damage factoring in shield hardness (higher tier = harder barrier)
          const baseDmg = b.damage;
          const effectiveDmg = Math.max(
            1,
            Math.round((baseDmg * 12) / (10 + cfg.shieldHardness * 4))
          );

          this.baseShieldHp = Math.max(0, this.baseShieldHp - effectiveDmg);
          this.shieldOutOfCombatTimer = 0;
          this.shieldHitFlashTimer = 0.22;

          particleSystem.emitBaseShieldImpact(b.x, b.y, b.vx, b.vy, cfg.shieldColor);
          soundEngine.playShieldDeflect();
          this.addCameraShake(2.5);

          if (this.baseShieldHp <= 0) {
            particleSystem.emitShieldBreak(BASE_CENTER.x, BASE_CENTER.y, BASE_SHIELD_RADIUS, cfg.shieldColor);
            soundEngine.playShieldBreak();
            this.addCameraShake(7);
            this.addFloatText(BASE_CENTER.x, BASE_CENTER.y - 22, 'KHIÊN CĂN CỨ ĐÃ BỊ PHÁ!', '#ef4444');
          }
          continue;
        }
      }
    }

    // 4. Check tile & tank collisions
    for (const b of this.bullets) {
      if (b.dead) continue;

      const col = Math.floor(b.x / TILE_SIZE);
      const row = Math.floor(b.y / TILE_SIZE);

      if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
        const tile = this.grid[row][col];

        // Base auto-turret friendly projectile exemption:
        // Turret projectiles pass freely through base perimeter walls (rows 23-25, cols 11-14)
        if (b.ownerId === 'base_auto_turret') {
          if (row >= 23 && row <= 25 && col >= 11 && col <= 14) {
            continue;
          }
        }

        // Brick wall destruction
        if (tile === TileType.BRICK) {
          this.grid[row][col] = TileType.EMPTY;
          particleSystem.emitBrickDestruction(
            col * TILE_SIZE + TILE_SIZE / 2,
            row * TILE_SIZE + TILE_SIZE / 2,
            b.vx,
            b.vy
          );
          soundEngine.playBrickCrumble();
          b.dead = true;
          continue;
        }

        // Reinforced Concrete Wall (Takes 2 hits)
        if (tile === TileType.REINFORCED_WALL) {
          const key = `${col},${row}`;
          const curHp = this.wallHealthMap.get(key) ?? 2;
          const newHp = curHp - (b.canBreakSteel ? 2 : 1);
          b.dead = true;

          if (newHp <= 0) {
            this.grid[row][col] = TileType.EMPTY;
            this.wallHealthMap.delete(key);
            particleSystem.emitSteelImpact(
              col * TILE_SIZE + TILE_SIZE / 2,
              row * TILE_SIZE + TILE_SIZE / 2,
              b.vx,
              b.vy,
              true
            );
            soundEngine.playExplosion(false);
          } else {
            this.wallHealthMap.set(key, newHp);
            particleSystem.emitSteelImpact(b.x, b.y, b.vx, b.vy, false);
            soundEngine.playHitMetal();
          }
          continue;
        }

        // Steel wall collision
        if (tile === TileType.STEEL) {
          if (b.canBreakSteel) {
            this.grid[row][col] = TileType.EMPTY;
            particleSystem.emitSteelImpact(
              col * TILE_SIZE + TILE_SIZE / 2,
              row * TILE_SIZE + TILE_SIZE / 2,
              b.vx,
              b.vy,
              true
            );
            soundEngine.playExplosion(false);
          } else {
            particleSystem.emitSteelImpact(b.x, b.y, b.vx, b.vy, false);
            soundEngine.playHitMetal();
          }
          b.dead = true;
          continue;
        }

        // Quantum Energy Barrier (Absorbs 4 hits)
        if (tile === TileType.ENERGY_BARRIER) {
          // Friendly projectiles pass freely through base energy barrier
          if (b.isPlayer || b.ownerId === 'base_auto_turret') {
            continue;
          }

          const key = `${col},${row}`;
          const curHp = this.wallHealthMap.get(key) ?? 4;
          const newHp = curHp - 1;
          b.dead = true;

          if (newHp <= 0) {
            this.grid[row][col] = TileType.EMPTY;
            this.wallHealthMap.delete(key);
            particleSystem.emitBaseShieldImpact(
              col * TILE_SIZE + TILE_SIZE / 2,
              row * TILE_SIZE + TILE_SIZE / 2,
              b.vx,
              b.vy,
              '#06b6d4'
            );
            soundEngine.playShieldBreak();
          } else {
            this.wallHealthMap.set(key, newHp);
            particleSystem.emitBaseShieldImpact(b.x, b.y, b.vx, b.vy, '#06b6d4');
            soundEngine.playShieldDeflect();
          }
          continue;
        }

        // Water tile splash effect
        if (tile === TileType.WATER) {
          if (Math.random() < 0.15) {
            particleSystem.emitWaterSplash(b.x, b.y);
          }
        }

        // Base core collision
        if (tile === TileType.BASE && !this.isBaseDestroyed) {
          // FRIENDLY FIRE PROTECTION:
          // Player bullets and Base defense auto-turret bullets CANNOT damage the base!
          if (b.isPlayer || b.ownerId === 'base_auto_turret' || b.ownerId === 'player') {
            b.dead = true;
            continue;
          }

          // Hostile enemy projectile hitting base core
          this.baseHp -= b.damage;
          this.stats.baseHp = Math.max(0, this.baseHp);
          b.dead = true;

          if (this.baseHp <= 0) {
            this.destroyBase();
          } else {
            particleSystem.emitTankExplosion(b.x, b.y, 22, '#f59e0b', false);
            soundEngine.playBaseAlert();
            this.addCameraShake(5);
          }
          continue;
        }
      }

      // Check Tank collision
      if (b.isPlayer) {
        for (const enemy of this.enemies) {
          if (enemy.hp <= 0) continue;
          if (this.checkPointInRect(b.x, b.y, enemy.x, enemy.y, enemy.width, enemy.height)) {
            enemy.hp -= b.damage;
            b.dead = true;

            if (enemy.hp <= 0) {
              this.handleEnemyDestroyed(enemy);
            } else {
              // Projectile impact on tank: directional sparks & paint flakes
              particleSystem.emitTankHit(b.x, b.y, b.vx, b.vy, enemy.color);
              soundEngine.playHitMetal();
              this.addCameraShake(2.5);
              this.hitstopTimer = 0.035;
            }
            break;
          }
        }
      } else {
        if (this.player && this.player.hp > 0 && !this.isPlayerDying) {
          if (this.checkPointInRect(b.x, b.y, this.player.x, this.player.y, this.player.width, this.player.height)) {
            b.dead = true;

            if (this.player.shieldTime > 0) {
              // Shield deflection sparks
              particleSystem.emitSteelImpact(b.x, b.y, b.vx, b.vy, false);
              soundEngine.playHitMetal();
            } else {
              this.player.hp -= b.damage;
              this.hitstopTimer = 0.05;
              this.addCameraShake(6);

              if (this.player.hp <= 0) {
                this.handlePlayerDeath();
              } else {
                particleSystem.emitTankHit(b.x, b.y, b.vx, b.vy, '#22c55e');
                soundEngine.playExplosion(false);
                this.addFloatText(this.player.x + 10, this.player.y - 10, `-${b.damage} HP`, '#f87171');
              }
            }
          }
        }
      }
    }

    // Clean up dead bullets & dead enemies
    this.bullets = this.bullets.filter(b => !b.dead);
    this.enemies = this.enemies.filter(e => e.hp > 0);
  }

  // --- Tank Explosions ---
  private handleEnemyDestroyed(enemy: Tank) {
    const isBoss = enemy.type === 'BOSS';
    const cx = enemy.x + enemy.width / 2;
    const cy = enemy.y + enemy.height / 2;

    // Trigger full multi-phase explosion particle system
    particleSystem.emitTankExplosion(cx, cy, isBoss ? 45 : 28, enemy.color, isBoss);

    soundEngine.playExplosion(isBoss);
    this.addCameraShake(isBoss ? 8 : 3.5);
    this.hitstopTimer = isBoss ? 0.06 : 0.03;

    this.stats.score += enemy.scoreValue;
    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
      try {
        localStorage.setItem('tank_game_highscore', String(this.stats.highScore));
      } catch {
        // Ignore
      }
    }
    this.stats.kills[enemy.type as EnemyType]++;
    this.stats.totalKills++;

    this.addFloatText(cx, enemy.y, `+${enemy.scoreValue}`, '#facc15');

    if (enemy.isFlashing || isBoss) {
      this.spawnPowerUp(cx, cy);
    }
  }

  private handlePlayerDeath() {
    if (!this.player || this.isPlayerDying) return;
    this.isPlayerDying = true;

    const cx = this.player.x + this.player.width / 2;
    const cy = this.player.y + this.player.height / 2;

    // Trigger player explosion
    particleSystem.emitTankExplosion(cx, cy, 35, '#22c55e', false);

    soundEngine.playExplosion(true);
    this.addCameraShake(10);

    this.stats.lives--;
    if (this.stats.lives > 0) {
      const nextTier = Math.max(0, this.player.tier - 1);
      setTimeout(() => {
        if (this.isRunning && !this.isBaseDestroyed) {
          this.spawnPlayer(nextTier);
        }
      }, 1000);
    } else {
      this.player = null;
      setTimeout(() => {
        this.triggerGameOver(false);
      }, 1000);
    }
  }

  private destroyBase() {
    if (this.isBaseDestroyed) return;
    this.isBaseDestroyed = true;
    this.baseHp = 0;
    this.stats.baseHp = 0;

    this.grid[24][12] = TileType.BASE_DESTROYED;
    this.grid[24][13] = TileType.BASE_DESTROYED;
    this.grid[25][12] = TileType.BASE_DESTROYED;
    this.grid[25][13] = TileType.BASE_DESTROYED;

    const baseX = 13 * TILE_SIZE;
    const baseY = 25 * TILE_SIZE;

    // Base Destruction multi-stage detonation
    particleSystem.emitTankExplosion(baseX, baseY, 52, '#f97316', true);

    soundEngine.playBaseDestroyed();
    this.addCameraShake(12);

    this.addFloatText(baseX, baseY - 20, 'CĂN CỨ BỊ HỦY DIỆT!', '#ef4444');

    setTimeout(() => {
      this.triggerGameOver(false);
    }, 1200);
  }

  // --- Power-ups ---
  private spawnPowerUp(x: number, y: number) {
    const types: PowerUpType[] = ['STAR', 'SHIELD', 'BOMB', 'CLOCK', 'SHOVEL', 'HEART', 'SPEED', 'FORTRESS'];
    const type = types[Math.floor(Math.random() * types.length)];

    const clampedX = Math.max(30, Math.min(CANVAS_SIZE - 30, x));
    const clampedY = Math.max(30, Math.min(CANVAS_SIZE - 30, y));

    this.powerUps.push({
      id: `pw_${Date.now()}_${Math.random()}`,
      x: clampedX,
      y: clampedY,
      type,
      duration: 18,
      blinkTimer: 0,
    });
  }

  private applyPowerUp(type: PowerUpType) {
    this.stats.powerUpsCollected++;
    soundEngine.playPowerUp();

    const pX = this.player ? this.player.x + this.player.width / 2 : CANVAS_SIZE / 2;
    const pY = this.player ? this.player.y : CANVAS_SIZE / 2;

    switch (type) {
      case 'STAR':
        if (this.player) {
          this.player.tier = Math.min(3, this.player.tier + 1);
          const cfg = PLAYER_TIERS[this.player.tier];
          this.player.speed = cfg.speed;
          this.player.reloadMax = cfg.reloadMax;
          this.player.maxHp = cfg.maxHp;
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
          this.player.name = cfg.name;
          this.addFloatText(pX, pY, `NÂNG CẤP: ${cfg.name}!`, '#38bdf8');
        }
        break;

      case 'SHIELD':
        if (this.player) {
          this.player.shieldTime = 10;
          this.addFloatText(pX, pY, 'KHIÊN BẤT TỬ 10S!', '#38bdf8');
        }
        break;

      case 'BOMB':
        for (const e of this.enemies) {
          e.hp = 0;
          this.handleEnemyDestroyed(e);
        }
        this.enemies = [];
        this.addFloatText(pX, pY, 'BOM NGUYÊN TỬ!', '#f97316');
        break;

      case 'CLOCK':
        this.clockFreezeTimer = 7.0;
        this.addFloatText(pX, pY, 'ĐÓNG BĂNG KẺ ĐỊCH 7S!', '#67e8f9');
        break;

      case 'SHOVEL':
        this.shovelTimer = 16.0;
        this.reinforceBaseFortressWithSteel();
        // Also recharges base shield by +60 points
        if (this.baseShieldMaxHp > 0) {
          this.baseShieldHp = Math.min(this.baseShieldMaxHp, this.baseShieldHp + 60);
        }
        this.addFloatText(pX, pY, 'CÔNG SỰ THÉP & HỒI KHIÊN 16S!', '#94a3b8');
        break;

      case 'FORTRESS':
        // Base upgrade power-up: +1 Tier, restores full base HP and restores full shield
        if (this.baseTier < 5) {
          this.applyBaseTier(this.baseTier + 1, true);
        } else {
          // At max tier, overcharge shield and heal
          const maxCfg = BASE_TIERS[4];
          this.baseHp = maxCfg.maxHp;
          this.baseShieldHp = this.baseShieldMaxHp + 50;
          soundEngine.playBaseUpgrade();
          particleSystem.emitBaseUpgradeBurst(BASE_CENTER.x, BASE_CENTER.y, '#06b6d4');
          this.addFloatText(pX, pY, 'PHÁO ĐÀI LƯỢNG TỬ SIÊU CƯỜNG!', '#06b6d4');
        }
        this.addFloatText(pX, pY, 'NÂNG CẤP CĂN CỨ & PHỤC HỒI KHIÊN!', '#facc15');
        break;

      case 'HEART':
        this.stats.lives++;
        if (this.player) this.player.hp = this.player.maxHp;
        this.addFloatText(pX, pY, '+1 MẠNG & HỒI ĐẦY MÁU!', '#ec4899');
        break;

      case 'SPEED':
        if (this.player) {
          this.player.speed += 30;
          setTimeout(() => {
            if (this.player) {
              const baseSpeed = PLAYER_TIERS[this.player.tier].speed;
              this.player.speed = baseSpeed;
            }
          }, 8000);
          this.addFloatText(pX, pY, 'TĂNG TỐC ĐỘ 8S!', '#facc15');
        }
        break;
    }
  }

  private reinforceBaseFortressWithSteel() {
    for (let c = 11; c <= 14; c++) {
      this.grid[23][c] = TileType.STEEL;
    }
    this.grid[24][11] = TileType.STEEL;
    this.grid[25][11] = TileType.STEEL;
    this.grid[24][14] = TileType.STEEL;
    this.grid[25][14] = TileType.STEEL;
    this.ejectTanksFromBasePerimeter();
  }

  private restoreBaseFortressToTierWalls() {
    const currentWallType = BASE_TIERS[this.baseTier - 1].wallType;
    for (let c = 11; c <= 14; c++) {
      if (this.grid[23][c] === TileType.STEEL) this.grid[23][c] = currentWallType;
    }
    if (this.grid[24][11] === TileType.STEEL) this.grid[24][11] = currentWallType;
    if (this.grid[25][11] === TileType.STEEL) this.grid[25][11] = currentWallType;
    if (this.grid[24][14] === TileType.STEEL) this.grid[24][14] = currentWallType;
    if (this.grid[25][14] === TileType.STEEL) this.grid[25][14] = currentWallType;
    this.ejectTanksFromBasePerimeter();
  }

  // --- End States ---
  private triggerStageClear() {
    if (this.isStageEnding) return;
    this.isStageEnding = true;
    this.isRunning = false;
    soundEngine.playVictory();
    if (this.onStageClear) this.onStageClear();
  }

  private triggerGameOver(won: boolean) {
    if (this.isStageEnding) return;
    this.isStageEnding = true;
    this.isRunning = false;
    if (won) soundEngine.playVictory();
    else soundEngine.playDefeat();
    if (this.onGameOver) this.onGameOver(won);
  }

  // --- Collisions & Geometry ---
  private checkTankCollision(x: number, y: number, w: number, h: number, ignoreId: string): boolean {
    if (x < 0 || x + w > CANVAS_SIZE || y < 0 || y + h > CANVAS_SIZE) {
      return true;
    }

    const pad = 1.0;
    const minCol = Math.floor((x + pad) / TILE_SIZE);
    const maxCol = Math.floor((x + w - pad - 0.05) / TILE_SIZE);
    const minRow = Math.floor((y + pad) / TILE_SIZE);
    const maxRow = Math.floor((y + h - pad - 0.05) / TILE_SIZE);

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS) return true;
        const tile = this.grid[r][c];
        if (
          tile === TileType.BRICK ||
          tile === TileType.STEEL ||
          tile === TileType.REINFORCED_WALL ||
          tile === TileType.ENERGY_BARRIER ||
          tile === TileType.WATER ||
          tile === TileType.BASE ||
          tile === TileType.BASE_DESTROYED
        ) {
          return true;
        }
      }
    }

    const tPad = 1.5;
    if (this.player && this.player.id !== ignoreId && this.player.hp > 0 && !this.isPlayerDying) {
      if (this.checkRectOverlap(x + tPad, y + tPad, w - tPad * 2, h - tPad * 2, this.player.x, this.player.y, this.player.width, this.player.height)) {
        return true;
      }
    }

    for (const enemy of this.enemies) {
      if (enemy && enemy.id !== ignoreId && enemy.hp > 0) {
        if (this.checkRectOverlap(x + tPad, y + tPad, w - tPad * 2, h - tPad * 2, enemy.x, enemy.y, enemy.width, enemy.height)) {
          return true;
        }
      }
    }

    return false;
  }

  // --- Base Fortress Ejection Mechanics (Only called when Base Walls are reconstructed) ---
  public findNearestFreeSpot(tank: Tank): { x: number; y: number } | null {
    const startX = tank.x;
    const startY = tank.y;

    // First try gentle nudges (2px up to 48px) directly North or outward from wall
    const angles = [-Math.PI / 2, Math.PI, 0, -Math.PI * 0.75, -Math.PI * 0.25];
    for (let radius = 2; radius <= 48; radius += 3) {
      for (const ang of angles) {
        const cx = Math.max(0, Math.min(CANVAS_SIZE - tank.width, startX + Math.cos(ang) * radius));
        const cy = Math.max(0, Math.min(CANVAS_SIZE - tank.height, startY + Math.sin(ang) * radius));
        if (!this.checkTankCollision(cx, cy, tank.width, tank.height, tank.id)) {
          return { x: cx, y: cy };
        }
      }
    }

    // Fallback safe positions around base perimeter
    const fallbackCandidates = [
      { x: tank.x, y: 22 * TILE_SIZE - (tank.height - TILE_SIZE) }, // North of row 23 wall
      { x: 10 * TILE_SIZE - (tank.width - TILE_SIZE), y: tank.y },  // West of col 11
      { x: 15 * TILE_SIZE, y: tank.y },                             // East of col 14
    ];

    for (const cand of fallbackCandidates) {
      const cx = Math.max(0, Math.min(CANVAS_SIZE - tank.width, cand.x));
      const cy = Math.max(0, Math.min(CANVAS_SIZE - tank.height, cand.y));
      if (!this.checkTankCollision(cx, cy, tank.width, tank.height, tank.id)) {
        return { x: cx, y: cy };
      }
    }

    return null;
  }

  public ejectTanksFromBasePerimeter() {
    const tanksToCheck: Tank[] = [];
    if (this.player && this.player.hp > 0 && !this.isPlayerDying) {
      tanksToCheck.push(this.player);
    }
    for (const enemy of this.enemies) {
      if (enemy && enemy.hp > 0) {
        tanksToCheck.push(enemy);
      }
    }

    // Base fortress area bounds: columns 10 to 15, rows 22 to 26
    const minX = 10 * TILE_SIZE;
    const maxX = 15 * TILE_SIZE;
    const minY = 22 * TILE_SIZE;
    const maxY = 26 * TILE_SIZE;

    for (const tank of tanksToCheck) {
      // Only process tanks that are physically in the restored base perimeter zone
      if (tank.x + tank.width > minX && tank.x < maxX && tank.y + tank.height > minY && tank.y < maxY) {
        if (this.checkTankCollision(tank.x, tank.y, tank.width, tank.height, tank.id)) {
          const safePos = this.findNearestFreeSpot(tank);
          if (safePos) {
            tank.x = safePos.x;
            tank.y = safePos.y;

            if (tank.isPlayer) {
              particleSystem.emitShieldBreak(tank.x + tank.width / 2, tank.y + tank.height / 2, 28, '#38bdf8');
              soundEngine.playShieldDeflect();
              this.addFloatText(tank.x + tank.width / 2, tank.y - 14, 'THOÁT KẸT CĂN CỨ!', '#38bdf8');
            }
          }
        }
      }
    }
  }

  private checkRectOverlap(
    x1: number, y1: number, w1: number, h1: number,
    x2: number, y2: number, w2: number, h2: number
  ): boolean {
    return (
      x1 < x2 + w2 &&
      x1 + w1 > x2 &&
      y1 < y2 + h2 &&
      y1 + h1 > y2
    );
  }

  private checkPointInRect(px: number, py: number, rx: number, ry: number, rw: number, rh: number): boolean {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }

  private addCameraShake(amt: number) {
    this.cameraShake = Math.min(15, this.cameraShake + amt);
  }

  private addTrackMark(x: number, y: number, angle: number) {
    if (this.trackMarks.length > 120) {
      this.trackMarks.shift();
    }
    this.trackMarks.push({
      x,
      y,
      angle,
      alpha: 0.4,
    });
  }

  private addFloatText(x: number, y: number, text: string, color: string) {
    this.floatTexts.push({
      id: `ft_${Date.now()}_${Math.random()}`,
      x,
      y,
      text,
      color,
      life: 1.1,
      maxLife: 1.1,
    });
  }

  // --- Beautiful Tactical Ground Terrain Generation ---
  private generateTerrainCanvas(): HTMLCanvasElement {
    const tCanvas = document.createElement('canvas');
    tCanvas.width = CANVAS_SIZE;
    tCanvas.height = CANVAS_SIZE;
    const tCtx = tCanvas.getContext('2d')!;

    // 1. Rich dark military asphalt & tactical soil base tone with subtle warm undertone
    const baseGrad = tCtx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    baseGrad.addColorStop(0, '#191c24');
    baseGrad.addColorStop(0.5, '#161920');
    baseGrad.addColorStop(1, '#13151b');
    tCtx.fillStyle = baseGrad;
    tCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 2. Deterministic pseudo-random generator for pristine repeatable terrain
    let seed = 42891;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // 3. Multi-layer organic soil, clay, dust & weathered terrain patches
    // A. Warm earth/clay patches (gives organic ground depth)
    for (let i = 0; i < 42; i++) {
      const px = rnd() * CANVAS_SIZE;
      const py = rnd() * CANVAS_SIZE;
      const pr = 30 + rnd() * 65;
      const grad = tCtx.createRadialGradient(px, py, 4, px, py, pr);
      grad.addColorStop(0, 'rgba(42, 33, 24, 0.40)');
      grad.addColorStop(0.5, 'rgba(32, 26, 20, 0.22)');
      grad.addColorStop(1, 'rgba(25, 20, 16, 0)');
      tCtx.fillStyle = grad;
      tCtx.beginPath();
      tCtx.arc(px, py, pr, 0, Math.PI * 2);
      tCtx.fill();
    }

    // B. Damp charcoal soil / dark loam patches
    for (let i = 0; i < 35; i++) {
      const px = rnd() * CANVAS_SIZE;
      const py = rnd() * CANVAS_SIZE;
      const pr = 20 + rnd() * 50;
      const grad = tCtx.createRadialGradient(px, py, 2, px, py, pr);
      grad.addColorStop(0, 'rgba(10, 14, 20, 0.65)');
      grad.addColorStop(0.6, 'rgba(14, 18, 26, 0.35)');
      grad.addColorStop(1, 'rgba(18, 22, 30, 0)');
      tCtx.fillStyle = grad;
      tCtx.beginPath();
      tCtx.arc(px, py, pr, 0, Math.PI * 2);
      tCtx.fill();
    }

    // C. Historic battle blast craters / scorched earth
    for (let i = 0; i < 12; i++) {
      const cx = 50 + rnd() * (CANVAS_SIZE - 100);
      const cy = 60 + rnd() * (CANVAS_SIZE - 180);
      const cr = 14 + rnd() * 22;
      const craterGrad = tCtx.createRadialGradient(cx, cy, 2, cx, cy, cr);
      craterGrad.addColorStop(0, 'rgba(5, 6, 8, 0.55)');
      craterGrad.addColorStop(0.65, 'rgba(25, 20, 16, 0.28)');
      craterGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      tCtx.fillStyle = craterGrad;
      tCtx.beginPath();
      tCtx.arc(cx, cy, cr, 0, Math.PI * 2);
      tCtx.fill();
    }

    // 4. Weathered historic tank tread tracks (pressed into the soil along side avenues)
    const trackCols = [7.5 * TILE_SIZE, 18.5 * TILE_SIZE];
    for (const trackX of trackCols) {
      tCtx.fillStyle = 'rgba(0, 0, 0, 0.16)';
      for (let y = 10; y < CANVAS_SIZE - 20; y += 7) {
        tCtx.fillRect(trackX - 9, y, 7, 2.5);
        tCtx.fillRect(trackX + 2, y, 7, 2.5);
      }
      tCtx.fillStyle = 'rgba(255, 255, 255, 0.016)';
      for (let y = 10; y < CANVAS_SIZE - 20; y += 7) {
        tCtx.fillRect(trackX - 9, y + 2.5, 7, 1);
        tCtx.fillRect(trackX + 2, y + 2.5, 7, 1);
      }
    }

    // 5. Tactile Combat Floor Slabs (26x26 Pavers with alternating micro-tint)
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;
        // Alternating subtle tile tint (creates elegant geometric floor depth)
        if ((r + c) % 2 === 0) {
          tCtx.fillStyle = 'rgba(255, 255, 255, 0.014)';
          tCtx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        } else {
          tCtx.fillStyle = 'rgba(0, 0, 0, 0.09)';
          tCtx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        }
      }
    }

    // 6. Tactical Battlefield Grid Seams (Embossed Paver Grooves)
    for (let r = 0; r <= GRID_ROWS; r++) {
      const y = r * TILE_SIZE;
      // Dark groove
      tCtx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
      tCtx.lineWidth = 1;
      tCtx.beginPath();
      tCtx.moveTo(0, y);
      tCtx.lineTo(CANVAS_SIZE, y);
      tCtx.stroke();

      // Top light reflection bevel
      tCtx.strokeStyle = 'rgba(255, 255, 255, 0.032)';
      tCtx.beginPath();
      tCtx.moveTo(0, y + 1);
      tCtx.lineTo(CANVAS_SIZE, y + 1);
      tCtx.stroke();
    }

    for (let c = 0; c <= GRID_COLS; c++) {
      const x = c * TILE_SIZE;
      tCtx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
      tCtx.lineWidth = 1;
      tCtx.beginPath();
      tCtx.moveTo(x, 0);
      tCtx.lineTo(x, CANVAS_SIZE);
      tCtx.stroke();

      tCtx.strokeStyle = 'rgba(255, 255, 255, 0.032)';
      tCtx.beginPath();
      tCtx.moveTo(x + 1, 0);
      tCtx.lineTo(x + 1, CANVAS_SIZE);
      tCtx.stroke();
    }

    // 7. Base HQ Security Apron Markings (Caution diagonal hazard stripes around base area)
    const baseApronX = 10 * TILE_SIZE;
    const baseApronY = 22 * TILE_SIZE;
    const baseApronW = 6 * TILE_SIZE;
    const baseApronH = 4 * TILE_SIZE;
    tCtx.save();
    tCtx.beginPath();
    tCtx.rect(baseApronX, baseApronY, baseApronW, baseApronH);
    tCtx.clip();

    tCtx.strokeStyle = 'rgba(234, 179, 8, 0.06)';
    tCtx.lineWidth = 4;
    for (let d = -CANVAS_SIZE; d < CANVAS_SIZE * 2; d += 16) {
      tCtx.beginPath();
      tCtx.moveTo(d, baseApronY);
      tCtx.lineTo(d + baseApronH, baseApronY + baseApronH);
      tCtx.stroke();
    }

    // Faint yellow boundary demarcation line
    tCtx.strokeStyle = 'rgba(234, 179, 8, 0.16)';
    tCtx.lineWidth = 1;
    tCtx.strokeRect(baseApronX + 0.5, baseApronY + 0.5, baseApronW - 1, baseApronH - 1);
    tCtx.restore();

    // 8. Fine Organic Soil Grit, Pebbles & Sand Grains (1,100 specks)
    for (let i = 0; i < 1100; i++) {
      const gx = rnd() * CANVAS_SIZE;
      const gy = rnd() * CANVAS_SIZE;
      const isWarmLight = rnd() > 0.65;
      tCtx.fillStyle = isWarmLight ? 'rgba(240, 215, 175, 0.05)' : 'rgba(0, 0, 0, 0.32)';
      const s = 1 + rnd() * 1.5;
      tCtx.fillRect(gx, gy, s, s);
    }

    // 9. Tactical Sector Crosshairs at tile intersections (every 2 tiles)
    tCtx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
    tCtx.lineWidth = 1;
    for (let r = 0; r <= GRID_ROWS; r += 2) {
      for (let c = 0; c <= GRID_COLS; c += 2) {
        const cx = c * TILE_SIZE;
        const cy = r * TILE_SIZE;
        tCtx.beginPath();
        tCtx.moveTo(cx - 3, cy);
        tCtx.lineTo(cx + 3, cy);
        tCtx.moveTo(cx, cy - 3);
        tCtx.lineTo(cx, cy + 3);
        tCtx.stroke();
      }
    }

    // 10. Atmospheric Depth Vignette (Soft spotlight focus in center, deep tactical borders)
    const vig = tCtx.createRadialGradient(
      CANVAS_SIZE / 2,
      CANVAS_SIZE / 2,
      CANVAS_SIZE * 0.32,
      CANVAS_SIZE / 2,
      CANVAS_SIZE / 2,
      CANVAS_SIZE * 0.74
    );
    vig.addColorStop(0, 'rgba(255, 255, 255, 0.015)');
    vig.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(5, 7, 12, 0.46)');
    tCtx.fillStyle = vig;
    tCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    return tCanvas;
  }

  // --- Rendering Pipeline ---
  public render() {
    const ctx = this.ctx;
    ctx.save();

    // Render beautiful pre-baked tactical ground terrain
    if (this.terrainCanvas) {
      ctx.drawImage(this.terrainCanvas, 0, 0);
    } else {
      ctx.fillStyle = '#111722';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }

    ctx.translate(this.shakeOffsetX, this.shakeOffsetY);

    // 1. Tracks
    this.renderTrackMarks(ctx);

    // 2. Ground & Walls
    this.renderGrid(ctx, false);

    // 3. Power-ups
    this.renderPowerUps(ctx);

    // 4. Tanks
    for (const enemy of this.enemies) {
      if (enemy && enemy.hp > 0) {
        this.renderTank(ctx, enemy);
      }
    }
    if (this.player && this.player.hp > 0 && !this.isPlayerDying) {
      this.renderTank(ctx, this.player);
    }

    // 5. Telegraph Laser lines
    for (const enemy of this.enemies) {
      if (enemy && enemy.isTelegraphing) {
        this.renderTelegraphLaser(ctx, enemy);
      }
    }

    // 6. Bullets
    this.renderBullets(ctx);

    // 7. Bush / Forest on top
    this.renderGrid(ctx, true);

    // 8. Base Forcefield Shield Matrix
    this.renderBaseShield(ctx);

    // 9. Weather Atmosphere (Rain drops, snow flakes, water ripples)
    weatherSystem.render(ctx);

    // 10. Enhanced Particle System (Renders all flashes, shockwaves, fire, sparks, debris, dust)
    particleSystem.render(ctx);

    // 11. Floating texts
    this.renderFloatTexts(ctx);

    ctx.restore();
  }

  private renderTrackMarks(ctx: CanvasRenderingContext2D) {
    for (const tm of this.trackMarks) {
      ctx.save();
      ctx.translate(tm.x, tm.y);
      ctx.rotate(tm.angle);

      // Left & right tread ruts pressed into soil
      [-6.5, 4.5].forEach((ty) => {
        // Dark compressed soil trench
        ctx.fillStyle = `rgba(5, 8, 14, ${tm.alpha * 0.75})`;
        ctx.fillRect(-9, ty, 18, 2.5);

        // Tread rib cross-notches
        ctx.fillStyle = `rgba(2, 6, 23, ${tm.alpha * 0.95})`;
        for (let tx = -8; tx < 8; tx += 3.5) {
          ctx.fillRect(tx, ty, 1.2, 2.5);
        }

        // Faint sunlight bevel edge
        ctx.fillStyle = `rgba(255, 255, 255, ${tm.alpha * 0.08})`;
        ctx.fillRect(-9, ty + 2.5, 18, 0.75);
      });

      ctx.restore();
    }
  }

  private renderGrid(ctx: CanvasRenderingContext2D, onlyBushes: boolean) {
    const time = performance.now() * 0.003;

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const tile = this.grid[r][c];
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        if (onlyBushes) {
          if (tile === TileType.BUSH) {
            this.drawBushTile(ctx, x, y);
          }
          continue;
        }

        switch (tile) {
          case TileType.BRICK:
            this.drawBrickTile(ctx, x, y);
            break;
          case TileType.REINFORCED_WALL:
            this.drawReinforcedWallTile(ctx, x, y, c, r);
            break;
          case TileType.STEEL:
            this.drawSteelTile(ctx, x, y);
            break;
          case TileType.ENERGY_BARRIER:
            this.drawEnergyBarrierTile(ctx, x, y, time);
            break;
          case TileType.WATER:
            this.drawWaterTile(ctx, x, y, time);
            break;
          case TileType.ICE:
            this.drawIceTile(ctx, x, y);
            break;
          case TileType.BASE:
            this.drawBaseHQ(ctx, x, y, false);
            break;
          case TileType.BASE_DESTROYED:
            this.drawBaseHQ(ctx, x, y, true);
            break;
        }
      }
    }
  }

  private drawBrickTile(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // === TACTICAL WOODEN SUPPLY CRATE (THÙNG GỖ QUÂN SỰ) ===
    // 1. Outer drop shadow & crate casing
    ctx.fillStyle = '#291206';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // 2. Main sturdy timber body
    ctx.fillStyle = '#6c3b12';
    ctx.fillRect(x, y, TILE_SIZE - 1, TILE_SIZE - 1);

    // 3. Inner timber planks (3 horizontal slats)
    // Plank 1 (Top)
    ctx.fillStyle = '#9a5616';
    ctx.fillRect(x + 2, y + 2, 22, 6);

    // Plank 2 (Middle)
    ctx.fillStyle = '#a16207';
    ctx.fillRect(x + 2, y + 9, 22, 7);

    // Plank 3 (Bottom)
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(x + 2, y + 17, 22, 6);

    // Dark grooves between wooden slats
    ctx.fillStyle = '#381604';
    ctx.fillRect(x + 2, y + 8, 22, 1);
    ctx.fillRect(x + 2, y + 16, 22, 1);

    // Wood grain subtle highlights
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x + 3, y + 3, 20, 1);
    ctx.fillRect(x + 3, y + 10, 20, 1);

    // 4. Wooden Sturdy Diagonal X-Brace Support
    ctx.strokeStyle = '#3b1805';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + 3, y + 3);
    ctx.lineTo(x + 23, y + 23);
    ctx.moveTo(x + 23, y + 3);
    ctx.lineTo(x + 3, y + 23);
    ctx.stroke();

    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 3, y + 3);
    ctx.lineTo(x + 23, y + 23);
    ctx.moveTo(x + 23, y + 3);
    ctx.lineTo(x + 3, y + 23);
    ctx.stroke();

    // Center brace hub
    ctx.fillStyle = '#59290a';
    ctx.fillRect(x + 11, y + 11, 4, 4);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x + 12, y + 12, 2, 2);

    // 5. Heavy Stamped Steel Corner Brackets & Rivets
    ctx.fillStyle = '#334155';
    // Top-left bracket
    ctx.fillRect(x, y, 5, 2);
    ctx.fillRect(x, y, 2, 5);
    // Top-right bracket
    ctx.fillRect(x + 21, y, 5, 2);
    ctx.fillRect(x + 24, y, 2, 5);
    // Bottom-left bracket
    ctx.fillRect(x, y + 24, 5, 2);
    ctx.fillRect(x, y + 21, 2, 5);
    // Bottom-right bracket
    ctx.fillRect(x + 21, y + 24, 5, 2);
    ctx.fillRect(x + 24, y + 21, 2, 5);

    // Metallic corner bracket highlights
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x, y, 4, 1);
    ctx.fillRect(x + 21, y, 5, 1);

    // Rivet studs (silver bolts)
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(x + 2, y + 2, 1.5, 1.5);
    ctx.fillRect(x + 22, y + 2, 1.5, 1.5);
    ctx.fillRect(x + 2, y + 22, 1.5, 1.5);
    ctx.fillRect(x + 22, y + 22, 1.5, 1.5);

    // 6. Top & Left 3D Timber Highlights
    ctx.fillStyle = '#d97706';
    ctx.fillRect(x + 5, y, 16, 1);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x, y + 5, 1, 16);
  }

  private drawReinforcedWallTile(ctx: CanvasRenderingContext2D, x: number, y: number, col: number, row: number) {
    // Fortified Concrete Armor Block with embedded steel rebar
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // Inner concrete face
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);

    // Embossed steel cross girders
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + 3, y + 3);
    ctx.lineTo(x + TILE_SIZE - 3, y + TILE_SIZE - 3);
    ctx.moveTo(x + TILE_SIZE - 3, y + 3);
    ctx.lineTo(x + 3, y + TILE_SIZE - 3);
    ctx.stroke();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 3, y + 3);
    ctx.lineTo(x + TILE_SIZE - 3, y + TILE_SIZE - 3);
    ctx.moveTo(x + TILE_SIZE - 3, y + 3);
    ctx.lineTo(x + 3, y + TILE_SIZE - 3);
    ctx.stroke();

    // Heavy industrial steel rivets on 4 corners
    const boltColor = '#cbd5e1';
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 1, y + 1, 4, 4);
    ctx.fillRect(x + TILE_SIZE - 5, y + 1, 4, 4);
    ctx.fillRect(x + 1, y + TILE_SIZE - 5, 4, 4);
    ctx.fillRect(x + TILE_SIZE - 5, y + TILE_SIZE - 5, 4, 4);

    ctx.fillStyle = boltColor;
    ctx.fillRect(x + 2, y + 2, 2, 2);
    ctx.fillRect(x + TILE_SIZE - 4, y + 2, 2, 2);
    ctx.fillRect(x + 2, y + TILE_SIZE - 4, 2, 2);
    ctx.fillRect(x + TILE_SIZE - 4, y + TILE_SIZE - 4, 2, 2);

    // Top & left 3D light rim
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, 1);
    ctx.fillRect(x + 1, y + 1, 1, TILE_SIZE - 2);

    // If damaged (1 HP remaining), draw fracture crack
    const curHp = this.wallHealthMap.get(`${col},${row}`);
    if (curHp === 1) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 5, y + 13);
      ctx.lineTo(x + 12, y + 8);
      ctx.lineTo(x + 15, y + 15);
      ctx.lineTo(x + 21, y + 12);
      ctx.stroke();
    }
  }

  private drawSteelTile(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // 2D Industrial Composite Steel Armor Plate
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // Outer beveled steel rim
    ctx.fillStyle = '#475569';
    ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);

    // Inner brushed steel core
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);

    // Diagonal faceted crease
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 3, y + 3);
    ctx.lineTo(x + TILE_SIZE - 4, y + TILE_SIZE - 4);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 3);
    ctx.lineTo(x + TILE_SIZE - 3, y + TILE_SIZE - 4);
    ctx.stroke();

    // 4 Heavy Hex Bolts
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(x + 2, y + 2, 2, 2);
    ctx.fillRect(x + TILE_SIZE - 4, y + 2, 2, 2);
    ctx.fillRect(x + 2, y + TILE_SIZE - 4, 2, 2);
    ctx.fillRect(x + TILE_SIZE - 4, y + TILE_SIZE - 4, 2, 2);

    // Specular highlight gleam on top/left
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, 1);
    ctx.fillRect(x + 1, y + 1, 1, TILE_SIZE - 2);

    // Bottom/right shadow
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 1, y + TILE_SIZE - 2, TILE_SIZE - 2, 1);
    ctx.fillRect(x + TILE_SIZE - 2, y + 1, 1, TILE_SIZE - 2);
  }

  private drawEnergyBarrierTile(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
    // Quantum Energy Wall with glowing cyan/neon lattice
    ctx.fillStyle = '#082f49';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    const pulse = 0.5 + Math.sin(time * 2.5 + x * 0.08 + y * 0.08) * 0.45;
    ctx.fillStyle = `rgba(6, 182, 212, ${pulse * 0.35})`;
    ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);

    ctx.strokeStyle = `rgba(34, 211, 238, ${0.5 + pulse * 0.5})`;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 2.5, y + 2.5, TILE_SIZE - 5, TILE_SIZE - 5);

    // Diagonal lattice wires
    ctx.strokeStyle = `rgba(103, 232, 249, ${0.3 + pulse * 0.4})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 3, y + TILE_SIZE / 2);
    ctx.lineTo(x + TILE_SIZE / 2, y + 3);
    ctx.lineTo(x + TILE_SIZE - 3, y + TILE_SIZE / 2);
    ctx.lineTo(x + TILE_SIZE / 2, y + TILE_SIZE - 3);
    ctx.closePath();
    ctx.stroke();

    // Glowing core node
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawWaterTile(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
    // 2D Dynamic Water Tile with animated wave caustics
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);

    const wave1 = Math.sin(time * 1.5 + x * 0.12) * 2.5;
    const wave2 = Math.cos(time * 1.2 + y * 0.12) * 2.5;

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 7 + wave1);
    ctx.quadraticCurveTo(x + TILE_SIZE / 2, y + 11 + wave1, x + TILE_SIZE - 2, y + 7 + wave1);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(125, 211, 252, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 17 + wave2);
    ctx.quadraticCurveTo(x + TILE_SIZE / 2, y + 13 + wave2, x + TILE_SIZE - 2, y + 17 + wave2);
    ctx.stroke();

    // Sunlight glint specular
    const glint = (Math.sin(time * 3 + x + y) + 1) * 0.5;
    if (glint > 0.8) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillRect(x + 6, y + 9 + wave1, 3, 1.5);
    }
  }

  private drawIceTile(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // 2D Frosted Glacial Ice Surface
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    ctx.fillStyle = 'rgba(186, 230, 253, 0.28)';
    ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);

    // Crystalline faceted fissures
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.65)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 3, y + TILE_SIZE - 4);
    ctx.lineTo(x + 11, y + 11);
    ctx.lineTo(x + TILE_SIZE - 4, y + 4);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(147, 197, 253, 0.45)';
    ctx.beginPath();
    ctx.moveTo(x + 11, y + 11);
    ctx.lineTo(x + 18, y + 18);
    ctx.stroke();

    // Surface specular shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(x + 4, y + 3, 5, 1);
    ctx.fillRect(x + 3, y + 4, 1, 4);
  }

  private drawBushTile(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // Stylized semi-translucent foliage so tanks, bullets & map beneath are visible
    ctx.fillStyle = 'rgba(21, 128, 61, 0.55)';
    ctx.beginPath();
    ctx.arc(x + 7, y + 7, 7, 0, Math.PI * 2);
    ctx.arc(x + 19, y + 8, 7.5, 0, Math.PI * 2);
    ctx.arc(x + 8, y + 19, 7.5, 0, Math.PI * 2);
    ctx.arc(x + 18, y + 18, 7, 0, Math.PI * 2);
    ctx.fill();

    // Soft canopy leaf center
    ctx.fillStyle = 'rgba(74, 222, 128, 0.58)';
    ctx.beginPath();
    ctx.arc(x + 13, y + 13, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Subtle dark foliage outline
    ctx.strokeStyle = 'rgba(20, 83, 45, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private drawBaseHQ(ctx: CanvasRenderingContext2D, x: number, y: number, isDestroyed: boolean) {
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);
    if (col !== 12 || row !== 24) return;

    const baseW = TILE_SIZE * 2;
    const baseH = TILE_SIZE * 2;
    const cx = x + baseW / 2;
    const cy = y + baseH / 2;
    const time = performance.now() * 0.003;

    if (isDestroyed) {
      // Scorched battlefield ruins with twisted rebar and smoldering blast crater
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x, y, baseW, baseH);

      // Scorched blast crater
      const craterGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 22);
      craterGrad.addColorStop(0, '#020617');
      craterGrad.addColorStop(0.7, '#1c1917');
      craterGrad.addColorStop(1, '#292524');
      ctx.fillStyle = craterGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.fill();

      // Exposed reinforcing rebar metal cages
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 5, y + 10);
      ctx.lineTo(cx - 3, cy - 4);
      ctx.lineTo(x + 12, y + baseH - 5);
      ctx.moveTo(x + baseW - 6, y + 8);
      ctx.lineTo(cx + 4, cy + 2);
      ctx.lineTo(x + baseW - 14, y + baseH - 6);
      ctx.stroke();

      // Ruined hazard caution tape
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 4);
      ctx.lineTo(x + baseW - 4, y + baseH - 4);
      ctx.moveTo(x + baseW - 4, y + 4);
      ctx.lineTo(x + 4, y + baseH - 4);
      ctx.stroke();

      // Flickering smoldering embers
      const flicker = Math.sin(time * 8) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(239, 68, 68, ${flicker})`;
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HỎNG', cx, cy + 3.5);
      return;
    }

    const cfg = BASE_TIERS[this.baseTier - 1];

    // 1. Drop shadow under Command Bunker
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 3, baseW - 2, baseH - 1, 6);
    ctx.fill();

    // 2. Heavy Reinforced Concrete Blast Foundation
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(x, y, baseW, baseH, 5);
    ctx.fill();

    // Inner beveled bunker armor plating
    const hullGrad = ctx.createLinearGradient(x, y, x + baseW, y + baseH);
    hullGrad.addColorStop(0, this.baseTier >= 4 ? '#0c2340' : '#334155');
    hullGrad.addColorStop(1, this.baseTier >= 4 ? '#031024' : '#1e293b');
    ctx.fillStyle = hullGrad;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, baseW - 4, baseH - 4, 4);
    ctx.fill();

    // 3. Glowing Tier Armor Rim
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3, y + 3, baseW - 6, baseH - 6);

    // 4. Corner Heavy Fortification Pillboxes & Bolted Steel Plates
    const bracketSize = 7;
    ctx.fillStyle = cfg.color;
    // Top-left
    ctx.fillRect(x + 2, y + 2, bracketSize, 3);
    ctx.fillRect(x + 2, y + 2, 3, bracketSize);
    // Top-right
    ctx.fillRect(x + baseW - 2 - bracketSize, y + 2, bracketSize, 3);
    ctx.fillRect(x + baseW - 5, y + 2, 3, bracketSize);
    // Bottom-left
    ctx.fillRect(x + 2, y + baseH - 5, bracketSize, 3);
    ctx.fillRect(x + 2, y + baseH - 2 - bracketSize, 3, bracketSize);
    // Bottom-right
    ctx.fillRect(x + baseW - 2 - bracketSize, y + baseH - 5, bracketSize, 3);
    ctx.fillRect(x + baseW - 5, y + baseH - 2 - bracketSize, 3, bracketSize);

    // Corner Hex Rivets
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x + 4, y + 4, 1.5, 1.5);
    ctx.fillRect(x + baseW - 5.5, y + 4, 1.5, 1.5);
    ctx.fillRect(x + 4, y + baseH - 5.5, 1.5, 1.5);
    ctx.fillRect(x + baseW - 5.5, y + baseH - 5.5, 1.5, 1.5);

    // 5. Rotating Comms Radar Scanner Dish
    const radarAngle = time * 2.2;
    const radarX = x + 10;
    const radarY = y + 10;
    ctx.save();
    ctx.translate(radarX, radarY);
    ctx.rotate(radarAngle);
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 5, -Math.PI * 0.7, Math.PI * 0.7);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Comms Mast with Blinking Beacon
    const mastX = x + baseW - 10;
    const mastY = y + 10;
    ctx.fillStyle = '#64748b';
    ctx.fillRect(mastX - 1, mastY - 4, 2, 8);
    const beaconOn = Math.floor(time * 3) % 2 === 0;
    ctx.fillStyle = beaconOn ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(mastX, mastY - 5, 2, 0, Math.PI * 2);
    ctx.fill();

    // 6. Central Command Bunker Observation Visor (War Room Slit)
    ctx.fillStyle = '#020617';
    ctx.fillRect(cx - 16, cy - 8, 32, 6);
    const visorGlow = ctx.createLinearGradient(cx - 16, 0, cx + 16, 0);
    visorGlow.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
    visorGlow.addColorStop(0.5, this.baseTier >= 4 ? 'rgba(56, 189, 248, 0.95)' : 'rgba(250, 204, 21, 0.95)');
    visorGlow.addColorStop(1, 'rgba(6, 182, 212, 0.2)');
    ctx.fillStyle = visorGlow;
    ctx.fillRect(cx - 15, cy - 7, 30, 4);

    // 7. Stamped Golden / Quantum Eagle Insignia
    ctx.save();
    ctx.fillStyle = this.baseTier >= 4 ? '#38bdf8' : '#facc15';
    ctx.beginPath();
    ctx.moveTo(cx, cy + 2);
    ctx.lineTo(cx + 6, cy + 7);
    ctx.lineTo(cx + 14, cy + 5);
    ctx.lineTo(cx + 8, cy + 12);
    ctx.lineTo(cx + 10, cy + 17);
    ctx.lineTo(cx, cy + 14);
    ctx.lineTo(cx - 10, cy + 17);
    ctx.lineTo(cx - 8, cy + 12);
    ctx.lineTo(cx - 14, cy + 5);
    ctx.lineTo(cx - 6, cy + 7);
    ctx.closePath();
    ctx.fill();

    // Center power gem
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy + 8, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 8. Base Tier Badge Pill at bottom
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.roundRect(cx - 20, y + baseH - 9, 40, 7.5, 3);
    ctx.fill();
    ctx.fillStyle = cfg.color;
    ctx.font = 'bold 7.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cfg.badge, cx, y + baseH - 5.5);

    // 9. Base HP Gauge Segments at top
    const maxHp = cfg.maxHp;
    const pipW = Math.min(6, (baseW - 16) / maxHp - 1.5);
    const startX = cx - (maxHp * (pipW + 1.5)) / 2;
    for (let i = 0; i < maxHp; i++) {
      ctx.fillStyle = i < this.baseHp ? (this.baseHp === 1 ? '#ef4444' : '#22c55e') : '#334155';
      ctx.fillRect(startX + i * (pipW + 1.5), y + 3.5, pipW, 2.5);
    }

    // 10. Heavy Base Auto-Turret (if Tier >= 3)
    if (cfg.hasAutoTurret) {
      ctx.save();
      ctx.translate(cx, cy);

      // Heavy armored turret cupola ring
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = cfg.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Gun Mantlet & Barrels rotating with baseTurretAngle
      ctx.rotate(this.baseTurretAngle);
      if (this.baseTier >= 4) {
        // Twin Heavy Plasma/Quantum Cannons
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(0, -4, 15, 3);
        ctx.fillRect(0, 1, 15, 3);
        // Slotted Muzzle Brakes
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(13, -5, 3, 5);
        ctx.fillRect(13, 0, 3, 5);
      } else {
        // Single Heavy Armor-Piercing Cannon
        ctx.fillStyle = '#475569';
        ctx.fillRect(0, -2.5, 15, 5);
        // Muzzle brake
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(13, -3.5, 3, 7);
      }

      // Center turret dome pivot
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = cfg.color;
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // --- Base Energy Forcefield Dome ---
  private renderBaseShield(ctx: CanvasRenderingContext2D) {
    if (this.baseShieldHp <= 0 || this.isBaseDestroyed) return;

    const cx = BASE_CENTER.x;
    const cy = BASE_CENTER.y;
    const radius = BASE_SHIELD_RADIUS;
    const cfg = BASE_TIERS[this.baseTier - 1];
    const time = performance.now() * 0.002;
    const isFlashing = this.shieldHitFlashTimer > 0;

    ctx.save();

    // 1. Forcefield Radial Dome Glow
    const gradient = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
    if (isFlashing) {
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.7)');
    } else {
      gradient.addColorStop(0, `${cfg.shieldColor}08`);
      gradient.addColorStop(0.7, `${cfg.shieldColor}18`);
      gradient.addColorStop(1, `${cfg.shieldColor}45`);
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Outer Rotating Forcefield Rim
    ctx.strokeStyle = isFlashing ? '#ffffff' : cfg.shieldColor;
    ctx.lineWidth = isFlashing ? 3 : 2;
    ctx.setLineDash([8, 4]);
    ctx.lineDashOffset = -time * 20;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // 3. Hexagonal / Geometric Defense Matrix Nodes
    const nodeCount = 8;
    ctx.strokeStyle = isFlashing ? 'rgba(255, 255, 255, 0.5)' : `${cfg.shieldColor}40`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2 + time * 0.4;
      const nx = cx + Math.cos(angle) * (radius * 0.75);
      const ny = cy + Math.sin(angle) * (radius * 0.75);
      if (i === 0) ctx.moveTo(nx, ny);
      else ctx.lineTo(nx, ny);
    }
    ctx.closePath();
    ctx.stroke();

    // 4. Floating Shield Health Pill Badge directly above dome
    const pillW = 82;
    const pillH = 14;
    const pillX = cx - pillW / 2;
    const pillY = cy - radius - 16;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = cfg.shieldColor;
    ctx.lineWidth = 1;

    // Rounded pill
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 4);
    ctx.fill();
    ctx.stroke();

    // Shield HP progress bar inside pill
    const shieldRatio = Math.max(0, Math.min(1, this.baseShieldHp / this.baseShieldMaxHp));
    ctx.fillStyle = cfg.shieldColor;
    ctx.fillRect(pillX + 2, pillY + 2, (pillW - 4) * shieldRatio, pillH - 4);

    // Text: 🛡️ KHIÊN 100/100
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🛡️ ${Math.round(this.baseShieldHp)}/${this.baseShieldMaxHp}`, cx, pillY + pillH / 2);

    ctx.restore();
  }

  // --- High-Fidelity 2D Tactical Tank Renderer ---
  private renderTank(ctx: CanvasRenderingContext2D, tank: Tank) {
    ctx.save();
    const cx = tank.x + tank.width / 2;
    const cy = tank.y + tank.height / 2;
    const halfW = tank.width / 2;
    const halfH = tank.height / 2;
    const time = performance.now();
    const isFrozen = !tank.isPlayer && this.clockFreezeTimer > 0;
    const isBoss = tank.type === 'BOSS';

    // 1. Soft Directional Ground Shadow
    ctx.save();
    ctx.translate(cx + 2.5, cy + 3.5);
    ctx.rotate(DIR_VECTORS[tank.dir].angle);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.42)';
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH, tank.width, tank.height, 4);
    ctx.fill();
    ctx.restore();

    // 2. Chassis & Treads (Aligned with driving direction)
    ctx.save();
    ctx.translate(cx, cy);
    const chassisAngle = DIR_VECTORS[tank.dir].angle;
    ctx.rotate(chassisAngle);

    const treadH = isBoss ? 9 : 7;
    const treadSpacing = 4.5;
    const shift = (tank.tracksOffset || 0) % treadSpacing;

    // --- Left & Right Caterpillar Tracks ---
    [-1, 1].forEach((side) => {
      const trackY = side === -1 ? -halfH : halfH - treadH;

      // Track Rubber/Steel Outer Belt
      ctx.fillStyle = isFrozen ? '#0369a1' : '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-halfW, trackY, tank.width, treadH, 2.5);
      ctx.fill();

      // Road Wheels & Sprockets (4 wheels along the track)
      const wheelCount = isBoss ? 5 : 4;
      const wheelSpan = (tank.width - 8) / (wheelCount - 1);
      for (let w = 0; w < wheelCount; w++) {
        const wx = -halfW + 4 + w * wheelSpan;
        const wy = trackY + treadH / 2;
        const wr = treadH * 0.36;

        // Wheel rim
        ctx.fillStyle = isFrozen ? '#38bdf8' : '#334155';
        ctx.beginPath();
        ctx.arc(wx, wy, wr, 0, Math.PI * 2);
        ctx.fill();

        // Axle center cap
        ctx.fillStyle = isFrozen ? '#e0f2fe' : '#64748b';
        ctx.beginPath();
        ctx.arc(wx, wy, wr * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      // Scrolling Track Links (Indented pin ribs)
      ctx.fillStyle = isFrozen ? '#bae6fd' : '#1e293b';
      for (let tx = -halfW + 1 + shift; tx < halfW - 1; tx += treadSpacing) {
        ctx.fillRect(tx, trackY, 1.5, treadH);
      }

      // Armored Mudguards / Track Skirts (Schürzen)
      ctx.fillStyle = isFrozen ? '#0284c7' : (tank.type === 'HEAVY' || isBoss ? '#1e293b' : '#334155');
      ctx.fillRect(-halfW + 1, side === -1 ? -halfH : halfH - 2, tank.width - 2, 2);

      // Mudguard rivets
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-halfW + 3, side === -1 ? -halfH + 0.5 : halfH - 1.5, 1.5, 1);
      ctx.fillRect(halfW - 5, side === -1 ? -halfH + 0.5 : halfH - 1.5, 1.5, 1);
    });

    // --- Main Armored Hull / Glacis Plate ---
    const hullInsetX = 4;
    const hullInsetY = treadH - 1;
    const hullW = tank.width - hullInsetX * 2;
    const hullH = tank.height - hullInsetY * 2;

    // Hull Base Color with Hit Flash & Frozen Glaze
    let baseHullColor = tank.color;
    if (isFrozen) {
      baseHullColor = '#0284c7';
    } else if (tank.isFlashing && Math.floor(time / 140) % 2 === 0) {
      baseHullColor = '#facc15'; // Glowing gold bonus carrier
    }

    // Hull Gradient
    const hullGrad = ctx.createLinearGradient(-hullW / 2, 0, hullW / 2, 0);
    hullGrad.addColorStop(0, baseHullColor);
    hullGrad.addColorStop(0.5, tank.isPlayer ? '#4ade80' : baseHullColor);
    hullGrad.addColorStop(1, baseHullColor);
    ctx.fillStyle = hullGrad;

    // Sloped Front Glacis Plate
    ctx.beginPath();
    ctx.roundRect(-hullW / 2, -hullH / 2, hullW, hullH, 3);
    ctx.fill();

    // 3D Top Glacis Highlight Rim
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.fillRect(-hullW / 2 + 1, -hullH / 2 + 1, hullW - 2, 1.5);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(-hullW / 2 + 1, hullH / 2 - 2, hullW - 2, 1.5);

    // Engine Deck Louvers / Ventilation Slats on the rear (-X side when facing right)
    const engineX = -hullW / 2 + 2;
    const engineW = Math.max(5, hullW * 0.28);
    const engineH = hullH - 6;
    ctx.fillStyle = '#020617';
    ctx.fillRect(engineX, -engineH / 2, engineW, engineH);
    ctx.fillStyle = '#475569';
    for (let ey = -engineH / 2 + 1.5; ey < engineH / 2 - 1; ey += 2.2) {
      ctx.fillRect(engineX + 0.5, ey, engineW - 1, 1);
    }

    // Dual Forward Headlights on front glacis (+X side facing right)
    const lightX = hullW / 2 - 2.5;
    [-hullH * 0.32, hullH * 0.32].forEach((ly) => {
      // Light housing
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(lightX - 1, ly - 2, 2.5, 4);
      // Bright lamp lens
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(lightX, ly - 1.5, 1.5, 3);

      // Soft tactical light beam cone forward
      if (!isFrozen) {
        ctx.fillStyle = 'rgba(254, 240, 138, 0.08)';
        ctx.beginPath();
        ctx.moveTo(lightX + 1.5, ly);
        ctx.lineTo(lightX + 18, ly - 8);
        ctx.lineTo(lightX + 18, ly + 8);
        ctx.closePath();
        ctx.fill();
      }
    });

    // Hull Stenciled Insignia
    if (tank.isPlayer) {
      // Golden military chevron / star
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(1, -3);
      ctx.lineTo(4, 0);
      ctx.lineTo(1, 3);
      ctx.lineTo(-1, 3);
      ctx.lineTo(2, 0);
      ctx.lineTo(-1, -3);
      ctx.closePath();
      ctx.fill();
    } else if (isBoss) {
      // Boss Warning Hazard Stripes on front glacis
      ctx.fillStyle = '#facc15';
      ctx.fillRect(hullW / 2 - 4, -hullH / 2 + 2, 2.5, hullH - 4);
      ctx.fillStyle = '#020617';
      for (let sy = -hullH / 2 + 3; sy < hullH / 2 - 3; sy += 4) {
        ctx.fillRect(hullW / 2 - 4, sy, 2.5, 2);
      }
    }

    // Engine Damaged Smoke/Embers (when tank is badly wounded)
    if (tank.maxHp > 1 && tank.hp <= Math.ceil(tank.maxHp * 0.4)) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.beginPath();
      ctx.arc(engineX + engineW / 2, 0, 3 + Math.sin(time * 0.02) * 1.5, 0, Math.PI * 2);
      ctx.fill();
      if (tank.hp === 1) {
        // Fire spark
        ctx.fillStyle = Math.floor(time / 100) % 2 === 0 ? '#f97316' : '#ef4444';
        ctx.fillRect(engineX + 1, -1.5, 2, 3);
      }
    }

    ctx.restore(); // Restore chassis

    // 3. Rotating Turret & Weapon Assembly
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tank.turretAngle);

    // Turret Drop Shadow onto Chassis
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.arc(1.5, 2, tank.width * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // Turret Basket Ring
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, tank.width * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // --- Cannon Barrels by Tier & Class ---
    const barrelLen = isBoss ? tank.width * 0.72 : (tank.type === 'ARTILLERY' ? tank.width * 0.78 : tank.width * 0.62);

    if (tank.isPlayer) {
      if (tank.tier >= 3) {
        // Tier 4: Sci-Fi Titanium Juggernaut - Twin Heavy Quantum Railguns
        [-4, 2].forEach((by) => {
          // Railgun barrel
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(0, by, barrelLen, 3);
          // Glowing magnetic induction coils
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(5, by - 0.5, 3, 4);
          ctx.fillRect(11, by - 0.5, 3, 4);
          // Muzzle accelerator ring
          ctx.fillStyle = '#22d3ee';
          ctx.fillRect(barrelLen - 2, by - 1, 3.5, 5);
        });
      } else if (tank.tier >= 2) {
        // Tier 3: Twin Heavy Assault Cannons
        [-4, 1.5].forEach((by) => {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(0, by, barrelLen, 3);
          ctx.fillStyle = '#475569';
          ctx.fillRect(2, by - 0.5, 4, 4);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(barrelLen - 2, by - 0.5, 3, 4);
        });
      } else if (tank.tier >= 1) {
        // Tier 2: Heavy Combat Cannon with Slotted Muzzle Brake
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, -2.5, barrelLen, 5);
        ctx.fillStyle = '#475569';
        ctx.fillRect(barrelLen * 0.4, -3, 5, 6);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(barrelLen - 3, -3.5, 4, 7);
      } else {
        // Tier 1: Single Standard Rifled Barrel
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, -2, barrelLen, 4);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(barrelLen - 2.5, -2.5, 3, 5);
      }
    } else {
      // Enemy Barrels
      if (isBoss) {
        // Twin Colossal Dreadnought Cannons
        [-5, 1.5].forEach((by) => {
          ctx.fillStyle = '#020617';
          ctx.fillRect(0, by, barrelLen, 4.5);
          ctx.fillStyle = '#e11d48';
          ctx.fillRect(barrelLen * 0.35, by - 0.5, 5, 5.5);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(barrelLen - 3, by - 1, 4, 6.5);
        });
      } else if (tank.type === 'HEAVY') {
        // Heavy Howitzer Cannon
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, -3, barrelLen, 6);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(barrelLen * 0.4, -3.5, 5, 7);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(barrelLen - 3, -4, 4, 8);
      } else if (tank.type === 'ARTILLERY') {
        // Long-range Siege Howitzer Barrel
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, -2.5, barrelLen, 5);
        ctx.fillStyle = '#7e22ce';
        ctx.fillRect(4, -3.5, 6, 7);
        ctx.fillStyle = '#e9d5ff';
        ctx.fillRect(barrelLen - 2.5, -3.5, 3.5, 7);
      } else if (tank.type === 'SCOUT') {
        // Fast twin-autocannon
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, -2.5, barrelLen, 2);
        ctx.fillRect(0, 0.5, barrelLen, 2);
        ctx.fillStyle = '#22d3ee';
        ctx.fillRect(barrelLen - 2, -3, 2.5, 6);
      } else {
        // Assault Standard Cannon
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, -2, barrelLen, 4);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(barrelLen * 0.45, -2.5, 4, 5);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(barrelLen - 2.5, -2.5, 3, 5);
      }
    }

    // Heavy Gun Mantlet Shield
    const mantletW = 6;
    const mantletH = isBoss || tank.tier >= 2 ? 14 : 10;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(0, -mantletH / 2, mantletW, mantletH, 2);
    ctx.fill();
    ctx.fillStyle = '#475569';
    ctx.fillRect(1, -mantletH / 2 + 1, mantletW - 2, 1);

    // Armored Cast Turret Housing
    const turretR = tank.width * 0.24;
    ctx.fillStyle = isFrozen ? '#38bdf8' : (tank.isFlashing && Math.floor(time / 140) % 2 === 0 ? '#f59e0b' : tank.color);
    ctx.beginPath();
    ctx.arc(0, 0, turretR, 0, Math.PI * 2);
    ctx.fill();

    // Turret Bevel Specular Arc
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, turretR - 1, -Math.PI * 0.8, -Math.PI * 0.2);
    ctx.stroke();

    // Commander Cupola Hatch
    const cupolaX = -turretR * 0.35;
    const cupolaR = turretR * 0.42;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cupolaX, 0, cupolaR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isFrozen ? '#bae6fd' : '#475569';
    ctx.beginPath();
    ctx.arc(cupolaX, 0, cupolaR * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Radio Whip Antenna with blinking beacon
    const antX = -turretR * 0.6;
    const antY = -turretR * 0.55;
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(antX, antY, 1.5, 0, Math.PI * 2);
    ctx.fill();
    const beaconFlash = Math.floor(time / 250) % 2 === 0;
    ctx.fillStyle = beaconFlash ? (tank.isPlayer ? '#4ade80' : '#ef4444') : '#1e293b';
    ctx.fillRect(antX - 0.5, antY - 2.5, 1, 2);

    ctx.restore(); // Restore turret

    // 4. Forcefield Shield Dome (if active)
    if (tank.shieldTime > 0) {
      const shieldPulse = 1 + Math.sin(time * 0.012) * 0.05;
      const shieldR = (tank.width / 2 + 6) * shieldPulse;
      ctx.save();
      ctx.translate(cx, cy);

      // Shimmering inner gradient
      const sGrad = ctx.createRadialGradient(0, 0, shieldR * 0.4, 0, 0, shieldR);
      sGrad.addColorStop(0, 'rgba(56, 189, 248, 0.04)');
      sGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.16)');
      sGrad.addColorStop(1, 'rgba(56, 189, 248, 0.45)');
      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
      ctx.fill();

      // Pulsing rim
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
      ctx.stroke();

      // Hex defense runes
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = -time * 0.02;
      ctx.beginPath();
      ctx.arc(0, 0, shieldR * 0.75, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 5. Military Segmented HP Bar (for multi-HP units: Player, Boss, Heavy, Assault)
    if (tank.maxHp > 1 && (tank.hp < tank.maxHp || isBoss || tank.type === 'HEAVY')) {
      const barW = Math.max(26, tank.width);
      const barH = 4;
      const barX = cx - barW / 2;
      const barY = cy - halfH - 9;

      ctx.save();
      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(barX - 0.5, barY - 0.5, barW + 1, barH + 1);

      // Bar container
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(barX, barY, barW, barH);

      // Health Segments
      const segGap = 1;
      const segW = (barW - (tank.maxHp - 1) * segGap) / tank.maxHp;
      for (let i = 0; i < tank.maxHp; i++) {
        const sx = barX + i * (segW + segGap);
        if (i < tank.hp) {
          const hpRatio = tank.hp / tank.maxHp;
          ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : (hpRatio > 0.25 ? '#eab308' : '#ef4444');
        } else {
          ctx.fillStyle = '#334155';
        }
        ctx.fillRect(sx, barY, segW, barH);
      }
      ctx.restore();
    }

    ctx.restore();
  }

  private renderTelegraphLaser(ctx: CanvasRenderingContext2D, enemy: Tank) {
    const eCenterX = enemy.x + enemy.width / 2;
    const eCenterY = enemy.y + enemy.height / 2;
    const vec = DIR_VECTORS[enemy.dir];

    ctx.save();
    ctx.strokeStyle = `rgba(239, 68, 68, ${0.45 + Math.sin(performance.now() * 0.025) * 0.45})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);

    ctx.beginPath();
    ctx.moveTo(eCenterX, eCenterY);
    ctx.lineTo(eCenterX + vec.x * CANVAS_SIZE, eCenterY + vec.y * CANVAS_SIZE);
    ctx.stroke();

    // Red warning reticle dot at end
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(eCenterX + vec.x * 120, eCenterY + vec.y * 120, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // --- High-Velocity 2D Projectiles & Missiles ---
  private renderBullets(ctx: CanvasRenderingContext2D) {
    for (const b of this.bullets) {
      if (b.dead) continue;

      ctx.save();
      const angle = Math.atan2(b.vy, b.vx);
      ctx.translate(b.x, b.y);
      ctx.rotate(angle);

      if (b.isMissile) {
        // --- Heavy Fin-Stabilized Rocket Missile ---
        // Fiery thruster exhaust plume
        const flameLen = 8 + Math.random() * 5;
        const flameGrad = ctx.createLinearGradient(-flameLen - 4, 0, -4, 0);
        flameGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
        flameGrad.addColorStop(0.5, '#f97316');
        flameGrad.addColorStop(1, '#fef08a');
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(-4, -2.5);
        ctx.lineTo(-4 - flameLen, 0);
        ctx.lineTo(-4, 2.5);
        ctx.closePath();
        ctx.fill();

        // Rocket cylindrical body
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-5, -2.5, 9, 5);

        // Delta stabilizer fins
        ctx.fillStyle = '#7e22ce';
        ctx.beginPath();
        ctx.moveTo(-5, -5);
        ctx.lineTo(-2, -2.5);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-2, 2.5);
        ctx.lineTo(-5, 5);
        ctx.lineTo(-4, 2.5);
        ctx.lineTo(-4, -2.5);
        ctx.closePath();
        ctx.fill();

        // Red aerodynamic warhead cone
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(4, -2.5);
        ctx.lineTo(8, 0);
        ctx.lineTo(4, 2.5);
        ctx.closePath();
        ctx.fill();
      } else {
        // --- Armor-Piercing Kinetic Bullet with Dynamic Motion Tracer ---
        const tracerLen = b.isPlayer ? 18 : 14;
        const tracerColor = b.isPlayer ? 'rgba(74, 222, 128, ' : 'rgba(251, 191, 36, ';

        // High-velocity motion blur trail
        const trailGrad = ctx.createLinearGradient(-tracerLen, 0, 0, 0);
        trailGrad.addColorStop(0, `${tracerColor}0)`);
        trailGrad.addColorStop(0.7, `${tracerColor}0.4)`);
        trailGrad.addColorStop(1, `${tracerColor}0.95)`);
        ctx.fillStyle = trailGrad;
        ctx.beginPath();
        ctx.moveTo(0, -b.radius * 0.8);
        ctx.lineTo(-tracerLen, 0);
        ctx.lineTo(0, b.radius * 0.8);
        ctx.closePath();
        ctx.fill();

        // Intense glowing projectile outer corona
        ctx.fillStyle = b.isPlayer ? 'rgba(34, 197, 94, 0.4)' : 'rgba(245, 158, 11, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, b.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Aerodynamic kinetic round core
        ctx.fillStyle = b.isPlayer ? '#4ade80' : '#fbbf24';
        ctx.beginPath();
        ctx.ellipse(0, 0, b.radius * 1.2, b.radius * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();

        // White-hot penetrator tip
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(1, 0, b.radius * 0.6, b.radius * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // --- High-Tech 2D Military Supply Drop Pods (No text emojis!) ---
  private renderPowerUps(ctx: CanvasRenderingContext2D) {
    const time = performance.now();

    for (const p of this.powerUps) {
      if (p.dead) continue;
      // Urgency blink when expiring (< 4s left)
      if (p.duration < 4 && Math.floor(time / 110) % 2 === 0) continue;

      ctx.save();
      ctx.translate(p.x, p.y);

      // Pulsing scale bounce
      const pulse = 1 + Math.sin(time * 0.005) * 0.07;
      ctx.scale(pulse, pulse);

      // 1. Expanding Beacon Wave Ring
      const wavePhase = (time * 0.002) % 1;
      const waveR = 14 + wavePhase * 18;
      ctx.strokeStyle = `rgba(250, 204, 21, ${(1 - wavePhase) * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, waveR, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Soft Drop Shadow
      ctx.fillStyle = 'rgba(2, 6, 23, 0.55)';
      ctx.beginPath();
      ctx.arc(1.5, 2.5, 13, 0, Math.PI * 2);
      ctx.fill();

      // 3. High-Tech Octagonal Military Drop Crate
      const crateSize = 13;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(-crateSize + 3, -crateSize);
      ctx.lineTo(crateSize - 3, -crateSize);
      ctx.lineTo(crateSize, -crateSize + 3);
      ctx.lineTo(crateSize, crateSize - 3);
      ctx.lineTo(crateSize - 3, crateSize);
      ctx.lineTo(-crateSize + 3, crateSize);
      ctx.lineTo(-crateSize, crateSize - 3);
      ctx.lineTo(-crateSize, -crateSize + 3);
      ctx.closePath();
      ctx.fill();

      // Inner Armor Plate
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-crateSize + 2, -crateSize + 2, (crateSize - 2) * 2, (crateSize - 2) * 2);

      // Glowing Neon Border
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 4. Bespoke Vector-Drawn Tactical Icons
      ctx.save();
      switch (p.type) {
        case 'STAR': {
          // Golden 5-point Military Star with 3D Facets
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const outAng = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const inAng = outAng + Math.PI / 5;
            const ox = Math.cos(outAng) * 7.5;
            const oy = Math.sin(outAng) * 7.5;
            const ix = Math.cos(inAng) * 3.5;
            const iy = Math.sin(inAng) * 3.5;
            if (i === 0) ctx.moveTo(ox, oy);
            else ctx.lineTo(ox, oy);
            ctx.lineTo(ix, iy);
          }
          ctx.closePath();
          ctx.fill();
          // Star core gleam
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'SHIELD': {
          // Layered Cyan Energy Crest Shield
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.moveTo(0, -7.5);
          ctx.lineTo(6.5, -4);
          ctx.lineTo(5, 3.5);
          ctx.lineTo(0, 8);
          ctx.lineTo(-5, 3.5);
          ctx.lineTo(-6.5, -4);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(0, -5.5);
          ctx.lineTo(4.5, -3);
          ctx.lineTo(3.5, 2.5);
          ctx.lineTo(0, 6);
          ctx.lineTo(-3.5, 2.5);
          ctx.lineTo(-4.5, -3);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-1, -3.5, 2, 7);
          ctx.fillRect(-3.5, -1, 7, 2);
          break;
        }

        case 'BOMB': {
          // Heavy Ordnance Bomb with Burning Fuse
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.arc(0, 1.5, 6, 0, Math.PI * 2);
          ctx.fill();

          // Hazard yellow belt
          ctx.fillStyle = '#eab308';
          ctx.fillRect(-5, 0.5, 10, 2);

          // Bomb neck & spark fuse
          ctx.fillStyle = '#475569';
          ctx.fillRect(-2, -6, 4, 2.5);
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, -6);
          ctx.quadraticCurveTo(3, -9, 5, -8);
          ctx.stroke();

          // Spark tip
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(5, -8, 1.5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'CLOCK': {
          // Chrono-Stasis Clock Face
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.arc(0, 0, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Clock hands pointing at 10:10
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-3, -3);
          ctx.moveTo(0, 0);
          ctx.lineTo(3, -2);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, 1.2, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'SHOVEL': {
          // Tactical Military Entrenching Spade (Xẻng công sự chiến thuật)
          ctx.save();
          ctx.rotate(-Math.PI / 4);
          // Shovel Steel Shaft
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(-1.5, -7, 3, 9);
          // D-Grip on top
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-3.5, -8.5, 7, 3);
          // High-grade Steel Spade Blade
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(-5, 2);
          ctx.lineTo(5, 2);
          ctx.lineTo(4.5, 7);
          ctx.lineTo(0, 9.5);
          ctx.lineTo(-4.5, 7);
          ctx.closePath();
          ctx.fill();
          // Blade bevel ridge
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, 2);
          ctx.lineTo(0, 9.5);
          ctx.stroke();
          ctx.restore();
          break;
        }

        case 'FORTRESS': {
          // Imperial Fortified Bastion Citadel (Thành trì pháo đài hoàng kim)
          ctx.fillStyle = '#f59e0b';
          // Crenellated bastion battlements
          ctx.fillRect(-6.5, -6.5, 3.5, 5);
          ctx.fillRect(-1.5, -4.5, 3, 3);
          ctx.fillRect(3, -6.5, 3.5, 5);
          ctx.fillRect(-6.5, -1.5, 13, 7.5);

          // Keystone gold trim
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(-6.5, -2, 13, 1.5);

          // Reinforced energy archway
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(0, 4.5, 3.5, Math.PI, 0);
          ctx.fill();

          // Glowing energy core inside gate
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(0, 4.5, 1.5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'HEART': {
          // Crimson Medical Combat Stim
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(0, 6.5);
          ctx.bezierCurveTo(6, 2, 7, -4, 3, -6);
          ctx.bezierCurveTo(1.5, -6.5, 0, -4.5, 0, -3.5);
          ctx.bezierCurveTo(0, -4.5, -1.5, -6.5, -3, -6);
          ctx.bezierCurveTo(-7, -4, -6, 2, 0, 6.5);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-1, -2, 2, 5);
          ctx.fillRect(-2.5, -0.5, 5, 2);
          break;
        }

        case 'SPEED': {
          // Twin High-Voltage Lightning Bolts
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.moveTo(2, -7.5);
          ctx.lineTo(-4, 0);
          ctx.lineTo(-0.5, 0);
          ctx.lineTo(-2, 7.5);
          ctx.lineTo(4, 0);
          ctx.lineTo(0.5, 0);
          ctx.closePath();
          ctx.fill();
          break;
        }
      }
      ctx.restore();

      // 5. Glossy Glass Lens Reflection Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.beginPath();
      ctx.ellipse(-3, -4, 5, 2.5, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // --- High-Legibility Floating Combat Text ---
  private renderFloatTexts(ctx: CanvasRenderingContext2D) {
    for (const ft of this.floatTexts) {
      if (ft.dead) continue;
      ctx.save();
      const alpha = Math.max(0, ft.life / ft.maxLife);
      ctx.globalAlpha = alpha;

      // Dark shadow outline for 100% legibility on any ground texture
      ctx.font = '900 11.5px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.lineWidth = 3;
      ctx.strokeText(ft.text, ft.x, ft.y);

      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  private syncStats() {
    const cfg = BASE_TIERS[this.baseTier - 1];
    if (this.player) {
      this.stats.playerHp = Math.max(0, this.player.hp);
      this.stats.playerMaxHp = this.player.maxHp;
      this.stats.playerTier = this.player.tier + 1;
    } else {
      this.stats.playerHp = 0;
    }
    this.stats.baseHp = Math.max(0, this.baseHp);
    this.stats.baseMaxHp = cfg.maxHp;
    this.stats.baseTier = this.baseTier;
    this.stats.baseTierName = cfg.name;
    this.stats.baseShieldHp = Math.max(0, Math.round(this.baseShieldHp));
    this.stats.baseShieldMaxHp = this.baseShieldMaxHp;
    this.stats.baseShieldActive = this.baseShieldHp > 0;
    this.stats.baseUpgradeCost = cfg.upgradeCost;
    this.stats.canUpgradeBase = this.baseTier < 5 && this.stats.score >= cfg.upgradeCost;
    this.stats.weather = weatherSystem.currentWeather;
    this.stats.isWeatherEnabled = weatherSystem.isEnabled;

    if (this.onStatsUpdate) {
      const remainingEnemies = this.enemyQueue.length + this.enemies.length;
      this.onStatsUpdate({ ...this.stats }, remainingEnemies);
    }
  }

  public toggleWeather() {
    const res = weatherSystem.toggleWeather();
    this.syncStats();
    return res;
  }
}
