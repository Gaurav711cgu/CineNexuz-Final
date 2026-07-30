import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { useProfile } from '../lib/profileContext';
import NotificationBell from './NotificationBell';
import { toast } from 'sonner';
import { Switch } from './ui/switch';
import { Logo } from './ui/Logo';
import {
  Home, Compass, MessageCircle, Users, Ticket, Crown, 
  User, Sun, Moon, LogOut, Search, ChevronLeft, ChevronRight,
  Clapperboard, TrendingUp, Play, List, Download, 
  Settings, Heart, Clock, Sparkles, Newspaper, UserPlus, Video,
  BarChart3, Zap, Shield, Menu, X, Globe2,
  Film, Tv, Gamepad2, Smile, Flame, Music, Camera, Laptop
} from 'lucide-react';

const ICON_MAP = {
  Film, Tv, Gamepad2, Smile, User, Flame, Music, Ticket, Heart, Camera, Laptop, Sparkles
};
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';

const NAV_SECTIONS = {
  main: [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/discover', icon: Compass, label: 'Discover' },
    { path: '/franchises', icon: Globe2, label: 'Franchises', badge: 'NEW' },
    { path: '/chat', icon: MessageCircle, label: 'AI Chat' },
    { path: '/ai-lab', icon: Sparkles, label: 'AI Lab', badge: 'NEW' },
  ],
  media: [
    { path: '/watchparty', icon: Users, label: 'Watch Party' },
    { path: '/theatre', icon: Ticket, label: 'Theatre' },
  ],
  library: [
    { path: '/profile', icon: User, label: 'My List', badge: 'NEW' },
    { path: '/discover', icon: Clock, label: 'Continue Watching' },
    { path: '/discover', icon: Download, label: 'Downloads' },
    { path: '/discover', icon: Heart, label: 'Favorites' },
  ],
};

