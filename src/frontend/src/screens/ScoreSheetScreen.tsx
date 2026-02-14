import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from '@tanstack/react-router';
import { useGetGameSession, useAddRound, useUpdateRound, useSubmitPhase10Round } from '../hooks/useGameSessions';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { getGameTemplate, deriveLocalGameType, createGameType } from '../gameTemplates';
import { getStandings, checkGameEnd } from '../lib/scoring';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Trophy, Plus, ArrowLeft } from 'lucide-react';
import SkyjoScoreEntry from '../components/scores/SkyjoScoreEntry';
import MilleBornesScoreEntry from '../components/scores/MilleBornesScoreEntry';
import NertsScoreEntry from '../components/scores/NertsScoreEntry';
import Flip7ScoreEntry from '../components/scores/Flip7ScoreEntry';
import Phase10ScoreEntry from '../components/scores/Phase10ScoreEntry';
import GenericGameScoreEntry from '../components/scores/GenericGameScoreEntry';
import SpiritsOwlScoreEntry from '../components/scores/SpiritsOwlScoreEntry';
import RoundsTable from '../components/scores/RoundsTable';
import EditRoundDialog from '../components/scores/EditRoundDialog';
import type { LocalSession, SessionPlayer, LocalRound, RoundEntryState } from '../lib/sessionTypes';
import type { PlayerScore, Phase10Completion } from '../backend';
import { saveRoundEntryState, loadRoundEntryState } from '../lib/roundEntryStateStorage';

