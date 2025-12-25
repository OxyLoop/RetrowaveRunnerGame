import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import UpgradeShop from './components/UpgradeShop';
import { GamePhase, Boss } from './types';
import { gameStateRef, nextLevel, startLevelFromShop } from './state/gameState';
import { getLevelConfig } from './types/levels';
import { Play, RotateCcw, ShieldAlert, Trophy, Zap, ChevronRight } from 'lucide-react';

declare global {
  interface Window {
    startGame: () => void;
    continueToNextLevel: () => void;
  }
}

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.MENU);
  const [score, setScore] = useState(0);
  const [bossInfo, setBossInfo] = useState<Boss | null>(null);

  type OrientationMode = 'auto' | 'portrait' | 'landscape';
  const [orientation, setOrientation] = useState<OrientationMode>('auto');

  const isPortraitScreen = window.innerHeight > window.innerWidth;

  const containerClass =
    orientation === 'portrait'
      ? 'relative h-screen w-full max-w-md mx-auto aspect-[9/18] overflow-hidden bg-black'
      : orientation === 'landscape'
        ? 'relative w-screen h-screen overflow-hidden bg-black'
        : isPortraitScreen
          ? 'relative h-screen w-full max-w-md mx-auto aspect-[9/18] overflow-hidden bg-black'
          : 'relative w-screen h-screen overflow-hidden bg-black';

  const handleStart = () => {
    if (window.startGame) {
      window.startGame();
    }
  };

  const handleNextLevel = () => {
    nextLevel();
    setPhase(GamePhase.UPGRADE_SHOP);
  };

  const handleStartFromShop = () => {
    startLevelFromShop();
    setPhase(GamePhase.RUNNING);
  };

  // Sync phase from game state
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameStateRef.current.phase !== phase) {
        setPhase(gameStateRef.current.phase);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [phase]);

  const getPhaseUI = () => {
    switch (phase) {
      case GamePhase.MENU:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 backdrop-blur-sm p-6 text-center">
            <h1 className="text-5xl md:text-6xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-b from-fuchsia-400 to-purple-700 italic drop-shadow-[0_0_10px_rgba(255,0,255,0.5)]">
              NEON
              <br />
              HORDE
            </h1>
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mb-4 opacity-80"></div>
            <p className="mb-6 text-cyan-200 text-sm tracking-widest uppercase font-bold drop-shadow-md">
              Oyun Modu Seç
            </p>

            {/* Mode Selection */}
            <div className="flex flex-col gap-4 mb-6 w-full max-w-xs">
              {/* Shooter Mode */}
              <button
                onClick={() => {
                  gameStateRef.current.gameMode = 'SHOOTER';
                  gameStateRef.current.hyperCasual = undefined;
                  handleStart();
                }}
                className="group relative px-6 py-4 bg-transparent border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black rounded-sm font-bold transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]"
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">🔫</span>
                  <div className="text-left">
                    <div className="text-lg">SHOOTER MODE</div>
                    <div className="text-xs opacity-70">Düşmanlar, Bosslar, Silahlar</div>
                  </div>
                </div>
              </button>

              {/* Hyper Casual Mode */}
              <button
                onClick={() => {
                  gameStateRef.current.gameMode = 'HYPER_CASUAL';
                  gameStateRef.current.hyperCasual = {
                    soldierCount: 10,
                    gatesCleared: 0,
                    isFinished: false,
                  };
                  handleStart();
                }}
                className="group relative px-6 py-4 bg-transparent border-2 border-fuchsia-400 text-fuchsia-400 hover:bg-fuchsia-400 hover:text-black rounded-sm font-bold transition-all duration-300 hover:shadow-[0_0_30px_rgba(217,70,239,0.6)]"
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">🎲</span>
                  <div className="text-left">
                    <div className="text-lg">HYPER CASUAL</div>
                    <div className="text-xs opacity-70">Matematik Kapıları, Asker Ordusu</div>
                  </div>
                </div>
              </button>
            </div>

            <p className="text-gray-500 text-xs font-mono">
              A/D: Hareket • Space/Click: Ateş • Q: Ultimate
            </p>
          </div>
        );

      case GamePhase.BOSS_FIGHT:
        return (
          <div className="absolute top-24 left-0 right-0 flex flex-col items-center justify-center z-10 pointer-events-none">
            <div className="animate-pulse bg-gradient-to-r from-red-900/80 to-purple-900/80 text-white px-8 py-2 border-y-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] flex items-center gap-3 skew-x-[-10deg]">
              <ShieldAlert className="text-red-400 animate-bounce" />
              <span className="font-bold text-xl tracking-widest skew-x-[10deg]">
                BOSS SAVAŞI!
              </span>
            </div>
            {bossInfo && (
              <div className="mt-4 bg-black/80 p-4 border border-fuchsia-500/50 text-center max-w-[90%] shadow-[0_0_15px_rgba(217,70,239,0.3)]">
                <p className="text-fuchsia-400 font-bold text-lg uppercase tracking-wider drop-shadow-sm">
                  {bossInfo.name}
                </p>
                <p className="text-gray-300 text-sm italic font-mono mt-1">
                  "{bossInfo.taunt}"
                </p>
              </div>
            )}
          </div>
        );

      case GamePhase.GAME_OVER:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/80 text-white z-10 backdrop-blur-md">
            <h2 className="text-6xl font-black mb-4 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] italic">
              GAME OVER
            </h2>
            <p className="text-xl mb-4 text-red-200 font-mono">
              SISTEM HATASI
            </p>
            <div className="bg-black/40 p-4 mb-6 border border-red-500/30">
              <p className="text-gray-400 text-sm">Final Skor</p>
              <p className="text-3xl font-bold text-red-300">{score}</p>
            </div>
            <button
              onClick={handleStart}
              className="px-8 py-3 border border-white text-white hover:bg-white hover:text-red-900 font-bold text-lg transition-all hover:shadow-[0_0_20px_white] flex items-center gap-2"
            >
              <RotateCcw />
              TEKRAR DENE
            </button>
          </div>
        );

      case GamePhase.LEVEL_COMPLETE:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-950/80 text-white z-10 backdrop-blur-md">
            <h2 className="text-5xl font-black mb-4 text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.8)] italic">
              LEVEL {gameStateRef.current.currentLevel} TAMAM!
            </h2>
            <p className="text-xl mb-4 text-green-200 font-mono">
              BOSS YOK EDİLDİ
            </p>
            <div className="bg-black/40 p-4 mb-6 border border-green-500/30">
              <p className="text-gray-400 text-sm">Toplam Coins</p>
              <p className="text-3xl font-bold text-yellow-300">{gameStateRef.current.player?.currency || 0}</p>
            </div>
            <button
              onClick={handleNextLevel}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-cyan-500 text-black font-bold text-lg transition-all hover:shadow-[0_0_20px_rgba(74,222,128,0.6)] flex items-center gap-2"
            >
              <ChevronRight />
              UPGRADE SHOP
            </button>
          </div>
        );

      case GamePhase.UPGRADE_SHOP:
        return <UpgradeShop />;

      case GamePhase.VICTORY:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-fuchsia-950/80 text-white z-10 backdrop-blur-md">
            <h2 className="text-6xl font-black mb-4 text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.8)] italic">
              ZAFER!
            </h2>
            <p className="text-xl mb-4 text-fuchsia-200 tracking-widest">
              TÜM BOSSLAR YOK EDİLDİ
            </p>
            <div className="flex flex-col items-center gap-2 mb-8 bg-black/40 p-6 border border-yellow-500/30">
              <span className="text-xs uppercase tracking-widest text-yellow-500">Final Skor</span>
              <span className="text-5xl font-mono font-bold text-yellow-300 drop-shadow-md">
                {score}
              </span>
              <span className="text-sm text-gray-400">
                High Score: {gameStateRef.current.highScore}
              </span>
            </div>
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-yellow-400 text-black hover:bg-yellow-300 font-bold text-lg transition-all hover:shadow-[0_0_20px_rgba(250,204,21,0.6)] flex items-center gap-2"
            >
              <Zap className="fill-black" />
              YENİDEN BAŞLA
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0518] flex items-center justify-center p-4 font-sans overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-[#0f0518] to-black">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

      <div className={containerClass}>
        {/* Game Canvas */}
        <GameCanvas
          onScoreChange={setScore}
          onPhaseChange={setPhase}
          onBossInfo={setBossInfo}
          orientation={orientation}
        />

        {/* HUD - only during gameplay */}
        {(phase === GamePhase.RUNNING || phase === GamePhase.BOSS_FIGHT) && <HUD />}

        {/* Orientation Toggle */}
        <div className="absolute top-6 right-6 z-20 pointer-events-auto">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-cyan-500/30 px-2 py-2">
            <button
              onClick={() => setOrientation('auto')}
              className={`px-3 py-1 text-xs font-mono tracking-widest ${orientation === 'auto'
                ? 'bg-cyan-400 text-black'
                : 'text-cyan-200 hover:bg-white/10'
                }`}
            >
              AUTO
            </button>
            <button
              onClick={() => setOrientation('portrait')}
              className={`px-3 py-1 text-xs font-mono tracking-widest ${orientation === 'portrait'
                ? 'bg-cyan-400 text-black'
                : 'text-cyan-200 hover:bg-white/10'
                }`}
            >
              DİKEY
            </button>
            <button
              onClick={() => setOrientation('landscape')}
              className={`px-3 py-1 text-xs font-mono tracking-widest ${orientation === 'landscape'
                ? 'bg-cyan-400 text-black'
                : 'text-cyan-200 hover:bg-white/10'
                }`}
            >
              YATAY
            </button>
          </div>
        </div>

        {/* Phase Overlays */}
        {getPhaseUI()}
      </div>

      {/* Controls hint */}
      <div className="fixed bottom-4 text-fuchsia-500/50 text-xs font-mono tracking-widest uppercase">
        A/D: Hareket • Space: Ateş • 1-4: Silah
      </div>
    </div>
  );
};

export default App;
