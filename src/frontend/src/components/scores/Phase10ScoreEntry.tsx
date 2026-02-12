import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import type { SessionPlayer, Phase10EntryState } from '../../lib/sessionTypes';

interface Phase10ScoreEntryProps {
  players: SessionPlayer[];
  onSubmit: (scores: Map<string, number>, entryState: Phase10EntryState) => void;
  initialState?: Phase10EntryState;
  phase10Progress?: Map<string, number>;
  currentUserPrincipal?: string;
  isSubmitting?: boolean;
}

export default function Phase10ScoreEntry({
  players,
  onSubmit,
  initialState,
  phase10Progress,
  currentUserPrincipal,
  isSubmitting = false,
}: Phase10ScoreEntryProps) {
  const [playerScores, setPlayerScores] = useState<Map<string, string>>(() => {
    const initial = new Map<string, string>();
    if (initialState) {
      initialState.playerScores.forEach((val, playerId) => {
        initial.set(playerId, val.toString());
      });
    } else {
      players.forEach((player) => {
        const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
        initial.set(playerId, '');
      });
    }
    return initial;
  });

  const [phaseCompletions, setPhaseCompletions] = useState<Map<string, boolean>>(() => {
    const initial = new Map<string, boolean>();
    if (initialState) {
      // Use saved state
      return new Map(initialState.phaseCompletions);
    } else {
      // Initialize all players to false (unchecked) for new rounds
      players.forEach((player) => {
        const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
        initial.set(playerId, false);
      });
    }
    return initial;
  });

  const handleScoreChange = (playerId: string, value: string) => {
    const newScores = new Map(playerScores);
    newScores.set(playerId, value);
    setPlayerScores(newScores);
  };

  const handlePhaseCompleteChange = (playerId: string, checked: boolean) => {
    setPhaseCompletions((prev) => {
      const next = new Map(prev);
      next.set(playerId, checked);
      return next;
    });
  };

  const handleSubmit = () => {
    const scores = new Map<string, number>();
    const numericScores = new Map<string, number>();
    let allValid = true;

    players.forEach((player) => {
      const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
      const scoreStr = playerScores.get(playerId) || '';
      const score = parseInt(scoreStr, 10);

      if (scoreStr === '' || isNaN(score)) {
        allValid = false;
      } else {
        scores.set(playerId, score);
        numericScores.set(playerId, score);
      }
    });

    if (!allValid) {
      alert('Please enter a valid score for all players');
      return;
    }

    const entryState: Phase10EntryState = {
      playerScores: numericScores,
      phaseCompletions,
    };

    onSubmit(scores, entryState);
  };

  const getPlayerPhase = (playerId: string): number => {
    const phase = phase10Progress?.get(playerId) || 1;
    // Clamp to 1-10 range
    return Math.max(1, Math.min(10, phase));
  };

  const isPlayerOwner = (player: SessionPlayer): boolean => {
    if (!currentUserPrincipal || !player.ownerPrincipal) return false;
    return player.ownerPrincipal === currentUserPrincipal;
  };

  return (
    <div className="space-y-4">
      {players.map((player) => {
        const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
        const currentPhase = getPlayerPhase(playerId);
        const isOwner = isPlayerOwner(player);
        const isChecked = phaseCompletions.get(playerId) || false;

        return (
          <div key={playerId} className="space-y-2 p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor={`score-${playerId}`} className="font-semibold">
                {player.name}
              </Label>
              <span className="text-sm font-medium text-muted-foreground">
                Phase {currentPhase}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Input
                id={`score-${playerId}`}
                type="number"
                placeholder="Enter score"
                value={playerScores.get(playerId) || ''}
                onChange={(e) => handleScoreChange(playerId, e.target.value)}
                disabled={isSubmitting}
                className="flex-1 min-w-[120px]"
              />
              <div className="flex items-center gap-2 ml-auto">
                <Checkbox
                  id={`phase-complete-${playerId}`}
                  checked={isChecked}
                  disabled={!isOwner || isSubmitting}
                  onCheckedChange={(checked) => handlePhaseCompleteChange(playerId, checked === true)}
                />
                <Label
                  htmlFor={`phase-complete-${playerId}`}
                  className={`text-sm font-medium leading-none cursor-pointer ${
                    !isOwner || isSubmitting ? 'text-muted-foreground cursor-not-allowed' : ''
                  }`}
                >
                  Phase complete
                </Label>
              </div>
            </div>
          </div>
        );
      })}

      <Button onClick={handleSubmit} className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Round'}
      </Button>
    </div>
  );
}
