import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import type { SessionPlayer } from '../../lib/sessionTypes';

interface MilleBornesScoreEntryProps {
  players: SessionPlayer[];
  onSubmit: (scores: Map<string, number>) => void;
}

interface PlayerScoreData {
  distance: string;
  tripCompleted: boolean;
  delayedAction: boolean;
  safeTrip: boolean;
  shutout: boolean;
  extensionTo1000: boolean;
  allSafeties: boolean;
  coupFourreCount: string;
  otherBonuses: string;
}

const emptyScoreData = (): PlayerScoreData => ({
  distance: '',
  tripCompleted: false,
  delayedAction: false,
  safeTrip: false,
  shutout: false,
  extensionTo1000: false,
  allSafeties: false,
  coupFourreCount: '',
  otherBonuses: '',
});

export default function MilleBornesScoreEntry({ players, onSubmit }: MilleBornesScoreEntryProps) {
  const [playerScores, setPlayerScores] = useState<Map<string, PlayerScoreData>>(new Map());

  const isTwoPlayer = players.length === 2;
  const tripTarget = isTwoPlayer ? 700 : 1000;

  const handleFieldChange = (playerId: string, field: keyof PlayerScoreData, value: string | boolean) => {
    const newScores = new Map(playerScores);
    const current = newScores.get(playerId) || emptyScoreData();
    newScores.set(playerId, { ...current, [field]: value });
    setPlayerScores(newScores);
  };

  const calculateTotal = (playerId: string): number => {
    const data = playerScores.get(playerId);
    if (!data) return 0;

    let total = 0;

    // Distance traveled
    const distance = parseInt(data.distance, 10) || 0;
    total += distance;

    // Trip completion bonus (400 for standard, adjusted for 2-player)
    if (data.tripCompleted) {
      total += 400;
    }

    // Delayed action bonus (300)
    if (data.delayedAction) {
      total += 300;
    }

    // Safe trip bonus (300)
    if (data.safeTrip) {
      total += 300;
    }

    // Shutout bonus (500)
    if (data.shutout) {
      total += 500;
    }

    // Extension to 1000 km bonus (200) - only relevant for 2-player
    if (data.extensionTo1000 && isTwoPlayer) {
      total += 200;
    }

    // All four safeties bonus (700)
    if (data.allSafeties) {
      total += 700;
    }

    // Coup-fourré bonuses (300 each)
    const coupFourreCount = parseInt(data.coupFourreCount, 10) || 0;
    total += coupFourreCount * 300;

    // Other official bonuses
    const otherBonuses = parseInt(data.otherBonuses, 10) || 0;
    total += otherBonuses;

    return total;
  };

  const handleSubmit = () => {
    const finalScores = new Map<string, number>();
    players.forEach((player) => {
      const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
      finalScores.set(playerId, calculateTotal(playerId));
    });
    onSubmit(finalScores);
    setPlayerScores(new Map());
  };

  return (
    <div className="space-y-6">
      {isTwoPlayer && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <Badge variant="outline" className="bg-background">2-Player Variant</Badge>
          <span className="text-sm text-muted-foreground">
            Trip target: {tripTarget} km (extension to 1000 km available)
          </span>
        </div>
      )}

      {players.map((player) => {
        const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
        const data = playerScores.get(playerId) || emptyScoreData();
        const total = calculateTotal(playerId);

        return (
          <div key={playerId} className="space-y-4 p-4 rounded-lg border bg-accent/20">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{player.name}</h3>
              <span className="text-lg font-bold text-primary">Total: {total}</span>
            </div>

            <Separator />

            {/* Distance */}
            <div className="space-y-2">
              <Label htmlFor={`distance-${playerId}`} className="text-sm font-medium">
                Distance Traveled (km)
              </Label>
              <Input
                id={`distance-${playerId}`}
                type="number"
                placeholder="0"
                value={data.distance}
                onChange={(e) => handleFieldChange(playerId, 'distance', e.target.value)}
                className="max-w-xs"
              />
            </div>

            <Separator className="my-3" />

            {/* Bonuses */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Bonuses</p>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`tripCompleted-${playerId}`}
                    checked={data.tripCompleted}
                    onCheckedChange={(checked) =>
                      handleFieldChange(playerId, 'tripCompleted', checked === true)
                    }
                  />
                  <Label
                    htmlFor={`tripCompleted-${playerId}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    Trip Completed ({tripTarget} km) — <span className="font-medium">+400</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`delayedAction-${playerId}`}
                    checked={data.delayedAction}
                    onCheckedChange={(checked) =>
                      handleFieldChange(playerId, 'delayedAction', checked === true)
                    }
                  />
                  <Label
                    htmlFor={`delayedAction-${playerId}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    Delayed Action (went out first) — <span className="font-medium">+300</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`safeTrip-${playerId}`}
                    checked={data.safeTrip}
                    onCheckedChange={(checked) =>
                      handleFieldChange(playerId, 'safeTrip', checked === true)
                    }
                  />
                  <Label
                    htmlFor={`safeTrip-${playerId}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    Safe Trip (no 200 km cards used) — <span className="font-medium">+300</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`shutout-${playerId}`}
                    checked={data.shutout}
                    onCheckedChange={(checked) =>
                      handleFieldChange(playerId, 'shutout', checked === true)
                    }
                  />
                  <Label
                    htmlFor={`shutout-${playerId}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    Shutout (opponent never played distance) — <span className="font-medium">+500</span>
                  </Label>
                </div>

                {isTwoPlayer && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`extensionTo1000-${playerId}`}
                      checked={data.extensionTo1000}
                      onCheckedChange={(checked) =>
                        handleFieldChange(playerId, 'extensionTo1000', checked === true)
                      }
                    />
                    <Label
                      htmlFor={`extensionTo1000-${playerId}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      Extension to 1000 km — <span className="font-medium">+200</span>
                    </Label>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`allSafeties-${playerId}`}
                    checked={data.allSafeties}
                    onCheckedChange={(checked) =>
                      handleFieldChange(playerId, 'allSafeties', checked === true)
                    }
                  />
                  <Label
                    htmlFor={`allSafeties-${playerId}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    All Four Safeties — <span className="font-medium">+700</span>
                  </Label>
                </div>
              </div>
            </div>

            <Separator className="my-3" />

            {/* Coup-fourré and other bonuses */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`coupFourre-${playerId}`} className="text-sm font-medium">
                  Coup-Fourré Count (×300)
                </Label>
                <Input
                  id={`coupFourre-${playerId}`}
                  type="number"
                  placeholder="0"
                  value={data.coupFourreCount}
                  onChange={(e) => handleFieldChange(playerId, 'coupFourreCount', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`otherBonuses-${playerId}`} className="text-sm font-medium">
                  Other Official Bonuses
                </Label>
                <Input
                  id={`otherBonuses-${playerId}`}
                  type="number"
                  placeholder="0"
                  value={data.otherBonuses}
                  onChange={(e) => handleFieldChange(playerId, 'otherBonuses', e.target.value)}
                />
              </div>
            </div>
          </div>
        );
      })}

      <Button onClick={handleSubmit} className="w-full" size="lg">
        Submit Final Scores
      </Button>
    </div>
  );
}
