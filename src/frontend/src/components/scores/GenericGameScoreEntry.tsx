import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { SessionPlayer, GenericGameEntryState } from '../../lib/sessionTypes';

interface GenericGameScoreEntryProps {
  players: SessionPlayer[];
  onSubmit: (scores: Map<string, number>, entryState: GenericGameEntryState) => void;
  initialState?: GenericGameEntryState;
}

export default function GenericGameScoreEntry({ players, onSubmit, initialState }: GenericGameScoreEntryProps) {
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

  const handleScoreChange = (playerId: string, value: string) => {
    const newScores = new Map(playerScores);
    newScores.set(playerId, value);
    setPlayerScores(newScores);
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

    const entryState: GenericGameEntryState = {
      playerScores: numericScores,
    };

    onSubmit(scores, entryState);
  };

  return (
    <div className="space-y-4">
      {players.map((player) => {
        const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;

        return (
          <div key={playerId} className="space-y-2 p-4 border rounded-lg">
            <Label htmlFor={`score-${playerId}`} className="font-semibold">
              {player.name}
            </Label>
            <Input
              id={`score-${playerId}`}
              type="number"
              placeholder="Enter score"
              value={playerScores.get(playerId) || ''}
              onChange={(e) => handleScoreChange(playerId, e.target.value)}
            />
          </div>
        );
      })}

      <Button onClick={handleSubmit} className="w-full">
        Submit Round
      </Button>
    </div>
  );
}
