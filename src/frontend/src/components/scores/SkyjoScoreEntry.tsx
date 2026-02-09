import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { SessionPlayer } from '../../lib/sessionTypes';

interface SkyjoScoreEntryProps {
  players: SessionPlayer[];
  onSubmit: (scores: Map<string, number>) => void;
}

export default function SkyjoScoreEntry({ players, onSubmit }: SkyjoScoreEntryProps) {
  const [scores, setScores] = useState<Map<string, string>>(new Map());

  const handleScoreChange = (playerId: string, value: string) => {
    const newScores = new Map(scores);
    newScores.set(playerId, value);
    setScores(newScores);
  };

  const handleSubmit = () => {
    const numericScores = new Map<string, number>();
    let allValid = true;

    players.forEach((player) => {
      const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
      const scoreStr = scores.get(playerId) || '0';
      const score = parseInt(scoreStr, 10);
      if (isNaN(score)) {
        allValid = false;
      } else {
        numericScores.set(playerId, score);
      }
    });

    if (allValid) {
      onSubmit(numericScores);
      setScores(new Map());
    }
  };

  const allFilled = players.every((player) => {
    const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
    const value = scores.get(playerId);
    return value !== undefined && value !== '';
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {players.map((player) => {
          const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
          return (
            <div key={playerId} className="space-y-2">
              <Label htmlFor={`score-${playerId}`}>{player.name}</Label>
              <Input
                id={`score-${playerId}`}
                type="number"
                placeholder="0"
                value={scores.get(playerId) || ''}
                onChange={(e) => handleScoreChange(playerId, e.target.value)}
              />
            </div>
          );
        })}
      </div>
      <Button onClick={handleSubmit} disabled={!allFilled} className="w-full">
        Add Round
      </Button>
    </div>
  );
}
