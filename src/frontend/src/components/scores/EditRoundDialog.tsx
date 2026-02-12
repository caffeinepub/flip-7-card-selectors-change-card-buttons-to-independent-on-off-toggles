import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import SkyjoScoreEntry from './SkyjoScoreEntry';
import MilleBornesScoreEntry from './MilleBornesScoreEntry';
import NertsScoreEntry from './NertsScoreEntry';
import Flip7ScoreEntry from './Flip7ScoreEntry';
import GenericGameScoreEntry from './GenericGameScoreEntry';
import Phase10ScoreEntry from './Phase10ScoreEntry';
import type { LocalRound, SessionPlayer, GameType, RoundEntryState } from '../../lib/sessionTypes';

interface EditRoundDialogProps {
  round: LocalRound;
  players: SessionPlayer[];
  gameType: GameType;
  onSave: (roundNumber: number, scores: Map<string, number>, entryState?: RoundEntryState) => void;
  onClose: () => void;
}

export default function EditRoundDialog({
  round,
  players,
  gameType,
  onSave,
  onClose,
}: EditRoundDialogProps) {
  const [resetNonce, setResetNonce] = useState(0);

  const handleSave = (scores: Map<string, number>, entryState?: RoundEntryState) => {
    onSave(round.roundNumber, scores, entryState);
  };

  const handleCancel = () => {
    setResetNonce((prev) => prev + 1);
    onClose();
  };

  useEffect(() => {
    setResetNonce((prev) => prev + 1);
  }, [round.roundNumber]);

  const renderScoreEntry = () => {
    if (gameType === 'skyjo') {
      const initialState =
        round.entryState?.type === 'skyjo' ? round.entryState.state : undefined;
      return (
        <SkyjoScoreEntry
          key={resetNonce}
          players={players}
          onSubmit={(scores, state) => handleSave(scores, { type: 'skyjo', state })}
          initialState={initialState}
        />
      );
    } else if (gameType === 'milleBornes') {
      const initialState =
        round.entryState?.type === 'milleBornes' ? round.entryState.state : undefined;
      return (
        <MilleBornesScoreEntry
          key={resetNonce}
          players={players}
          onSubmit={(scores, state) => handleSave(scores, { type: 'milleBornes', state })}
          initialState={initialState}
        />
      );
    } else if (gameType === 'nerts') {
      const initialState =
        round.entryState?.type === 'nerts' ? round.entryState.state : undefined;
      return (
        <NertsScoreEntry
          key={resetNonce}
          players={players}
          onSubmit={(scores, state) => handleSave(scores, { type: 'nerts', state })}
          initialState={initialState}
        />
      );
    } else if (gameType === 'flip7') {
      const initialState =
        round.entryState?.type === 'flip7' ? round.entryState.state : undefined;
      return (
        <Flip7ScoreEntry
          key={resetNonce}
          players={players}
          onSubmit={(scores, state) => handleSave(scores, { type: 'flip7', state })}
          initialState={initialState}
        />
      );
    } else if (gameType === 'phase10') {
      const initialState =
        round.entryState?.type === 'phase10' ? round.entryState.state : undefined;
      return (
        <Phase10ScoreEntry
          key={resetNonce}
          players={players}
          onSubmit={(scores, state) => handleSave(scores, { type: 'phase10', state })}
          initialState={initialState}
        />
      );
    } else if (gameType === 'genericGame') {
      const initialState =
        round.entryState?.type === 'genericGame' ? round.entryState.state : undefined;
      return (
        <GenericGameScoreEntry
          key={resetNonce}
          players={players}
          onSubmit={(scores, state) => handleSave(scores, { type: 'genericGame', state })}
          initialState={initialState}
        />
      );
    }
    return null;
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Round {round.roundNumber}</DialogTitle>
        </DialogHeader>
        <div className="py-4">{renderScoreEntry()}</div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
