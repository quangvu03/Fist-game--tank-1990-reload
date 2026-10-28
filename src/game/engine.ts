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
  PlayerCombatStats,
  ActiveBuffInfo,
} from '../types/game';
import {
  GRID_COLS,
  GRID_ROWS,
  TILE_SIZE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_SIZE,
  TANK_SIZE,
  BULLET_RADIUS,
  MISSILE_RADIUS,
  ENEMY_CONFIGS,
  PLAYER_TIERS,
  DIR_VECTORS,
  BASE_TIERS,
  BASE_COORD,
  BASE_CENTER,
  BASE_SHIELD_RADIUS,
} from './constants';
import { soundEngine } from '../audio/soundEngine';
import { particleSystem } from './particleSystem';
import { weatherSystem } from './weatherSystem';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private terrainCanvas!: HTMLCanvasElement;

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
  private speedBoostTimer: number = 0;

  // Entities
  public player: Tank | null = null;
  public enemies: Tank[] = [];
  public enemyQueue: EnemyType[] = [];
  public bullets: Bullet[] = [];
  public trackMarks: TrackMark[] = [];
  public powerUps: PowerUp[] = [];
  public floatTexts: FloatText[] = [];

  // Spawning (Left flank, Center, Right flank across 34 columns)
  private spawnPoints = [
    { x: 1 * TILE_SIZE, y: 1 * TILE_SIZE },
    { x: 16 * TILE_SIZE, y: 1 * TILE_SIZE },
    { x: 31 * TILE_SIZE, y: 1 * TILE_SIZE },
  ];
  private nextSpawnIndex: number = 0;
  private spawnCooldown: number = 1.0;

  // Hunter Tank Lifecycle Management (Sinh ra từ xe tăng mới sau thời gian hoặc số lượng địch bị hạ)
  private hunterCooldownTimer: number = 2.0;
  private killsSinceHunterDied: number = 0;
  private isHunterPending: boolean = true;

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
    totalStages: 21,
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
    combatStats: {
      speed: 110,
      baseSpeed: 110,
      speedBoostActive: false,
      speedBoostRemaining: 0,
      bulletSpeed: 260,
      reloadMax: 0.45,
      fireRate: 2.2,
      doubleShot: false,
      canBreakSteel: false,
      tier: 1,
      tierName: 'Pháo Cơ Bản',
    },
    activeBuffs: [],
  };

  // Juiciness & Game Feel
  private hitstopTimer: number = 0;
  private cameraShake: number = 0;
  private shakeOffsetX: number = 0;
  private shakeOffsetY: number = 0;

  // Camera & Viewport tracking (for large expandable Survival maps)
  public cameraX: number = 0;
  public cameraY: number = 0;
  private targetCameraX: number = 0;
  private targetCameraY: number = 0;
  private expansionCooldownTimer: number = 0;
  private wasPlayerInBush: boolean = false;
  // Bush cluster line-of-sight tracking (only connected bush patch entered by player is revealed)
  private revealedBushTileIndices: Set<number> = new Set();

  // Input
  private keysHeld: Record<string, boolean> = {};
  public gridCols: number = GRID_COLS;
  public gridRows: number = GRID_ROWS;
  public canvasWidth: number = CANVAS_WIDTH;
  public canvasHeight: number = CANVAS_HEIGHT;
  public viewWidth: number = CANVAS_WIDTH;
  public viewHeight: number = CANVAS_HEIGHT;
  public baseCoord = BASE_COORD;
  public baseCenter = BASE_CENTER;
  public scale: number = 1.0;
  public zoom: number = 1.0;
  public originX: number = 0;
  public originY: number = 0;
  public viewportWidth: number = CANVAS_WIDTH;
  public viewportHeight: number = CANVAS_HEIGHT;
  public mousePos = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };

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
    },
    initialProgression?: {
      baseTier?: number;
      playerTier?: number;
      score?: number;
      lives?: number;
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

    if (initialProgression?.baseTier) {
      this.baseTier = initialProgression.baseTier;
    }
    if (initialProgression?.score !== undefined) {
      this.stats.score = initialProgression.score;
    }
    if (initialProgression?.lives !== undefined) {
      this.stats.lives = initialProgression.lives;
    }

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

    this.initListeners();
    this.resetStage(stageConfig, true, initialProgression?.playerTier);
  }

  public setZoom(_zoom: number) {
    this.zoom = 1.0;
    this.syncStats();
  }

  public getZoom(): number {
    return 1.0;
  }

  public cycleZoom(): number {
    this.zoom = 1.0;
    return 1.0;
  }

  public updateViewportSize(_dt: number = 0.016) {
    const fallbackW = this.canvasWidth > 0 ? this.canvasWidth : CANVAS_WIDTH;
    const fallbackH = this.canvasHeight > 0 ? this.canvasHeight : CANVAS_HEIGHT;
    const clientW = this.canvas.clientWidth > 0 ? this.canvas.clientWidth : fallbackW;
    const clientH = this.canvas.clientHeight > 0 ? this.canvas.clientHeight : fallbackH;
    if (this.canvas.width !== clientW || this.canvas.height !== clientH) {
      this.canvas.width = clientW;
      this.canvas.height = clientH;
    }
    this.viewportWidth = clientW;
    this.viewportHeight = clientH;

    this.viewWidth = Math.min(this.canvasWidth, CANVAS_WIDTH);
    this.viewHeight = Math.min(this.canvasHeight, CANVAS_HEIGHT);

    // Fixed 100% scale preserving 1:1 square pixel aspect ratio and fitting visible view window into viewport
    const scaleX = clientW / Math.max(1, this.viewWidth);
    const scaleY = clientH / Math.max(1, this.viewHeight);
    this.scale = Math.max(0.1, Math.min(scaleX, scaleY));
    this.zoom = 1.0;

    const scaledW = this.viewWidth * this.scale;
    const scaledH = this.viewHeight * this.scale;

    // Perfectly center arena on screen
    this.originX = Math.round((clientW - scaledW) / 2);
    this.originY = Math.round((clientH - scaledH) / 2);

    weatherSystem.setBounds(clientW, clientH);
  }

  public resetStage(stageConfig: StageConfig, preservePlayerUpgrade: boolean = true, forcedPlayerTier?: number) {
    this.currentStageConfig = stageConfig;
    this.stats.stage = stageConfig.id;

    this.gridCols = GRID_COLS;
    this.gridRows = GRID_ROWS;
    this.canvasWidth = CANVAS_WIDTH;
    this.canvasHeight = CANVAS_HEIGHT;
    this.baseCoord = BASE_COORD;
    this.baseCenter = BASE_CENTER;

    if (this.gameMode === 'SURVIVAL') {
      // Massive Survival battlefield (56 cols x 40 rows)
      this.gridCols = stageConfig.grid[0].length;
      this.gridRows = stageConfig.grid.length;
      this.canvasWidth = this.gridCols * TILE_SIZE;
      this.canvasHeight = this.gridRows * TILE_SIZE;

      this.grid = [];
      for (let r = 0; r < this.gridRows; r++) {
        this.grid[r] = [...stageConfig.grid[r]];
      }

      // Ensure center staging zone for player is clear
      const midC = Math.floor(this.gridCols / 2);
      const midR = Math.floor(this.gridRows / 2);
      for (let r = midR - 2; r <= midR + 2; r++) {
        for (let c = midC - 2; c <= midC + 2; c++) {
          if (r >= 0 && r < this.gridRows && c >= 0 && c < this.gridCols) {
            this.grid[r][c] = TileType.EMPTY;
          }
        }
      }

      // Symmetrical & perimeter tactical spawn points across large survival map (guaranteed clear zones)
      this.spawnPoints = [
        { x: 6 * TILE_SIZE, y: 3 * TILE_SIZE },
        { x: 18 * TILE_SIZE, y: 3 * TILE_SIZE },
        { x: 28 * TILE_SIZE, y: 3 * TILE_SIZE },
        { x: 38 * TILE_SIZE, y: 3 * TILE_SIZE },
        { x: 49 * TILE_SIZE, y: 3 * TILE_SIZE },
        { x: 6 * TILE_SIZE, y: (this.gridRows - 4) * TILE_SIZE },
        { x: 18 * TILE_SIZE, y: (this.gridRows - 4) * TILE_SIZE },
        { x: 28 * TILE_SIZE, y: (this.gridRows - 4) * TILE_SIZE },
        { x: 38 * TILE_SIZE, y: (this.gridRows - 4) * TILE_SIZE },
        { x: 49 * TILE_SIZE, y: (this.gridRows - 4) * TILE_SIZE },
        { x: 3 * TILE_SIZE, y: 14 * TILE_SIZE },
        { x: 3 * TILE_SIZE, y: 25 * TILE_SIZE },
        { x: (this.gridCols - 4) * TILE_SIZE, y: 14 * TILE_SIZE },
        { x: (this.gridCols - 4) * TILE_SIZE, y: 25 * TILE_SIZE },
      ];

      // Guarantee all spawn zones in grid are 100% EMPTY so no tank ever gets stuck!
      for (const sp of this.spawnPoints) {
        const sc = Math.floor(sp.x / TILE_SIZE);
        const sr = Math.floor(sp.y / TILE_SIZE);
        for (let r = sr - 1; r <= sr + 2; r++) {
          for (let c = sc - 1; c <= sc + 2; c++) {
            if (r >= 0 && r < this.gridRows && c >= 0 && c < this.gridCols) {
              this.grid[r][c] = TileType.EMPTY;
            }
          }
        }
      }
    } else {
      // Symmetrical strategic spawn points across 34-column battlefield
      this.spawnPoints = [
        { x: 1 * TILE_SIZE, y: 1 * TILE_SIZE },
        { x: 8 * TILE_SIZE, y: 1 * TILE_SIZE },
        { x: 16 * TILE_SIZE, y: 1 * TILE_SIZE },
        { x: 25 * TILE_SIZE, y: 1 * TILE_SIZE },
        { x: 31 * TILE_SIZE, y: 1 * TILE_SIZE },
      ];

      // Initialize 26 rows x 34 columns grid
      this.grid = [];
      for (let r = 0; r < GRID_ROWS; r++) {
        this.grid[r] = new Array(GRID_COLS).fill(TileType.EMPTY);
      }

      // Map pristine stage layout into center (cols 4..29)
      const offsetCol = Math.floor((GRID_COLS - stageConfig.grid[0].length) / 2); // 4
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < stageConfig.grid[r].length; c++) {
          this.grid[r][offsetCol + c] = stageConfig.grid[r][c];
        }
      }

      // Populate flanking tactical corridors (cols 0..3 and cols 30..33)
      this.populateFlankTactics(stageConfig.id);
    }

    this.updateViewportSize();
    this.terrainCanvas = this.generateTerrainCanvas();

    if (this.gameMode === 'SURVIVAL') {
      // IN SURVIVAL MODE: NO HOME BASE!
      this.baseTier = 1;
      this.baseHp = 0;
      this.stats.baseHp = 0;
      this.stats.baseMaxHp = 0;
      this.baseShieldHp = 0;
      this.baseShieldMaxHp = 0;
      this.stats.baseShieldHp = 0;
      this.stats.baseShieldMaxHp = 0;
      this.stats.baseShieldActive = false;
      this.stats.canUpgradeBase = false;
      this.isBaseDestroyed = false;
    } else {
      // Progressive base tiering based on stage advancement ("càng về sau căn cứ càng cứng hơn")
      let naturalStageTier = 1;
      if (this.gameMode === 'CAMPAIGN') {
        if (stageConfig.id >= 9) naturalStageTier = 5;
        else if (stageConfig.id >= 7) naturalStageTier = 4;
        else if (stageConfig.id >= 5) naturalStageTier = 3;
        else if (stageConfig.id >= 3) naturalStageTier = 2;
        else naturalStageTier = 1;
      } else {
        naturalStageTier = 4; // Boss rush provides tier 4 fortress
      }

      // Preserve player upgrades if they previously upgraded the base to a higher tier
      const finalTier = Math.max(naturalStageTier, this.baseTier);
      this.applyBaseTier(finalTier, false);
    }

    this.isBaseDestroyed = false;
    this.isStageEnding = false;
    this.isPlayerDying = false;
    this.shovelTimer = 0;
    this.clockFreezeTimer = 0;
    this.speedBoostTimer = 0;
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
    const prevTier = forcedPlayerTier !== undefined
      ? forcedPlayerTier
      : ((preservePlayerUpgrade && this.player) ? this.player.tier : 0);
    this.spawnPlayer(prevTier);

    this.spawnCooldown = 0.5;
    this.hunterCooldownTimer = 2.0;
    this.killsSinceHunterDied = 0;
    this.isHunterPending = true;
    this.syncStats();
  }

  private populateFlankTactics(stageId: number) {
    // Symmetrical flanking tactical cover:
    // Columns 0 & 3, and 30 & 33 are clear high-speed transit highway corridors
    // Columns 1 & 2, and 31 & 32 contain tactical cover:
    for (let r = 4; r <= 7; r++) {
      this.grid[r][1] = TileType.BRICK;
      this.grid[r][32] = TileType.BRICK;
    }

    // Midfield bunker (Steel or Crate based on stage)
    const bunkerTile = stageId >= 5 ? TileType.STEEL : TileType.BRICK;
    this.grid[10][1] = bunkerTile;
    this.grid[10][2] = bunkerTile;
    this.grid[10][31] = bunkerTile;
    this.grid[10][32] = bunkerTile;

    // Southern defense crates
    for (let r = 14; r <= 17; r++) {
      this.grid[r][2] = TileType.BRICK;
      this.grid[r][31] = TileType.BRICK;
    }
  }

  public applyBaseTier(tier: number, isUpgrade: boolean = false) {
    if (this.gameMode === 'SURVIVAL') return;
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

    // Apply hardened perimeter walls around base footprint (cols 15-18, rows 23-25)
    for (let c = 15; c <= 18; c++) {
      this.grid[23][c] = cfg.wallType;
    }
    this.grid[24][15] = cfg.wallType;
    this.grid[25][15] = cfg.wallType;
    this.grid[24][18] = cfg.wallType;
    this.grid[25][18] = cfg.wallType;

    // Ensure base tiles are intact
    if (!this.isBaseDestroyed) {
      this.grid[24][16] = TileType.BASE;
      this.grid[24][17] = TileType.BASE;
      this.grid[25][16] = TileType.BASE;
      this.grid[25][17] = TileType.BASE;
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
    if (this.gameMode === 'SURVIVAL') return false;
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
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const mappedX = (clientX - this.originX) / Math.max(0.001, this.scale);
    const mappedY = (clientY - this.originY) / Math.max(0.001, this.scale);
    const worldX = mappedX + (this.gameMode === 'SURVIVAL' ? this.cameraX : 0);
    const worldY = mappedY + (this.gameMode === 'SURVIVAL' ? this.cameraY : 0);
    this.mousePos = {
      x: Math.max(0, Math.min(this.canvasWidth, worldX)),
      y: Math.max(0, Math.min(this.canvasHeight, worldY)),
    };
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      this.firePlayerBullet();
    }
  };

  public setControlMode(_mode: ControlMode) {
    this.controlMode = 'CLASSIC';
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

  public getBaseTier(): number {
    return this.baseTier;
  }

  public getPlayerTier(): number {
    return this.player ? this.player.tier : 0;
  }

  public getScore(): number {
    return this.stats.score;
  }

  public getLives(): number {
    return this.stats.lives;
  }

  // --- Spawning ---
  private spawnPlayer(tier: number = 0) {
    const playerTierConfig = PLAYER_TIERS[Math.min(tier, PLAYER_TIERS.length - 1)];
    let spawnX = (this.baseCoord.col - 3) * TILE_SIZE;
    let spawnY = this.baseCoord.row * TILE_SIZE;

    if (this.gameMode === 'SURVIVAL') {
      const midC = Math.floor(this.gridCols / 2);
      const midR = Math.floor(this.gridRows / 2);
      // Guarantee player staging ground is completely open
      for (let r = midR - 2; r <= midR + 2; r++) {
        for (let c = midC - 2; c <= midC + 2; c++) {
          if (r >= 0 && r < this.gridRows && c >= 0 && c < this.gridCols) {
            this.grid[r][c] = TileType.EMPTY;
          }
        }
      }
      spawnX = midC * TILE_SIZE;
      spawnY = midR * TILE_SIZE;
      const maxCamX = Math.max(0, this.canvasWidth - this.viewWidth);
      const maxCamY = Math.max(0, this.canvasHeight - this.viewHeight);
      this.cameraX = Math.max(0, Math.min(maxCamX, spawnX - this.viewWidth / 2));
      this.cameraY = Math.max(0, Math.min(maxCamY, spawnY - this.viewHeight / 2));
      this.targetCameraX = this.cameraX;
      this.targetCameraY = this.cameraY;
    }

    const speedBoost = this.speedBoostTimer > 0 ? 35 : 0;
    const reloadSpeed = this.speedBoostTimer > 0 ? playerTierConfig.reloadMax * 0.8 : playerTierConfig.reloadMax;

    this.player = {
      id: 'player',
      type: 'PLAYER',
      x: spawnX,
      y: spawnY,
      width: TANK_SIZE,
      height: TANK_SIZE,
      dir: 'UP',
      turretAngle: -Math.PI / 2,
      speed: playerTierConfig.speed + speedBoost,
      maxHp: playerTierConfig.maxHp,
      hp: playerTierConfig.maxHp,
      tier,
      isPlayer: true,
      isFlashing: false,
      reloadTimer: 0,
      reloadMax: reloadSpeed,
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
      e => Math.hypot(e.x - spawn.x, e.y - spawn.y) < TANK_SIZE * 1.2
    ) || (this.player && Math.hypot(this.player.x - spawn.x, this.player.y - spawn.y) < TANK_SIZE * 1.5)
    || this.checkTankCollision(spawn.x, spawn.y, TANK_SIZE, TANK_SIZE, '');

    if (isBlocked) return;

    const enemyType = this.enemyQueue.shift();
    if (!enemyType) return;

    const cfg = ENEMY_CONFIGS[enemyType];
    const isFlashing = Math.random() < 0.28 || enemyType === 'BOSS';
    const isBoss = enemyType === 'BOSS';
    const size = isBoss ? TANK_SIZE * 1.4 : TANK_SIZE;

    // Level-based difficulty scaling:
    // Stage 1 starts at 68% speed (accessible, gentle learning curve)
    // Progressively scales up +6% per stage, capped at 1.25x (Stage 8+)
    const stage = Math.max(1, this.stats.stage);
    const speedMultiplier = Math.min(1.25, 0.68 + (stage - 1) * 0.06);
    const scaledSpeed = Math.round(cfg.speed * speedMultiplier);

    // Enemy reload cooldown scaling:
    // In Stage 1, enemies take 25% longer between shots so player isn't overwhelmed.
    // Scales to faster firing in later stages (capped at 0.8x cooldown)
    const reloadMultiplier = Math.max(0.80, 1.25 - (stage - 1) * 0.05);
    const scaledReloadMax = Math.round(cfg.reloadMax * reloadMultiplier * 100) / 100;

    // Configure Boss attributes per user request:
    // "1 boss như xe tăng truy sát hiện tại vậy có nòng xoay 360 di chuyển như vậy nhưng hp trâu hơn và tốc độ chậm hơn"
    const is360Boss = isBoss;
    let effectiveHp = cfg.hp;
    let effectiveSpeed = scaledSpeed;
    let effectiveReloadMax = scaledReloadMax;
    let enemyName = cfg.name;
    let enemyColor = cfg.color;

    if (isBoss) {
      effectiveHp = stage >= 21 ? 24 : (stage >= 20 ? 20 : (stage >= 15 ? 18 : 14)); // 24 HP ở Màn 21, 20 HP ở Màn 20, 14 HP ở Màn 10
      effectiveSpeed = 46; // Tốc độ chậm hơn, lừng lững uy nghi
      effectiveReloadMax = 2.4; // Bắn chậm hơn (2.4s giữa các đợt nã đạn) để người chơi có thời gian phản ứng né đạn
      enemyName = stage === 20 ? 'Siêu Trùm Pháo Tháp 360°' : (stage === 21 ? 'Đại Soái Titan 360°' : 'Chiến Hạm Titan Tối Thượng');
      enemyColor = '#e11d48';
    }

    // Check if this newly spawned tank should be designated as the Hunter (regular hunter, not boss)
    const hasLivingHunter = this.enemies.some(e => e && e.hp > 0 && e.isHunter);
    const shouldBeHunter = !isBoss && !hasLivingHunter && this.isHunterPending && (this.hunterCooldownTimer <= 0 || this.killsSinceHunterDied >= 3);

    if (shouldBeHunter) {
      effectiveSpeed = Math.max(scaledSpeed, 85);
      effectiveReloadMax = Math.min(scaledReloadMax, 0.9);
      enemyName = `Truy Sát ${cfg.name}`;
      enemyColor = '#ef4444';
    }

    const enemy: Tank = {
      id: `enemy_${Date.now()}_${Math.random()}`,
      type: enemyType,
      x: spawn.x,
      y: spawn.y,
      width: size,
      height: size,
      dir: 'DOWN',
      turretAngle: Math.PI / 2,
      speed: effectiveSpeed,
      maxHp: effectiveHp,
      hp: effectiveHp,
      tier: isBoss ? 3 : 1,
      isPlayer: false,
      isFlashing,
      reloadTimer: isBoss ? 1.8 : (shouldBeHunter ? 0.6 : Math.random() * scaledReloadMax),
      reloadMax: effectiveReloadMax,
      shieldTime: 0,
      frozenTime: 0,
      scoreValue: cfg.scoreValue + (shouldBeHunter ? 150 : (isBoss ? (stage >= 21 ? 2000 : (stage >= 20 ? 1500 : 500)) : 0)),
      name: enemyName,
      color: enemyColor,
      tracksOffset: 0,
      stuckTimer: 0,
      currentDecisionTimer: (shouldBeHunter || isBoss) ? 0.2 : (0.5 + Math.random() * 1.0),
      isHunter: shouldBeHunter,
      is360Boss,
    };

    if (isBoss) {
      this.addFloatText(spawn.x + size / 2, spawn.y - 14, `👑 ${enemyName.toUpperCase()} XUẤT HIỆN!`, '#f59e0b');
      soundEngine.playBaseAlert();
      this.addCameraShake(7);
    } else if (shouldBeHunter) {
      this.isHunterPending = false;
      this.hunterCooldownTimer = 0;
      this.killsSinceHunterDied = 0;
      this.addFloatText(spawn.x + size / 2, spawn.y - 12, '⚠️ XE TRUY SÁT XUẤT HIỆN!', '#ef4444');
      soundEngine.playBaseAlert();
    }

    this.enemies.push(enemy);
    particleSystem.emitSpawnBurst(spawn.x + size / 2, spawn.y + size / 2, (isBoss ? '#f59e0b' : (shouldBeHunter ? '#ef4444' : cfg.color)));
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

    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer = Math.max(0, this.speedBoostTimer - dt);
    }

    if (this.hunterCooldownTimer > 0) {
      this.hunterCooldownTimer = Math.max(0, this.hunterCooldownTimer - dt);
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
          this.addFloatText(this.baseCenter.x, this.baseCenter.y - 20, 'KHIÊN CĂN CỨ ĐÃ HỒI PHỤC!', cfg.shieldColor);
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
          const dist = Math.hypot(ex - this.baseCenter.x, ey - this.baseCenter.y);
          if (dist < minDistance) {
            minDistance = dist;
            closestEnemy = enemy;
          }
        }
      }

      if (closestEnemy) {
        const ex = closestEnemy.x + closestEnemy.width / 2;
        const ey = closestEnemy.y + closestEnemy.height / 2;
        this.baseTurretAngle = Math.atan2(ey - this.baseCenter.y, ex - this.baseCenter.x);

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
    this.updateRevealedBushCluster();



    // Update Enemies - guarantee at least one tank acts as designated Hunter
    this.ensureActiveHunterTank();
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

    // Survival mode tracking & dynamic map expansion
    if (this.gameMode === 'SURVIVAL') {
      this.updateSurvivalMode(dt);
    }

    // Check Stage Victory (In Survival Mode: Win when ALL enemies are destroyed!)
    if (
      this.enemyQueue.length === 0 &&
      this.enemies.length === 0 &&
      !this.isStageEnding &&
      (this.gameMode === 'SURVIVAL' || !this.isBaseDestroyed)
    ) {
      this.triggerStageClear();
    }
  }

  // --- Dynamic Map Expansion & Camera Tracking for Survival Mode ---
  private updateSurvivalMode(dt: number) {
    if (this.expansionCooldownTimer > 0) {
      this.expansionCooldownTimer -= dt;
    }

    // Dynamic map expansion when player/camera approaches battlefield edge
    // Expands before camera reaches clamping point so camera NEVER stops following the player smoothly
    if (this.player && this.player.hp > 0 && !this.isPlayerDying && this.expansionCooldownTimer <= 0) {
      const pCenterX = this.player.x + this.player.width / 2;
      const pCenterY = this.player.y + this.player.height / 2;

      // Expand margin: 3 tiles before the visible camera view touches current world boundary
      const expandMargin = 3 * TILE_SIZE;

      const atRightEdge = (pCenterX + this.viewWidth / 2 >= this.canvasWidth - expandMargin);
      const atBottomEdge = (pCenterY + this.viewHeight / 2 >= this.canvasHeight - expandMargin);
      const atLeftEdge = (pCenterX - this.viewWidth / 2 <= expandMargin);
      const atTopEdge = (pCenterY - this.viewHeight / 2 <= expandMargin);

      if (atRightEdge && this.gridCols < 96) {
        this.expandMap('RIGHT', 8);
      } else if (atBottomEdge && this.gridRows < 72) {
        this.expandMap('DOWN', 8);
      } else if (atLeftEdge && this.gridCols < 96) {
        this.expandMap('LEFT', 8);
      } else if (atTopEdge && this.gridRows < 72) {
        this.expandMap('UP', 8);
      }
    }

    // Smooth Camera Tracking (Continuously centers on the player and clamps only at true world limits)
    if (this.player && this.player.hp > 0 && !this.isPlayerDying) {
      const pCenterX = this.player.x + this.player.width / 2;
      const pCenterY = this.player.y + this.player.height / 2;

      this.targetCameraX = pCenterX - this.viewWidth / 2;
      this.targetCameraY = pCenterY - this.viewHeight / 2;

      const maxCamX = Math.max(0, this.canvasWidth - this.viewWidth);
      const maxCamY = Math.max(0, this.canvasHeight - this.viewHeight);

      this.targetCameraX = Math.max(0, Math.min(maxCamX, this.targetCameraX));
      this.targetCameraY = Math.max(0, Math.min(maxCamY, this.targetCameraY));

      const lerpSpeed = 10.0;
      this.cameraX += (this.targetCameraX - this.cameraX) * Math.min(1.0, dt * lerpSpeed);
      this.cameraY += (this.targetCameraY - this.cameraY) * Math.min(1.0, dt * lerpSpeed);
    }
  }

  private generateExpansionTile(c: number, r: number): TileType {
    // Keep arterial grid lanes completely open for navigation every 4 tiles
    if (c % 4 === 0 || r % 4 === 0) return TileType.EMPTY;

    const seed = (c * 37 + r * 53 + this.stats.stage * 113) % 10000;
    const v = Math.sin(seed * 0.17) * Math.cos(seed * 0.29);
    if (v > 0.44) return TileType.BRICK;
    if (v < -0.82) return TileType.STEEL;
    if (v > 0.26 && v <= 0.44 && Math.sin(c * 0.4) > 0.35) return TileType.BUSH;
    if (v < -0.45 && v >= -0.82 && Math.cos(r * 0.4) > 0.35) return TileType.EXPLOSIVE_BARREL;
    return TileType.EMPTY;
  }

  private expandMap(direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN', amount: number = 8) {
    if (this.gridCols >= 96 && (direction === 'LEFT' || direction === 'RIGHT')) return;
    if (this.gridRows >= 72 && (direction === 'UP' || direction === 'DOWN')) return;

    // Fast, responsive cooldown so multiple expansions chain smoothly without stutter
    this.expansionCooldownTimer = 0.15;

    if (direction === 'RIGHT') {
      const startCol = this.gridCols;
      this.gridCols += amount;
      this.canvasWidth = this.gridCols * TILE_SIZE;
      for (let r = 0; r < this.gridRows; r++) {
        for (let c = startCol; c < this.gridCols; c++) {
          this.grid[r].push(this.generateExpansionTile(c, r));
        }
      }
      const newSp = [
        { x: (this.gridCols - 4) * TILE_SIZE, y: 3 * TILE_SIZE },
        { x: (this.gridCols - 4) * TILE_SIZE, y: Math.floor(this.gridRows / 2) * TILE_SIZE },
        { x: (this.gridCols - 4) * TILE_SIZE, y: (this.gridRows - 4) * TILE_SIZE }
      ];
      // Guarantee clear zone around new spawn points
      for (const sp of newSp) {
        const sc = Math.floor(sp.x / TILE_SIZE);
        const sr = Math.floor(sp.y / TILE_SIZE);
        for (let r = sr - 1; r <= sr + 2; r++) {
          for (let c = sc - 1; c <= sc + 2; c++) {
            if (r >= 0 && r < this.gridRows && c >= 0 && c < this.gridCols) {
              this.grid[r][c] = TileType.EMPTY;
            }
          }
        }
      }
      this.spawnPoints.push(...newSp);
    } else if (direction === 'DOWN') {
      const startRow = this.gridRows;
      this.gridRows += amount;
      this.canvasHeight = this.gridRows * TILE_SIZE;
      for (let r = startRow; r < this.gridRows; r++) {
        const row: number[] = [];
        for (let c = 0; c < this.gridCols; c++) {
          row.push(this.generateExpansionTile(c, r));
        }
        this.grid.push(row);
      }
      const newSp = [
        { x: 3 * TILE_SIZE, y: (this.gridRows - 4) * TILE_SIZE },
        { x: Math.floor(this.gridCols / 2) * TILE_SIZE, y: (this.gridRows - 4) * TILE_SIZE },
        { x: (this.gridCols - 4) * TILE_SIZE, y: (this.gridRows - 4) * TILE_SIZE }
      ];
      for (const sp of newSp) {
        const sc = Math.floor(sp.x / TILE_SIZE);
        const sr = Math.floor(sp.y / TILE_SIZE);
        for (let r = sr - 1; r <= sr + 2; r++) {
          for (let c = sc - 1; c <= sc + 2; c++) {
            if (r >= 0 && r < this.gridRows && c >= 0 && c < this.gridCols) {
              this.grid[r][c] = TileType.EMPTY;
            }
          }
        }
      }
      this.spawnPoints.push(...newSp);
    } else if (direction === 'LEFT') {
      const shiftX = amount * TILE_SIZE;
      this.gridCols += amount;
      this.canvasWidth = this.gridCols * TILE_SIZE;
      for (let r = 0; r < this.gridRows; r++) {
        const prefix: number[] = [];
        for (let c = 0; c < amount; c++) {
          // Keep the seam where old grid starts clear so player never hits a wall
          if (c >= amount - 2) {
            prefix.push(TileType.EMPTY);
          } else {
            prefix.push(this.generateExpansionTile(c, r));
          }
        }
        this.grid[r] = [...prefix, ...this.grid[r]];
      }
      this.shiftAllEntities(shiftX, 0);
      this.spawnPoints = this.spawnPoints.map(p => ({ x: p.x + shiftX, y: p.y }));
      const newSp = [
        { x: 3 * TILE_SIZE, y: 3 * TILE_SIZE },
        { x: 3 * TILE_SIZE, y: Math.floor(this.gridRows / 2) * TILE_SIZE },
        { x: 3 * TILE_SIZE, y: (this.gridRows - 4) * TILE_SIZE }
      ];
      for (const sp of newSp) {
        const sc = Math.floor(sp.x / TILE_SIZE);
        const sr = Math.floor(sp.y / TILE_SIZE);
        for (let r = sr - 1; r <= sr + 2; r++) {
          for (let c = sc - 1; c <= sc + 2; c++) {
            if (r >= 0 && r < this.gridRows && c >= 0 && c < this.gridCols) {
              this.grid[r][c] = TileType.EMPTY;
            }
          }
        }
      }
      this.spawnPoints.push(...newSp);
      // Remap wall health
      const newWallHealth = new Map<string, number>();
      for (const [key, val] of this.wallHealthMap.entries()) {
        const [r, c] = key.split(',').map(Number);
        newWallHealth.set(`${r},${c + amount}`, val);
      }
      this.wallHealthMap = newWallHealth;
    } else if (direction === 'UP') {
      const shiftY = amount * TILE_SIZE;
      this.gridRows += amount;
      this.canvasHeight = this.gridRows * TILE_SIZE;
      const newRows: number[][] = [];
      for (let r = 0; r < amount; r++) {
        const row: number[] = [];
        for (let c = 0; c < this.gridCols; c++) {
          if (r >= amount - 2) {
            row.push(TileType.EMPTY);
          } else {
            row.push(this.generateExpansionTile(c, r));
          }
        }
        newRows.push(row);
      }
      this.grid = [...newRows, ...this.grid];
      this.shiftAllEntities(0, shiftY);
      this.spawnPoints = this.spawnPoints.map(p => ({ x: p.x, y: p.y + shiftY }));
      const newSp = [
        { x: 3 * TILE_SIZE, y: 3 * TILE_SIZE },
        { x: Math.floor(this.gridCols / 2) * TILE_SIZE, y: 3 * TILE_SIZE },
        { x: (this.gridCols - 4) * TILE_SIZE, y: 3 * TILE_SIZE }
      ];
      for (const sp of newSp) {
        const sc = Math.floor(sp.x / TILE_SIZE);
        const sr = Math.floor(sp.y / TILE_SIZE);
        for (let r = sr - 1; r <= sr + 2; r++) {
          for (let c = sc - 1; c <= sc + 2; c++) {
            if (r >= 0 && r < this.gridRows && c >= 0 && c < this.gridCols) {
              this.grid[r][c] = TileType.EMPTY;
            }
          }
        }
      }
      this.spawnPoints.push(...newSp);
      // Remap wall health
      const newWallHealth = new Map<string, number>();
      for (const [key, val] of this.wallHealthMap.entries()) {
        const [r, c] = key.split(',').map(Number);
        newWallHealth.set(`${r + amount},${c}`, val);
      }
      this.wallHealthMap = newWallHealth;
    }

    // Ultra-fast incremental terrain update (copies existing canvas and only renders the new strip, <0.3ms)
    this.updateTerrainCanvasForExpansion(direction, amount);
  }

  private updateTerrainCanvasForExpansion(direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN', amount: number) {
    const newW = this.canvasWidth;
    const newH = this.canvasHeight;
    const oldCanvas = this.terrainCanvas;

    const newCanvas = document.createElement('canvas');
    newCanvas.width = newW;
    newCanvas.height = newH;
    const tCtx = newCanvas.getContext('2d');
    if (!tCtx) {
      this.terrainCanvas = this.generateTerrainCanvas();
      return;
    }

    // 1. Fill base dark asphalt background
    tCtx.fillStyle = '#111722';
    tCtx.fillRect(0, 0, newW, newH);

    // 2. Blit old terrain canvas at the correct shifted offset
    const shiftX = direction === 'LEFT' ? amount * TILE_SIZE : 0;
    const shiftY = direction === 'UP' ? amount * TILE_SIZE : 0;
    if (oldCanvas) {
      tCtx.drawImage(oldCanvas, shiftX, shiftY);
    }

    // 3. Fast-render paver slabs & grid lines for newly exposed region only
    let startCol = 0;
    let endCol = this.gridCols;
    let startRow = 0;
    let endRow = this.gridRows;

    if (direction === 'RIGHT') {
      startCol = this.gridCols - amount;
    } else if (direction === 'LEFT') {
      endCol = amount;
    } else if (direction === 'DOWN') {
      startRow = this.gridRows - amount;
    } else if (direction === 'UP') {
      endRow = amount;
    }

    // Render paver slabs for new region
    for (let r = startRow; r < endRow; r++) {
      for (let c = startCol; c < endCol; c++) {
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;
        if ((r + c) % 2 === 0) {
          tCtx.fillStyle = 'rgba(255, 255, 255, 0.014)';
        } else {
          tCtx.fillStyle = 'rgba(0, 0, 0, 0.09)';
        }
        tCtx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      }
    }

    // Render grid lines for new region
    tCtx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    tCtx.lineWidth = 1;
    for (let r = startRow; r <= endRow; r++) {
      const y = r * TILE_SIZE;
      tCtx.beginPath();
      tCtx.moveTo(startCol * TILE_SIZE, y);
      tCtx.lineTo(endCol * TILE_SIZE, y);
      tCtx.stroke();
    }
    for (let c = startCol; c <= endCol; c++) {
      const x = c * TILE_SIZE;
      tCtx.beginPath();
      tCtx.moveTo(x, startRow * TILE_SIZE);
      tCtx.lineTo(x, endRow * TILE_SIZE);
      tCtx.stroke();
    }

    // Subtle specks in new region
    const speckCount = Math.floor(amount * (direction === 'LEFT' || direction === 'RIGHT' ? this.gridRows : this.gridCols) * 0.3);
    for (let i = 0; i < speckCount; i++) {
      const gx = (startCol + Math.random() * (endCol - startCol)) * TILE_SIZE;
      const gy = (startRow + Math.random() * (endRow - startRow)) * TILE_SIZE;
      tCtx.fillStyle = Math.random() > 0.65 ? 'rgba(240, 215, 175, 0.05)' : 'rgba(0, 0, 0, 0.32)';
      tCtx.fillRect(gx, gy, 1.5, 1.5);
    }

    this.terrainCanvas = newCanvas;
  }

  private shiftAllEntities(dx: number, dy: number) {
    if (this.player) {
      this.player.x += dx;
      this.player.y += dy;
    }
    for (const e of this.enemies) {
      e.x += dx;
      e.y += dy;
    }
    for (const b of this.bullets) {
      b.x += dx;
      b.y += dy;
    }
    for (const p of this.powerUps) {
      p.x += dx;
      p.y += dy;
    }
    for (const t of this.trackMarks) {
      t.x += dx;
      t.y += dy;
    }
    for (const ft of this.floatTexts) {
      ft.x += dx;
      ft.y += dy;
    }
    this.mousePos.x += dx;
    this.mousePos.y += dy;
    this.cameraX += dx;
    this.cameraY += dy;
    this.targetCameraX += dx;
    this.targetCameraY += dy;
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

    const tierCfg = PLAYER_TIERS[Math.min(this.player.tier, PLAYER_TIERS.length - 1)];
    const speedBoost = this.speedBoostTimer > 0 ? 35 : 0;
    this.player.speed = tierCfg.speed + speedBoost;
    this.player.reloadMax = this.speedBoostTimer > 0 ? tierCfg.reloadMax * 0.8 : tierCfg.reloadMax;

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

    // Pure classic 4-direction turret alignment
    this.player.turretAngle = DIR_VECTORS[this.player.dir].angle;

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

    // Check bush entry status (no text notification needed)
    if (this.player && this.player.hp > 0 && !this.isPlayerDying) {
      this.wasPlayerInBush = this.isTankInBush(this.player);
    }
  }

  private firePlayerBullet() {
    if (!this.player || this.player.hp <= 0 || this.isPlayerDying || this.player.reloadTimer > 0) return;

    const tierCfg = PLAYER_TIERS[Math.min(this.player.tier, PLAYER_TIERS.length - 1)];
    const reloadSpeed = this.speedBoostTimer > 0 ? tierCfg.reloadMax * 0.8 : tierCfg.reloadMax;
    this.player.reloadTimer = reloadSpeed;

    const pCenterX = this.player.x + this.player.width / 2;
    const pCenterY = this.player.y + this.player.height / 2;
    const angle = this.player.turretAngle;

    const barrelLength = this.player.width * 0.58;
    const muzzleX = pCenterX + Math.cos(angle) * barrelLength;
    const muzzleY = pCenterY + Math.sin(angle) * barrelLength;
    const effectiveBulletSpeed = Math.round(tierCfg.bulletSpeed * (this.speedBoostTimer > 0 ? 1.15 : 1.0));

    if (tierCfg.doubleShot) {
      const perpX = -Math.sin(angle) * 5;
      const perpY = Math.cos(angle) * 5;

      this.bullets.push({
        id: `pb_${Date.now()}_1`,
        x: muzzleX + perpX,
        y: muzzleY + perpY,
        vx: Math.cos(angle) * effectiveBulletSpeed,
        vy: Math.sin(angle) * effectiveBulletSpeed,
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
        vx: Math.cos(angle) * effectiveBulletSpeed,
        vy: Math.sin(angle) * effectiveBulletSpeed,
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
        vx: Math.cos(angle) * effectiveBulletSpeed,
        vy: Math.sin(angle) * effectiveBulletSpeed,
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
  private ensureActiveHunterTank() {
    const livingEnemies = this.enemies.filter(e => e && e.hp > 0);
    if (livingEnemies.length === 0) return;

    // Check how many current living hunters exist
    const currentHunters = livingEnemies.filter(e => e.isHunter);
    if (currentHunters.length === 1) {
      this.isHunterPending = false;
      return; // Exactly one hunter is active!
    }

    if (currentHunters.length > 1) {
      // If multiple exist, keep only the first active and reset others
      for (let i = 1; i < currentHunters.length; i++) {
        currentHunters[i].isHunter = false;
      }
      this.isHunterPending = false;
      return;
    }

    // No living hunter: Per user rule, a new hunter is designated from NEWLY SPAWNED
    // tanks in spawnEnemy() after cooldown timer expires or enemy kill threshold is met.
  }

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

    if (!enemy.currentDecisionTimer) enemy.currentDecisionTimer = enemy.isHunter ? 0.2 : 1.0;
    enemy.currentDecisionTimer -= dt;

    if (enemy.currentDecisionTimer <= 0) {
      // Hunter recalculates tactical path rapidly (every 0.2s - 0.35s) for smooth standoff maneuvering
      enemy.currentDecisionTimer = enemy.isHunter ? (0.2 + Math.random() * 0.15) : (0.8 + Math.random() * 1.5);
      this.decideEnemyDirection(enemy);
    }

    // Movement
    const vec = DIR_VECTORS[enemy.dir];
    const weatherMod = weatherSystem.getSpeedMultiplier();
    const effectiveSpeed = enemy.is360Boss ? enemy.speed : (enemy.isHunter ? Math.max(enemy.speed, 85) : enemy.speed);
    const step = effectiveSpeed * weatherMod * dt;
    const nextX = enemy.x + vec.x * step;
    const nextY = enemy.y + vec.y * step;

    // Stand-Off Distance Rule for Hunter & 360 Boss:
    // Maintains safe operational space (never rams or gets stuck against player hull)
    const isSmartTank = enemy.isHunter || enemy.is360Boss;
    let isStandoffBlocked = false;
    if (isSmartTank && this.player && this.player.hp > 0 && !this.isPlayerDying) {
      const pCx = this.player.x + this.player.width / 2;
      const pCy = this.player.y + this.player.height / 2;
      const curDist = Math.hypot((enemy.x + enemy.width / 2) - pCx, (enemy.y + enemy.height / 2) - pCy);
      const nextDist = Math.hypot((nextX + enemy.width / 2) - pCx, (nextY + enemy.height / 2) - pCy);
      const MIN_STANDOFF = enemy.is360Boss ? 105 : 85;

      if (nextDist < MIN_STANDOFF && nextDist <= curDist) {
        isStandoffBlocked = true;
      }
    }

    const collided = isStandoffBlocked || this.checkTankCollision(nextX, nextY, enemy.width, enemy.height, enemy.id);
    if (!collided) {
      enemy.x = nextX;
      enemy.y = nextY;
      enemy.tracksOffset += step;
      enemy.stuckTimer = 0;
    } else {
      // Sub-step closer to obstacle if not standoff-blocked
      if (!isStandoffBlocked) {
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
      }
      enemy.stuckTimer = (enemy.stuckTimer || 0) + dt;

      if (isSmartTank) {
        // Hunter & 360 Boss immediately recalculate standoff / retreat / strafe vector to keep moving fluidly
        if (enemy.stuckTimer > 0.08 || isStandoffBlocked) {
          this.decideEnemyDirection(enemy, true);
          enemy.stuckTimer = 0;
        }
      } else {
        // Standard enemy stuck resolution
        const touchingPlayer = !!(this.player && this.player.hp > 0 && !this.isPlayerDying && Math.hypot(
          (enemy.x + enemy.width / 2) - (this.player.x + this.player.width / 2),
          (enemy.y + enemy.height / 2) - (this.player.y + this.player.height / 2)
        ) < TANK_SIZE * 1.45);

        if (enemy.stuckTimer > 0.16) {
          if (!touchingPlayer) {
            if (this.gameMode === 'SURVIVAL' && enemy.reloadTimer <= 0) {
              const probeX = enemy.x + enemy.width / 2 + vec.x * TANK_SIZE;
              const probeY = enemy.y + enemy.height / 2 + vec.y * TANK_SIZE;
              const pCol = Math.floor(probeX / TILE_SIZE);
              const pRow = Math.floor(probeY / TILE_SIZE);
              if (pRow >= 0 && pRow < this.gridRows && pCol >= 0 && pCol < this.gridCols && (this.grid[pRow][pCol] === TileType.BRICK || this.grid[pRow][pCol] === TileType.CRATE)) {
                this.fireEnemyBullet(enemy, false);
              }
            }
            this.decideEnemyDirection(enemy, true);
          } else {
            const dx = (this.player!.x + this.player!.width / 2) - (enemy.x + enemy.width / 2);
            const dy = (this.player!.y + this.player!.height / 2) - (enemy.y + enemy.height / 2);
            if (Math.abs(dx) >= Math.abs(dy)) {
              enemy.turretAngle = dx > 0 ? 0 : Math.PI;
            } else {
              enemy.turretAngle = dy > 0 ? Math.PI / 2 : -Math.PI / 2;
            }
            if (enemy.reloadTimer <= 0) {
              this.fireEnemyBullet(enemy, false);
            }

            const flankDirs: Direction[] = Math.abs(dx) >= Math.abs(dy)
              ? ['UP', 'DOWN']
              : ['LEFT', 'RIGHT'];

            const openDirs = flankDirs.filter(d => {
              const fVec = DIR_VECTORS[d];
              return !this.checkTankCollision(enemy.x + fVec.x * 6, enemy.y + fVec.y * 6, enemy.width, enemy.height, enemy.id);
            });

            if (openDirs.length > 0) {
              enemy.dir = openDirs[Math.floor(Math.random() * openDirs.length)];
            } else {
              const retreatDir: Direction = Math.abs(dx) >= Math.abs(dy)
                ? (dx > 0 ? 'LEFT' : 'RIGHT')
                : (dy > 0 ? 'UP' : 'DOWN');
              enemy.dir = retreatDir;
            }
          }
          enemy.stuckTimer = 0;
        }
      }
    }

    // --- TURRET AIMING LOGIC ---
    if (enemy.is360Boss) {
      // 360-degree rotating turret for Boss: continuously tracks player at all angles!
      if (this.player && this.player.hp > 0 && !this.isPlayerDying) {
        const pDx = (this.player.x + this.player.width / 2) - (enemy.x + enemy.width / 2);
        const pDy = (this.player.y + this.player.height / 2) - (enemy.y + enemy.height / 2);
        enemy.turretAngle = Math.atan2(pDy, pDx);
      } else {
        enemy.turretAngle = DIR_VECTORS[enemy.dir].angle;
      }
    } else if (enemy.isHunter) {
      // User rule: "xe tăng truy sát có nòng hướng về phía tôi nhưng nòng không thể quay 360 được"
      // Hunter aims toward player but SNAPS strictly to 4 cardinal directions (0, PI/2, PI, -PI/2) only!
      if (this.player && this.player.hp > 0 && !this.isPlayerDying) {
        const pDx = (this.player.x + this.player.width / 2) - (enemy.x + enemy.width / 2);
        const pDy = (this.player.y + this.player.height / 2) - (enemy.y + enemy.height / 2);
        if (Math.abs(pDx) >= Math.abs(pDy)) {
          enemy.turretAngle = pDx > 0 ? 0 : Math.PI;
        } else {
          enemy.turretAngle = pDy > 0 ? Math.PI / 2 : -Math.PI / 2;
        }
      } else {
        enemy.turretAngle = DIR_VECTORS[enemy.dir].angle;
      }
    } else {
      // Standard enemies align with movement or lock when very close
      if (this.player && this.player.hp > 0 && !this.isPlayerDying) {
        const pDist = Math.hypot(
          (this.player.x + this.player.width / 2) - (enemy.x + enemy.width / 2),
          (this.player.y + this.player.height / 2) - (enemy.y + enemy.height / 2)
        );
        if (pDist < TANK_SIZE * 2.2) {
          const pDx = (this.player.x + this.player.width / 2) - (enemy.x + enemy.width / 2);
          const pDy = (this.player.y + this.player.height / 2) - (enemy.y + enemy.height / 2);
          if (Math.abs(pDx) >= Math.abs(pDy)) {
            enemy.turretAngle = pDx > 0 ? 0 : Math.PI;
          } else {
            enemy.turretAngle = pDy > 0 ? Math.PI / 2 : -Math.PI / 2;
          }
        } else {
          enemy.turretAngle = DIR_VECTORS[enemy.dir].angle;
        }
      } else {
        enemy.turretAngle = DIR_VECTORS[enemy.dir].angle;
      }
    }

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
    // Dedicated Hunter & 360 Boss Pursuit, Standoff & Navigation Logic
    const isSmartTank = enemy.isHunter || enemy.is360Boss;
    if (isSmartTank && this.player && this.player.hp > 0 && !this.isPlayerDying) {
      const eCx = enemy.x + enemy.width / 2;
      const eCy = enemy.y + enemy.height / 2;
      const pCx = this.player.x + this.player.width / 2;
      const pCy = this.player.y + this.player.height / 2;
      const dx = pCx - eCx;
      const dy = pCy - eCy;
      const distToPlayer = Math.hypot(dx, dy);

      // Turret aim:
      if (enemy.is360Boss) {
        // Boss has 360-degree rotating turret
        enemy.turretAngle = Math.atan2(dy, dx);
      } else {
        // Hunter has 4-directional cardinal turret only
        if (Math.abs(dx) >= Math.abs(dy)) {
          enemy.turretAngle = dx > 0 ? 0 : Math.PI;
        } else {
          enemy.turretAngle = dy > 0 ? Math.PI / 2 : -Math.PI / 2;
        }
      }

      const MIN_STANDOFF = enemy.is360Boss ? 105 : 85;   // Minimum safe operational distance
      const MAX_STANDOFF = enemy.is360Boss ? 165 : 135;  // Ideal combat firing envelope

      // Helper: check if a direction is passable and avoids ramming player
      const isDirPassable = (dir: Direction, allowTowardsPlayer: boolean = true): boolean => {
        const vec = DIR_VECTORS[dir];
        const probeStep = 8;
        const testX = enemy.x + vec.x * probeStep;
        const testY = enemy.y + vec.y * probeStep;

        // Check map boundaries
        if (testX < 0 || testX + enemy.width > this.canvasWidth || testY < 0 || testY + enemy.height > this.canvasHeight) {
          return false;
        }

        // Stand-off enforcement: Do not move in directions that penetrate the safe perimeter!
        const nextDist = Math.hypot((testX + enemy.width / 2) - pCx, (testY + enemy.height / 2) - pCy);
        if (!allowTowardsPlayer && nextDist < distToPlayer) {
          return false;
        }
        if (nextDist < MIN_STANDOFF && nextDist < distToPlayer) {
          return false;
        }

        // Check solid obstacles
        const pad = 1.0;
        const minCol = Math.floor((testX + pad) / TILE_SIZE);
        const maxCol = Math.floor((testX + enemy.width - pad - 0.05) / TILE_SIZE);
        const minRow = Math.floor((testY + pad) / TILE_SIZE);
        const maxRow = Math.floor((testY + enemy.height - pad - 0.05) / TILE_SIZE);

        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            if (r < 0 || r >= this.gridRows || c < 0 || c >= this.gridCols) return false;
            const tile = this.grid[r][c];
            if (
              tile === TileType.STEEL ||
              tile === TileType.REINFORCED_WALL ||
              tile === TileType.ENERGY_BARRIER ||
              tile === TileType.WATER ||
              tile === TileType.EXPLOSIVE_BARREL ||
              tile === TileType.BASE ||
              tile === TileType.BASE_DESTROYED
            ) {
              return false;
            }
          }
        }

        // Avoid crashing into other enemy tanks
        for (const other of this.enemies) {
          if (other && other.id !== enemy.id && other.hp > 0) {
            if (this.checkRectOverlap(testX + 1.5, testY + 1.5, enemy.width - 3, enemy.height - 3, other.x, other.y, other.width, other.height)) {
              return false;
            }
          }
        }

        return true;
      };

      // Cardinal navigation vectors:
      const advanceHoriz: Direction = dx > 0 ? 'RIGHT' : 'LEFT';
      const advanceVert: Direction = dy > 0 ? 'DOWN' : 'UP';
      const retreatHoriz: Direction = dx > 0 ? 'LEFT' : 'RIGHT';
      const retreatVert: Direction = dy > 0 ? 'UP' : 'DOWN';
      const lateralDirs: Direction[] = Math.abs(dx) >= Math.abs(dy) ? ['UP', 'DOWN'] : ['LEFT', 'RIGHT'];

      let chosenDir: Direction | null = null;

      if (distToPlayer < MIN_STANDOFF) {
        // --- CASE 1: TOO CLOSE -> RETREAT / BACK OFF FROM PLAYER ---
        const primaryRetreat = Math.abs(dx) >= Math.abs(dy) ? retreatHoriz : retreatVert;
        const secondaryRetreat = Math.abs(dx) >= Math.abs(dy) ? retreatVert : retreatHoriz;

        if (isDirPassable(primaryRetreat, false)) {
          chosenDir = primaryRetreat;
        } else if (isDirPassable(secondaryRetreat, false)) {
          chosenDir = secondaryRetreat;
        } else {
          const openLaterals = lateralDirs.filter(d => isDirPassable(d, false));
          if (openLaterals.length > 0) {
            chosenDir = openLaterals.includes(enemy.dir) ? enemy.dir : openLaterals[Math.floor(Math.random() * openLaterals.length)];
          }
        }
      } else if (distToPlayer <= MAX_STANDOFF) {
        // --- CASE 2: IDEAL COMBAT ZONE -> STRAFE LATERALLY / FLANK / HOLD DISTANCE ---
        const openLaterals = lateralDirs.filter(d => isDirPassable(d, false));
        if (openLaterals.length > 0) {
          if (!forceTurn && openLaterals.includes(enemy.dir)) {
            chosenDir = enemy.dir;
          } else {
            chosenDir = openLaterals[Math.floor(Math.random() * openLaterals.length)];
          }
        } else {
          const retreatDir = Math.abs(dx) >= Math.abs(dy) ? retreatHoriz : retreatVert;
          if (isDirPassable(retreatDir, false)) {
            chosenDir = retreatDir;
          }
        }
      } else {
        // --- CASE 3: FAR DISTANCE -> ADVANCE TOWARDS PLAYER ---
        const primaryAdvance = Math.abs(dx) >= Math.abs(dy) ? advanceHoriz : advanceVert;
        const secondaryAdvance = Math.abs(dx) >= Math.abs(dy) ? advanceVert : advanceHoriz;

        if ((!forceTurn || enemy.dir !== primaryAdvance) && isDirPassable(primaryAdvance, true)) {
          if ((primaryAdvance === 'LEFT' || primaryAdvance === 'RIGHT') && (enemy.dir === 'UP' || enemy.dir === 'DOWN')) {
            const targetY = Math.round(enemy.y / TILE_SIZE) * TILE_SIZE;
            if (Math.abs(enemy.y - targetY) < 7) enemy.y = targetY;
          }
          chosenDir = primaryAdvance;
        } else if ((!forceTurn || enemy.dir !== secondaryAdvance) && isDirPassable(secondaryAdvance, true)) {
          if ((secondaryAdvance === 'UP' || secondaryAdvance === 'DOWN') && (enemy.dir === 'LEFT' || enemy.dir === 'RIGHT')) {
            const targetX = Math.round(enemy.x / TILE_SIZE) * TILE_SIZE;
            if (Math.abs(enemy.x - targetX) < 7) enemy.x = targetX;
          }
          chosenDir = secondaryAdvance;
        } else {
          const allDirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
          const openDirs = allDirs.filter(d => (!forceTurn || d !== enemy.dir) && isDirPassable(d, true));
          if (openDirs.length > 0) {
            chosenDir = openDirs[0];
          }
        }
      }

      if (chosenDir) {
        enemy.dir = chosenDir;
      }
      return;
    }

    const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    let targetX = this.baseCenter.x;
    let targetY = this.baseCenter.y;

    if (this.gameMode === 'SURVIVAL') {
      if (this.player && this.player.hp > 0 && !this.isPlayerDying) {
        targetX = this.player.x + this.player.width / 2;
        targetY = this.player.y + this.player.height / 2;
      } else {
        targetX = this.canvasWidth / 2;
        targetY = this.canvasHeight / 2;
      }
    }

    const dx = targetX - (enemy.x + enemy.width / 2);
    const dy = targetY - (enemy.y + enemy.height / 2);

    const weights: Record<Direction, number> = {
      UP: dy < 0 ? 2.2 : 0.8,
      DOWN: dy > 0 ? 2.2 : 0.8,
      LEFT: dx < 0 ? 2.2 : 0.8,
      RIGHT: dx > 0 ? 2.2 : 0.8,
    };

    if (this.gameMode !== 'SURVIVAL' && dy > 0) weights.DOWN += 1.5;

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
    if (this.player && this.player.hp > 0 && !this.isPlayerDying) {
      const eCenterX = enemy.x + enemy.width / 2;
      const eCenterY = enemy.y + enemy.height / 2;
      const pCenterX = this.player.x + this.player.width / 2;
      const pCenterY = this.player.y + this.player.height / 2;
      const dx = pCenterX - eCenterX;
      const dy = pCenterY - eCenterY;
      const dist = Math.hypot(dx, dy);

      // Concealment check
      const playerInBush = this.isTankInBush(this.player);
      const enemyInBush = this.isTankInBush(enemy);
      if (playerInBush && !enemyInBush) {
        return false;
      }

      // CASE 1: 360-degree Dreadnought Boss Firing
      if (enemy.is360Boss) {
        const steps = Math.max(2, Math.floor(dist / (TILE_SIZE * 0.5)));
        let blockedBySteel = false;
        for (let s = 1; s < steps; s++) {
          const rx = eCenterX + (dx / steps) * s;
          const ry = eCenterY + (dy / steps) * s;
          const rc = Math.floor(rx / TILE_SIZE);
          const rr = Math.floor(ry / TILE_SIZE);
          if (rr >= 0 && rr < this.gridRows && rc >= 0 && rc < this.gridCols) {
            const tile = this.grid[rr][rc];
            if (tile === TileType.STEEL || tile === TileType.ENERGY_BARRIER) {
              blockedBySteel = true;
              break;
            }
          }
        }
        if (!blockedBySteel) return true;

        const dirVec = DIR_VECTORS[enemy.dir];
        const probeX = eCenterX + dirVec.x * (TANK_SIZE * 1.3);
        const probeY = eCenterY + dirVec.y * (TANK_SIZE * 1.3);
        const col = Math.floor(probeX / TILE_SIZE);
        const row = Math.floor(probeY / TILE_SIZE);
        if (col >= 0 && col < this.gridCols && row >= 0 && row < this.gridRows) {
          if (this.grid[row][col] === TileType.BRICK || this.grid[row][col] === TileType.CRATE) {
            return Math.random() < 0.45;
          }
        }
        return false;
      }

      // CASE 2: Hunter Tank Cardinal 4-Way Firing (Nòng chỉ bắn theo 4 hướng chính)
      if (enemy.isHunter) {
        const alignTolerance = TANK_SIZE * 1.3;
        let isAligned = false;
        let rayDx = 0;
        let rayDy = 0;

        // Check if player is aligned with the hunter's 4 cardinal turret directions
        if (enemy.turretAngle === 0 && dx > 0 && Math.abs(dy) < alignTolerance) {
          isAligned = true;
          rayDx = 1;
        } else if ((enemy.turretAngle === Math.PI || enemy.turretAngle === -Math.PI) && dx < 0 && Math.abs(dy) < alignTolerance) {
          isAligned = true;
          rayDx = -1;
        } else if (Math.abs(enemy.turretAngle - Math.PI / 2) < 0.01 && dy > 0 && Math.abs(dx) < alignTolerance) {
          isAligned = true;
          rayDy = 1;
        } else if (Math.abs(enemy.turretAngle - (-Math.PI / 2)) < 0.01 && dy < 0 && Math.abs(dx) < alignTolerance) {
          isAligned = true;
          rayDy = -1;
        }

        if (isAligned) {
          const steps = Math.max(2, Math.floor(dist / (TILE_SIZE * 0.5)));
          let blockedBySteel = false;
          for (let s = 1; s < steps; s++) {
            const rx = eCenterX + (rayDx !== 0 ? rayDx * (s * TILE_SIZE * 0.5) : 0);
            const ry = eCenterY + (rayDy !== 0 ? rayDy * (s * TILE_SIZE * 0.5) : 0);
            const rc = Math.floor(rx / TILE_SIZE);
            const rr = Math.floor(ry / TILE_SIZE);
            if (rr >= 0 && rr < this.gridRows && rc >= 0 && rc < this.gridCols) {
              const tile = this.grid[rr][rc];
              if (tile === TileType.STEEL || tile === TileType.ENERGY_BARRIER) {
                blockedBySteel = true;
                break;
              }
            }
          }
          if (!blockedBySteel) return true;
        }

        const dirVec = DIR_VECTORS[enemy.dir];
        const probeX = eCenterX + dirVec.x * (TANK_SIZE * 1.1);
        const probeY = eCenterY + dirVec.y * (TANK_SIZE * 1.1);
        const col = Math.floor(probeX / TILE_SIZE);
        const row = Math.floor(probeY / TILE_SIZE);
        if (col >= 0 && col < this.gridCols && row >= 0 && row < this.gridRows) {
          if (this.grid[row][col] === TileType.BRICK || this.grid[row][col] === TileType.CRATE) {
            return Math.random() < 0.35;
          }
        }
        return false;
      }
    }

    if (Math.random() < 0.08) return true;

    const eCenterX = enemy.x + enemy.width / 2;
    const eCenterY = enemy.y + enemy.height / 2;
    const dirVec = DIR_VECTORS[enemy.dir];

    const baseCenterX = this.baseCenter.x;
    if (this.gameMode !== 'SURVIVAL' && enemy.dir === 'DOWN' && Math.abs(eCenterX - baseCenterX) < TANK_SIZE) {
      return true;
    }

    if (this.player && this.player.hp > 0 && !this.isPlayerDying) {
      const pCenterX = this.player.x + this.player.width / 2;
      const pCenterY = this.player.y + this.player.height / 2;

      // If player is concealed by bushes from enemy's perspective, enemy cannot target player
      const playerInBush = this.isTankInBush(this.player);
      const enemyInBush = this.isTankInBush(enemy);
      const isConcealed = playerInBush && !enemyInBush;

      if (!isConcealed) {
        if (enemy.dir === 'UP' && Math.abs(eCenterX - pCenterX) < TANK_SIZE && eCenterY > pCenterY) return true;
        if (enemy.dir === 'DOWN' && Math.abs(eCenterX - pCenterX) < TANK_SIZE && eCenterY < pCenterY) return true;
        if (enemy.dir === 'LEFT' && Math.abs(eCenterY - pCenterY) < TANK_SIZE && eCenterX > pCenterX) return true;
        if (enemy.dir === 'RIGHT' && Math.abs(eCenterY - pCenterY) < TANK_SIZE && eCenterX < pCenterX) return true;
      }
    }

    const probeX = eCenterX + dirVec.x * TANK_SIZE;
    const probeY = eCenterY + dirVec.y * TANK_SIZE;
    const col = Math.floor(probeX / TILE_SIZE);
    const row = Math.floor(probeY / TILE_SIZE);
    if (col >= 0 && col < this.gridCols && row >= 0 && row < this.gridRows) {
      if (this.grid[row][col] === TileType.BRICK) {
        return Math.random() < 0.4;
      }
    }

    return false;
  }

  private fireEnemyBullet(enemy: Tank, isMissile: boolean = false) {
    const cfg = ENEMY_CONFIGS[enemy.type as EnemyType];
    enemy.reloadTimer = enemy.reloadMax * (0.8 + Math.random() * 0.4);

    const eCenterX = enemy.x + enemy.width / 2;
    const eCenterY = enemy.y + enemy.height / 2;
    const angle = enemy.turretAngle;

    const barrelLength = enemy.width * 0.58;
    const muzzleX = eCenterX + Math.cos(angle) * barrelLength;
    const muzzleY = eCenterY + Math.sin(angle) * barrelLength;

    // Bullet speed slightly scaled with stage level:
    const stage = Math.max(1, this.stats.stage);
    const bulletSpeedMultiplier = Math.min(1.20, 0.85 + (stage - 1) * 0.04);
    const scaledBulletSpeed = Math.round(cfg.bulletSpeed * bulletSpeedMultiplier);

    // 360 Dreadnought Boss Twin Heavy Cannons
    if (enemy.is360Boss || enemy.type === 'BOSS') {
      const perpAngle = angle + Math.PI / 2;
      const twinOffset = 5.5;
      [-1, 1].forEach((sign) => {
        const bx = muzzleX + Math.cos(perpAngle) * (twinOffset * sign);
        const by = muzzleY + Math.sin(perpAngle) * (twinOffset * sign);
        this.bullets.push({
          id: `boss_b_${Date.now()}_${Math.random()}`,
          x: bx,
          y: by,
          vx: Math.cos(angle) * (scaledBulletSpeed * 1.05),
          vy: Math.sin(angle) * (scaledBulletSpeed * 1.05),
          radius: BULLET_RADIUS + 1.2,
          damage: 1,
          ownerId: enemy.id,
          isPlayer: false,
          canBreakSteel: true,
          isMissile: true,
        });
        particleSystem.emitMuzzleFlash(bx, by, angle, true);
      });
      soundEngine.playShoot(false, true);
      this.addCameraShake(2.2);
      return;
    }

    this.bullets.push({
      id: `eb_${Date.now()}_${Math.random()}`,
      x: muzzleX,
      y: muzzleY,
      vx: Math.cos(angle) * scaledBulletSpeed,
      vy: Math.sin(angle) * scaledBulletSpeed,
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
      if (b.x < 0 || b.x > this.canvasWidth || b.y < 0 || b.y > this.canvasHeight) {
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
            particleSystem.emitShieldBreak(this.baseCenter.x, this.baseCenter.y, BASE_SHIELD_RADIUS, cfg.shieldColor);
            soundEngine.playShieldBreak();
            this.addCameraShake(7);
            this.addFloatText(this.baseCenter.x, this.baseCenter.y - 22, 'KHIÊN CĂN CỨ ĐÃ BỊ PHÁ!', '#ef4444');
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

      if (col >= 0 && col < this.gridCols && row >= 0 && row < this.gridRows) {
        const tile = this.grid[row][col];

        // Base auto-turret friendly projectile exemption:
        // Turret projectiles pass freely through base perimeter walls
        if (b.ownerId === 'base_auto_turret') {
          if (
            row >= this.baseCoord.row - 1 &&
            row <= this.baseCoord.row + 1 &&
            col >= this.baseCoord.col - 1 &&
            col <= this.baseCoord.col + 2
          ) {
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

        // Tactical Explosive Fuel Barrel (Thùng nhiên liệu nổ)
        if (tile === TileType.EXPLOSIVE_BARREL) {
          b.dead = true;
          this.detonateBarrel(col, row, b.isPlayer || b.ownerId === 'player');
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

  // --- Tactical Explosive Hazard Barrel Mechanics ---
  public detonateBarrel(col: number, row: number, detonatedByPlayer: boolean, chainDepth: number = 0) {
    if (row < 0 || row >= this.gridRows || col < 0 || col >= this.gridCols) return;

    // Remove the barrel tile from grid
    this.grid[row][col] = TileType.EMPTY;

    const barrelX = col * TILE_SIZE + TILE_SIZE / 2;
    const barrelY = row * TILE_SIZE + TILE_SIZE / 2;

    // Trigger explosive visual effects & sounds
    particleSystem.emitBarrelExplosion(barrelX, barrelY, 38);
    soundEngine.playBarrelExplosion();
    // USER RULE: Khi các thùng bị nổ không cho hiệu ứng rung cả màn hình

    // USER RULE: Không hiện thông báo nổ thùng

    const BLAST_RADIUS = 92; // Blast radius covers surrounding ~3.5 tiles

    // 1. Destroy adjacent destructible wooden supply crates / bricks & trigger chain reaction to adjacent barrels
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < this.gridRows && nc >= 0 && nc < this.gridCols) {
          const t = this.grid[nr][nc];
          const tileCenterX = nc * TILE_SIZE + TILE_SIZE / 2;
          const tileCenterY = nr * TILE_SIZE + TILE_SIZE / 2;
          const dist = Math.hypot(tileCenterX - barrelX, tileCenterY - barrelY);

          if (dist <= BLAST_RADIUS) {
            // Chain detonate adjacent explosive barrels (preserving player detonation status)
            if (t === TileType.EXPLOSIVE_BARREL && (dr !== 0 || dc !== 0)) {
              this.grid[nr][nc] = TileType.EMPTY;
              setTimeout(() => {
                if (this.isRunning) {
                  this.detonateBarrel(nc, nr, detonatedByPlayer, chainDepth + 1);
                }
              }, 70);
            } else if (t === TileType.BRICK) {
              this.grid[nr][nc] = TileType.EMPTY;
              particleSystem.emitBrickDestruction(tileCenterX, tileCenterY, (tileCenterX - barrelX) * 2, (tileCenterY - barrelY) * 2);
            }
          }
        }
      }
    }

    // 2. Damage to ENEMY TANKS:
    // USER RULE:
    // "khi tôi bắn vào nó thì các xe tăng xung quanh thùng bị nổ" -> If shot by player, surrounding enemy tanks explode!
    // "nhưng các xe tăng địch bắn nổ các thùng thì các xe tăng địch xung quanh không bị gì" -> If shot by enemy, enemy tanks take NO damage!
    if (detonatedByPlayer) {
      const hitEnemies: Tank[] = [];
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0) continue;
        const eCx = enemy.x + enemy.width / 2;
        const eCy = enemy.y + enemy.height / 2;
        const dist = Math.hypot(eCx - barrelX, eCy - barrelY);

        if (dist <= BLAST_RADIUS) {
          hitEnemies.push(enemy);
        }
      }

      for (const enemy of hitEnemies) {
        const eCx = enemy.x + enemy.width / 2;
        if (enemy.type === 'BOSS') {
          // Boss takes massive blast damage (6 HP)
          enemy.hp -= 6;
          if (enemy.hp <= 0) {
            this.handleEnemyDestroyed(enemy, true);
          } else {
            particleSystem.emitTankHit(eCx, enemy.y + enemy.height / 2, 0, -40, enemy.color);
            soundEngine.playHitMetal();
          }
        } else {
          // Regular enemy tanks blow up instantly!
          enemy.hp = 0;
          this.handleEnemyDestroyed(enemy, true);
        }
      }

      // Filter out destroyed tanks
      this.enemies = this.enemies.filter(e => e.hp > 0);
    }

    // 3. Damage to PLAYER:
    // USER RULE:
    // "nếu tôi bắn bể các thùng đó nếu tôi đứng gần vụ nổ thì sẽ bị trừ hp"
    if (this.player && this.player.hp > 0 && !this.isPlayerDying) {
      const pCx = this.player.x + this.player.width / 2;
      const pCy = this.player.y + this.player.height / 2;
      const pDist = Math.hypot(pCx - barrelX, pCy - barrelY);

      if (pDist <= BLAST_RADIUS) {
        if (this.player.shieldTime > 0) {
          // Shield deflects blast wave
          particleSystem.emitSteelImpact(pCx, pCy, 0, -20, false);
          soundEngine.playHitMetal();
          // Không hiện thông báo khiên chống nổ
        } else {
          // Standing too close to exploding barrel: deduct HP!
          const damage = pDist <= BLAST_RADIUS * 0.45 ? 2 : 1;
          this.player.hp -= damage;
          this.hitstopTimer = 0.06;
          // USER RULE: Không rung màn hình khi thùng nổ / sóng nổ thùng

          if (this.player.hp <= 0) {
            this.handlePlayerDeath();
          } else {
            particleSystem.emitTankHit(pCx, pCy, 0, -30, '#ef4444');
            soundEngine.playHitMetal();
            this.addFloatText(this.player.x + 10, this.player.y - 10, `-${damage} HP`, '#ef4444');
          }
        }
      }
    }
  }

  // --- Tank Explosions ---
  private handleEnemyDestroyed(enemy: Tank, skipCameraShake: boolean = false) {
    const isBoss = enemy.type === 'BOSS';
    const cx = enemy.x + enemy.width / 2;
    const cy = enemy.y + enemy.height / 2;

    // Trigger full multi-phase explosion particle system
    particleSystem.emitTankExplosion(cx, cy, isBoss ? 45 : 28, enemy.color, isBoss);

    soundEngine.playExplosion(isBoss);
    if (!skipCameraShake) {
      this.addCameraShake(isBoss ? 8 : 3.5);
    }
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

    // Hunter Tank Lifecycle Management
    if (enemy.isHunter) {
      this.isHunterPending = true;
      this.hunterCooldownTimer = 12.0; // 12 seconds cooldown before a newly spawned tank can become a hunter
      this.killsSinceHunterDied = 0;
      this.addFloatText(cx, enemy.y - 14, 'HẠ GỤC XE TRUY SÁT!', '#22c55e');
    } else {
      if (this.isHunterPending) {
        this.killsSinceHunterDied++;
      }
    }

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
    if (this.gameMode === 'SURVIVAL' || this.isBaseDestroyed) return;
    this.isBaseDestroyed = true;
    this.baseHp = 0;
    this.stats.baseHp = 0;

    this.grid[24][16] = TileType.BASE_DESTROYED;
    this.grid[24][17] = TileType.BASE_DESTROYED;
    this.grid[25][16] = TileType.BASE_DESTROYED;
    this.grid[25][17] = TileType.BASE_DESTROYED;

    const baseX = BASE_CENTER.x;
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

    const clampedX = Math.max(30, Math.min(this.canvasWidth - 30, x));
    const clampedY = Math.max(30, Math.min(this.canvasHeight - 30, y));

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

    const pX = this.player ? this.player.x + this.player.width / 2 : this.canvasWidth / 2;
    const pY = this.player ? this.player.y : this.canvasHeight / 2;

    switch (type) {
      case 'STAR':
        if (this.player) {
          this.player.tier = Math.min(3, this.player.tier + 1);
          const cfg = PLAYER_TIERS[this.player.tier];
          const speedBoost = this.speedBoostTimer > 0 ? 35 : 0;
          this.player.speed = cfg.speed + speedBoost;
          this.player.reloadMax = this.speedBoostTimer > 0 ? cfg.reloadMax * 0.8 : cfg.reloadMax;
          this.player.maxHp = cfg.maxHp;
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
          this.player.name = cfg.name;
          particleSystem.emitBaseUpgradeBurst(pX, pY, '#38bdf8');
          const fireRate = (Math.round((1 / this.player.reloadMax) * 10) / 10).toFixed(1);
          this.addFloatText(pX, pY, `⭐ C${this.player.tier + 1} ${cfg.name}: CHẠY ${this.player.speed} · BẮN ${fireRate}/S`, '#38bdf8');
        }
        break;

      case 'SHIELD':
        if (this.player) {
          this.player.shieldTime = 10;
          this.addFloatText(pX, pY, '🛡️ KHIÊN BẤT TỬ 10S!', '#38bdf8');
        }
        break;

      case 'BOMB': {
        const remainingEnemies: Tank[] = [];
        for (const e of this.enemies) {
          e.hp = Math.max(0, e.hp - 1);
          particleSystem.emitTankExplosion(e.x + e.width / 2, e.y + e.height / 2, 18, '#f97316', false);
          this.addFloatText(e.x + e.width / 2, e.y - 12, '-1 HP', '#f87171');
          if (e.hp <= 0) {
            this.handleEnemyDestroyed(e);
          } else {
            remainingEnemies.push(e);
          }
        }
        this.enemies = remainingEnemies;
        soundEngine.playExplosion();
        this.addCameraShake(5);
        this.addFloatText(pX, pY, '💣 BOM TẬP KÍCH: TẤT CẢ ĐỊCH -1 HP!', '#f97316');
        break;
      }

      case 'CLOCK':
        this.clockFreezeTimer = 7.0;
        this.addFloatText(pX, pY, '⏰ ĐÓNG BĂNG KẺ ĐỊCH 7S!', '#67e8f9');
        break;

      case 'SHOVEL':
        if (this.gameMode === 'SURVIVAL') {
          if (this.player) {
            this.player.shieldTime = 14.0;
            this.addFloatText(pX, pY, '🛡️ KHIÊN TITANIUM BẤT TỬ 14S!', '#38bdf8');
          }
        } else {
          this.shovelTimer = 16.0;
          this.reinforceBaseFortressWithSteel();
          // Also recharges base shield by +60 points
          if (this.baseShieldMaxHp > 0) {
            this.baseShieldHp = Math.min(this.baseShieldMaxHp, this.baseShieldHp + 60);
          }
          this.addFloatText(pX, pY, '⛏️ CÔNG SỰ THÉP & HỒI KHIÊN 16S!', '#94a3b8');
        }
        break;

      case 'FORTRESS':
        if (this.gameMode === 'SURVIVAL') {
          this.stats.lives++;
          if (this.player) {
            this.player.hp = this.player.maxHp;
            this.player.shieldTime = 8.0;
          }
          this.addFloatText(pX, pY, '🏰 CHIẾN XA BỌC THÉP: +1 MẠNG & HỒI ĐẦY MÁU!', '#facc15');
        } else {
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
          this.addFloatText(pX, pY, '🏰 NÂNG CẤP CĂN CỨ & PHỤC HỒI KHIÊN!', '#facc15');
        }
        break;

      case 'HEART':
        this.stats.lives++;
        if (this.player) this.player.hp = this.player.maxHp;
        this.addFloatText(pX, pY, '❤️ +1 MẠNG & HỒI ĐẦY MÁU!', '#ec4899');
        break;

      case 'SPEED':
        this.speedBoostTimer = 8.0;
        if (this.player) {
          const cfg = PLAYER_TIERS[this.player.tier];
          this.player.speed = cfg.speed + 35;
          this.player.reloadMax = cfg.reloadMax * 0.8;
          particleSystem.emitSpawnBurst(pX, pY, '#facc15');
          const fireRate = (Math.round((1 / this.player.reloadMax) * 10) / 10).toFixed(1);
          this.addFloatText(pX, pY, `⚡ TĂNG TỐC 8S: CHẠY ${this.player.speed} px/s · BẮN ${fireRate}/S!`, '#facc15');
        }
        break;
    }
  }

  private reinforceBaseFortressWithSteel() {
    const bCol = this.baseCoord.col;
    const bRow = this.baseCoord.row;
    for (let c = bCol - 1; c <= bCol + 2; c++) {
      this.grid[bRow - 1][c] = TileType.STEEL;
    }
    this.grid[bRow][bCol - 1] = TileType.STEEL;
    this.grid[bRow + 1][bCol - 1] = TileType.STEEL;
    this.grid[bRow][bCol + 2] = TileType.STEEL;
    this.grid[bRow + 1][bCol + 2] = TileType.STEEL;
    this.ejectTanksFromBasePerimeter();
  }

  private restoreBaseFortressToTierWalls() {
    const currentWallType = BASE_TIERS[this.baseTier - 1].wallType;
    const bCol = this.baseCoord.col;
    const bRow = this.baseCoord.row;
    for (let c = bCol - 1; c <= bCol + 2; c++) {
      if (this.grid[bRow - 1][c] === TileType.STEEL) this.grid[bRow - 1][c] = currentWallType;
    }
    if (this.grid[bRow][bCol - 1] === TileType.STEEL) this.grid[bRow][bCol - 1] = currentWallType;
    if (this.grid[bRow + 1][bCol - 1] === TileType.STEEL) this.grid[bRow + 1][bCol - 1] = currentWallType;
    if (this.grid[bRow][bCol + 2] === TileType.STEEL) this.grid[bRow][bCol + 2] = currentWallType;
    if (this.grid[bRow + 1][bCol + 2] === TileType.STEEL) this.grid[bRow + 1][bCol + 2] = currentWallType;
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
    if (x < 0 || x + w > this.canvasWidth || y < 0 || y + h > this.canvasHeight) {
      return true;
    }



    const pad = 1.0;
    const minCol = Math.floor((x + pad) / TILE_SIZE);
    const maxCol = Math.floor((x + w - pad - 0.05) / TILE_SIZE);
    const minRow = Math.floor((y + pad) / TILE_SIZE);
    const maxRow = Math.floor((y + h - pad - 0.05) / TILE_SIZE);

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (r < 0 || r >= this.gridRows || c < 0 || c >= this.gridCols) return true;
        const tile = this.grid[r][c];
        if (
          tile === TileType.BRICK ||
          tile === TileType.STEEL ||
          tile === TileType.REINFORCED_WALL ||
          tile === TileType.ENERGY_BARRIER ||
          tile === TileType.WATER ||
          tile === TileType.EXPLOSIVE_BARREL ||
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
        const cx = Math.max(0, Math.min(this.canvasWidth - tank.width, startX + Math.cos(ang) * radius));
        const cy = Math.max(0, Math.min(this.canvasHeight - tank.height, startY + Math.sin(ang) * radius));
        if (!this.checkTankCollision(cx, cy, tank.width, tank.height, tank.id)) {
          return { x: cx, y: cy };
        }
      }
    }

    const bCol = this.baseCoord.col;
    const bRow = this.baseCoord.row;

    // Fallback safe positions around base perimeter
    const fallbackCandidates = [
      { x: tank.x, y: (bRow - 2) * TILE_SIZE - (tank.height - TILE_SIZE) }, // North of wall
      { x: (bCol - 2) * TILE_SIZE - (tank.width - TILE_SIZE), y: tank.y },  // West of wall
      { x: (bCol + 3) * TILE_SIZE, y: tank.y },                             // East of wall
    ];

    for (const cand of fallbackCandidates) {
      const cx = Math.max(0, Math.min(this.canvasWidth - tank.width, cand.x));
      const cy = Math.max(0, Math.min(this.canvasHeight - tank.height, cand.y));
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

    const bCol = this.baseCoord.col;
    const bRow = this.baseCoord.row;
    const minX = (bCol - 2) * TILE_SIZE;
    const maxX = (bCol + 3) * TILE_SIZE;
    const minY = (bRow - 2) * TILE_SIZE;
    const maxY = (bRow + 2) * TILE_SIZE;

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

  // --- Bush Stealth & Connected Component Foliage Occlusion Mechanics ---
  public updateRevealedBushCluster(): void {
    this.revealedBushTileIndices.clear();

    if (!this.player || this.player.hp <= 0 || this.isPlayerDying) {
      return;
    }

    const inset = 3;
    const startCol = Math.max(0, Math.floor((this.player.x + inset) / TILE_SIZE));
    const endCol = Math.min(this.gridCols - 1, Math.floor((this.player.x + this.player.width - 1 - inset) / TILE_SIZE));
    const startRow = Math.max(0, Math.floor((this.player.y + inset) / TILE_SIZE));
    const endRow = Math.min(this.gridRows - 1, Math.floor((this.player.y + this.player.height - 1 - inset) / TILE_SIZE));

    // 1. Identify all bush tiles the player tank is currently physically inside
    const queue: Array<{ r: number; c: number }> = [];
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (this.grid[r]?.[c] === TileType.BUSH) {
          const idx = r * this.gridCols + c;
          if (!this.revealedBushTileIndices.has(idx)) {
            this.revealedBushTileIndices.add(idx);
            queue.push({ r, c });
          }
        }
      }
    }

    // Player is not inside any bush: all bushes everywhere remain opaque
    if (queue.length === 0) {
      return;
    }

    // 2. BFS Flood-Fill to find only directly connected bush tiles forming this specific cluster/patch.
    // Bushes connected orthogonally or diagonally (8-way connected) belong to this bush grove.
    // Disconnected/separate bush patches across roads or clearings remain unvisited and opaque!
    let head = 0;
    while (head < queue.length) {
      const curr = queue[head++];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = curr.r + dr;
          const nc = curr.c + dc;
          if (nr >= 0 && nr < this.gridRows && nc >= 0 && nc < this.gridCols) {
            if (this.grid[nr][nc] === TileType.BUSH) {
              const nIdx = nr * this.gridCols + nc;
              if (!this.revealedBushTileIndices.has(nIdx)) {
                this.revealedBushTileIndices.add(nIdx);
                queue.push({ r: nr, c: nc });
              }
            }
          }
        }
      }
    }
  }

  public isTankInBush(tank: Tank): boolean {
    const cx = tank.x + tank.width / 2;
    const cy = tank.y + tank.height / 2;
    const col = Math.floor(cx / TILE_SIZE);
    const row = Math.floor(cy / TILE_SIZE);
    if (row >= 0 && row < this.gridRows && col >= 0 && col < this.gridCols) {
      return this.grid[row][col] === TileType.BUSH;
    }
    return false;
  }

  public isBushTileRevealedToPlayer(col: number, row: number): boolean {
    if (!this.player || this.player.hp <= 0 || this.isPlayerDying) return false;
    return this.revealedBushTileIndices.has(row * this.gridCols + col);
  }

  public hasBushOcclusion(pX: number, pY: number, eX: number, eY: number, _playerInBush: boolean): boolean {
    const dist = Math.hypot(eX - pX, eY - pY);
    if (dist < 4) return false;

    const stepSize = TILE_SIZE * 0.35;
    const steps = Math.ceil(dist / stepSize);

    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const sx = pX + (eX - pX) * t;
      const sy = pY + (eY - pY) * t;
      const col = Math.floor(sx / TILE_SIZE);
      const row = Math.floor(sy / TILE_SIZE);

      if (row >= 0 && row < this.gridRows && col >= 0 && col < this.gridCols) {
        if (this.grid[row][col] === TileType.BUSH) {
          // If player is in bush and this bush tile is part of player's connected revealed cluster,
          // player can see through this foliage
          if (this.isBushTileRevealedToPlayer(col, row)) {
            continue;
          }
          // Otherwise, dense opaque bush blocks line of sight
          return true;
        }
      }
    }
    return false;
  }

  public isEnemyVisibleToPlayer(enemy: Tank): boolean {
    if (!this.player || this.player.hp <= 0 || this.isPlayerDying) {
      return true;
    }

    // 1. If enemy is NOT inside a bush: ALWAYS 100% visible, completely stable, NO FLICKERING!
    const enemyInBush = this.isTankInBush(enemy);
    if (!enemyInBush) {
      return true;
    }

    // 2. If enemy IS inside a bush:
    // If player is not in any bush, player cannot see enemy hidden in bush
    if (this.revealedBushTileIndices.size === 0) {
      return false;
    }

    // Player is in a bush: can ONLY see enemy if enemy is inside player's connected revealed bush cluster
    const eCx = enemy.x + enemy.width / 2;
    const eCy = enemy.y + enemy.height / 2;
    const eCol = Math.floor(eCx / TILE_SIZE);
    const eRow = Math.floor(eCy / TILE_SIZE);

    return this.isBushTileRevealedToPlayer(eCol, eRow);
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

  public isMeadowStage(): boolean {
    return this.gameMode === 'CAMPAIGN' && !!this.currentStageConfig && this.currentStageConfig.id >= 11 && this.currentStageConfig.id <= 21;
  }

  private generateMeadowTerrainCanvas(tCanvas: HTMLCanvasElement, tCtx: CanvasRenderingContext2D): HTMLCanvasElement {
    // === CHIẾN TRƯỜNG ĐỒNG CỎ XANH HAND-CRAFTED 2D GAME ART (WARM NATURAL MEADOW) ===
    // 1. Base Meadow Turf: Rich, warm, eye-friendly earthy olive/pasture gradient (anti-glare, high contrast)
    const baseGrad = tCtx.createLinearGradient(0, 0, this.canvasWidth, this.canvasHeight);
    baseGrad.addColorStop(0, '#26381e');
    baseGrad.addColorStop(0.5, '#2c4024');
    baseGrad.addColorStop(1, '#23341b');
    tCtx.fillStyle = baseGrad;
    tCtx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    const cols = Math.ceil(this.canvasWidth / TILE_SIZE);
    const rows = Math.ceil(this.canvasHeight / TILE_SIZE);

    // 2. Deterministic pseudo-random generator for crisp, repeatable 2D art placement
    let seed = 48291;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // 3. Subtle 2D Lawn Tile Depth (Soft, organic tone shifts - no eye strain)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        // Alternating warm earth/moss tile swatch
        if ((r + c) % 2 === 1) {
          tCtx.fillStyle = 'rgba(74, 107, 58, 0.16)';
          tCtx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        } else {
          tCtx.fillStyle = 'rgba(18, 28, 14, 0.12)';
          tCtx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        }

        // Soft, faint bottom-right grass seam for 2D depth
        tCtx.fillStyle = 'rgba(12, 20, 10, 0.18)';
        tCtx.fillRect(x, y + TILE_SIZE - 1, TILE_SIZE, 1);
        tCtx.fillRect(x + TILE_SIZE - 1, y, 1, TILE_SIZE);
      }
    }

    // 4. Natural Winding Earthy Dirt Paths & Soil Clearings (Đường mòn đất son tự nhiên)
    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        if (rnd() < 0.22) {
          const px = c * TILE_SIZE + Math.floor(rnd() * 6);
          const py = r * TILE_SIZE + Math.floor(rnd() * 6);
          const pw = 14 + Math.floor(rnd() * 12);
          const ph = 14 + Math.floor(rnd() * 12);

          // Deep loam patch
          const dirtGrad = tCtx.createRadialGradient(px + pw / 2, py + ph / 2, 2, px + pw / 2, py + ph / 2, pw / 2);
          dirtGrad.addColorStop(0, 'rgba(70, 52, 34, 0.38)');
          dirtGrad.addColorStop(0.7, 'rgba(88, 66, 44, 0.20)');
          dirtGrad.addColorStop(1, 'rgba(40, 30, 20, 0)');
          tCtx.fillStyle = dirtGrad;
          tCtx.beginPath();
          tCtx.ellipse(px + pw / 2, py + ph / 2, pw / 2, ph / 2, rnd() * Math.PI, 0, Math.PI * 2);
          tCtx.fill();

          // Delicate vehicle wheel ruts in soil
          if (rnd() < 0.5) {
            tCtx.fillStyle = 'rgba(28, 20, 12, 0.35)';
            tCtx.fillRect(px + 3, py + 4, pw - 6, 1.5);
            tCtx.fillRect(px + 3, py + ph - 5, pw - 6, 1.5);
          }
        }
      }
    }

    // 5. Hand-Crafted 2D Grass Tufts & Wild Clover Sprigs (Bụi cỏ đa tầng & cỏ 3 lá)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        const grassChance = rnd();
        if (grassChance < 0.52) {
          const gx = x + 3 + Math.floor(rnd() * 15);
          const gy = y + 4 + Math.floor(rnd() * 14);

          // Deep blade root shadow
          tCtx.fillStyle = '#142210';
          tCtx.fillRect(gx, gy + 1, 1, 3.5);
          tCtx.fillRect(gx + 2, gy, 1, 4.5);
          tCtx.fillRect(gx + 4, gy + 1, 1, 3.5);

          // Rich mossy green body
          tCtx.fillStyle = '#3a5927';
          tCtx.fillRect(gx, gy + 0.5, 1, 2);
          tCtx.fillRect(gx + 2, gy - 0.5, 1, 3);
          tCtx.fillRect(gx + 4, gy + 0.5, 1, 2);

          // Sunlit natural olive tips (warm, pleasant, never glaring)
          tCtx.fillStyle = '#679146';
          tCtx.fillRect(gx, gy, 1, 1);
          tCtx.fillRect(gx + 2, gy - 1, 1, 1);
          tCtx.fillRect(gx + 4, gy, 1, 1);

          // Small 3-leaf clover patch nearby
          if (rnd() < 0.35) {
            const clx = x + 2 + Math.floor(rnd() * 16);
            const cly = y + 2 + Math.floor(rnd() * 16);
            tCtx.fillStyle = '#2f491c';
            tCtx.fillRect(clx - 1, cly, 1, 1);
            tCtx.fillRect(clx + 1, cly, 1, 1);
            tCtx.fillRect(clx, cly - 1, 1, 1);
            tCtx.fillStyle = '#4d7530';
            tCtx.fillRect(clx, cly, 1, 1);
          }
        }

        // 6. Charming 2D Wildflowers (Hoa cúc dại trắng, hoa anh túc đỏ, hoa thạch thảo)
        const flowerChance = rnd();
        if (flowerChance < 0.32) {
          const fx = x + 5 + Math.floor(rnd() * 14);
          const fy = y + 5 + Math.floor(rnd() * 14);
          const flowerType = rnd();

          if (flowerType < 0.42) {
            // White Chamomile Daisy (Hoa cúc trắng nhụy vàng)
            tCtx.fillStyle = '#f8fafc';
            tCtx.fillRect(fx - 1, fy, 3, 1);
            tCtx.fillRect(fx, fy - 1, 1, 3);
            tCtx.fillStyle = '#facc15';
            tCtx.fillRect(fx, fy, 1, 1);
          } else if (flowerType < 0.70) {
            // Wild Woodland Red Poppy (Hoa anh túc đỏ thắm nở trên cỏ)
            tCtx.fillStyle = '#dc2626';
            tCtx.fillRect(fx - 1, fy - 1, 3, 3);
            tCtx.fillStyle = '#f87171';
            tCtx.fillRect(fx, fy - 1, 1, 1);
            tCtx.fillStyle = '#450a0a';
            tCtx.fillRect(fx, fy, 1, 1);
          } else if (flowerType < 0.88) {
            // Golden Prairie Buttercup (Hoa bơ vàng ấm áp)
            tCtx.fillStyle = '#fde047';
            tCtx.fillRect(fx, fy, 2, 2);
            tCtx.fillStyle = '#ca8a04';
            tCtx.fillRect(fx, fy, 1, 1);
          } else {
            // Mountain Bluebell / Lavender (Hoa thạch thảo tím biếc)
            tCtx.fillStyle = '#c084fc';
            tCtx.fillRect(fx, fy, 2, 2);
            tCtx.fillStyle = '#7e22ce';
            tCtx.fillRect(fx, fy, 1, 1);
          }
        }

        // 7. Natural River & Slate Pebbles (Sỏi cuội ven đường)
        if (rnd() < 0.18) {
          const sx = x + 3 + Math.floor(rnd() * 18);
          const sy = y + 3 + Math.floor(rnd() * 18);
          // Soft ground cast shadow
          tCtx.fillStyle = 'rgba(10, 20, 10, 0.40)';
          tCtx.fillRect(sx, sy + 1.5, 3.5, 2);
          // Slate stone facet
          tCtx.fillStyle = '#334155';
          tCtx.fillRect(sx, sy, 3, 2);
          tCtx.fillStyle = '#475569';
          tCtx.fillRect(sx, sy, 2.5, 1.5);
          // Specular glint
          tCtx.fillStyle = '#94a3b8';
          tCtx.fillRect(sx, sy, 1, 1);
        }
      }
    }

    // 8. Soft Atmospheric Vignette (Tạo chiều sâu ánh sáng dịu mắt)
    const vig = tCtx.createRadialGradient(
      this.canvasWidth / 2,
      this.canvasHeight / 2,
      this.canvasHeight * 0.35,
      this.canvasWidth / 2,
      this.canvasHeight / 2,
      this.canvasWidth * 0.68
    );
    vig.addColorStop(0, 'rgba(255, 255, 255, 0.015)');
    vig.addColorStop(0.6, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(8, 16, 8, 0.38)');
    tCtx.fillStyle = vig;
    tCtx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    return tCanvas;
  }

  private generateTerrainCanvas(): HTMLCanvasElement {
    const tCanvas = document.createElement('canvas');
    tCanvas.width = this.canvasWidth;
    tCanvas.height = this.canvasHeight;
    const tCtx = tCanvas.getContext('2d')!;

    if (this.isMeadowStage()) {
      return this.generateMeadowTerrainCanvas(tCanvas, tCtx);
    }

    // 1. Rich dark military asphalt & tactical soil base tone with subtle warm undertone
    const baseGrad = tCtx.createLinearGradient(0, 0, this.canvasWidth, this.canvasHeight);
    baseGrad.addColorStop(0, '#191c24');
    baseGrad.addColorStop(0.5, '#161920');
    baseGrad.addColorStop(1, '#13151b');
    tCtx.fillStyle = baseGrad;
    tCtx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // 2. Deterministic pseudo-random generator for pristine repeatable terrain
    let seed = 42891;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // 3. Multi-layer organic soil, clay, dust & weathered terrain patches
    // A. Warm earth/clay patches (gives organic ground depth)
    for (let i = 0; i < 48; i++) {
      const px = rnd() * this.canvasWidth;
      const py = rnd() * this.canvasHeight;
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
    for (let i = 0; i < 40; i++) {
      const px = rnd() * this.canvasWidth;
      const py = rnd() * this.canvasHeight;
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
    for (let i = 0; i < 15; i++) {
      const cx = 50 + rnd() * (this.canvasWidth - 100);
      const cy = 60 + rnd() * (this.canvasHeight - 180);
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
    const trackCols = [6.5 * TILE_SIZE, 27.5 * TILE_SIZE];
    for (const trackX of trackCols) {
      tCtx.fillStyle = 'rgba(0, 0, 0, 0.16)';
      for (let y = 10; y < this.canvasHeight - 20; y += 7) {
        tCtx.fillRect(trackX - 9, y, 7, 2.5);
        tCtx.fillRect(trackX + 2, y, 7, 2.5);
      }
      tCtx.fillStyle = 'rgba(255, 255, 255, 0.016)';
      for (let y = 10; y < this.canvasHeight - 20; y += 7) {
        tCtx.fillRect(trackX - 9, y + 2.5, 7, 1);
        tCtx.fillRect(trackX + 2, y + 2.5, 7, 1);
      }
    }

    // 5. Tactile Combat Floor Slabs (26x26 Pavers with alternating micro-tint)
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
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
    for (let r = 0; r <= this.gridRows; r++) {
      const y = r * TILE_SIZE;
      // Dark groove
      tCtx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
      tCtx.lineWidth = 1;
      tCtx.beginPath();
      tCtx.moveTo(0, y);
      tCtx.lineTo(this.canvasWidth, y);
      tCtx.stroke();

      // Top light reflection bevel
      tCtx.strokeStyle = 'rgba(255, 255, 255, 0.032)';
      tCtx.beginPath();
      tCtx.moveTo(0, y + 1);
      tCtx.lineTo(this.canvasWidth, y + 1);
      tCtx.stroke();
    }

    for (let c = 0; c <= this.gridCols; c++) {
      const x = c * TILE_SIZE;
      tCtx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
      tCtx.lineWidth = 1;
      tCtx.beginPath();
      tCtx.moveTo(x, 0);
      tCtx.lineTo(x, this.canvasHeight);
      tCtx.stroke();

      tCtx.strokeStyle = 'rgba(255, 255, 255, 0.032)';
      tCtx.beginPath();
      tCtx.moveTo(x + 1, 0);
      tCtx.lineTo(x + 1, this.canvasHeight);
      tCtx.stroke();
    }

    // 7. Base HQ Security Apron Markings (Caution diagonal hazard stripes around base area - skipped in Survival)
    if (this.gameMode !== 'SURVIVAL') {
      const baseApronX = (this.baseCoord.col - 2) * TILE_SIZE;
      const baseApronY = (this.baseCoord.row - 2) * TILE_SIZE;
      const baseApronW = 6 * TILE_SIZE;
      const baseApronH = 4 * TILE_SIZE;
      tCtx.save();
      tCtx.beginPath();
      tCtx.rect(baseApronX, baseApronY, baseApronW, baseApronH);
      tCtx.clip();

      tCtx.strokeStyle = 'rgba(234, 179, 8, 0.06)';
      tCtx.lineWidth = 4;
      for (let d = -this.canvasWidth; d < this.canvasWidth * 2; d += 16) {
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
    }

    // 8. Fine Organic Soil Grit, Pebbles & Sand Grains (1,300 specks)
    for (let i = 0; i < 1300; i++) {
      const gx = rnd() * this.canvasWidth;
      const gy = rnd() * this.canvasHeight;
      const isWarmLight = rnd() > 0.65;
      tCtx.fillStyle = isWarmLight ? 'rgba(240, 215, 175, 0.05)' : 'rgba(0, 0, 0, 0.32)';
      const s = 1 + rnd() * 1.5;
      tCtx.fillRect(gx, gy, s, s);
    }

    // 9. Tactical Sector Crosshairs at tile intersections (every 2 tiles)
    tCtx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
    tCtx.lineWidth = 1;
    for (let r = 0; r <= this.gridRows; r += 2) {
      for (let c = 0; c <= this.gridCols; c += 2) {
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
      this.canvasWidth / 2,
      this.canvasHeight / 2,
      this.canvasHeight * 0.32,
      this.canvasWidth / 2,
      this.canvasHeight / 2,
      this.canvasWidth * 0.65
    );
    vig.addColorStop(0, 'rgba(255, 255, 255, 0.015)');
    vig.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(5, 7, 12, 0.46)');
    tCtx.fillStyle = vig;
    tCtx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    return tCanvas;
  }

  // --- Rendering Pipeline ---
  public render() {
    this.updateViewportSize();
    this.updateRevealedBushCluster();
    const ctx = this.ctx;
    const vW = this.viewportWidth;
    const vH = this.viewportHeight;

    // 1. Draw continuous tactical military warzone terrain across 100% of screen (NO black gaps!)
    this.renderExtendedBackground(ctx, vW, vH);

    // 2. Render arena inside perfectly scaled 1:1 square viewport
    ctx.save();
    ctx.translate(this.originX, this.originY);
    ctx.scale(this.scale, this.scale);
    ctx.translate(this.shakeOffsetX, this.shakeOffsetY);

    if (this.gameMode === 'SURVIVAL') {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, this.viewWidth, this.viewHeight);
      ctx.clip();
      ctx.translate(-Math.round(this.cameraX), -Math.round(this.cameraY));
    }

    // Render arena ground
    if (this.terrainCanvas) {
      ctx.drawImage(this.terrainCanvas, 0, 0, this.canvasWidth, this.canvasHeight);
    } else {
      ctx.fillStyle = '#111722';
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    }

    // 1. Tracks
    this.renderTrackMarks(ctx);

    // 2. Ground & Walls
    this.renderGrid(ctx, false);

    // 3. Power-ups
    this.renderPowerUps(ctx);

    // 4. Tanks
    for (const enemy of this.enemies) {
      if (enemy && enemy.hp > 0) {
        if (this.isEnemyVisibleToPlayer(enemy)) {
          this.renderTank(ctx, enemy);
        }
      }
    }
    if (this.player && this.player.hp > 0 && !this.isPlayerDying) {
      this.renderTank(ctx, this.player);
    }

    // 5. Telegraph Laser lines
    for (const enemy of this.enemies) {
      if (enemy && enemy.isTelegraphing) {
        if (this.isEnemyVisibleToPlayer(enemy)) {
          this.renderTelegraphLaser(ctx, enemy);
        }
      }
    }

    // 6. Bullets
    this.renderBullets(ctx);

    // 7. Bush / Forest on top
    this.renderGrid(ctx, true);

    // 8. Base Forcefield Shield Matrix
    if (this.gameMode !== 'SURVIVAL') {
      this.renderBaseShield(ctx);
    }

    // 9. Tactical Arena Perimeter Framing & Corner Hazard Markers
    this.renderArenaBoundary(ctx);

    // 10. Particles inside arena space
    particleSystem.render(ctx);

    // 11. Floating texts
    this.renderFloatTexts(ctx);

    if (this.gameMode === 'SURVIVAL') {
      ctx.restore(); // restores clip & camera translation
      this.renderMinimapRadar(ctx);
    }

    ctx.restore();

    // 3. Render weather atmosphere across 100% of screen from edge to edge
    weatherSystem.render(ctx);
  }

  private renderMinimapRadar(ctx: CanvasRenderingContext2D) {
    // 145px military radar terminal in top-right corner of viewport
    const mapW = 145;
    const aspect = this.canvasHeight / this.canvasWidth;
    const mapH = Math.round(mapW * aspect);
    const pad = 8;
    const rx = this.viewWidth - mapW - pad;
    const ry = pad;

    ctx.save();
    // High-tech translucent radar terminal
    ctx.fillStyle = 'rgba(10, 15, 29, 0.88)';
    ctx.fillRect(rx, ry, mapW, mapH + 16);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(rx, ry, mapW, mapH + 16);

    // Radar Header
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.fillRect(rx, ry, mapW, 14);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 8.5px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('RADAR QUÂN SỰ', rx + 4, ry + 10);

    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText(`${this.gridCols}x${this.gridRows}`, rx + mapW - 4, ry + 10);

    // Radar Screen content area
    const contentY = ry + 15;
    const scaleX = mapW / this.canvasWidth;
    const scaleY = mapH / this.canvasHeight;

    // Subtle radar sweep line
    const sweepAngle = (performance.now() * 0.002) % (Math.PI * 2);
    const radarCenterX = rx + mapW / 2;
    const radarCenterY = contentY + mapH / 2;
    const radarRadius = Math.max(mapW, mapH) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rx, contentY, mapW, mapH);
    ctx.clip();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(radarCenterX, radarCenterY);
    ctx.lineTo(
      radarCenterX + Math.cos(sweepAngle) * radarRadius,
      radarCenterY + Math.sin(sweepAngle) * radarRadius
    );
    ctx.stroke();
    ctx.restore();

    // Camera Viewport box on Radar (showing current screen window in white/cyan)
    const viewCamX = rx + this.cameraX * scaleX;
    const viewCamY = contentY + this.cameraY * scaleY;
    const viewCamW = Math.min(mapW, this.viewWidth * scaleX);
    const viewCamH = Math.min(mapH, this.viewHeight * scaleY);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(viewCamX, viewCamY, viewCamW, viewCamH);

    // Draw Power-ups as pulsing yellow dots
    for (const p of this.powerUps) {
      if (p.dead) continue;
      const px = rx + p.x * scaleX;
      const py = contentY + p.y * scaleY;
      ctx.fillStyle = '#facc15';
      ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
    }

    // Draw Enemies as red dots (Boss as distinct ringed dot, Hunter as pulsing reticle dot)
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      if (!this.isEnemyVisibleToPlayer(e)) continue; // Cloaked by bush foliage
      const ex = rx + (e.x + e.width / 2) * scaleX;
      const ey = contentY + (e.y + e.height / 2) * scaleY;
      if (e.isHunter) {
        // Hunter: pulsing crimson diamond with outer warning ring on radar
        ctx.fillStyle = '#ff0033';
        ctx.beginPath();
        ctx.arc(ex, ey, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 1;
        ctx.stroke();
        const pingR = 4.2 + Math.sin(performance.now() * 0.01) * 1.5;
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
        ctx.beginPath();
        ctx.arc(ex, ey, pingR, 0, Math.PI * 2);
        ctx.stroke();
      } else if (e.type === 'BOSS') {
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fda4af';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(ex - 1.5, ey - 1.5, 3, 3);
      }
    }

    // Draw Player as pulsing green dot
    if (this.player && this.player.hp > 0 && !this.isPlayerDying) {
      const plx = rx + (this.player.x + this.player.width / 2) * scaleX;
      const ply = contentY + (this.player.y + this.player.height / 2) * scaleY;
      const pulse = (performance.now() % 1000) / 1000;
      ctx.strokeStyle = `rgba(74, 222, 128, ${1 - pulse})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(plx, ply, 3 + pulse * 4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(plx, ply, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private spawnRandomPowerUpAt(x: number, y: number) {
    const types: PowerUpType[] = this.gameMode === 'SURVIVAL'
      ? ['STAR', 'SHIELD', 'BOMB', 'CLOCK', 'HEART', 'SPEED']
      : ['STAR', 'SHIELD', 'BOMB', 'CLOCK', 'SHOVEL', 'HEART', 'SPEED', 'FORTRESS'];
    const type = types[Math.floor(Math.random() * types.length)];
    this.powerUps.push({
      id: `pw_${Date.now()}_${Math.random()}`,
      x,
      y,
      type,
      duration: 25,
      blinkTimer: 0,
    });
    particleSystem.emitSpawnBurst(x, y, '#facc15');
  }

  private renderExtendedBackground(ctx: CanvasRenderingContext2D, vW: number, vH: number) {
    const isMeadow = this.isMeadowStage();
    // Rich military dark asphalt/soil or deep woodland gradient filling 100% of the canvas
    const bgGrad = ctx.createLinearGradient(0, 0, vW, vH);
    if (isMeadow) {
      bgGrad.addColorStop(0, '#101a11');
      bgGrad.addColorStop(0.5, '#0c140d');
      bgGrad.addColorStop(1, '#080e09');
    } else {
      bgGrad.addColorStop(0, '#151821');
      bgGrad.addColorStop(0.5, '#11141b');
      bgGrad.addColorStop(1, '#0e1016');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, vW, vH);

    // Extended paver tile seams aligned seamlessly with arena grid
    const effectiveTile = Math.max(8, TILE_SIZE * Math.max(0.1, this.scale));
    ctx.strokeStyle = isMeadow ? 'rgba(134, 239, 172, 0.025)' : 'rgba(255, 255, 255, 0.022)';
    ctx.lineWidth = 1;

    // Vertical seam lines extending left and right
    const startX = ((this.originX % effectiveTile) + effectiveTile) % effectiveTile;
    for (let x = startX; x < vW; x += effectiveTile) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, vH);
      ctx.stroke();
    }

    // Horizontal seam lines extending top and bottom
    const startY = ((this.originY % effectiveTile) + effectiveTile) % effectiveTile;
    for (let y = startY; y < vH; y += effectiveTile) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(vW, y);
      ctx.stroke();
    }

    // Tactical Wing Demarcations on widescreen displays (left and right flanks)
    const rightStartX = this.originX + this.viewWidth * this.scale;
    const rightMargin = vW - rightStartX;

    if (this.originX > 25 && rightMargin > 25) {
      ctx.save();
      const leftMidX = this.originX / 2;
      const rightMidX = rightStartX + rightMargin / 2;
      const leftRadius = Math.max(1, Math.min(vH * 0.45, this.originX * 0.9));
      const rightRadius = Math.max(1, Math.min(vH * 0.45, rightMargin * 0.9));

      // Subtle tactical radar arc sweep on West flank
      ctx.strokeStyle = isMeadow ? 'rgba(74, 222, 128, 0.08)' : 'rgba(56, 189, 248, 0.06)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(this.originX, vH / 2, leftRadius, Math.PI * 0.5, Math.PI * 1.5);
      ctx.stroke();

      // Subtle tactical radar arc sweep on East flank
      ctx.beginPath();
      ctx.arc(rightStartX, vH / 2, rightRadius, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.stroke();
      ctx.setLineDash([]);

      // Subtle tactical sector text markings
      ctx.fillStyle = isMeadow ? 'rgba(134, 239, 172, 0.32)' : 'rgba(148, 163, 184, 0.28)';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      if (isMeadow) {
        ctx.fillText('◄ CHIẾN TRƯỜNG ĐỒNG CỎ', leftMidX, 32);
        ctx.fillText('CĂN CỨ TIỀN TIÊU', leftMidX, vH - 28);
        ctx.fillText('RỪNG TÁC CHIẾN ►', rightMidX, 32);
        ctx.fillText('VÙNG ĐỊCH TẬP KÍCH', rightMidX, vH - 28);
      } else {
        ctx.fillText('◄ VÀNH ĐAI TÂY', leftMidX, 32);
        ctx.fillText('RADAR QUÂN SỰ', leftMidX, vH - 28);
        ctx.fillText('VÀNH ĐAI ĐÔNG ►', rightMidX, 32);
        ctx.fillText('TRINH SÁT TÁC CHIẾN', rightMidX, vH - 28);
      }
      ctx.restore();
    }
  }

  private renderArenaBoundary(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const isMeadow = this.isMeadowStage();
    // Glowing perimeter line around combat zone
    ctx.strokeStyle = isMeadow ? 'rgba(74, 222, 128, 0.35)' : 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0.5, 0.5, this.canvasWidth - 1, this.canvasHeight - 1);

    // High-tech Corner reinforced brackets
    const bLen = 16;
    ctx.strokeStyle = isMeadow ? '#4ade80' : '#38bdf8';
    ctx.lineWidth = 2.5;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(0, bLen);
    ctx.lineTo(0, 0);
    ctx.lineTo(bLen, 0);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(this.canvasWidth - bLen, 0);
    ctx.lineTo(this.canvasWidth, 0);
    ctx.lineTo(this.canvasWidth, bLen);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(0, this.canvasHeight - bLen);
    ctx.lineTo(0, this.canvasHeight);
    ctx.lineTo(bLen, this.canvasHeight);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(this.canvasWidth - bLen, this.canvasHeight);
    ctx.lineTo(this.canvasWidth, this.canvasHeight);
    ctx.lineTo(this.canvasWidth - bLen, this.canvasHeight);
    ctx.stroke();
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

    // Viewport tile culling for high-frame rate rendering
    const minCol = this.gameMode === 'SURVIVAL'
      ? Math.max(0, Math.floor((this.cameraX - TILE_SIZE) / TILE_SIZE))
      : 0;
    const maxCol = this.gameMode === 'SURVIVAL'
      ? Math.min(this.gridCols - 1, Math.ceil((this.cameraX + this.viewWidth + TILE_SIZE) / TILE_SIZE))
      : this.gridCols - 1;
    const minRow = this.gameMode === 'SURVIVAL'
      ? Math.max(0, Math.floor((this.cameraY - TILE_SIZE) / TILE_SIZE))
      : 0;
    const maxRow = this.gameMode === 'SURVIVAL'
      ? Math.min(this.gridRows - 1, Math.ceil((this.cameraY + this.viewHeight + TILE_SIZE) / TILE_SIZE))
      : this.gridRows - 1;

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const tile = this.grid[r][c];
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        if (onlyBushes) {
          if (tile === TileType.BUSH) {
            const isRevealed = this.isBushTileRevealedToPlayer(c, r);
            this.drawBushTile(ctx, x, y, isRevealed);
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
          case TileType.EXPLOSIVE_BARREL:
            this.drawExplosiveBarrelTile(ctx, x, y, time);
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


  private drawMeadowRockTile(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // === TẢNG ĐÁ HOA CƯƠNG TỰ NHIÊN RETRO 2D (AUTHENTIC RETRO GRANITE BOULDER) ===
    // 1. Soft organic cast shadow on green lawn
    ctx.fillStyle = 'rgba(15, 45, 15, 0.55)';
    ctx.beginPath();
    ctx.ellipse(x + 13, y + 23, 11, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Chiseled Solid Granite Boulder Silhouette
    // Dark stone border outline
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 2);
    ctx.lineTo(x + 20, y + 2);
    ctx.lineTo(x + 24, y + 6);
    ctx.lineTo(x + 25, y + 19);
    ctx.lineTo(x + 21, y + 24);
    ctx.lineTo(x + 4, y + 24);
    ctx.lineTo(x + 1, y + 19);
    ctx.lineTo(x + 1, y + 7);
    ctx.closePath();
    ctx.fill();

    // 3. Boulder Core Body (Slate Granite)
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + 2, y + 3, 21, 20);

    // 4. Shaded South-East Rock Facets
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(x + 15, y + 10);
    ctx.lineTo(x + 23, y + 8);
    ctx.lineTo(x + 23, y + 22);
    ctx.lineTo(x + 10, y + 22);
    ctx.lineTo(x + 13, y + 17);
    ctx.closePath();
    ctx.fill();

    // 5. Sunlit North-West Rock Facets (Granite Grey)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 4);
    ctx.lineTo(x + 17, y + 4);
    ctx.lineTo(x + 14, y + 16);
    ctx.lineTo(x + 3, y + 15);
    ctx.closePath();
    ctx.fill();

    // 6. Top Rock Plateau & Bright Sunlight Ridge
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 3);
    ctx.lineTo(x + 19, y + 3);
    ctx.lineTo(x + 15, y + 8);
    ctx.lineTo(x + 4, y + 7);
    ctx.closePath();
    ctx.fill();

    // Specular mineral rim highlight (Quartz glimmer)
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x + 6, y + 3, 10, 1.5);
    ctx.fillRect(x + 3, y + 6, 1.5, 6);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x + 7, y + 4, 2, 2);

    // 7. Geological Stone Fissures (Rãnh nứt tự nhiên của khối đá)
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + 9, y + 7);
    ctx.lineTo(x + 12, y + 13);
    ctx.lineTo(x + 18, y + 16);
    ctx.stroke();

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 13);
    ctx.lineTo(x + 8, y + 18);
    ctx.stroke();

    // 8. Natural Velvety Moss Growing along crevices and base (Rêu xanh phong hóa)
    ctx.fillStyle = '#14532d'; // Deep forest moss
    ctx.fillRect(x + 2, y + 21, 6, 2.5);
    ctx.fillRect(x + 14, y + 21, 8, 2.5);
    ctx.fillRect(x + 2, y + 9, 2.5, 5);

    ctx.fillStyle = '#22c55e'; // Fresh emerald moss tips
    ctx.fillRect(x + 3, y + 21, 4, 1);
    ctx.fillRect(x + 16, y + 21, 5, 1);
    ctx.fillRect(x + 2.5, y + 10, 1.5, 2.5);
  }

  private drawMeadowBushTile(ctx: CanvasRenderingContext2D, x: number, y: number, isRevealed: boolean = false) {
    ctx.save();
    if (isRevealed) {
      // === BÃI CỎ/BỤI CÂY TRONG SUỐT KHI XE TĂNG NÚP TRONG (CONCEALMENT TRANSPARENCY) ===
      ctx.globalAlpha = 0.40;

      // Soft woodland canopy silhouette
      ctx.fillStyle = '#1c4524';
      ctx.beginPath();
      ctx.arc(x + 7.5, y + 8, 6.5, 0, Math.PI * 2);
      ctx.arc(x + 18.5, y + 7.5, 7, 0, Math.PI * 2);
      ctx.arc(x + 7, y + 18, 7, 0, Math.PI * 2);
      ctx.arc(x + 18.5, y + 18, 6.5, 0, Math.PI * 2);
      ctx.arc(x + 13, y + 13, 7.5, 0, Math.PI * 2);
      ctx.fill();

      // Translucent leafy midtones
      ctx.fillStyle = '#2d6738';
      ctx.beginPath();
      ctx.arc(x + 8, y + 8, 4.5, 0, Math.PI * 2);
      ctx.arc(x + 18, y + 8, 5, 0, Math.PI * 2);
      ctx.arc(x + 8, y + 17, 5, 0, Math.PI * 2);
      ctx.arc(x + 18, y + 17, 4.5, 0, Math.PI * 2);
      ctx.arc(x + 13, y + 13, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Glowing tactical concealment boundary so player sees bush outline clearly
      ctx.strokeStyle = 'rgba(163, 230, 53, 0.75)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(x + 13, y + 13, 11.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      // === BỤI CÂY CHIẾN THUẬT NGHỆ THUẬT 2D (ORGANIC HAND-CRAFTED 2D SHRUBBERY) ===
      // 1. Soft contact shadow on ground (bóng đổ tự nhiên trên mặt đất cỏ)
      ctx.fillStyle = 'rgba(10, 20, 8, 0.48)';
      ctx.beginPath();
      ctx.ellipse(x + 13, y + 21, 10.5, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Base Dark Woodland Undergrowth (Tán lá tầng sâu tạo độ tương phản cao với xe tăng)
      ctx.fillStyle = '#122c17';
      ctx.beginPath();
      ctx.arc(x + 7.5, y + 8, 7, 0, Math.PI * 2);
      ctx.arc(x + 18.5, y + 7.5, 7.5, 0, Math.PI * 2);
      ctx.arc(x + 7, y + 17.5, 7.5, 0, Math.PI * 2);
      ctx.arc(x + 18.5, y + 17.5, 7, 0, Math.PI * 2);
      ctx.arc(x + 13, y + 12.5, 8, 0, Math.PI * 2);
      ctx.fill();

      // 3. Dense Midtone Foliage Lobes (Thân bụi cây xanh rậm rạp tự nhiên)
      ctx.fillStyle = '#1e4b25';
      ctx.beginPath();
      ctx.arc(x + 7.5, y + 7.5, 5.5, 0, Math.PI * 2);
      ctx.arc(x + 18, y + 7, 6, 0, Math.PI * 2);
      ctx.arc(x + 7.5, y + 17, 6, 0, Math.PI * 2);
      ctx.arc(x + 18, y + 17, 5.5, 0, Math.PI * 2);
      ctx.arc(x + 13, y + 12, 6.5, 0, Math.PI * 2);
      ctx.fill();

      // 4. Secondary Foliage Volume (Tạo khối cong mượt mà chuẩn 2D art)
      ctx.fillStyle = '#2b6335';
      ctx.beginPath();
      ctx.arc(x + 7, y + 6.5, 4, 0, Math.PI * 2);
      ctx.arc(x + 17.5, y + 6, 4.5, 0, Math.PI * 2);
      ctx.arc(x + 7, y + 16, 4.5, 0, Math.PI * 2);
      ctx.arc(x + 17.5, y + 16, 4, 0, Math.PI * 2);
      ctx.arc(x + 12.5, y + 11, 5, 0, Math.PI * 2);
      ctx.fill();

      // 5. Warm Sunlit Canopy Highlights (Ánh nắng ấm áp dịu mắt, hoàn toàn không chói lóa)
      ctx.fillStyle = '#487c3c';
      ctx.beginPath();
      ctx.arc(x + 6.5, y + 5.5, 2.5, 0, Math.PI * 2);
      ctx.arc(x + 17, y + 5, 3, 0, Math.PI * 2);
      ctx.arc(x + 6.5, y + 15, 3, 0, Math.PI * 2);
      ctx.arc(x + 17, y + 15, 2.5, 0, Math.PI * 2);
      ctx.arc(x + 12, y + 9.5, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Sunlit leaf crest accents
      ctx.fillStyle = '#6b9f52';
      ctx.fillRect(x + 6, y + 4.5, 2, 1);
      ctx.fillRect(x + 16.5, y + 4, 2.5, 1);
      ctx.fillRect(x + 11, y + 8, 3, 1.2);
      ctx.fillRect(x + 6, y + 14, 2, 1);
      ctx.fillRect(x + 16.5, y + 14, 2, 1);

      // 6. Charming 2D RPG Woodland Berries (Chùm quả dại đỏ thắm tô điểm)
      ctx.fillStyle = '#dc2626'; // Berry base
      ctx.beginPath();
      ctx.arc(x + 11, y + 14.5, 1.8, 0, Math.PI * 2);
      ctx.arc(x + 14.5, y + 15.5, 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Berry light glint
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(x + 10.5, y + 13.8, 1, 1);
      ctx.fillRect(x + 14, y + 14.8, 1, 1);

      // 7. Small Wild Chamomile Bud on top-right lobe
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x + 19, y + 9, 2, 2);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(x + 19.5, y + 9.5, 1, 1);
    }
    ctx.restore();
  }

  private drawSteelTile(ctx: CanvasRenderingContext2D, x: number, y: number) {
    if (this.isMeadowStage()) {
      this.drawMeadowRockTile(ctx, x, y);
      return;
    }
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

  private drawMeadowWaterTile(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
    // === SUỐI NƯỚC ĐỒNG QUÊ TRONG VẮT TỰ NHIÊN (CRYSTAL-CLEAR WOODLAND STREAM) ===
    // 1. Natural earthen/pebble shoreline rim (Không dùng viền xanh lè, dùng viền đất son tự nhiên)
    ctx.fillStyle = '#382f1f';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // 2. Clear mountain freshwater core (Màu nước ngọc lam dịu mát, không chói mắt)
    ctx.fillStyle = '#104953';
    ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);

    // 3. Gentle animated aquatic stream currents
    const wave1 = Math.sin(time * 1.6 + x * 0.14) * 2.2;
    const wave2 = Math.cos(time * 1.3 + y * 0.14) * 2.2;

    ctx.strokeStyle = 'rgba(45, 212, 191, 0.40)'; // Soft cyan-teal caustics
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 8 + wave1);
    ctx.quadraticCurveTo(x + TILE_SIZE / 2, y + 11 + wave1, x + TILE_SIZE - 2, y + 8 + wave1);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(103, 232, 249, 0.30)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 17 + wave2);
    ctx.quadraticCurveTo(x + TILE_SIZE / 2, y + 14 + wave2, x + TILE_SIZE - 2, y + 17 + wave2);
    ctx.stroke();

    // 4. Subtle sunlight water glint
    const glint = (Math.sin(time * 3 + x + y) + 1) * 0.5;
    if (glint > 0.82) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fillRect(x + 6, y + 9 + wave1, 2.5, 1.2);
    }

    // 5. Charming Floating 2D Water-Lily Pad (Lá súng nổi trên mặt nước)
    const hasLily = ((x * 7 + y * 13) % 19) < 8;
    if (hasLily) {
      const lx = x + 6 + ((x * 3 + y) % 11);
      const ly = y + 6 + ((x + y * 5) % 10);

      // Shadow in water
      ctx.fillStyle = 'rgba(5, 25, 28, 0.5)';
      ctx.beginPath();
      ctx.arc(lx + 0.5, ly + 1.2, 3.8, 0, Math.PI * 2);
      ctx.fill();

      // Lily pad leaf
      ctx.fillStyle = '#1c4927';
      ctx.beginPath();
      ctx.arc(lx, ly, 3.5, 0.3, Math.PI * 1.85);
      ctx.lineTo(lx, ly);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#378148';
      ctx.beginPath();
      ctx.arc(lx, ly, 2.4, 0.3, Math.PI * 1.85);
      ctx.lineTo(lx, ly);
      ctx.closePath();
      ctx.fill();

      // Delicate pink water-lily bloom on some pads
      if (((x + y) % 3) === 0) {
        ctx.fillStyle = '#f472b6'; // Pink petal
        ctx.fillRect(lx - 1, ly - 1, 2, 2);
        ctx.fillStyle = '#facc15'; // Golden stamen
        ctx.fillRect(lx - 0.5, ly - 0.5, 1, 1);
      }
    }
  }

  private drawWaterTile(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
    if (this.isMeadowStage()) {
      this.drawMeadowWaterTile(ctx, x, y, time);
      return;
    }
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

  private drawExplosiveBarrelTile(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
    // === TACTICAL EXPLOSIVE FUEL BARREL (THÙNG NHIÊN LIỆU NỔ CHIẾN THUẬT) ===
    // 1. Soft contact shadow on ground
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(x + TILE_SIZE / 2, y + TILE_SIZE - 2, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Heavy Steel Outer Hex Casing / Rim
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

    // 3. Cylindrical Metal Drum Body with curved lighting gradient
    const drumGrad = ctx.createLinearGradient(x + 3, y, x + TILE_SIZE - 3, y);
    drumGrad.addColorStop(0, '#7f1d1d');
    drumGrad.addColorStop(0.2, '#dc2626');
    drumGrad.addColorStop(0.48, '#ef4444');
    drumGrad.addColorStop(0.75, '#b91c1c');
    drumGrad.addColorStop(1, '#500707');
    ctx.fillStyle = drumGrad;
    ctx.fillRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);

    // 4. Heavy Metal Reinforcement Ribs (Top & Bottom)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 2, y + 3, TILE_SIZE - 4, 3);
    ctx.fillRect(x + 2, y + TILE_SIZE - 6, TILE_SIZE - 4, 3);

    // Metal rib highlights
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x + 3, y + 3, TILE_SIZE - 6, 1);
    ctx.fillRect(x + 3, y + TILE_SIZE - 6, TILE_SIZE - 6, 1);

    // 5. High-Voltage Tactical Hazard Warning Chevron Belt (Middle)
    // Black hazard band background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 3, y + 9, TILE_SIZE - 6, 8);

    // Yellow hazard diagonal stripes
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    // Stripe 1
    ctx.moveTo(x + 4, y + 17);
    ctx.lineTo(x + 9, y + 9);
    ctx.lineTo(x + 12, y + 9);
    ctx.lineTo(x + 7, y + 17);
    ctx.closePath();
    ctx.fill();

    // Stripe 2
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 17);
    ctx.lineTo(x + 17, y + 9);
    ctx.lineTo(x + 20, y + 9);
    ctx.lineTo(x + 15, y + 17);
    ctx.closePath();
    ctx.fill();

    // 6. Central Danger Flame / Explosive Core Symbol
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + TILE_SIZE / 2, y + 13, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(x + TILE_SIZE / 2, y + 13, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // 7. Hazardous Fuel Filler Cap & Pulsing LED Warning Strobe
    // Fuel Cap on top
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x + TILE_SIZE - 8, y + 1.5, 4, 2.5);
    ctx.fillStyle = '#475569';
    ctx.fillRect(x + TILE_SIZE - 7, y + 2, 2, 1.5);

    // Pulsing Red Warning Danger Strobe
    const pulse = 0.5 + Math.sin(time * 6 + x * 0.15 + y * 0.15) * 0.5;
    ctx.fillStyle = `rgba(239, 68, 68, ${0.4 + pulse * 0.55})`;
    ctx.beginPath();
    ctx.arc(x + 6, y + 4.5, 2 + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + 6, y + 4.5, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawBushTile(ctx: CanvasRenderingContext2D, x: number, y: number, isRevealed: boolean = false) {
    if (this.isMeadowStage()) {
      this.drawMeadowBushTile(ctx, x, y, isRevealed);
      return;
    }
    ctx.save();
    if (isRevealed) {
      // === REVEALED BUSH: PLAYER IS INSIDE (TẦM NHÌN NÚP BỤI XUYÊN THẤU) ===
      // Semi-translucent foliage so player can clearly see through and behind it
      ctx.globalAlpha = 0.42;

      // Soft canopy lobes
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(x + 7, y + 7, 7, 0, Math.PI * 2);
      ctx.arc(x + 19, y + 8, 7.5, 0, Math.PI * 2);
      ctx.arc(x + 8, y + 19, 7.5, 0, Math.PI * 2);
      ctx.arc(x + 18, y + 18, 7, 0, Math.PI * 2);
      ctx.fill();

      // Translucent bright leaf highlights
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.arc(x + 13, y + 13, 5, 0, Math.PI * 2);
      ctx.fill();

      // Glowing tactical camouflage outline
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.75)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else {
      // === OPAQUE DENSE MILITARY FOLIAGE: IMPENETRABLE LINE OF SIGHT ===
      // Full 100% opacity covering all entities inside or behind it
      ctx.globalAlpha = 1.0;

      // 1. Deep shadowy undergrowth filling the tile
      ctx.fillStyle = '#052e16';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

      // 2. Dense base foliage clusters
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.arc(x + 6, y + 6, 8, 0, Math.PI * 2);
      ctx.arc(x + 20, y + 7, 8.5, 0, Math.PI * 2);
      ctx.arc(x + 7, y + 20, 8.5, 0, Math.PI * 2);
      ctx.arc(x + 19, y + 19, 8, 0, Math.PI * 2);
      ctx.arc(x + 13, y + 13, 8.5, 0, Math.PI * 2);
      ctx.fill();

      // 3. Mid-canopy leafy masses
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(x + 8, y + 9, 6.5, 0, Math.PI * 2);
      ctx.arc(x + 17, y + 8, 6.5, 0, Math.PI * 2);
      ctx.arc(x + 9, y + 17, 6.5, 0, Math.PI * 2);
      ctx.arc(x + 17, y + 16, 6, 0, Math.PI * 2);
      ctx.arc(x + 13, y + 12, 6, 0, Math.PI * 2);
      ctx.fill();

      // 4. Vibrant upper fronds & sunlight leaf highlights
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(x + 9, y + 8, 4, 0, Math.PI * 2);
      ctx.arc(x + 16, y + 7, 3.8, 0, Math.PI * 2);
      ctx.arc(x + 12, y + 13, 4.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.arc(x + 10, y + 7, 2, 0, Math.PI * 2);
      ctx.arc(x + 15, y + 6, 2, 0, Math.PI * 2);
      ctx.arc(x + 13, y + 12, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // 5. Crisp branch & leaf division silhouettes
      ctx.strokeStyle = '#022c22';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x + 8, y + 8, 7.5, 0, Math.PI * 2);
      ctx.arc(x + 18, y + 8, 7.5, 0, Math.PI * 2);
      ctx.arc(x + 8, y + 18, 7.5, 0, Math.PI * 2);
      ctx.arc(x + 18, y + 18, 7.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawBaseHQ(ctx: CanvasRenderingContext2D, x: number, y: number, isDestroyed: boolean) {
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);
    if (col !== this.baseCoord.col || row !== this.baseCoord.row) return;

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

    // 9. Prominent High-Contrast Base HP Armored Gauge & Overhead Status
    const maxHp = cfg.maxHp;
    const isCritical = this.baseHp === 1 && maxHp > 1;

    // --- A. Floating Overhead Tactical Base Health Telemetry (y - 10) ---
    ctx.save();
    const baseBarW = 54;
    const baseBarH = 7;
    const baseBarX = cx - baseBarW / 2;
    const baseBarY = y - 11;

    // Tactical Label above overhead bar
    ctx.font = '900 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const hpRatio = this.baseHp / maxHp;
    const labelText = isCritical
      ? '⚠️ CĂN CỨ: 1 HP!'
      : `🏰 CĂN CỨ: ${this.baseHp}/${maxHp}`;

    // Deep black outline stroke for 100% legibility on any background
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 3;
    ctx.strokeText(labelText, cx, baseBarY - 1.5);
    ctx.fillStyle = isCritical
      ? (Math.floor(time * 1000 / 200) % 2 === 0 ? '#ef4444' : '#fca5a5')
      : (hpRatio > 0.5 ? '#facc15' : '#f97316');
    ctx.fillText(labelText, cx, baseBarY - 1.5);

    // Deep Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(baseBarX - 1.5, baseBarY - 1.5, baseBarW + 3, baseBarH + 3);

    // Dark Plate
    ctx.fillStyle = '#020617';
    ctx.fillRect(baseBarX, baseBarY, baseBarW, baseBarH);

    // Tier/Warning Border
    ctx.strokeStyle = isCritical
      ? (Math.floor(time * 1000 / 200) % 2 === 0 ? '#ef4444' : '#f59e0b')
      : cfg.color;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(baseBarX - 0.5, baseBarY - 0.5, baseBarW + 1, baseBarH + 1);

    // Segmented Base HP blocks
    const baseSegGap = 1.5;
    const baseSegW = (baseBarW - 3 - (maxHp - 1) * baseSegGap) / maxHp;
    for (let i = 0; i < maxHp; i++) {
      const sx = baseBarX + 1.5 + i * (baseSegW + baseSegGap);
      if (i < this.baseHp) {
        if (isCritical) {
          ctx.fillStyle = Math.floor(time * 1000 / 200) % 2 === 0 ? '#ef4444' : '#f87171';
        } else if (hpRatio > 0.5) {
          ctx.fillStyle = '#10b981'; // Emerald healthy
        } else {
          ctx.fillStyle = '#f59e0b'; // Amber damaged
        }
        ctx.fillRect(sx, baseBarY + 1.2, baseSegW, baseBarH - 2.4);

        // Top specular highlight rim
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fillRect(sx, baseBarY + 1.2, baseSegW, 1);
      } else {
        // Depleted health segment
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(sx, baseBarY + 1.2, baseSegW, baseBarH - 2.4);
      }
    }
    ctx.restore();

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

    const cx = this.baseCenter.x;
    const cy = this.baseCenter.y;
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

    // 5. High-Visibility Segmented Overhead HP Bar (Visible & Crisp on ALL tanks)
    const isPlayer = tank.isPlayer;
    const barW = isPlayer ? 32 : (tank.is360Boss ? 56 : (isBoss ? 44 : (tank.type === 'HEAVY' ? 30 : (tank.maxHp > 1 ? 26 : 22))));
    const barH = isPlayer ? 5 : (tank.is360Boss ? 6.5 : (isBoss ? 5.5 : 4.5));
    const barX = cx - barW / 2;
    const barY = cy - halfH - (isPlayer ? 11 : (tank.is360Boss ? 16 : (isBoss ? 13 : 9)));

    ctx.save();

    // Player Extra Lives Indicator (Mạng sống dự phòng - Hình Trái Tim) rendered directly beside player's HP bar
    if (isPlayer && this.stats.lives !== undefined) {
      ctx.font = '900 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const livesText = `♥${this.stats.lives}`;
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 2.5;
      ctx.strokeText(livesText, barX - 10, barY + barH / 2);
      ctx.fillStyle = '#f43f5e';
      ctx.fillText(livesText, barX - 10, barY + barH / 2);
    }

    // Player Bush Camouflage Status indicator
    if (isPlayer && this.isTankInBush(tank)) {
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const camoBadgeW = 48;
      const camoBadgeH = 10;
      const camoBadgeX = barX + barW + 5;
      const camoBadgeY = barY - 2;
      ctx.fillStyle = 'rgba(5, 46, 22, 0.9)';
      ctx.beginPath();
      ctx.roundRect(camoBadgeX, camoBadgeY, camoBadgeW, camoBadgeH, 3);
      ctx.fill();
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#4ade80';
      ctx.fillText('🌿 ẨN NẤP', camoBadgeX + camoBadgeW / 2, camoBadgeY + camoBadgeH / 2);
    }

    // Heavy Drop Shadow for guaranteed legibility across any ground texture
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

    // Deep Dark Background Plate
    ctx.fillStyle = '#020617';
    ctx.fillRect(barX, barY, barW, barH);

    // Dynamic Outline (Shield aura for player, golden for boss, crisp black for standard)
    if (isPlayer && tank.shieldTime > 0) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(barX - 0.5, barY - 0.5, barW + 1, barH + 1);
    } else if (tank.is360Boss) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(barX - 0.5, barY - 0.5, barW + 1, barH + 1);
    } else if (isBoss) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX - 0.5, barY - 0.5, barW + 1, barH + 1);
    } else {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(barX, barY, barW, barH);
    }

    // Health Segments
    const segGap = tank.maxHp > 1 ? 1 : 0;
    const segW = (barW - 2 - (tank.maxHp - 1) * segGap) / tank.maxHp;
    for (let i = 0; i < tank.maxHp; i++) {
      const sx = barX + 1 + i * (segW + segGap);
      if (i < tank.hp) {
        if (isPlayer) {
          const hpRatio = tank.hp / tank.maxHp;
          if (tank.hp === 1 && tank.maxHp > 1) {
            // Urgent flashing crimson when down to last 1 HP
            ctx.fillStyle = Math.floor(time / 160) % 2 === 0 ? '#ef4444' : '#fca5a5';
          } else if (hpRatio > 0.5) {
            ctx.fillStyle = '#10b981'; // Emerald Green
          } else if (hpRatio > 0.25) {
            ctx.fillStyle = '#f59e0b'; // Amber
          } else {
            ctx.fillStyle = '#ef4444'; // Red
          }
        } else {
          // Enemies
          if (isFrozen) {
            ctx.fillStyle = '#38bdf8'; // Frozen Ice Blue
          } else if (isBoss) {
            const bossRatio = tank.hp / tank.maxHp;
            ctx.fillStyle = bossRatio > 0.5 ? '#f97316' : (bossRatio > 0.25 ? '#ef4444' : '#b91c1c');
          } else if (tank.maxHp > 1) {
            const enemyRatio = tank.hp / tank.maxHp;
            ctx.fillStyle = enemyRatio > 0.5 ? '#f97316' : '#ef4444';
          } else {
            ctx.fillStyle = '#ef4444'; // Basic & Scout 1-HP tanks
          }
        }
        ctx.fillRect(sx, barY + 1, segW, barH - 2);

        // Specular 3D highlight gloss on top edge of active segment
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(sx, barY + 1, segW, 0.8);
      } else {
        // Depleted health slot
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(sx, barY + 1, segW, barH - 2);
      }
    }
    ctx.restore();

    // 360 Dreadnought Boss Overhead Indicator & Tactical Targeting Laser Sight
    if (!isPlayer && tank.is360Boss) {
      ctx.save();
      // 1. Red tactical targeting laser beam from Boss center towards player
      if (this.player && this.player.hp > 0 && !this.isPlayerDying) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.32)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        ctx.lineDashOffset = -time * 0.03;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 2. Pulsing Colossal Dreadnought Radar Perimeter
      const pulse = 1 + Math.sin(time * 0.007) * 0.12;
      const reticleR = (tank.width * 0.8) * pulse;
      ctx.strokeStyle = `rgba(245, 158, 11, ${0.45 + Math.sin(time * 0.01) * 0.35})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.lineDashOffset = -time * 0.025;
      ctx.beginPath();
      ctx.arc(cx, cy, reticleR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Regal Boss Badge
      const bossBadgeW = 84;
      const bossBadgeH = 12;
      const bossBadgeX = cx - bossBadgeW / 2;
      const bossBadgeY = barY - 15;

      ctx.fillStyle = 'rgba(127, 29, 29, 0.95)';
      ctx.beginPath();
      ctx.roundRect(bossBadgeX, bossBadgeY, bossBadgeW, bossBadgeH, 3);
      ctx.fill();

      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fef08a';
      ctx.fillText('👑 SIÊU TRÙM 360°', cx, bossBadgeY + bossBadgeH / 2 + 0.5);
      ctx.restore();
    }

    // Hunter Tank (Xe Tăng Truy Sát / Săn Lùng) Overhead Indicator & Radar Ring
    if (!isPlayer && tank.isHunter) {
      ctx.save();
      // 1. Pulsing Tactical Tracking Ring on ground / around tank
      const pulse = 1 + Math.sin(time * 0.008) * 0.12;
      const reticleR = (tank.width * 0.72) * pulse;
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.45 + Math.sin(time * 0.01) * 0.35})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = -time * 0.02;
      ctx.beginPath();
      ctx.arc(cx, cy, reticleR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4 crosshair tick marks
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      [-1, 1].forEach((sign) => {
        ctx.beginPath();
        ctx.moveTo(cx + sign * (reticleR - 3), cy);
        ctx.lineTo(cx + sign * (reticleR + 4), cy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, cy + sign * (reticleR - 3));
        ctx.lineTo(cx, cy + sign * (reticleR + 4));
        ctx.stroke();
      });

      // 2. High-visibility Tactical Hunter Badge above tank HP bar
      const hunterBadgeW = 56;
      const hunterBadgeH = 11;
      const hunterBadgeX = cx - hunterBadgeW / 2;
      const hunterBadgeY = barY - 14;

      ctx.fillStyle = 'rgba(153, 27, 27, 0.92)';
      ctx.beginPath();
      ctx.roundRect(hunterBadgeX, hunterBadgeY, hunterBadgeW, hunterBadgeH, 3);
      ctx.fill();

      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('🎯 TRUY SÁT', cx, hunterBadgeY + hunterBadgeH / 2 + 0.5);

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
    ctx.lineTo(eCenterX + vec.x * this.canvasWidth, eCenterY + vec.y * this.canvasHeight);
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
    if (this.gameMode === 'SURVIVAL') {
      this.stats.baseHp = 0;
      this.stats.baseMaxHp = 0;
      this.stats.baseTier = 0;
      this.stats.baseTierName = 'Không Có Căn Cứ';
      this.stats.baseShieldHp = 0;
      this.stats.baseShieldMaxHp = 0;
      this.stats.baseShieldActive = false;
      this.stats.canUpgradeBase = false;
    } else {
      this.stats.baseHp = Math.max(0, this.baseHp);
      this.stats.baseMaxHp = cfg.maxHp;
      this.stats.baseTier = this.baseTier;
      this.stats.baseTierName = cfg.name;
      this.stats.baseShieldHp = Math.max(0, Math.round(this.baseShieldHp));
      this.stats.baseShieldMaxHp = this.baseShieldMaxHp;
      this.stats.baseShieldActive = this.baseShieldHp > 0;
      this.stats.baseUpgradeCost = cfg.upgradeCost;
      this.stats.canUpgradeBase = this.baseTier < 5 && this.stats.score >= cfg.upgradeCost;
    }
    this.stats.weather = weatherSystem.currentWeather;
    this.stats.isWeatherEnabled = weatherSystem.isEnabled;

    // Calculate real-time dynamic combat telemetry
    const tierIndex = this.player ? Math.min(this.player.tier, PLAYER_TIERS.length - 1) : 0;
    const tierCfg = PLAYER_TIERS[tierIndex];
    const speedBoostActive = this.speedBoostTimer > 0;
    const currentSpeed = this.player ? this.player.speed : (tierCfg.speed + (speedBoostActive ? 35 : 0));
    const reloadTime = this.player ? this.player.reloadMax : (speedBoostActive ? tierCfg.reloadMax * 0.8 : tierCfg.reloadMax);
    const fireRate = Math.round((1 / Math.max(0.05, reloadTime)) * 10) / 10;
    const bulletSpeed = Math.round(tierCfg.bulletSpeed * (speedBoostActive ? 1.15 : 1.0));

    this.stats.combatStats = {
      speed: Math.round(currentSpeed),
      baseSpeed: tierCfg.speed,
      speedBoostActive,
      speedBoostRemaining: Math.round(this.speedBoostTimer * 10) / 10,
      bulletSpeed,
      reloadMax: Math.round(reloadTime * 100) / 100,
      fireRate,
      doubleShot: tierCfg.doubleShot,
      canBreakSteel: tierCfg.canBreakSteel,
      tier: tierIndex + 1,
      tierName: tierCfg.name,
    };

    // Calculate active power-up buffs with live countdowns
    const activeBuffs: ActiveBuffInfo[] = [];

    if (this.speedBoostTimer > 0) {
      activeBuffs.push({
        id: 'speed_boost',
        type: 'SPEED',
        label: 'TĂNG TỐC (+35 Tốc Chạy & +25% Tốc Bắn)',
        remaining: Math.round(this.speedBoostTimer * 10) / 10,
        maxDuration: 8.0,
        color: '#facc15',
      });
    }

    if (this.player && this.player.shieldTime > 0) {
      activeBuffs.push({
        id: 'player_shield',
        type: 'SHIELD',
        label: 'KHIÊN BẤT TỬ (Bảo vệ tuyệt đối)',
        remaining: Math.round(this.player.shieldTime * 10) / 10,
        maxDuration: 10.0,
        color: '#38bdf8',
      });
    }

    if (this.clockFreezeTimer > 0) {
      activeBuffs.push({
        id: 'clock_freeze',
        type: 'CLOCK',
        label: 'ĐÓNG BĂNG ĐỊCH (Toàn bộ địch tê liệt)',
        remaining: Math.round(this.clockFreezeTimer * 10) / 10,
        maxDuration: 7.0,
        color: '#67e8f9',
      });
    }

    if (this.shovelTimer > 0) {
      activeBuffs.push({
        id: 'shovel_fortress',
        type: 'SHOVEL',
        label: 'CÔNG SỰ THÉP (Tường căn cứ bọc thép)',
        remaining: Math.round(this.shovelTimer * 10) / 10,
        maxDuration: 16.0,
        color: '#94a3b8',
      });
    }

    this.stats.activeBuffs = activeBuffs;
    this.stats.zoom = this.zoom;

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
