import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, Shield, Lock, Eye, EyeOff, Save, Film, Tv, Gamepad2, Smile, User, Flame, Music, Ticket, Heart, Camera, Laptop, Sparkles } from 'lucide-react';
import { useProfile } from '../lib/profileContext';
import { useSound } from '../lib/sound';
import { toast } from 'sonner';

const ICON_MAP = {
  Film, Tv, Gamepad2, Smile, User, Flame, Music, Ticket, Heart, Camera, Laptop, Sparkles
};
const ICONS = ['Film', 'Tv', 'Gamepad2', 'Smile', 'User', 'Flame', 'Music', 'Ticket', 'Heart', 'Camera', 'Laptop', 'Sparkles'];
const COLORS = ['#22d3ee', '#38bdf8', '#818cf8', '#a78bfa', '#f472b6', '#fb7185', '#f87171', '#fb923c', '#fbbf24', '#34d399'];

export default function ProfileEditPage() {
  const [searchParams] = useSearchParams();
  const profileId = searchParams.get('id');
  const { profiles, createProfile, updateProfile, deleteProfile } = useProfile();
  const navigate = useNavigate();
  const { playSound } = useSound();

  const isEditMode = !!profileId;
  const [name, setName] = useState('');
  const [avatarType, setAvatarType] = useState('color');
  const [avatarColor, setAvatarColor] = useState('#22d3ee');
  const [avatarEmoji, setAvatarEmoji] = useState('Film');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isChild, setIsChild] = useState(false);
  const [ageRating, setAgeRating] = useState('18+');
  const [enablePin, setEnablePin] = useState(false);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditMode && profiles.length) {
      const found = profiles.find((p) => p._id === profileId);
      if (found) {
        setName(found.name);
        setAvatarType(found.avatar_type || 'color');
        setAvatarColor(found.avatar_color || '#22d3ee');
        setAvatarEmoji(found.avatar_emoji || 'Film');
        setAvatarUrl(found.avatar_url || '');
        setIsChild(found.is_child || false);
        setAgeRating(found.age_rating || '18+');
        setEnablePin(found.has_pin || false);
        setPin(''); // don't pre-populate hashed PIN, let user overwrite
      }
    }
  }, [isEditMode, profileId, profiles]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Profile name cannot be empty');
      return;
    }
    if (name.length > 20) {
      toast.error('Profile name must be 20 characters or less');
      return;
    }
    if (enablePin && pin && (!/^\d{4}$/.test(pin))) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }

    setSaving(true);
    playSound('click');

    const payload = {
      name: name.trim(),
      avatar_type: avatarType,
      avatar_color: avatarColor,
      avatar_emoji: avatarEmoji,
      avatar_url: avatarUrl,
      is_child: isChild,
      age_rating: isChild ? 'all' : ageRating,
      pin: enablePin ? pin : '', // empty pin clears it on backend
    };

    try {
      if (isEditMode) {
        await updateProfile(profileId, payload);
        playSound('success');
        toast.success('Profile updated successfully!');
      } else {
        await createProfile(payload);
        playSound('success');
        toast.success('Profile created successfully!');
      }
      navigate('/profiles');
    } catch (err) {
      playSound('error');
      toast.error(err.response?.data?.detail || 'An error occurred while saving the profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (profiles.length <= 1) {
      toast.error('Cannot delete the only profile on your account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action is irreversible.`)) {
      return;
    }

    playSound('click');
    try {
      await deleteProfile(profileId);
      playSound('success');
      toast.success('Profile deleted successfully');
      navigate('/profiles');
    } catch (err) {
      playSound('error');
      toast.error(err.response?.data?.detail || 'Failed to delete profile');
    }
  };

  const getPreviewBg = () => {
    if (avatarType === 'color') return avatarColor;
    return 'linear-gradient(135deg, #00E4FF 0%, #004D7A 100%)';
  };

  return (
    <div className="min-h-screen bg-[#07080f] flex flex-col items-center justify-center p-6 text-white overflow-y-auto relative">
      {/* Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-4xl relative z-10 flex flex-col gap-6">
        {/* Back Button */}
        <button
          onClick={() => {
            playSound('click');
            navigate('/profiles');
          }}
          className="self-start flex items-center gap-2 text-white/40 hover:text-white transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Cancel</span>
        </button>

        {/* Title */}
        <div className="border-b border-white/5 pb-4 mb-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? 'Edit Profile' : 'Create Profile'}
          </h1>
          <p className="text-white/40 text-xs mt-1">
            {isEditMode ? 'Change avatar, pin protection, and kids mode details.' : 'Add a new member profile to this account.'}
          </p>
        </div>

        {/* Form and Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Real-time Preview Sidebar */}
          <div className="flex flex-col items-center p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md h-fit">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-6">Real-Time Preview</h3>
            <div
              className="w-28 h-28 rounded-2xl flex items-center justify-center shadow-[0_0_35px_rgba(0,0,0,0.3)] transition-all duration-300 border border-white/10"
              style={{ background: getPreviewBg() }}
            >
              {avatarEmoji && ICON_MAP[avatarEmoji] ? (
                (() => {
                  const IconComponent = ICON_MAP[avatarEmoji];
                  return <IconComponent className="w-16 h-16 text-white filter drop-shadow-md" />;
                })()
              ) : (
                <span className="text-4xl font-extrabold text-black/50 select-none">
                  {name ? name.charAt(0).toUpperCase() : '?'}
                </span>
              )}
            </div>

            <span className="text-lg font-semibold tracking-wide text-white/80 mt-4 max-w-[200px] truncate">
              {name || 'New Profile'}
            </span>

            {isChild && (
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-[#00E4FF] text-[10px] font-bold uppercase tracking-wider mt-2 border border-[#00E4FF]/20">
                Kids Profile
              </span>
            )}
            {!isChild && (
              <span className="px-2 py-0.5 rounded bg-white/5 text-white/50 text-[10px] font-bold uppercase tracking-wider mt-2 border border-white/5">
                Rating Limit: {ageRating}
              </span>
            )}
          </div>

          {/* Edit Fields Panel */}
          <form onSubmit={handleSave} className="md:col-span-2 flex flex-col gap-6">
            {/* Profile Name Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-white/50">Profile Name</label>
              <input
                type="text"
                placeholder="Enter name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-[#00E4FF] focus:bg-white/10 transition-all duration-200 text-base"
              />
            </div>

            {/* Avatar Theme Colors */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-white/50">Profile Color</label>
              <div className="flex flex-wrap gap-2.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      playSound('click');
                      setAvatarColor(c);
                    }}
                    className={`w-7 h-7 rounded-full transition-all duration-200 ${
                      avatarColor === c ? 'scale-125 border-2 border-white ring-2 ring-[#00E4FF]/40' : 'border border-white/10 hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Icon Selector */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-white/50">Profile Icon</label>
              <div className="flex flex-wrap gap-2.5">
                {ICONS.map((iconName) => {
                  const IconComponent = ICON_MAP[iconName];
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => {
                        playSound('click');
                        setAvatarEmoji(iconName);
                      }}
                      className={`w-10 h-10 rounded-xl bg-white/5 border flex items-center justify-center transition-all duration-200 hover:bg-white/10 hover:scale-110 ${
                        avatarEmoji === iconName ? 'border-[#00E4FF] bg-[#00E4FF]/10 text-white' : 'border-white/10 text-white/60'
                      }`}
                    >
                      {IconComponent && <IconComponent size={20} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Kids Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-cyan-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold">Kids Profile</h4>
                  <p className="text-xs text-white/40 mt-0.5">Filter content automatically to show G/PG and family friendly content.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChild}
                  onChange={(e) => {
                    playSound('click');
                    setIsChild(e.target.checked);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00E4FF]" />
              </label>
            </div>

            {/* Age Restrictions (Shown if not kids mode) */}
            {!isChild && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex flex-col gap-2"
              >
                <label className="text-xs font-bold uppercase tracking-wider text-white/50">Maturity Level</label>
                <select
                  value={ageRating}
                  onChange={(e) => setAgeRating(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0d0d12] border border-white/10 text-white focus:outline-none focus:border-[#00E4FF] text-base"
                >
                  <option value="all">All content (G, PG, Family friendly)</option>
                  <option value="13+">Teens & Family (13+ and under)</option>
                  <option value="18+">Unrestricted Access (18+ and under)</option>
                </select>
              </motion.div>
            )}

            {/* 4-Digit PIN protection */}
            <div className="flex flex-col gap-4 p-4 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <Lock className="w-5 h-5 text-cyan-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold">Enable Profile lock PIN</h4>
                    <p className="text-xs text-white/40 mt-0.5">Require a 4-digit PIN to access this profile.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enablePin}
                    onChange={(e) => {
                      playSound('click');
                      setEnablePin(e.target.checked);
                      if (!e.target.checked) setPin('');
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00E4FF]" />
                </label>
              </div>

              {enablePin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex flex-col gap-2 relative mt-2"
                >
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      placeholder={isEditMode ? 'Leave blank to keep existing PIN' : 'Enter 4-digit PIN'}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      className="w-full px-4 py-3 rounded-xl bg-[#0d0d12] border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-[#00E4FF] tracking-wider text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors duration-150"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Bottom Actions Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 border-t border-white/5 pt-6">
              {/* Delete profile (Only shown in Edit mode) */}
              {isEditMode ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={profiles.length <= 1}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-150 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Profile</span>
                </button>
              ) : (
                <div />
              )}

              {/* Save / Cancel buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    navigate('/profiles');
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 hover:text-white text-white/60 transition-all duration-150 text-sm font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#00E4FF] hover:brightness-110 text-black transition-all duration-150 text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,228,255,0.25)]"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
