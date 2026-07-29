import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Lock, EyeOff, Film, Tv, Gamepad2, Smile, User, Flame, Music, Ticket, Heart, Camera, Laptop, Sparkles } from 'lucide-react';
import { useProfile } from '../lib/profileContext';
import { useSound } from '../lib/sound';
import { toast } from 'sonner';

const ICON_MAP = {
  Film, Tv, Gamepad2, Smile, User, Flame, Music, Ticket, Heart, Camera, Laptop, Sparkles
};

export default function ProfilePickerPage() {
  const { profiles, selectProfile, loadingProfiles } = useProfile();
  const [isManageMode, setIsManageMode] = useState(false);
  const navigate = useNavigate();
  const { playSound } = useSound();

  const handleProfileSelect = (profile) => {
    playSound('click');
    if (isManageMode) {
      // Go to edit page
      navigate(`/profiles/edit?id=${profile._id}`);
    } else {
      // Normal selection
      if (profile.has_pin) {
        navigate(`/profiles/unlock?id=${profile._id}`);
      } else {
        selectProfile(profile);
        playSound('success');
        toast.success(`Welcome back, ${profile.name}!`);
        navigate('/');
      }
    }
  };

  const getAvatarBg = (p) => {
    if (p.avatar_type === 'color') return p.avatar_color || '#22d3ee';
    return 'linear-gradient(135deg, #00E4FF 0%, #004D7A 100%)';
  };

  return (
    <div className="min-h-screen bg-[#07080f] flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16 relative z-10"
      >
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
          {isManageMode ? (
            <span className="bg-gradient-to-r from-[#00E4FF] to-purple-400 bg-clip-text text-transparent">
              Manage Profiles
            </span>
          ) : (
            "Who's watching?"
          )}
        </h1>
        <p className="text-white/40 text-sm md:text-base">
          {isManageMode
            ? 'Select a profile to edit settings, restrictions, or avatar.'
            : 'Choose your profile to enter your customized cinema environment.'}
        </p>
      </motion.div>

      {/* Profiles Grid */}
      <div className="relative z-10 w-full max-w-4xl flex flex-wrap justify-center gap-8 md:gap-12 mb-16">
        {loadingProfiles ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <p className="text-white/40 text-sm">Retrieving your cinema profiles...</p>
          </div>
        ) : (
          <AnimatePresence>
            {profiles.map((p, idx) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 30 }}
                transition={{ duration: 0.4, delay: idx * 0.05, type: 'spring', stiffness: 100 }}
                onMouseEnter={() => playSound('hover')}
                onClick={() => handleProfileSelect(p)}
                className="flex flex-col items-center group cursor-pointer"
              >
                {/* Avatar Card */}
                <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden mb-4 border-2 border-white/5 transition-all duration-300 group-hover:border-[#00E4FF] group-hover:scale-105 group-hover:shadow-[0_0_30px_rgba(0,228,255,0.25)] flex items-center justify-center"
                     style={{ background: getAvatarBg(p) }}
                >
                  {p.avatar_emoji && ICON_MAP[p.avatar_emoji] ? (
                    (() => {
                      const IconComponent = ICON_MAP[p.avatar_emoji];
                      return <IconComponent className="w-16 h-16 text-white filter drop-shadow-md" />;
                    })()
                  ) : p.avatar_emoji ? (
                    <span className="text-5xl md:text-6xl select-none filter drop-shadow-md">{p.avatar_emoji}</span>
                  ) : p.avatar_url ? (
                    <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-extrabold text-black/50 select-none">
                      {p.name.charAt(0).toUpperCase()}
                    </span>
                  )}

                  {/* Overlays / Badges */}
                  {p.is_child && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-bold tracking-wider uppercase border border-white/10 text-cyan-400">
                      Kids
                    </span>
                  )}

                  {p.has_pin && !isManageMode && (
                    <div className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/75 border border-white/10 text-white/70">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Manage overlay */}
                  {isManageMode && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center transition-all duration-300">
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-3 rounded-full bg-black/70 border border-white/20 text-[#00E4FF]"
                      >
                        <Edit2 className="w-6 h-6" />
                      </motion.div>
                    </div>
                  )}
                </div>

                {/* Profile Name */}
                <span className="text-sm md:text-base font-medium text-white/70 group-hover:text-white transition-colors duration-200">
                  {p.name}
                </span>
              </motion.div>
            ))}

            {/* Add Profile Card */}
            {!loadingProfiles && profiles.length < 5 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, delay: profiles.length * 0.05 }}
                onMouseEnter={() => playSound('hover')}
                onClick={() => {
                  playSound('click');
                  navigate('/profiles/edit');
                }}
                className="flex flex-col items-center group cursor-pointer"
              >
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl border-2 border-dashed border-white/10 group-hover:border-white/30 bg-white/5 hover:bg-white/10 transition-all duration-300 flex items-center justify-center flex-col gap-2 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                  <Plus className="w-8 h-8 text-white/40 group-hover:text-white/80 transition-colors duration-200" />
                </div>
                <span className="text-sm md:text-base font-medium text-white/40 group-hover:text-white/70 transition-colors duration-200 mt-4">
                  Add Profile
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Action Buttons */}
      {!loadingProfiles && profiles.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            playSound('click');
            setIsManageMode(!isManageMode);
          }}
          className={`px-8 py-3 rounded-xl border text-sm font-medium tracking-wide uppercase transition-all duration-300 relative z-10 ${
            isManageMode
              ? 'border-[#00E4FF] bg-[#00E4FF]/10 text-[#00E4FF] hover:bg-[#00E4FF]/20 shadow-[0_0_15px_rgba(0,228,255,0.15)]'
              : 'border-white/20 text-white/60 hover:text-white hover:border-white/40 bg-white/5 hover:bg-white/10'
          }`}
        >
          {isManageMode ? 'Done' : 'Manage Profiles'}
        </motion.button>
      )}
    </div>
  );
}
