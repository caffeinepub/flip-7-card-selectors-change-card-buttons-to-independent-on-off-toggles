import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { SessionPlayer } from '../../lib/sessionTypes';

interface NertsScoreEntryProps {
  players: SessionPlayer[];
  onSubmit: (scores: Map<string, number>) => void;
}

export default function NertsScoreEntry({ players, onSubmit }: NertsScoreEntryProps) {
  const [centerCards, setCenterCards] = useState<Map<string, string>>(new Map());
  const [tableauCards, setTableauCards] = useState<Map<string, string>>(new Map());

  const handleCenterChange = (playerId: string, value: string) => {
    const newCenterCards = new Map(centerCards);
    newCenterCards.set(playerId, value);
    setCenterCards(newCenterCards);
  };

  const handleTableauChange = (playerId: string, value: string) => {
    const newTableauCards = new Map(tableauCards);
    newTableauCards.set(playerId, value);
    setTableauCards(newTableauCards);
  };

  const handleSubmit = () => {
    const scores = new Map<string, number>();
    let allValid = true;

    players.forEach((player) => {
      const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
      const centerStr = centerCards.get(playerId) || '0';
      const tableauStr = tableauCards.get(playerId) || '0';
      
      const center = parseInt(centerStr, 10);
      const tableau = parseInt(tableauStr, 10);
      
      if (isNaN(center) || isNaN(tableau)) {
        allValid = false;
      } else {
        const score = center - (2 * tableau);
        scores.set(playerId, score);
      }
    });

    if (allValid) {
      onSubmit(scores);
      setCenterCards(new Map());
      setTableauCards(new Map());
    }
  };

  const allFilled = players.every((player) => {
    const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
    const centerValue = centerCards.get(playerId);
    const tableauValue = tableauCards.get(playerId);
    return centerValue !== undefined && centerValue !== '' && 
           tableauValue !== undefined && tableauValue !== '';
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {players.map((player) => {
          const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
          const center = centerCards.get(playerId) || '';
          const tableau = tableauCards.get(playerId) || '';
          
          const centerNum = parseInt(center, 10) || 0;
          const tableauNum = parseInt(tableau, 10) || 0;
          const calculatedScore = centerNum - (2 * tableauNum);
          
          return (
            <div key={playerId} className="p-4 rounded-lg border bg-accent/20 space-y-3">
              <h3 className="font-semibold">{player.name}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`center-${playerId}`}>Center cards played</Label>
                  <Input
                    id={`center-${playerId}`}
                    type="number"
                    min="0"
                    placeholder="0"
                    value={center}
                    onChange={(e) => handleCenterChange(playerId, e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`tableau-${playerId}`}>Cards left in tableau</Label>
                  <Input
                    id={`tableau-${playerId}`}
                    type="number"
                    min="0"
                    placeholder="0"
                    value={tableau}
                    onChange={(e) => handleTableauChange(playerId, e.target.value)}
                  />
                </div>
              </div>
              {(center !== '' || tableau !== '') && (
                <div className="text-sm text-muted-foreground">
                  Round score: <span className="font-semibold text-foreground">{calculatedScore}</span>
                  {centerNum > 0 && <span className="ml-2">(+{centerNum} center</span>}
                  {tableauNum > 0 && <span>{centerNum > 0 ? ', ' : '('}-{tableauNum * 2} tableau)</span>}
                  {(centerNum > 0 || tableauNum > 0) && ')'}
                </div>
              )}
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
