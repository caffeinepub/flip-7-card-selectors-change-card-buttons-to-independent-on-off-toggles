import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import type { SessionPlayer, Flip7EntryState } from '../../lib/sessionTypes';

interface Flip7ScoreEntryProps {
  players: SessionPlayer[];
  onSubmit: (scores: Map<string, number>, entryState: Flip7EntryState) => void;
  initialState?: Flip7EntryState;
}

export default function Flip7ScoreEntry({ players, onSubmit, initialState }: Flip7ScoreEntryProps) {
  const regularCards = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const modifierCards = [4, 10];

  const [selectedCards, setSelectedCards] = useState<Map<string, number[]>>(() => {
    return initialState?.selectedCards || new Map();
  });

  const [modifiers, setModifiers] = useState<Map<string, number[]>>(() => {
    return initialState?.modifiers || new Map();
  });

  const [multipliers, setMultipliers] = useState<Map<string, boolean>>(() => {
    return initialState?.multipliers || new Map();
  });

  const [manualScores, setManualScores] = useState<Map<string, number | null>>(() => {
    return initialState?.manualScores || new Map();
  });

  const [manualInput, setManualInput] = useState<Map<string, string>>(() => {
    const initial = new Map<string, string>();
    if (initialState) {
      initialState.manualScores.forEach((val, playerId) => {
        if (val !== null && val !== undefined) {
          initial.set(playerId, val.toString());
        }
      });
    }
    return initial;
  });

  const [showCelebration, setShowCelebration] = useState<Map<string, boolean>>(new Map());

  const toggleCard = (playerId: string, cardValue: number) => {
    const current = selectedCards.get(playerId) || [];
    const newSelected = current.includes(cardValue)
      ? current.filter((v) => v !== cardValue)
      : [...current, cardValue];

    const newMap = new Map(selectedCards);
    newMap.set(playerId, newSelected);
    setSelectedCards(newMap);

    if (current.length === 6 && newSelected.length === 7) {
      const celebrationMap = new Map(showCelebration);
      celebrationMap.set(playerId, true);
      setShowCelebration(celebrationMap);
      setTimeout(() => {
        const updatedMap = new Map(showCelebration);
        updatedMap.set(playerId, false);
        setShowCelebration(updatedMap);
      }, 1000);
    }
  };

  const toggleModifier = (playerId: string, modValue: number) => {
    const current = modifiers.get(playerId) || [];
    const newMods = current.includes(modValue)
      ? current.filter((v) => v !== modValue)
      : [...current, modValue];

    const newMap = new Map(modifiers);
    newMap.set(playerId, newMods);
    setModifiers(newMap);
  };

  const toggleMultiplier = (playerId: string) => {
    const newMap = new Map(multipliers);
    newMap.set(playerId, !multipliers.get(playerId));
    setMultipliers(newMap);
  };

  const handleManualChange = (playerId: string, value: string) => {
    const newInput = new Map(manualInput);
    newInput.set(playerId, value);
    setManualInput(newInput);

    const newManual = new Map(manualScores);
    if (value === '') {
      newManual.set(playerId, null);
    } else {
      const num = parseInt(value, 10);
      newManual.set(playerId, isNaN(num) ? null : num);
    }
    setManualScores(newManual);
  };

  const calculateScore = (playerId: string): number => {
    const manual = manualScores.get(playerId);
    if (manual !== null && manual !== undefined) {
      const mult = multipliers.get(playerId) ? 2 : 1;
      return manual * mult;
    }

    const selected = selectedCards.get(playerId) || [];
    const mods = modifiers.get(playerId) || [];

    let score = selected.reduce((sum, val) => sum + val, 0);
    score += mods.reduce((sum, val) => sum + val, 0);

    if (selected.length === 7) {
      score += 15;
    }

    const mult = multipliers.get(playerId) ? 2 : 1;
    return score * mult;
  };

  const handleSubmit = () => {
    const scores = new Map<string, number>();

    players.forEach((player) => {
      const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
      const score = calculateScore(playerId);
      scores.set(playerId, score);
    });

    const entryState: Flip7EntryState = {
      selectedCards: new Map(selectedCards),
      modifiers: new Map(modifiers),
      multipliers: new Map(multipliers),
      manualScores: new Map(manualScores),
    };

    onSubmit(scores, entryState);
  };

  return (
    <div className="space-y-6">
      {players.map((player) => {
        const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
        const selected = selectedCards.get(playerId) || [];
        const mods = modifiers.get(playerId) || [];
        const isMultiplied = multipliers.get(playerId) || false;
        const manual = manualScores.get(playerId);
        const score = calculateScore(playerId);
        const celebrating = showCelebration.get(playerId) || false;

        const isLocked = selected.length >= 7;

        return (
          <div key={playerId} className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{player.name}</h3>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Round Score</p>
                <p className={`text-2xl font-bold ${celebrating ? 'animate-celebrate' : ''}`}>{score}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Regular Cards (0-12)</Label>
              <div className="grid grid-cols-7 gap-2">
                {regularCards.map((cardValue) => {
                  const isSelected = selected.includes(cardValue);
                  const isDisabled = isLocked && !isSelected;

                  return (
                    <Button
                      key={cardValue}
                      variant="outline"
                      size="sm"
                      onClick={() => toggleCard(playerId, cardValue)}
                      disabled={isDisabled}
                      className={`h-12 ${
                        isSelected
                          ? 'bg-foreground text-background border-foreground hover:bg-foreground/90 hover:text-background'
                          : isDisabled
                            ? 'opacity-40'
                            : ''
                      }`}
                    >
                      {cardValue}
                    </Button>
                  );
                })}
              </div>
              {selected.length === 7 && (
                <p className="text-xs text-primary font-medium">🎉 7 cards selected! +15 bonus applied</p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Modifiers</Label>
              <div className="flex gap-2">
                {modifierCards.map((modValue) => {
                  const isSelected = mods.includes(modValue);

                  return (
                    <Button
                      key={modValue}
                      variant="outline"
                      size="sm"
                      onClick={() => toggleModifier(playerId, modValue)}
                      className={`h-12 px-6 ${
                        isSelected
                          ? 'bg-foreground text-background border-foreground hover:bg-foreground/90 hover:text-background'
                          : ''
                      }`}
                    >
                      +{modValue}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`manual-${playerId}`}>Or Enter Score Manually</Label>
              <Input
                id={`manual-${playerId}`}
                type="number"
                placeholder="Leave blank to use card selection"
                value={manualInput.get(playerId) || ''}
                onChange={(e) => handleManualChange(playerId, e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-accent/20">
              <Label htmlFor={`mult-${playerId}`} className="cursor-pointer">
                Double Score (x2)
              </Label>
              <Button
                id={`mult-${playerId}`}
                variant="outline"
                size="sm"
                onClick={() => toggleMultiplier(playerId)}
                className={`h-10 px-6 ${
                  isMultiplied
                    ? 'bg-foreground text-background border-foreground hover:bg-foreground/90 hover:text-background'
                    : ''
                }`}
              >
                {isMultiplied ? 'x2' : 'x1'}
              </Button>
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
