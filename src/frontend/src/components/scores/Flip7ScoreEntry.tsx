import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Check } from 'lucide-react';
import type { SessionPlayer } from '../../lib/sessionTypes';

interface Flip7ScoreEntryProps {
  players: SessionPlayer[];
  onSubmit: (scores: Map<string, number>) => void;
}

// Stable card identifiers to distinguish between regular 4 and +4, regular 10 and +10
type CardId = string;

export default function Flip7ScoreEntry({ players, onSubmit }: Flip7ScoreEntryProps) {
  // Track selected card IDs per player (Set of card IDs)
  const [selectedCards, setSelectedCards] = useState<Map<string, Set<CardId>>>(new Map());
  const [manualScores, setManualScores] = useState<Map<string, string>>(new Map());
  const [multipliers, setMultipliers] = useState<Map<string, boolean>>(new Map());

  const cardButtons = [
    { id: 'card-1', value: 1, label: '1' },
    { id: 'card-2', value: 2, label: '2' },
    { id: 'card-3', value: 3, label: '3' },
    { id: 'card-4', value: 4, label: '4' },
    { id: 'card-5', value: 5, label: '5' },
    { id: 'card-6', value: 6, label: '6' },
    { id: 'card-7', value: 7, label: '7' },
    { id: 'card-8', value: 8, label: '8' },
    { id: 'card-9', value: 9, label: '9' },
    { id: 'card-10', value: 10, label: '10' },
    { id: 'card-11', value: 11, label: '11' },
    { id: 'card-12', value: 12, label: '12' },
    { id: 'card-plus4', value: 4, label: '+4', special: true },
    { id: 'card-plus10', value: 10, label: '+10', special: true },
  ];

  const handleCardToggle = (playerId: string, cardId: CardId, value: number) => {
    const newSelectedCards = new Map(selectedCards);
    const playerCards = new Set<CardId>(newSelectedCards.get(playerId) || new Set<CardId>());
    
    // Toggle: if card is selected, remove it; otherwise add it
    if (playerCards.has(cardId)) {
      playerCards.delete(cardId);
    } else {
      playerCards.add(cardId);
    }
    
    newSelectedCards.set(playerId, playerCards);
    setSelectedCards(newSelectedCards);
  };

  const getButtonTally = (playerId: string): number => {
    const playerCards = selectedCards.get(playerId);
    if (!playerCards || playerCards.size === 0) return 0;
    
    let total = 0;
    playerCards.forEach((cardId) => {
      const card = cardButtons.find(c => c.id === cardId);
      if (card) {
        total += card.value;
      }
    });
    return total;
  };

  const isCardSelected = (playerId: string, cardId: CardId): boolean => {
    const playerCards = selectedCards.get(playerId);
    return playerCards ? playerCards.has(cardId) : false;
  };

  const handleManualChange = (playerId: string, value: string) => {
    const newManualScores = new Map(manualScores);
    newManualScores.set(playerId, value);
    setManualScores(newManualScores);
  };

  const handleMultiplierToggle = (playerId: string) => {
    const newMultipliers = new Map(multipliers);
    newMultipliers.set(playerId, !newMultipliers.get(playerId));
    setMultipliers(newMultipliers);
  };

  const handleClear = (playerId: string) => {
    const newSelectedCards = new Map(selectedCards);
    newSelectedCards.set(playerId, new Set<CardId>());
    setSelectedCards(newSelectedCards);
  };

  const getFinalScore = (playerId: string): number => {
    const manualValue = manualScores.get(playerId);
    const hasValidManual = manualValue !== undefined && manualValue !== '' && !isNaN(parseInt(manualValue, 10));
    
    const baseScore = hasValidManual 
      ? parseInt(manualValue, 10) 
      : getButtonTally(playerId);
    
    const isMultiplied = multipliers.get(playerId) || false;
    return isMultiplied ? baseScore * 2 : baseScore;
  };

  const handleSubmit = () => {
    const scores = new Map<string, number>();
    
    players.forEach((player) => {
      const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
      const finalScore = getFinalScore(playerId);
      scores.set(playerId, finalScore);
    });

    onSubmit(scores);
    // Reset all state after submission
    setSelectedCards(new Map());
    setManualScores(new Map());
    setMultipliers(new Map());
  };

  const allValid = players.every((player) => {
    const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
    const manualValue = manualScores.get(playerId);
    const hasValidManual = manualValue !== undefined && manualValue !== '' && !isNaN(parseInt(manualValue, 10));
    const hasTally = getButtonTally(playerId) > 0;
    return hasValidManual || hasTally;
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {players.map((player) => {
          const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
          const tally = getButtonTally(playerId);
          const manual = manualScores.get(playerId) || '';
          const isMultiplied = multipliers.get(playerId) || false;
          const finalScore = getFinalScore(playerId);
          
          return (
            <div key={playerId} className="p-4 rounded-lg border bg-accent/20 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{player.name}</h3>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`x2-${playerId}`} className="text-sm font-medium">x2</Label>
                  <Switch
                    id={`x2-${playerId}`}
                    checked={isMultiplied}
                    onCheckedChange={() => handleMultiplierToggle(playerId)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-7 gap-2">
                  {cardButtons.map((btn) => {
                    const isSelected = isCardSelected(playerId, btn.id);
                    return (
                      <Button
                        key={btn.id}
                        variant={isSelected ? "default" : (btn.special ? "secondary" : "outline")}
                        size="sm"
                        onClick={() => handleCardToggle(playerId, btn.id, btn.value)}
                        className="h-10 text-sm font-semibold relative"
                        aria-pressed={isSelected}
                      >
                        {btn.label}
                        {isSelected && (
                          <Check className="absolute top-0.5 right-0.5 h-3 w-3" aria-hidden="true" />
                        )}
                      </Button>
                    );
                  })}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`tally-${playerId}`}>Button Tally</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`tally-${playerId}`}
                        type="number"
                        value={tally}
                        readOnly
                        className="bg-muted"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleClear(playerId)}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`manual-${playerId}`}>Manual Entry (Optional)</Label>
                    <Input
                      id={`manual-${playerId}`}
                      type="number"
                      min="0"
                      placeholder="Or enter manually"
                      value={manual}
                      onChange={(e) => handleManualChange(playerId, e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {(tally > 0 || manual !== '') && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Final score: </span>
                  <span className="font-semibold text-foreground text-lg">{finalScore}</span>
                  {isMultiplied && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({manual !== '' && !isNaN(parseInt(manual, 10)) ? parseInt(manual, 10) : tally} × 2)
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Button onClick={handleSubmit} disabled={!allValid} className="w-full">
        Add Round
      </Button>
    </div>
  );
}
