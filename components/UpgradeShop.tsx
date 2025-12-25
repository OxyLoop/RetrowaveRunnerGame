import React, { useState } from 'react';
import { gameStateRef, startLevelFromShop } from '../state/gameState';
import { WeaponType, UpgradeType } from '../types';
import { UPGRADE_COSTS, COLORS } from '../constants';
import { Zap, Shield, Heart, Gauge, Crosshair, DollarSign } from 'lucide-react';

interface UpgradeItem {
    id: string;
    type: UpgradeType;
    name: string;
    description: string;
    icon: React.ReactNode;
    getCost: () => number;
    canPurchase: () => boolean;
    purchase: () => void;
    getLevel: () => number;
    maxLevel: number;
    weaponType?: WeaponType;
}

const UpgradeShop: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<'weapons' | 'player'>('weapons');
    const gs = gameStateRef.current;
    const player = gs.player;

    const weaponUpgrades: UpgradeItem[] = player.weapons.flatMap((weapon) => {
        if (!weapon.unlocked && weapon.type !== WeaponType.PISTOL) {
            // Unlock option
            const unlockCost = weapon.type === WeaponType.LASER ? UPGRADE_COSTS.UNLOCK_LASER
                : weapon.type === WeaponType.SHOTGUN ? UPGRADE_COSTS.UNLOCK_SHOTGUN
                    : UPGRADE_COSTS.UNLOCK_CANNON;

            return [{
                id: `unlock-${weapon.type}`,
                type: UpgradeType.UNLOCK_WEAPON,
                name: `Unlock ${weapon.name}`,
                description: 'Unlock this weapon',
                icon: <Crosshair className="w-6 h-6" />,
                getCost: () => unlockCost,
                canPurchase: () => player.currency >= unlockCost,
                purchase: () => {
                    if (player.currency >= unlockCost) {
                        player.currency -= unlockCost;
                        weapon.unlocked = true;
                    }
                },
                getLevel: () => weapon.unlocked ? 1 : 0,
                maxLevel: 1,
                weaponType: weapon.type,
            }];
        }

        if (!weapon.unlocked) return [];

        return [
            {
                id: `damage-${weapon.type}`,
                type: UpgradeType.WEAPON_DAMAGE,
                name: `${weapon.name} Damage`,
                description: '+20% damage per level',
                icon: <Crosshair className="w-6 h-6" />,
                getCost: () => UPGRADE_COSTS.WEAPON_DAMAGE[weapon.upgrades.damage] || 9999,
                canPurchase: () => weapon.upgrades.damage < 5 && player.currency >= UPGRADE_COSTS.WEAPON_DAMAGE[weapon.upgrades.damage],
                purchase: () => {
                    const cost = UPGRADE_COSTS.WEAPON_DAMAGE[weapon.upgrades.damage];
                    if (player.currency >= cost && weapon.upgrades.damage < 5) {
                        player.currency -= cost;
                        weapon.upgrades.damage++;
                    }
                },
                getLevel: () => weapon.upgrades.damage,
                maxLevel: 5,
                weaponType: weapon.type,
            },
            {
                id: `firerate-${weapon.type}`,
                type: UpgradeType.WEAPON_FIRE_RATE,
                name: `${weapon.name} Fire Rate`,
                description: '+15% fire rate per level',
                icon: <Gauge className="w-6 h-6" />,
                getCost: () => UPGRADE_COSTS.WEAPON_FIRE_RATE[weapon.upgrades.fireRate] || 9999,
                canPurchase: () => weapon.upgrades.fireRate < 5 && player.currency >= UPGRADE_COSTS.WEAPON_FIRE_RATE[weapon.upgrades.fireRate],
                purchase: () => {
                    const cost = UPGRADE_COSTS.WEAPON_FIRE_RATE[weapon.upgrades.fireRate];
                    if (player.currency >= cost && weapon.upgrades.fireRate < 5) {
                        player.currency -= cost;
                        weapon.upgrades.fireRate++;
                    }
                },
                getLevel: () => weapon.upgrades.fireRate,
                maxLevel: 5,
                weaponType: weapon.type,
            },
        ];
    });

    const playerUpgrades: UpgradeItem[] = [
        {
            id: 'max-health',
            type: UpgradeType.PLAYER_HEALTH,
            name: 'Max Health',
            description: '+25 max health per level',
            icon: <Heart className="w-6 h-6" />,
            getCost: () => {
                const level = Math.floor((player.maxHealth - 100) / 25);
                return UPGRADE_COSTS.PLAYER_HEALTH[level] || 9999;
            },
            canPurchase: () => {
                const level = Math.floor((player.maxHealth - 100) / 25);
                return level < 5 && player.currency >= (UPGRADE_COSTS.PLAYER_HEALTH[level] || 9999);
            },
            purchase: () => {
                const level = Math.floor((player.maxHealth - 100) / 25);
                const cost = UPGRADE_COSTS.PLAYER_HEALTH[level];
                if (player.currency >= cost && level < 5) {
                    player.currency -= cost;
                    player.maxHealth += 25;
                    player.health = player.maxHealth;
                }
            },
            getLevel: () => Math.floor((player.maxHealth - 100) / 25),
            maxLevel: 5,
        },
        {
            id: 'max-shield',
            type: UpgradeType.PLAYER_SHIELD,
            name: 'Shield Capacity',
            description: '+25 max shield per level',
            icon: <Shield className="w-6 h-6" />,
            getCost: () => {
                const level = Math.floor(player.maxShield / 25);
                return UPGRADE_COSTS.PLAYER_SHIELD[level] || 9999;
            },
            canPurchase: () => {
                const level = Math.floor(player.maxShield / 25);
                return level < 4 && player.currency >= (UPGRADE_COSTS.PLAYER_SHIELD[level] || 9999);
            },
            purchase: () => {
                const level = Math.floor(player.maxShield / 25);
                const cost = UPGRADE_COSTS.PLAYER_SHIELD[level];
                if (player.currency >= cost && level < 4) {
                    player.currency -= cost;
                    player.maxShield += 25;
                    player.shield = player.maxShield;
                }
            },
            getLevel: () => Math.floor(player.maxShield / 25),
            maxLevel: 4,
        },
        {
            id: 'speed',
            type: UpgradeType.PLAYER_SPEED,
            name: 'Movement Speed',
            description: '+10% speed per level',
            icon: <Zap className="w-6 h-6" />,
            getCost: () => {
                const level = Math.floor((player.speed - 1) * 10);
                return UPGRADE_COSTS.PLAYER_SPEED[level] || 9999;
            },
            canPurchase: () => {
                const level = Math.floor((player.speed - 1) * 10);
                return level < 4 && player.currency >= (UPGRADE_COSTS.PLAYER_SPEED[level] || 9999);
            },
            purchase: () => {
                const level = Math.floor((player.speed - 1) * 10);
                const cost = UPGRADE_COSTS.PLAYER_SPEED[level];
                if (player.currency >= cost && level < 4) {
                    player.currency -= cost;
                    player.speed += 0.1;
                }
            },
            getLevel: () => Math.floor((player.speed - 1) * 10),
            maxLevel: 4,
        },
    ];

    const currentUpgrades = selectedCategory === 'weapons' ? weaponUpgrades : playerUpgrades;

    const handleContinue = () => {
        startLevelFromShop();
    };

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 backdrop-blur-md">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-fuchsia-600 mb-2">
                    UPGRADE SHOP
                </h1>
                <p className="text-gray-400 font-mono">Level {gs.currentLevel} Complete!</p>
            </div>

            {/* Currency Display */}
            <div className="flex items-center gap-2 bg-yellow-900/30 border border-yellow-500/50 px-6 py-3 mb-6">
                <DollarSign className="w-6 h-6 text-yellow-400" />
                <span className="text-yellow-300 text-2xl font-bold font-mono">{player.currency}</span>
                <span className="text-yellow-500 text-sm">COINS</span>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setSelectedCategory('weapons')}
                    className={`px-6 py-2 font-bold text-sm transition-all ${selectedCategory === 'weapons'
                            ? 'bg-cyan-500 text-black'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                >
                    WEAPONS
                </button>
                <button
                    onClick={() => setSelectedCategory('player')}
                    className={`px-6 py-2 font-bold text-sm transition-all ${selectedCategory === 'player'
                            ? 'bg-fuchsia-500 text-black'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                >
                    PLAYER
                </button>
            </div>

            {/* Upgrades Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl max-h-64 overflow-y-auto p-4">
                {currentUpgrades.map((upgrade) => {
                    const level = upgrade.getLevel();
                    const cost = upgrade.getCost();
                    const canBuy = upgrade.canPurchase();
                    const isMaxed = level >= upgrade.maxLevel;

                    return (
                        <button
                            key={upgrade.id}
                            onClick={() => canBuy && upgrade.purchase()}
                            disabled={!canBuy}
                            className={`
                flex flex-col items-center p-4 border-2 transition-all
                ${isMaxed
                                    ? 'border-green-500/50 bg-green-900/20'
                                    : canBuy
                                        ? 'border-cyan-500/50 bg-cyan-900/20 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(0,255,255,0.3)]'
                                        : 'border-gray-700 bg-gray-900/50 opacity-60'
                                }
              `}
                        >
                            <div className={`mb-2 ${isMaxed ? 'text-green-400' : canBuy ? 'text-cyan-400' : 'text-gray-500'}`}>
                                {upgrade.icon}
                            </div>
                            <span className="text-white text-sm font-bold text-center">{upgrade.name}</span>
                            <span className="text-gray-400 text-xs text-center mt-1">{upgrade.description}</span>

                            {/* Level indicator */}
                            <div className="flex gap-1 mt-2">
                                {Array.from({ length: upgrade.maxLevel }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-2 h-2 ${i < level ? 'bg-cyan-400' : 'bg-gray-700'}`}
                                    />
                                ))}
                            </div>

                            {/* Cost */}
                            {!isMaxed && (
                                <span className={`mt-2 text-sm font-mono ${canBuy ? 'text-yellow-400' : 'text-gray-500'}`}>
                                    {cost} coins
                                </span>
                            )}
                            {isMaxed && (
                                <span className="mt-2 text-sm font-mono text-green-400">MAX</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Continue Button */}
            <button
                onClick={handleContinue}
                className="mt-8 px-10 py-4 bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-white font-bold text-xl hover:shadow-[0_0_30px_rgba(217,70,239,0.5)] transition-all"
            >
                CONTINUE TO LEVEL {gs.currentLevel + 1}
            </button>
        </div>
    );
};

export default UpgradeShop;
