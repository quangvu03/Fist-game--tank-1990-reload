import { EnemyType, Direction, TileType } from '../types/game';

export const STAGE_COLS = 26; // Stage authoring blueprint width
export const GRID_COLS = 48; // Standard 16:9 widescreen battlefield columns (48 / 27 = 16:9)
export const GRID_ROWS = 27; // Standard 16:9 widescreen rows (27 * 26 = 702px, 48 * 26 = 1248px)
export const TILE_SIZE = 26; // 26px tile size
export const CANVAS_WIDTH = GRID_COLS * TILE_SIZE; // 1248px (16:9 aspect ratio)
export const CANVAS_HEIGHT = GRID_ROWS * TILE_SIZE; // 702px (16:9 aspect ratio)
export const CANVAS_SIZE = CANVAS_HEIGHT; // backwards compatibility

export const TANK_SIZE = 26;
export const BULLET_RADIUS = 3.5;
export const MISSILE_RADIUS = 5.5;

// Base footprint: 2x2 base at bottom center (cols 23 & 24, rows 25 & 26 - flush against bottom border, zero gap behind)
// Total 48 cols: 23 cols to left (0..22), 2 cols for base (23..24), 23 cols to right (25..47) -> Exactly centered!
export const BASE_COORD = { col: 23, row: 25 };
export const BASE_CENTER = { x: 24 * TILE_SIZE, y: 25.8 * TILE_SIZE }; // 624px (exactly 1248 / 2)
export const BASE_SHIELD_RADIUS = 58;

export interface BaseTierConfig {
  tier: number;
  name: string;
  badge: string;
  maxHp: number;
  maxShield: number;
  shieldHardness: number; // 1.0 = standard, higher = extra damage reduction
  shieldRechargeRate: number; // Shield HP per second
  shieldColor: string;
  wallType: TileType;
  wallHp: number;
  hasForcefield: boolean;
  hasAutoTurret: boolean;
  turretFireRate: number; // Seconds per shot
  upgradeCost: number; // Score needed to manually upgrade
  color: string;
  description: string;
}

export const BASE_TIERS: BaseTierConfig[] = [
  {
    tier: 1,
    name: 'Căn Cứ Thùng Tiếp Tế',
    badge: 'CẤP 1',
    maxHp: 2,
    maxShield: 0,
    shieldHardness: 1.0,
    shieldRechargeRate: 0,
    shieldColor: '#b45309',
    wallType: TileType.BRICK,
    wallHp: 1,
    hasForcefield: false,
    hasAutoTurret: false,
    turretFireRate: 0,
    upgradeCost: 500,
    color: '#b45309',
    description: 'Hàng rào thùng gỗ tiếp tế cơ bản, chưa có màn chắn năng lượng.',
  },
  {
    tier: 2,
    name: 'Pháo Đài Bê Tông Kiên Cố',
    badge: 'CẤP 2',
    maxHp: 3,
    maxShield: 50,
    shieldHardness: 1.2,
    shieldRechargeRate: 6,
    shieldColor: '#38bdf8',
    wallType: TileType.REINFORCED_WALL,
    wallHp: 2,
    hasForcefield: true,
    hasAutoTurret: false,
    turretFireRate: 0,
    upgradeCost: 1200,
    color: '#64748b',
    description: 'Tường bê tông gia cố chịu 2 phát đạn, màn chắn sơ cấp 50 HP.',
  },
  {
    tier: 3,
    name: 'Thành Trì Thép Hợp Kim',
    badge: 'CẤP 3',
    maxHp: 4,
    maxShield: 100,
    shieldHardness: 1.6,
    shieldRechargeRate: 10,
    shieldColor: '#0284c7',
    wallType: TileType.STEEL,
    wallHp: 3,
    hasForcefield: true,
    hasAutoTurret: true,
    turretFireRate: 2.2,
    upgradeCost: 2200,
    color: '#0284c7',
    description: 'Tường thép hợp kim chống đạn, màn chắn điện từ 100 HP, pháo tự động.',
  },
  {
    tier: 4,
    name: 'Chiến Lũy Titanium Bọc Thép',
    badge: 'CẤP 4',
    maxHp: 5,
    maxShield: 180,
    shieldHardness: 2.2,
    shieldRechargeRate: 15,
    shieldColor: '#eab308',
    wallType: TileType.STEEL,
    wallHp: 4,
    hasForcefield: true,
    hasAutoTurret: true,
    turretFireRate: 1.6,
    upgradeCost: 3500,
    color: '#eab308',
    description: 'Màn chắn plasma hoàng kim 180 HP giảm sát thương, pháo liên thanh bảo vệ.',
  },
  {
    tier: 5,
    name: 'Pháo Đài Lượng Tử Tối Thượng',
    badge: 'CẤP 5',
    maxHp: 6,
    maxShield: 280,
    shieldHardness: 3.0,
    shieldRechargeRate: 24,
    shieldColor: '#06b6d4',
    wallType: TileType.ENERGY_BARRIER,
    wallHp: 5,
    hasForcefield: true,
    hasAutoTurret: true,
    turretFireRate: 1.0,
    upgradeCost: 0, // Đã đạt cấp tối đa
    color: '#06b6d4',
    description: 'Lớp màn lượng tử tối thượng 280 HP cực cứng, tự hồi siêu tốc, pháo kép.',
  },
];

