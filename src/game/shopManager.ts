import {
  TankChassisId,
  SpecialAmmoType,
  SupportItemId,
  UpgradeCategory,
  TankChassis,
  AmmoConfig,
  UpgradeConfig,
  SupportItemConfig,
  ShopProfile,
} from '../types/shop';
import { soundEngine } from '../audio/soundEngine';

export const TANK_CHASSIS_LIST: TankChassis[] = [
  {
    id: 'VANGUARD',
    name: 'Chiến Xa Phổ Thông',
    tagline: 'Gia nhập quân đoàn cơ bản',
    description: 'Khung gầm bọc thép tiêu chuẩn, cân bằng tuyệt đối giữa tốc độ cơ động, độ bền thân xe và hỏa lực pháo.',
    price: 0,
    color: '#22c55e',
    turretColor: '#16a34a',
    accentColor: '#4ade80',
    badge: 'TIÊU CHUẨN',
    baseSpeed: 110,
    baseMaxHp: 3,
    baseReload: 0.45,
    baseBulletSpeed: 260,
    damage: 1,
    doubleShot: false,
    canBreakSteel: false,
    specialTrait: 'Được trang bị sẵn, dễ điều khiển, nhận thêm 10% điểm số hạ địch.',
  },
  {
    id: 'STRIKER',
    name: 'Báo Đốm Tốc Biến',
    tagline: 'Chiến xa đột kích siêu thanh',
    description: 'Chế tác từ hợp kim Titanium siêu nhẹ, gia tăng tốc độ di chuyển và tốc độ nạp đạn thần tốc, thích hợp chiến thuật luồn lách.',
    price: 600,
    color: '#06b6d4',
    turretColor: '#0891b2',
    accentColor: '#22d3ee',
    badge: 'TỐC ĐỘ CAO',
    baseSpeed: 142,
    baseMaxHp: 2,
    baseReload: 0.28,
    baseBulletSpeed: 330,
    damage: 1,
    doubleShot: false,
    canBreakSteel: false,
    specialTrait: 'Tốc độ cực nhanh (+30%), nạp đạn siêu tốc (-38%), dễ dàng luồn lách né đạn.',
  },
  {
    id: 'TITAN',
    name: 'Thiết Huyết Cự Thú',
    tagline: 'Pháo đài bọc thép hạng nặng',
    description: 'Khung gầm bọc giáp phản ứng nổ dày cộm, sở hữu lượng HP cực khủng, đạn bắn phá nát vật cản và chống chịu sóng nổ.',
    price: 1200,
    color: '#dc2626',
    turretColor: '#b91c1c',
    accentColor: '#f87171',
    badge: 'GIÁP CỰC DÀY',
    baseSpeed: 96,
    baseMaxHp: 6,
    baseReload: 0.48,
    baseBulletSpeed: 270,
    damage: 2,
    doubleShot: false,
    canBreakSteel: false,
    specialTrait: 'Máu tối đa cực cao (+3 HP), sát thương đạn tăng gấp đôi, giảm 50% sát thương nổ thùng.',
  },
  {
    id: 'SIEGE',
    name: 'Thần Sấm Tự Hành',
    tagline: 'Hỏa lực tầm xa công thành',
    description: 'Hệ thống pháo cao xạ tầm xa với nòng dài trợ lực, vận tốc đạn xé gió, dễ dàng bắn xuyên chướng ngại vật.',
    price: 2000,
    color: '#f59e0b',
    turretColor: '#d97706',
    accentColor: '#facc15',
    badge: 'TẦM XA & PHÁ THÉP',
    baseSpeed: 108,
    baseMaxHp: 4,
    baseReload: 0.38,
    baseBulletSpeed: 390,
    damage: 2,
    doubleShot: false,
    canBreakSteel: true,
    specialTrait: 'Bắn xuyên thủng tường thép và bê tông, đạn bay siêu nhanh (+50%), xuyên qua bụi cây.',
  },
  {
    id: 'APEX',
    name: 'Kẻ Hủy Diệt Tối Thượng',
    tagline: 'Đỉnh cao công nghệ chiến xa',
    description: 'Thiết kế chiến hạm mặt đất tối mật với song nòng đại bác siêu từ trường, giáp lượng tử tự hồi phục sau thời gian dài.',
    price: 3500,
    color: '#a855f7',
    turretColor: '#7e22ce',
    accentColor: '#c084fc',
    badge: 'SIÊU TRÙM CHIẾN ĐỘI',
    baseSpeed: 122,
    baseMaxHp: 7,
    baseReload: 0.24,
    baseBulletSpeed: 420,
    damage: 2,
    doubleShot: true,
    canBreakSteel: true,
    specialTrait: 'Song nòng kép (Twin Cannons), đạn phá thép uy lực cực đại, giáp siêu bền.',
  },
];

