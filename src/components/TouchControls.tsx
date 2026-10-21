import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Target } from 'lucide-react';

interface TouchControlsProps {
  onDirectionInput: (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT', isHeld: boolean) => void;
  onFireInput: (isHeld: boolean) => void;
  className?: string;
}

export function TouchControls({ onDirectionInput, onFireInput, className = '' }: TouchControlsProps) {
  return (
    <div className={`w-full flex items-center justify-between select-none ${className}`}>
      {/* Virtual D-Pad */}
      <div className="grid grid-cols-3 grid-rows-3 gap-1 w-28 h-28 sm:w-32 sm:h-32 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 shadow-lg">
        <div />
        <button
          className="flex items-center justify-center bg-slate-800 active:bg-emerald-500 active:text-slate-950 text-slate-200 rounded-md touch-none transition-colors"
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
          <ArrowUp className="w-5 h-5" />
        </button>
        <div />

        <button
          className="flex items-center justify-center bg-slate-800 active:bg-emerald-500 active:text-slate-950 text-slate-200 rounded-md touch-none transition-colors"
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
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="bg-slate-950/60 rounded-md border border-slate-800/40" />
        <button
          className="flex items-center justify-center bg-slate-800 active:bg-emerald-500 active:text-slate-950 text-slate-200 rounded-md touch-none transition-colors"
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
          <ArrowRight className="w-5 h-5" />
        </button>

        <div />
        <button
          className="flex items-center justify-center bg-slate-800 active:bg-emerald-500 active:text-slate-950 text-slate-200 rounded-md touch-none transition-colors"
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
          <ArrowDown className="w-5 h-5" />
        </button>
        <div />
      </div>

      {/* Action Fire Button */}
      <div>
        <button
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600 active:bg-red-500 text-white flex flex-col items-center justify-center border-2 border-red-400 shadow-xl shadow-red-950/50 active:scale-95 transition-transform touch-none"
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
          <Target className="w-6 h-6 sm:w-7 sm:h-7" />
          <span className="text-[10px] font-bold tracking-wider uppercase mt-0.5">BẮN</span>
        </button>
      </div>
    </div>
  );
}
