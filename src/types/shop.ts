export type TankChassisId = 'VANGUARD' | 'STRIKER' | 'TITAN' | 'SIEGE' | 'APEX';

export type SpecialAmmoType = 'STANDARD' | 'APFSDS' | 'HIGH_EXPLOSIVE' | 'PLASMA' | 'HOMING';

export type SupportItemId = 'AIRSTRIKE' | 'CRYO_FREEZE' | 'REPAIR_KIT';

export type UpgradeCategory =
  | 'hullArmor'
  | 'enginePower'
  | 'reloadSpeed'
  | 'coinMagnet'
  | 'bountyBonus'
  | 'startingShield'
  | 'emergencyRepair';

export interface TankChassis {
  id: TankChassisId;
  name: string;
  tagline: string;
  description: string;
  price: number;
  color: string;
  turretColor: string;
  accentColor: string;
  badge: string;
  baseSpeed: number;
  baseMaxHp: number;
  baseReload: number;
  baseBulletSpeed: number;
  damage: number;
  doubleShot: boolean;
  canBreakSteel: boolean;
  specialTrait: string;
}

export interface AmmoConfig {
  id: SpecialAmmoType;
  name: string;
  tagline: string;
  description: string;
  price: number;
  color: string;
  glowColor: string;
  badge: string;
  damageMultiplier: number;
  bulletSpeedMultiplier: number;
  canBreakSteel: boolean;
  splashRadius?: number;
  slowEffect?: boolean;
  homing?: boolean;
}

export interface UpgradeConfig {
  id: UpgradeCategory;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  color: string;
  maxLevel: number;
  costs: number[]; // cost to reach level 1, 2, 3, 4, 5
  perks: string[]; // perk summary for each level
}

export interface SupportItemConfig {
  id: SupportItemId;
  name: string;
  tagline: string;
  description: string;
  hotkey: string;
  price: number;
  maxStock: number;
  icon: string;
  color: string;
}

export interface ShopProfile {
  coins: number;
  totalEarnedCoins: number;
  unlockedTanks: TankChassisId[];
  equippedTank: TankChassisId;
  unlockedAmmo: SpecialAmmoType[];
  equippedAmmo: SpecialAmmoType;
  supportInventory: Record<SupportItemId, number>;
  upgrades: Record<UpgradeCategory, number>;
}
