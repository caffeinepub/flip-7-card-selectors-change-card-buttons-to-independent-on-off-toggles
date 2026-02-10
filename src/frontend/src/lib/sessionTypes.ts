export interface QuickPlayer {
  tempId: string;
  name: string;
}

export interface SessionPlayer {
  id: bigint | string;
  name: string;
  isQuick: boolean;
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
  selectedCards: Map<string, number[]>; // player -> array of selected card values
  modifiers: Map<string, number[]>; // player -> array of modifier values (+4, +10)
  multipliers: Map<string, boolean>; // player -> x2 toggle
  manualScores: Map<string, number | null>; // player -> manual score or null
}

export interface GenericGameEntryState {
  playerScores: Map<string, number>;
}

export type RoundEntryState = 
  | { type: 'skyjo'; state: SkyjoEntryState }
  | { type: 'milleBornes'; state: MilleBornesEntryState }
  | { type: 'nerts'; state: NertsEntryState }
  | { type: 'flip7'; state: Flip7EntryState }
  | { type: 'genericGame'; state: GenericGameEntryState };

export interface LocalRound {
  roundNumber: number;
  scores: Map<string, number>;
  entryState?: RoundEntryState;
}

export interface LocalSession {
  gameType: 'skyjo' | 'milleBornes' | 'nerts' | 'flip7' | 'genericGame';
  players: SessionPlayer[];
  rounds: LocalRound[];
  isQuick: boolean;
  savedSessionId?: bigint;
  nertsWinTarget?: number;
  flip7TargetScore?: number;
}
