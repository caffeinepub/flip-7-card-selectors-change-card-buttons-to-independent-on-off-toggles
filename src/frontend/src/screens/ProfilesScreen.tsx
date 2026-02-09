import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { usePlayerProfiles, useCreatePlayerProfile } from '../hooks/usePlayerProfiles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Users } from 'lucide-react';
import { Separator } from '../components/ui/separator';

export default function ProfilesScreen() {
  const navigate = useNavigate();
  const { isAuthenticated } = useCurrentUser();
  const { data: profiles = [], isLoading } = usePlayerProfiles();
  const createProfile = useCreatePlayerProfile();
  const [newPlayerName, setNewPlayerName] = useState('');

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <Users className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium">Login Required</p>
              <p className="text-sm text-muted-foreground mt-1">Please log in to manage player profiles</p>
            </div>
            <Button onClick={() => navigate({ to: '/' })}>Back to Games</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateProfile = async () => {
    if (newPlayerName.trim()) {
      await createProfile.mutateAsync(newPlayerName.trim());
      setNewPlayerName('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Player Profiles</h1>
        <p className="text-muted-foreground">Manage your saved players and view their stats</p>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Create New Profile</CardTitle>
          <CardDescription>Add a new player to track their game statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="new-player">Player Name</Label>
              <Input
                id="new-player"
                placeholder="Enter player name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleCreateProfile}
                disabled={!newPlayerName.trim() || createProfile.isPending}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Player
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Players</CardTitle>
          <CardDescription>{profiles.length} player profiles</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading profiles...</p>
          ) : profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No profiles yet. Create one above to get started!
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Games Played</TableHead>
                    <TableHead className="text-right">Wins</TableHead>
                    <TableHead className="text-right">Total Score</TableHead>
                    <TableHead className="text-right">Avg Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => (
                    <TableRow key={profile.id.toString()}>
                      <TableCell className="font-medium">{profile.name}</TableCell>
                      <TableCell className="text-right">{Number(profile.gamesPlayed)}</TableCell>
                      <TableCell className="text-right">{Number(profile.wins)}</TableCell>
                      <TableCell className="text-right">{Number(profile.totalScore)}</TableCell>
                      <TableCell className="text-right">{Number(profile.averageScore)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
