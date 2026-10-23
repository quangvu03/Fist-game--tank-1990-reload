import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  Crosshair,
  Compass,
  Tv,
  Shield,
  Award,
  Zap,
  ArrowUpCircle,
  Castle,
  Skull,
  Sun,
  CloudRain,
  Snowflake,
  HelpCircle,
} from 'lucide-react';
import { GameStats, ControlMode, PlayerCombatStats } from '../types/game';

interface GameHUDProps {
  stats: GameStats;
  remainingEnemies: number;
  isPaused: boolean;
  isMuted: boolean;
  controlMode: ControlMode;
  crtEnabled: boolean;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onToggleControlMode: () => void;
  onToggleCrt: () => void;
  onUpgradeBase: () => void;
  onToggleWeather?: () => void;
  onOpenGuide: () => void;
}

export function GameHUD({
  stats,
  remainingEnemies,
  isPaused,
  isMuted,
  controlMode,
  crtEnabled,
  onTogglePause,
  onToggleMute,
  onToggleControlMode,
  onToggleCrt,
  onUpgradeBase,
  onToggleWeather,
  onOpenGuide,
}: GameHUDProps) {
  const isWeatherActive = stats.isWeatherEnabled && stats.weather !== 'CLEAR';
  const combat = stats.combatStats;

  return (
    <header className="w-full flex items-center justify-between gap-1.5 sm:gap-3 px-2 sm:px-3 bg-slate-900/95 border-b border-slate-800 text-[11px] select-none shrink-0 shadow-md h-10">
      {/* Group 1: Tank Lives, Base Status, Shield & Base Upgrade */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 overflow-x-auto scrollbar-none">
        {/* Player Tank Lives (Mạng xe tăng còn lại) */}
        <div
          className="flex items-center gap-1 font-bold bg-slate-950 px-2 py-1 rounded border border-slate-800 shadow-inner shrink-0"
          title={`Số mạng sống còn lại của bạn: Còn ${stats.lives} mạng (bị bắn nổ sẽ mất 1 mạng để hồi sinh)`}
        >
          <Award className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20 shrink-0" />
          <span className="text-emerald-400 font-bold text-[9px] hidden sm:inline">MẠNG</span>
          <span className="font-mono text-xs text-white font-black">{stats.lives}</span>
        </div>

        {/* Base Tier & Core HP */}
        <div
          className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800 shadow-inner shrink-0"
          title={`Sở chỉ huy Cấp ${stats.baseTier}: ${stats.baseTierName} (${stats.baseHp}/${stats.baseMaxHp} HP). Căn cứ nổ = THUA CUỘC!`}
        >
          <Castle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-amber-400 font-bold text-[10px] hidden sm:inline">CĂN CỨ</span>
          <span className="text-amber-300 font-bold text-[10px] sm:hidden">C{stats.baseTier}</span>
          <span
            className={`font-mono text-xs font-black px-1 rounded ${
              stats.baseHp <= 1
                ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                : 'text-emerald-400'
            }`}
          >
            {stats.baseHp > 0 ? `${stats.baseHp}/${stats.baseMaxHp}` : 'HỎNG'}
          </span>
        </div>

        {/* Base Shield Forcefield indicator */}
        {stats.baseShieldMaxHp > 0 && (
          <div
            className="flex items-center gap-1 bg-slate-950 px-1.5 py-1 rounded border border-cyan-900/60 shadow-inner shrink-0"
            title={`Màn chắn lực trường căn cứ: ${stats.baseShieldHp}/${stats.baseShieldMaxHp} HP (tự hồi sau 5s)`}
          >
            <Shield className="w-3 h-3 text-cyan-400 fill-cyan-400/20 shrink-0" />
            <span className="text-cyan-400 font-bold text-[9px] hidden sm:inline">KHIÊN</span>
            <span className="font-mono text-[11px] font-bold text-cyan-300">
              {stats.baseShieldHp}
            </span>
          </div>
        )}

        {/* Upgrade Base Interactive Button */}
        {stats.baseTier < 5 ? (
          <button
            onClick={onUpgradeBase}
            title={`Nâng cấp căn cứ lên Cấp ${stats.baseTier + 1} & Phục hồi 100% tường bảo vệ (Phím U)`}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold tracking-tight transition-all cursor-pointer shadow-sm shrink-0 ${
              stats.canUpgradeBase
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-black animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <ArrowUpCircle
              className={`w-3.5 h-3.5 shrink-0 ${stats.canUpgradeBase ? 'text-slate-950' : 'text-amber-400'}`}
            />
            <span className="font-bold">NÂNG CẤP CC</span>
            <span className={`font-mono text-[9px] px-1 rounded ${stats.canUpgradeBase ? 'bg-slate-950/20 text-slate-950 font-black' : 'text-amber-300'}`}>
              {stats.baseUpgradeCost}đ
            </span>
          </button>
        ) : (
          <span className="text-[9px] font-bold text-cyan-300 px-1.5 py-1 rounded bg-cyan-950/60 border border-cyan-800 shrink-0">
            🏰 MAX CC
          </span>
        )}

        {/* Player Tank Weapon Tier */}
        <div
          className="flex items-center gap-1 bg-slate-950 px-1.5 py-1 rounded border border-slate-800/80 hidden sm:flex shrink-0"
          title={`Cấp hỏa lực xe tăng: Cấp ${stats.playerTier}/4 (${combat?.tierName || 'Pháo Cơ Bản'}). Ăn ⭐ để nâng cấp!`}
        >
          <Zap className="w-3 h-3 text-amber-400 fill-amber-400/20 shrink-0" />
          <span className="text-amber-400 font-bold text-[9px]">XE</span>
          <span className="font-mono text-xs text-amber-200 font-black">C{stats.playerTier}</span>
        </div>
      </div>

      {/* Group 2: Stage, Enemies, Score */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Enemies Remaining */}
        <div
          className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800 shadow-inner"
          title="Số xe tăng địch còn lại trong màn"
        >
          <Skull className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="text-rose-400 font-bold text-[9px] hidden sm:inline">ĐỊCH</span>
          <span className="font-mono text-xs font-black text-white">{remainingEnemies}</span>
        </div>

        {/* Stage */}
        <div className="text-slate-400 text-[10px] font-bold bg-slate-950 px-2 py-1 rounded border border-slate-800">
          MÀN <span className="text-white font-mono font-black">{stats.stage}</span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
          <span className="text-[9px] text-slate-400 hidden sm:inline">ĐIỂM</span>
          <span className="font-mono text-xs font-black text-amber-300 tabular-nums">
            {stats.score.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Group 3: Utility Control Icon Buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Weather Toggle */}
        {onToggleWeather && (
          <button
            onClick={onToggleWeather}
            title={
              !isWeatherActive
                ? 'Thời tiết: TẮT (Bấm để bật Mưa)'
                : stats.weather === 'RAIN'
                ? 'Thời tiết: ĐANG BẬT MƯA (Bấm để đổi Tuyết)'
                : 'Thời tiết: ĐANG BẬT TUYẾT (Bấm để Tắt)'
            }
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              isWeatherActive
                ? 'bg-sky-950/80 text-sky-300 border border-sky-800'
                : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
            }`}
          >
            {!isWeatherActive ? (
              <Sun className="w-3.5 h-3.5" />
            ) : stats.weather === 'RAIN' ? (
              <CloudRain className="w-3.5 h-3.5 text-sky-400" />
            ) : (
              <Snowflake className="w-3.5 h-3.5 text-cyan-300" />
            )}
          </button>
        )}

        {/* Control Mode switch */}
        <button
          onClick={onToggleControlMode}
          title={`Điều khiển: ${controlMode === 'CLASSIC' ? 'Phím WASD (4 hướng)' : 'Chuột 360°'}`}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
        >
          {controlMode === 'CLASSIC' ? <Compass className="w-3.5 h-3.5" /> : <Crosshair className="w-3.5 h-3.5 text-emerald-400" />}
        </button>

        {/* CRT Toggle */}
        <button
          onClick={onToggleCrt}
          title={`Hiệu ứng quét CRT retro: ${crtEnabled ? 'Đang bật' : 'Đang tắt'}`}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            crtEnabled ? 'text-amber-400 bg-amber-950/40 border border-amber-800/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
        </button>

        {/* Guide / Icon Codex Toggle */}
        <button
          onClick={onOpenGuide}
          title="Sổ tay tác chiến & Bảng tra cứu biểu tượng toàn diện (Phím H / Esc)"
          className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>

        {/* Mute Toggle */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
        </button>

        {/* Pause Toggle */}
        <button
          onClick={onTogglePause}
          title={isPaused ? 'Tiếp tục (P / Esc)' : 'Tạm dừng (P / Esc)'}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
        >
          {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
        </button>
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
    <footer className="w-full flex items-center justify-between text-[10px] text-slate-400 px-2.5 py-0.5 bg-slate-900/95 border-t border-slate-800 select-none h-6 shrink-0">
      <div className="flex items-center gap-2 truncate">
        <span className="truncate">WASD: Lái · Cách: Bắn · <b>U: Nâng Cấp CC</b> · P: Tạm dừng</span>
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
