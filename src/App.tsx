import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { GameMode, GameStatus, ControlMode, GameStats, StageConfig } from './types/game';
import { CAMPAIGN_STAGES, generateSurvivalStage, generateBossRushStage } from './game/stages';
import { CANVAS_SIZE } from './game/constants';
import { soundEngine } from './audio/soundEngine';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD, GameFooter } from './components/GameHUD';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { TouchControls } from './components/TouchControls';
import { GameGuideModal } from './components/GameGuideModal';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // High level UI states
  const [gameStatus, setGameStatus] = useState<GameStatus>('TITLE');
  const [gameMode, setGameMode] = useState<GameMode>('CAMPAIGN');
  const [controlMode, setControlMode] = useState<ControlMode>('CLASSIC');
  const [crtEnabled, setCrtEnabled] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEngine.getMuted());
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [currentStageConfig, setCurrentStageConfig] = useState<StageConfig>(CAMPAIGN_STAGES[0]);

  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    lives: 3,
    playerHp: 3,
    playerMaxHp: 3,
    playerTier: 1,
    stage: 1,
    totalStages: 10,
    kills: { SCOUT: 0, ASSAULT: 0, HEAVY: 0, ARTILLERY: 0, BOSS: 0 },
    totalKills: 0,
    baseHp: 2,
    baseMaxHp: 2,
    baseTier: 1,
    baseTierName: 'Căn Cứ Gạch Thường',
    baseShieldHp: 0,
    baseShieldMaxHp: 0,
    baseShieldActive: false,
    baseUpgradeCost: 800,
    canUpgradeBase: false,
    powerUpsCollected: 0,
    gameMode: 'CAMPAIGN',
    weather: 'CLEAR',
    isWeatherEnabled: false,
  });

  const [remainingEnemies, setRemainingEnemies] = useState<number>(0);

  // Sound mute toggle
  const handleToggleMute = useCallback(() => {
    const next = soundEngine.toggleMute();
    setIsMuted(next);
  }, []);

  // Control mode toggle
  const handleToggleControlMode = useCallback(() => {
    setControlMode((prev) => {
      const next = prev === 'CLASSIC' ? 'MOUSE_AIM' : 'CLASSIC';
      if (engineRef.current) {
        engineRef.current.setControlMode(next);
      }
      return next;
    });
  }, []);

  // Stage clear handler
  const handleStageClear = useCallback(() => {
    if (gameMode === 'CAMPAIGN') {
      if (currentStageIndex + 1 < CAMPAIGN_STAGES.length) {
        setGameStatus('STAGE_CLEAR');
      } else {
        setGameStatus('VICTORY');
      }
    } else if (gameMode === 'SURVIVAL') {
      setGameStatus('STAGE_CLEAR');
    } else {
      setGameStatus('VICTORY');
    }
  }, [gameMode, currentStageIndex]);

  // Game over handler
  const handleGameOver = useCallback((won: boolean) => {
    setGameStatus(won ? 'VICTORY' : 'GAME_OVER');
  }, []);

  // Start new stage in engine
  const startEngineWithStage = useCallback(
    (cfg: StageConfig, mode: GameMode, cMode: ControlMode, _preserveTier: boolean = false) => {
      if (!canvasRef.current) return;

      if (engineRef.current) {
        engineRef.current.destroy();
      }

      const engine = new GameEngine(canvasRef.current, cfg, mode, {
        onStatsUpdate: (updatedStats, remaining) => {
          setStats(updatedStats);
          setRemainingEnemies(remaining);
        },
        onGameOver: handleGameOver,
        onStageClear: handleStageClear,
      });

      engine.setControlMode(cMode);
      engine.start();
      engineRef.current = engine;
      setGameStatus('PLAYING');
    },
    [handleGameOver, handleStageClear]
  );

  // Start Game from Title
  const handleStartGame = useCallback(
    (mode: GameMode, cMode: ControlMode, startStageNum: number = 1) => {
      soundEngine.resumeAudio();
      setGameMode(mode);
      setControlMode(cMode);

      let initialConfig: StageConfig;
      let stageIdx = 0;

      if (mode === 'CAMPAIGN') {
        stageIdx = Math.max(0, Math.min(CAMPAIGN_STAGES.length - 1, startStageNum - 1));
        initialConfig = CAMPAIGN_STAGES[stageIdx];
      } else if (mode === 'SURVIVAL') {
        stageIdx = 0;
        initialConfig = generateSurvivalStage(1);
      } else {
        stageIdx = 0;
        initialConfig = generateBossRushStage();
      }

      setCurrentStageIndex(stageIdx);
      setCurrentStageConfig(initialConfig);
      setStats((prev) => ({
        ...prev,
        score: 0,
        lives: 3,
        stage: initialConfig.id,
        gameMode: mode,
        kills: { SCOUT: 0, ASSAULT: 0, HEAVY: 0, ARTILLERY: 0, BOSS: 0 },
        totalKills: 0,
      }));

      // Canvas is permanently mounted, start directly without race conditions
      startEngineWithStage(initialConfig, mode, cMode, false);
    },
    [startEngineWithStage]
  );

  // Next Stage in Campaign or Survival
  const handleNextStage = useCallback(() => {
    let nextConfig: StageConfig;
    const nextIdx = currentStageIndex + 1;

    if (gameMode === 'CAMPAIGN') {
      nextConfig = CAMPAIGN_STAGES[nextIdx];
    } else {
      nextConfig = generateSurvivalStage(nextIdx + 1);
    }

    setCurrentStageIndex(nextIdx);
    setCurrentStageConfig(nextConfig);
    startEngineWithStage(nextConfig, gameMode, controlMode, true);
  }, [currentStageIndex, gameMode, controlMode, startEngineWithStage]);

  // Restart current stage
  const handleRestartStage = useCallback(() => {
    setStats((prev) => ({
      ...prev,
      lives: 3,
    }));
    startEngineWithStage(currentStageConfig, gameMode, controlMode, false);
  }, [currentStageConfig, gameMode, controlMode, startEngineWithStage]);

  // Pause / Resume
  const handleTogglePause = useCallback(() => {
    if (gameStatus === 'PLAYING') {
      engineRef.current?.pause();
      setGameStatus('PAUSED');
    } else if (gameStatus === 'PAUSED') {
      engineRef.current?.resume();
      setGameStatus('PLAYING');
    }
  }, [gameStatus]);

  // Quit to Title
  const handleQuitToTitle = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    setGameStatus('TITLE');
  }, []);

  // Global pause shortcut (Escape or KeyP)
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (gameStatus === 'PLAYING' || gameStatus === 'PAUSED') {
          e.preventDefault();
          handleTogglePause();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [gameStatus, handleTogglePause]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
    };
  }, []);

  // Virtual touch input pass-through
  const handleVirtualDirection = (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT', isHeld: boolean) => {
    engineRef.current?.simulateVirtualInput(dir, isHeld);
  };

  const handleVirtualFire = (isHeld: boolean) => {
    engineRef.current?.simulateVirtualInput('FIRE', isHeld);
  };

  const handleUpgradeBase = useCallback(() => {
    engineRef.current?.upgradeBase();
  }, []);

  const handleToggleWeather = useCallback(() => {
    engineRef.current?.toggleWeather();
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 flex items-center justify-center select-none font-sans p-1 sm:p-3">
      {/* 1. Permanent Arena & Canvas Container (Centered, unified arcade console format) */}
      <div
        className={`relative flex flex-col items-center justify-center max-w-[min(98vw,calc(100vh-14px))] w-full h-full max-h-[min(98vh,860px)] transition-opacity duration-300 ${
          gameStatus === 'TITLE' ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
        }`}
      >
        {/* Arcade Cabinet Chassis */}
        <div className="relative flex flex-col w-full h-full rounded-2xl overflow-hidden border-2 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.9)] bg-slate-950">
          {/* Top Compact HUD Bar (Streamlined, compact stats, never obscures tiles) */}
          <GameHUD
            stats={stats}
            remainingEnemies={remainingEnemies}
            isPaused={gameStatus === 'PAUSED'}
            isMuted={isMuted}
            controlMode={controlMode}
            crtEnabled={crtEnabled}
            onTogglePause={handleTogglePause}
            onToggleMute={handleToggleMute}
            onToggleControlMode={handleToggleControlMode}
            onToggleCrt={() => setCrtEnabled(!crtEnabled)}
            onUpgradeBase={handleUpgradeBase}
            onToggleWeather={handleToggleWeather}
            onOpenGuide={() => setIsGuideOpen(true)}
          />

          {/* Battlefield Arena Canvas Area (100% unobstructed, crisp, beautiful ground) */}
          <div className="relative flex-1 flex items-center justify-center bg-slate-950 overflow-hidden min-h-0">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="w-full h-full max-w-full max-h-full object-contain block cursor-crosshair shadow-2xl"
            />

            {/* Optional Retro CRT Scanline Shader */}
            {crtEnabled && (
              <div
                className="pointer-events-none absolute inset-0 z-10 opacity-30 mix-blend-overlay"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.45) 0px, rgba(0, 0, 0, 0.45) 1px, transparent 1px, transparent 3px)',
                }}
              />
            )}
          </div>

          {/* Bottom Hint Footer */}
          <GameFooter highScore={stats.highScore} />
        </div>

        {/* Touch Controls for mobile/tablet docked cleanly below */}
        <div className="md:hidden w-full max-w-[min(94vw,500px)] mt-1.5 shrink-0">
          <TouchControls
            onDirectionInput={handleVirtualDirection}
            onFireInput={handleVirtualFire}
          />
        </div>

        {/* Pause Modal */}
        {gameStatus === 'PAUSED' && (
          <PauseModal
            onResume={handleTogglePause}
            onRestartStage={handleRestartStage}
            onQuitToTitle={handleQuitToTitle}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            controlMode={controlMode}
            onToggleControlMode={handleToggleControlMode}
            onOpenGuide={() => setIsGuideOpen(true)}
          />
        )}

        {/* Victory / Stage Clear / Game Over Modal */}
        {(gameStatus === 'STAGE_CLEAR' || gameStatus === 'GAME_OVER' || gameStatus === 'VICTORY') && (
          <GameOverModal
            isVictory={gameStatus === 'VICTORY'}
            isStageClear={gameStatus === 'STAGE_CLEAR'}
            hasNextStage={
              gameMode === 'CAMPAIGN'
                ? currentStageIndex + 1 < CAMPAIGN_STAGES.length
                : gameMode === 'SURVIVAL'
            }
            stats={stats}
            onNextStage={handleNextStage}
            onRestart={handleRestartStage}
            onQuitToTitle={handleQuitToTitle}
          />
        )}
      </div>

      {/* 2. Title Screen Overlay (shown when gameStatus === 'TITLE') */}
      {gameStatus === 'TITLE' && (
        <div className="absolute inset-0 z-30">
          <TitleScreen
            onStartGame={handleStartGame}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            highScore={stats.highScore}
            onOpenGuide={() => setIsGuideOpen(true)}
          />
        </div>
      )}

      {/* 3. Global Game Guide & Icon Codex Modal */}
      <GameGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </main>
  );
}
