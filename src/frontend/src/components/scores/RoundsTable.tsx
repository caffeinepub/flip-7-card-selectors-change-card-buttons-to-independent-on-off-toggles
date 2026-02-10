import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Pencil } from 'lucide-react';
import type { SessionPlayer, LocalRound } from '../../lib/sessionTypes';

interface RoundsTableProps {
  players: SessionPlayer[];
  rounds: LocalRound[];
  onEditRound: (roundNumber: number) => void;
}

export default function RoundsTable({ players, rounds, onEditRound }: RoundsTableProps) {
  return (
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEditRound(round.roundNumber)}
                  className="h-8 w-8"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
