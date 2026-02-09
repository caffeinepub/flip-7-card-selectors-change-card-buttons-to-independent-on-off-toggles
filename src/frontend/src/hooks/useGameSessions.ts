import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { GameSession, GameType, PlayerScore } from '../backend';

export function useGameSessions() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<GameSession[]>({
    queryKey: ['gameSessions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllGameSessions();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetGameSession(sessionId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<GameSession | null>({
    queryKey: ['gameSession', sessionId?.toString()],
    queryFn: async () => {
      if (!actor || !sessionId) return null;
      return actor.getGameSession(sessionId);
    },
    enabled: !!actor && !actorFetching && sessionId !== null,
  });
}

export function useCreateGameSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      gameType, 
      playerIds, 
      nertsWinTarget,
      flip7TargetScore
    }: { 
      gameType: GameType; 
      playerIds: bigint[];
      nertsWinTarget?: bigint;
      flip7TargetScore?: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createGameSession(gameType, playerIds, nertsWinTarget || null, flip7TargetScore || null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameSessions'] });
    },
  });
}

export function useAddRound() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      gameId,
      roundNumber,
      scores,
    }: {
      gameId: bigint;
      roundNumber: bigint;
      scores: PlayerScore[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addRound(gameId, roundNumber, scores);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gameSession', variables.gameId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['gameSessions'] });
    },
  });
}
