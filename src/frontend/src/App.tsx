import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useCurrentUser } from './hooks/useCurrentUser';
import AppLayout from './components/layout/AppLayout';
import ProfileSetupDialog from './components/auth/ProfileSetupDialog';
import GamePickerScreen from './screens/GamePickerScreen';
import SessionSetupScreen from './screens/SessionSetupScreen';
import ScoreSheetScreen from './screens/ScoreSheetScreen';
import ProfilesScreen from './screens/ProfilesScreen';
import HistoryScreen from './screens/HistoryScreen';

function RootComponent() {
  const { identity } = useInternetIdentity();
  const { userProfile, isLoading: userLoading, isFetched } = useCurrentUser();
  
  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !userLoading && isFetched && userProfile === null;

  return (
    <>
      <AppLayout />
      {showProfileSetup && <ProfileSetupDialog />}
    </>
  );
}

const rootRoute = createRootRoute({
  component: RootComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: GamePickerScreen,
});

const sessionSetupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/setup/$gameType',
  component: SessionSetupScreen,
});

const scoreSheetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/game/$sessionId',
  component: ScoreSheetScreen,
});

const profilesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profiles',
  component: ProfilesScreen,
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: HistoryScreen,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  sessionSetupRoute,
  scoreSheetRoute,
  profilesRoute,
  historyRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
