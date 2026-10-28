import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Target,
  Radio,
  Snowflake,
  Wrench,
  Castle,
  Maximize,
  Minimize,
} from 'lucide-react';
import { SupportItemId } from '../types/shop';

interface TouchControlsProps {
  onDirectionInput: (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT', isHeld: boolean) => void;
  onFireInput: (isHeld: boolean) => void;
  onUseSupportItem?: (id: SupportItemId) => void;
  onUpgradeBase?: () => void;
  canUpgradeBase?: boolean;
  supportInventory?: {
    AIRSTRIKE?: number;
    CRYO_FREEZE?: number;
    REPAIR_KIT?: number;
  };
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  className?: string;
}

export function TouchControls({
  onDirectionInput,
  onFireInput,
  onUseSupportItem,
  onUpgradeBase,
  canUpgradeBase = false,
  supportInventory,
  isFullscreen = false,
  onToggleFullscreen,
  className = '',
}: TouchControlsProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none flex items-end justify-between p-2 sm:p-3.5 z-20 ${className}`}
    >
      {/* Cụm điều hướng ảo góc dưới bên trái (D-Pad siêu gọn, trong suốt, đè lên chiến trường) */}
      <div className="pointer-events-auto flex flex-col items-start gap-1.5">
        {/* Nút Toàn màn hình tiện lợi trên di động nếu có */}
        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            className="w-7 h-7 rounded-lg bg-slate-950/50 backdrop-blur-xs border border-white/15 text-slate-300 hover:text-white flex items-center justify-center active:scale-95 transition-all shadow-md"
          >
            {isFullscreen ? (
              <Minimize className="w-3.5 h-3.5" />
            ) : (
              <Maximize className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        <div className="grid grid-cols-3 grid-rows-3 gap-0.5 sm:gap-1 w-20 h-20 sm:w-24 sm:h-24 bg-slate-950/45 backdrop-blur-[2px] p-1 rounded-2xl border border-white/15 shadow-xl shadow-black/60">
          <div />
          <button
            type="button"
            className="flex items-center justify-center bg-slate-800/60 active:bg-emerald-500 active:text-slate-950 text-slate-200 rounded-lg touch-none transition-colors border border-white/10 shadow-sm"
            onTouchStart={(e) => {
              e.preventDefault();
              onDirectionInput('UP', true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onDirectionInput('UP', false);
            }}
            onMouseDown={() => onDirectionInput('UP', true)}
            onMouseUp={() => onDirectionInput('UP', false)}
            aria-label="Lên"
          >
            <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <div />

          <button
            type="button"
            className="flex items-center justify-center bg-slate-800/60 active:bg-emerald-500 active:text-slate-950 text-slate-200 rounded-lg touch-none transition-colors border border-white/10 shadow-sm"
            onTouchStart={(e) => {
              e.preventDefault();
              onDirectionInput('LEFT', true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onDirectionInput('LEFT', false);
            }}
            onMouseDown={() => onDirectionInput('LEFT', true)}
            onMouseUp={() => onDirectionInput('LEFT', false)}
            aria-label="Trái"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <div className="bg-slate-900/40 rounded-md border border-white/5 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-500/50" />
          </div>
          <button
            type="button"
            className="flex items-center justify-center bg-slate-800/60 active:bg-emerald-500 active:text-slate-950 text-slate-200 rounded-lg touch-none transition-colors border border-white/10 shadow-sm"
            onTouchStart={(e) => {
              e.preventDefault();
              onDirectionInput('RIGHT', true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onDirectionInput('RIGHT', false);
            }}
            onMouseDown={() => onDirectionInput('RIGHT', true)}
            onMouseUp={() => onDirectionInput('RIGHT', false)}
            aria-label="Phải"
          >
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <div />
          <button
            type="button"
            className="flex items-center justify-center bg-slate-800/60 active:bg-emerald-500 active:text-slate-950 text-slate-200 rounded-lg touch-none transition-colors border border-white/10 shadow-sm"
            onTouchStart={(e) => {
              e.preventDefault();
              onDirectionInput('DOWN', true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onDirectionInput('DOWN', false);
            }}
            onMouseDown={() => onDirectionInput('DOWN', true)}
            onMouseUp={() => onDirectionInput('DOWN', false)}
            aria-label="Xuống"
          >
            <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <div />
        </div>
      </div>

      {/* Cụm nút tác chiến & Nút Bắn pháo góc dưới bên phải (nhỏ gọn, bán trong suốt) */}
      <div className="pointer-events-auto flex items-end gap-1.5 sm:gap-2.5">
        {/* Nút vật phẩm hỗ trợ quân nhu nhỏ gọn (Không Kích B, Băng Phong F, Hồi Máu R, Nâng Cấp Căn Cứ U) */}
        {onUseSupportItem && (
          <div className="flex flex-col gap-1 mb-0.5">
            {/* Không kích (B) */}
            <button
              type="button"
              onClick={() => onUseSupportItem('AIRSTRIKE')}
              title="Phím B: Không Kích Chiến Lược"
              className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-600/60 active:bg-orange-500/90 text-white flex items-center justify-center border border-orange-400/40 shadow-md backdrop-blur-[2px] active:scale-95 transition-transform touch-none"
            >
              <Radio className="w-3.5 h-3.5" />
              {supportInventory && (supportInventory.AIRSTRIKE ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[7.5px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white/40">
                  {supportInventory.AIRSTRIKE}
                </span>
              )}
            </button>

            {/* Băng phong (F) */}
            <button
              type="button"
              onClick={() => onUseSupportItem('CRYO_FREEZE')}
              title="Phím F: Băng Phong Đóng Băng"
              className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-600/60 active:bg-cyan-500/90 text-white flex items-center justify-center border border-cyan-400/40 shadow-md backdrop-blur-[2px] active:scale-95 transition-transform touch-none"
            >
              <Snowflake className="w-3.5 h-3.5" />
              {supportInventory && (supportInventory.CRYO_FREEZE ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 bg-cyan-600 text-white text-[7.5px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white/40">
                  {supportInventory.CRYO_FREEZE}
                </span>
              )}
            </button>

            {/* Cứu hộ (R) */}
            <button
              type="button"
              onClick={() => onUseSupportItem('REPAIR_KIT')}
              title="Phím R: Cứu Hộ Khẩn Cấp"
              className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-600/60 active:bg-emerald-500/90 text-white flex items-center justify-center border border-emerald-400/40 shadow-md backdrop-blur-[2px] active:scale-95 transition-transform touch-none"
            >
              <Wrench className="w-3.5 h-3.5" />
              {supportInventory && (supportInventory.REPAIR_KIT ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[7.5px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white/40">
                  {supportInventory.REPAIR_KIT}
                </span>
              )}
            </button>

            {/* Nâng cấp căn cứ khẩn cấp nếu có thể */}
            {canUpgradeBase && onUpgradeBase && (
              <button
                type="button"
                onClick={onUpgradeBase}
                title="Phím U: Nâng Cấp Căn Cứ"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/80 active:bg-amber-400 text-slate-950 flex items-center justify-center border border-amber-300 shadow-md active:scale-95 transition-transform animate-pulse touch-none"
              >
                <Castle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Nút BẮN PHÁO CHÍNH: Thiết kế nhỏ gọn (w-13 h-13 / ~52px), bán trong suốt đè lên chiến trường không cản tầm nhìn */}
        <button
          type="button"
          className="w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-gradient-to-br from-red-600/60 to-rose-700/65 active:from-red-600/95 active:to-rose-800/95 text-white flex flex-col items-center justify-center border border-red-300/50 shadow-xl shadow-rose-950/60 backdrop-blur-[2px] active:scale-95 transition-transform touch-none cursor-pointer"
          onTouchStart={(e) => {
            e.preventDefault();
            onFireInput(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onFireInput(false);
          }}
          onMouseDown={() => onFireInput(true)}
          onMouseUp={() => onFireInput(false)}
          aria-label="Bắn pháo"
        >
          <Target className="w-5 h-5 sm:w-5.5 sm:h-5.5 drop-shadow text-white" />
          <span className="text-[8px] sm:text-[9px] font-black tracking-wider uppercase mt-0.5 drop-shadow leading-none">
            BẮN
          </span>
        </button>
      </div>
    </div>
  );
}
