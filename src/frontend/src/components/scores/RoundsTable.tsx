import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Pencil } from 'lucide-react';
import type { SessionPlayer, LocalRound } from '../../lib/sessionTypes';

interface RoundsTableProps {
  players: SessionPlayer[];
  rounds: LocalRound[];
  onUpdateRound: (roundNumber: number, scores: Map<string, number>) => void;
}

export default function RoundsTable({ players, rounds, onUpdateRound }: RoundsTableProps) {
  const [editingRound, setEditingRound] = useState<LocalRound | null>(null);
  const [editScores, setEditScores] = useState<Map<string, string>>(new Map());

  const handleEditClick = (round: LocalRound) => {
    setEditingRound(round);
    const scoreStrings = new Map<string, string>();
    round.scores.forEach((score, playerId) => {
      scoreStrings.set(playerId, score.toString());
    });
    setEditScores(scoreStrings);
  };

  const handleScoreChange = (playerId: string, value: string) => {
    const newScores = new Map(editScores);
    newScores.set(playerId, value);
    setEditScores(newScores);
  };

  const handleSaveEdit = () => {
    if (!editingRound) return;

    const numericScores = new Map<string, number>();
    editScores.forEach((scoreStr, playerId) => {
      const score = parseInt(scoreStr, 10);
      if (!isNaN(score)) {
        numericScores.set(playerId, score);
      }
    });

    onUpdateRound(editingRound.roundNumber, numericScores);
    setEditingRound(null);
    setEditScores(new Map());
  };

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Round</TableHead>
              {players.map((player) => (
                <TableHead key={typeof player.id === 'bigint' ? player.id.toString() : player.id}>
                  {player.name}
                </TableHead>
              ))}
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rounds.map((round) => (
              <TableRow key={round.roundNumber}>
                <TableCell className="font-medium">{round.roundNumber}</TableCell>
                {players.map((player) => {
                  const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
                  const score = round.scores.get(playerId) || 0;
                  return <TableCell key={playerId}>{score}</TableCell>;
                })}
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleEditClick(round)} className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingRound} onOpenChange={() => setEditingRound(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Round {editingRound?.roundNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {players.map((player) => {
              const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
              return (
                <div key={playerId} className="space-y-2">
                  <Label htmlFor={`edit-${playerId}`}>{player.name}</Label>
                  <Input
                    id={`edit-${playerId}`}
                    type="number"
                    value={editScores.get(playerId) || ''}
                    onChange={(e) => handleScoreChange(playerId, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRound(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
