import { useNavigate } from '@tanstack/react-router';
import { GAME_TEMPLATES } from '../gameTemplates';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function GamePickerScreen() {
  const navigate = useNavigate();

  const handleSelectGame = (gameId: string) => {
    navigate({ to: '/setup/$gameType', params: { gameType: gameId } });
  };

  // Sort games alphabetically by display name
  const sortedGames = Object.values(GAME_TEMPLATES).sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Choose Your Game</h1>
        <p className="text-sm text-muted-foreground">Select a game to start keeping score</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {sortedGames.map((game) => (
          <Card
            key={game.id}
            className="hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => handleSelectGame(game.id)}
          >
            <CardHeader className="py-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <span className="text-2xl flex-shrink-0">{game.icon}</span>
                    <span className="break-words">{game.name}</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {game.minPlayers}-{game.maxPlayers} players
                  </CardDescription>
                </div>
                <Button 
                  size="sm"
                  className="flex-shrink-0 group-hover:bg-primary/90" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectGame(game.id);
                  }}
                >
                  Start Game
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
