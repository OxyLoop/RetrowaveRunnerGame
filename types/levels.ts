import { LevelConfig, EnemyType } from './index';

export const LEVELS: LevelConfig[] = [
    {
        id: 1,
        name: 'NEON CITY',
        theme: 'city',
        distance: 400,
        enemyTypes: [EnemyType.DRONE],
        spawnRate: 0.5,
        bossName: 'MEGA BYTE',
        bossTaunt: 'Sistemden Kaçış Yok!',
        bossHealth: 350,
        backgroundColor: '#0a0515',
        fogColor: '#0a0515',
        // Retrowave city theme - purple/cyan
        primaryColor: '#ff00ff',
        secondaryColor: '#00ffff',
        sunColor: '#ff6600',
        gridColor: '#ff00ff',
    },
    {
        id: 2,
        name: 'CYBER OCEAN',
        theme: 'ocean',
        distance: 500,
        enemyTypes: [EnemyType.DRONE, EnemyType.TANK, EnemyType.ASTEROID],
        spawnRate: 0.7,
        bossName: 'DEEP WAVE',
        bossTaunt: 'Dalgalar Seni Yutacak!',
        bossHealth: 500,
        backgroundColor: '#050a15',
        fogColor: '#050a15',
        // Ocean retrowave - blue/teal
        primaryColor: '#00aaff',
        secondaryColor: '#00ffcc',
        sunColor: '#ff3366',
        gridColor: '#0066ff',
    },
    {
        id: 3,
        name: 'VOID NEBULA',
        theme: 'nebula',
        distance: 600,
        enemyTypes: [EnemyType.DRONE, EnemyType.TANK, EnemyType.GLITCH, EnemyType.ASTEROID],
        spawnRate: 0.9,
        bossName: 'NEBULA CORE',
        bossTaunt: 'Uzay Seni Yutacak!',
        bossHealth: 650,
        backgroundColor: '#100510',
        fogColor: '#100510',
        // Nebula - pink/purple
        primaryColor: '#ff0099',
        secondaryColor: '#9900ff',
        sunColor: '#ffcc00',
        gridColor: '#ff0066',
    },
    {
        id: 4,
        name: 'DIGITAL ABYSS',
        theme: 'abyss',
        distance: 700,
        enemyTypes: [EnemyType.DRONE, EnemyType.TANK, EnemyType.GLITCH],
        spawnRate: 1.0,
        bossName: 'GLITCH MASTER',
        bossTaunt: 'Son Boss: Game Over!',
        bossHealth: 800,
        backgroundColor: '#080008',
        fogColor: '#080008',
        // Final - red/orange apocalyptic
        primaryColor: '#ff0033',
        secondaryColor: '#ff6600',
        sunColor: '#ff0000',
        gridColor: '#ff3300',
    },
];

export const getLevelConfig = (levelId: number): LevelConfig => {
    const level = LEVELS.find(l => l.id === levelId);
    return level || LEVELS[0];
};

export const getTotalLevels = (): number => LEVELS.length;
