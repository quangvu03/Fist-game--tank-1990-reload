import {
  Pause,
  Play,
  Shield,
  Heart,
  ArrowUpCircle,
  Castle,
  Skull,
  Maximize2,
} from 'lucide-react';
import { GameStats, PlayerCombatStats } from '../types/game';

interface GameHUDProps {
  stats: GameStats;
  remainingEnemies: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onUpgradeBase: () => void;
  onCycleZoom?: () => void;
}

export function GameHUD({
  stats,
  remainingEnemies,
  isPaused,
  onTogglePause,
  onUpgradeBase,
  onCycleZoom,
}: GameHUDProps) {
  return (
    <header className="w-full bg-slate-900/95 border-b border-slate-800 text-[11px] select-none shrink-0 shadow-md">
      <div className="w-full flex items-center justify-between gap-1 sm:gap-2 px-2 sm:px-3 h-10 overflow-hidden">
        {/* Section 1 (Left): Vitals - Mạng & Căn cứ & Chữ 'NÂNG CẤP CĂN CỨ' rõ ràng nhưng nhỏ */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Player Tank Lives (Mạng sống - Hình Trái Tim Đỏ) */}
          <div
            className="flex items-center gap-1 font-bold bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 shadow-inner shrink-0"
            title={`Số mạng sống còn lại: Còn ${stats.lives} mạng`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0" />
            <span className="font-mono text-xs text-white font-black">{stats.lives}</span>
          </div>

          {/* Base Tier & Core HP */}
          <div
            className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 shadow-inner shrink-0"
            title={`Sở chỉ huy Cấp ${stats.baseTier}: ${stats.baseTierName} (${stats.baseHp}/${stats.baseMaxHp} HP)`}
          >
            <Castle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-amber-300 font-bold text-[10px]">C{stats.baseTier}</span>
            <span
              className={`font-mono text-xs font-black ${
                stats.baseHp <= 1
                  ? 'text-rose-400 animate-pulse'
                  : 'text-emerald-400'
              }`}
            >
              {stats.baseHp > 0 ? `${stats.baseHp}/${stats.baseMaxHp}` : 'HỎNG'}
            </span>
          </div>

          {/* Base Shield Forcefield indicator (only when shield exists) */}
          {stats.baseShieldMaxHp > 0 && (
            <div
              className="flex items-center gap-0.5 bg-slate-950 px-1.5 py-1 rounded-lg border border-cyan-900/70 shadow-inner shrink-0"
              title={`Màn chắn căn cứ: ${stats.baseShieldHp}/${stats.baseShieldMaxHp} HP`}
            >
              <Shield className="w-3 h-3 text-cyan-400 fill-cyan-400/20 shrink-0" />
              <span className="font-mono text-[10px] font-bold text-cyan-300">
                {stats.baseShieldHp}
              </span>
            </div>
          )}

          {/* NÚT NÂNG CẤP CĂN CỨ: HIỂN THỊ RÕ RÀNG CHỮ ĐẦY ĐỦ NHƯNG FONT NHỎ TINH TẾ */}
          {stats.baseTier < 5 ? (
            <button
              onClick={onUpgradeBase}
              title={`Nâng cấp căn cứ lên Cấp ${stats.baseTier + 1} & Phục hồi tường phòng thủ (Phím U)`}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg font-bold tracking-tight transition-all cursor-pointer shadow-sm shrink-0 ${
                stats.canUpgradeBase
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-black animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                  : 'bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              <ArrowUpCircle
                className={`w-3.5 h-3.5 shrink-0 ${stats.canUpgradeBase ? 'text-slate-950' : 'text-amber-400'}`}
              />
              <span className="font-black text-[9px] uppercase tracking-tight whitespace-nowrap">
                NÂNG CẤP CĂN CỨ
              </span>
              <span
                className={`font-mono text-[9px] px-1 py-0.2 rounded font-black ${
                  stats.canUpgradeBase ? 'bg-slate-950/20 text-slate-950' : 'text-amber-300 bg-slate-950/40'
                }`}
              >
                {stats.baseUpgradeCost}đ
              </span>
            </button>
          ) : (
            <span className="text-[9px] font-black text-cyan-300 px-2 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800 shrink-0 tracking-tight uppercase">
              CĂN CỨ TỐI ĐA
            </span>
          )}
        </div>

        {/* Section 2 (Center): LEVEL & ENEMIES & SCORE */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* LEVEL BADGE (Đã đổi MÀN -> LEVEL) */}
          <div
            className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 shadow-inner shrink-0"
            title={`Cấp độ màn chơi: Level ${stats.stage}`}
          >
            <span className="text-[10px] font-black text-emerald-400 tracking-wider">LEVEL</span>
            <span className="text-white font-mono font-black text-xs">{stats.stage}</span>
          </div>

          {/* Enemies Remaining */}
          <div
            className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 shadow-inner shrink-0"
            title="Số xe tăng địch còn lại"
          >
            <Skull className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="font-mono text-xs font-black text-white">{remainingEnemies}</span>
          </div>

          {/* SCORE - HERO COMPONENT */}
          <div
            className="flex items-center gap-1 bg-amber-950/40 border border-amber-500/60 px-2.5 py-1 rounded-lg shadow-inner shrink-0"
            title="Điểm số chiến đấu"
          >
            <span className="text-[9px] font-black text-amber-400">ĐIỂM</span>
            <span className="font-mono text-xs sm:text-sm font-black text-amber-300 tabular-nums">
              {stats.score.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Section 3 (Right): NÚT PHÓNG TO MAP & TẠM DỪNG */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Nút Phóng to / Thu nhỏ tỉ lệ Map */}
          {onCycleZoom && (
            <button
              onClick={onCycleZoom}
              title={`Đổi tỉ lệ hiển thị map: 100% -> 115% -> 130% (Phím tắt Z)`}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer shadow-sm shrink-0"
            >
              <Maximize2 className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="font-mono text-cyan-300 font-black">{Math.round((stats.zoom || 1.15) * 100)}%</span>
            </button>
          )}

          <button
            onClick={onTogglePause}
            title={isPaused ? 'Tiếp tục trận đấu (Phím P hoặc Esc)' : 'Tạm dừng trận đấu & Cài đặt (Phím P hoặc Esc)'}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide transition-all cursor-pointer shadow-sm border ${
              isPaused
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 hover:bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700'
            }`}
          >
            {isPaused ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>TIẾP TỤC</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>TẠM DỪNG</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

interface GameFooterProps {
  highScore: number;
  combatStats?: PlayerCombatStats;
}

export function GameFooter({ highScore, combatStats }: GameFooterProps) {
  return (
    <footer className="w-full flex items-center justify-between text-[10px] text-slate-400 px-3 py-1 bg-slate-900/95 border-t border-slate-800 select-none h-6.5 shrink-0">
      <div className="flex items-center gap-2 truncate">
        <span className="truncate">WASD: Lái · Space: Bắn · <b>U: Nâng Cấp Căn Cứ</b> · <b>Z: Phóng To Map</b> · <b>P: Tạm dừng</b></span>
        {combatStats && (
          <span className="text-slate-400 hidden lg:inline border-l border-slate-700 pl-2">
            Tốc chạy: <b className="text-amber-300 font-mono">{combatStats.speed} px/s</b> · Tốc bắn: <b className="text-orange-300 font-mono">{combatStats.fireRate}/s</b> · Tốc đạn: <b className="text-cyan-300 font-mono">{combatStats.bulletSpeed} px/s</b>
          </span>
        )}
      </div>
      <span className="font-mono tabular-nums text-slate-300 shrink-0 ml-2">
        Kỷ lục: <span className="text-amber-300 font-bold">{highScore.toLocaleString()}</span>
      </span>
    </footer>
  );
}
