import type { LocalRound, SessionPlayer } from './sessionTypes';

export interface PlayerStanding {
  playerId: string;
  playerName: string;
  total: number;
}

export interface GameEndResult {
  isEnded: boolean;
  winner?: PlayerStanding;
}

export function getStandings(
  rounds: LocalRound[],
  players: SessionPlayer[],
  gameType: 'skyjo' | 'milleBornes' | 'nerts' | 'flip7' | 'genericGame'
): PlayerStanding[] {
  const totals = new Map<string, number>();

  players.forEach((player) => {
    const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
    totals.set(playerId, 0);
  });

  rounds.forEach((round) => {
    round.scores.forEach((score, playerId) => {
      const current = totals.get(playerId) || 0;
      totals.set(playerId, current + score);
    });
  });

  const standings: PlayerStanding[] = players.map((player) => {
    const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
    return {
      playerId,
      playerName: player.name,
      total: totals.get(playerId) || 0,
    };
  });

  if (gameType === 'flip7') {
    standings.sort((a, b) => b.total - a.total);
  } else {
    standings.sort((a, b) => a.total - b.total);
  }

  return standings;
}

export function checkGameEnd(
  standings: PlayerStanding[],
  gameType: 'skyjo' | 'milleBornes' | 'nerts' | 'flip7' | 'genericGame',
  nertsWinTarget?: number,
  flip7TargetScore?: number
): GameEndResult {
  if (gameType === 'nerts') {
    const target = nertsWinTarget || 200;
    const sortedByTotal = [...standings].sort((a, b) => b.total - a.total);
    const topPlayer = sortedByTotal[0];
    if (topPlayer && topPlayer.total >= target) {
      return { isEnded: true, winner: topPlayer };
    }
  } else if (gameType === 'flip7') {
    const target = flip7TargetScore || 100;
    const topPlayer = standings[0];
    if (topPlayer && topPlayer.total >= target) {
      return { isEnded: true, winner: topPlayer };
    }
  } else if (gameType === 'genericGame') {
    return { isEnded: false };
  }

  return { isEnded: false };
}
