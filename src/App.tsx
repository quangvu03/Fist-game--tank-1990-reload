import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { GameMode, GameStatus, ControlMode, GameStats, StageConfig } from './types/game';
import { CAMPAIGN_STAGES, generateSurvivalStage, generateBossRushStage } from './game/stages';
import { soundEngine } from './audio/soundEngine';
import { musicEngine } from './audio/musicEngine';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD, GameFooter } from './components/GameHUD';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { TouchControls } from './components/TouchControls';
import { GameGuideModal } from './components/GameGuideModal';
import { ShopModal } from './components/ShopModal';
import { SupportItemId } from './types/shop';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // High level UI states
  const [gameStatus, setGameStatus] = useState<GameStatus>('TITLE');
  const [gameMode, setGameMode] = useState<GameMode>('CAMPAIGN');
  const [controlMode, setControlMode] = useState<ControlMode>('CLASSIC');
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEngine.getMuted());
  const [isMusicMuted, setIsMusicMuted] = useState<boolean>(() => musicEngine.getMuted());
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);
  const [showTouchControls, setShowTouchControls] = useState<boolean>(true);
  const [isPortraitNoticeVisible, setIsPortraitNoticeVisible] = useState<boolean>(false);
  const [isMobileLandscape, setIsMobileLandscape] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const wasPlayingBeforeGuideRef = useRef<boolean>(false);
  const wasPlayingBeforeShopRef = useRef<boolean>(false);
  const prevGameStatusRef = useRef<GameStatus>('TITLE');

  // Monitor device orientation, touch capabilities and fullscreen state for 16:9 edge-to-edge experience
  useEffect(() => {
    const handleDeviceAndOrientation = () => {
      const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      const isLandscape = window.innerWidth > window.innerHeight;
      const isCompactHeight = window.innerHeight <= 560;
      setIsTouchDevice(hasTouch);
      // Chế độ xoay ngang mobile: màn hình nằm ngang và có cảm ứng hoặc chiều cao nhỏ <= 560px
      setIsMobileLandscape(isLandscape && (hasTouch || isCompactHeight));
      const isPortrait = window.innerHeight > window.innerWidth && window.innerWidth < 768;
      setIsPortraitNoticeVisible(isPortrait && hasTouch);
    };
    handleDeviceAndOrientation();
    window.addEventListener('resize', handleDeviceAndOrientation);
    window.addEventListener('orientationchange', handleDeviceAndOrientation);

    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);

    return () => {
      window.removeEventListener('resize', handleDeviceAndOrientation);
      window.removeEventListener('orientationchange', handleDeviceAndOrientation);
      document.removeEventListener('fullscreenchange', onFsChange);
    };
  }, []);

  // HTML5 Fullscreen API toggle
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, []);

  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [currentStageConfig, setCurrentStageConfig] = useState<StageConfig>(CAMPAIGN_STAGES[0]);

  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    coins: 0,
    stageCoins: 0,
    lives: 3,
    playerHp: 3,
    playerMaxHp: 3,
    playerTier: 1,
    stage: 1,
    totalStages: 21,
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

  // Sound effects mute toggle
  const handleToggleMute = useCallback(() => {
    const next = soundEngine.toggleMute();
    setIsMuted(next);
  }, []);

  // Music mute toggle
  const handleToggleMusic = useCallback(() => {
    const next = musicEngine.toggleMute();
    setIsMusicMuted(next);
  }, []);

  // Unlock browser audio contexts on first user gesture
  useEffect(() => {
    const unlockAudio = () => {
      soundEngine.resumeAudio();
      musicEngine.resumeAudio();
      if (gameStatus === 'TITLE' && musicEngine.getCurrentTrack() === 'SILENCE') {
        musicEngine.playTrack('TITLE');
      }
    };
    window.addEventListener('pointerdown', unlockAudio, { once: false });
    window.addEventListener('keydown', unlockAudio, { once: false });
    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, [gameStatus]);

  // Synchronize background music: Chỉ phát nhạc ở Sảnh chờ (Title), tắt hoàn toàn nhạc trong game
  useEffect(() => {
    prevGameStatusRef.current = gameStatus;

    if (gameStatus === 'TITLE') {
      musicEngine.playTrack('TITLE');
    } else {
      // Trong trận chiến: Tắt hoàn toàn nhạc nền theo yêu cầu, chỉ giữ lại âm thanh tác chiến chân thực
      musicEngine.stop();
    }
  }, [gameStatus]);



  // Stage clear handler - Campaign completes at Level 21, Survival continues wave-by-wave
  const handleStageClear = useCallback(() => {
    if (gameMode === 'BOSS_RUSH') {
      setGameStatus('VICTORY');
    } else if (gameMode === 'CAMPAIGN') {
      if (currentStageIndex + 1 >= CAMPAIGN_STAGES.length) {
        setGameStatus('VICTORY');
      } else {
        setGameStatus('STAGE_CLEAR');
      }
    } else {
      setGameStatus('STAGE_CLEAR');
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
      // Dừng ngay nhạc nền sảnh chờ để chuyển sang nhạc chiến đấu mới
      musicEngine.stop();
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

  // Next Stage in Campaign (Levels 1-21 -> Endless Survival Waves 22+) or Survival/Boss Rush
  const handleNextStage = useCallback(() => {
    let nextIdx = currentStageIndex + 1;
    let nextCfg: StageConfig;

    if (gameMode === 'CAMPAIGN') {
      if (nextIdx < CAMPAIGN_STAGES.length) {
        nextCfg = CAMPAIGN_STAGES[nextIdx];
      } else {
        setGameStatus('VICTORY');
        return;
      }
    } else if (gameMode === 'SURVIVAL') {
      nextCfg = generateSurvivalStage(nextIdx + 1, nextIdx + 1);
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

  // Open shop modal
  const handleOpenShop = useCallback(() => {
    if (gameStatus === 'PLAYING') {
      engineRef.current?.pause();
      wasPlayingBeforeShopRef.current = true;
      setGameStatus('PAUSED');
    }
    setIsShopOpen(true);
  }, [gameStatus]);

  // Close shop modal
  const handleCloseShop = useCallback(() => {
    setIsShopOpen(false);
    engineRef.current?.refreshShopCustomization();
    if (wasPlayingBeforeShopRef.current && gameStatus === 'PAUSED') {
      engineRef.current?.resume();
      setGameStatus('PLAYING');
      wasPlayingBeforeShopRef.current = false;
    }
  }, [gameStatus]);

  // Use consumable tactical support item
  const handleUseSupportItem = useCallback((id: SupportItemId) => {
    engineRef.current?.useSupportItem(id);
  }, []);

  // Quit to Title
  const handleQuitToTitle = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    // Dừng ngay nhạc trận đấu trước khi về sảnh chính
    musicEngine.stop();
    setGameStatus('TITLE');
  }, []);

  // Global pause shortcut (Escape or KeyP) and Guide toggle (KeyH), Shop toggle (KeyC)
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.code === 'KeyC') {
        e.preventDefault();
        if (isShopOpen) {
          handleCloseShop();
        } else {
          handleOpenShop();
        }
        return;
      }

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
        if (isShopOpen) {
          e.preventDefault();
          handleCloseShop();
          return;
        }
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
        return;
      }

      if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMusic();
        return;
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [gameStatus, handleTogglePause, handleToggleMusic, isGuideOpen, handleOpenGuide, handleCloseGuide, isShopOpen, handleOpenShop, handleCloseShop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
      musicEngine.stop();
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
      {/* 1. Màn chơi chính: Khi xoay ngang mobile -> tràn viền 100% full screen, các nút bấm đè lên chiến trường */}
      <div
        className={`relative z-10 ${
          isMobileLandscape ? 'block' : 'flex flex-col'
        } w-full h-full overflow-hidden transition-opacity duration-200 ${
          gameStatus === 'TITLE' ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
        }`}
      >
        {/* Banner nhắc xoay ngang điện thoại nếu đang ở chế độ dọc (portrait) */}
        {isPortraitNoticeVisible && (
          <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black px-3 py-1 text-[11px] flex items-center justify-between shadow-lg shrink-0 z-40">
            <span className="flex items-center gap-1.5">
              <span className="text-sm">🔄</span>
              <span>Xoay ngang điện thoại để trải nghiệm toàn màn hình 16:9 tốt nhất!</span>
            </span>
            <button
              onClick={() => setIsPortraitNoticeVisible(false)}
              className="text-xs bg-slate-950/20 hover:bg-slate-950/40 text-slate-950 rounded px-1.5 py-0.5 ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* THANH TRẠNG THÁI TRÊN (GameHUD):
            - Mobile xoay ngang: Thanh nổi bán trong suốt đè lên đỉnh chiến trường (không đẩy canvas xuống)
            - Desktop: Thanh cố định chuẩn */}
        <GameHUD
          stats={stats}
          remainingEnemies={remainingEnemies}
          isPaused={gameStatus === 'PAUSED'}
          onTogglePause={handleTogglePause}
          onUpgradeBase={handleUpgradeBase}
          isMusicMuted={isMusicMuted}
          onToggleMusic={handleToggleMusic}
          onOpenShop={handleOpenShop}
          onUseSupportItem={handleUseSupportItem}
          isMobileLandscape={isMobileLandscape}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />

        {/* CHIẾN TRƯỜNG CỦA GAME (CANVAS):
            - Mobile xoay ngang: absolute inset-0 w-full h-full (toàn màn hình 100%, tỷ lệ 16:9 chuẩn)
            - Desktop: relative flex-1 w-full min-h-0 */}
        <div
          className={`${
            isMobileLandscape ? 'absolute inset-0' : 'relative flex-1'
          } w-full min-h-0 flex items-center justify-center overflow-hidden bg-slate-950`}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block cursor-crosshair select-none"
          />

          {/* Phím ảo điều khiển cảm ứng: ĐÈ LÊN CHIẾN TRƯỜNG, NÚT NHỎ GỌN BÁN TRONG SUỐT KHÔNG CHE TẦM NHÌN */}
          {(isTouchDevice || showTouchControls) && (
            <TouchControls
              onDirectionInput={handleVirtualDirection}
              onFireInput={handleVirtualFire}
              onUseSupportItem={handleUseSupportItem}
              onUpgradeBase={handleUpgradeBase}
              canUpgradeBase={stats.canUpgradeBase}
              supportInventory={stats.supportInventory}
              isFullscreen={isFullscreen}
              onToggleFullscreen={handleToggleFullscreen}
            />
          )}
        </div>

        {/* THANH TRẠNG THÁI DƯỚI: Ẩn trên mobile xoay ngang để chiến trường chiếm 100% chiều cao */}
        {!isMobileLandscape && (
          <GameFooter highScore={stats.highScore} combatStats={stats.combatStats} />
        )}

        {/* Pause Modal (Chứa Sổ tay, Thời tiết, Âm thanh SFX & BGM, Điều khiển, Cửa hàng) */}
        {gameStatus === 'PAUSED' && !isGuideOpen && !isShopOpen && (
          <PauseModal
            onResume={handleTogglePause}
            onRestartStage={handleRestartStage}
            onQuitToTitle={handleQuitToTitle}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            isMusicMuted={isMusicMuted}
            onToggleMusic={handleToggleMusic}
            onOpenGuide={handleOpenGuide}
            onOpenShop={handleOpenShop}
            weather={stats.weather}
            isWeatherEnabled={stats.isWeatherEnabled}
            onToggleWeather={handleToggleWeather}
            showTouchControls={showTouchControls}
            onToggleTouchControls={() => setShowTouchControls((prev) => !prev)}
          />
        )}

        {/* Victory / Stage Clear / Game Over Modal */}
        {(gameStatus === 'STAGE_CLEAR' || gameStatus === 'GAME_OVER' || gameStatus === 'VICTORY') && (
          <GameOverModal
            isVictory={gameStatus === 'VICTORY'}
            isStageClear={gameStatus === 'STAGE_CLEAR'}
            hasNextStage={
              gameMode === 'SURVIVAL' ||
              (gameMode === 'CAMPAIGN' && currentStageIndex + 1 < CAMPAIGN_STAGES.length)
            }
            stats={stats}
            onNextStage={handleNextStage}
            onRestart={handleRestartStage}
            onQuitToTitle={handleQuitToTitle}
            onOpenShop={handleOpenShop}
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
            isMusicMuted={isMusicMuted}
            onToggleMusic={handleToggleMusic}
            highScore={stats.highScore}
            onOpenGuide={handleOpenGuide}
            onOpenShop={handleOpenShop}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />
        </div>
      )}

      {/* 3. Global Game Guide & Icon Codex Modal */}
      <GameGuideModal
        isOpen={isGuideOpen}
        onClose={handleCloseGuide}
      />

      {/* 4. Global Military Shop Modal */}
      <ShopModal
        isOpen={isShopOpen}
        onClose={handleCloseShop}
        onProfileUpdated={() => {
          engineRef.current?.refreshShopCustomization();
        }}
      />
    </main>
  );
}
