/**
 * Crowd Runner Shooter - Game State
 * COUNT MASTERS STYLE with shooting
 */

export interface CrowdRunnerState {
    status: 'MENU' | 'RUNNING' | 'GAMEOVER';
    distance: number;        // Forward progress
    playerX: number;         // Left/right position
    soldierCount: number;    // Army size (starts at 5)
    ammo: number;
    weaponLevel: number;     // 1-5 weapon upgrade level
    weaponDamage: number;
    score: number;
    wave: number;
}

export const crowdState: CrowdRunnerState = {
    status: 'MENU',
    distance: 0,
    playerX: 0,
    soldierCount: 1,         // Start with 1 soldier
    ammo: 50,
    weaponLevel: 1,
    weaponDamage: 3,
    score: 0,
    wave: 1,
};

export const FIRE_RATE = 5;

// Weapon models per level
export const WEAPON_NAMES = ['Pistol', 'SMG', 'Shotgun', 'Rifle', 'Minigun'];
export const WEAPON_COLORS = ['#666', '#888', '#aa6', '#6a6', '#c44'];

export const resetCrowdGame = () => {
    crowdState.status = 'MENU';
    crowdState.distance = 0;
    crowdState.playerX = 0;
    crowdState.soldierCount = 1;
    crowdState.ammo = 80;
    crowdState.weaponLevel = 1;
    crowdState.weaponDamage = 3;
    crowdState.score = 0;
    crowdState.wave = 1;
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

export const increaseDamage = (amount: number) => {
    crowdState.weaponDamage += amount;
};

export const addScore = (amount: number) => {
    crowdState.score += amount;
};
