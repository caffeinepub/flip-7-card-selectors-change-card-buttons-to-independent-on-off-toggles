import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { Home, Users, History, Menu } from 'lucide-react';
import LoginButton from '../auth/LoginButton';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { useState } from 'react';

export default function AppLayout() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { isAuthenticated } = useCurrentUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentPath = routerState.location.pathname;

  const navItems = [
    { label: 'Games', path: '/', icon: Home, public: true },
    { label: 'Profiles', path: '/profiles', icon: Users, public: false },
    { label: 'History', path: '/history', icon: History, public: false },
  ];

  const visibleNavItems = navItems.filter((item) => item.public || isAuthenticated);

  const handleNavigation = (path: string) => {
    navigate({ to: path });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate({ to: '/' })}
              className="flex items-center gap-2 font-semibold text-lg tracking-tight"
            >
              <span className="text-2xl">🎯</span>
              <span>ScoreKeeper</span>
            </button>

            <nav className="hidden md:flex items-center gap-1">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => handleNavigation(item.path)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <LoginButton />
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="flex flex-col gap-2 mt-8">
                  {visibleNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPath === item.path;
                    return (
                      <Button
                        key={item.path}
                        variant={isActive ? 'secondary' : 'ghost'}
                        onClick={() => handleNavigation(item.path)}
                        className="justify-start gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 container px-4 py-8 max-w-6xl">
        <Outlet />
      </main>

      <footer className="border-t border-border/40 py-6 mt-auto">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          © 2026. Built with ❤️ using{' '}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
