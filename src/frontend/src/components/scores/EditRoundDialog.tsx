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
import type { LocalRound, SessionPlayer, RoundEntryState } from '../../lib/sessionTypes';

interface EditRoundDialogProps {
  round: LocalRound;
  players: SessionPlayer[];
  gameType: 'skyjo' | 'milleBornes' | 'nerts' | 'flip7' | 'phase10' | 'genericGame';
  onSave: (roundNumber: number, scores: Map<string, number>, entryState?: RoundEntryState) => void;
  onClose: () => void;
  phase10Progress?: Map<string, number>;
  currentUserPrincipal?: string;
}

export default function EditRoundDialog({
  round,
  players,
  gameType,
  onSave,
  onClose,
  phase10Progress,
  currentUserPrincipal,
}: EditRoundDialogProps) {
  const [resetNonce, setResetNonce] = useState(0);

  useEffect(() => {
    setResetNonce((prev) => prev + 1);
  }, [round.roundNumber]);

  const handleSave = (scores: Map<string, number>, entryState?: RoundEntryState) => {
    onSave(round.roundNumber, scores, entryState);
  };

  const handleCancel = () => {
    setResetNonce((prev) => prev + 1);
    onClose();
  };

  // Sort players for Phase 10 using the same logic as score entry
  const getSortedPlayers = (): SessionPlayer[] => {
    if (gameType !== 'phase10') {
      return players;
    }

    const playersCopy = [...players];
    playersCopy.sort((a, b) => {
      const playerIdA = typeof a.id === 'bigint' ? a.id.toString() : a.id;
      const playerIdB = typeof b.id === 'bigint' ? b.id.toString() : b.id;
      
      const phaseA = phase10Progress?.get(playerIdA) || 1;
      const phaseB = phase10Progress?.get(playerIdB) || 1;
      
      // Higher phase first
      if (phaseB !== phaseA) {
        return phaseB - phaseA;
      }
      
      // For edit dialog, we don't have access to all rounds to compute totals,
      // so we just use the current round scores for secondary sort
      const scoreA = round.scores.get(playerIdA) || 0;
      const scoreB = round.scores.get(playerIdB) || 0;
      
      // Lower score wins
      if (scoreA !== scoreB) {
        return scoreA - scoreB;
      }
      
      // Deterministic tie-break by playerId
      return playerIdA.localeCompare(playerIdB);
    });

    return playersCopy;
  };

  const renderScoreEntry = () => {
    if (gameType === 'skyjo') {
      return (
        <SkyjoScoreEntry
          key={resetNonce}
          players={players}
          onSubmit={(scores, state) => handleSave(scores, { type: 'skyjo', state })}
          initialState={round.entryState?.type === 'skyjo' ? round.entryState.state : undefined}
        />
      );
    } else if (gameType === 'milleBornes') {
      return (
        <MilleBornesScoreEntry
          key={resetNonce}
          players={players}
          onSubmit={(scores, state) => handleSave(scores, { type: 'milleBornes', state })}
          initialState={round.entryState?.type === 'milleBornes' ? round.entryState.state : undefined}
        />
      );
    } else if (gameType === 'nerts') {
      return (
        <NertsScoreEntry
          key={resetNonce}
          players={players}
          onSubmit={(scores, state) => handleSave(scores, { type: 'nerts', state })}
          initialState={round.entryState?.type === 'nerts' ? round.entryState.state : undefined}
        />
      );
    } else if (gameType === 'flip7') {
      return (
        <Flip7ScoreEntry
          key={resetNonce}
          players={players}
          onSubmit={(scores, state) => handleSave(scores, { type: 'flip7', state })}
          initialState={round.entryState?.type === 'flip7' ? round.entryState.state : undefined}
        />
      );
    } else if (gameType === 'phase10') {
      const sortedPlayers = getSortedPlayers();
      return (
        <Phase10ScoreEntry
          key={resetNonce}
          players={sortedPlayers}
          onSubmit={(scores, state) => handleSave(scores, { type: 'phase10', state })}
          initialState={round.entryState?.type === 'phase10' ? round.entryState.state : undefined}
          phase10Progress={phase10Progress}
          currentUserPrincipal={currentUserPrincipal}
          compactCheckboxLayout={true}
          oneWayCheckbox={false}
        />
      );
    } else if (gameType === 'genericGame') {
      return (
        <GenericGameScoreEntry
          key={resetNonce}
          players={players}
          onSubmit={(scores, state) => handleSave(scores, { type: 'genericGame', state })}
          initialState={round.entryState?.type === 'genericGame' ? round.entryState.state : undefined}
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
        <div className="py-4">
          {renderScoreEntry()}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
