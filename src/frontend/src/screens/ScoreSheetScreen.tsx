import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from '@tanstack/react-router';
import { useGetGameSession, useAddRound, useUpdateRound } from '../hooks/useGameSessions';
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
import RoundsTable from '../components/scores/RoundsTable';
import EditRoundDialog from '../components/scores/EditRoundDialog';
import type { LocalSession, LocalRound, RoundEntryState } from '../lib/sessionTypes';

export default function ScoreSheetScreen() {
  const { sessionId } = useParams({ from: '/game/$sessionId' });
  const navigate = useNavigate();
  const location = useLocation();
  const isQuickSession = sessionId === 'quick';

  const { data: savedSession, isLoading: sessionLoading } = useGetGameSession(
    isQuickSession ? null : BigInt(sessionId)
  );
  const addRound = useAddRound();
  const updateRound = useUpdateRound();

  const [localSession, setLocalSession] = useState<LocalSession | null>(null);
  const [isAddingRound, setIsAddingRound] = useState(false);
  const [editingRound, setEditingRound] = useState<LocalRound | null>(null);
  const [resetNonce, setResetNonce] = useState(0);

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

      setLocalSession({
        gameType: gameTypeStr as any,
        players,
        rounds,
        isQuick: false,
        savedSessionId: savedSession.id,
        nertsWinTarget,
        flip7TargetScore,
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
  const gameEnd = checkGameEnd(standings, localSession.gameType, localSession.nertsWinTarget, localSession.flip7TargetScore);

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
            <p className="text-lg">
              <span className="font-semibold">{gameEnd.winner?.playerName}</span> wins with a score of{' '}
              <span className="font-bold">{gameEnd.winner?.total}</span>!
            </p>
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
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-muted-foreground w-6">#{index + 1}</span>
                  <span className="font-medium">{standing.playerName}</span>
                </div>
                <span className="text-xl font-bold">{standing.total}</span>
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

      {isAddingRound ? (
        <Card>
          <CardHeader>
            <CardTitle>Round {localSession.rounds.length + 1}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderScoreEntry()}
            <Button variant="outline" onClick={handleCancelAddRound} className="w-full">
              Cancel
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setIsAddingRound(true)} className="w-full" size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Add Round {localSession.rounds.length + 1}
        </Button>
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
