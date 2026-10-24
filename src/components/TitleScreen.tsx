import { useEffect, useState } from 'react';
import { GameMode, ControlMode } from '../types/game';
import { Volume2, VolumeX, Play, Shield, Zap, Skull, Crosshair, Compass, Award, BookOpen } from 'lucide-react';
import heroImage from '../assets/images/tank_battle_hero_1792246756619.jpg';

interface TitleScreenProps {
  onStartGame: (mode: GameMode, controlMode: ControlMode, startStage?: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  highScore: number;
  onOpenGuide?: () => void;
}

export function TitleScreen({
  onStartGame,
  isMuted,
  onToggleMute,
  highScore,
  onOpenGuide,
}: TitleScreenProps) {
  const [selectedMode, setSelectedMode] = useState<GameMode>('CAMPAIGN');
  const [controlMode, setControlMode] = useState<ControlMode>('CLASSIC');
  const [stageSelect, setStageSelect] = useState<number>(1);
  const [showStageSelector, setShowStageSelector] = useState(false);

  // Keyboard shortcut: Enter or Space to start immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStartGame(selectedMode, controlMode, stageSelect);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame, selectedMode, controlMode, stageSelect]);

  return (
    <div className="relative w-full h-full min-h-screen bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Background Hero Artwork with measured scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Xe tăng đại chiến chiến trường"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-40 scale-105 transition-transform duration-1000 ease-out"
        />
        {/* Measured dark scrim for 4.5:1 text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-slate-950/60 to-slate-950" />
      </div>

      {/* Top Bar Contract (Clean single row: Title mark - Quick stats - Audio action) */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-semibold">
            BẢN CHIẾN THUẬT 2026
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-xs text-slate-400">ARCADE EDITION</span>
        </div>

        <div className="flex items-center gap-4">
          {highScore > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-mono tabular-nums bg-slate-900/80 border border-slate-800 px-3 py-1 rounded">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>KỶ LỤC: {highScore.toLocaleString()}</span>
            </div>
          )}

          {onOpenGuide && (
            <button
              onClick={onOpenGuide}
              className="flex items-center gap-1.5 text-xs text-emerald-300 hover:text-white bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded transition-colors cursor-pointer"
              title="Xem hướng dẫn chi tiết và tra cứu toàn bộ icon"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>HƯỚNG DẪN & ICON</span>
            </button>
          )}

          <button
            onClick={onToggleMute}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'BẬT ÂM' : 'TẮT ÂM'}</span>
          </button>
        </div>
      </div>

      {/* Center Stage & Bespoke SVG Title Lockup (30-40% negative space) */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-4xl mx-auto px-6 text-center">
        {/* Bespoke inline SVG Title Lockup */}
        <div className="mb-3">
          <svg
            className="w-72 sm:w-96 md:w-[480px] h-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
            viewBox="0 0 500 110"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Base Underglow */}
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
            {/* Tank silhouette in hexagon */}
            <rect x="23" y="32" width="24" height="14" rx="2" fill="#22c55e" />
            <rect x="31" y="24" width="8" height="10" rx="1" fill="#4ade80" />
            <rect x="33" y="16" width="4" height="10" fill="#facc15" />

            {/* Typography */}
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

        <p className="text-slate-300 text-sm max-w-lg mb-8 leading-relaxed">
          Chỉ huy chiến xa bọc thép, phối hợp chiến thuật hỏa lực, bảo vệ sở chỉ huy và tiêu diệt các toán quân AI hung hãn.
        </p>

        {/* Game Mode Selector */}
        <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => {
              setSelectedMode('CAMPAIGN');
              setShowStageSelector(true);
            }}
            className={`p-3 rounded-lg border text-left transition-all ${
              selectedMode === 'CAMPAIGN'
                ? 'bg-emerald-950/60 border-emerald-500/80 text-white shadow-lg shadow-emerald-950/50'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Shield className={`w-4 h-4 ${selectedMode === 'CAMPAIGN' ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="font-bold text-xs uppercase tracking-wide">Chiến Dịch</span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2">
              10 màn chơi chiến dịch từ ngoại ô tới Pháo đài Titan.
            </p>
          </button>

          <button
            onClick={() => {
              setSelectedMode('SURVIVAL');
              setShowStageSelector(false);
            }}
            className={`p-3 rounded-lg border text-left transition-all ${
              selectedMode === 'SURVIVAL'
                ? 'bg-amber-950/60 border-amber-500/80 text-white shadow-lg shadow-amber-950/50'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap className={`w-4 h-4 ${selectedMode === 'SURVIVAL' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span className="font-bold text-xs uppercase tracking-wide">Sinh Tồn</span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2">
              Các đợt địch bất tận với độ khó tăng dần và vật phẩm dồi dào.
            </p>
          </button>

          <button
            onClick={() => {
              setSelectedMode('BOSS_RUSH');
              setShowStageSelector(false);
            }}
            className={`p-3 rounded-lg border text-left transition-all ${
              selectedMode === 'BOSS_RUSH'
                ? 'bg-rose-950/60 border-rose-500/80 text-white shadow-lg shadow-rose-950/50'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Skull className={`w-4 h-4 ${selectedMode === 'BOSS_RUSH' ? 'text-rose-400' : 'text-slate-400'}`} />
              <span className="font-bold text-xs uppercase tracking-wide">Trùm Titan</span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2">
              Đối đầu trực diện với 3 cỗ máy Titan bọc giáp hủy diệt.
            </p>
          </button>
        </div>

        {/* Stage Selector for Campaign */}
        {selectedMode === 'CAMPAIGN' && showStageSelector && (
          <div className="flex items-center gap-2 mb-6 bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-lg text-xs">
            <span className="text-slate-400 font-semibold">Chọn level bắt đầu:</span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => setStageSelect(num)}
                  className={`w-6 h-6 rounded font-mono font-bold transition-colors ${
                    stageSelect === num
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Control Mode Toggle */}
        <div className="flex items-center gap-3 mb-8 bg-slate-900/80 border border-slate-800 p-1.5 rounded-lg text-xs">
          <span className="text-slate-400 pl-2">Kiểu điều khiển:</span>
          <button
            onClick={() => setControlMode('CLASSIC')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-all ${
              controlMode === 'CLASSIC' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Cổ Điển (4 Hướng)</span>
          </button>
          <button
            onClick={() => setControlMode('MOUSE_AIM')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-all ${
              controlMode === 'MOUSE_AIM' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Hiện Đại (Chuột 360°)</span>
          </button>
        </div>

        {/* Primary Start CTA Button */}
        <button
          onClick={() => onStartGame(selectedMode, controlMode, stageSelect)}
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-3.5 text-sm font-bold tracking-wider text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 rounded-lg shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>VÀO TRẬN CHIẾN (ENTER / SPACE)</span>
        </button>
      </div>

      {/* Bottom Flat Control-Hint Line */}
      <div className="relative z-10 py-4 px-6 border-t border-slate-800/80 bg-slate-950/80 text-center text-xs text-slate-400">
        <span>WASD / Phím Mũi Tên: Di chuyển · Space / Chuột: Bắn · <b>Phím U: Nâng Cấp Căn Cứ & Khiên</b> · Esc: Tạm dừng</span>
      </div>
    </div>
  );
}
