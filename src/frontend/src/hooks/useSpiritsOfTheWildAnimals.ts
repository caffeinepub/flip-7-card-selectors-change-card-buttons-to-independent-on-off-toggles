import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { SpiritsOfTheWildAnimal } from '../backend';

export function useSpiritsOfTheWildAnimals() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<SpiritsOfTheWildAnimal[]>({
    queryKey: ['spiritsOfTheWildAnimals'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSpiritsOfTheWildAnimals();
    },
    enabled: !!actor && !actorFetching,
  });
}
