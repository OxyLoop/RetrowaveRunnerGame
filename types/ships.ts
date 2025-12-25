// Ship types with different stats
export interface ShipConfig {
    id: string;
    name: string;
    description: string;
    color: string;
    accentColor: string;
    speedMod: number;      // Speed multiplier
    healthMod: number;     // Health multiplier
    damageMod: number;     // Damage multiplier
    unlocked: boolean;
    cost: number;
}

export const SHIPS: ShipConfig[] = [
    {
        id: 'default',
        name: 'FALCON',
        description: 'Dengeli gemi',
        color: '#00ffff',
        accentColor: '#ff00ff',
        speedMod: 1.0,
        healthMod: 1.0,
        damageMod: 1.0,
        unlocked: true,
        cost: 0,
    },
    {
        id: 'speeder',
        name: 'PHANTOM',
        description: 'Hızlı ama kırılgan',
        color: '#ffff00',
        accentColor: '#ff6600',
        speedMod: 1.5,
        healthMod: 0.7,
        damageMod: 0.9,
        unlocked: false,
        cost: 500,
    },
    {
        id: 'tank',
        name: 'TITAN',
        description: 'Yavaş ama dayanıklı',
        color: '#ff0066',
        accentColor: '#00ffcc',
        speedMod: 0.7,
        healthMod: 1.5,
        damageMod: 1.1,
        unlocked: false,
        cost: 750,
    },
    {
        id: 'striker',
        name: 'VIPER',
        description: 'Yüksek hasar',
        color: '#00ff66',
        accentColor: '#ff00ff',
        speedMod: 0.9,
        healthMod: 0.8,
        damageMod: 1.5,
        unlocked: false,
        cost: 1000,
    },
];

export const getShipConfig = (shipId: string): ShipConfig => {
    return SHIPS.find(s => s.id === shipId) || SHIPS[0];
};

export const getUnlockedShips = (): ShipConfig[] => {
    const saved = localStorage.getItem('unlockedShips');
    if (saved) {
        const unlockedIds = JSON.parse(saved) as string[];
        return SHIPS.map(s => ({
            ...s,
            unlocked: s.id === 'default' || unlockedIds.includes(s.id)
        }));
    }
    return SHIPS;
};

export const unlockShip = (shipId: string): boolean => {
    const saved = localStorage.getItem('unlockedShips');
    const unlockedIds = saved ? JSON.parse(saved) as string[] : ['default'];

    if (!unlockedIds.includes(shipId)) {
        unlockedIds.push(shipId);
        localStorage.setItem('unlockedShips', JSON.stringify(unlockedIds));
        return true;
    }
    return false;
};

export const getSelectedShip = (): string => {
    return localStorage.getItem('selectedShip') || 'default';
};

export const setSelectedShip = (shipId: string): void => {
    localStorage.setItem('selectedShip', shipId);
};
