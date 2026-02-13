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
import type { LocalSession, LocalRound, RoundEntryState, SessionPlayer } from '../lib/sessionTypes';
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
  const standings = getStandings(
    localSession.rounds,
    localSession.players,
    localSession.gameType,
    localSession.phase10Progress
  );
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
      // Compute new phase progress locally for immediate UI update - only for completed phases
      const updatedProgress = new Map(localSession.phase10Progress || new Map());
      entryState.state.phaseCompletions.forEach((completed, playerId) => {
        if (completed) {
          const currentPhase = updatedProgress.get(playerId) || 1;
          const nextPhase = Math.min(currentPhase + 1, 10);
          updatedProgress.set(playerId, nextPhase);
        }
      });

      if (!isQuickSession && localSession.savedSessionId) {
        // Saved session: submit to backend
        const playerScores = Array.from(scores.entries()).map(([playerId, score]) => ({
          playerId: BigInt(playerId),
          score: BigInt(score),
        }));

        // Send all completion entries to backend (backend will filter by completed=true)
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

        // Update local state with new round and phase progress after successful backend submission
        const updatedRounds = [...localSession.rounds, newRound];
        setLocalSession({
          ...localSession,
          rounds: updatedRounds,
          phase10Progress: updatedProgress,
        });

        toast.success('Round submitted successfully');
      } else {
        // Quick session: update local state with computed phase progression
        const updatedRounds = [...localSession.rounds, newRound];
        setLocalSession({
          ...localSession,
          rounds: updatedRounds,
          phase10Progress: updatedProgress,
        });
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

  // Sort players for Phase 10 score entry using the same logic as standings
  const getSortedPlayers = (): SessionPlayer[] => {
    if (localSession.gameType !== 'phase10') {
      return localSession.players;
    }

    const playersCopy = [...localSession.players];
    playersCopy.sort((a, b) => {
      const playerIdA = typeof a.id === 'bigint' ? a.id.toString() : a.id;
      const playerIdB = typeof b.id === 'bigint' ? b.id.toString() : b.id;
      
      const phaseA = localSession.phase10Progress?.get(playerIdA) || 1;
      const phaseB = localSession.phase10Progress?.get(playerIdB) || 1;
      
      // Higher phase first
      if (phaseB !== phaseA) {
        return phaseB - phaseA;
      }
      
      // Calculate total scores
      const totalA = localSession.rounds.reduce((sum, round) => {
        return sum + (round.scores.get(playerIdA) || 0);
      }, 0);
      const totalB = localSession.rounds.reduce((sum, round) => {
        return sum + (round.scores.get(playerIdB) || 0);
      }, 0);
      
      // Lower score wins
      if (totalA !== totalB) {
        return totalA - totalB;
      }
      
      // Deterministic tie-break by playerId
      return playerIdA.localeCompare(playerIdB);
    });

    return playersCopy;
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
      const sortedPlayers = getSortedPlayers();
      return (
        <Phase10ScoreEntry
          key={resetNonce}
          players={sortedPlayers}
          onSubmit={(scores, state) => handleAddPhase10Round(scores, { type: 'phase10', state })}
          phase10Progress={localSession.phase10Progress}
          currentUserPrincipal={identity?.getPrincipal().toString()}
          isSubmitting={isSubmittingRound}
          compactCheckboxLayout={true}
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

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate({ to: '/' })} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Games
        </Button>
        <h1 className="text-3xl font-bold">{template.name}</h1>
        <p className="text-muted-foreground mt-1">
          {isQuickSession ? 'Quick Game' : `Session #${sessionId}`}
        </p>
      </div>

      {gameEnd.isEnded && (
        <Card className="mb-6 border-primary bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Trophy className="h-5 w-5" />
              Game Over!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {gameEnd.winners.length === 1
                ? `${gameEnd.winners[0].playerName} wins!`
                : `Tie between: ${gameEnd.winners.map((w) => w.playerName).join(', ')}`}
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {standings.map((standing, index) => (
              <div key={standing.playerId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground w-6">#{index + 1}</span>
                  <div>
                    <p className="font-semibold">{standing.playerName}</p>
                    {localSession.gameType === 'phase10' && (
                      <p className="text-sm text-muted-foreground">
                        Phase {getPlayerPhase(standing.playerId)}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xl font-bold">{standing.total}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {localSession.rounds.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Rounds</CardTitle>
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

      {!gameEnd.isEnded && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {isAddingRound
                  ? `Round ${localSession.rounds.length + 1}`
                  : 'Add New Round'}
              </span>
              {!isAddingRound && (
                <Button onClick={() => setIsAddingRound(true)} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Round
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          {isAddingRound && (
            <CardContent>
              {renderScoreEntry()}
              <Separator className="my-4" />
              <Button variant="outline" onClick={handleCancelAddRound} className="w-full">
                Cancel
              </Button>
            </CardContent>
          )}
        </Card>
      )}

      {editingRound && (
        <EditRoundDialog
          round={editingRound}
          players={localSession.players}
          gameType={localSession.gameType}
          onSave={handleUpdateRound}
          onClose={() => setEditingRound(null)}
          phase10Progress={localSession.phase10Progress}
          currentUserPrincipal={identity?.getPrincipal().toString()}
        />
      )}
    </div>
  );
}
