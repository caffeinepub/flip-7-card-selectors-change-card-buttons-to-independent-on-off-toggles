export interface QuickPlayer {
  tempId: string;
  name: string;
}

export interface SessionPlayer {
  id: bigint | string;
  name: string;
  isQuick: boolean;
}

export interface LocalRound {
  roundNumber: number;
  scores: Map<string, number>;
}

export interface LocalSession {
  gameType: 'skyjo' | 'milleBornes' | 'nerts' | 'flip7';
  players: SessionPlayer[];
  rounds: LocalRound[];
  isQuick: boolean;
  savedSessionId?: bigint;
  nertsWinTarget?: number;
  flip7TargetScore?: number;
}
