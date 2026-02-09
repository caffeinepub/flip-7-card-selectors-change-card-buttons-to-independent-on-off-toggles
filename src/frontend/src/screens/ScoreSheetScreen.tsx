import { useState, useEffect } from 'react';
import { useParams, useNavigate, useRouterState } from '@tanstack/react-router';
import { useGetGameSession, useAddRound } from '../hooks/useGameSessions';
import { getGameTemplate, createGameType } from '../gameTemplates';
import { calculateTotals, getStandings, checkGameEnd } from '../lib/scoring';
import type { LocalSession, LocalRound, SessionPlayer } from '../lib/sessionTypes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ScrollArea } from '../components/ui/scroll-area';
import RoundsTable from '../components/scores/RoundsTable';
import SkyjoScoreEntry from '../components/scores/SkyjoScoreEntry';
import MilleBornesScoreEntry from '../components/scores/MilleBornesScoreEntry';
import NertsScoreEntry from '../components/scores/NertsScoreEntry';
import Flip7ScoreEntry from '../components/scores/Flip7ScoreEntry';
import { Trophy, Info } from 'lucide-react';

export default function ScoreSheetScreen() {
  const { sessionId } = useParams({ from: '/game/$sessionId' });
  const navigate = useNavigate();
  const routerState = useRouterState();
  const addRound = useAddRound();

  const isQuickSession = sessionId === 'quick';
  const quickSessionData = (routerState.location.state as any)?.quickSession as LocalSession | undefined;

  const { data: savedSession, isLoading: sessionLoading } = useGetGameSession(
    isQuickSession ? null : BigInt(sessionId)
  );

  const [localSession, setLocalSession] = useState<LocalSession | null>(null);
  const [showRulesDialog, setShowRulesDialog] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);

  useEffect(() => {
    if (isQuickSession && quickSessionData) {
      setLocalSession(quickSessionData);
    } else if (savedSession) {
      const players: SessionPlayer[] = savedSession.players.map((p) => ({
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

      const gameTypeKey = savedSession.gameType.__kind__;
      const nertsTarget = savedSession.nertsWinTarget ? Number(savedSession.nertsWinTarget) : undefined;
      const flip7Target = savedSession.flip7TargetScore ? Number(savedSession.flip7TargetScore) : undefined;
      
      setLocalSession({
        gameType: gameTypeKey as 'skyjo' | 'milleBornes' | 'nerts' | 'flip7',
        players,
        rounds,
        isQuick: false,
        savedSessionId: savedSession.id,
        nertsWinTarget: nertsTarget,
        flip7TargetScore: flip7Target,
      });
    }
  }, [isQuickSession, quickSessionData, savedSession]);

  const totals = localSession ? calculateTotals(localSession.players, localSession.rounds) : [];
  const standings = localSession ? getStandings(totals, localSession.gameType) : [];
  const gameEndCheck = localSession ? checkGameEnd(totals, localSession.gameType, localSession.nertsWinTarget, localSession.flip7TargetScore) : { isEnded: false };

  useEffect(() => {
    if (gameEndCheck.isEnded && !gameEnded) {
      setGameEnded(true);
    }
  }, [gameEndCheck.isEnded, gameEnded]);

  if (sessionLoading || !localSession) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading game...</p>
      </div>
    );
  }

  const template = getGameTemplate(createGameType(localSession.gameType));

  const handleAddRound = async (scores: Map<string, number>) => {
    const newRoundNumber = localSession.rounds.length + 1;
    const newRound: LocalRound = {
      roundNumber: newRoundNumber,
      scores,
    };

    const updatedSession = {
      ...localSession,
      rounds: [...localSession.rounds, newRound],
    };
    setLocalSession(updatedSession);

    if (!isQuickSession && localSession.savedSessionId) {
      const playerScores = Array.from(scores.entries()).map(([playerId, score]) => ({
        playerId: BigInt(playerId),
        score: BigInt(score),
      }));

      await addRound.mutateAsync({
        gameId: localSession.savedSessionId,
        roundNumber: BigInt(newRoundNumber),
        scores: playerScores,
      });
    }
  };

  const handleUpdateRound = async (roundNumber: number, scores: Map<string, number>) => {
    const updatedRounds = localSession.rounds.map((round) =>
      round.roundNumber === roundNumber ? { ...round, scores } : round
    );

    const updatedSession = {
      ...localSession,
      rounds: updatedRounds,
    };
    setLocalSession(updatedSession);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{template.icon}</span>
            <h1 className="text-2xl font-semibold tracking-tight">{template.name}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {isQuickSession ? 'Quick Game' : `Session #${sessionId}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowRulesDialog(true)}>
            <Info className="h-4 w-4 mr-2" />
            Rules
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate({ to: '/' })}>
            Exit
          </Button>
        </div>
      </div>

      <Separator />

      {gameEnded && gameEndCheck.winner && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Game Over!</h2>
                <p className="text-muted-foreground">
                  {gameEndCheck.winner.playerName} wins with {gameEndCheck.winner.total} points!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Standings</CardTitle>
            <CardDescription>Current scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {standings.map((player, index) => (
                <div
                  key={player.playerId}
                  className="flex items-center justify-between p-3 rounded-lg border bg-accent/20"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-muted-foreground w-6">#{index + 1}</span>
                    <span className="font-medium">{player.playerName}</span>
                  </div>
                  <span className="text-lg font-semibold">{player.total}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Game Info</CardTitle>
            <CardDescription>Current game details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Players:</span>
              <span className="font-medium">{localSession.players.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rounds Played:</span>
              <span className="font-medium">{localSession.rounds.length}</span>
            </div>
            {localSession.gameType === 'nerts' && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Win Target:</span>
                <span className="font-medium">{localSession.nertsWinTarget || 200}</span>
              </div>
            )}
            {localSession.gameType === 'flip7' && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Win Target:</span>
                <span className="font-medium">{localSession.flip7TargetScore || 100}</span>
              </div>
            )}
            <Separator />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Win Condition:</p>
              <p>{template.gameEndCondition}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {!gameEnded && (
        <Card>
          <CardHeader>
            <CardTitle>
              {localSession.gameType === 'milleBornes' ? 'Final Score Entry' : `Round ${localSession.rounds.length + 1}`}
            </CardTitle>
            <CardDescription>
              {localSession.gameType === 'milleBornes'
                ? 'Enter final scores for all players'
                : 'Enter scores for this round'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {localSession.gameType === 'skyjo' && (
              <SkyjoScoreEntry players={localSession.players} onSubmit={handleAddRound} />
            )}
            {localSession.gameType === 'milleBornes' && (
              <MilleBornesScoreEntry players={localSession.players} onSubmit={handleAddRound} />
            )}
            {localSession.gameType === 'nerts' && (
              <NertsScoreEntry players={localSession.players} onSubmit={handleAddRound} />
            )}
            {localSession.gameType === 'flip7' && (
              <Flip7ScoreEntry players={localSession.players} onSubmit={handleAddRound} />
            )}
          </CardContent>
        </Card>
      )}

      {localSession.rounds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Round History</CardTitle>
            <CardDescription>All rounds played</CardDescription>
          </CardHeader>
          <CardContent>
            <RoundsTable
              rounds={localSession.rounds}
              players={localSession.players}
              onUpdateRound={handleUpdateRound}
            />
          </CardContent>
        </Card>
      )}

      <Dialog open={showRulesDialog} onOpenChange={setShowRulesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{template.icon}</span>
              {template.name} Rules
            </DialogTitle>
            <DialogDescription>Game rules and scoring</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              <div>
                <h3 className="font-semibold mb-2">How to Play</h3>
                <p className="text-sm text-muted-foreground">{template.rulesSummary}</p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Win Condition</h3>
                <p className="text-sm text-muted-foreground">{template.gameEndCondition}</p>
              </div>
              {localSession.gameType === 'nerts' && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Scoring Details</h3>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>+1 point per card played to center piles</li>
                      <li>-2 points per card left in your tableau</li>
                      <li>No bonus for calling "Nerts"</li>
                    </ul>
                  </div>
                </>
              )}
              {localSession.gameType === 'flip7' && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Scoring Details</h3>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Tap card buttons (1-12, +4, +10) to build your round score</li>
                      <li>Or enter your score manually</li>
                      <li>Toggle x2 to double your final round score</li>
                      <li>First to reach the target wins!</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
