/**
 * Crowd Runner Shooter - Game State
 * COUNT MASTERS STYLE with shooting
 */

export interface CrowdRunnerState {
    status: 'MENU' | 'RUNNING' | 'BOSS' | 'VICTORY' | 'GAMEOVER';
    distance: number;        // Forward progress
    playerX: number;         // Left/right position
    soldierCount: number;    // Army size (starts at 5)
    ammo: number;
    weaponLevel: number;     // 1-5 weapon upgrade level
    weaponDamage: number;
    score: number;
    wave: number;
    xp: number;          // Experience from kills
    maxXp: number;       // XP needed for next weapon level
    bossHp: number;      // Boss health
    bossMaxHp: number;   // Boss max health
}

export const crowdState: CrowdRunnerState = {
    status: 'MENU',
    distance: 0,
    playerX: 0,
    soldierCount: 1,
    ammo: 50,
    weaponLevel: 1,
    weaponDamage: 3,
    score: 0,
    wave: 1,
    xp: 0,
    maxXp: 100,
    bossHp: 2000,
    bossMaxHp: 2000,
};

export const FIRE_RATE = 5;

// Weapon models per level
export const WEAPON_NAMES = ['Pistol', 'SMG', 'Shotgun', 'Rifle', 'Minigun'];
export const WEAPON_COLORS = ['#666', '#888', '#aa6', '#6a6', '#c44'];

export const resetCrowdGame = () => {
    crowdState.status = 'MENU';
    crowdState.distance = 0;
    crowdState.playerX = 0;
    crowdState.soldierCount = 5;
    crowdState.ammo = 80;
    crowdState.weaponLevel = 1;
    crowdState.weaponDamage = 3;
    crowdState.score = 0;
    crowdState.wave = 1;
    crowdState.xp = 0;
    crowdState.maxXp = 100;
};

export const startCrowdGame = () => {
    resetCrowdGame();
    crowdState.status = 'RUNNING';
};

export const damagePlayer = (amount: number) => {
    crowdState.soldierCount = Math.max(0, crowdState.soldierCount - amount);
    if (crowdState.soldierCount <= 0) crowdState.status = 'GAMEOVER';
};

// Add soldiers
export const addSoldiers = (amount: number) => {
    crowdState.soldierCount = Math.min(200, crowdState.soldierCount + amount);
};

export const healPlayer = (amount: number) => {
    crowdState.soldierCount = Math.min(200, crowdState.soldierCount + amount);
};

export const reloadAmmo = (amount: number) => {
    crowdState.ammo = Math.min(500, crowdState.ammo + amount);
};

// Upgrade weapon
export const upgradeWeapon = () => {
    if (crowdState.weaponLevel < 5) {
        crowdState.weaponLevel++;
        crowdState.weaponDamage += 3;
    }
};

export const addXp = (amount: number) => {
    crowdState.xp += amount;

    // Level up if we have room
    if (crowdState.weaponLevel < 5 && crowdState.xp >= crowdState.maxXp) {
        crowdState.xp -= crowdState.maxXp;
        crowdState.maxXp = Math.floor(crowdState.maxXp * 1.5); // Increase requirement
        upgradeWeapon();
        return true; // Leveled up
    }
    return false;
};

export const addScore = (amount: number) => {
    crowdState.score += amount;
};

// Boss Arena Functions
export const triggerBoss = () => {
    crowdState.status = 'BOSS';
    crowdState.bossHp = 2000;
    crowdState.bossMaxHp = 2000;
};

export const triggerVictory = () => {
    crowdState.status = 'VICTORY';
    crowdState.score += 5000; // Boss kill bonus
};

export const damageBoss = (amount: number) => {
    crowdState.bossHp = Math.max(0, crowdState.bossHp - amount);
    if (crowdState.bossHp <= 0) {
        triggerVictory();
    }
};
