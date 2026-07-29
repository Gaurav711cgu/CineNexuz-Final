import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';
import { ArrowLeft, Delete, Lock, Film, Tv, Gamepad2, Smile, User, Flame, Music, Ticket, Heart, Camera, Laptop, Sparkles } from 'lucide-react';
import { useProfile } from '../lib/profileContext';
import { useSound } from '../lib/sound';
import { toast } from 'sonner';

const ICON_MAP = {
  Film, Tv, Gamepad2, Smile, User, Flame, Music, Ticket, Heart, Camera, Laptop, Sparkles
};

export default function ProfileUnlockPage() {
  const [searchParams] = useSearchParams();
  const profileId = searchParams.get('id');
  const { profiles, verifyPin } = useProfile();
  const navigate = useNavigate();
  const { playSound } = useSound();

  const [pin, setPin] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const controls = useAnimation(); // wrong pin shake animation control

  useEffect(() => {
    if (!profileId || !profiles.length) return;
    const found = profiles.find((p) => p._id === profileId);
    if (!found) {
      toast.error('Profile not found');
      navigate('/profiles');
    } else {
      setProfile(found);
    }
  }, [profileId, profiles, navigate]);

  // Support keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (loading) return;
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, loading]);

  const handleKeyPress = (num) => {
    if (pin.length >= 4 || loading) return;
    playSound('click');
    const newPin = pin + num;
    setPin(newPin);

    if (newPin.length === 4) {
      triggerVerify(newPin);
    }
  };

  const handleBackspace = () => {
    if (pin.length === 0 || loading) return;
    playSound('click');
    setPin((prev) => prev.slice(0, -1));
  };

  const triggerVerify = async (enteredPin) => {
    setLoading(true);
    try {
      const success = await verifyPin(profileId, enteredPin);
      if (success) {
        playSound('success');
        toast.success(`Access granted! Welcome, ${profile.name}!`);
        navigate('/');
      } else {
        throw new Error('Incorrect PIN');
      }
    } catch (e) {
      playSound('error');
      toast.error('Invalid PIN. Please try again.');
      setPin('');
      // Shake dots
      controls.start({
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.4 },
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#07080f] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  const getAvatarBg = () => {
    if (profile.avatar_type === 'color') return profile.avatar_color || '#22d3ee';
    return 'linear-gradient(135deg, #00E4FF 0%, #004D7A 100%)';
  };

  return (
    <div className="min-h-screen bg-[#07080f] flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      {/* Background Glow matching avatar color */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-[160px] opacity-10 pointer-events-none transition-all duration-500"
        style={{
          background: profile.avatar_color || '#22d3ee',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Back Button */}
      <button
        onClick={() => {
          playSound('click');
          navigate('/profiles');
        }}
        className="absolute top-8 left-8 flex items-center gap-2 text-white/40 hover:text-white transition-colors duration-200"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Profiles</span>
      </button>

      {/* Avatar Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center mb-8"
      >
        <div
          className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.4)] mb-4 border border-white/10"
          style={{ background: getAvatarBg() }}
        >
          {profile.avatar_emoji && ICON_MAP[profile.avatar_emoji] ? (
            (() => {
              const IconComponent = ICON_MAP[profile.avatar_emoji];
              return <IconComponent className="w-12 h-12 text-white filter drop-shadow-md" />;
            })()
          ) : profile.avatar_emoji ? (
            <span className="text-5xl select-none filter drop-shadow-md">{profile.avatar_emoji}</span>
          ) : profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <span className="text-3xl font-bold text-black/50 select-none">
              {profile.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-white/40" />
          <h2 className="text-xl font-bold tracking-wide">Unlock {profile.name}</h2>
        </div>
        <p className="text-xs text-white/40 mt-1">Profile lock is currently enabled.</p>
      </motion.div>

      {/* Shake Wrapper for Dots */}
      <motion.div animate={controls} className="flex justify-center gap-4 mb-12">
        {[0, 1, 2, 3].map((idx) => {
          const isFilled = pin.length > idx;
          return (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                isFilled
                  ? 'bg-[#00E4FF] border-[#00E4FF] scale-110 shadow-[0_0_12px_rgba(0,228,255,0.4)]'
                  : 'border-white/20 bg-transparent'
              }`}
            />
          );
        })}
      </motion.div>

      {/* Numeric Keypad Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-[280px]"
      >
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              disabled={loading}
              onClick={() => handleKeyPress(num.toString())}
              className="w-20 h-20 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 active:scale-95 transition-all duration-150 flex items-center justify-center text-2xl font-bold text-white/80 hover:text-white"
            >
              {num}
            </button>
          ))}
          {/* Backspace */}
          <button
            disabled={loading}
            onClick={handleBackspace}
            className="w-20 h-20 rounded-full bg-transparent hover:bg-white/5 active:scale-95 transition-all duration-150 flex items-center justify-center text-white/40 hover:text-white/80"
          >
            <Delete className="w-6 h-6" />
          </button>
          {/* Zero */}
          <button
            disabled={loading}
            onClick={() => handleKeyPress('0')}
            className="w-20 h-20 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 active:scale-95 transition-all duration-150 flex items-center justify-center text-2xl font-bold text-white/80 hover:text-white"
          >
            0
          </button>
          {/* Clear */}
          <button
            disabled={loading}
            onClick={() => {
              playSound('click');
              setPin('');
            }}
            className="w-20 h-20 rounded-full bg-transparent hover:bg-white/5 active:scale-95 transition-all duration-150 flex items-center justify-center text-xs font-bold tracking-widest text-white/30 hover:text-white/60 uppercase"
          >
            Clear
          </button>
        </div>
      </motion.div>
    </div>
  );
}
