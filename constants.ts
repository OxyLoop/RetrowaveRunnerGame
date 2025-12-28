export const TRACK_WIDTH = 12;          // Total width of the running area
export const LANE_WIDTH = 4;            // Width of one "lane" area
export const PLAYER_SPEED = 22;         // Units per second (Increased from 18)
export const STEER_SPEED = 14;          // Lateral movement speed
export const BOSS_DISTANCE = 300;       // Default, overridden by level config
export const GATE_SPAWN_INTERVAL = 50;  // Distance between gates

// Player Constants
export const PLAYER_START_HEALTH = 100;
export const PLAYER_START_SHIELD = 0;
export const PLAYER_INVULNERABLE_TIME = 1500; // ms after taking damage

// Enemy Constants
export const ENEMY_SPAWN_DISTANCE = 150;  // How far ahead to spawn enemies
export const ENEMY_DESPAWN_DISTANCE = 30; // How far behind to remove enemies
export const ENEMY_PROJECTILE_SPEED = 25;
export const ENEMY_PROJECTILE_DAMAGE = 10;

// Projectile Constants
export const PROJECTILE_DESPAWN_DISTANCE = 200;

// Visual Constants
export const CROWD_RADIUS = 0.3;
export const CROWD_SPREAD = 2;

// Upgrade Costs
export const UPGRADE_COSTS = {
    WEAPON_DAMAGE: [100, 200, 400, 800, 1500],
    WEAPON_FIRE_RATE: [150, 300, 600, 1200, 2000],
    WEAPON_AMMO: [50, 100, 200, 400, 800],
    PLAYER_HEALTH: [200, 400, 800, 1500, 3000],
    PLAYER_SHIELD: [300, 600, 1200, 2400],
    PLAYER_SPEED: [100, 200, 400, 800],
    UNLOCK_LASER: 500,
    UNLOCK_SHOTGUN: 1000,
    UNLOCK_CANNON: 2000,
};

// Colors
export const COLORS = {
    NEON_CYAN: '#00ffff',
    NEON_MAGENTA: '#ff00ff',
    NEON_YELLOW: '#ffff00',
    NEON_GREEN: '#00ff99',
    NEON_RED: '#ff0055',
    NEON_ORANGE: '#ffaa00',
    BACKGROUND: '#0b0618',
};

// Runner Mode Levels
export const RUNNER_LEVELS = [
    {
        id: 1,
        name: "CYBER STREETS",
        playerSpeed: 20,
        gateInterval: 45,
        duration: 60,
        bossHpMultiplier: 0.8,
        color: "#00ffff"
    },
    {
        id: 2,
        name: "DATA NEON",
        playerSpeed: 24,
        gateInterval: 40,
        duration: 60,
        bossHpMultiplier: 1.0,
        color: "#ff00ff"
    },
    {
        id: 3,
        name: "GRID VOID",
        playerSpeed: 28,
        gateInterval: 35,
        duration: 60,
        bossHpMultiplier: 1.2,
        color: "#ffff00"
    },
    {
        id: 4,
        name: "CORE SHUTDOWN",
        playerSpeed: 32,
        gateInterval: 30,
        duration: 60,
        bossHpMultiplier: 1.5,
        color: "#ff0000"
    }
];
