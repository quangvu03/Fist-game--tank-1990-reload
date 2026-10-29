import {
  Plane,
  Snowflake,
  Wrench,
} from 'lucide-react';
import { SupportItemId } from '../types/shop';

interface TouchControlsProps {
  onUseSupportItem?: (id: SupportItemId) => void;
  supportInventory?: {
    AIRSTRIKE?: number;
    CRYO_FREEZE?: number;
    REPAIR_KIT?: number;
  };
  className?: string;
  // Kept optional for backward compatibility
  onDirectionInput?: (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT', isHeld: boolean) => void;
  onFireInput?: (isHeld: boolean) => void;
  onUpgradeBase?: () => void;
  canUpgradeBase?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function TouchControls({
  onUseSupportItem,
  supportInventory,
  className = '',
}: TouchControlsProps) {
  if (!onUseSupportItem) return null;

  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none flex items-end justify-end p-3 sm:p-5 z-30 ${className}`}
    >
      {/* DUY NHẤT 3 ICON SỬ DỤNG ITEM CHIẾN THUẬT TRÊN MÀN HÌNH */}
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 bg-slate-950/60 backdrop-blur-sm p-1.5 sm:p-2 rounded-2xl border border-white/15 shadow-2xl shadow-black/80">
        {/* 1. Icon Không Chiến (Phím B) */}
        <button
          type="button"
          onClick={() => onUseSupportItem('AIRSTRIKE')}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onUseSupportItem('AIRSTRIKE');
          }}
          title="Không Chiến: Gọi máy bay ném bom diệt địch toàn bản đồ (Phím B)"
          className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border transition-all active:scale-90 touch-none cursor-pointer shadow-lg ${
            (supportInventory?.AIRSTRIKE ?? 0) > 0
              ? 'bg-gradient-to-br from-rose-600 to-red-700 text-white border-rose-400/80 shadow-rose-950/60'
              : 'bg-slate-900/90 text-slate-500 border-slate-700/60 opacity-60'
          }`}
        >
          <Plane className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow" />
          <span className="absolute -top-1.5 -right-1.5 bg-rose-700 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-white/80 shadow-md">
            {supportInventory?.AIRSTRIKE ?? 0}
          </span>
        </button>

        {/* 2. Icon Đóng Băng (Phím F) */}
        <button
          type="button"
          onClick={() => onUseSupportItem('CRYO_FREEZE')}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onUseSupportItem('CRYO_FREEZE');
          }}
          title="Đóng Băng: Làm tê liệt toàn bộ xe tăng địch trong 8 giây (Phím F)"
          className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border transition-all active:scale-90 touch-none cursor-pointer shadow-lg ${
            (supportInventory?.CRYO_FREEZE ?? 0) > 0
              ? 'bg-gradient-to-br from-sky-500 to-cyan-700 text-white border-sky-300/80 shadow-sky-950/60'
              : 'bg-slate-900/90 text-slate-500 border-slate-700/60 opacity-60'
          }`}
        >
          <Snowflake className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow" />
          <span className="absolute -top-1.5 -right-1.5 bg-sky-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-white/80 shadow-md">
            {supportInventory?.CRYO_FREEZE ?? 0}
          </span>
        </button>

        {/* 3. Icon Cứu Hộ (Phím R) */}
        <button
          type="button"
          onClick={() => onUseSupportItem('REPAIR_KIT')}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onUseSupportItem('REPAIR_KIT');
          }}
          title="Cứu Hộ: Phục hồi ngay lập tức +2 HP cho thân xe (Phím R)"
          className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border transition-all active:scale-90 touch-none cursor-pointer shadow-lg ${
            (supportInventory?.REPAIR_KIT ?? 0) > 0
              ? 'bg-gradient-to-br from-emerald-500 to-green-700 text-white border-emerald-300/80 shadow-emerald-950/60'
              : 'bg-slate-900/90 text-slate-500 border-slate-700/60 opacity-60'
          }`}
        >
          <Wrench className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow" />
          <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-white/80 shadow-md">
            {supportInventory?.REPAIR_KIT ?? 0}
          </span>
        </button>
      </div>
    </div>
  );
}
