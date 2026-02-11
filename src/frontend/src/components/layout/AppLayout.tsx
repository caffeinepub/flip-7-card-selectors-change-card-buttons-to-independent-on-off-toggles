import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { Home, Users, History, Menu } from 'lucide-react';
import LoginButton from '../auth/LoginButton';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { useState } from 'react';
import { useAutoHideHeaderOnScroll } from '../../hooks/useAutoHideHeaderOnScroll';

export default function AppLayout() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { isAuthenticated } = useCurrentUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isHeaderHidden = useAutoHideHeaderOnScroll();

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
      <header 
        className={`sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform duration-300 ${
          isHeaderHidden ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="container flex h-12 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate({ to: '/' })}
              className="flex items-center gap-2 font-semibold text-base tracking-tight"
            >
              <span className="text-xl">🎯</span>
              <span>ScoreKeeper</span>
            </button>

            <nav className="hidden md:flex items-center gap-0.5">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => handleNavigation(item.path)}
                    className="gap-1.5 h-8 px-3"
                  >
                    <Icon className="h-3.5 w-3.5" />
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
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Menu className="h-4 w-4" />
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

      <main className="flex-1 container px-4 py-6 max-w-6xl">
        <Outlet />
      </main>

      <footer className="border-t border-border/40 py-6 mt-auto">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
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
