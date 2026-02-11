import { useNavigate } from '@tanstack/react-router';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useGameSessions } from '../hooks/useGameSessions';
import { getGameTemplate } from '../gameTemplates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { History, Calendar } from 'lucide-react';
import { Separator } from '../components/ui/separator';

export default function HistoryScreen() {
  const navigate = useNavigate();
  const { isAuthenticated } = useCurrentUser();
  const { data: sessions = [], isLoading } = useGameSessions();

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <History className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium">Login Required</p>
              <p className="text-sm text-muted-foreground mt-1">Please log in to view your game history</p>
            </div>
            <Button onClick={() => navigate({ to: '/' })}>Back to Games</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sortedSessions = [...sessions].sort((a, b) => Number(b.id) - Number(a.id));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Game History</h1>
        <p className="text-muted-foreground">View and continue your saved games</p>
      </div>

      <Separator />

      {isLoading ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Loading game history...</p>
          </CardContent>
        </Card>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <History className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium">No Games Yet</p>
              <p className="text-sm text-muted-foreground mt-1">Start a new game to see it here</p>
            </div>
            <Button onClick={() => navigate({ to: '/' })}>Start a Game</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedSessions.map((session) => {
            const template = getGameTemplate(session.gameType);
            const playerNames = session.players.map((p) => p.name).join(', ');
            const roundCount = session.rounds.length;

            return (
              <Card key={session.id.toString()} className="hover:shadow-md transition-shadow">
                <CardHeader className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">{template.icon}</span>
                        {template.name}
                      </CardTitle>
                      <CardDescription className="text-xs flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Game #{session.id.toString()}
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => navigate({ to: '/game/$sessionId', params: { sessionId: session.id.toString() } })}
                    >
                      View Game
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Players:</span> {playerNames}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Rounds:</span> {roundCount}
                  </div>
                  {!session.isActive && (
                    <div className="text-xs text-muted-foreground mt-2">Game completed</div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
