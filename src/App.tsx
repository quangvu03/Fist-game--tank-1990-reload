import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { GameMode, GameStatus, ControlMode, GameStats, StageConfig } from './types/game';
import { CAMPAIGN_STAGES, generateSurvivalStage, generateBossRushStage } from './game/stages';
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
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEngine.getMuted());
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const wasPlayingBeforeGuideRef = useRef<boolean>(false);

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
    combatStats: {
      speed: 110,
      baseSpeed: 110,
      speedBoostActive: false,
      speedBoostRemaining: 0,
      bulletSpeed: 260,
      reloadMax: 0.45,
      fireRate: 2.2,
      doubleShot: false,
      canBreakSteel: false,
      tier: 1,
      tierName: 'Pháo Cơ Bản',
    },
    activeBuffs: [],
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
    (
      cfg: StageConfig,
      mode: GameMode,
      cMode: ControlMode,
      _preserveTier: boolean = false,
      initialProgression?: {
        baseTier?: number;
        playerTier?: number;
        score?: number;
        lives?: number;
      }
    ) => {
      if (!canvasRef.current) return;

      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }

      const engine = new GameEngine(
        canvasRef.current,
        cfg,
        mode,
        {
          onStatsUpdate: (newStats, enemiesCount) => {
            setStats(newStats);
            setRemainingEnemies(enemiesCount);
          },
          onGameOver: (won) => {
            handleGameOver(won);
          },
          onStageClear: () => {
            handleStageClear();
          },
        },
        initialProgression
      );

      engine.setControlMode(cMode);
      engine.start();
      engineRef.current = engine;
    },
    [handleGameOver, handleStageClear]
  );

  // Start Game from Title Screen
  const handleStartGame = useCallback(
    (mode: GameMode, cMode: ControlMode, startStageIndex: number = 1) => {
      setGameMode(mode);
      setControlMode(cMode);

      let cfg: StageConfig;
      let stageIdx = 0;

      if (mode === 'CAMPAIGN') {
        stageIdx = Math.max(0, Math.min(startStageIndex - 1, CAMPAIGN_STAGES.length - 1));
        cfg = CAMPAIGN_STAGES[stageIdx];
      } else if (mode === 'SURVIVAL') {
        stageIdx = 0;
        cfg = generateSurvivalStage(1);
      } else {
        stageIdx = 0;
        cfg = generateBossRushStage();
      }

      setCurrentStageIndex(stageIdx);
      setCurrentStageConfig(cfg);
      setGameStatus('PLAYING');

      setTimeout(() => {
        startEngineWithStage(cfg, mode, cMode, false, {
          baseTier: 1,
          playerTier: 1,
          score: 0,
          lives: 3,
        });
      }, 50);
    },
    [startEngineWithStage]
  );

  // Restart Current Stage
  const handleRestartStage = useCallback(() => {
    setGameStatus('PLAYING');
    const prevBaseTier = engineRef.current ? engineRef.current.getBaseTier() : 1;
    const prevPlayerTier = engineRef.current ? engineRef.current.getPlayerTier() : 1;
    const prevScore = engineRef.current ? engineRef.current.getScore() : 0;
    const prevLives = engineRef.current ? engineRef.current.getLives() : 3;

    setTimeout(() => {
      startEngineWithStage(
        currentStageConfig,
        gameMode,
        controlMode,
        true,
        {
          baseTier: prevBaseTier,
          playerTier: prevPlayerTier,
          score: prevScore,
          lives: prevLives,
        }
      );
    }, 50);
  }, [currentStageConfig, gameMode, controlMode, startEngineWithStage]);

  // Next Stage in Campaign or Survival
  const handleNextStage = useCallback(() => {
    let nextIdx = currentStageIndex + 1;
    let nextCfg: StageConfig;

    if (gameMode === 'CAMPAIGN') {
      if (nextIdx >= CAMPAIGN_STAGES.length) {
        setGameStatus('VICTORY');
        return;
      }
      nextCfg = CAMPAIGN_STAGES[nextIdx];
    } else if (gameMode === 'SURVIVAL') {
      nextCfg = generateSurvivalStage(nextIdx + 1);
    } else {
      setGameStatus('VICTORY');
      return;
    }

    setCurrentStageIndex(nextIdx);
    setCurrentStageConfig(nextCfg);
    setGameStatus('PLAYING');

    const prevBaseTier = engineRef.current ? engineRef.current.getBaseTier() : 1;
    const prevPlayerTier = engineRef.current ? engineRef.current.getPlayerTier() : 1;
    const prevScore = engineRef.current ? engineRef.current.getScore() : 0;
    const prevLives = engineRef.current ? engineRef.current.getLives() : 3;

    setTimeout(() => {
      startEngineWithStage(
        nextCfg,
        gameMode,
        controlMode,
        true,
        {
          baseTier: prevBaseTier,
          playerTier: prevPlayerTier,
          score: prevScore,
          lives: prevLives,
        }
      );
    }, 50);
  }, [currentStageIndex, gameMode, controlMode, startEngineWithStage]);

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

  // Open guide modal
  const handleOpenGuide = useCallback(() => {
    if (gameStatus === 'PLAYING') {
      engineRef.current?.pause();
      wasPlayingBeforeGuideRef.current = true;
      setGameStatus('PAUSED');
    }
    setIsGuideOpen(true);
  }, [gameStatus]);

  // Close guide modal
  const handleCloseGuide = useCallback(() => {
    setIsGuideOpen(false);
    if (wasPlayingBeforeGuideRef.current && gameStatus === 'PAUSED') {
      engineRef.current?.resume();
      setGameStatus('PLAYING');
      wasPlayingBeforeGuideRef.current = false;
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

  // Global pause shortcut (Escape or KeyP) and Guide toggle (KeyH)
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.code === 'KeyH') {
        e.preventDefault();
        if (isGuideOpen) {
          handleCloseGuide();
        } else {
          handleOpenGuide();
        }
        return;
      }

      if (e.code === 'Escape') {
        if (isGuideOpen) {
          e.preventDefault();
          handleCloseGuide();
          return;
        }
        if (gameStatus === 'PLAYING' || gameStatus === 'PAUSED') {
          e.preventDefault();
          handleTogglePause();
        }
        return;
      }

      if (e.code === 'KeyP') {
        if (gameStatus === 'PLAYING' || gameStatus === 'PAUSED') {
          e.preventDefault();
          handleTogglePause();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [gameStatus, handleTogglePause, isGuideOpen, handleOpenGuide, handleCloseGuide]);

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
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 flex flex-col select-none font-sans p-0 m-0">
      {/* 1. Màn chơi chính: THANH TRÊN VÀ DƯỚI ĐỀU CĂN GIỮA, MAP SÁT VIỀN 100% */}
      <div
        className={`relative z-10 flex flex-col w-full h-full overflow-hidden transition-opacity duration-200 ${
          gameStatus === 'TITLE' ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
        }`}
      >
        {/* THANH TRẠNG THÁI TRÊN (CĂN GIỮA): MẠNG, CĂN CỨ, NÂNG CẤP, LEVEL, ĐỊCH, ĐIỂM, TẠM DỪNG */}
        <GameHUD
          stats={stats}
          remainingEnemies={remainingEnemies}
          isPaused={gameStatus === 'PAUSED'}
          onTogglePause={handleTogglePause}
          onUpgradeBase={handleUpgradeBase}
          onOpenGuide={handleOpenGuide}
        />

        {/* MAP CỦA GAME: SÁT VIỀN 100%, ĐỘ CAO VÀ RỘNG TỐI ĐA TRÊN MÀN HÌNH */}
        <div className="relative flex-1 w-full min-h-0 flex items-stretch justify-stretch overflow-hidden bg-slate-950">
          <canvas
            ref={canvasRef}
            className="w-full h-full block cursor-crosshair select-none [image-rendering:pixelated]"
          />

          {/* Phím ảo điều khiển cảm ứng cho di động/máy tính bảng */}
          <div className="md:hidden absolute bottom-2 left-2 right-2 pointer-events-none z-20 flex justify-between">
            <TouchControls
              onDirectionInput={handleVirtualDirection}
              onFireInput={handleVirtualFire}
            />
          </div>
        </div>

        {/* THANH TRẠNG THÁI DƯỚI (CĂN GIỮA): TỐC ĐỘ, HỎA LỰC, PHÍM TẮT & KỶ LỤC */}
        <GameFooter highScore={stats.highScore} combatStats={stats.combatStats} />

        {/* Pause Modal (Chứa Sổ tay, Thời tiết, Âm thanh, Điều khiển) */}
        {gameStatus === 'PAUSED' && !isGuideOpen && (
          <PauseModal
            onResume={handleTogglePause}
            onRestartStage={handleRestartStage}
            onQuitToTitle={handleQuitToTitle}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            controlMode={controlMode}
            onToggleControlMode={handleToggleControlMode}
            onOpenGuide={handleOpenGuide}
            weather={stats.weather}
            isWeatherEnabled={stats.isWeatherEnabled}
            onToggleWeather={handleToggleWeather}
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

      {/* 2. Title Screen Overlay (hiển thị khi gameStatus === 'TITLE') */}
      {gameStatus === 'TITLE' && (
        <div className="absolute inset-0 z-30">
          <TitleScreen
            onStartGame={handleStartGame}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            highScore={stats.highScore}
            onOpenGuide={handleOpenGuide}
          />
        </div>
      )}

      {/* 3. Global Game Guide & Icon Codex Modal */}
      <GameGuideModal
        isOpen={isGuideOpen}
        onClose={handleCloseGuide}
      />
    </main>
  );
}
