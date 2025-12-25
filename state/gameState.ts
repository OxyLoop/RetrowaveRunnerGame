import {
    GameState,
    GamePhase,
    WeaponType,
    Player,
    Boss,
    Enemy,
    Projectile,
    Particle
} from '../types';
import { createWeapon } from '../types/weapons';
import { getLevelConfig, getTotalLevels } from '../types/levels';
import { PLAYER_START_HEALTH, PLAYER_START_SHIELD, BOSS_DISTANCE } from '../constants';

// Create initial player state
const createInitialPlayer = (): Player => ({
    x: 0,
    y: 0.5,
    z: 0,
    health: PLAYER_START_HEALTH,
    maxHealth: PLAYER_START_HEALTH,
    shield: PLAYER_START_SHIELD,
    maxShield: 50,
    speed: 1,
    currency: 0,
    currentWeapon: WeaponType.PISTOL,
    weapons: [
        createWeapon(WeaponType.PISTOL),
        createWeapon(WeaponType.LASER),
        createWeapon(WeaponType.SHOTGUN),
        createWeapon(WeaponType.CANNON),
    ],
    lastShot: 0,
    isInvulnerable: false,
    invulnerableUntil: 0,
    rage: 0,
    shipType: 'default',
    velocity: { x: 0, y: 0, z: 0 },
    isJumping: false,
});

// Create initial boss state
const createInitialBoss = (levelId: number): Boss => {
    const level = getLevelConfig(levelId);
    return {
        name: level.bossName,
        taunt: level.bossTaunt,
        maxHp: level.bossHealth,
        currentHp: level.bossHealth,
        z: -level.distance - 50,
        isActive: false,
        phase: 0,
        lastAttack: 0,
    };
};

// Initial game state
const createInitialState = (levelId: number = 1): GameState => {
    const level = getLevelConfig(levelId);
    return {
        phase: GamePhase.MENU,
        currentLevel: levelId,
        totalLevels: getTotalLevels(),
        distance: 0,
        maxDistance: level.distance,
        player: createInitialPlayer(),
        enemies: [],
        powerUps: [],
        projectiles: [],
        particles: [],
        gates: [],
        boss: createInitialBoss(levelId),
        floatingTexts: [],
        input: {
            left: false,
            right: false,
            shoot: false,
        },
        isPaused: false,
        score: 0,
        highScore: parseInt(localStorage.getItem('neonHordeHighScore') || '0'),
        screenShake: 0,
        gameMode: 'SHOOTER',
        hyperCasual: undefined,
    };
};

// Global game state reference (for React Three Fiber compatibility)
export const gameStateRef: { current: GameState } = {
    current: createInitialState(),
};

// State actions
export const resetGame = (levelId: number = 1) => {
    const level = getLevelConfig(levelId);

    // Preserve player upgrades and currency if continuing
    const preservedPlayer = gameStateRef.current.player;
    // Preserve game mode settings
    const preservedGameMode = gameStateRef.current.gameMode;
    const preservedHyperCasual = gameStateRef.current.hyperCasual;

    console.log('[resetGame] BEFORE reset - gameMode:', preservedGameMode, 'hyperCasual:', preservedHyperCasual);

    gameStateRef.current = createInitialState(levelId);

    // Restore game mode
    gameStateRef.current.gameMode = preservedGameMode;
    gameStateRef.current.hyperCasual = preservedHyperCasual;

    console.log('[resetGame] AFTER restore - gameMode:', gameStateRef.current.gameMode);

    // Restore player progress if not level 1
    if (levelId > 1) {
        gameStateRef.current.player.currency = preservedPlayer.currency;
        gameStateRef.current.player.weapons = preservedPlayer.weapons;
        gameStateRef.current.player.maxHealth = preservedPlayer.maxHealth;
        gameStateRef.current.player.maxShield = preservedPlayer.maxShield;
        gameStateRef.current.player.speed = preservedPlayer.speed;
    }

    gameStateRef.current.player.health = gameStateRef.current.player.maxHealth;
    gameStateRef.current.player.shield = gameStateRef.current.player.maxShield;
};