export default function ScoreSheetScreen() {
  const { sessionId } = useParams({ from: '/game/$sessionId' });
  const navigate = useNavigate();
  const location = useLocation();
  const { identity } = useInternetIdentity();

  const isQuickSession = sessionId === 'quick';
  const savedSessionId = isQuickSession ? null : BigInt(sessionId);

  const { data: savedSession, isLoading: sessionLoading } = useGetGameSession(savedSessionId);
  const addRound = useAddRound();
  const updateRound = useUpdateRound();
  const submitPhase10Round = useSubmitPhase10Round();

  const [localSession, setLocalSession] = useState<LocalSession | null>(null);
  const [showScoreEntry, setShowScoreEntry] = useState(false);
  const [editingRound, setEditingRound] = useState<LocalRound | null>(null);

  // Initialize local session from saved session or quick session state
  useEffect(() => {
    if (isQuickSession) {
      const quickSession = (location.state as any)?.quickSession;
      if (quickSession) {
        setLocalSession(quickSession);
      }
    } else if (savedSession) {
      const gameType = deriveLocalGameType(savedSession.gameType);
      const players: SessionPlayer[] = savedSession.players.map((p) => ({
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

        const entryState = loadRoundEntryState(
          savedSession.id.toString(),
          gameType,
          Number(r.roundNumber)
        );

        return {
          roundNumber: Number(r.roundNumber),
          scores,
          entryState,
        };
      });

      const phase10Progress = savedSession.phase10Progress
        ? new Map(
            savedSession.phase10Progress.map((pp) => [pp.playerId.toString(), Number(pp.currentPhase)])
          )
        : undefined;

      // Extract active animal IDs from navigation state if available
      const activeSpiritsAnimalIds = (location.state as any)?.activeSpiritsAnimalIds;

      setLocalSession({
        gameType,
        players,
        rounds,
        isQuick: false,
        savedSessionId: savedSession.id,
        nertsWinTarget: savedSession.nertsWinTarget ? Number(savedSession.nertsWinTarget) : undefined,
        flip7TargetScore: savedSession.flip7TargetScore ? Number(savedSession.flip7TargetScore) : undefined,
        phase10WinTarget: savedSession.phase10WinTarget ? Number(savedSession.phase10WinTarget) : undefined,
        phase10Progress,
        activeSpiritsAnimalIds: activeSpiritsAnimalIds || [BigInt(0)], // Default to Owl if not specified
      });
    }
  }, [isQuickSession, savedSession, location.state]);

  if (!localSession) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  const template = getGameTemplate(
    localSession.gameType === 'spiritsOwl'
      ? createGameType('spiritsOwl')
      : createGameType(localSession.gameType)
  );

  const standings = getStandings(
    localSession.rounds,
    localSession.players,
    localSession.gameType,
    localSession.phase10Progress
  );

  const gameEndResult = checkGameEnd(
    standings,
    localSession.gameType,
    localSession.nertsWinTarget,
    localSession.flip7TargetScore,
    localSession.phase10WinTarget
  );

  const gameEnded = gameEndResult.isEnded;

  const handleAddRound = async (scores: Map<string, number>, entryState?: RoundEntryState) => {
    const roundNumber = localSession.rounds.length + 1;
    const newRound: LocalRound = {
      roundNumber,
      scores,
      entryState,
    };

    const updatedRounds = [...localSession.rounds, newRound];
    setLocalSession({ ...localSession, rounds: updatedRounds });

    if (entryState) {
      const storageSessionId = isQuickSession ? 'quick' : savedSessionId!.toString();
      saveRoundEntryState(storageSessionId, localSession.gameType, roundNumber, entryState);
    }

    if (!isQuickSession && savedSessionId) {
      const playerScores: PlayerScore[] = Array.from(scores.entries()).map(([playerId, score]) => ({
        playerId: BigInt(playerId),
        score: BigInt(score),
      }));

      if (localSession.gameType === 'phase10' && entryState?.type === 'phase10') {
        const phaseCompletions: Phase10Completion[] = Array.from(
          entryState.state.phaseCompletions.entries()
        ).map(([playerId, completed]) => ({
          playerId: BigInt(playerId),
          completed,
        }));

        await submitPhase10Round.mutateAsync({
          gameId: savedSessionId,
          roundNumber: BigInt(roundNumber),
          scores: playerScores,
          phaseCompletions,
        });

        if (savedSession?.phase10Progress) {
          const updatedProgress = new Map(localSession.phase10Progress);
          phaseCompletions.forEach((pc) => {
            if (pc.completed) {
              const currentPhase = updatedProgress.get(pc.playerId.toString()) || 1;
              updatedProgress.set(pc.playerId.toString(), Math.min(currentPhase + 1, 10));
            }
          });
          setLocalSession({ ...localSession, rounds: updatedRounds, phase10Progress: updatedProgress });
        }
      } else {
        await addRound.mutateAsync({
          gameId: savedSessionId,
          roundNumber: BigInt(roundNumber),
          scores: playerScores,
        });
      }
    }

    setShowScoreEntry(false);
  };

  const handleUpdateRound = async (
    roundNumber: number,
    scores: Map<string, number>,
    entryState?: RoundEntryState
  ) => {
    const updatedRounds = localSession.rounds.map((r) =>
      r.roundNumber === roundNumber ? { ...r, scores, entryState } : r
    );
    setLocalSession({ ...localSession, rounds: updatedRounds });

    if (entryState) {
      const storageSessionId = isQuickSession ? 'quick' : savedSessionId!.toString();
      saveRoundEntryState(storageSessionId, localSession.gameType, roundNumber, entryState);
    }

    if (!isQuickSession && savedSessionId) {
      const playerScores: PlayerScore[] = Array.from(scores.entries()).map(([playerId, score]) => ({
        playerId: BigInt(playerId),
        score: BigInt(score),
      }));

      if (localSession.gameType === 'phase10' && entryState?.type === 'phase10') {
        const phaseCompletions: Phase10Completion[] = Array.from(
          entryState.state.phaseCompletions.entries()
        ).map(([playerId, completed]) => ({
          playerId: BigInt(playerId),
          completed,
        }));

        await submitPhase10Round.mutateAsync({
          gameId: savedSessionId,
          roundNumber: BigInt(roundNumber),
          scores: playerScores,
          phaseCompletions,
        });
      } else {
        await updateRound.mutateAsync({
          gameId: savedSessionId,
          roundNumber: BigInt(roundNumber),
          scores: playerScores,
        });
      }
    }

    setEditingRound(null);
  };

  const handleEditRound = (roundNumber: number) => {
    const round = localSession.rounds.find(r => r.roundNumber === roundNumber);
    if (round) {
      setEditingRound(round);
    }
  };

  const renderScoreEntry = () => {
    const activeAnimalIds = localSession.activeSpiritsAnimalIds || [BigInt(0)];
    const isOwlActive = activeAnimalIds.some(id => id === BigInt(0));

    const wrapSubmit = (handler: (scores: Map<string, number>, state: any) => void) => {
      return (scores: Map<string, number>, state: any) => {
        const entryState: RoundEntryState = {
          type: localSession.gameType as any,
          state,
        };
        handler(scores, entryState);
      };
    };

    switch (localSession.gameType) {
      case 'skyjo':
        return <SkyjoScoreEntry players={localSession.players} onSubmit={wrapSubmit(handleAddRound)} />;
      case 'milleBornes':
        return <MilleBornesScoreEntry players={localSession.players} onSubmit={wrapSubmit(handleAddRound)} />;
      case 'nerts':
        return <NertsScoreEntry players={localSession.players} onSubmit={wrapSubmit(handleAddRound)} />;
      case 'flip7':
        return <Flip7ScoreEntry players={localSession.players} onSubmit={wrapSubmit(handleAddRound)} />;
      case 'phase10':
        return (
          <Phase10ScoreEntry
            players={localSession.players}
            phase10Progress={localSession.phase10Progress}
            onSubmit={wrapSubmit(handleAddRound)}
            oneWayCheckbox={!isQuickSession}
          />
        );
      case 'genericGame':
        return <GenericGameScoreEntry players={localSession.players} onSubmit={wrapSubmit(handleAddRound)} />;
      case 'spiritsOwl':
        if (activeAnimalIds.length === 0) {
          return (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  No character boards selected. Please select at least one board to continue.
                </p>
              </CardContent>
            </Card>
          );
        }
        return (
          <div className="space-y-4">
            {isOwlActive && (
              <SpiritsOwlScoreEntry players={localSession.players} onSubmit={wrapSubmit(handleAddRound)} />
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Games
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-4xl">{template.icon}</span>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold tracking-tight">{template.name}</h1>
          <p className="text-sm text-muted-foreground">
            {localSession.players.length} player{localSession.players.length !== 1 ? 's' : ''} •{' '}
            {localSession.rounds.length} round{localSession.rounds.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Standings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {standings.map((standing, index) => (
              <div
                key={standing.playerId}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0 && gameEnded ? 'bg-primary/10 border border-primary/20' : 'bg-accent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-muted-foreground w-6">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{standing.playerName}</p>
                    {localSession.gameType === 'phase10' && localSession.phase10Progress && (
                      <p className="text-xs text-muted-foreground">
                        Phase {localSession.phase10Progress.get(standing.playerId) || 1}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{standing.total}</p>
                  {index === 0 && gameEnded && (
                    <p className="text-xs text-primary font-medium">Winner!</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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

      {!gameEnded && (
        <>
          {!showScoreEntry ? (
            <Button onClick={() => setShowScoreEntry(true)} size="lg" className="w-full">
              <Plus className="h-5 w-5 mr-2" />
              Add Round {localSession.rounds.length + 1}
            </Button>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Round {localSession.rounds.length + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderScoreEntry()}
                <Button variant="outline" onClick={() => setShowScoreEntry(false)} className="w-full">
                  Cancel
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {gameEnded && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-6 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-3 text-primary" />
            <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
            <p className="text-muted-foreground">
              Congratulations to {standings[0]?.playerName} for winning!
            </p>
          </CardContent>
        </Card>
      )}

      {editingRound && (
        <EditRoundDialog
          round={editingRound}
          players={localSession.players}
          gameType={localSession.gameType}
          phase10Progress={localSession.phase10Progress}
          activeSpiritsAnimalIds={localSession.activeSpiritsAnimalIds}
          onSave={handleUpdateRound}
          onCancel={() => setEditingRound(null)}
        />
      )}
    </div>
  );
}
