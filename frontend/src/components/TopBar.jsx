import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Users, Settings, User, Bell, ChevronDown, Plus, Film, Tv, Gamepad2, Smile, Flame, Music, Ticket, Heart, Camera, Laptop, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useProfile } from '../lib/profileContext';
import { useSound } from '../lib/sound';
import { Button } from './ui/button';

const ICON_MAP = {
  Film, Tv, Gamepad2, Smile, User, Flame, Music, Ticket, Heart, Camera, Laptop, Sparkles
};
import NotificationBell from './NotificationBell';

export default function TopBar() {
  const { user, logout, isSignedIn } = useAuth();
  const { activeProfile, profiles, selectProfile } = useProfile();
  const { playSound } = useSound();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleProfileSwitch = (p) => {
    playSound('success');
    if (p.has_pin) {
      navigate(`/profiles/unlock?id=${p._id}`);
    } else {
      selectProfile(p);
      setDropdownOpen(false);
      navigate('/');
    }
  };

  const handleLogout = () => {
    playSound('click');
    logout();
    setDropdownOpen(false);
    navigate('/auth/login');
  };

  const getAvatarBg = (p) => {
    if (!p) return 'linear-gradient(135deg, #00E4FF 0%, #004D7A 100%)';
    if (p.avatar_type === 'color') return p.avatar_color || '#22d3ee';
    return 'linear-gradient(135deg, #00E4FF 0%, #004D7A 100%)';
  };

  return (
    <header className="h-16 border-b border-white/5 bg-[#07080f]/40 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-40 w-full">
      {/* Dynamic Welcoming Header */}
      <div className="hidden sm:flex flex-col">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/30">CineNexuz AI Engine</span>
        <h2 className="text-sm font-bold text-white/80">
          {activeProfile ? (
            <>
              Enjoying cinema as <span className="text-[#00E4FF] font-black">{activeProfile.name}</span>
            </>
          ) : (
            'Welcome to CineNexuz'
          )}
        </h2>
      </div>

      <div className="sm:hidden flex items-center gap-2">
        {/* Mobile Spacer / Placeholder */}
      </div>

      {/* Actions / Dropdown Column */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        {isSignedIn && <NotificationBell />}

        {/* Auth / Profile Block */}
        {!isSignedIn ? (
          <div className="flex items-center gap-2">
            <Link to="/auth/login">
              <Button
                variant="ghost"
                onClick={() => playSound('click')}
                className="text-white/70 hover:text-white text-xs md:text-sm font-semibold uppercase tracking-wider"
              >
                Sign In
              </Button>
            </Link>
            <Link to="/auth/signup">
              <Button
                onClick={() => playSound('click')}
                className="bg-gradient-to-r from-[#00E4FF] to-blue-500 hover:brightness-110 text-black font-extrabold text-xs md:text-sm uppercase tracking-wider shadow-[0_0_15px_rgba(0,228,255,0.25)] rounded-xl px-4 py-2"
              >
                Join Now
              </Button>
            </Link>
          </div>
        ) : (
          <div className="relative">
            {/* Active Profile Pill / Trigger */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                playSound('click');
                setDropdownOpen(!dropdownOpen);
              }}
              className="flex items-center gap-2.5 p-1.5 pr-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all duration-200 cursor-pointer"
            >
              {/* Profile Avatar Icon */}
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-lg border border-white/10"
                style={{ background: getAvatarBg(activeProfile) }}
              >
                {activeProfile?.avatar_emoji && ICON_MAP[activeProfile.avatar_emoji] ? (
                  (() => {
                    const IconComponent = ICON_MAP[activeProfile.avatar_emoji];
                    return <IconComponent className="w-5 h-5 text-white filter drop-shadow-sm" />;
                  })()
                ) : activeProfile?.avatar_emoji ? (
                  <span className="select-none filter drop-shadow-sm">{activeProfile.avatar_emoji}</span>
                ) : activeProfile?.avatar_url ? (
                  <img src={activeProfile.avatar_url} alt={activeProfile.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <span className="text-sm font-bold text-black/60 select-none">
                    {activeProfile?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>

              <span className="text-sm font-semibold text-white/80 max-w-[100px] truncate hidden md:inline">
                {activeProfile?.name || 'User'}
              </span>

              <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            {/* Dropdown Container */}
            <AnimatePresence>
              {dropdownOpen && (
                <>
                  {/* Backdrop closer */}
                  <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />

                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 mt-2.5 w-64 rounded-2xl border border-white/5 bg-[#0d0d12]/95 backdrop-blur-2xl shadow-2xl p-2 z-40"
                  >
                    {/* User profile identifier */}
                    <div className="p-3 border-b border-white/5 mb-2">
                      <p className="text-xs text-white/40 font-bold uppercase tracking-wider">Account</p>
                      <p className="text-sm font-bold text-white truncate mt-1">{user?.name || 'User Account'}</p>
                      <p className="text-[10px] text-white/50 truncate mt-0.5">{user?.email}</p>
                    </div>

                    {/* Profiles Switcher row */}
                    {profiles.length > 1 && (
                      <div className="mb-2">
                        <p className="px-3 text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Switch profile</p>
                        <div className="flex flex-col gap-1 max-h-36 overflow-y-auto px-1">
                          {profiles
                            .filter((p) => p._id !== activeProfile?._id)
                            .map((p) => (
                              <button
                                key={p._id}
                                onClick={() => handleProfileSwitch(p)}
                                className="w-full flex items-center gap-2 p-1.5 hover:bg-white/5 rounded-xl transition-colors text-left"
                              >
                                <div
                                  className="w-6 h-6 rounded-lg flex items-center justify-center text-xs flex-shrink-0 border border-white/5"
                                  style={{ background: getAvatarBg(p) }}
                                >
                                  {p.avatar_emoji && ICON_MAP[p.avatar_emoji] ? (
                                    (() => {
                                      const IconComponent = ICON_MAP[p.avatar_emoji];
                                      return <IconComponent className="w-3.5 h-3.5 text-white" />;
                                    })()
                                  ) : p.avatar_emoji ? (
                                    <span className="select-none">{p.avatar_emoji}</span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-black/60 select-none">
                                      {p.name.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs font-medium text-white/80 truncate">{p.name}</span>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Manage profiles button */}
                    <button
                      onClick={() => {
                        playSound('click');
                        setDropdownOpen(false);
                        navigate('/profiles');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Manage Profiles</span>
                    </button>

                    {/* Account page link */}
                    <Link
                      to="/profile"
                      onClick={() => {
                        playSound('click');
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                      <Settings className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Account Settings</span>
                    </Link>

                    <div className="h-px bg-white/5 my-1.5" />

                    {/* Logout Option */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout Account</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );
}
