import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import SkyjoScoreEntry from './SkyjoScoreEntry';
import MilleBornesScoreEntry from './MilleBornesScoreEntry';
import NertsScoreEntry from './NertsScoreEntry';
import Flip7ScoreEntry from './Flip7ScoreEntry';
import GenericGameScoreEntry from './GenericGameScoreEntry';
import type {
  LocalRound,
  SessionPlayer,
  RoundEntryState,
  SkyjoEntryState,
  MilleBornesEntryState,
  NertsEntryState,
  Flip7EntryState,
  GenericGameEntryState,
} from '../../lib/sessionTypes';

interface EditRoundDialogProps {
  round: LocalRound;
  players: SessionPlayer[];
  gameType: 'skyjo' | 'milleBornes' | 'nerts' | 'flip7' | 'genericGame';
  onSave: (roundNumber: number, scores: Map<string, number>, entryState?: RoundEntryState) => void;
  onClose: () => void;
}

export default function EditRoundDialog({ round, players, gameType, onSave, onClose }: EditRoundDialogProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingScores, setPendingScores] = useState<Map<string, number> | null>(null);
  const [pendingEntryState, setPendingEntryState] = useState<RoundEntryState | undefined>(undefined);
  const [resetNonce, setResetNonce] = useState(0);

  const getInitialState = ():
    | SkyjoEntryState
    | MilleBornesEntryState
    | NertsEntryState
    | Flip7EntryState
    | GenericGameEntryState
    | undefined => {
    if (round.entryState) {
      return round.entryState.state;
    }

    if (gameType === 'skyjo') {
      return { playerScores: round.scores };
    } else if (gameType === 'nerts') {
      const centerCards = new Map<string, number>();
      const tableauCards = new Map<string, number>();
      players.forEach((player) => {
        const playerId = typeof player.id === 'bigint' ? player.id.toString() : player.id;
        centerCards.set(playerId, 0);
        tableauCards.set(playerId, 0);
      });
      return { centerCards, tableauCards };
    } else if (gameType === 'genericGame') {
      return { playerScores: round.scores };
    }

    return undefined;
  };

  const handleSubmit = (scores: Map<string, number>, entryState?: RoundEntryState) => {
    setPendingScores(scores);
    setPendingEntryState(entryState);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    if (pendingScores) {
      onSave(round.roundNumber, pendingScores, pendingEntryState);
      setShowConfirm(false);
      setPendingScores(null);
      setPendingEntryState(undefined);
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirm(false);
    setPendingScores(null);
    setPendingEntryState(undefined);
    setResetNonce((prev) => prev + 1);
  };

  const handleDialogClose = () => {
    setResetNonce((prev) => prev + 1);
    onClose();
  };

  const renderScoreEntry = () => {
    const initialState = getInitialState();

    if (gameType === 'skyjo') {
      return (
        <SkyjoScoreEntry
          key={resetNonce}
          players={players}
          onSubmit={(scores, state) => handleSubmit(scores, { type: 'skyjo', state })}
          initialState={initialState as SkyjoEntryState}
        />
      );
    } else if (gameType === 'milleBornes') {
      return (
        <MilleBornesScoreEntry
          key={resetNonce}
          players={players}
          onSubmit={(scores, state) => handleSubmit(scores, { type: 'milleBornes', state })}
          initialState={initialState as MilleBornesEntryState}
        />
      );
    } else if (gameType === 'nerts') {
      return (
        <NertsScoreEntry
          key={resetNonce}
          players={players}
          onSubmit={(scores, state) => handleSubmit(scores, { type: 'nerts', state })}
          initialState={initialState as NertsEntryState}
        />
      );
    } else if (gameType === 'flip7') {
      return (
        <Flip7ScoreEntry
          key={resetNonce}
          players={players}
          onSubmit={(scores, state) => handleSubmit(scores, { type: 'flip7', state })}
          initialState={initialState as Flip7EntryState}
        />
      );
    } else if (gameType === 'genericGame') {
      return (
        <GenericGameScoreEntry
          key={resetNonce}
          players={players}
          onSubmit={(scores, state) => handleSubmit(scores, { type: 'genericGame', state })}
          initialState={initialState as GenericGameEntryState}
        />
      );
    }

    return null;
  };

  return (
    <Dialog open={true} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Round {round.roundNumber}</DialogTitle>
          <DialogDescription>Update the scores for this round</DialogDescription>
        </DialogHeader>

        {showConfirm ? (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Are you sure you want to update this round? This will recalculate all standings.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelConfirm}>
                Cancel
              </Button>
              <Button onClick={handleConfirm}>Confirm Update</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="py-4">{renderScoreEntry()}</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
