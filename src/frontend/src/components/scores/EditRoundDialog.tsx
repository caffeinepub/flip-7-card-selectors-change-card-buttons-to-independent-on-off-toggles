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
import Phase10ScoreEntry from './Phase10ScoreEntry';
import GenericGameScoreEntry from './GenericGameScoreEntry';
import SpiritsOwlScoreEntry from './SpiritsOwlScoreEntry';
import type { LocalRound, SessionPlayer, RoundEntryState, GameType } from '../../lib/sessionTypes';

interface EditRoundDialogProps {
  round: LocalRound;
  players: SessionPlayer[];
  gameType: GameType;
  phase10Progress?: Map<string, number>;
  activeSpiritsAnimalIds?: bigint[];
  onSave: (roundNumber: number, scores: Map<string, number>, entryState?: RoundEntryState) => void;
  onCancel: () => void;
}

export default function EditRoundDialog({
  round,
  players,
  gameType,
  phase10Progress,
  activeSpiritsAnimalIds,
  onSave,
  onCancel,
}: EditRoundDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (scores: Map<string, number>, state: any) => {
    setIsSubmitting(true);
    const entryState: RoundEntryState = {
      type: gameType as any,
      state,
    };
    await onSave(round.roundNumber, scores, entryState);
    setIsSubmitting(false);
  };

  const sortedPlayers =
    gameType === 'phase10'
      ? [...players].sort((a, b) => {
          const phaseA = phase10Progress?.get(a.id.toString()) || 1;
          const phaseB = phase10Progress?.get(b.id.toString()) || 1;
          return phaseB - phaseA;
        })
      : players;

  const renderScoreEntry = () => {
    const activeAnimalIds = activeSpiritsAnimalIds || [BigInt(0)];
    const isOwlActive = activeAnimalIds.some(id => id === BigInt(0));

    switch (gameType) {
      case 'skyjo':
        return (
          <SkyjoScoreEntry
            players={sortedPlayers}
            onSubmit={handleSubmit}
            initialState={round.entryState?.type === 'skyjo' ? round.entryState.state : undefined}
          />
        );
      case 'milleBornes':
        return (
          <MilleBornesScoreEntry
            players={sortedPlayers}
            onSubmit={handleSubmit}
            initialState={
              round.entryState?.type === 'milleBornes' ? round.entryState.state : undefined
            }
          />
        );
      case 'nerts':
        return (
          <NertsScoreEntry
            players={sortedPlayers}
            onSubmit={handleSubmit}
            initialState={round.entryState?.type === 'nerts' ? round.entryState.state : undefined}
          />
        );
      case 'flip7':
        return (
          <Flip7ScoreEntry
            players={sortedPlayers}
            onSubmit={handleSubmit}
            initialState={round.entryState?.type === 'flip7' ? round.entryState.state : undefined}
          />
        );
      case 'phase10':
        return (
          <Phase10ScoreEntry
            players={sortedPlayers}
            phase10Progress={phase10Progress}
            onSubmit={handleSubmit}
            initialState={round.entryState?.type === 'phase10' ? round.entryState.state : undefined}
            oneWayCheckbox={false}
          />
        );
      case 'genericGame':
        return (
          <GenericGameScoreEntry
            players={sortedPlayers}
            onSubmit={handleSubmit}
            initialState={
              round.entryState?.type === 'genericGame' ? round.entryState.state : undefined
            }
          />
        );
      case 'spiritsOwl':
        if (activeAnimalIds.length === 0) {
          return (
            <div className="py-8">
              <p className="text-center text-muted-foreground">
                No character boards selected.
              </p>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            {isOwlActive && (
              <SpiritsOwlScoreEntry
                players={sortedPlayers}
                onSubmit={handleSubmit}
                initialState={
                  round.entryState?.type === 'spiritsOwl' ? round.entryState.state : undefined
                }
              />
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Round {round.roundNumber}</DialogTitle>
        </DialogHeader>
        <div className="py-4">{renderScoreEntry()}</div>
      </DialogContent>
    </Dialog>
  );
}
