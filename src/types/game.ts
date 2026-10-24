export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export enum TileType {
  EMPTY = 0,
  BRICK = 1,
  CRATE = 1, // Wooden Crate (Thùng gỗ quân sự)
  STEEL = 2,
  WATER = 3,
  BUSH = 4,
  ICE = 5,
  BASE = 6,
  BASE_DESTROYED = 7,
  REINFORCED_WALL = 8,
  ENERGY_BARRIER = 9,
}

export type EnemyType = 'SCOUT' | 'ASSAULT' | 'HEAVY' | 'ARTILLERY' | 'BOSS';
export type TankType = 'PLAYER' | EnemyType;

export type PowerUpType = 'STAR' | 'SHIELD' | 'BOMB' | 'CLOCK' | 'SHOVEL' | 'HEART' | 'SPEED' | 'FORTRESS';

export type GameMode = 'CAMPAIGN' | 'SURVIVAL' | 'BOSS_RUSH';
export type GameStatus = 'TITLE' | 'PLAYING' | 'PAUSED' | 'STAGE_CLEAR' | 'GAME_OVER' | 'VICTORY';
export type ControlMode = 'CLASSIC' | 'MOUSE_AIM';

export interface Tank {
  id: string;
  type: TankType;
  x: number;
  y: number;
  width: number;
  height: number;
  dir: Direction;
  turretAngle: number;
  speed: number;
  maxHp: number;
  hp: number;
  tier: number; // 0, 1, 2, 3
  isPlayer: boolean;
  isFlashing: boolean; // bonus carrier drops item when destroyed
  reloadTimer: number;
  reloadMax: number;
  shieldTime: number;
  frozenTime: number;
  isTelegraphing?: boolean; // For artillery warning laser
  telegraphTimer?: number;
  scoreValue: number;
  name: string;
  color: string;
  tracksOffset: number;
  stuckTimer?: number;
  currentDecisionTimer?: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  ownerId: string;
  isPlayer: boolean;
  canBreakSteel: boolean;
  isMissile?: boolean;
  dead?: boolean;
}

export type ParticleType =
  | 'spark'
  | 'smoke'
  | 'debris'
  | 'shockwave'
  | 'flame'
  | 'dust'
  | 'water_ripple'
  | 'flash';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  drag: number;
  gravity?: number;
  size: number;
  startSize: number;
  endSize: number;
  angle?: number;
  vRot?: number;
  life: number;
  maxLife: number;
  color: string;
  endColor?: string;
  alpha: number;
  type: ParticleType;
  shape?: 'circle' | 'rect' | 'spark_line' | 'ring';
  width?: number;
  height?: number;
  dead?: boolean;
}

export interface TrackMark {
  x: number;
  y: number;
  angle: number;
  alpha: number;
}

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  type: PowerUpType;
  duration: number; // Disappears after 20s if not picked up
  blinkTimer: number;
  dead?: boolean;
}

export interface FloatText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  dead?: boolean;
}

export interface StageConfig {
  id: number;
  name: string;
  description: string;
  grid: number[][]; // 26 x 26 grid
  enemies: EnemyType[];
  maxActiveEnemies: number;
}

export type WeatherType = 'CLEAR' | 'RAIN' | 'SNOW';

export interface PlayerCombatStats {
  speed: number;               // Actual movement speed (px/s), factoring in tier and buffs
  baseSpeed: number;           // Standard speed for current tier
  speedBoostActive: boolean;   // Whether temporary speed item is active
  speedBoostRemaining: number; // Seconds remaining for speed boost (0 if inactive)
  bulletSpeed: number;         // Velocity of bullets (px/s)
  reloadMax: number;           // Seconds per shot cooldown (e.g. 0.35s)
  fireRate: number;            // Shots per second (e.g. 2.85 shots/s)
  doubleShot: boolean;         // Twin cannon active
  canBreakSteel: boolean;      // High-caliber armor piercing (can pierce steel)
  tier: number;                // 1, 2, 3, 4
  tierName: string;            // Name of current tank class
}

export interface ActiveBuffInfo {
  id: string;
  type: PowerUpType;
  label: string;
  remaining: number;
  maxDuration: number;
  color: string;
}

export interface GameStats {
  score: number;
  highScore: number;
  lives: number;
  playerHp: number;
  playerMaxHp: number;
  playerTier: number;
  stage: number;
  totalStages: number;
  kills: Record<EnemyType, number>;
  totalKills: number;
  baseHp: number;
  baseMaxHp: number;
  baseTier: number;
  baseTierName: string;
  baseShieldHp: number;
  baseShieldMaxHp: number;
  baseShieldActive: boolean;
  baseUpgradeCost: number;
  canUpgradeBase: boolean;
  powerUpsCollected: number;
  gameMode: GameMode;
  weather: WeatherType;
  isWeatherEnabled: boolean;
  combatStats: PlayerCombatStats;
  activeBuffs: ActiveBuffInfo[];
  zoom?: number;
}