export function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const { activeProfile } = useProfile();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    const cleanQuery = searchQuery ? searchQuery.replace(/[^\w\s\-\.\,\:\?]/gi, '').trim() : '';
    if (cleanQuery) {
      navigate(`/search?q=${encodeURIComponent(cleanQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <motion.div
      className="h-screen sticky top-0 flex flex-col overflow-hidden"
      initial={false}
      animate={{
        width: collapsed ? '80px' : '280px',
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0b2e] via-[#16213e] to-[#0f0f1e] opacity-95" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
      <div className="noise-overlay opacity-5" />
      
      {/* Glow Effect */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header with Logo & Collapse */}
        <div className="p-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(0,228,255,0.2)]">
              <Logo size={28} glow={true} />
            </div>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-lg font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent"
                style={{ fontFamily: 'Space Grotesk' }}
              >
                CineNexus
              </motion.span>
            )}
          </Link>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 hover:bg-white/10"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3">
          {/* Search Bar */}
          {!collapsed && (
            <motion.form
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 bg-white/5 border-white/10 focus:border-cyan-500/50 focus:bg-white/10 transition-all text-sm placeholder:text-white/40"
                  data-testid="sidebar-search-input"
                />
              </div>
            </motion.form>
          )}

          {/* Upgrade Button */}
          {user && user.subscription?.plan !== 'premium' && !collapsed && (
            <Link to="/subscription">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mb-4 p-4 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 relative overflow-hidden cursor-pointer group"
                data-testid="sidebar-upgrade-button"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-white/20 to-purple-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Crown size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">Upgrade to Premium</p>
                    <p className="text-white/80 text-xs">Unlock exclusive features</p>
                  </div>
                  <ChevronRight size={16} className="text-white" />
                </div>
              </motion.div>
            </Link>
          )}

          {/* News Feed Section */}
          {!collapsed && (
            <div className="mb-4">
              <p className="px-3 mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">News Feed</p>
              <div className="space-y-1">
                <NavItem item={{ path: '/', icon: Newspaper, label: 'Latest Updates' }} collapsed={collapsed} />
                <NavItem item={{ path: '/discover', icon: TrendingUp, label: 'Trending' }} collapsed={collapsed} />
              </div>
            </div>
          )}

          {/* Main Navigation */}
          <div className="mb-4">
            {!collapsed && <p className="px-3 mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">Browse</p>}
            <div className="space-y-1">
              {NAV_SECTIONS.main.map((item) => (
                <NavItem key={item.path} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>

          {/* Media Section */}
          <div className="mb-4">
            {!collapsed && <p className="px-3 mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">Social</p>}
            <div className="space-y-1">
              {NAV_SECTIONS.media.map((item) => (
                <NavItem key={item.path} item={item} collapsed={collapsed} />
              ))}
              {!collapsed && (
                <NavItem item={{ path: '/discover', icon: UserPlus, label: 'Following' }} collapsed={collapsed} />
              )}
            </div>
          </div>

          {/* Library Section */}
          {user && (
            <div className="mb-4">
              {!collapsed && <p className="px-3 mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">Your Library</p>}
              <div className="space-y-1">
                {NAV_SECTIONS.library.map((item) => (
                  <NavItem key={item.path} item={item} collapsed={collapsed} />
                ))}
                {!collapsed && (
                  <>
                    <NavItem item={{ path: '/discover', icon: Video, label: 'Your Videos' }} collapsed={collapsed} />
                    <NavItem item={{ path: '/discover', icon: List, label: 'Playlists' }} collapsed={collapsed} />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Admin Section */}
          {user?.role === 'admin' && (
            <div className="mb-4">
              {!collapsed && <p className="px-3 mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">Admin</p>}
              <div className="space-y-1">
                <NavItem item={{ path: '/admin', icon: Shield, label: 'Dashboard' }} collapsed={collapsed} />
                <NavItem item={{ path: '/admin', icon: BarChart3, label: 'Analytics' }} collapsed={collapsed} />
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Bottom Section */}
        <div className="p-3 space-y-2 border-t border-white/10">
          {/* User Profile */}
          {user && !collapsed && (
            <Link to="/profile">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                data-testid="sidebar-profile-card"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg border border-white/10 flex-shrink-0 text-lg"
                  style={{
                    background: activeProfile?.avatar_type === 'color' 
                      ? (activeProfile.avatar_color || '#22d3ee') 
                      : 'linear-gradient(135deg, #00E4FF 0%, #004D7A 100%)'
                  }}
                >
                  {activeProfile?.avatar_emoji && ICON_MAP[activeProfile.avatar_emoji] ? (
                    (() => {
                      const IconComponent = ICON_MAP[activeProfile.avatar_emoji];
                      return <IconComponent className="w-5 h-5 text-white filter drop-shadow-sm" />;
                    })()
                  ) : activeProfile?.avatar_emoji ? (
                    <span className="select-none filter drop-shadow-sm">{activeProfile.avatar_emoji}</span>
                  ) : activeProfile?.avatar_url ? (
                    <img src={activeProfile.avatar_url} alt={activeProfile.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span>{activeProfile?.name?.[0]?.toUpperCase() || user.name?.[0]?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{activeProfile?.name || user.name || 'User'}</p>
                  <p className="text-xs text-white/60 truncate">
                    {activeProfile?.is_child ? 'Kids Profile' : activeProfile?.age_rating ? `Maturity: ${activeProfile.age_rating}` : user.email}
                  </p>
                </div>
                <ChevronRight size={14} className="text-white/40 group-hover:text-white transition-colors" />
              </motion.div>
            </Link>
          )}

          {/* Notification Bell (collapsed) */}
          {user && collapsed && (
            <div className="flex justify-center">
              <NotificationBell />
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 hover:bg-white/10"
              data-testid="sidebar-theme-toggle"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </Button>

            {/* Settings */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className="h-9 w-9 hover:bg-white/10"
              data-testid="sidebar-settings-button"
            >
              <Settings size={16} />
            </Button>

            {/* Notification Bell */}
            {!collapsed && user && <NotificationBell />}

            {/* Logout */}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="h-9 w-9 hover:bg-red-500/20 hover:text-red-400"
                data-testid="sidebar-logout-button"
              >
                <LogOut size={16} />
              </Button>
            )}
          </div>

          {/* Collapsed user avatar */}
          {user && collapsed && (
            <Link to="/profile">
              <div
                className="w-10 h-10 mx-auto rounded-full flex items-center justify-center text-white font-bold shadow-lg cursor-pointer hover:scale-110 transition-transform border border-white/10 text-lg"
                style={{
                  background: activeProfile?.avatar_type === 'color' 
                    ? (activeProfile.avatar_color || '#22d3ee') 
                    : 'linear-gradient(135deg, #00E4FF 0%, #004D7A 100%)'
                }}
              >
                {activeProfile?.avatar_emoji && ICON_MAP[activeProfile.avatar_emoji] ? (
                  (() => {
                    const IconComponent = ICON_MAP[activeProfile.avatar_emoji];
                    return <IconComponent className="w-5 h-5 text-white filter drop-shadow-sm" />;
                  })()
                ) : activeProfile?.avatar_emoji ? (
                  <span className="select-none filter drop-shadow-sm">{activeProfile.avatar_emoji}</span>
                ) : activeProfile?.avatar_url ? (
                  <img src={activeProfile.avatar_url} alt={activeProfile.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span>{activeProfile?.name?.[0]?.toUpperCase() || user.name?.[0]?.toUpperCase() || 'U'}</span>
                )}
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Floating Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md p-6 rounded-3xl bg-[#0f0f1c]/95 border border-white/10 text-white relative overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative radial gradients */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -z-10" />

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Settings className="text-cyan-400" size={18} />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>Preferences Settings</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(false)}
                  className="h-8 w-8 hover:bg-white/10 rounded-full"
                >
                  <X size={16} />
                </Button>
              </div>

              {/* Preferences Settings Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Streaming Quality</p>
                    <p className="text-xs text-white/50">Configure default video resolutions.</p>
                  </div>
                  <select
                    value={localStorage.getItem('cinenexus_stream_quality') || 'Auto'}
                    onChange={(e) => {
                      localStorage.setItem('cinenexus_stream_quality', e.target.value);
                      toast.success(`Stream quality set to ${e.target.value}`);
                    }}
                    className="bg-white/10 border border-white/15 rounded-xl px-3 py-1.5 text-xs focus:outline-none text-white focus:bg-[#151522] cursor-pointer"
                  >
                    <option value="Auto">Auto</option>
                    <option value="1080p">1080p (FHD)</option>
                    <option value="720p">720p (HD)</option>
                    <option value="480p">480p (SD)</option>
                  </select>
                </div>

                <Separator className="bg-white/5" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Auto-Play Next</p>
                    <p className="text-xs text-white/50">Play the next episode automatically.</p>
                  </div>
                  <Switch
                    checked={localStorage.getItem('cinenexus_autoplay_next') !== 'false'}
                    onCheckedChange={(val) => {
                      localStorage.setItem('cinenexus_autoplay_next', val ? 'true' : 'false');
                      toast.success(`Auto-play next ${val ? 'Enabled' : 'Disabled'}`);
                    }}
                  />
                </div>

                <Separator className="bg-white/5" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Autoplay Previews</p>
                    <p className="text-xs text-white/50">Play trailer previews on hover.</p>
                  </div>
                  <Switch
                    checked={localStorage.getItem('cinenexus_autoplay_trailers') !== 'false'}
                    onCheckedChange={(val) => {
                      localStorage.setItem('cinenexus_autoplay_trailers', val ? 'true' : 'false');
                      toast.success(`Autoplay previews ${val ? 'Enabled' : 'Disabled'}`);
                    }}
                  />
                </div>

                <Separator className="bg-white/5" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Interface Theme</p>
                    <p className="text-xs text-white/50">Choose between dark and light modes.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/15 h-8 gap-2 bg-white/5 text-xs text-white hover:bg-white/10 hover:text-white"
                    onClick={toggleTheme}
                  >
                    {theme === 'dark' ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-cyan-400" />}
                    <span>{theme === 'dark' ? 'Dark' : 'Light'} Mode</span>
                  </Button>
                </div>

                {user && (
                  <>
                    <Separator className="bg-white/5" />
                    <div className="pt-2">
                      <p className="text-xs text-white/40 uppercase font-bold tracking-wider mb-2">Active Profile</p>
                      <div className="bg-white/5 rounded-2xl p-3 flex items-center justify-between border border-white/5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold select-none"
                            style={{
                              background: activeProfile?.avatar_type === 'color' 
                                ? (activeProfile.avatar_color || '#7C3AED') 
                                : 'linear-gradient(135deg, #00E4FF 0%, #004D7A 100%)'
                            }}
                          >
                            {activeProfile?.avatar_emoji && ICON_MAP[activeProfile.avatar_emoji] ? (
                              (() => {
                                const IconComponent = ICON_MAP[activeProfile.avatar_emoji];
                                return <IconComponent className="w-5 h-5 text-white filter drop-shadow-sm" />;
                              })()
                            ) : activeProfile?.avatar_emoji ? (
                              <span className="select-none filter drop-shadow-sm">{activeProfile.avatar_emoji}</span>
                            ) : (
                              activeProfile?.name?.[0]?.toUpperCase() || user.name?.[0]?.toUpperCase() || 'U'
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{activeProfile?.name || 'User'}</p>
                            <p className="text-xs text-white/50 truncate max-w-[180px]">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link to="/profiles" onClick={() => setShowSettings(false)}>
                            <Button size="sm" variant="outline" className="text-xs border-white/15 h-8 bg-white/5 hover:bg-white/10 text-white hover:text-white">
                              Profiles
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function NavItem({ item, collapsed }) {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  const Icon = item.icon;

  return (
    <Link to={item.path}>
      <motion.div
        whileHover={{ x: collapsed ? 0 : 4 }}
        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
          isActive
            ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white shadow-[0_0_20px_rgba(0,228,255,0.2)]'
            : 'text-white/70 hover:text-white hover:bg-white/10'
        }`}
        data-testid={`nav-item-${item.label.toLowerCase().replace(' ', '-')}`}
      >
        {/* Active Indicator */}
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-purple-600 rounded-r-full"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}

        <Icon size={18} className={isActive ? 'text-cyan-400' : ''} />
        
        {!collapsed && (
          <span className="flex-1 text-sm font-medium">{item.label}</span>
        )}

        {!collapsed && item.badge && (
          <Badge className="text-[10px] px-1.5 py-0 bg-cyan-500 text-white border-0">
            {item.badge}
          </Badge>
        )}

        {/* Hover glow */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg blur-xl -z-10" />
        )}
      </motion.div>
    </Link>
  );
}