export const SPECIAL_AMMO_LIST: AmmoConfig[] = [
  {
    id: 'STANDARD',
    name: 'Đạn Tiêu Chuẩn M60',
    tagline: 'Đạn thuốc phóng thông dụng',
    description: 'Đạn xuyên phá động năng cơ bản, độ tin cậy cao trong mọi địa hình chiến đấu.',
    price: 0,
    color: '#facc15',
    glowColor: '#eab308',
    badge: 'MẶC ĐỊNH',
    damageMultiplier: 1.0,
    bulletSpeedMultiplier: 1.0,
    canBreakSteel: false,
  },
  {
    id: 'APFSDS',
    name: 'Đạn Mũi Tên Xuyên Thép',
    tagline: 'Xuyên giáp hợp kim thép',
    description: 'Đầu đạn thanh xuyên Vonfram vận tốc siêu cao, xuyên thủng mọi khối tường thép và rào chắn kim loại.',
    price: 500,
    color: '#38bdf8',
    glowColor: '#0284c7',
    badge: 'PHÁ THÉP',
    damageMultiplier: 1.25,
    bulletSpeedMultiplier: 1.25,
    canBreakSteel: true,
  },
  {
    id: 'HIGH_EXPLOSIVE',
    name: 'Đạn Nổ Phá Cao Phân Tử',
    tagline: 'Sóng xung kích nổ diện rộng',
    description: 'Chứa hợp chất nổ áp suất cực cao, khi chạm mục tiêu tạo quả cầu lửa bán kính 44px sát thương lan toàn bộ địch gần đó.',
    price: 800,
    color: '#f97316',
    glowColor: '#ea580c',
    badge: 'NỔ LAN DIỆN RỘNG',
    damageMultiplier: 1.5,
    bulletSpeedMultiplier: 0.95,
    canBreakSteel: false,
    splashRadius: 44,
  },
  {
    id: 'PLASMA',
    name: 'Đạn Plasma Xung Điện',
    tagline: 'Hạt điện từ ion hóa',
    description: 'Gây sát thương x2 lên các dòng xe Thiết Giáp Hạng Nặng và Boss, đồng thời làm tê liệt giảm 50% tốc độ địch trong 2s.',
    price: 1200,
    color: '#a855f7',
    glowColor: '#9333ea',
    badge: 'SỐC ĐIỆN & SÁT THƯƠNG X2',
    damageMultiplier: 2.0,
    bulletSpeedMultiplier: 1.15,
    canBreakSteel: true,
    slowEffect: true,
  },
  {
    id: 'HOMING',
    name: 'Tên Lửa Tầm Nhiệt Micro',
    tagline: 'Tự động dẫn đường tới mục tiêu',
    description: 'Vi đạn thông minh tự bẻ cong quỹ đạo hướng về phía xe tăng địch gần nhất trong tầm quét tác chiến.',
    price: 1800,
    color: '#ef4444',
    glowColor: '#dc2626',
    badge: 'TỰ DẪN ĐƯỜNG',
    damageMultiplier: 1.6,
    bulletSpeedMultiplier: 1.05,
    canBreakSteel: false,
    homing: true,
  },
];

