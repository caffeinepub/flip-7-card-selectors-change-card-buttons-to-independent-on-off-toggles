import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { PlayerProfile } from '../backend';

export function usePlayerProfiles() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<PlayerProfile[]>({
    queryKey: ['playerProfiles'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPlayerProfiles();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useCreatePlayerProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createPlayerProfile(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerProfiles'] });
    },
  });
}

export function useGetPlayerProfile(profileId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<PlayerProfile | null>({
    queryKey: ['playerProfile', profileId?.toString()],
    queryFn: async () => {
      if (!actor || !profileId) return null;
      return actor.getPlayerProfile(profileId);
    },
    enabled: !!actor && !actorFetching && profileId !== null,
  });
}
