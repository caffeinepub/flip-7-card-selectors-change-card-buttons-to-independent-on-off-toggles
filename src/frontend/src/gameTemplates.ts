import type { GameType as BackendGameType } from './backend';
import { ScoringMethod } from './backend';

export interface GameTemplate {
  id: 'skyjo' | 'milleBornes' | 'nerts' | 'flip7' | 'phase10' | 'genericGame' | 'spiritsOwl';
  name: string;
  icon: string;
  minPlayers: number;
  maxPlayers: number;
  rulesSummary: string;
  gameEndCondition: string;
}

export const GAME_TEMPLATES: Record<string, GameTemplate> = {
  skyjo: {
    id: 'skyjo',
    name: 'Skyjo',
    icon: '☁️',
    minPlayers: 2,
    maxPlayers: 8,
    rulesSummary:
      'Skyjo is a card game where players aim to have the lowest total score at the end of the game. Players take turns flipping cards, trying to minimize their row totals. The game ends when a player\'s row is fully flipped.',
    gameEndCondition:
      'The game ends when a player\'s row is fully flipped, and scores are calculated. The player with the lowest total score wins.',
  },
  milleBornes: {
    id: 'milleBornes',
    name: 'Mille Bornes',
    icon: '🚗',
    minPlayers: 2,
    maxPlayers: 6,
    rulesSummary:
      'Mille Bornes is a French card game where players attempt to complete a 1000 km journey. Players collect mileage cards to reach the goal, while also interrupting opponents with hazard cards.',
    gameEndCondition:
      'The first player or team to reach 1000 km wins the game. Points are awarded based on distance travelled and bonuses for specific achievements.',
  },
  nerts: {
    id: 'nerts',
    name: 'Nerts',
    icon: '🃏',
    minPlayers: 2,
    maxPlayers: 6,
    rulesSummary:
      'Nerts is a fast-paced, multi-player card game involving simultaneous solitaire-style play. Players race to clear their \'Nerts\' pile and aim for the highest score. +1 per card played into the center, -2 per card left in a player\'s tableau.',
    gameEndCondition:
      'Game ends when a player reaches the set win target points. Points are tallied at the end of each round until the target is met.',
  },
  flip7: {
    id: 'flip7',
    name: 'Flip 7',
    icon: '🎴',
    minPlayers: 2,
    maxPlayers: 6,
    rulesSummary:
      'Flip 7 is a fun and fast-paced card game similar to Nerts, but with a unique twist. Players race to be the first to reach 100 points by strategically flipping cards and playing quickly.',
    gameEndCondition: 'Game ends when a player reaches 100 total points.',
  },
  phase10: {
    id: 'phase10',
    name: 'Phase 10',
    icon: '🔟',
    minPlayers: 2,
    maxPlayers: 6,
    rulesSummary:
      'Phase 10 is a rummy-type card game where players compete to complete 10 different phases. Points are accumulated based on the cards left in hand when a player goes out. +5 for cards 1-9, +10 for cards 10-12, +15 for skip and reverse, and +25 for wild cards.',
    gameEndCondition:
      'The game ends when a player completes all 10 phases. The player with the lowest score when the first player completes phase 10 wins.',
  },
  genericGame: {
    id: 'genericGame',
    name: 'Generic Game',
    icon: '🎲',
    minPlayers: 1,
    maxPlayers: 12,
    rulesSummary:
      'A generic game allows for unlimited rounds with one numeric score per player per round. Totals are automatically computed from entered round scores. Ideal for tracking scores in various games.',
    gameEndCondition:
      'There is no automatic game end. The game continues until players decide to stop.',
  },
  spiritsOwl: {
    id: 'spiritsOwl',
    name: 'Spirits of the Wild (Owl)',
    icon: '🦉',
    minPlayers: 2,
    maxPlayers: 5,
    rulesSummary:
      'Spirits of the Wild is a strategic set collection game. The Owl spirit rewards collecting pairs of stones. Each completed pair (both stones collected) scores 3 points. The Spirit Stone doubles your total score for the round.',
    gameEndCondition:
      'The game continues for multiple rounds. The player with the highest total score at the end wins.',
  },
};