export const UPGRADE_LIST: UpgradeConfig[] = [
  {
    id: 'hullArmor',
    name: 'Gia Cố Giáp Composite',
    tagline: 'Tăng lượng HP tối đa của xe tăng',
    description: 'Gắn thêm các tấm giáp gốm nhiều lớp vào khung gầm xe, giúp tăng thêm 1 vạch máu tối đa cho mỗi cấp độ.',
    icon: '🛡️',
    color: '#3b82f6',
    maxLevel: 5,
    costs: [200, 450, 800, 1400, 2200],
    perks: ['+1 HP tối đa', '+2 HP tối đa', '+3 HP tối đa', '+4 HP tối đa', '+5 HP tối đa (Siêu Giáp)'],
  },
  {
    id: 'enginePower',
    name: 'Động Cơ Phun Tăng Áp',
    tagline: 'Tăng tốc độ di chuyển cơ bản',
    description: 'Nâng cấp tuabin nạp khí và xích truyền động, tăng tốc độ cơ động vượt địa hình của xe tăng.',
    icon: '⚡',
    color: '#06b6d4',
    maxLevel: 5,
    costs: [180, 400, 750, 1300, 2000],
    perks: ['+8 px/s tốc độ', '+16 px/s tốc độ', '+24 px/s tốc độ', '+32 px/s tốc độ', '+40 px/s tốc độ (Phản Lực)'],
  },
  {
    id: 'reloadSpeed',
    name: 'Bộ Nạp Đạn Tự Động',
    tagline: 'Giảm thời gian hồi chiêu bắn',
    description: 'Trục nạp đạn cơ điện tử thông minh, tăng tần suất bắn đạn liên thanh nhanh hơn cho mọi cỗ pháo.',
    icon: '🔄',
    color: '#eab308',
    maxLevel: 5,
    costs: [220, 500, 900, 1500, 2400],
    perks: ['-8% hồi chiêu bắn', '-16% hồi chiêu bắn', '-24% hồi chiêu bắn', '-32% hồi chiêu bắn', '-40% hồi chiêu (Liên Thanh Siêu Tốc)'],
  },
  {
    id: 'coinMagnet',
    name: 'Nam Châm Thu Tiền Hút Vàng',
    tagline: 'Tự động gom tiền rơi từ xa',
    description: 'Máy phát trường điện từ hút các đồng xu vàng và thỏi vàng rơi trên chiến trường bay thẳng về phía xe.',
    icon: '🧲',
    color: '#ec4899',
    maxLevel: 5,
    costs: [150, 350, 650, 1100, 1800],
    perks: ['Bán kính hút 50px', 'Bán kính hút 95px', 'Bán kính hút 140px', 'Bán kính hút 185px', 'Bán kính hút 240px (Toàn Màn Hình)'],
  },
  {
    id: 'bountyBonus',
    name: 'Tiền Thưởng Quân Nhu',
    tagline: 'Nhận thêm tiền khi tiêu diệt địch',
    description: 'Hợp đồng tác chiến đặc biệt, nhận thêm phần trăm tiền xu từ mỗi xe tăng địch và thùng vật phẩm bị bắn nổ.',
    icon: '🪙',
    color: '#facc15',
    maxLevel: 5,
    costs: [250, 550, 1000, 1700, 2600],
    perks: ['+20% tiền xu rơi', '+40% tiền xu rơi', '+60% tiền xu rơi', '+80% tiền xu rơi', '+100% tiền xu rơi (Gấp đôi lợi tức)'],
  },
  {
    id: 'startingShield',
    name: 'Khiên Bảo Vệ Khởi Đầu',
    tagline: 'Tăng thời gian khiên bất tử khi xuất hiện',
    description: 'Trang bị máy phát trường bảo hộ khẩn cấp, kéo dài thời gian khiên miễn sát thương mỗi khi sinh ra hoặc sang mạng mới.',
    icon: '✨',
    color: '#8b5cf6',
    maxLevel: 5,
    costs: [200, 450, 850, 1400, 2200],
    perks: ['+1.0s khiên bất tử', '+2.0s khiên bất tử', '+3.0s khiên bất tử', '+4.0s khiên bất tử', '+5.0s khiên bất tử (Vững Như Thạch)'],
  },
  {
    id: 'emergencyRepair',
    name: 'Hệ Thống Tự Sửa Nanite',
    tagline: 'Hồi 1 HP khi máu chạm mức nguy tử',
    description: 'Vi hạt nanite khẩn cấp tự động kích hoạt hàn kín thân xe và phục hồi 1-2 HP khi xe sắp bị phá hủy (1 lần mỗi mạng).',
    icon: '🔧',
    color: '#22c55e',
    maxLevel: 3,
    costs: [400, 950, 1800],
    perks: ['Hồi 1 HP khi còn 1 máu', 'Hồi 2 HP khi còn 1 máu', 'Hồi 3 HP + tạo khiên 3s khi nguy tử'],
  },
];

