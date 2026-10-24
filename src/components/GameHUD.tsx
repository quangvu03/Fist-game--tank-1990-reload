import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  Crosshair,
  Compass,
  Tv,
  Shield,
  Heart,
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
import { GameStats, ControlMode } from '../types/game';

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

  return (
    <header className="w-full flex items-center justify-between gap-1 sm:gap-2 px-2 py-1 bg-slate-900/95 border-b border-slate-800 text-[11px] select-none h-9">
      {/* Group 1: Player HP, Lives, Base Status & Upgrade */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Player Tank HP (Máu xe) */}
        <div
          className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800"
          title={`Máu xe tăng của bạn: ${stats.playerHp}/${stats.playerMaxHp} HP (giảm khi trúng đạn)`}
        >
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span className="text-rose-400 font-bold text-[9px] hidden sm:inline">HP</span>
          <span
            className={`font-mono text-xs font-black ${
              stats.playerHp <= 1 ? 'text-rose-400 animate-pulse' : 'text-rose-200'
            }`}
          >
            {stats.playerHp}/{stats.playerMaxHp}
          </span>
        </div>

        {/* Lives (Mạng sống / Xe dự phòng) */}
        <div
          className="flex items-center gap-1 font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800"
          title={`Mạng dự phòng: Còn ${stats.lives} mạng (mỗi lần bị bắn nổ sẽ mất 1 mạng để hồi sinh)`}
        >
          <Award className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
          <span className="text-emerald-400 font-bold text-[9px] hidden sm:inline">MẠNG</span>
          <span className="font-mono text-xs text-white font-black">{stats.lives}</span>
        </div>

        {/* Player Tank Tier (Cấp pháo xe tăng) */}
        <div
          className="flex items-center gap-0.5 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800"
          title={`Cấp hỏa lực xe tăng: Cấp ${stats.playerTier}/4 (Nhặt ⭐ để nâng cấp súng)`}
        >
          <Zap className="w-3 h-3 text-amber-400 fill-amber-400/20" />
          <span className="text-amber-400 font-bold text-[9px] hidden sm:inline">XE</span>
          <span className="font-mono text-xs text-amber-200 font-black">C{stats.playerTier}</span>
        </div>

        {/* Base Tier & Core HP (Máu Căn Cứ Chỉ Huy) */}
        <div
          className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800"
          title={`Sở chỉ huy Cấp ${stats.baseTier}: ${stats.baseTierName} (${stats.baseHp}/${stats.baseMaxHp} HP). Căn cứ nổ = THUA!`}
        >
          <Castle className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-amber-400 font-bold text-[9px] hidden sm:inline">CĂN CỨ</span>
          <span className="text-amber-300 font-bold text-[10px] sm:hidden">C{stats.baseTier}</span>
          <span
            className={`font-mono text-[10px] font-black px-1 rounded ${
              stats.baseHp <= 1
                ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                : 'text-emerald-400'
            }`}
          >
            {stats.baseHp > 0 ? `${stats.baseHp}/${stats.baseMaxHp}` : 'HỎNG'}
          </span>
        </div>

        {/* Base Shield Forcefield indicator (Màn chắn năng lượng căn cứ) */}
        {stats.baseShieldMaxHp > 0 && (
          <div
            className="flex items-center gap-0.5 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800"
            title={`Màn chắn lực trường căn cứ: ${stats.baseShieldHp}/${stats.baseShieldMaxHp} HP (tự hồi sau 5s không nhận sát thương)`}
          >
            <Shield className="w-3 h-3 text-cyan-400 fill-cyan-400/20" />
            <span className="text-cyan-400 font-bold text-[8.5px] hidden sm:inline">KHIÊN</span>
            <span className="font-mono text-[10px] font-bold text-cyan-300">
              {stats.baseShieldHp}
            </span>
          </div>
        )}

        {/* Upgrade Base Interactive Button (Nút Nâng Cấp Căn Cứ) */}
        {stats.baseTier < 5 ? (
          <button
            onClick={onUpgradeBase}
            title={`Nâng cấp căn cứ lên Cấp ${stats.baseTier + 1} & Phục hồi 100% tường bảo vệ xung quanh (Phím U)`}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight transition-all cursor-pointer ${
              stats.canUpgradeBase
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-sm animate-pulse'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpCircle
              className={`w-3.5 h-3.5 ${stats.canUpgradeBase ? 'text-slate-950' : 'text-amber-400'}`}
            />
            <span className="hidden sm:inline">NÂNG CẤP CC</span>
            <span className="font-mono text-[9px] opacity-90">{stats.baseUpgradeCost}đ</span>
          </button>
        ) : (
          <span className="text-[9px] font-bold text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800 hidden sm:inline">
            ⚡ MAX
          </span>
        )}
      </div>

      {/* Group 2: Stage, Enemies, Score */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Enemies Remaining */}
        <div
          className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800"
          title="Số xe tăng địch còn lại trong màn"
        >
          <Skull className="w-3 h-3 text-rose-400" />
          <span className="text-rose-400 font-bold text-[9px] hidden sm:inline">ĐỊCH</span>
          <span className="font-mono text-xs font-black text-white">{remainingEnemies}</span>
        </div>

        {/* Stage */}
        <div className="text-slate-400 text-[10px] font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
          MÀN <span className="text-white font-mono">{stats.stage}</span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
          <span className="text-[9px] text-slate-400 hidden sm:inline">ĐIỂM</span>
          <span className="font-mono text-xs font-bold text-amber-300 tabular-nums">
            {stats.score.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Group 3: Utility Control Icon Buttons */}
      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
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
            className={`p-1 rounded transition-colors cursor-pointer ${
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
          className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
        >
          {controlMode === 'CLASSIC' ? <Compass className="w-3.5 h-3.5" /> : <Crosshair className="w-3.5 h-3.5 text-emerald-400" />}
        </button>

        {/* CRT Toggle */}
        <button
          onClick={onToggleCrt}
          title={`Hiệu ứng quét CRT retro: ${crtEnabled ? 'Đang bật' : 'Đang tắt'}`}
          className={`p-1 rounded transition-colors cursor-pointer ${
            crtEnabled ? 'text-amber-400 bg-amber-950/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
        </button>

        {/* Guide / Icon Codex Toggle */}
        <button
          onClick={onOpenGuide}
          title="Sổ tay hướng dẫn & Bảng tra cứu biểu tượng (Icon)"
          className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>

        {/* Mute Toggle */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
        </button>

        {/* Pause Toggle */}
        <button
          onClick={onTogglePause}
          title={isPaused ? 'Tiếp tục (P / Esc)' : 'Tạm dừng (P / Esc)'}
          className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
        >
          {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
}

interface GameFooterProps {
  highScore: number;
}

export function GameFooter({ highScore }: GameFooterProps) {
  return (
    <footer className="w-full flex items-center justify-between text-[10px] text-slate-400 px-2.5 py-0.5 bg-slate-900/95 border-t border-slate-800 select-none h-6">
      <span className="truncate">WASD: Di chuyển · Phím Cách: Bắn · <b>U: Nâng Cấp</b> · P: Tạm dừng</span>
      <span className="font-mono tabular-nums text-slate-300 shrink-0 ml-2">
        Kỷ lục: <span className="text-amber-300 font-bold">{highScore.toLocaleString()}</span>
      </span>
    </footer>
  );
}
