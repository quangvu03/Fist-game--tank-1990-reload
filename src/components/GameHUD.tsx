import {
  Pause,
  Play,
  Shield,
  Heart,
  ArrowUpCircle,
  Castle,
  Skull,
  Crosshair,
  Music,
  Coins,
  Store,
  Radio,
  Snowflake,
  Wrench,
  Maximize,
  Minimize,
  Plane,
} from 'lucide-react';
import { GameStats, PlayerCombatStats } from '../types/game';
import { SupportItemId } from '../types/shop';

interface GameHUDProps {
  stats: GameStats;
  remainingEnemies: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onUpgradeBase: () => void;
  isMusicMuted?: boolean;
  onToggleMusic?: () => void;
  onOpenShop?: () => void;
  onUseSupportItem?: (id: SupportItemId) => void;
  isMobileLandscape?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  deviceMode?: 'PC' | 'MOBILE';
  onToggleDeviceMode?: () => void;
}

export function GameHUD({
  stats,
  remainingEnemies,
  isPaused,
  onTogglePause,
  onUpgradeBase,
  isMusicMuted = false,
  onToggleMusic,
  onOpenShop,
  onUseSupportItem,
  isMobileLandscape = false,
  isFullscreen = false,
  onToggleFullscreen,
  deviceMode = 'PC',
  onToggleDeviceMode,
}: GameHUDProps) {
  const isSurvival = stats.gameMode === 'SURVIVAL';

  // 1. CHẾ ĐỘ XOAY NGANG MOBILE: HUD dạng thanh nổi (Floating Pill) bán trong suốt đè lên đỉnh chiến trường, KHÔNG chiếm chiều dọc canvas
  if (isMobileLandscape) {
    return (
      <header className="absolute top-1 inset-x-0 z-30 pointer-events-none flex justify-center px-1 select-none">
        <div className="pointer-events-auto flex items-center gap-1 sm:gap-1.5 bg-slate-950/65 backdrop-blur-[3px] border border-white/15 px-2 py-0.5 rounded-full shadow-lg text-[9.5px] max-w-full overflow-x-auto scrollbar-none">
          {/* Mạng sống */}
          <div
            className="flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded-md bg-rose-950/40 text-rose-300 border border-rose-500/30 shrink-0"
            title={`Còn ${stats.lives} mạng`}
          >
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500 shrink-0" />
            <span className="font-mono text-[10px] font-black">{stats.lives}</span>
          </div>

          {/* Căn cứ */}
          {isSurvival ? (
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-950/50 text-rose-300 border border-rose-600/40 shrink-0"
              title="Sinh Tồn: Không Căn Cứ"
            >
              <Crosshair className="w-3 h-3 text-rose-400 shrink-0" />
              <span className="font-black text-[8.5px] tracking-tight">SINH TỒN</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-900/60 border border-slate-700/60 shrink-0"
              title={`Căn cứ C${stats.baseTier}: ${stats.baseHp}/${stats.baseMaxHp} HP`}
            >
              <Castle className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="text-amber-300 font-bold text-[9px]">C{stats.baseTier}</span>
              <span
                className={`font-mono text-[10px] font-black ${
                  stats.baseHp <= 1 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                }`}
              >
                {stats.baseHp > 0 ? `${stats.baseHp}/${stats.baseMaxHp}` : 'HỎNG'}
              </span>
            </div>
          )}

          {/* Màn chắn nếu có */}
          {!isSurvival && stats.baseShieldMaxHp > 0 && (
            <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-800/60 shrink-0">
              <Shield className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
              <span className="font-mono text-[9px] font-bold text-cyan-300">{stats.baseShieldHp}</span>
            </div>
          )}

          {/* Nâng cấp căn cứ nếu đủ tiền */}
          {!isSurvival && stats.baseTier < 5 && stats.canUpgradeBase && (
            <button
              onClick={onUpgradeBase}
              title={`Nâng cấp căn cứ lên Cấp ${stats.baseTier + 1}`}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer animate-pulse shrink-0"
            >
              <ArrowUpCircle className="w-2.5 h-2.5" />
              <span className="text-[8.5px] font-black uppercase">NÂNG C{stats.baseTier + 1}</span>
            </button>
          )}

          {/* Cấp độ / Đợt */}
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-900/60 border border-slate-700/60 shrink-0">
            <span className="text-emerald-400 font-black text-[9px]">
              {isSurvival ? 'ĐỢT' : 'LV'}
            </span>
            <span className="text-white font-mono font-black text-[10px]">{stats.stage}</span>
          </div>

          {/* Địch còn lại */}
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-900/60 border border-slate-700/60 shrink-0">
            <Skull className="w-3 h-3 text-rose-400 shrink-0" />
            <span className="font-mono text-[10px] font-black text-white">{remainingEnemies}</span>
          </div>

          {/* Điểm số */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-950/40 border border-amber-600/40 shrink-0">
            <span className="font-mono text-[10px] font-black text-amber-300 tabular-nums">
              {stats.score.toLocaleString()}
            </span>
          </div>

          {/* Tiền xu nhặt được trong ván này */}
          <div
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-yellow-950/40 border border-yellow-600/40 shrink-0"
            title="Tiền xu thu thập được trong ván đấu này"
          >
            <Coins className="w-3 h-3 text-yellow-400 shrink-0" />
            <span className="font-mono text-[10px] font-black text-yellow-300 tabular-nums">
              +{(stats.stageCoins || 0).toLocaleString()}
            </span>
          </div>

          {/* Tạm dừng */}
          <button
            onClick={onTogglePause}
            title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
            className={`flex items-center justify-center w-6 h-6 rounded-md transition-all cursor-pointer border shrink-0 ${
              isPaused
                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
          </button>
        </div>
      </header>
    );
  }

  // 2. CHẾ ĐỘ MÁY TÍNH / MÀN HÌNH CHỮ NHẬT LỚN: Header chuẩn đầy đủ
  return (
    <header className="w-full bg-slate-900/95 border-b border-slate-800 text-[11px] select-none shrink-0 shadow-md">
      {/* THANH TRẠNG THÁI TRÊN: TOÀN BỘ CÁC THÔNG SỐ CĂN GIỮA ĐẸP MẮT */}
      <div className="w-full flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 h-10 overflow-x-auto scrollbar-none">
        {/* 1. Mạng sống (Lives - Trái Tim Đỏ) */}
        <div
          className="flex items-center gap-1 font-bold bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 shadow-inner shrink-0"
          title={`Số mạng sống còn lại: Còn ${stats.lives} mạng`}
        >
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0" />
          <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">MẠNG</span>
          <span className="font-mono text-xs text-white font-black">{stats.lives}</span>
        </div>

        {/* Chế độ Sinh Tồn: Không có Căn Cứ Chủ */}
        {isSurvival ? (
          <div
            className="flex items-center gap-1.5 bg-rose-950/60 border border-rose-500/50 px-2.5 py-1 rounded-lg shadow-inner shrink-0"
            title="Chế độ Sinh Tồn: Bản đồ rộng lớn mở rộng khi đến gần viền, không có căn cứ. Tiêu diệt toàn bộ xe tăng địch để chiến thắng!"
          >
            <Crosshair className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-pulse" />
            <span className="text-rose-300 font-black text-[9.5px] uppercase tracking-tight">
              SINH TỒN: KHÔNG CĂN CỨ
            </span>
          </div>
        ) : (
          <>
            {/* 2. Căn cứ chỉ huy */}
            <div
              className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 shadow-inner shrink-0"
              title={`Sở chỉ huy Cấp ${stats.baseTier}: ${stats.baseTierName} (${stats.baseHp}/${stats.baseMaxHp} HP)`}
            >
              <Castle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-amber-300 font-bold text-[10px]">C{stats.baseTier}</span>
              <span
                className={`font-mono text-xs font-black ${
                  stats.baseHp <= 1 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                }`}
              >
                {stats.baseHp > 0 ? `${stats.baseHp}/${stats.baseMaxHp}` : 'HỎNG'}
              </span>
            </div>

            {/* 3. Màn chắn lực trường căn cứ */}
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

          </>
        )}

        {/* Vạch ngăn cách */}
        <div className="h-4 w-px bg-slate-800 mx-0.5 hidden sm:block shrink-0" />

        {/* 7.5. TIỀN XU NHẶT TRONG VÁN NÀY */}
        <div
          className="flex items-center gap-1.5 bg-yellow-950/50 border border-yellow-500/60 px-2.5 py-1 rounded-lg shadow-inner shrink-0"
          title={`Tiền xu nhặt được trong ván này: ${(stats.stageCoins || 0).toLocaleString()} xu (Tiền tổng xem ngoài sảnh)`}
        >
          <Coins className="w-3.5 h-3.5 text-yellow-400 shrink-0 animate-pulse" />
          <span className="text-[9px] font-black text-yellow-400">VÁN NÀY:</span>
          <span className="font-mono text-xs font-black text-yellow-300 tabular-nums">
            +{(stats.stageCoins || 0).toLocaleString()}
          </span>
        </div>

        {/* Vạch ngăn cách */}
        <div className="h-4 w-px bg-slate-800 mx-0.5 hidden sm:block shrink-0" />

        {/* 8. DUY NHẤT 3 NÚT TÁC CHIẾN TRÊN CHẾ ĐỘ PC: KHÔNG CHIẾN, ĐÓNG BĂNG, CỨU HỘ */}
        {onUseSupportItem && stats.supportInventory && (
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 1. Nút Không Chiến (Phím B) */}
            <button
              onClick={() => onUseSupportItem('AIRSTRIKE')}
              disabled={(stats.supportInventory.AIRSTRIKE || 0) <= 0}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide border transition-all cursor-pointer shrink-0 shadow-sm ${
                (stats.supportInventory.AIRSTRIKE || 0) > 0
                  ? 'bg-rose-950/90 text-rose-200 border-rose-600/80 hover:bg-rose-900 hover:text-white hover:border-rose-400 active:scale-95 shadow-[0_0_12px_rgba(225,29,72,0.4)]'
                  : 'bg-slate-950/80 text-slate-500 border-slate-800 cursor-not-allowed opacity-50'
              }`}
              title="Không chiến: Gọi máy bay dải bom toàn bộ xe tăng địch (Phím B)"
            >
              <Plane className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Không Chiến</span>
              <span className="px-1 py-0.2 rounded bg-rose-500/25 text-rose-300 font-mono text-[9px] border border-rose-500/30">
                [B]
              </span>
              <span className="font-mono font-black text-white px-1.5 py-0.2 bg-slate-950/90 rounded border border-slate-700">
                {stats.supportInventory.AIRSTRIKE || 0}
              </span>
            </button>

            {/* 2. Nút Đóng Băng (Phím F) */}
            <button
              onClick={() => onUseSupportItem('CRYO_FREEZE')}
              disabled={(stats.supportInventory.CRYO_FREEZE || 0) <= 0}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide border transition-all cursor-pointer shrink-0 shadow-sm ${
                (stats.supportInventory.CRYO_FREEZE || 0) > 0
                  ? 'bg-sky-950/90 text-sky-200 border-sky-600/80 hover:bg-sky-900 hover:text-white hover:border-sky-400 active:scale-95 shadow-[0_0_12px_rgba(2,132,199,0.4)]'
                  : 'bg-slate-950/80 text-slate-500 border-slate-800 cursor-not-allowed opacity-50'
              }`}
              title="Đóng băng: Làm tê liệt toàn bộ xe tăng địch trong 8 giây (Phím F)"
            >
              <Snowflake className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Đóng Băng</span>
              <span className="px-1 py-0.2 rounded bg-sky-500/25 text-sky-300 font-mono text-[9px] border border-sky-500/30">
                [F]
              </span>
              <span className="font-mono font-black text-white px-1.5 py-0.2 bg-slate-950/90 rounded border border-slate-700">
                {stats.supportInventory.CRYO_FREEZE || 0}
              </span>
            </button>

            {/* 3. Nút Cứu Hộ (Phím R) */}
            <button
              onClick={() => onUseSupportItem('REPAIR_KIT')}
              disabled={(stats.supportInventory.REPAIR_KIT || 0) <= 0}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide border transition-all cursor-pointer shrink-0 shadow-sm ${
                (stats.supportInventory.REPAIR_KIT || 0) > 0
                  ? 'bg-emerald-950/90 text-emerald-200 border-emerald-600/80 hover:bg-emerald-900 hover:text-white hover:border-emerald-400 active:scale-95 shadow-[0_0_12px_rgba(5,150,105,0.4)]'
                  : 'bg-slate-950/80 text-slate-500 border-slate-800 cursor-not-allowed opacity-50'
              }`}
              title="Cứu hộ: Sửa chữa và phục hồi thân xe khẩn cấp +2 HP (Phím R)"
            >
              <Wrench className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Cứu Hộ</span>
              <span className="px-1 py-0.2 rounded bg-emerald-500/25 text-emerald-300 font-mono text-[9px] border border-emerald-500/30">
                [R]
              </span>
              <span className="font-mono font-black text-white px-1.5 py-0.2 bg-slate-950/90 rounded border border-slate-700">
                {stats.supportInventory.REPAIR_KIT || 0}
              </span>
            </button>
          </div>
        )}
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
    <footer className="w-full bg-slate-900/95 border-t border-slate-800 text-[9px] sm:text-[10px] text-slate-400 px-2 sm:px-3 py-0.5 sm:py-1 select-none shrink-0 shadow-md">
      {/* THANH TRẠNG THÁI DƯỚI: THÔNG SỐ TÁC CHIẾN & PHÍM TẮT CĂN GIỮA */}
      <div className="w-full flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-4 gap-y-0.5 text-center">
        {combatStats && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span>
              Tốc độ: <b className="text-amber-300 font-mono">{combatStats.speed}</b>
            </span>
            <span>·</span>
            <span>
              Bắn: <b className="text-orange-300 font-mono">{combatStats.fireRate}/s</b>
            </span>
            <span>·</span>
            <span>
              Đạn: <b className="text-cyan-300 font-mono">{combatStats.bulletSpeed}</b>
            </span>
          </div>
        )}

        <div className="hidden sm:flex items-center gap-2 border-slate-700 sm:border-l sm:pl-3">
          <span>WASD: Di chuyển · Space: Bắn · <b>B: Không Chiến</b> · <b>F: Đóng Băng</b> · <b>R: Cứu Hộ</b> · <b>U: Căn Cứ</b> · <b>P/Esc: Tạm Dừng</b> · <b>M: Nhạc</b></span>
          <span>·</span>
          <span>
            Kỷ lục: <b className="text-amber-300 font-mono">{highScore.toLocaleString()}</b>
          </span>
        </div>
      </div>
    </footer>
  );
}