export const SUPPORT_ITEMS_LIST: SupportItemConfig[] = [
  {
    id: 'AIRSTRIKE',
    name: 'Không Kích Hạt Nhân',
    tagline: 'Trừ 1 HP toàn bộ xe tăng địch',
    description: 'Gọi phi đội oanh tạc cơ dải thảm bom xung kích trên toàn bộ bản đồ, trừ 1 HP tất cả địch và vô hiệu hóa đạn bay.',
    hotkey: 'B',
    price: 300,
    maxStock: 3,
    icon: '☢️',
    color: '#ef4444',
  },
  {
    id: 'CRYO_FREEZE',
    name: 'Bom Đóng Băng Tuyệt Đối',
    tagline: 'Băng phong toàn bộ địch trong 8s',
    description: 'Phát tán luồng khí lạnh cực sâu -200°C làm tê liệt toàn bộ xe tăng địch, bất động hoàn toàn trong 8 giây.',
    hotkey: 'F',
    price: 200,
    maxStock: 3,
    icon: '❄️',
    color: '#38bdf8',
  },
  {
    id: 'REPAIR_KIT',
    name: 'Gói Cứu Thương Khẩn Cấp',
    tagline: 'Hồi phục ngay lập tức 2 HP',
    description: 'Đội bảo trì chiến trường nạp khẩn cấp hợp kim hàn gắn và tiếp nhiên liệu, hồi phục ngay 2 HP cho xe tăng.',
    hotkey: 'R',
    price: 150,
    maxStock: 3,
    icon: '🩹',
    color: '#22c55e',
  },
];

const STORAGE_KEY = 'tank_game_shop_profile_v1';

const DEFAULT_PROFILE: ShopProfile = {
  coins: 0,
  totalEarnedCoins: 0,
  unlockedTanks: ['VANGUARD'],
  equippedTank: 'VANGUARD',
  unlockedAmmo: ['STANDARD'],
  equippedAmmo: 'STANDARD',
  supportInventory: {
    AIRSTRIKE: 0,
    CRYO_FREEZE: 0,
    REPAIR_KIT: 0,
  },
  upgrades: {
    hullArmor: 0,
    enginePower: 0,
    reloadSpeed: 0,
    coinMagnet: 0,
    bountyBonus: 0,
    startingShield: 0,
    emergencyRepair: 0,
  },
};

export class ShopManager {
  private profile: ShopProfile;
  private listeners: Set<(profile: ShopProfile) => void> = new Set();

  constructor() {
    this.profile = this.loadProfile();
  }

