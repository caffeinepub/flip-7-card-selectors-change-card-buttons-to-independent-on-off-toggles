import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface GenericGameRules {
    scoringMethod: ScoringMethod;
    rulesSummary: string;
    gameEndCondition: string;
}
export type GameType = {
    __kind__: "flip7";
    flip7: {
        targetScore: bigint;
        scoringMethod: ScoringMethod;
        rulesSummary: string;
        gameEndCondition: string;
    };
} | {
    __kind__: "skyjo";
    skyjo: {
        scoringMethod: ScoringMethod;
        rulesSummary: string;
        gameEndCondition: string;
    };
} | {
    __kind__: "nerts";
    nerts: NertsRules;
} | {
    __kind__: "genericGame";
    genericGame: GenericGameRules;
} | {
    __kind__: "milleBornes";
    milleBornes: {
        scoringMethod: ScoringMethod;
        rulesSummary: string;
        gameEndCondition: string;
    };
};
export interface Fields__1 {
    id: bigint;
    gamesPlayed: bigint;
    owner: Principal;
    name: string;
    wins: bigint;
    totalScore: bigint;
    averageScore: bigint;
}
export interface Fields__2 {
    playerScores: Array<Fields>;
    roundNumber: bigint;
}
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
export interface PlayerScore {
    playerId: bigint;
    score: bigint;
}
export interface Fields {
    playerId: bigint;
    score: bigint;
}
export interface GameSession {
    id: bigint;
    owner: Principal;
    createdAt: bigint;
    isActive: boolean;
    players: Array<Fields__1>;
    finalScores?: Array<Fields>;
    flip7TargetScore?: bigint;
    gameType: GameType;
    rounds: Array<Fields__2>;
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
    createGameSession(gameType: GameType, playerIds: Array<bigint>, nertsWinTarget: bigint | null, flip7TargetScore: bigint | null): Promise<bigint>;
    createPlayerProfile(name: string): Promise<bigint>;
    getAllGameSessions(): Promise<Array<GameSession>>;
    getAllPlayerProfiles(): Promise<Array<PlayerProfile>>;
    getAllPlayerProfilesByGamesPlayed(): Promise<Array<PlayerProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getGameSession(gameId: bigint): Promise<GameSession>;
    getPlayerProfile(profileId: bigint): Promise<PlayerProfile>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateRound(gameId: bigint, roundNumber: bigint, scores: Array<PlayerScore>): Promise<void>;
}
