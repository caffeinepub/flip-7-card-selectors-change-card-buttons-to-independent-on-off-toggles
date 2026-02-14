export interface QuickPlayer {
  tempId: string;
  name: string;
}

export interface SessionPlayer {
  id: bigint | string;
  name: string;
  isQuick: boolean;
  ownerPrincipal?: string;
}

// Per-game entry state types
export interface SkyjoEntryState {
  playerScores: Map<string, number>;
}

export interface MilleBornesEntryState {
  distance: Map<string, number>;
  tripCompleted: Map<string, boolean>;
  delayedAction: Map<string, boolean>;
  safeTrip: Map<string, boolean>;
  shutout: Map<string, boolean>;
  extensionTo1000: Map<string, boolean>;
  allSafeties: Map<string, boolean>;
  coupFourre: Map<string, number>;
  otherBonuses: Map<string, number>;
}

export interface NertsEntryState {
  centerCards: Map<string, number>;
  tableauCards: Map<string, number>;
}

export interface Flip7EntryState {
  selectedCards: Map<string, number[]>;
  modifiers: Map<string, number[]>;
  multipliers: Map<string, boolean>;
  manualScores: Map<string, number | null>;
}

export interface GenericGameEntryState {
  playerScores: Map<string, number>;
}

export interface Phase10EntryState {
  playerScores: Map<string, number>;
  phaseCompletions: Map<string, boolean>;
}

export interface SpiritsOwlEntryState {
  pair1: Map<string, [boolean, boolean]>;
  pair2: Map<string, [boolean, boolean]>;
  pair3: Map<string, [boolean, boolean]>;
  spiritStone: Map<string, boolean>;
}

export type RoundEntryState =
  | { type: 'skyjo'; state: SkyjoEntryState }
  | { type: 'milleBornes'; state: MilleBornesEntryState }
  | { type: 'nerts'; state: NertsEntryState }
  | { type: 'flip7'; state: Flip7EntryState }
  | { type: 'phase10'; state: Phase10EntryState }
  | { type: 'genericGame'; state: GenericGameEntryState }
  | { type: 'spiritsOwl'; state: SpiritsOwlEntryState };

export interface LocalRound {
  roundNumber: number;
  scores: Map<string, number>;
  entryState?: RoundEntryState;
}

export type GameType = 'skyjo' | 'milleBornes' | 'nerts' | 'flip7' | 'phase10' | 'genericGame' | 'spiritsOwl';

export interface LocalSession {
  gameType: GameType;
  players: SessionPlayer[];
  rounds: LocalRound[];
  isQuick: boolean;
  savedSessionId?: bigint;
  nertsWinTarget?: number;
  flip7TargetScore?: number;
  phase10WinTarget?: number;
  phase10Progress?: Map<string, number>;
  activeSpiritsAnimalIds?: bigint[];
}
