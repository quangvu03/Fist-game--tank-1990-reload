import { Play, RotateCcw, Home, Volume2, VolumeX, Compass, Crosshair, BookOpen } from 'lucide-react';
import { ControlMode } from '../types/game';

interface PauseModalProps {
  onResume: () => void;
  onRestartStage: () => void;
  onQuitToTitle: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  controlMode: ControlMode;
  onToggleControlMode: () => void;
  onOpenGuide: () => void;
}

export function PauseModal({
  onResume,
  onRestartStage,
  onQuitToTitle,
  isMuted,
  onToggleMute,
  controlMode,
  onToggleControlMode,
  onOpenGuide,
}: PauseModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl text-white text-center">
        {/* Title */}
        <h2 className="text-xl font-bold tracking-wider text-slate-100 mb-1">
          TẠM DỪNG TRẬN ĐẤU
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Trò chơi đang dừng. Bạn có thể thay đổi thiết lập hoặc tiếp tục tác chiến.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 mb-6">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>TIẾP TỤC CHIẾN ĐẤU (P / ESC)</span>
          </button>

          <button
            onClick={onOpenGuide}
            className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-lg transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>HƯỚNG DẪN & TRA CỨU ICON</span>
          </button>

          <button
            onClick={onRestartStage}
            className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>CHƠI LẠI MÀN NÀY</span>
          </button>

          <button
            onClick={onQuitToTitle}
            className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>VỀ MÀN HÌNH CHÍNH</span>
          </button>
        </div>

        {/* Quick Toggles */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs">
          <button
            onClick={onToggleControlMode}
            className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 transition-colors"
          >
            {controlMode === 'CLASSIC' ? <Compass className="w-4 h-4" /> : <Crosshair className="w-4 h-4 text-emerald-400" />}
            <span>{controlMode === 'CLASSIC' ? 'Phím 4 Hướng' : 'Chuột 360°'}</span>
          </button>

          <button
            onClick={onToggleMute}
            className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'Đang tắt âm' : 'Đang bật âm'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
