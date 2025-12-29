import { EnemyType, Enemy } from './index';

// Enemy base configurations
export const ENEMY_CONFIGS: Record<EnemyType, Omit<Enemy, 'id' | 'x' | 'y' | 'z' | 'isActive' | 'lastShot' | 'animOffset'>> = {
    [EnemyType.DRONE]: {
        type: EnemyType.DRONE,
        health: 80, // Was 30
        maxHealth: 100,
        damage: 15,
        speed: 12,
        points: 20,
        canShoot: true,
        shootCooldown: 2000,
    },
    [EnemyType.TANK]: {
        type: EnemyType.TANK,
        health: 400, // Was 200
        maxHealth: 800,
        damage: 20,
        speed: 5,
        points: 80,
        canShoot: true,
        shootCooldown: 3000,
    },
    [EnemyType.GLITCH]: {
        type: EnemyType.GLITCH,
        health: 1700, // Was 80
        maxHealth: 250,
        damage: 25,
        speed: 8,
        points: 50,
        canShoot: true,
        shootCooldown: 1500,
    },
    [EnemyType.BOSS]: {
        type: EnemyType.BOSS,
        health: 6000,
        maxHealth: 6000,
        damage: 50,
        speed: 0,
        points: 500,
        canShoot: true,
        shootCooldown: 800,
    },
    [EnemyType.ASTEROID]: {
        type: EnemyType.ASTEROID,
        health: 300, // Was 200
        maxHealth: 300,
        damage: 40,
        speed: 0,
        points: 10,
        canShoot: false,
        shootCooldown: 0,
    },
    [EnemyType.PHANTOM]: {
        type: EnemyType.PHANTOM,
        health: 150, // Was 50
        maxHealth: 150,
        damage: 35,
        speed: 18,              // Very fast
        points: 60,
        canShoot: false,        // Melee attacker
        shootCooldown: 0,
    },
    [EnemyType.BOMBER]: {
        type: EnemyType.BOMBER,
        health: 400, // Was 150
        maxHealth: 400,
        damage: 25,             // Contact damage
        speed: 10,
        points: 70,
        canShoot: false,
        shootCooldown: 0,
        // Note: Explosion damage is handled separately in Enemies.tsx
    },
};

// Create an enemy instance
let enemyIdCounter = 0;
export const createEnemy = (type: EnemyType, x: number, z: number, levelMultiplier: number = 1): Enemy => {
    const config = ENEMY_CONFIGS[type];
    return {
        ...config,
        id: ++enemyIdCounter,
        x,
        y: type === EnemyType.DRONE ? 2 : 0.5,  // drones fly higher
        z,
        health: Math.floor(config.health * levelMultiplier),
        maxHealth: Math.floor(config.maxHealth * levelMultiplier),
        isActive: true,
        lastShot: 0,
        animOffset: Math.random() * Math.PI * 2,
    };
};

// Reset enemy ID counter (for new game)
export const resetEnemyIds = () => {
    enemyIdCounter = 0;
};

