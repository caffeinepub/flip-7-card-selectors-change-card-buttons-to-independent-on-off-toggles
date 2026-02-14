import type { LocalRound, SessionPlayer } from './sessionTypes';

export interface PlayerStanding {
  playerId: string;
  playerName: string;
  total: number;
}

export interface GameEndResult {
  isEnded: boolean;
  winners: PlayerStanding[];
}

export function getStandings(
  rounds: LocalRound[],
  players: SessionPlayer[],
  gameType: 'skyjo' | 'milleBornes' | 'nerts' | 'flip7' | 'phase10' | 'genericGame' | 'spiritsOwl',
  phase10Progress?: Map<string, number>
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

  if (gameType === 'phase10') {
    // Phase 10: Sort by phase (desc), then total score (asc), then playerId for deterministic ordering
    standings.sort((a, b) => {
      const phaseA = phase10Progress?.get(a.playerId) || 1;
      const phaseB = phase10Progress?.get(b.playerId) || 1;
      
      // Higher phase first
      if (phaseB !== phaseA) {
        return phaseB - phaseA;
      }
      
      // Lower score wins
      if (a.total !== b.total) {
        return a.total - b.total;
      }
      
      // Deterministic tie-break by playerId
      return a.playerId.localeCompare(b.playerId);
    });
  } else if (gameType === 'flip7' || gameType === 'nerts' || gameType === 'milleBornes' || gameType === 'spiritsOwl') {
    standings.sort((a, b) => b.total - a.total);
  } else {
    standings.sort((a, b) => a.total - b.total);
  }

  return standings;
}

export function checkGameEnd(
  standings: PlayerStanding[],
  gameType: 'skyjo' | 'milleBornes' | 'nerts' | 'flip7' | 'phase10' | 'genericGame' | 'spiritsOwl',
  nertsWinTarget?: number,
  flip7TargetScore?: number,
  phase10WinTarget?: number
): GameEndResult {
  if (gameType === 'nerts' && nertsWinTarget !== undefined) {
    const topScore = standings[0]?.total || 0;
    if (topScore >= nertsWinTarget) {
      const winners = standings.filter(s => s.total === topScore);
      return { isEnded: true, winners };
    }
  }

  if (gameType === 'flip7' && flip7TargetScore !== undefined) {
    const topScore = standings[0]?.total || 0;
    if (topScore >= flip7TargetScore) {
      const winners = standings.filter(s => s.total === topScore);
      return { isEnded: true, winners };
    }
  }

  if (gameType === 'phase10' && phase10WinTarget !== undefined && phase10WinTarget > 0) {
    const topScore = standings[0]?.total || 0;
    if (topScore >= phase10WinTarget) {
      const winners = standings.filter(s => s.total === topScore);
      return { isEnded: true, winners };
    }
  }

  return { isEnded: false, winners: [] };
}
