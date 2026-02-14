import { useState } from 'react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import type { SessionPlayer, SpiritsOwlEntryState } from '../../lib/sessionTypes';
import { calculateOwlScore } from '../../lib/spiritsOwlScoring';

interface SpiritsOwlScoreEntryProps {
  players: SessionPlayer[];
  onSubmit: (scores: Map<string, number>, state: SpiritsOwlEntryState) => void;
  initialState?: SpiritsOwlEntryState;
}

export default function SpiritsOwlScoreEntry({
  players,
  onSubmit,
  initialState,
}: SpiritsOwlScoreEntryProps) {
  const [pair1, setPair1] = useState<Map<string, [boolean, boolean]>>(
    initialState?.pair1 || new Map(players.map((p) => [getPlayerId(p), [false, false]]))
  );
  const [pair2, setPair2] = useState<Map<string, [boolean, boolean]>>(
    initialState?.pair2 || new Map(players.map((p) => [getPlayerId(p), [false, false]]))
  );
  const [pair3, setPair3] = useState<Map<string, [boolean, boolean]>>(
    initialState?.pair3 || new Map(players.map((p) => [getPlayerId(p), [false, false]]))
  );
  const [spiritStone, setSpiritStone] = useState<Map<string, boolean>>(
    initialState?.spiritStone || new Map(players.map((p) => [getPlayerId(p), false]))
  );

  function getPlayerId(player: SessionPlayer): string {
    return typeof player.id === 'bigint' ? player.id.toString() : player.id;
  }

  const togglePairStone = (
    playerId: string,
    pairState: Map<string, [boolean, boolean]>,
    setPairState: (state: Map<string, [boolean, boolean]>) => void,
    stoneIndex: 0 | 1
  ) => {
    const newState = new Map(pairState);
    const current = newState.get(playerId) || [false, false];
    const updated: [boolean, boolean] = [...current] as [boolean, boolean];
    updated[stoneIndex] = !updated[stoneIndex];
    newState.set(playerId, updated);
    setPairState(newState);
  };

  const toggleSpiritStone = (playerId: string) => {
    const newState = new Map(spiritStone);
    newState.set(playerId, !newState.get(playerId));
    setSpiritStone(newState);
  };

  const calculatePlayerScore = (playerId: string): number => {
    const p1 = pair1.get(playerId) || [false, false];
    const p2 = pair2.get(playerId) || [false, false];
    const p3 = pair3.get(playerId) || [false, false];
    const spirit = spiritStone.get(playerId) || false;

    return calculateOwlScore(p1, p2, p3, spirit);
  };

  const handleSubmit = () => {
    // Snapshot the current state at submission time
    const snapshotPair1 = new Map(pair1);
    const snapshotPair2 = new Map(pair2);
    const snapshotPair3 = new Map(pair3);
    const snapshotSpiritStone = new Map(spiritStone);

    const scores = new Map<string, number>();
    players.forEach((player) => {
      const playerId = getPlayerId(player);
      scores.set(playerId, calculatePlayerScore(playerId));
    });

    const state: SpiritsOwlEntryState = {
      pair1: snapshotPair1,
      pair2: snapshotPair2,
      pair3: snapshotPair3,
      spiritStone: snapshotSpiritStone,
    };

    onSubmit(scores, state);
  };

  const allPlayersHaveScores = players.every((player) => {
    const playerId = getPlayerId(player);
    return calculatePlayerScore(playerId) >= 0;
  });

  return (
    <div className="space-y-6">
      {players.map((player) => {
        const playerId = getPlayerId(player);
        const score = calculatePlayerScore(playerId);

        return (
          <Card key={playerId}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{player.name}</h3>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Score</p>
                    <p className="text-2xl font-bold">{score}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Stone Pairs</Label>
                    
                    {/* Pair 1 */}
                    <div className="flex items-center gap-3 p-2 rounded-md bg-muted/30">
                      <span className="text-sm text-muted-foreground w-16">Pair 1:</span>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`${playerId}-pair1-stone1`}
                          checked={pair1.get(playerId)?.[0] || false}
                          onCheckedChange={() => togglePairStone(playerId, pair1, setPair1, 0)}
                        />
                        <Label htmlFor={`${playerId}-pair1-stone1`} className="text-sm cursor-pointer">
                          Stone 1
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`${playerId}-pair1-stone2`}
                          checked={pair1.get(playerId)?.[1] || false}
                          onCheckedChange={() => togglePairStone(playerId, pair1, setPair1, 1)}
                        />
                        <Label htmlFor={`${playerId}-pair1-stone2`} className="text-sm cursor-pointer">
                          Stone 2
                        </Label>
                      </div>
                    </div>

                    {/* Pair 2 */}
                    <div className="flex items-center gap-3 p-2 rounded-md bg-muted/30">
                      <span className="text-sm text-muted-foreground w-16">Pair 2:</span>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`${playerId}-pair2-stone1`}
                          checked={pair2.get(playerId)?.[0] || false}
                          onCheckedChange={() => togglePairStone(playerId, pair2, setPair2, 0)}
                        />
                        <Label htmlFor={`${playerId}-pair2-stone1`} className="text-sm cursor-pointer">
                          Stone 1
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`${playerId}-pair2-stone2`}
                          checked={pair2.get(playerId)?.[1] || false}
                          onCheckedChange={() => togglePairStone(playerId, pair2, setPair2, 1)}
                        />
                        <Label htmlFor={`${playerId}-pair2-stone2`} className="text-sm cursor-pointer">
                          Stone 2
                        </Label>
                      </div>
                    </div>

                    {/* Pair 3 */}
                    <div className="flex items-center gap-3 p-2 rounded-md bg-muted/30">
                      <span className="text-sm text-muted-foreground w-16">Pair 3:</span>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`${playerId}-pair3-stone1`}
                          checked={pair3.get(playerId)?.[0] || false}
                          onCheckedChange={() => togglePairStone(playerId, pair3, setPair3, 0)}
                        />
                        <Label htmlFor={`${playerId}-pair3-stone1`} className="text-sm cursor-pointer">
                          Stone 1
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`${playerId}-pair3-stone2`}
                          checked={pair3.get(playerId)?.[1] || false}
                          onCheckedChange={() => togglePairStone(playerId, pair3, setPair3, 1)}
                        />
                        <Label htmlFor={`${playerId}-pair3-stone2`} className="text-sm cursor-pointer">
                          Stone 2
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Spirit Stone - visually distinct */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-3 p-3 rounded-md bg-primary/10 border border-primary/20">
                      <Checkbox
                        id={`${playerId}-spirit-stone`}
                        checked={spiritStone.get(playerId) || false}
                        onCheckedChange={() => toggleSpiritStone(playerId)}
                        className="border-primary data-[state=checked]:bg-primary"
                      />
                      <Label
                        htmlFor={`${playerId}-spirit-stone`}
                        className="text-sm font-semibold cursor-pointer flex-1"
                      >
                        ✨ Spirit Stone (doubles score)
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Button onClick={handleSubmit} disabled={!allPlayersHaveScores} className="w-full" size="lg">
        Submit Scores
      </Button>
    </div>
  );
}
