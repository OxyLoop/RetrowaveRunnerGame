import React from 'react';
import { gameStateRef, switchWeapon, getCurrentWeapon } from '../state/gameState';
import { GamePhase, WeaponType } from '../types';
import { getWeaponStats } from '../types/weapons';
import { COLORS } from '../constants';

interface HUDProps {
    onPause?: () => void;
}

const HUD: React.FC<HUDProps> = ({ onPause }) => {
    const gs = gameStateRef.current;
    const player = gs.player;
    const weapon = getCurrentWeapon();
    const stats = weapon ? getWeaponStats(weapon) : null;
    const [combo, setCombo] = React.useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            const currentCombo = gameStateRef.current.combo || 0;
            if (currentCombo !== combo) {
                setCombo(currentCombo);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [combo]);

    if (gs.phase !== GamePhase.RUNNING && gs.phase !== GamePhase.BOSS_FIGHT) {
        return null;
    }

    // HYPER CASUAL MODE - Simple HUD
    if (gs.gameMode === 'HYPER_CASUAL') {
        return (
            <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-black/80 backdrop-blur-sm px-8 py-4 border-2 border-fuchsia-500">
                        <div className="text-center">
                            <span className="text-fuchsia-400 text-xs font-mono uppercase tracking-widest">
                                ASKER SAYISI
                            </span>
                            <div className="text-5xl font-bold text-white mt-2">
                                {gs.hyperCasual?.soldierCount || 10}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Boss Health Bar for HYPER CASUAL */}
                {gs.phase === GamePhase.BOSS_FIGHT && gs.boss.isActive && (
                    <div className="absolute top-32 left-1/2 transform -translate-x-1/2 w-80">
                        <div className="bg-black/80 backdrop-blur-sm p-4 border-2 border-red-500 shadow-[0_0_15px_rgba(255,0,0,0.5)]">
                            <div className="text-center mb-2">
                                <span className="text-red-500 font-bold text-xl tracking-widest">{gs.boss.name}</span>
                            </div>
                            <div className="w-full h-6 bg-gray-900 border border-red-900">
                                <div
                                    className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-300"
                                    style={{ width: `${(gs.boss.currentHp / gs.boss.maxHp) * 100}%` }}
                                />
                            </div>
                            <div className="text-center mt-1">
                                <span className="text-red-300 text-sm font-mono font-bold">
                                    {Math.ceil(gs.boss.currentHp)} / {gs.boss.maxHp} HP
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-gray-400 text-xs font-mono">
                    A/D veya ← → ile kapı seç
                </div>
            </div>
        );
    }

    // SHOOTER MODE - Full HUD
    const healthPercent = (player.health / player.maxHealth) * 100;
    const shieldPercent = player.maxShield > 0 ? (player.shield / player.maxShield) * 100 : 0;

    return (
        <div className="absolute inset-0 pointer-events-none z-10">
            {/* Top Left - Health & Shield */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
                {/* Health Bar */}
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-2 border-l-4 border-red-500">
                    <span className="text-red-400 text-xs font-mono uppercase tracking-wider">HP</span>
                    <div className="w-32 h-3 bg-gray-800 border border-red-900">
                        <div
                            className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300"
                            style={{ width: `${healthPercent}%` }}
                        />
                    </div>
                    <span className="text-red-300 text-sm font-mono">{Math.ceil(player.health)}</span>
                </div>

                {/* Shield Bar */}
                {player.maxShield > 0 && (
                    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-2 border-l-4 border-cyan-500">
                        <span className="text-cyan-400 text-xs font-mono uppercase tracking-wider">SH</span>
                        <div className="w-32 h-3 bg-gray-800 border border-cyan-900">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300"
                                style={{ width: `${shieldPercent}%` }}
                            />
                        </div>
                        <span className="text-cyan-300 text-sm font-mono">{Math.ceil(player.shield)}</span>
                    </div>
                )}

                {/* RAGE BAR - Ultimate */}
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-2 border-l-4 border-orange-500">
                    <span className="text-orange-400 text-xs font-mono uppercase tracking-wider">⚡</span>
                    <div className="w-32 h-3 bg-gray-800 border border-orange-900">
                        <div
                            className={`h-full transition-all duration-300 ${(player.rage || 0) >= 100 ? 'bg-gradient-to-r from-orange-500 to-yellow-400 animate-pulse' : 'bg-gradient-to-r from-orange-700 to-orange-500'}`}
                            style={{ width: `${player.rage || 0}%` }}
                        />
                    </div>
                    <span className={`text-sm font-mono ${(player.rage || 0) >= 100 ? 'text-yellow-300 font-bold' : 'text-orange-300'}`}>
                        {(player.rage || 0) >= 100 ? 'Q!' : Math.floor(player.rage || 0)}
                    </span>
                </div>
            </div>


            {/* COMBO INDICATOR */}
            {
                combo > 1 && (
                    <div className="absolute top-24 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce">
                        <div className="text-4xl font-black italic text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]"
                            style={{ transform: `scale(${1 + Math.min(combo * 0.1, 1)})` }}>
                            COMBO x{combo}
                        </div>
                        {combo >= 5 && (
                            <div className="text-fuchsia-400 font-bold tracking-widest text-sm animate-pulse">
                                {combo >= 15 ? 'GODLIKE!!!' : combo >= 10 ? 'UNSTOPPABLE!!' : 'RAMPAGE!'}
                            </div>
                        )}
                        <div className="w-32 h-1 bg-gray-800 mt-1">
                            <div
                                className="h-full bg-yellow-400 transition-all duration-100"
                                style={{ width: `${(gameStateRef.current.comboTimer / 3) * 100}%` }}
                            />
                        </div>
                    </div>
                )
            }

            {/* Top Right - Score & Currency */}
            <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-4 py-2 border-r-4 border-fuchsia-500">
                    <span className="text-fuchsia-400 text-xs font-mono uppercase tracking-wider">SCORE</span>
                    <span className="text-fuchsia-300 text-xl font-mono font-bold">{gs.score}</span>
                </div>
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-4 py-2 border-r-4 border-yellow-500">
                    <span className="text-yellow-400 text-xs font-mono uppercase tracking-wider">COINS</span>
                    <span className="text-yellow-300 text-lg font-mono font-bold">{player.currency}</span>
                </div>
            </div>

            {/* Bottom - Weapons */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 pointer-events-auto">
                {player.weapons.map((w, index) => {
                    const isActive = w.type === player.currentWeapon;
                    const isUnlocked = w.unlocked;

                    return (
                        <button
                            key={w.type}
                            onClick={() => isUnlocked && switchWeapon(w.type)}
                            disabled={!isUnlocked}
                            className={`
                flex flex-col items-center px-4 py-2 border-2 transition-all
                ${isActive
                                    ? 'border-cyan-400 bg-cyan-900/50 shadow-[0_0_15px_rgba(0,255,255,0.5)]'
                                    : isUnlocked
                                        ? 'border-gray-600 bg-black/60 hover:border-gray-400'
                                        : 'border-gray-800 bg-black/40 opacity-50'
                                }
              `}
                        >
                            <span className="text-xs text-gray-400 font-mono">{index + 1}</span>
                            <span
                                className={`text-sm font-bold ${isActive ? 'text-cyan-300' : isUnlocked ? 'text-gray-300' : 'text-gray-600'}`}
                                style={{ color: isActive ? w.projectileColor : undefined }}
                            >
                                {w.name.split(' ')[0]}
                            </span>
                            {w.ammo !== Infinity && (
                                <span className="text-xs text-gray-500 font-mono">{w.ammo}/{w.maxAmmo}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Level & Boss HP */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-black/60 backdrop-blur-sm px-6 py-2 text-center">
                    <span className="text-fuchsia-400 text-xs font-mono uppercase tracking-widest">
                        LEVEL {gs.currentLevel}
                    </span>
                </div>
            </div>

            {/* Boss Health Bar (when fighting boss) */}
            {
                gs.phase === GamePhase.BOSS_FIGHT && gs.boss.isActive && (
                    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-64">
                        <div className="bg-black/80 backdrop-blur-sm p-3 border-2 border-fuchsia-500">
                            <div className="text-center mb-2">
                                <span className="text-fuchsia-400 font-bold text-lg">{gs.boss.name}</span>
                            </div>
                            <div className="w-full h-4 bg-gray-900 border border-fuchsia-900">
                                <div
                                    className="h-full bg-gradient-to-r from-fuchsia-600 to-red-500 transition-all duration-300"
                                    style={{ width: `${(gs.boss.currentHp / gs.boss.maxHp) * 100}%` }}
                                />
                            </div>
                            <div className="text-center mt-1">
                                <span className="text-fuchsia-300 text-sm font-mono">
                                    {Math.ceil(gs.boss.currentHp)} / {gs.boss.maxHp}
                                </span>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Mobile Controls Hint */}
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-gray-500 text-xs font-mono">
                TAP left/right to move • TAP center to shoot
            </div>
        </div >
    );
};

export default HUD;