// Mobile Sidebar (Sheet-based for mobile)
export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { activeProfile } = useProfile();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const allNavItems = [
    ...NAV_SECTIONS.main,
    ...NAV_SECTIONS.media,
  ];

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[hsl(var(--background))]/95 backdrop-blur-xl border-b border-white/8 flex items-center px-4">
      <div className="flex items-center gap-3" onClick={() => setOpen(true)}>
        <Button variant="ghost" size="icon" data-testid="mobile-menu-button">
          <Menu size={20} />
        </Button>
      </div>
      
      <div className="flex items-center gap-2 ml-3">
        <div className="w-8 h-8 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-[0_0_15px_rgba(0,228,255,0.2)]">
          <Logo size={22} glow={true} />
        </div>
        <span className="text-base font-semibold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>CineNexus</span>
      </div>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setOpen(false)}
            />
            
            {/* Sidebar Sheet */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-gradient-to-br from-[#1a0b2e] via-[#16213e] to-[#0f0f1e] z-50 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(0,228,255,0.2)]">
                    <Logo size={22} glow={true} />
                  </div>
                  <span className="text-lg font-semibold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk' }}>
                    CineNexus
                  </span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                  <X size={20} />
                </Button>
              </div>

              <ScrollArea className="h-[calc(100vh-8rem)] px-3 py-4">
                {/* Browse Section */}
                <div className="mb-4">
                  <p className="px-3 mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">Browse</p>
                  <div className="space-y-1">
                    {allNavItems.map((item) => (
                      <Link key={item.path} to={item.path} onClick={() => setOpen(false)}>
                        <div
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                            isActive(item.path)
                              ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white'
                              : 'text-white/70 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <item.icon size={18} />
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Admin Section */}
                {user?.role === 'admin' && (
                  <div className="mb-4">
                    <p className="px-3 mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">Admin</p>
                    <div className="space-y-1">
                      <Link to="/admin" onClick={() => setOpen(false)}>
                        <div
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                            isActive('/admin')
                              ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white'
                              : 'text-white/70 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Shield size={18} />
                          <span className="text-sm font-medium">Dashboard</span>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </ScrollArea>

              {/* Footer */}
              <div className="px-3 py-3 border-t border-white/10 space-y-1">
                <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-white/10" onClick={toggleTheme}>
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                  <span className="text-sm">{theme === 'dark' ? 'Light' : 'Dark'} mode</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 hover:bg-white/10"
                  onClick={() => {
                    setShowSettings(true);
                    setOpen(false);
                  }}
                >
                  <Settings size={18} />
                  <span className="text-sm">Settings</span>
                </Button>

                {user && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-red-400 hover:bg-red-500/10"
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                  >
                    <LogOut size={18} />
                    <span className="text-sm">Logout</span>
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md p-6 rounded-3xl bg-[#0f0f1c]/95 border border-white/10 text-white relative overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative radial gradients */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -z-10" />

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Settings className="text-cyan-400" size={18} />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>Preferences Settings</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(false)}
                  className="h-8 w-8 hover:bg-white/10 rounded-full"
                >
                  <X size={16} />
                </Button>
              </div>

              {/* Preferences Settings Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Streaming Quality</p>
                    <p className="text-xs text-white/50">Configure default video resolutions.</p>
                  </div>
                  <select
                    value={localStorage.getItem('cinenexus_stream_quality') || 'Auto'}
                    onChange={(e) => {
                      localStorage.setItem('cinenexus_stream_quality', e.target.value);
                      toast.success(`Stream quality set to ${e.target.value}`);
                    }}
                    className="bg-white/10 border border-white/15 rounded-xl px-3 py-1.5 text-xs focus:outline-none text-white focus:bg-[#151522] cursor-pointer"
                  >
                    <option value="Auto">Auto</option>
                    <option value="1080p">1080p (FHD)</option>
                    <option value="720p">720p (HD)</option>
                    <option value="480p">480p (SD)</option>
                  </select>
                </div>

                <Separator className="bg-white/5" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Auto-Play Next</p>
                    <p className="text-xs text-white/50">Play the next episode automatically.</p>
                  </div>
                  <Switch
                    checked={localStorage.getItem('cinenexus_autoplay_next') !== 'false'}
                    onCheckedChange={(val) => {
                      localStorage.setItem('cinenexus_autoplay_next', val ? 'true' : 'false');
                      toast.success(`Auto-play next ${val ? 'Enabled' : 'Disabled'}`);
                    }}
                  />
                </div>

                <Separator className="bg-white/5" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Autoplay Previews</p>
                    <p className="text-xs text-white/50">Play trailer previews on hover.</p>
                  </div>
                  <Switch
                    checked={localStorage.getItem('cinenexus_autoplay_trailers') !== 'false'}
                    onCheckedChange={(val) => {
                      localStorage.setItem('cinenexus_autoplay_trailers', val ? 'true' : 'false');
                      toast.success(`Autoplay previews ${val ? 'Enabled' : 'Disabled'}`);
                    }}
                  />
                </div>

                <Separator className="bg-white/5" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Interface Theme</p>
                    <p className="text-xs text-white/50">Choose between dark and light modes.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/15 h-8 gap-2 bg-white/5 text-xs text-white hover:bg-white/10 hover:text-white"
                    onClick={toggleTheme}
                  >
                    {theme === 'dark' ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-cyan-400" />}
                    <span>{theme === 'dark' ? 'Dark' : 'Light'} Mode</span>
                  </Button>
                </div>

                {user && (
                  <>
                    <Separator className="bg-white/5" />
                    <div className="pt-2">
                      <p className="text-xs text-white/40 uppercase font-bold tracking-wider mb-2">Active Profile</p>
                      <div className="bg-white/5 rounded-2xl p-3 flex items-center justify-between border border-white/5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold select-none"
                            style={{
                              background: activeProfile?.avatar_type === 'color' 
                                ? (activeProfile.avatar_color || '#7C3AED') 
                                : 'linear-gradient(135deg, #00E4FF 0%, #004D7A 100%)'
                            }}
                          >
                            {activeProfile?.avatar_emoji && ICON_MAP[activeProfile.avatar_emoji] ? (
                              (() => {
                                const IconComponent = ICON_MAP[activeProfile.avatar_emoji];
                                return <IconComponent className="w-5 h-5 text-white filter drop-shadow-sm" />;
                              })()
                            ) : activeProfile?.avatar_emoji ? (
                              <span className="select-none filter drop-shadow-sm">{activeProfile.avatar_emoji}</span>
                            ) : (
                              activeProfile?.name?.[0]?.toUpperCase() || user.name?.[0]?.toUpperCase() || 'U'
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{activeProfile?.name || 'User'}</p>
                            <p className="text-xs text-white/50 truncate max-w-[180px]">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link to="/profiles" onClick={() => setShowSettings(false)}>
                            <Button size="sm" variant="outline" className="text-xs border-white/15 h-8 bg-white/5 hover:bg-white/10 text-white hover:text-white">
                              Profiles
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Sidebar;
