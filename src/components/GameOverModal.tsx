import { Trophy, Skull, Play, RotateCcw, Home, Award } from 'lucide-react';
import { GameStats } from '../types/game';
import { ENEMY_CONFIGS } from '../game/constants';

interface GameOverModalProps {
  isVictory: boolean;
  isStageClear: boolean;
  hasNextStage: boolean;
  stats: GameStats;
  onNextStage: () => void;
  onRestart: () => void;
  onQuitToTitle: () => void;
}

export function GameOverModal({
  isVictory,
  isStageClear,
  hasNextStage,
  stats,
  onNextStage,
  onRestart,
  onQuitToTitle,
}: GameOverModalProps) {
  const isWon = isVictory || isStageClear;
  const isNewHighScore = stats.score >= stats.highScore && stats.score > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl text-white">
        {/* Banner Status Icon & Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
            isWon ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40' : 'bg-red-950/80 text-red-400 border border-red-500/40'
          }`}>
            {isWon ? <Trophy className="w-6 h-6" /> : <Skull className="w-6 h-6" />}
          </div>

          <h2 className={`text-2xl font-black tracking-wide ${isWon ? 'text-emerald-400' : 'text-red-400'}`}>
            {isVictory
              ? (stats.gameMode === 'CAMPAIGN' ? 'TOÀN THẮNG CHIẾN DỊCH!' : 'CHIẾN THẮNG VANG DỘI!')
              : isStageClear
              ? (stats.gameMode === 'SURVIVAL' ? `SỐNG SÓT ĐỢT ${stats.stage}!` : `VƯỢT QUA LEVEL ${stats.stage}!`)
              : stats.baseHp <= 0
              ? 'SỞ CHỈ HUY BỊ HỦY DIỆT!'
              : 'XE TĂNG BỊ PHÁ HỦY!'}
          </h2>

          <p className="text-xs text-slate-400 mt-1">
            {isWon
              ? (stats.gameMode === 'SURVIVAL'
                  ? `Bạn đã phòng ngự kiên cường và quét sạch toàn bộ quân đoàn địch Đợt ${stats.stage}.`
                  : 'Bạn đã quét sạch toàn bộ lực lượng thiết giáp địch trên chiến trường.')
              : 'Lực lượng của bạn đã cạn kiệt. Hãy tái tập hợp và phản công!'}
          </p>
        </div>

        {/* Score & Record Cluster */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 mb-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>TỔNG ĐIỂM CHIẾN DỊCH</span>
            {isNewHighScore && (
              <span className="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                <Award className="w-3.5 h-3.5" /> KỶ LỤC MỚI!
              </span>
            )}
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums text-amber-300">
            {stats.score.toLocaleString()}
          </div>
        </div>

        {/* Enemy Casualties Breakdown Table */}
        <div className="border border-slate-800/80 rounded-lg overflow-hidden mb-6">
          <div className="bg-slate-950/80 px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
            <span>Loại Chiến Xa Địch</span>
            <span>Tiêu Diệt</span>
          </div>

          <div className="divide-y divide-slate-800/60 bg-slate-900/40 text-xs">
            {(['SCOUT', 'ASSAULT', 'HEAVY', 'ARTILLERY', 'BOSS'] as const).map((type) => {
              const cfg = ENEMY_CONFIGS[type];
              const count = stats.kills[type] || 0;
              return (
                <div key={type} className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: cfg.color }}
                    />
                    <span className="text-slate-300">{cfg.name}</span>
                  </div>
                  <div className="font-mono tabular-nums text-slate-200">
                    <span className="text-slate-400 mr-2">+{count * cfg.scoreValue}</span>
                    <span className="font-bold">x{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Stage Base Upgrade Banner */}
        {isStageClear && hasNextStage && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-2.5 mb-5 text-xs text-emerald-300 flex items-center justify-between">
            <span className="font-semibold flex items-center gap-1.5">
              <span>🏰</span>
              <span>
                {stats.gameMode === 'SURVIVAL'
                  ? `CHIẾN TRƯỜNG MỞ RỘNG (ĐỢT ${stats.stage + 1}):`
                  : `LỚP BẢO VỆ CĂN CỨ LEVEL ${stats.stage + 1}:`}
              </span>
            </span>
            <span className="font-bold text-amber-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-700">
              {stats.stage + 1 >= 9
                ? 'LƯỢNG TỬ (CẤP 5)'
                : stats.stage + 1 >= 7
                ? 'TITANIUM (CẤP 4)'
                : stats.stage + 1 >= 5
                ? 'THÀNH THÉP (CẤP 3)'
                : stats.stage + 1 >= 3
                ? 'BÊ TÔNG (CẤP 2)'
                : 'THÙNG TIẾP TẾ (CẤP 1)'}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          {isStageClear && hasNextStage ? (
            <button
              onClick={onNextStage}
              className="flex items-center justify-center gap-2 w-full py-3 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {stats.gameMode === 'SURVIVAL'
                  ? `TIẾN VÀO ĐỢT TIẾP THEO (ĐỢT ${stats.stage + 1})`
                  : `TIẾN VÀO LEVEL TIẾP THEO (LEVEL ${stats.stage + 1})`}
              </span>
            </button>
          ) : (
            <button
              onClick={onRestart}
              className="flex items-center justify-center gap-2 w-full py-3 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>CHƠI LẠI TRẬN MỚI</span>
            </button>
          )}

          <button
            onClick={onQuitToTitle}
            className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>VỀ MÀN HÌNH CHÍNH</span>
          </button>
        </div>
      </div>
    </div>
  );
}