export const startGame = () => {
    gameStateRef.current.phase = GamePhase.RUNNING;
};

export const pauseGame = () => {
    gameStateRef.current.isPaused = true;
};

export const resumeGame = () => {
    gameStateRef.current.isPaused = false;
};

export const addEnemy = (enemy: Enemy) => {
    gameStateRef.current.enemies.push(enemy);
};

export const removeEnemy = (id: number) => {
    gameStateRef.current.enemies = gameStateRef.current.enemies.filter(e => e.id !== id);
};

export const addProjectile = (projectile: Projectile) => {
    gameStateRef.current.projectiles.push(projectile);
};

export const removeProjectile = (id: number) => {
    gameStateRef.current.projectiles = gameStateRef.current.projectiles.filter(p => p.id !== id);
};

export const addParticle = (particle: Particle) => {
    gameStateRef.current.particles.push(particle);
};

export const damagePlayer = (damage: number) => {
    const player = gameStateRef.current.player;

    if (player.isInvulnerable) return;

    // Shield absorbs damage first
    if (player.shield > 0) {
        const shieldDamage = Math.min(player.shield, damage);
        player.shield -= shieldDamage;
        damage -= shieldDamage;
    }

    player.health -= damage;

    if (player.health <= 0) {
        player.health = 0;
        gameStateRef.current.phase = GamePhase.GAME_OVER;
        gameStateRef.current.screenShake = 1.0; // Big shake on death
    } else {
        // Brief invulnerability
        player.isInvulnerable = true;
        player.invulnerableUntil = Date.now() + 1500;
        // Screen shake on hit (subtle)
        gameStateRef.current.screenShake = Math.min(1, gameStateRef.current.screenShake + 0.3);
    }
};

export const damageEnemy = (enemyId: number, damage: number): boolean => {
    const enemy = gameStateRef.current.enemies.find(e => e.id === enemyId);
    if (!enemy) return false;

    enemy.health -= damage;

    if (enemy.health <= 0) {
        // Award points
        gameStateRef.current.player.currency += enemy.points;
        gameStateRef.current.score += enemy.points;

        // Add rage (ultimate meter)
        gameStateRef.current.player.rage = Math.min(100, (gameStateRef.current.player.rage || 0) + 8);

        // Update high score
        if (gameStateRef.current.score > gameStateRef.current.highScore) {
            gameStateRef.current.highScore = gameStateRef.current.score;
            localStorage.setItem('neonHordeHighScore', gameStateRef.current.score.toString());
        }

        removeEnemy(enemyId);
        return true; // enemy died
    }

    return false; // enemy still alive
};

export const damageBoss = (damage: number): boolean => {
    const boss = gameStateRef.current.boss;
    if (!boss.isActive) return false;

    boss.currentHp -= damage;

    if (boss.currentHp <= 0) {
        boss.currentHp = 0;

        // Check if final level
        if (gameStateRef.current.currentLevel >= gameStateRef.current.totalLevels) {
            gameStateRef.current.phase = GamePhase.VICTORY;
        } else {
            gameStateRef.current.phase = GamePhase.LEVEL_COMPLETE;
        }

        // Award boss points
        gameStateRef.current.player.currency += 200;
        gameStateRef.current.score += 500;

        return true;
    }

    return false;
};

export const switchWeapon = (weaponType: WeaponType) => {
    const weapon = gameStateRef.current.player.weapons.find(w => w.type === weaponType);
    if (weapon && weapon.unlocked) {
        gameStateRef.current.player.currentWeapon = weaponType;
    }
};

export const getCurrentWeapon = () => {
    const player = gameStateRef.current.player;
    return player.weapons.find(w => w.type === player.currentWeapon)!;
};

export const nextLevel = () => {
    const nextLevelId = gameStateRef.current.currentLevel + 1;
    if (nextLevelId <= gameStateRef.current.totalLevels) {
        resetGame(nextLevelId);
        gameStateRef.current.phase = GamePhase.UPGRADE_SHOP;
    }
};

export const startLevelFromShop = () => {
    gameStateRef.current.phase = GamePhase.RUNNING;
};
