import {
  Play,
  RotateCcw,
  Home,
  Volume2,
  VolumeX,
  Compass,
  BookOpen,
  Sun,
  CloudRain,
  Snowflake,
  Music,
  Store,
} from 'lucide-react';
import { WeatherType } from '../types/game';

interface PauseModalProps {
  onResume: () => void;
  onRestartStage: () => void;
  onQuitToTitle: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isMusicMuted?: boolean;
  onToggleMusic?: () => void;
  onOpenGuide: () => void;
  onOpenShop?: () => void;
  weather?: WeatherType;
  isWeatherEnabled?: boolean;
  onToggleWeather?: () => void;
}

export function PauseModal({
  onResume,
  onRestartStage,
  onQuitToTitle,
  isMuted,
  onToggleMute,
  isMusicMuted = false,
  onToggleMusic,
  onOpenGuide,
  onOpenShop,
  weather = 'CLEAR',
  isWeatherEnabled = false,
  onToggleWeather,
}: PauseModalProps) {
  const isWeatherActive = isWeatherEnabled && weather !== 'CLEAR';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] text-white text-center">
        {/* Tiêu đề Modal */}
        <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-widest mb-2">
          TRẠNG THÁI DỪNG
        </div>
        <h2 className="text-xl font-black tracking-wide text-white mb-1">
          TẠM DỪNG TRẬN ĐẤU
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          Tác chiến tạm hoãn. Bạn có thể tra cứu thông tin hoặc điều chỉnh thiết lập bên dưới.
        </p>

        {/* Các nút hành động chính */}
        <div className="flex flex-col gap-2.5 mb-5">
          {/* 1. Tiếp tục chơi */}
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 w-full py-3 text-xs font-black text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>TIẾP TỤC CHIẾN ĐẤU (P / ESC)</span>
          </button>

          {/* 2. Cửa hàng quân sự */}
          {onOpenShop && (
            <button
              onClick={onOpenShop}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-[0.98] cursor-pointer"
            >
              <Store className="w-4 h-4" />
              <span>CỬA HÀNG QUÂN SỰ</span>
            </button>
          )}

          {/* 3. Sổ tay tra cứu quân sự */}
          <button
            onClick={onOpenGuide}
            className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-xl transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>SỔ TAY QUÂN SỰ</span>
          </button>

          {/* 3. Chơi lại Level này */}
          <button
            onClick={onRestartStage}
            className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>CHƠI LẠI LEVEL NÀY</span>
          </button>

          {/* 4. Về màn hình chính */}
          <button
            onClick={onQuitToTitle}
            className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>VỀ MÀN HÌNH CHÍNH</span>
          </button>
        </div>

        {/* Khung Thiết Lập Nhanh: Âm Thanh & Thời Tiết & Điều Khiển (Chuyển gọn vào đây) */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs space-y-2.5 text-left">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center border-b border-slate-800/80 pb-1.5">
            THIẾT LẬP TRẬN ĐẤU
          </div>

          {/* Nút Nhạc nền (BGM) */}
          {onToggleMusic && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-300 text-xs">Nhạc nền sảnh chờ (BGM):</span>
              </div>
              <button
                onClick={onToggleMusic}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  isMusicMuted
                    ? 'bg-red-950/60 text-red-400 border border-red-800/80 hover:bg-red-900/60'
                    : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 hover:bg-emerald-900/60'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>{isMusicMuted ? 'ĐANG TẮT' : 'ĐANG BẬT'}</span>
              </button>
            </div>
          )}

          {/* Nút Âm thanh hiệu ứng (SFX) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-slate-300 text-xs">Hiệu ứng âm thanh (SFX):</span>
            </div>
            <button
              onClick={onToggleMute}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                isMuted
                  ? 'bg-red-950/60 text-red-400 border border-red-800/80 hover:bg-red-900/60'
                  : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 hover:bg-emerald-900/60'
              }`}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isMuted ? 'ĐANG TẮT' : 'ĐANG BẬT'}</span>
            </button>
          </div>

          {/* Nút Thời tiết */}
          {onToggleWeather && (
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-xs">Hiệu ứng thời tiết:</span>
              <button
                onClick={onToggleWeather}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  !isWeatherActive
                    ? 'bg-slate-800 text-amber-300 border border-slate-700'
                    : weather === 'RAIN'
                    ? 'bg-sky-950 text-sky-400 border border-sky-800'
                    : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                }`}
              >
                {!isWeatherActive ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>QUANG ĐÃNG (TẮT)</span>
                  </>
                ) : weather === 'RAIN' ? (
                  <>
                    <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                    <span>MƯA NHẸ</span>
                  </>
                ) : (
                  <>
                    <Snowflake className="w-3.5 h-3.5 text-cyan-300" />
                    <span>TUYẾT RƠI</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Kiểu điều khiển */}
          <div className="flex items-center justify-between">
            <span className="text-slate-300 text-xs">Kiểu điều khiển:</span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs bg-slate-800 text-emerald-400 border border-slate-700">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>PHÍM 4 HƯỚNG</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