  private loadProfile(): ShopProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return { ...DEFAULT_PROFILE };
      const parsed = JSON.parse(data) as Partial<ShopProfile>;
      return {
        coins: typeof parsed.coins === 'number' ? parsed.coins : 0,
        totalEarnedCoins: typeof parsed.totalEarnedCoins === 'number' ? parsed.totalEarnedCoins : 0,
        unlockedTanks: Array.isArray(parsed.unlockedTanks) && parsed.unlockedTanks.length > 0
          ? parsed.unlockedTanks
          : ['VANGUARD'],
        equippedTank: parsed.equippedTank || 'VANGUARD',
        unlockedAmmo: Array.isArray(parsed.unlockedAmmo) && parsed.unlockedAmmo.length > 0
          ? parsed.unlockedAmmo
          : ['STANDARD'],
        equippedAmmo: parsed.equippedAmmo || 'STANDARD',
        supportInventory: {
          AIRSTRIKE: parsed.supportInventory?.AIRSTRIKE || 0,
          CRYO_FREEZE: parsed.supportInventory?.CRYO_FREEZE || 0,
          REPAIR_KIT: parsed.supportInventory?.REPAIR_KIT || 0,
        },
        upgrades: {
          hullArmor: parsed.upgrades?.hullArmor || 0,
          enginePower: parsed.upgrades?.enginePower || 0,
          reloadSpeed: parsed.upgrades?.reloadSpeed || 0,
          coinMagnet: parsed.upgrades?.coinMagnet || 0,
          bountyBonus: parsed.upgrades?.bountyBonus || 0,
          startingShield: parsed.upgrades?.startingShield || 0,
          emergencyRepair: parsed.upgrades?.emergencyRepair || 0,
        },
      };
    } catch {
      return { ...DEFAULT_PROFILE };
    }
  }

  private saveProfile() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
      this.notifyListeners();
    } catch {
      // LocalStorage blocked
    }
  }

  private notifyListeners() {
    const clone = this.getProfile();
    this.listeners.forEach((fn) => fn(clone));
  }

  public subscribe(fn: (profile: ShopProfile) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public getProfile(): ShopProfile {
    return JSON.parse(JSON.stringify(this.profile));
  }

  public addCoins(amount: number) {
    if (amount <= 0) return;
    this.profile.coins += amount;
    this.profile.totalEarnedCoins += amount;
    this.saveProfile();
  }

  public spendCoins(amount: number): boolean {
    if (amount <= 0) return true;
    if (this.profile.coins < amount) return false;
    this.profile.coins -= amount;
    this.saveProfile();
    return true;
  }

  public unlockTank(id: TankChassisId): boolean {
    if (this.profile.unlockedTanks.includes(id)) return true;
    const cfg = TANK_CHASSIS_LIST.find((t) => t.id === id);
    if (!cfg) return false;
    if (this.profile.coins < cfg.price) return false;

    this.profile.coins -= cfg.price;
    this.profile.unlockedTanks.push(id);
    this.profile.equippedTank = id;
    this.saveProfile();
    soundEngine.playPurchaseSuccess();
    return true;
  }

  public equipTank(id: TankChassisId): boolean {
    if (!this.profile.unlockedTanks.includes(id)) return false;
    this.profile.equippedTank = id;
    this.saveProfile();
    return true;
  }

  public unlockAmmo(id: SpecialAmmoType): boolean {
    if (this.profile.unlockedAmmo.includes(id)) return true;
    const cfg = SPECIAL_AMMO_LIST.find((a) => a.id === id);
    if (!cfg) return false;
    if (this.profile.coins < cfg.price) return false;

    this.profile.coins -= cfg.price;
    this.profile.unlockedAmmo.push(id);
    this.profile.equippedAmmo = id;
    this.saveProfile();
    soundEngine.playPurchaseSuccess();
    return true;
  }

  public equipAmmo(id: SpecialAmmoType): boolean {
    if (!this.profile.unlockedAmmo.includes(id)) return false;
    this.profile.equippedAmmo = id;
    this.saveProfile();
    return true;
  }

  public buySupportItem(id: SupportItemId): boolean {
    const cfg = SUPPORT_ITEMS_LIST.find((i) => i.id === id);
    if (!cfg) return false;
    const cur = this.profile.supportInventory[id] || 0;
    if (cur >= cfg.maxStock) return false;
    if (this.profile.coins < cfg.price) return false;

    this.profile.coins -= cfg.price;
    this.profile.supportInventory[id] = cur + 1;
    this.saveProfile();
    soundEngine.playPurchaseSuccess();
    return true;
  }

  public consumeSupportItem(id: SupportItemId): boolean {
    const cur = this.profile.supportInventory[id] || 0;
    if (cur <= 0) return false;
    this.profile.supportInventory[id] = cur - 1;
    this.saveProfile();
    return true;
  }

  public upgrade(category: UpgradeCategory): boolean {
    const cfg = UPGRADE_LIST.find((u) => u.id === category);
    if (!cfg) return false;
    const curLvl = this.profile.upgrades[category] || 0;
    if (curLvl >= cfg.maxLevel) return false;

    const cost = cfg.costs[curLvl];
    if (this.profile.coins < cost) return false;

    this.profile.coins -= cost;
    this.profile.upgrades[category] = curLvl + 1;
    this.saveProfile();
    soundEngine.playPurchaseSuccess();
    return true;
  }

  public getEquippedTankConfig(): TankChassis {
    return (
      TANK_CHASSIS_LIST.find((t) => t.id === this.profile.equippedTank) ||
      TANK_CHASSIS_LIST[0]
    );
  }

  public getEquippedAmmoConfig(): AmmoConfig {
    return (
      SPECIAL_AMMO_LIST.find((a) => a.id === this.profile.equippedAmmo) ||
      SPECIAL_AMMO_LIST[0]
    );
  }

  public getBountyMultiplier(): number {
    const lvl = this.profile.upgrades.bountyBonus || 0;
    return 1 + lvl * 0.20; // 0: 1.0x, 5: 2.0x
  }

  public getMagnetRadius(): number {
    const lvl = this.profile.upgrades.coinMagnet || 0;
    return lvl > 0 ? 50 + (lvl - 1) * 45 : 0; // 0, 50, 95, 140, 185, 230px
  }

  public getStartingShieldSeconds(): number {
    const lvl = this.profile.upgrades.startingShield || 0;
    return 3.5 + lvl * 1.0; // 3.5s base + up to 5.0s
  }

  public getReloadSpeedMultiplier(): number {
    const lvl = this.profile.upgrades.reloadSpeed || 0;
    return Math.max(0.55, 1 - lvl * 0.08); // 1.0 down to 0.60
  }

  public getEngineSpeedBonus(): number {
    const lvl = this.profile.upgrades.enginePower || 0;
    return lvl * 8; // 0 to 40 px/s
  }

  public getBonusHullHp(): number {
    const lvl = this.profile.upgrades.hullArmor || 0;
    return lvl; // +0 to +5 HP
  }

  public getEmergencyRepairLevel(): number {
    return this.profile.upgrades.emergencyRepair || 0;
  }
}

export const shopManager = new ShopManager();
