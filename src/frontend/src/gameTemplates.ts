import type { GameType } from './backend';
import { ScoringMethod } from './backend';

export interface GameTemplate {
  id: 'skyjo' | 'milleBornes' | 'nerts' | 'flip7' | 'genericGame';
  name: string;
  rulesSummary: string;
  gameEndCondition: string;
  scoringMethod: 'roundBased' | 'endOfGame';
  icon: string;
  minPlayers: number;
  maxPlayers: number;
}

export const GAME_TEMPLATES: Record<string, GameTemplate> = {
  skyjo: {
    id: 'skyjo',
    name: 'Skyjo',
    rulesSummary:
      'Players aim for the lowest score by flipping and replacing cards in their grid. Each round ends when one player reveals all cards.',
    gameEndCondition: 'First player to reach 200 points loses. Lowest score wins.',
    scoringMethod: 'roundBased',
    icon: '🎴',
    minPlayers: 2,
    maxPlayers: 8,
  },
  milleBornes: {
    id: 'milleBornes',
    name: 'Mille Bornes',
    rulesSummary:
      'Race to 1000 km (700 km in 2-player) by playing distance cards while using hazards to slow opponents. Safety cards provide protection and bonuses.',
    gameEndCondition: 'First to 1000 km wins (700 km in 2-player, with optional extension to 1000 km). Bonus points for safeties, coup-fourré, and special achievements.',
    scoringMethod: 'endOfGame',
    icon: '🏁',
    minPlayers: 2,
    maxPlayers: 6,
  },
  nerts: {
    id: 'nerts',
    name: 'Nerts',
    rulesSummary:
      'Fast-paced simultaneous solitaire where players race to play cards to shared center piles. Score +1 per card played to center, -2 per card left in your tableau.',
    gameEndCondition: 'Game ends when a player reaches the target score (default 200, adjustable). Highest score wins.',
    scoringMethod: 'roundBased',
    icon: '⚡',
    minPlayers: 2,
    maxPlayers: 8,
  },
  flip7: {
    id: 'flip7',
    name: 'Flip 7',
    rulesSummary:
      'Fast-paced card game where players score points by playing numbered cards (1-12) and special cards (+4, +10). Use the x2 multiplier to double your round score!',
    gameEndCondition: 'Game ends when a player reaches 100 total points. Highest score wins.',
    scoringMethod: 'roundBased',
    icon: '🎲',
    minPlayers: 2,
    maxPlayers: 10,
  },
  genericGame: {
    id: 'genericGame',
    name: 'Generic Game',
    rulesSummary:
      'A flexible scorecard for any game. Enter one numeric score per player per round, and totals are automatically calculated.',
    gameEndCondition: 'No automatic end. Continue playing as many rounds as you like.',
    scoringMethod: 'roundBased',
    icon: '📊',
    minPlayers: 1,
    maxPlayers: 20,
  },
};

export function createGameType(templateId: 'skyjo' | 'milleBornes' | 'nerts' | 'flip7' | 'genericGame'): GameType {
  const template = GAME_TEMPLATES[templateId];
  
  if (templateId === 'skyjo') {
    return {
      __kind__: 'skyjo',
      skyjo: {
        rulesSummary: template.rulesSummary,
        gameEndCondition: template.gameEndCondition,
        scoringMethod: ScoringMethod.roundBased,
      },
    };
  } else if (templateId === 'milleBornes') {
    return {
      __kind__: 'milleBornes',
      milleBornes: {
        rulesSummary: template.rulesSummary,
        gameEndCondition: template.gameEndCondition,
        scoringMethod: ScoringMethod.endOfGame,
      },
    };
  } else if (templateId === 'nerts') {
    return {
      __kind__: 'nerts',
      nerts: {
        rulesSummary: template.rulesSummary,
        gameEndCondition: template.gameEndCondition,
        scoringMethod: ScoringMethod.roundBased,
        scoringDetails: '+1 per card moved to the center stack. -2 per card remaining in player\'s tableau. Round-based scoring.',
        winTarget: BigInt(200),
      },
    };
  } else if (templateId === 'flip7') {
    return {
      __kind__: 'flip7',
      flip7: {
        rulesSummary: template.rulesSummary,
        gameEndCondition: template.gameEndCondition,
        scoringMethod: ScoringMethod.roundBased,
        targetScore: BigInt(100),
      },
    };
  } else {
    return {
      __kind__: 'genericGame',
      genericGame: {
        rulesSummary: template.rulesSummary,
        gameEndCondition: template.gameEndCondition,
        scoringMethod: ScoringMethod.roundBased,
      },
    };
  }
}

export function getGameTemplate(gameType: GameType): GameTemplate {
  if (gameType.__kind__ === 'skyjo') {
    return GAME_TEMPLATES.skyjo;
  } else if (gameType.__kind__ === 'milleBornes') {
    return GAME_TEMPLATES.milleBornes;
  } else if (gameType.__kind__ === 'nerts') {
    return GAME_TEMPLATES.nerts;
  } else if (gameType.__kind__ === 'flip7') {
    return GAME_TEMPLATES.flip7;
  } else {
    return GAME_TEMPLATES.genericGame;
  }
}
