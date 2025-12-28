import { WeaponType, Weapon } from './index';

// Default weapon configurations
export const WEAPONS: Record<WeaponType, Omit<Weapon, 'upgrades'>> = {
    [WeaponType.PISTOL]: {
        type: WeaponType.PISTOL,
        name: 'Neon Pistol',
        damage: 10,
        fireRate: 4,           // 4 shots per second
        projectileSpeed: 80,
        projectileColor: '#00ffff',
        projectileSize: 0.15,
        ammo: Infinity,
        maxAmmo: Infinity,
        spread: 0,
        piercing: false,
        explosive: false,
        unlocked: true,
    },
    [WeaponType.LASER]: {
        type: WeaponType.LASER,
        name: 'Laser Beam',
        damage: 15,            // BUFFED: was 3
        fireRate: 25,          // BUFFED: faster beam
        projectileSpeed: 180,  // BUFFED: faster
        projectileColor: '#ff00ff',
        projectileSize: 0.15,
        ammo: 300,
        maxAmmo: 300,
        spread: 0,
        piercing: true,
        explosive: false,
        unlocked: false,
    },
    [WeaponType.SHOTGUN]: {
        type: WeaponType.SHOTGUN,
        name: 'Plasma Shotgun',
        damage: 25,            // BUFFED: was 8
        fireRate: 2.5,         // BUFFED: was 1.2
        projectileSpeed: 80,   // BUFFED: faster
        projectileColor: '#ffaa00',
        projectileSize: 0.2,   // Bigger
        ammo: 80,
        maxAmmo: 80,
        spread: 0.25,
        piercing: false,
        explosive: false,
        unlocked: false,
    },
    [WeaponType.CANNON]: {
        type: WeaponType.CANNON,
        name: 'Plasma Cannon',
        damage: 150,           // BUFFED: was 50
        fireRate: 1.0,         // BUFFED: was 0.5
        projectileSpeed: 60,   // BUFFED: faster
        projectileColor: '#ff0055',
        projectileSize: 0.6,   // Bigger
        ammo: 40,
        maxAmmo: 40,
        spread: 0,
        piercing: false,
        explosive: true,
        unlocked: false,
    },
    [WeaponType.RAILGUN]: {
        type: WeaponType.RAILGUN,
        name: 'Rail Gun',
        damage: 250,           // Very high damage
        fireRate: 0.5,         // Slow but deadly
        projectileSpeed: 300,  // Super fast
        projectileColor: '#00ff88',
        projectileSize: 0.25,
        ammo: 20,
        maxAmmo: 20,
        spread: 0,
        piercing: true,        // Goes through enemies
        explosive: false,
        unlocked: false,
    },
    [WeaponType.MINIGUN]: {
        type: WeaponType.MINIGUN,
        name: 'Neon Minigun',
        damage: 8,             // Low damage per bullet
        fireRate: 30,          // 30 bullets per second!
        projectileSpeed: 100,
        projectileColor: '#ffff00',
        projectileSize: 0.1,
        ammo: 500,
        maxAmmo: 500,
        spread: 0.15,          // Some spread
        piercing: false,
        explosive: false,
        unlocked: false,
    },
};

// Create a weapon instance with upgrade tracking
export const createWeapon = (type: WeaponType): Weapon => {
    const base = WEAPONS[type];
    return {
        ...base,
        upgrades: {
            damage: 0,
            fireRate: 0,
            ammo: 0,
        },
    };
};

// Get effective stats with upgrades applied
export const getWeaponStats = (weapon: Weapon) => {
    const damageMultiplier = 1 + weapon.upgrades.damage * 0.2;  // +20% per level
    const fireRateMultiplier = 1 + weapon.upgrades.fireRate * 0.15;  // +15% per level
    const ammoMultiplier = 1 + weapon.upgrades.ammo * 0.25;  // +25% per level

    return {
        damage: Math.floor(weapon.damage * damageMultiplier),
        fireRate: weapon.fireRate * fireRateMultiplier,
        maxAmmo: weapon.maxAmmo === Infinity ? Infinity : Math.floor(weapon.maxAmmo * ammoMultiplier),
    };
};
