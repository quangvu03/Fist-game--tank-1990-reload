import { useEffect, useState } from 'react';
import { GameMode, ControlMode } from '../types/game';
import { Volume2, VolumeX, Play, Shield, Skull, Compass, Award, BookOpen, Music, Crown } from 'lucide-react';
import heroImage from '../assets/images/tank_battle_hero_1792246756619.jpg';

interface TitleScreenProps {
  onStartGame: (mode: GameMode, controlMode: ControlMode, startStage?: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isMusicMuted?: boolean;
  onToggleMusic?: () => void;
  highScore: number;
  onOpenGuide?: () => void;
}

export function TitleScreen({
  onStartGame,
  isMuted,
  onToggleMute,
  isMusicMuted = false,
  onToggleMusic,
  highScore,
  onOpenGuide,
}: TitleScreenProps) {
  const [selectedMode, setSelectedMode] = useState<GameMode>('CAMPAIGN');
  const [stageSelect, setStageSelect] = useState<number>(1);

  // Keyboard shortcut: Enter or Space to start immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStartGame(selectedMode, 'CLASSIC', stageSelect);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame, selectedMode, stageSelect]);

  const isBossStage = stageSelect === 10 || stageSelect === 20 || stageSelect === 21;
  const bossTitle =
    stageSelect === 10
      ? '👑 BOSS MÀN 10: Chiến Hạm Titan Tối Thượng (14 HP)'
      : stageSelect === 20
      ? '👑 BOSS MÀN 20: Siêu Trùm Pháo Tháp 360° (20 HP - CỰC TRÂU)'
      : stageSelect === 21
      ? '🏆 BOSS MÀN 21: Đại Soái Titan Tối Cao 360° (24 HP - TRÙM CUỐI)'
      : null;

  return (
    <div className="relative w-full h-screen bg-slate-950 text-white flex flex-col overflow-hidden select-none">
      {/* Background Hero Artwork with measured scrim */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={heroImage}
          alt="Xe tăng đại chiến chiến trường"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-35 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-slate-950/65 to-slate-950" />
      </div>

      {/* TOP BAR: Always pinned at the top */}
      <header className="relative z-20 shrink-0 flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-bold">
            XE TĂNG ĐẠI CHIẾN
          </span>
          <span className="text-slate-600 hidden sm:inline">·</span>
          <span className="text-xs text-slate-400 hidden sm:inline font-mono">BẢN TÁC CHIẾN 2026</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {highScore > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-mono tabular-nums bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-lg">
              <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">KỶ LỤC:</span>
              <span>{highScore.toLocaleString()}</span>
            </div>
          )}

          {onOpenGuide && (
            <button
              onClick={onOpenGuide}
              className="flex items-center gap-1.5 text-xs text-emerald-300 hover:text-white bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm shadow-emerald-950"
              title="Xem Sổ Tay Tác Chiến: Chi tiết 3 Siêu Trùm, Xe Truy Sát, Vật phẩm và Địa hình"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold">SỔ TAY</span>
            </button>
          )}

          {onToggleMusic && (
            <button
              onClick={onToggleMusic}
              title={isMusicMuted ? 'Bật nhạc nền sảnh (Phím M)' : 'Tắt nhạc nền sảnh (Phím M)'}
              className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer border ${
                isMusicMuted
                  ? 'bg-rose-950/70 text-rose-300 border-rose-800 hover:bg-rose-900/80'
                  : 'bg-emerald-950/70 text-emerald-300 border-emerald-700 hover:bg-emerald-900/80'
              }`}
            >
              <Music className={`w-3.5 h-3.5 ${!isMusicMuted ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
              <span className="hidden md:inline">{isMusicMuted ? 'NHẠC: TẮT' : 'NHẠC: BẬT'}</span>
            </button>
          )}

          <button
            onClick={onToggleMute}
            title={isMuted ? 'Bật âm thanh hiệu ứng (SFX)' : 'Tắt âm thanh hiệu ứng (SFX)'}
            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer border ${
              isMuted
                ? 'bg-rose-950/70 text-rose-300 border-rose-800 hover:bg-rose-900/80'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border-slate-800'
            }`}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="hidden md:inline">{isMuted ? 'SFX: TẮT' : 'SFX: BẬT'}</span>
          </button>
        </div>
      </header>

      {/* CENTER SCROLLABLE CONTENT: Scrollable so nothing ever clips or gets cut off */}
      <main className="relative z-10 flex-1 overflow-y-auto px-4 py-3 sm:px-6 min-h-0 flex flex-col items-center">
        <div className="w-full max-w-3xl flex flex-col items-center text-center my-auto py-2">
          {/* Bespoke SVG Title Lockup */}
          <div className="mb-2">
            <svg
              className="w-64 sm:w-80 md:w-96 h-auto drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
              viewBox="0 0 500 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="tankTitleGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ade80" />
                  <stop offset="50%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#15803d" />
                </linearGradient>
                <linearGradient id="metalPlate" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>
              </defs>

              {/* Tactical Hexagon Accent Icon */}
              <path
                d="M35 15 L55 27 L55 50 L35 62 L15 50 L15 27 Z"
                fill="#1e293b"
                stroke="#22c55e"
                strokeWidth="2.5"
              />
              <rect x="23" y="32" width="24" height="14" rx="2" fill="#22c55e" />
              <rect x="31" y="24" width="8" height="10" rx="1" fill="#4ade80" />
              <rect x="33" y="16" width="4" height="10" fill="#facc15" />

              <text
                x="75"
                y="52"
                fill="url(#tankTitleGrad)"
                fontSize="38"
                fontWeight="900"
                fontFamily="system-ui, sans-serif"
                letterSpacing="2"
              >
                XE TĂNG ĐẠI CHIẾN
              </text>

              <text
                x="76"
                y="78"
                fill="url(#metalPlate)"
                fontSize="14"
                fontWeight="700"
                fontFamily="ui-monospace, monospace"
                letterSpacing="6"
              >
                TANK BATTLE 1990 REBORN
              </text>
            </svg>
          </div>

          <p className="text-slate-300 text-xs sm:text-sm max-w-lg mb-4 leading-relaxed">
            Chỉ huy chiến xa bọc thép, phối hợp chiến thuật hỏa lực, bảo vệ sở chỉ huy và tiêu diệt các toán quân AI hung hãn.
          </p>

          {/* Game Mode Selector - 3 Chế Độ: Chiến Dịch, Sinh Tồn Mở Rộng, Đấu Trường Trùm */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3.5">
            {/* Chế độ 1: Chiến Dịch */}
            <button
              onClick={() => setSelectedMode('CAMPAIGN')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedMode === 'CAMPAIGN'
                  ? 'bg-gradient-to-br from-emerald-950/90 to-slate-900/90 border-emerald-500 text-white shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500/50'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Shield className={`w-4 h-4 ${selectedMode === 'CAMPAIGN' ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="font-bold text-xs uppercase tracking-wide text-white">
                  Chiến Dịch
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 ml-auto">
                  21 MÀN
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                21 màn liên hoàn. 3 Đại Boss ở Màn 10 (Titan 14 HP), Màn 20 (Trùm 360° 20 HP) và Màn 21 (Đại Soái 24 HP).
              </p>
            </button>

            {/* Chế độ 2: Sinh Tồn Mở Rộng */}
            <button
              onClick={() => setSelectedMode('SURVIVAL')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedMode === 'SURVIVAL'
                  ? 'bg-gradient-to-br from-amber-950/90 to-slate-900/90 border-amber-500 text-white shadow-lg shadow-amber-950/50 ring-1 ring-amber-500/50'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Compass className={`w-4 h-4 ${selectedMode === 'SURVIVAL' ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="font-bold text-xs uppercase tracking-wide text-white">
                  Sinh Tồn Mở Rộng
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 ml-auto">
                  VÔ TẬN
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Chiến trường mở rộng khi đến viền, radar quân sự, tiêu diệt toàn bộ quân địch không cần bảo vệ căn cứ.
              </p>
            </button>

            {/* Chế độ 3: Đấu Trường Trùm */}
            <button
              onClick={() => setSelectedMode('BOSS_RUSH')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedMode === 'BOSS_RUSH'
                  ? 'bg-gradient-to-br from-rose-950/90 to-slate-900/90 border-rose-500 text-white shadow-lg shadow-rose-950/50 ring-1 ring-rose-500/50'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Skull className={`w-4 h-4 ${selectedMode === 'BOSS_RUSH' ? 'text-rose-400' : 'text-slate-400'}`} />
                <span className="font-bold text-xs uppercase tracking-wide text-white">
                  Đấu Trường Trùm
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 ml-auto">
                  BOSS RUSH
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Đối đầu liên tục 3 Đại Boss Titan và Siêu Trùm 360° cùng hộ vệ tinh nhuệ bọc thép hủy diệt.
              </p>
            </button>
          </div>

          {/* Stage Selector for Campaign: Clean, Ergonomic and Space-Efficient */}
          {selectedMode === 'CAMPAIGN' && (
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-inner text-xs mb-2">
              <div className="flex items-center justify-between w-full mb-2 flex-wrap gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-200 font-bold">Chọn Level Xuất Kích:</span>
                  <span className="text-emerald-400 font-mono font-black text-sm bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded">
                    MÀN {stageSelect} / 21
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10.5px] font-mono px-2 py-0.5 rounded border bg-slate-950/70 text-slate-300 border-slate-700">
                    {stageSelect >= 11 ? '🌿 Thảo Nguyên Đồng Cỏ' : '🏭 Khu Quân Sự'}
                  </span>
                  {isBossStage && (
                    <span className="text-[10.5px] font-mono px-2 py-0.5 rounded border bg-rose-950 text-rose-300 border-rose-700 font-bold flex items-center gap-1 animate-pulse">
                      <Crown className="w-3 h-3 text-amber-400" />
                      <span>CÓ SIÊU BOSS</span>
                    </span>
                  )}
                </div>
              </div>

              {/* 21 Level Buttons Grid (7 cols x 3 rows) with Boss Badges */}
              <div className="grid grid-cols-7 sm:grid-cols-7 md:grid-cols-7 gap-1.5 w-full">
                {Array.from({ length: 21 }, (_, i) => i + 1).map((num) => {
                  const isMeadow = num >= 11;
                  const isSelected = stageSelect === num;
                  const isBoss = num === 10 || num === 20 || num === 21;

                  return (
                    <button
                      key={num}
                      onClick={() => setStageSelect(num)}
                      onDoubleClick={() => onStartGame(selectedMode, 'CLASSIC', num)}
                      title={
                        num === 10
                          ? 'Màn 10: Boss Chiến Hạm Titan (14 HP)'
                          : num === 20
                          ? 'Màn 20: Boss Siêu Trùm Pháo Tháp 360° (20 HP - Cực Trâu)'
                          : num === 21
                          ? 'Màn 21: Trùm Cuối Đại Soái Titan 360° (24 HP)'
                          : isMeadow
                          ? `Màn ${num}: Thảo Nguyên Đồng Cỏ Xanh & Đá Hoa Cương`
                          : `Màn ${num}: Khu Quân Sự Đô Thị`
                      }
                      className={`h-8 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center relative ${
                        isSelected
                          ? isBoss
                            ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black shadow-lg shadow-rose-500/40 ring-2 ring-amber-300 scale-105'
                            : isMeadow
                            ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-300 scale-105'
                            : 'bg-sky-500 text-slate-950 font-black shadow-lg shadow-sky-500/40 ring-2 ring-sky-300 scale-105'
                          : isBoss
                          ? 'bg-rose-950/70 text-rose-300 border border-rose-500/60 hover:bg-rose-900/80 hover:text-white'
                          : isMeadow
                          ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-700/40 hover:bg-emerald-900/60 hover:text-white'
                          : 'bg-slate-800/80 text-slate-300 border border-slate-700/50 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <span>{num}</span>
                      {isBoss && (
                        <Crown
                          className={`w-2.5 h-2.5 absolute -top-1 -right-1 ${
                            isSelected ? 'text-yellow-950 fill-yellow-950' : 'text-amber-400 fill-amber-400'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Stage Detail Notice */}
              <div className="flex items-center justify-between w-full text-[10.5px] px-1 mt-2 pt-1.5 border-t border-slate-800/80 text-slate-400">
                {bossTitle ? (
                  <span className="text-amber-300 font-bold flex items-center gap-1">
                    {bossTitle}
                  </span>
                ) : (
                  <span>
                    {stageSelect <= 10
                      ? `Màn ${stageSelect}: Khu Quân Sự & Đô Thị (Chuẩn bị chạm trán Titan ở Màn 10)`
                      : `Màn ${stageSelect}: Thảo Nguyên Đồng Cỏ & Đá Hoa Cương (Chốt chặn Màn 20-21)`}
                  </span>
                )}
                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">Nhấp đúp màn để chơi ngay</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* PINNED BOTTOM ACTION BAR: Guaranteed 100% visible, never clipped or obscured */}
      <footer className="relative z-30 shrink-0 w-full border-t border-slate-800 bg-slate-950/95 backdrop-blur-md px-4 py-2.5 sm:py-3 shadow-[0_-10px_25px_rgba(0,0,0,0.8)]">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status summary */}
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-mono">
              <span className="text-slate-400">Chế độ đang chọn:</span>
              <span className="text-emerald-400 font-bold">
                {selectedMode === 'CAMPAIGN'
                  ? `Chiến Dịch - Màn ${stageSelect}/21`
                  : selectedMode === 'SURVIVAL'
                  ? 'Sinh Tồn Mở Rộng'
                  : 'Đấu Trường Trùm'}
              </span>
              {isBossStage && selectedMode === 'CAMPAIGN' && (
                <span className="text-amber-400 font-black text-[11px] animate-pulse">👑 TRÙM!</span>
              )}
            </div>
            <p className="text-[10.5px] text-slate-400 mt-0.5 hidden sm:block">
              WASD / Phím Mũi Tên: Di chuyển · Space / Chuột: Bắn · <b>Phím U: Nâng cấp căn cứ</b> · Esc: Tạm dừng
            </p>
          </div>

          {/* Primary CTA Button: Prominent, Big, Unmissable */}
          <button
            onClick={() => onStartGame(selectedMode, 'CLASSIC', stageSelect)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3 text-xs sm:text-sm font-black tracking-wider text-slate-950 bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400 hover:from-emerald-300 hover:to-emerald-400 rounded-xl shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0 border border-emerald-300/40"
          >
            <Play className="w-4 h-4 fill-current shrink-0" />
            <span>VÀO TRẬN CHIẾN (ENTER / SPACE)</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