export const ENEMY_CONFIGS: Record<EnemyType, {
  name: string;
  speed: number;
  hp: number;
  reloadMax: number;
  bulletSpeed: number;
  scoreValue: number;
  color: string;
  turretColor: string;
  canBreakSteel?: boolean;
}> = {
  SCOUT: {
    name: 'Xe Trinh Sát Tốc Độ',
    speed: 130,
    hp: 1,
    reloadMax: 1.1,
    bulletSpeed: 230,
    scoreValue: 100,
    color: '#06b6d4',
    turretColor: '#0891b2',
  },
  ASSAULT: {
    name: 'Chiến Xa Đột Kích',
    speed: 105,
    hp: 2,
    reloadMax: 0.9,
    bulletSpeed: 250,
    scoreValue: 200,
    color: '#f59e0b',
    turretColor: '#d97706',
  },
  HEAVY: {
    name: 'Thiết Giáp Hạng Nặng',
    speed: 80,
    hp: 4,
    reloadMax: 1.3,
    bulletSpeed: 210,
    scoreValue: 400,
    color: '#ef4444',
    turretColor: '#b91c1c',
  },
  ARTILLERY: {
    name: 'Pháo Tự Hành Phóng Tên Lửa',
    speed: 70,
    hp: 3,
    reloadMax: 2.2,
    bulletSpeed: 290,
    scoreValue: 500,
    color: '#a855f7',
    turretColor: '#7e22ce',
  },
  BOSS: {
    name: 'Chiến Hạm Titan Tối Thượng',
    speed: 65,
    hp: 14,
    reloadMax: 2.4, // Bắn chậm hơn để người chơi có thời gian né tránh và phản công
    bulletSpeed: 270,
    scoreValue: 1500,
    color: '#e11d48',
    turretColor: '#be123c',
    canBreakSteel: true,
  },
};

export const PLAYER_TIERS = [
  {
    name: 'Pháo Cơ Bản',
    speed: 110,
    bulletSpeed: 260,
    reloadMax: 0.45,
    doubleShot: false,
    canBreakSteel: false,
    maxHp: 3,
  },
  {
    name: 'Pháo Siêu Tốc',
    speed: 120,
    bulletSpeed: 330,
    reloadMax: 0.35,
    doubleShot: false,
    canBreakSteel: false,
    maxHp: 4,
  },
  {
    name: 'Song Nòng Hạng Nặng',
    speed: 125,
    bulletSpeed: 350,
    reloadMax: 0.28,
    doubleShot: true,
    canBreakSteel: false,
    maxHp: 5,
  },
  {
    name: 'Chiến Xa Phá Thép',
    speed: 135,
    bulletSpeed: 400,
    reloadMax: 0.22,
    doubleShot: true,
    canBreakSteel: true,
    maxHp: 6,
  },
];

export const DIR_VECTORS: Record<Direction, { x: number; y: number; angle: number }> = {
  UP: { x: 0, y: -1, angle: -Math.PI / 2 },
  DOWN: { x: 0, y: 1, angle: Math.PI / 2 },
  LEFT: { x: -1, y: 0, angle: Math.PI },
  RIGHT: { x: 1, y: 0, angle: 0 },
};
