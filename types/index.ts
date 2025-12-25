// ===== GAME PHASES =====
export enum GamePhase {
    MENU = 'MENU',
    RUNNING = 'RUNNING',
    BOSS_FIGHT = 'BOSS_FIGHT',
    GAME_OVER = 'GAME_OVER',
    VICTORY = 'VICTORY',
    UPGRADE_SHOP = 'UPGRADE_SHOP',
    LEVEL_COMPLETE = 'LEVEL_COMPLETE'
}

// ===== WEAPONS =====
export enum WeaponType {
    PISTOL = 'PISTOL',
    LASER = 'LASER',
    SHOTGUN = 'SHOTGUN',
    CANNON = 'CANNON'
}

export interface Weapon {
    type: WeaponType;
    name: string;
    damage: number;
    fireRate: number;       // shots per second
    projectileSpeed: number;
    projectileColor: string;
    projectileSize: number;
    ammo: number;
    maxAmmo: number;
    spread: number;         // for shotgun
    piercing: boolean;      // for laser
    explosive: boolean;     // for cannon
    unlocked: boolean;
    upgrades: {
        damage: number;       // upgrade level 0-5
        fireRate: number;
        ammo: number;
    };
}

// ===== PROJECTILES =====
export interface Projectile {
    id: number;
    x: number;
    y: number;
    z: number;
    vx: number;             // velocity
    vy: number;
    vz: number;
    damage: number;
    color: string;
    size: number;
    piercing: boolean;
    explosive: boolean;
    fromEnemy: boolean;     // true if enemy projectile
}

// ===== ENEMIES =====
export enum EnemyType {
    DRONE = 'DRONE',
    TANK = 'TANK',
    GLITCH = 'GLITCH',
    BOSS = 'BOSS',
    ASTEROID = 'ASTEROID'
}

export interface Enemy {
    id: number;
    type: EnemyType;
    x: number;
    y: number;
    z: number;
    health: number;
    maxHealth: number;
    damage: number;
    speed: number;
    points: number;         // currency when killed
    canShoot: boolean;
    shootCooldown: number;
    lastShot: number;
    isActive: boolean;
    animOffset: number;
}

// ===== PLAYER =====
export interface Player {
    x: number;
    y: number;
    z: number;
    health: number;
    maxHealth: number;
    shield: number;
    maxShield: number;
    speed: number;
    currency: number;
    currentWeapon: WeaponType;
    weapons: Weapon[];
    lastShot: number;
    isInvulnerable: boolean;
    invulnerableUntil: number;
    damageBoostUntil?: number;
    speedBoostUntil?: number;
    clonesActive?: boolean;
    clonesUntil?: number;
    rage?: number;          // 0-100, ultimate bar
    shipType?: string;      // Ship skin
    // Physics
    velocity?: { x: number; y: number; z: number };
    isJumping?: boolean;
}

// ===== LEVELS =====
export interface LevelConfig {
    id: number;
    name: string;
    theme: string;
    distance: number;       // how far to travel
    enemyTypes: EnemyType[];
    spawnRate: number;      // enemies per second
    bossName: string;
    bossTaunt: string;
    bossHealth: number;
    backgroundColor: string;
    fogColor: string;
    // Theme colors
    primaryColor?: string;
    secondaryColor?: string;
    sunColor?: string;
    gridColor?: string;
}

// ===== UPGRADES =====
export enum UpgradeType {
    WEAPON_DAMAGE = 'WEAPON_DAMAGE',
    WEAPON_FIRE_RATE = 'WEAPON_FIRE_RATE',
    WEAPON_AMMO = 'WEAPON_AMMO',
    PLAYER_HEALTH = 'PLAYER_HEALTH',
    PLAYER_SHIELD = 'PLAYER_SHIELD',
    PLAYER_SPEED = 'PLAYER_SPEED',
    UNLOCK_WEAPON = 'UNLOCK_WEAPON'
}

export interface Upgrade {
    type: UpgradeType;
    name: string;
    description: string;
    cost: number;
    maxLevel: number;
    currentLevel: number;
    weaponType?: WeaponType;  // for weapon-specific upgrades
}

// ===== PARTICLES (visual effects) =====
export interface Particle {
    id: number;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    color: string;
    size: number;
    life: number;
    maxLife: number;
}

// ===== MATH GATES (keeping for hybrid gameplay) =====
export enum GateOperation {
    ADD = 'ADD',
    SUBTRACT = 'SUBTRACT',
    MULTIPLY = 'MULTIPLY',
    DIVIDE = 'DIVIDE'
}

export interface Gate {
    id: number;
    z: number;
    x: number;
    width: number;
    operation: GateOperation;
    value: number;
    color: string;
    hit: boolean;
}

// ===== BOSS =====
export interface Boss {
    name: string;
    taunt: string;
    maxHp: number;
    currentHp: number;
    z: number;
    isActive: boolean;
    phase: number;          // boss attack phase
    lastAttack: number;
}

// ===== POWERUPS =====
export enum PowerUpType {
    DAMAGE_BOOST = 'DAMAGE_BOOST',
    SPEED_BOOST = 'SPEED_BOOST',
    SHIELD_BOOST = 'SHIELD_BOOST',
    CLONES = 'CLONES',
    AMMO_REFILL = 'AMMO_REFILL'
}

export interface PowerUp {
    id: number;
    type: PowerUpType;
    x: number;
    y: number;
    z: number;
    active: boolean;
}

// ===== FULL GAME STATE =====
export interface GameState {
    phase: GamePhase;
    currentLevel: number;
    totalLevels: number;
    distance: number;
    maxDistance: number;
    player: Player;
    enemies: Enemy[];
    powerUps: PowerUp[];    // Add this
    projectiles: Projectile[];
    particles: Particle[];
    gates: Gate[];
    boss: Boss;
    floatingTexts: FloatingText[]; // Add floating texts
    input: {
        left: boolean;
        right: boolean;
        shoot: boolean;
    };
    isPaused: boolean;
    score: number;
    highScore: number;
    screenShake: number;
    gameMode?: 'SHOOTER' | 'HYPER_CASUAL';
    hyperCasual?: {
        soldierCount: number;
        gatesCleared: number;
        isFinished: boolean;
    };
}

export interface FloatingText {
    id: number;
    x: number;
    y: number;
    z: number;
    text: string;
    color: string;
    life: number; // 0 to 1
    maxLife: number;
    vy: number; // float up speed
}
