import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PlayerPhase {
    currentPhase: bigint;
    playerId: bigint;
}
export interface GenericGameRules {
    scoringMethod: ScoringMethod;
    rulesSummary: string;
    gameEndCondition: string;
}
export type GameType = {
    __kind__: "flip7";
    flip7: Flip7Rules;
} | {
    __kind__: "skyjo";
    skyjo: SkyjoRules;
} | {
    __kind__: "nerts";
    nerts: NertsRules;
} | {
    __kind__: "genericGame";
    genericGame: GenericGameRules;
} | {
    __kind__: "milleBornes";
    milleBornes: MilleBornesRules;
} | {
    __kind__: "phase10";
    phase10: Phase10Rules;
};
export interface Phase10Rules {
    winTarget: bigint;
    scoringDetails: string;
    scoringMethod: ScoringMethod;
    rulesSummary: string;
    gameEndCondition: string;
}
export type Phase10Progress = Array<PlayerPhase>;
export interface NertsRules {
    winTarget: bigint;
    scoringDetails: string;
    scoringMethod: ScoringMethod;
    rulesSummary: string;
    gameEndCondition: string;
}
export interface PlayerProfile {
    id: bigint;
    gamesPlayed: bigint;
    owner: Principal;
    name: string;
    wins: bigint;
    totalScore: bigint;
    averageScore: bigint;
}
export interface Phase10Completion {
    playerId: bigint;
    completed: boolean;
}
export interface SpiritsOfTheWildAnimal {
    id: bigint;
    icon: string;
    name: string;
}
export interface SkyjoRules {
    scoringMethod: ScoringMethod;
    rulesSummary: string;
    gameEndCondition: string;
}
export interface MilleBornesRules {
    scoringMethod: ScoringMethod;
    rulesSummary: string;
    gameEndCondition: string;
}
export interface PlayerScore {
    playerId: bigint;
    score: bigint;
}
export interface Round {
    playerScores: Array<PlayerScore>;
    roundNumber: bigint;
}
export interface Flip7Rules {
    targetScore: bigint;
    scoringMethod: ScoringMethod;
    rulesSummary: string;
    gameEndCondition: string;
}
export interface GameSession {
    id: bigint;
    phase10WinTarget?: bigint;
    owner: Principal;
    createdAt: bigint;
    isActive: boolean;
    players: Array<PlayerProfile>;
    finalScores?: Array<PlayerScore>;
    flip7TargetScore?: bigint;
    gameType: GameType;
    rounds: Array<Round>;
    phase10Progress?: Phase10Progress;
    nertsWinTarget?: bigint;
}
export interface UserProfile {
    name: string;
    email?: string;
}
export enum ScoringMethod {
    roundBased = "roundBased",
    endOfGame = "endOfGame"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addRound(gameId: bigint, roundNumber: bigint, scores: Array<PlayerScore>): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createGameSession(gameType: GameType, playerIds: Array<bigint>, nertsWinTarget: bigint | null, flip7TargetScore: bigint | null, phase10WinTarget: bigint | null): Promise<bigint>;
    createPlayerProfile(name: string): Promise<bigint>;
    getAllGameSessions(): Promise<Array<GameSession>>;
    getAllPlayerProfiles(): Promise<Array<PlayerProfile>>;
    getAllPlayerProfilesByGamesPlayed(): Promise<Array<PlayerProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getGameSession(gameId: bigint): Promise<GameSession>;
    getPlayerProfile(profileId: bigint): Promise<PlayerProfile>;
    getSpiritsOfTheWildAnimals(): Promise<Array<SpiritsOfTheWildAnimal>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    selectSpiritsOfTheWildAnimal(gameId: bigint, playerId: bigint, animalId: bigint): Promise<void>;
    setActiveSpiritsOfTheWildAnimals(animalIds: Array<bigint>): Promise<void>;
    submitPhase10Round(gameId: bigint, roundNumber: bigint, scores: Array<PlayerScore>, phaseCompletions: Array<Phase10Completion>): Promise<void>;
    updateRound(gameId: bigint, roundNumber: bigint, scores: Array<PlayerScore>): Promise<void>;
}