export function createGameType(gameId: string): BackendGameType {
  switch (gameId) {
    case 'skyjo':
      return {
        __kind__: 'skyjo',
        skyjo: {
          rulesSummary: GAME_TEMPLATES.skyjo.rulesSummary,
          gameEndCondition: GAME_TEMPLATES.skyjo.gameEndCondition,
          scoringMethod: ScoringMethod.roundBased,
        },
      };
    case 'milleBornes':
      return {
        __kind__: 'milleBornes',
        milleBornes: {
          rulesSummary: GAME_TEMPLATES.milleBornes.rulesSummary,
          gameEndCondition: GAME_TEMPLATES.milleBornes.gameEndCondition,
          scoringMethod: ScoringMethod.endOfGame,
        },
      };
    case 'nerts':
      return {
        __kind__: 'nerts',
        nerts: {
          rulesSummary: GAME_TEMPLATES.nerts.rulesSummary,
          gameEndCondition: GAME_TEMPLATES.nerts.gameEndCondition,
          scoringMethod: ScoringMethod.roundBased,
          scoringDetails:
            '+1 per card moved to the center stack. -2 per card remaining in player\'s tableau. Round-based scoring.',
          winTarget: BigInt(200),
        },
      };
    case 'flip7':
      return {
        __kind__: 'flip7',
        flip7: {
          rulesSummary: GAME_TEMPLATES.flip7.rulesSummary,
          gameEndCondition: GAME_TEMPLATES.flip7.gameEndCondition,
          scoringMethod: ScoringMethod.roundBased,
          targetScore: BigInt(100),
        },
      };
    case 'phase10':
      return {
        __kind__: 'phase10',
        phase10: {
          rulesSummary: GAME_TEMPLATES.phase10.rulesSummary,
          gameEndCondition: GAME_TEMPLATES.phase10.gameEndCondition,
          scoringMethod: ScoringMethod.roundBased,
          scoringDetails:
            '+5 for cards 1-9, +10 for cards 10-12, +15 for skip and reverse, +25 for wild cards. Round-based scoring.',
          winTarget: BigInt(0),
        },
      };
    case 'genericGame':
      return {
        __kind__: 'genericGame',
        genericGame: {
          rulesSummary: GAME_TEMPLATES.genericGame.rulesSummary,
          gameEndCondition: GAME_TEMPLATES.genericGame.gameEndCondition,
          scoringMethod: ScoringMethod.roundBased,
        },
      };
    case 'spiritsOwl':
      return {
        __kind__: 'genericGame',
        genericGame: {
          rulesSummary: GAME_TEMPLATES.spiritsOwl.rulesSummary,
          gameEndCondition: GAME_TEMPLATES.spiritsOwl.gameEndCondition,
          scoringMethod: ScoringMethod.roundBased,
        },
      };
    default:
      throw new Error(`Unknown game type: ${gameId}`);
  }
}

export function getGameTemplate(backendGameType: BackendGameType): GameTemplate {
  switch (backendGameType.__kind__) {
    case 'skyjo':
      return GAME_TEMPLATES.skyjo;
    case 'milleBornes':
      return GAME_TEMPLATES.milleBornes;
    case 'nerts':
      return GAME_TEMPLATES.nerts;
    case 'flip7':
      return GAME_TEMPLATES.flip7;
    case 'phase10':
      return GAME_TEMPLATES.phase10;
    case 'genericGame':
      // Check if this is actually Spirits of the Wild (Owl)
      if (isSpiritsOwlGame(backendGameType.genericGame)) {
        return GAME_TEMPLATES.spiritsOwl;
      }
      return GAME_TEMPLATES.genericGame;
    default:
      return GAME_TEMPLATES.genericGame;
  }
}

/**
 * Helper to detect if a genericGame backend type is actually Spirits of the Wild (Owl)
 * by comparing its rulesSummary and gameEndCondition against the Owl template
 */
export function isSpiritsOwlGame(genericGameRules: {
  rulesSummary: string;
  gameEndCondition: string;
}): boolean {
  const owlTemplate = GAME_TEMPLATES.spiritsOwl;
  return (
    genericGameRules.rulesSummary === owlTemplate.rulesSummary &&
    genericGameRules.gameEndCondition === owlTemplate.gameEndCondition
  );
}

/**
 * Derive the local game type from a backend GameType
 * This handles the special case where spiritsOwl is stored as genericGame in the backend
 */
export function deriveLocalGameType(
  backendGameType: BackendGameType
): 'skyjo' | 'milleBornes' | 'nerts' | 'flip7' | 'phase10' | 'genericGame' | 'spiritsOwl' {
  switch (backendGameType.__kind__) {
    case 'skyjo':
      return 'skyjo';
    case 'milleBornes':
      return 'milleBornes';
    case 'nerts':
      return 'nerts';
    case 'flip7':
      return 'flip7';
    case 'phase10':
      return 'phase10';
    case 'genericGame':
      if (isSpiritsOwlGame(backendGameType.genericGame)) {
        return 'spiritsOwl';
      }
      return 'genericGame';
    default:
      return 'genericGame';
  }
}
