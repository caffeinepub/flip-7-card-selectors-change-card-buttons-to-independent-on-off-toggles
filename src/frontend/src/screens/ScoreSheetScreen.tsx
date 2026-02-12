import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from '@tanstack/react-router';
import { useGetGameSession, useAddRound, useUpdateRound, useSubmitPhase10Round } from '../hooks/useGameSessions';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { getGameTemplate } from '../gameTemplates';
import { getStandings, checkGameEnd } from '../lib/scoring';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Trophy, Plus, ArrowLeft } from 'lucide-react';
import SkyjoScoreEntry from '../components/scores/SkyjoScoreEntry';
import MilleBornesScoreEntry from '../components/scores/MilleBornesScoreEntry';
import NertsScoreEntry from '../components/scores/NertsScoreEntry';
import Flip7ScoreEntry from '../components/scores/Flip7ScoreEntry';
import GenericGameScoreEntry from '../components/scores/GenericGameScoreEntry';
import Phase10ScoreEntry from '../components/scores/Phase10ScoreEntry';
import RoundsTable from '../components/scores/RoundsTable';
import EditRoundDialog from '../components/scores/EditRoundDialog';
import type { LocalSession, LocalRound, RoundEntryState } from '../lib/sessionTypes';
import { toast } from 'sonner';

