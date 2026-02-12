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
import { Plus, X, Users, BookOpen } from 'lucide-react';
import { Separator } from '../components/ui/separator';
import GameRulesDialog from '../components/rules/GameRulesDialog';
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
  const [phase10WinTarget, setPhase10WinTarget] = useState('0');
  const [rulesDialogOpen, setRulesDialogOpen] = useState(false);

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
      const phase10Target = template.id === 'phase10' ? BigInt(parseInt(phase10WinTarget, 10)) : undefined;
      const sessionId = await createSession.mutateAsync({ 
        gameType: gameTypeObj, 
        playerIds,
        nertsWinTarget: nertsTarget,
        flip7TargetScore: flip7Target,
        phase10WinTarget: phase10Target
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
      const phase10Target = template.id === 'phase10' ? parseInt(phase10WinTarget, 10) : undefined;

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
            flip7TargetScore: flip7Target,
            phase10WinTarget: phase10Target
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
  const isPhase10TargetValid = template.id !== 'phase10' || (parseInt(phase10WinTarget, 10) >= 0 && !isNaN(parseInt(phase10WinTarget, 10)));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/' })} className="mb-2">
          ← Back to Games
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{template.icon}</span>
          <div className="flex-1">
            <h1 className="text-3xl font-semibold tracking-tight">{template.name}</h1>
            <p className="text-sm text-muted-foreground">
              {template.minPlayers}-{template.maxPlayers} players
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRulesDialogOpen(true)}
          className="mt-2"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          {rulesDialogOpen ? 'Hide Rules' : 'Show Rules'}
        </Button>
      </div>

      <Separator />

      {template.id === 'nerts' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Win Target</CardTitle>
            <CardDescription>Set the target score to win the game</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="nertsWinTarget">Target Score (minimum 200)</Label>
              <Input
                id="nertsWinTarget"
                type="number"
                min="200"
                value={nertsWinTarget}
                onChange={(e) => setNertsWinTarget(e.target.value)}
                className={!isNertsTargetValid ? 'border-destructive' : ''}
              />
              {!isNertsTargetValid && (
                <p className="text-sm text-destructive">Target must be at least 200</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {template.id === 'flip7' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Target Score</CardTitle>
            <CardDescription>Set the target score to win the game</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="flip7TargetScore">Target Score (minimum 50)</Label>
              <Input
                id="flip7TargetScore"
                type="number"
                min="50"
                value={flip7TargetScore}
                onChange={(e) => setFlip7TargetScore(e.target.value)}
                className={!isFlip7TargetValid ? 'border-destructive' : ''}
              />
              {!isFlip7TargetValid && (
                <p className="text-sm text-destructive">Target must be at least 50</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {template.id === 'phase10' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Win Target (Optional)</CardTitle>
            <CardDescription>Set a target score to end the game early (0 = no target)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="phase10WinTarget">Target Score (0 for no limit)</Label>
              <Input
                id="phase10WinTarget"
                type="number"
                min="0"
                value={phase10WinTarget}
                onChange={(e) => setPhase10WinTarget(e.target.value)}
                className={!isPhase10TargetValid ? 'border-destructive' : ''}
              />
              {!isPhase10TargetValid && (
                <p className="text-sm text-destructive">Target must be 0 or greater</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={mode} onValueChange={(v) => setMode(v as 'profiles' | 'quick')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profiles" disabled={!isAuthenticated}>
            <Users className="h-4 w-4 mr-2" />
            Player Profiles
          </TabsTrigger>
          <TabsTrigger value="quick">Quick Game</TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Players</CardTitle>
              <CardDescription>
                Choose {template.minPlayers}-{template.maxPlayers} players from your profiles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profilesLoading ? (
                <p className="text-sm text-muted-foreground">Loading profiles...</p>
              ) : profiles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No profiles yet. Create one below!</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {profiles.map((profile) => (
                    <div
                      key={profile.id.toString()}
                      className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent"
                    >
                      <Checkbox
                        id={`profile-${profile.id}`}
                        checked={selectedProfileIds.has(profile.id)}
                        onCheckedChange={() => handleToggleProfile(profile.id)}
                      />
                      <Label
                        htmlFor={`profile-${profile.id}`}
                        className="flex-1 cursor-pointer font-normal"
                      >
                        {profile.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="newPlayerName">Create New Profile</Label>
                <div className="flex gap-2">
                  <Input
                    id="newPlayerName"
                    placeholder="Player name"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddProfile()}
                  />
                  <Button
                    onClick={handleAddProfile}
                    disabled={!newPlayerName.trim() || createProfile.isPending}
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quick" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Game Players</CardTitle>
              <CardDescription>
                Add {template.minPlayers}-{template.maxPlayers} players for a quick game (not saved)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {quickPlayers.length > 0 && (
                <div className="space-y-2">
                  {quickPlayers.map((player) => (
                    <div
                      key={player.tempId}
                      className="flex items-center justify-between p-2 rounded-lg bg-accent"
                    >
                      <span>{player.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveQuickPlayer(player.tempId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="newQuickName">Add Player</Label>
                <div className="flex gap-2">
                  <Input
                    id="newQuickName"
                    placeholder="Player name"
                    value={newQuickName}
                    onChange={(e) => setNewQuickName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddQuickPlayer()}
                  />
                  <Button onClick={handleAddQuickPlayer} disabled={!newQuickName.trim()} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={handleStartGame}
            disabled={!canStart || !isNertsTargetValid || !isFlip7TargetValid || !isPhase10TargetValid}
            className="w-full"
            size="lg"
          >
            {createSession.isPending ? 'Starting...' : `Start Game (${playerCount} players)`}
          </Button>
        </CardContent>
      </Card>

      <GameRulesDialog
        open={rulesDialogOpen}
        onOpenChange={setRulesDialogOpen}
        template={template}
      />
    </div>
  );
}
