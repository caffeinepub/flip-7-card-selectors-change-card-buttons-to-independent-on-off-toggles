import type { SessionPlayer, LocalRound } from './sessionTypes';

export interface PlayerTotal {
  playerId: string;
  playerName: string;
  total: number;
  rounds: number[];
}

export function calculateTotals(players: SessionPlayer[], rounds: LocalRound[]): PlayerTotal[] {
  return players.map((player) => {
    const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
    const roundScores = rounds.map((round) => round.scores.get(playerId) || 0);
    const total = roundScores.reduce((sum, score) => sum + score, 0);

    return {
      playerId,
      playerName: player.name,
      total,
      rounds: roundScores,
    };
  });
}

export function getStandings(totals: PlayerTotal[], gameType: 'skyjo' | 'milleBornes' | 'nerts' | 'flip7'): PlayerTotal[] {
  const sorted = [...totals].sort((a, b) => {
    if (gameType === 'skyjo') {
      return a.total - b.total; // Lower is better
    } else {
      return b.total - a.total; // Higher is better (Mille Bornes, Nerts, and Flip 7)
    }
  });
  return sorted;
}

export function checkGameEnd(
  totals: PlayerTotal[], 
  gameType: 'skyjo' | 'milleBornes' | 'nerts' | 'flip7',
  nertsWinTarget?: number,
  flip7TargetScore?: number
): {
  isEnded: boolean;
  winner?: PlayerTotal;
} {
  if (gameType === 'skyjo') {
    const maxScore = Math.max(...totals.map((t) => t.total));
    if (maxScore >= 200) {
      const standings = getStandings(totals, gameType);
      return { isEnded: true, winner: standings[0] };
    }
  } else if (gameType === 'nerts') {
    const target = nertsWinTarget || 200;
    const maxScore = Math.max(...totals.map((t) => t.total));
    if (maxScore >= target) {
      const standings = getStandings(totals, gameType);
      return { isEnded: true, winner: standings[0] };
    }
  } else if (gameType === 'flip7') {
    const target = flip7TargetScore || 100;
    const maxScore = Math.max(...totals.map((t) => t.total));
    if (maxScore >= target) {
      const standings = getStandings(totals, gameType);
      return { isEnded: true, winner: standings[0] };
    }
  }
  return { isEnded: false };
}
