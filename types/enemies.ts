import { EnemyType, Enemy } from './index';

// Enemy base configurations
export const ENEMY_CONFIGS: Record<EnemyType, Omit<Enemy, 'id' | 'x' | 'y' | 'z' | 'isActive' | 'lastShot' | 'animOffset'>> = {
    [EnemyType.DRONE]: {
        type: EnemyType.DRONE,
        health: 30,
        maxHealth: 30,
        damage: 10,
        speed: 12,
        points: 10,
        canShoot: true,
        shootCooldown: 2000,
    },
    [EnemyType.TANK]: {
        type: EnemyType.TANK,
        health: 200,
        maxHealth: 200,
        damage: 20,
        speed: 5,
        points: 30,
        canShoot: true,
        shootCooldown: 3000,
    },
    [EnemyType.GLITCH]: {
        type: EnemyType.GLITCH,
        health: 80,
        maxHealth: 80,
        damage: 25,
        speed: 8,
        points: 25,
        canShoot: true,
        shootCooldown: 1500,
    },
    [EnemyType.BOSS]: {
        type: EnemyType.BOSS,
        health: 1500,
        maxHealth: 1500,
        damage: 30,
        speed: 0,
        points: 500,
        canShoot: true,
        shootCooldown: 800,
    },
    [EnemyType.ASTEROID]: {
        type: EnemyType.ASTEROID,
        health: 200,
        maxHealth: 200,
        damage: 40,
        speed: 0,
        points: 5,
        canShoot: false,
        shootCooldown: 0,
    },
    [EnemyType.PHANTOM]: {
        type: EnemyType.PHANTOM,
        health: 50,
        maxHealth: 50,
        damage: 35,
        speed: 18,              // Very fast
        points: 40,
        canShoot: false,        // Melee attacker
        shootCooldown: 0,
    },
    [EnemyType.BOMBER]: {
        type: EnemyType.BOMBER,
        health: 150,
        maxHealth: 150,
        damage: 25,             // Contact damage
        speed: 10,
        points: 35,
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

