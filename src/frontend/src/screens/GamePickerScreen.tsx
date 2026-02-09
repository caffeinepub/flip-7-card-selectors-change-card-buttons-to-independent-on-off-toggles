import { useNavigate } from '@tanstack/react-router';
import { GAME_TEMPLATES } from '../gameTemplates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';

export default function GamePickerScreen() {
  const navigate = useNavigate();

  const handleSelectGame = (gameId: string) => {
    navigate({ to: '/setup/$gameType', params: { gameType: gameId } });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Choose Your Game</h1>
        <p className="text-muted-foreground">Select a game to start keeping score</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {Object.values(GAME_TEMPLATES).map((game) => (
          <Card
            key={game.id}
            className="hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => handleSelectGame(game.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <span className="text-3xl">{game.icon}</span>
                    {game.name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {game.minPlayers}-{game.maxPlayers} players
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground leading-relaxed">{game.rulesSummary}</p>
                <Separator />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground">Win Condition</p>
                  <p className="text-xs text-muted-foreground">{game.gameEndCondition}</p>
                </div>
              </div>
              <Button className="w-full group-hover:bg-primary/90" onClick={() => handleSelectGame(game.id)}>
                Start Game
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