export default function ScoreSheetScreen() {
  const { sessionId } = useParams({ from: '/game/$sessionId' });
  const navigate = useNavigate();
  const location = useLocation();
  const isQuickSession = sessionId === 'quick';
  const { identity } = useInternetIdentity();

  const { data: savedSession, isLoading: sessionLoading } = useGetGameSession(
    isQuickSession ? null : BigInt(sessionId)
  );
  const addRound = useAddRound();
  const updateRound = useUpdateRound();
  const submitPhase10Round = useSubmitPhase10Round();

  const [localSession, setLocalSession] = useState<LocalSession | null>(null);
  const [isAddingRound, setIsAddingRound] = useState(false);
  const [editingRound, setEditingRound] = useState<LocalRound | null>(null);
  const [resetNonce, setResetNonce] = useState(0);
  const [isSubmittingRound, setIsSubmittingRound] = useState(false);

  useEffect(() => {
    if (isQuickSession) {
      const quickSession = (location.state as any)?.quickSession;
      if (quickSession) {
        setLocalSession(quickSession);
      }
    } else if (savedSession) {
      const players = savedSession.players.map((p) => ({
        id: p.id,
        name: p.name,
        isQuick: false,
        ownerPrincipal: p.owner.toString(),
      }));

      const rounds: LocalRound[] = savedSession.rounds.map((r) => {
        const scores = new Map<string, number>();
        r.playerScores.forEach((ps) => {
          scores.set(ps.playerId.toString(), Number(ps.score));
        });
        return {
          roundNumber: Number(r.roundNumber),
          scores,
        };
      });

      const gameTypeStr = savedSession.gameType.__kind__;
      const nertsWinTarget = savedSession.nertsWinTarget ? Number(savedSession.nertsWinTarget) : undefined;
      const flip7TargetScore = savedSession.flip7TargetScore ? Number(savedSession.flip7TargetScore) : undefined;
      const phase10WinTarget = savedSession.phase10WinTarget ? Number(savedSession.phase10WinTarget) : undefined;

      // Extract phase10Progress and clamp to 1-10
      const phase10Progress = savedSession.phase10Progress
        ? new Map(
            savedSession.phase10Progress.map((p) => [
              p.playerId.toString(),
              Math.max(1, Math.min(10, Number(p.currentPhase))),
            ])
          )
        : undefined;

      setLocalSession({
        gameType: gameTypeStr as any,
        players,
        rounds,
        isQuick: false,
        savedSessionId: savedSession.id,
        nertsWinTarget,
        flip7TargetScore,
        phase10WinTarget,
        phase10Progress,
      });
    }
  }, [isQuickSession, savedSession, location.state]);

  useEffect(() => {
    return () => {
      setResetNonce((prev) => prev + 1);
    };
  }, [location.pathname]);

  if (sessionLoading || !localSession) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  const template = getGameTemplate({ __kind__: localSession.gameType } as any);
  const standings = getStandings(localSession.rounds, localSession.players, localSession.gameType);
  const gameEnd = checkGameEnd(standings, localSession.gameType, localSession.nertsWinTarget, localSession.flip7TargetScore, localSession.phase10WinTarget);

  const handleAddRound = async (scores: Map<string, number>, entryState?: RoundEntryState) => {
    const roundNumber = localSession.rounds.length + 1;
    const newRound: LocalRound = {
      roundNumber,
      scores,
      entryState,
    };

    const updatedRounds = [...localSession.rounds, newRound];
    setLocalSession({ ...localSession, rounds: updatedRounds });
    setIsAddingRound(false);
    setResetNonce((prev) => prev + 1);

    if (!isQuickSession && localSession.savedSessionId) {
      const playerScores = Array.from(scores.entries()).map(([playerId, score]) => ({
        playerId: BigInt(playerId),
        score: BigInt(score),
      }));
      await addRound.mutateAsync({
        gameId: localSession.savedSessionId,
        roundNumber: BigInt(roundNumber),
        scores: playerScores,
      });
    }
  };

  const handleAddPhase10Round = async (scores: Map<string, number>, entryState: RoundEntryState) => {
    if (entryState.type !== 'phase10') return;

    const roundNumber = localSession.rounds.length + 1;
    const newRound: LocalRound = {
      roundNumber,
      scores,
      entryState,
    };

    setIsSubmittingRound(true);

    try {
      if (!isQuickSession && localSession.savedSessionId) {
        const playerScores = Array.from(scores.entries()).map(([playerId, score]) => ({
          playerId: BigInt(playerId),
          score: BigInt(score),
        }));

        const phaseCompletions = Array.from(entryState.state.phaseCompletions.entries()).map(
          ([playerId, completed]) => ({
            playerId: BigInt(playerId),
            completed,
          })
        );

        await submitPhase10Round.mutateAsync({
          gameId: localSession.savedSessionId,
          roundNumber: BigInt(roundNumber),
          scores: playerScores,
          phaseCompletions,
        });

        // Compute new phase progress locally for immediate UI update
        const updatedProgress = new Map(localSession.phase10Progress || new Map());
        entryState.state.phaseCompletions.forEach((completed, playerId) => {
          if (completed) {
            const currentPhase = updatedProgress.get(playerId) || 1;
            const nextPhase = Math.min(currentPhase + 1, 10);
            updatedProgress.set(playerId, nextPhase);
          }
        });

        const updatedRounds = [...localSession.rounds, newRound];
        setLocalSession({
          ...localSession,
          rounds: updatedRounds,
          phase10Progress: updatedProgress,
        });

        toast.success('Round submitted successfully');
      } else {
        // Quick session - just update local state
        const updatedRounds = [...localSession.rounds, newRound];
        setLocalSession({ ...localSession, rounds: updatedRounds });
      }

      setIsAddingRound(false);
      setResetNonce((prev) => prev + 1);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to submit round';
      toast.error(errorMessage);
    } finally {
      setIsSubmittingRound(false);
    }
  };

  const handleUpdateRound = async (roundNumber: number, scores: Map<string, number>, entryState?: RoundEntryState) => {
    const updatedRounds = localSession.rounds.map((r) =>
      r.roundNumber === roundNumber ? { ...r, scores, entryState } : r
    );
    setLocalSession({ ...localSession, rounds: updatedRounds });
    setEditingRound(null);

    if (!isQuickSession && localSession.savedSessionId) {
      const playerScores = Array.from(scores.entries()).map(([playerId, score]) => ({
        playerId: BigInt(playerId),
        score: BigInt(score),
      }));
      await updateRound.mutateAsync({
        gameId: localSession.savedSessionId,
        roundNumber: BigInt(roundNumber),
        scores: playerScores,
      });
    }
  };

  const handleCancelAddRound = () => {
    setIsAddingRound(false);
    setResetNonce((prev) => prev + 1);
  };

  const handleEditRound = (roundNumber: number) => {
    const round = localSession.rounds.find((r) => r.roundNumber === roundNumber);
    if (round) {
      setEditingRound(round);
    }
  };

  const getPlayerPhase = (playerId: string): number => {
    if (!localSession.phase10Progress) return 1;
    const phase = localSession.phase10Progress.get(playerId) || 1;
    return Math.max(1, Math.min(10, phase));
  };

  const renderScoreEntry = () => {
    if (localSession.gameType === 'skyjo') {
      return (
        <SkyjoScoreEntry
          key={resetNonce}
          players={localSession.players}
          onSubmit={(scores, state) => handleAddRound(scores, { type: 'skyjo', state })}
        />
      );
    } else if (localSession.gameType === 'milleBornes') {
      return (
        <MilleBornesScoreEntry
          key={resetNonce}
          players={localSession.players}
          onSubmit={(scores, state) => handleAddRound(scores, { type: 'milleBornes', state })}
        />
      );
    } else if (localSession.gameType === 'nerts') {
      return (
        <NertsScoreEntry
          key={resetNonce}
          players={localSession.players}
          onSubmit={(scores, state) => handleAddRound(scores, { type: 'nerts', state })}
        />
      );
    } else if (localSession.gameType === 'flip7') {
      return (
        <Flip7ScoreEntry
          key={resetNonce}
          players={localSession.players}
          onSubmit={(scores, state) => handleAddRound(scores, { type: 'flip7', state })}
        />
      );
    } else if (localSession.gameType === 'phase10') {
      const isPhase10SavedSession = !isQuickSession;
      return (
        <Phase10ScoreEntry
          key={resetNonce}
          players={localSession.players}
          onSubmit={(scores, state) =>
            isPhase10SavedSession
              ? handleAddPhase10Round(scores, { type: 'phase10', state })
              : handleAddRound(scores, { type: 'phase10', state })
          }
          phase10Progress={localSession.phase10Progress}
          currentUserPrincipal={identity?.getPrincipal().toString()}
          isSubmitting={isSubmittingRound}
        />
      );
    } else if (localSession.gameType === 'genericGame') {
      return (
        <GenericGameScoreEntry
          key={resetNonce}
          players={localSession.players}
          onSubmit={(scores, state) => handleAddRound(scores, { type: 'genericGame', state })}
        />
      );
    }
    return null;
  };

  const renderGameOverMessage = () => {
    if (gameEnd.winners.length === 1) {
      return (
        <p className="text-lg">
          <span className="font-semibold">{gameEnd.winners[0].playerName}</span> wins with a score of{' '}
          <span className="font-bold">{gameEnd.winners[0].total}</span>!
        </p>
      );
    } else if (gameEnd.winners.length > 1) {
      const winnerNames = gameEnd.winners.map(w => w.playerName).join(', ');
      const winningScore = gameEnd.winners[0].total;
      return (
        <p className="text-lg">
          <span className="font-semibold">{winnerNames}</span> tie for first place with a score of{' '}
          <span className="font-bold">{winningScore}</span>!
        </p>
      );
    }
    return null;
  };

  const isPhase10 = localSession.gameType === 'phase10' && !isQuickSession;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Games
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-4xl">{template.icon}</span>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{template.name}</h1>
          <p className="text-sm text-muted-foreground">
            {localSession.players.length} player{localSession.players.length !== 1 ? 's' : ''} • Round{' '}
            {localSession.rounds.length}
          </p>
        </div>
      </div>

      <Separator />

      {gameEnd.isEnded && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Game Over!
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderGameOverMessage()}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {standings.map((standing, index) => (
              <div
                key={standing.playerId}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-lg font-semibold text-muted-foreground w-6">#{index + 1}</span>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-medium">{standing.playerName}</span>
                    {isPhase10 && (
                      <span className="text-xs text-muted-foreground">
                        (Phase {getPlayerPhase(standing.playerId)})
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-lg font-semibold">{standing.total}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {!gameEnd.isEnded && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {isAddingRound ? `Round ${localSession.rounds.length + 1}` : 'Add New Round'}
              </span>
              {!isAddingRound && (
                <Button size="sm" onClick={() => setIsAddingRound(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Round
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          {isAddingRound && (
            <CardContent className="space-y-4">
              {renderScoreEntry()}
              <Button variant="outline" onClick={handleCancelAddRound} className="w-full">
                Cancel
              </Button>
            </CardContent>
          )}
        </Card>
      )}

      {localSession.rounds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Round History</CardTitle>
          </CardHeader>
          <CardContent>
            <RoundsTable
              rounds={localSession.rounds}
              players={localSession.players}
              onEditRound={handleEditRound}
            />
          </CardContent>
        </Card>
      )}

      {editingRound && (
        <EditRoundDialog
          round={editingRound}
          players={localSession.players}
          gameType={localSession.gameType}
          onSave={handleUpdateRound}
          onClose={() => setEditingRound(null)}
        />
      )}
    </div>
  );
}
