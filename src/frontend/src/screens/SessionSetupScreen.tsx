import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { usePlayerProfiles, useCreatePlayerProfile } from '../hooks/usePlayerProfiles';
import { useCreateGameSession } from '../hooks/useGameSessions';
import { GAME_TEMPLATES, createGameType } from '../gameTemplates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Checkbox } from '../components/ui/checkbox';
import { Plus, X, Users } from 'lucide-react';
import { Separator } from '../components/ui/separator';
import type { SessionPlayer, QuickPlayer } from '../lib/sessionTypes';

export default function SessionSetupScreen() {
  const { gameType } = useParams({ from: '/setup/$gameType' });
  const navigate = useNavigate();
  const { isAuthenticated } = useCurrentUser();
  const { data: profiles = [], isLoading: profilesLoading } = usePlayerProfiles();
  const createProfile = useCreatePlayerProfile();
  const createSession = useCreateGameSession();

  const [mode, setMode] = useState<'profiles' | 'quick'>('profiles');
  const [selectedProfileIds, setSelectedProfileIds] = useState<Set<bigint>>(new Set());
  const [quickPlayers, setQuickPlayers] = useState<QuickPlayer[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newQuickName, setNewQuickName] = useState('');
  const [nertsWinTarget, setNertsWinTarget] = useState('200');
  const [flip7TargetScore, setFlip7TargetScore] = useState('100');

  const template = GAME_TEMPLATES[gameType];

  if (!template) {
    return <div>Game not found</div>;
  }

  const handleToggleProfile = (profileId: bigint) => {
    const newSet = new Set(selectedProfileIds);
    if (newSet.has(profileId)) {
      newSet.delete(profileId);
    } else {
      newSet.add(profileId);
    }
    setSelectedProfileIds(newSet);
  };

  const handleAddProfile = async () => {
    if (newPlayerName.trim()) {
      await createProfile.mutateAsync(newPlayerName.trim());
      setNewPlayerName('');
    }
  };

  const handleAddQuickPlayer = () => {
    if (newQuickName.trim()) {
      setQuickPlayers([
        ...quickPlayers,
        { tempId: `quick-${Date.now()}-${Math.random()}`, name: newQuickName.trim() },
      ]);
      setNewQuickName('');
    }
  };

  const handleRemoveQuickPlayer = (tempId: string) => {
    setQuickPlayers(quickPlayers.filter((p) => p.tempId !== tempId));
  };

  const handleStartGame = async () => {
    if (mode === 'profiles' && isAuthenticated) {
      const playerIds = Array.from(selectedProfileIds);
      if (playerIds.length < template.minPlayers) {
        alert(`Please select at least ${template.minPlayers} players`);
        return;
      }
      if (playerIds.length > template.maxPlayers) {
        alert(`Maximum ${template.maxPlayers} players allowed`);
        return;
      }

      const gameTypeObj = createGameType(template.id);
      const nertsTarget = template.id === 'nerts' ? BigInt(parseInt(nertsWinTarget, 10)) : undefined;
      const flip7Target = template.id === 'flip7' ? BigInt(parseInt(flip7TargetScore, 10)) : undefined;
      const sessionId = await createSession.mutateAsync({ 
        gameType: gameTypeObj, 
        playerIds,
        nertsWinTarget: nertsTarget,
        flip7TargetScore: flip7Target
      });
      navigate({ to: '/game/$sessionId', params: { sessionId: sessionId.toString() } });
    } else {
      if (quickPlayers.length < template.minPlayers) {
        alert(`Please add at least ${template.minPlayers} players`);
        return;
      }
      if (quickPlayers.length > template.maxPlayers) {
        alert(`Maximum ${template.maxPlayers} players allowed`);
        return;
      }

      const sessionPlayers: SessionPlayer[] = quickPlayers.map((p) => ({
        id: p.tempId,
        name: p.name,
        isQuick: true,
      }));

      const nertsTarget = template.id === 'nerts' ? parseInt(nertsWinTarget, 10) : undefined;
      const flip7Target = template.id === 'flip7' ? parseInt(flip7TargetScore, 10) : undefined;

      navigate({
        to: '/game/$sessionId',
        params: { sessionId: 'quick' },
        state: { 
          quickSession: { 
            gameType: template.id, 
            players: sessionPlayers, 
            rounds: [], 
            isQuick: true,
            nertsWinTarget: nertsTarget,
            flip7TargetScore: flip7Target
          } 
        } as any,
      });
    }
  };

  const playerCount = mode === 'profiles' ? selectedProfileIds.size : quickPlayers.length;
  const canStart =
    playerCount >= template.minPlayers &&
    playerCount <= template.maxPlayers &&
    !createSession.isPending;

  const isNertsTargetValid = template.id !== 'nerts' || (parseInt(nertsWinTarget, 10) >= 200 && !isNaN(parseInt(nertsWinTarget, 10)));
  const isFlip7TargetValid = template.id !== 'flip7' || (parseInt(flip7TargetScore, 10) >= 50 && !isNaN(parseInt(flip7TargetScore, 10)));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/' })} className="mb-2">
          ← Back to Games
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{template.icon}</span>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{template.name}</h1>
            <p className="text-sm text-muted-foreground">
              {template.minPlayers}-{template.maxPlayers} players
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {template.id === 'nerts' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Win Target</CardTitle>
            <CardDescription>Set the score needed to win (minimum 200)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Label htmlFor="nerts-target" className="whitespace-nowrap">Target Score:</Label>
              <Input
                id="nerts-target"
                type="number"
                min="200"
                step="50"
                value={nertsWinTarget}
                onChange={(e) => setNertsWinTarget(e.target.value)}
                className="max-w-[150px]"
              />
            </div>
            {!isNertsTargetValid && (
              <p className="text-sm text-destructive mt-2">Target must be at least 200</p>
            )}
          </CardContent>
        </Card>
      )}

      {template.id === 'flip7' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Win Target</CardTitle>
            <CardDescription>Set the score needed to win (minimum 50)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Label htmlFor="flip7-target" className="whitespace-nowrap">Target Score:</Label>
              <Input
                id="flip7-target"
                type="number"
                min="50"
                step="25"
                value={flip7TargetScore}
                onChange={(e) => setFlip7TargetScore(e.target.value)}
                className="max-w-[150px]"
              />
            </div>
            {!isFlip7TargetValid && (
              <p className="text-sm text-destructive mt-2">Target must be at least 50</p>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs value={mode} onValueChange={(v) => setMode(v as 'profiles' | 'quick')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profiles" disabled={!isAuthenticated}>
            <Users className="h-4 w-4 mr-2" />
            Player Profiles
          </TabsTrigger>
          <TabsTrigger value="quick">Quick Game</TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-4 mt-6">
          {!isAuthenticated ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Please log in to use player profiles</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Players</CardTitle>
                  <CardDescription>
                    Choose {template.minPlayers}-{template.maxPlayers} players for this game
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profilesLoading ? (
                    <p className="text-sm text-muted-foreground">Loading profiles...</p>
                  ) : profiles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No profiles yet. Create one below!</p>
                  ) : (
                    <div className="space-y-2">
                      {profiles.map((profile) => (
                        <div
                          key={profile.id.toString()}
                          className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                        >
                          <Checkbox
                            id={`profile-${profile.id}`}
                            checked={selectedProfileIds.has(profile.id)}
                            onCheckedChange={() => handleToggleProfile(profile.id)}
                          />
                          <label
                            htmlFor={`profile-${profile.id}`}
                            className="flex-1 cursor-pointer text-sm font-medium"
                          >
                            {profile.name}
                          </label>
                          <div className="text-xs text-muted-foreground">
                            {Number(profile.gamesPlayed)} games
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Create New Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Player name"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddProfile()}
                      />
                    </div>
                    <Button
                      onClick={handleAddProfile}
                      disabled={!newPlayerName.trim() || createProfile.isPending}
                      size="icon"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="quick" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Game Players</CardTitle>
              <CardDescription>
                Add {template.minPlayers}-{template.maxPlayers} players (no profiles saved)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Player name"
                    value={newQuickName}
                    onChange={(e) => setNewQuickName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddQuickPlayer()}
                  />
                </div>
                <Button onClick={handleAddQuickPlayer} disabled={!newQuickName.trim()} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {quickPlayers.length > 0 && (
                <div className="space-y-2">
                  {quickPlayers.map((player) => (
                    <div
                      key={player.tempId}
                      className="flex items-center justify-between p-3 rounded-lg border bg-accent/20"
                    >
                      <span className="text-sm font-medium">{player.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveQuickPlayer(player.tempId)}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">{playerCount}</span> of {template.minPlayers}-{template.maxPlayers}{' '}
              players selected
            </div>
            <Button onClick={handleStartGame} disabled={!canStart || !isNertsTargetValid || !isFlip7TargetValid} size="lg">
              {createSession.isPending ? 'Starting...' : 'Start Game'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
