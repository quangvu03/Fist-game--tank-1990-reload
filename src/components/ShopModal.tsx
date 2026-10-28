import { useState, useEffect } from 'react';
import {
  X,
  Coins,
  Shield,
  Zap,
  Package,
  Crosshair,
  Check,
  Lock,
  ChevronRight,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  TANK_CHASSIS_LIST,
  SPECIAL_AMMO_LIST,
  UPGRADE_LIST,
  SUPPORT_ITEMS_LIST,
  shopManager,
} from '../game/shopManager';
import {
  TankChassisId,
  SpecialAmmoType,
  SupportItemId,
  UpgradeCategory,
  ShopProfile,
} from '../types/shop';
import { soundEngine } from '../audio/soundEngine';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
}

type ShopTab = 'TANKS' | 'AMMO' | 'UPGRADES' | 'SUPPORT';

export function ShopModal({ isOpen, onClose, onProfileUpdated }: ShopModalProps) {
  const [activeTab, setActiveTab] = useState<ShopTab>('TANKS');
  const [profile, setProfile] = useState<ShopProfile>(() => shopManager.getProfile());
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; color: string } | null>(null);

  useEffect(() => {
    const unsub = shopManager.subscribe((newProfile) => {
      setProfile(newProfile);
    });
    return () => unsub();
  }, []);

  // Update profile whenever opened
  useEffect(() => {
    if (isOpen) {
      setProfile(shopManager.getProfile());
    }
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const showFeedback = (text: string, color: string = '#22c55e') => {
    setFeedbackMsg({ text, color });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 2400);
  };

  const handleUnlockTank = (id: TankChassisId) => {
    if (shopManager.unlockTank(id)) {
      showFeedback('Mở khóa chiến xa thành công!', '#22c55e');
      if (onProfileUpdated) onProfileUpdated();
    } else {
      showFeedback('Không đủ tiền xu để mở khóa!', '#ef4444');
      soundEngine.playHitMetal();
    }
  };

  const handleEquipTank = (id: TankChassisId) => {
    if (shopManager.equipTank(id)) {
      soundEngine.playPowerUp();
      showFeedback('Đã trang bị chiến xa mới!', '#38bdf8');
      if (onProfileUpdated) onProfileUpdated();
    }
  };

  const handleUnlockAmmo = (id: SpecialAmmoType) => {
    if (shopManager.unlockAmmo(id)) {
      showFeedback('Mở khóa loại đạn đặc chủng thành công!', '#22c55e');
      if (onProfileUpdated) onProfileUpdated();
    } else {
      showFeedback('Không đủ tiền xu!', '#ef4444');
      soundEngine.playHitMetal();
    }
  };

  const handleEquipAmmo = (id: SpecialAmmoType) => {
    if (shopManager.equipAmmo(id)) {
      soundEngine.playPowerUp();
      showFeedback('Đã lắp loại đạn mới vào nòng pháo!', '#38bdf8');
      if (onProfileUpdated) onProfileUpdated();
    }
  };

  const handleUpgrade = (category: UpgradeCategory) => {
    if (shopManager.upgrade(category)) {
      showFeedback('Nâng cấp chiến thuật thành công!', '#facc15');
      if (onProfileUpdated) onProfileUpdated();
    } else {
      showFeedback('Không đủ tiền xu hoặc đã đạt cấp tối đa!', '#ef4444');
      soundEngine.playHitMetal();
    }
  };

  const handleBuySupport = (id: SupportItemId) => {
    if (shopManager.buySupportItem(id)) {
      showFeedback('Tiếp tế quân nhu thành công!', '#22c55e');
      if (onProfileUpdated) onProfileUpdated();
    } else {
      showFeedback('Đã đạt giới hạn dự trữ tối đa hoặc không đủ tiền!', '#ef4444');
      soundEngine.playHitMetal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl h-[92vh] sm:h-[86vh] max-h-[820px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header Bar */}
        <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                CỬA HÀNG QUÂN SỰ & XƯỞNG CHIẾN XA
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Nâng cấp vũ khí</span>
                <span aria-hidden="true">·</span>
                <span>Trang bị chiến xa</span>
                <span aria-hidden="true">·</span>
                <span>Tiếp tế chiến trường</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Coin Wallet */}
            <div
              className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-amber-500/40 shadow-inner"
              title={`Tiền xu hiện tại: ${profile.coins.toLocaleString()} xu (Tổng kiếm được: ${profile.totalEarnedCoins.toLocaleString()} xu)`}
            >
              <Coins className="w-4 h-4 text-amber-400 animate-bounce shrink-0" />
              <div className="flex flex-col text-right">
                <span className="font-mono text-sm sm:text-base font-black text-amber-300 tabular-nums leading-none">
                  {profile.coins.toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-500 font-bold uppercase leading-tight tracking-wider">
                  TIỀN XU
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Đóng cửa hàng (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Tab Selector */}
        <div className="shrink-0 flex items-center gap-1.5 px-4 sm:px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('TANKS')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'TANKS'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>CHIẾN XA THIẾT GIÁP ({TANK_CHASSIS_LIST.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('AMMO')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'AMMO'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>KHO ĐẠN ĐẶC CHỦNG ({SPECIAL_AMMO_LIST.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('UPGRADES')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'UPGRADES'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>NÂNG CẤP CHIẾN THUẬT ({UPGRADE_LIST.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SUPPORT')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'SUPPORT'
                ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>QUÂN NHU TÁC CHIẾN ({SUPPORT_ITEMS_LIST.length})</span>
          </button>
        </div>

        {/* Feedback alert banner */}
        {feedbackMsg && (
          <div
            className="shrink-0 px-4 py-2 text-xs font-bold text-center border-b border-slate-800 flex items-center justify-center gap-2 animate-in fade-in"
            style={{ backgroundColor: `${feedbackMsg.color}15`, color: feedbackMsg.color }}
          >
            <Info className="w-3.5 h-3.5" />
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: TANKS */}
          {activeTab === 'TANKS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TANK_CHASSIS_LIST.map((tank) => {
                const isUnlocked = profile.unlockedTanks.includes(tank.id);
                const isEquipped = profile.equippedTank === tank.id;
                const canAfford = profile.coins >= tank.price;

                return (
                  <div
                    key={tank.id}
                    className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all ${
                      isEquipped
                        ? 'bg-slate-950/80 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50'
                        : isUnlocked
                        ? 'bg-slate-950/50 border-slate-700/80 hover:border-slate-600'
                        : 'bg-slate-950/30 border-slate-800 opacity-90'
                    }`}
                  >
                    <div>
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-3">
                          {/* Mini Tank Visual Avatar */}
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center border shadow-inner shrink-0 relative overflow-hidden"
                            style={{ backgroundColor: `${tank.color}20`, borderColor: tank.color }}
                          >
                            {/* Visual representation of tank hull & turret */}
                            <div
                              className="w-7 h-7 rounded-sm border shadow-sm relative flex items-center justify-center"
                              style={{ backgroundColor: tank.color, borderColor: tank.turretColor }}
                            >
                              <div
                                className="w-3.5 h-3.5 rounded-full border"
                                style={{ backgroundColor: tank.turretColor, borderColor: tank.accentColor }}
                              />
                              <div
                                className="absolute -top-2 w-1 h-3 rounded-t-sm"
                                style={{ backgroundColor: tank.turretColor }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-sm text-white">{tank.name}</h3>
                              {isEquipped && (
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/50 px-1.5 py-0.5 rounded">
                                  ĐANG DÙNG
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block">{tank.tagline}</span>
                          </div>
                        </div>

                        {/* Badge */}
                        <span
                          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border whitespace-nowrap"
                          style={{
                            color: tank.accentColor,
                            borderColor: `${tank.accentColor}40`,
                            backgroundColor: `${tank.accentColor}10`,
                          }}
                        >
                          {tank.badge}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                        {tank.description}
                      </p>

                      {/* Core Combat Stats Grid */}
                      <div className="grid grid-cols-4 gap-1.5 p-2 bg-slate-900/80 rounded-lg border border-slate-800 text-[11px] mb-3">
                        <div className="text-center">
                          <span className="text-[10px] text-slate-400 block">ĐỘ BỀN</span>
                          <span className="font-mono font-black text-rose-400">{tank.baseMaxHp} HP</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] text-slate-400 block">TỐC ĐỘ</span>
                          <span className="font-mono font-black text-cyan-400">{tank.baseSpeed} px/s</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] text-slate-400 block">HỒI CHIÊU</span>
                          <span className="font-mono font-black text-amber-400">{tank.baseReload}s</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] text-slate-400 block">SÁT THƯƠNG</span>
                          <span className="font-mono font-black text-emerald-400">
                            {tank.doubleShot ? 'x2 NÒNG' : `${tank.damage} DMG`}
                          </span>
                        </div>
                      </div>

                      {/* Special Trait */}
                      <div className="text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-900/60 p-2 rounded-lg mb-3">
                        <strong className="text-emerald-400 font-bold">Đặc tính: </strong>
                        {tank.specialTrait}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="text-xs">
                        {isUnlocked ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Đã sở hữu
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 font-mono font-black text-amber-300">
                            <Coins className="w-3.5 h-3.5 text-amber-400" />
                            <span>{tank.price.toLocaleString()} xu</span>
                          </div>
                        )}
                      </div>

                      {isEquipped ? (
                        <button
                          disabled
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-700/60 cursor-default"
                        >
                          Đang Xuất Kích
                        </button>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => handleEquipTank(tank.id)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition-colors cursor-pointer"
                        >
                          Trang Bị Ngay
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnlockTank(tank.id)}
                          disabled={!canAfford}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="w-3 h-3" />
                          <span>Mở Khóa ({tank.price} xu)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: SPECIAL AMMO */}
          {activeTab === 'AMMO' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SPECIAL_AMMO_LIST.map((ammo) => {
                const isUnlocked = profile.unlockedAmmo.includes(ammo.id);
                const isEquipped = profile.equippedAmmo === ammo.id;
                const canAfford = profile.coins >= ammo.price;

                return (
                  <div
                    key={ammo.id}
                    className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all ${
                      isEquipped
                        ? 'bg-slate-950/80 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50'
                        : isUnlocked
                        ? 'bg-slate-950/50 border-slate-700/80 hover:border-slate-600'
                        : 'bg-slate-950/30 border-slate-800 opacity-90'
                    }`}
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-3">
                          {/* Visual Bullet Icon */}
                          <div
                            className="w-11 h-11 rounded-lg flex items-center justify-center border shadow-inner shrink-0"
                            style={{ backgroundColor: `${ammo.color}15`, borderColor: ammo.color }}
                          >
                            <div
                              className="w-3.5 h-6 rounded-full border shadow-sm"
                              style={{ backgroundColor: ammo.color, borderColor: ammo.glowColor }}
                            />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-sm text-white">{ammo.name}</h3>
                              {isEquipped && (
                                <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-500/50 px-1.5 py-0.5 rounded">
                                  ĐANG NẠP
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block">{ammo.tagline}</span>
                          </div>
                        </div>

                        <span
                          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border whitespace-nowrap"
                          style={{
                            color: ammo.color,
                            borderColor: `${ammo.color}40`,
                            backgroundColor: `${ammo.color}10`,
                          }}
                        >
                          {ammo.badge}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                        {ammo.description}
                      </p>

                      {/* Modifiers List */}
                      <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-900/80 rounded-lg border border-slate-800 text-[11px] mb-3">
                        <div className="text-center">
                          <span className="text-[10px] text-slate-400 block">SÁT THƯƠNG</span>
                          <span className="font-mono font-black text-rose-400">
                            x{ammo.damageMultiplier}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] text-slate-400 block">VẬN TỐC ĐẠN</span>
                          <span className="font-mono font-black text-cyan-400">
                            x{ammo.bulletSpeedMultiplier}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] text-slate-400 block">XUYÊN THÉP</span>
                          <span className={`font-mono font-black ${ammo.canBreakSteel ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {ammo.canBreakSteel ? 'CÓ (PHÁ THÉP)' : 'KHÔNG'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="text-xs">
                        {isUnlocked ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Đã mở khóa
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 font-mono font-black text-amber-300">
                            <Coins className="w-3.5 h-3.5 text-amber-400" />
                            <span>{ammo.price.toLocaleString()} xu</span>
                          </div>
                        )}
                      </div>

                      {isEquipped ? (
                        <button
                          disabled
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-950/60 text-amber-300 border border-amber-700/60 cursor-default"
                        >
                          Đang Nạp Nòng
                        </button>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => handleEquipAmmo(ammo.id)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition-colors cursor-pointer"
                        >
                          Nạp Loại Đạn Này
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnlockAmmo(ammo.id)}
                          disabled={!canAfford}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="w-3 h-3" />
                          <span>Mở Khóa ({ammo.price} xu)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: UPGRADES */}
          {activeTab === 'UPGRADES' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {UPGRADE_LIST.map((upg) => {
                const currentLevel = profile.upgrades[upg.id] || 0;
                const isMax = currentLevel >= upg.maxLevel;
                const nextCost = isMax ? 0 : upg.costs[currentLevel];
                const canAfford = !isMax && profile.coins >= nextCost;

                return (
                  <div
                    key={upg.id}
                    className="p-4 rounded-xl border border-slate-700/80 bg-slate-950/60 flex flex-col justify-between"
                  >
                    <div>
                      {/* Title & Level Indicator */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl shrink-0">{upg.icon}</span>
                          <div>
                            <h3 className="font-black text-sm text-white">{upg.name}</h3>
                            <span className="text-[11px] text-slate-400 block">{upg.tagline}</span>
                          </div>
                        </div>

                        {/* Level Pips */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: upg.maxLevel }).map((_, idx) => (
                            <span
                              key={idx}
                              className={`w-2.5 h-3.5 rounded-sm transition-all ${
                                idx < currentLevel
                                  ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]'
                                  : 'bg-slate-800 border border-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                        {upg.description}
                      </p>

                      {/* Current Perk & Next Perk */}
                      <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-xs space-y-1 mb-3">
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Cấp hiện tại:</span>
                          <span className="font-bold text-sky-400">
                            {currentLevel > 0 ? upg.perks[currentLevel - 1] : 'Chưa nâng cấp'}
                          </span>
                        </div>
                        {!isMax && (
                          <div className="flex items-center justify-between text-amber-300">
                            <span>Cấp kế tiếp ({currentLevel + 1}):</span>
                            <span className="font-bold">{upg.perks[currentLevel]}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="text-xs">
                        {isMax ? (
                          <span className="text-emerald-400 font-bold">Đạt cấp tối đa (MAX)</span>
                        ) : (
                          <div className="flex items-center gap-1 font-mono font-black text-amber-300">
                            <Coins className="w-3.5 h-3.5 text-amber-400" />
                            <span>{nextCost.toLocaleString()} xu</span>
                          </div>
                        )}
                      </div>

                      {isMax ? (
                        <button
                          disabled
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800 cursor-default"
                        >
                          ĐÃ TỐI ĐA
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpgrade(upg.id)}
                          disabled={!canAfford}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                            canAfford
                              ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-black shadow-md shadow-sky-500/20'
                              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          }`}
                        >
                          <span>Nâng Cấp Lên Cấp {currentLevel + 1}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: SUPPORT ITEMS */}
          {activeTab === 'SUPPORT' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SUPPORT_ITEMS_LIST.map((item) => {
                const currentStock = profile.supportInventory[item.id] || 0;
                const isFull = currentStock >= item.maxStock;
                const canAfford = !isFull && profile.coins >= item.price;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-700/80 bg-slate-950/60 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{item.icon}</span>
                          <div>
                            <h3 className="font-black text-sm text-white">{item.name}</h3>
                            <span className="text-[11px] text-slate-400 block">{item.tagline}</span>
                          </div>
                        </div>

                        {/* Hotkey Tag */}
                        <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-xs font-black text-amber-300">
                          {item.hotkey}
                        </kbd>
                      </div>

                      <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Stock Indicator */}
                      <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg text-xs flex items-center justify-between mb-3">
                        <span className="text-slate-400">Dự trữ sẵn sàng:</span>
                        <span className={`font-mono font-bold ${currentStock > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {currentStock} / {item.maxStock} gói
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-1 font-mono font-black text-xs text-amber-300">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        <span>{item.price.toLocaleString()} xu</span>
                      </div>

                      <button
                        onClick={() => handleBuySupport(item.id)}
                        disabled={isFull || !canAfford}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          isFull
                            ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                            : canAfford
                            ? 'bg-rose-500 hover:bg-rose-400 text-white font-black shadow-md shadow-rose-500/20'
                            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        }`}
                      >
                        {isFull ? 'Đầy Kho' : 'Mua Thêm'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Hint Bar */}
        <footer className="shrink-0 px-4 sm:px-6 py-2.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <span>Tiêu diệt xe tăng địch & bắn thùng nhiên liệu nổ để thu thập tiền xu</span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">Quân nhu kích hoạt nhanh bằng phím tắt B, F, R khi chiến đấu</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </footer>
      </div>
    </div>
  );
}
