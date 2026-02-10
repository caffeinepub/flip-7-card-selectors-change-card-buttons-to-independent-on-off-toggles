import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { SessionPlayer, NertsEntryState } from '../../lib/sessionTypes';

interface NertsScoreEntryProps {
  players: SessionPlayer[];
  onSubmit: (scores: Map<string, number>, entryState: NertsEntryState) => void;
  initialState?: NertsEntryState;
}

export default function NertsScoreEntry({ players, onSubmit, initialState }: NertsScoreEntryProps) {
  const [centerCards, setCenterCards] = useState<Map<string, string>>(() => {
    const initial = new Map<string, string>();
    if (initialState) {
      initialState.centerCards.forEach((val, playerId) => {
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

  const [tableauCards, setTableauCards] = useState<Map<string, string>>(() => {
    const initial = new Map<string, string>();
    if (initialState) {
      initialState.tableauCards.forEach((val, playerId) => {
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

  const handleCenterChange = (playerId: string, value: string) => {
    const newCenter = new Map(centerCards);
    newCenter.set(playerId, value);
    setCenterCards(newCenter);
  };

  const handleTableauChange = (playerId: string, value: string) => {
    const newTableau = new Map(tableauCards);
    newTableau.set(playerId, value);
    setTableauCards(newTableau);
  };

  const calculateScore = (playerId: string): number => {
    const center = parseInt(centerCards.get(playerId) || '0', 10);
    const tableau = parseInt(tableauCards.get(playerId) || '0', 10);
    return (isNaN(center) ? 0 : center) - 2 * (isNaN(tableau) ? 0 : tableau);
  };

  const handleSubmit = () => {
    const scores = new Map<string, number>();
    const numericCenter = new Map<string, number>();
    const numericTableau = new Map<string, number>();
    let allValid = true;

    players.forEach((player) => {
      const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
      const center = parseInt(centerCards.get(playerId) || '', 10);
      const tableau = parseInt(tableauCards.get(playerId) || '', 10);

      if (isNaN(center) || isNaN(tableau)) {
        allValid = false;
      } else {
        const score = center - 2 * tableau;
        scores.set(playerId, score);
        numericCenter.set(playerId, center);
        numericTableau.set(playerId, tableau);
      }
    });

    if (!allValid) {
      alert('Please enter valid numbers for all players');
      return;
    }

    const entryState: NertsEntryState = {
      centerCards: numericCenter,
      tableauCards: numericTableau,
    };

    onSubmit(scores, entryState);
  };

  return (
    <div className="space-y-4">
      {players.map((player) => {
        const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
        const score = calculateScore(playerId);

        return (
          <div key={playerId} className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{player.name}</h3>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Round Score</p>
                <p className="text-xl font-bold">{isNaN(score) ? '-' : score}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor={`center-${playerId}`}>Center Cards</Label>
                <Input
                  id={`center-${playerId}`}
                  type="number"
                  placeholder="0"
                  value={centerCards.get(playerId) || ''}
                  onChange={(e) => handleCenterChange(playerId, e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`tableau-${playerId}`}>Tableau Left</Label>
                <Input
                  id={`tableau-${playerId}`}
                  type="number"
                  placeholder="0"
                  value={tableauCards.get(playerId) || ''}
                  onChange={(e) => handleTableauChange(playerId, e.target.value)}
                />
              </div>
            </div>
          </div>
        );
      })}

      <Button onClick={handleSubmit} className="w-full">
        Submit Round
      </Button>
    </div>
  );
}
