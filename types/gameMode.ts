// Game Mode Types
export enum GameMode {
    SHOOTER = 'SHOOTER',
    HYPER_CASUAL = 'HYPER_CASUAL',
}

export interface HyperCasualState {
    soldierCount: number;
    gatesCleared: number;
    isFinished: boolean;
}

export const createInitialHyperCasualState = (): HyperCasualState => ({
    soldierCount: 10,
    gatesCleared: 0,
    isFinished: false,
});
