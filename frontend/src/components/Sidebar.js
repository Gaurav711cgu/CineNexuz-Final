import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import NotificationBell from './NotificationBell';
import {
  Home, Compass, MessageCircle, Users, Ticket, BarChart3,
  User, Shield, Sun, Moon, LogOut, Menu, X, Film, Search, ChevronLeft, Clapperboard
} from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { ScrollArea } from './ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './ui/tooltip';
import { Separator } from './ui/separator';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/discover', icon: Compass, label: 'Discover' },
  { path: '/search', icon: Search, label: 'Search' },
  { path: '/chat', icon: MessageCircle, label: 'AI Chat' },
  { path: '/watchparty', icon: Users, label: 'Watch Party' },
  { path: '/theatre', icon: Ticket, label: 'Theatre' },
  { path: '/subscription', icon: Film, label: 'Plans' },
];

const BOTTOM_ITEMS = [
  { path: '/profile', icon: User, label: 'Profile' },
];

export function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const NavItem = ({ item }) => {
    const active = isActive(item.path);
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to={item.path} data-testid={`sidebar-nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}>
              <motion.div
                whileHover={{ x: 2 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150 group
                  ${active
                    ? 'bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-white/5'
                  }`}
              >
                <item.icon size={20} className={active ? 'text-[hsl(var(--primary))]' : ''} />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">{item.label}</span>
                )}
                {active && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))]" />
                )}
              </motion.div>
            </Link>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" className="glass-card">
              {item.label}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className={`hidden lg:flex flex-col h-screen border-r border-white/8 bg-[hsl(var(--card))] transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/8">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] flex items-center justify-center flex-shrink-0">
          <Clapperboard size={18} className="text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
            CineNexus
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-8 w-8"
          onClick={() => setCollapsed(!collapsed)}
          data-testid="sidebar-collapse-button"
        >
          <ChevronLeft size={16} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {NAV_ITEMS.map(item => (
            <NavItem key={item.path} item={item} />
          ))}
        </div>

        {user?.role === 'admin' && (
          <>
            <Separator className="my-4 bg-white/8" />
            <div className="space-y-1">
              <NavItem item={{ path: '/admin', icon: Shield, label: 'Admin' }} />
            </div>
          </>
        )}
      </ScrollArea>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-white/8 space-y-1">
        {BOTTOM_ITEMS.map(item => (
          <NavItem key={item.path} item={item} />
        ))}
        
        <div className="flex items-center gap-2 px-3 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleTheme}
            data-testid="theme-toggle-switch"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
          {!collapsed && (
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              {theme === 'dark' ? 'Light' : 'Dark'} mode
            </span>
          )}
        </div>

        {user && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 text-[hsl(var(--muted-foreground))] hover:text-red-400"
            onClick={logout}
            data-testid="sidebar-logout-button"
          >
            <LogOut size={18} />
            {!collapsed && <span className="text-sm">Logout</span>}
          </Button>
        )}
      </div>
    </div>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[hsl(var(--background))]/95 backdrop-blur-xl border-b border-white/8 flex items-center px-4">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" data-testid="mobile-menu-button">
            <Menu size={20} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] bg-[hsl(var(--card))] border-white/8 p-0">
          <div className="flex items-center gap-3 px-4 h-16 border-b border-white/8">
            <div className="w-8 h-8 rounded-lg bg-[#00E4FF] flex items-center justify-center shadow-[0_0_20px_rgba(0,228,255,0.5)]">
              <Clapperboard size={18} className="text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>CineNexus</span>
          </div>
          <ScrollArea className="h-[calc(100vh-8rem)] px-3 py-4">
            <div className="space-y-1">
              {NAV_ITEMS.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors
                    ${isActive(item.path)
                      ? 'bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]'
                      : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-white/5'
                    }`}
                >
                  <item.icon size={20} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors
                    ${isActive('/admin')
                      ? 'bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]'
                      : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-white/5'
                    }`}
                >
                  <Shield size={20} />
                  <span className="text-sm font-medium">Admin</span>
                </Link>
              )}
            </div>
          </ScrollArea>
          <div className="px-3 py-3 border-t border-white/8">
            <Button variant="ghost" className="w-full justify-start gap-3" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <span className="text-sm">{theme === 'dark' ? 'Light' : 'Dark'} mode</span>
            </Button>
            {user && (
              <Button variant="ghost" className="w-full justify-start gap-3 text-red-400" onClick={() => { logout(); setOpen(false); }}>
                <LogOut size={18} />
                <span className="text-sm">Logout</span>
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <div className="flex items-center gap-2 ml-3">
        <div className="w-7 h-7 rounded-lg bg-[#00E4FF] flex items-center justify-center shadow-[0_0_15px_rgba(0,228,255,0.5)]">
          <Clapperboard size={14} className="text-white" />
        </div>
        <span className="text-base font-semibold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>CineNexus</span>
      </div>
    </div>
  );
}
