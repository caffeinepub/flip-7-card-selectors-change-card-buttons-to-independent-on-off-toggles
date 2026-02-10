import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import type { SessionPlayer, MilleBornesEntryState } from '../../lib/sessionTypes';

interface MilleBornesScoreEntryProps {
  players: SessionPlayer[];
  onSubmit: (scores: Map<string, number>, entryState: MilleBornesEntryState) => void;
  initialState?: MilleBornesEntryState;
}

export default function MilleBornesScoreEntry({ players, onSubmit, initialState }: MilleBornesScoreEntryProps) {
  const isTwoPlayer = players.length === 2;
  const tripTarget = isTwoPlayer ? 700 : 1000;

  const [distance, setDistance] = useState<Map<string, string>>(() => {
    const initial = new Map<string, string>();
    if (initialState) {
      initialState.distance.forEach((val, playerId) => {
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

  const [tripCompleted, setTripCompleted] = useState<Map<string, boolean>>(() => {
    return initialState?.tripCompleted || new Map();
  });
  const [delayedAction, setDelayedAction] = useState<Map<string, boolean>>(() => {
    return initialState?.delayedAction || new Map();
  });
  const [safeTrip, setSafeTrip] = useState<Map<string, boolean>>(() => {
    return initialState?.safeTrip || new Map();
  });
  const [shutout, setShutout] = useState<Map<string, boolean>>(() => {
    return initialState?.shutout || new Map();
  });
  const [extensionTo1000, setExtensionTo1000] = useState<Map<string, boolean>>(() => {
    return initialState?.extensionTo1000 || new Map();
  });
  const [allSafeties, setAllSafeties] = useState<Map<string, boolean>>(() => {
    return initialState?.allSafeties || new Map();
  });
  const [coupFourre, setCoupFourre] = useState<Map<string, string>>(() => {
    const initial = new Map<string, string>();
    if (initialState) {
      initialState.coupFourre.forEach((val, playerId) => {
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
  const [otherBonuses, setOtherBonuses] = useState<Map<string, string>>(() => {
    const initial = new Map<string, string>();
    if (initialState) {
      initialState.otherBonuses.forEach((val, playerId) => {
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

  const handleDistanceChange = (playerId: string, value: string) => {
    const newDistance = new Map(distance);
    newDistance.set(playerId, value);
    setDistance(newDistance);
  };

  const handleCheckboxChange = (
    playerId: string,
    setter: React.Dispatch<React.SetStateAction<Map<string, boolean>>>,
    currentMap: Map<string, boolean>
  ) => {
    const newMap = new Map(currentMap);
    newMap.set(playerId, !currentMap.get(playerId));
    setter(newMap);
  };

  const handleCoupFourreChange = (playerId: string, value: string) => {
    const newCoupFourre = new Map(coupFourre);
    newCoupFourre.set(playerId, value);
    setCoupFourre(newCoupFourre);
  };

  const handleOtherBonusesChange = (playerId: string, value: string) => {
    const newOtherBonuses = new Map(otherBonuses);
    newOtherBonuses.set(playerId, value);
    setOtherBonuses(newOtherBonuses);
  };

  const calculateScore = (playerId: string): number => {
    let score = 0;

    const dist = parseInt(distance.get(playerId) || '0', 10);
    score += isNaN(dist) ? 0 : dist;

    if (tripCompleted.get(playerId)) {
      score += dist >= tripTarget ? 400 : 300;
    }

    if (delayedAction.get(playerId)) score += 300;
    if (safeTrip.get(playerId)) score += 300;
    if (shutout.get(playerId)) score += 500;
    if (extensionTo1000.get(playerId)) score += 200;
    if (allSafeties.get(playerId)) score += 700;

    const coup = parseInt(coupFourre.get(playerId) || '0', 10);
    score += isNaN(coup) ? 0 : coup * 300;

    const other = parseInt(otherBonuses.get(playerId) || '0', 10);
    score += isNaN(other) ? 0 : other;

    return score;
  };

  const handleSubmit = () => {
    const scores = new Map<string, number>();
    const numericDistance = new Map<string, number>();
    const numericCoupFourre = new Map<string, number>();
    const numericOtherBonuses = new Map<string, number>();

    players.forEach((player) => {
      const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
      const score = calculateScore(playerId);
      scores.set(playerId, score);

      const dist = parseInt(distance.get(playerId) || '0', 10);
      numericDistance.set(playerId, isNaN(dist) ? 0 : dist);

      const coup = parseInt(coupFourre.get(playerId) || '0', 10);
      numericCoupFourre.set(playerId, isNaN(coup) ? 0 : coup);

      const other = parseInt(otherBonuses.get(playerId) || '0', 10);
      numericOtherBonuses.set(playerId, isNaN(other) ? 0 : other);
    });

    const entryState: MilleBornesEntryState = {
      distance: numericDistance,
      tripCompleted: new Map(tripCompleted),
      delayedAction: new Map(delayedAction),
      safeTrip: new Map(safeTrip),
      shutout: new Map(shutout),
      extensionTo1000: new Map(extensionTo1000),
      allSafeties: new Map(allSafeties),
      coupFourre: numericCoupFourre,
      otherBonuses: numericOtherBonuses,
    };

    onSubmit(scores, entryState);
  };

  return (
    <div className="space-y-6">
      {players.map((player) => {
        const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
        const score = calculateScore(playerId);

        return (
          <div key={playerId} className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{player.name}</h3>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Score</p>
                <p className="text-2xl font-bold">{score}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor={`distance-${playerId}`}>Distance Traveled</Label>
              <Input
                id={`distance-${playerId}`}
                type="number"
                placeholder="0"
                value={distance.get(playerId) || ''}
                onChange={(e) => handleDistanceChange(playerId, e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`trip-${playerId}`}
                  checked={tripCompleted.get(playerId) || false}
                  onCheckedChange={() => handleCheckboxChange(playerId, setTripCompleted, tripCompleted)}
                />
                <Label htmlFor={`trip-${playerId}`} className="font-normal cursor-pointer">
                  Trip Completed ({tripTarget >= 1000 ? '+400' : '+300'} pts)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`delayed-${playerId}`}
                  checked={delayedAction.get(playerId) || false}
                  onCheckedChange={() => handleCheckboxChange(playerId, setDelayedAction, delayedAction)}
                />
                <Label htmlFor={`delayed-${playerId}`} className="font-normal cursor-pointer">
                  Delayed Action (+300 pts)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`safe-${playerId}`}
                  checked={safeTrip.get(playerId) || false}
                  onCheckedChange={() => handleCheckboxChange(playerId, setSafeTrip, safeTrip)}
                />
                <Label htmlFor={`safe-${playerId}`} className="font-normal cursor-pointer">
                  Safe Trip (+300 pts)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`shutout-${playerId}`}
                  checked={shutout.get(playerId) || false}
                  onCheckedChange={() => handleCheckboxChange(playerId, setShutout, shutout)}
                />
                <Label htmlFor={`shutout-${playerId}`} className="font-normal cursor-pointer">
                  Shutout (+500 pts)
                </Label>
              </div>

              {isTwoPlayer && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`extension-${playerId}`}
                    checked={extensionTo1000.get(playerId) || false}
                    onCheckedChange={() => handleCheckboxChange(playerId, setExtensionTo1000, extensionTo1000)}
                  />
                  <Label htmlFor={`extension-${playerId}`} className="font-normal cursor-pointer">
                    Extension to 1000 km (+200 pts)
                  </Label>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`safeties-${playerId}`}
                  checked={allSafeties.get(playerId) || false}
                  onCheckedChange={() => handleCheckboxChange(playerId, setAllSafeties, allSafeties)}
                />
                <Label htmlFor={`safeties-${playerId}`} className="font-normal cursor-pointer">
                  All Safeties (+700 pts)
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`coup-${playerId}`}>Coup-Fourré Count (×300 pts each)</Label>
              <Input
                id={`coup-${playerId}`}
                type="number"
                placeholder="0"
                value={coupFourre.get(playerId) || ''}
                onChange={(e) => handleCoupFourreChange(playerId, e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`other-${playerId}`}>Other Bonuses</Label>
              <Input
                id={`other-${playerId}`}
                type="number"
                placeholder="0"
                value={otherBonuses.get(playerId) || ''}
                onChange={(e) => handleOtherBonusesChange(playerId, e.target.value)}
              />
            </div>
          </div>
        );
      })}

      <Button onClick={handleSubmit} className="w-full">
        Submit Scores
      </Button>
    </div>
  );
}
