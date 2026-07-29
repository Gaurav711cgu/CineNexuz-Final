import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './auth';
import { profileAPI } from './api';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const { isSignedIn, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(() => {
    const saved = localStorage.getItem('active_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const fetchProfiles = useCallback(async () => {
    if (!isSignedIn) return;
    setLoadingProfiles(true);
    try {
      const res = await profileAPI.list();
      setProfiles(res.data.profiles || []);
    } catch (e) {
      console.error('[CineNexuz] Error fetching profiles:', e);
    } finally {
      setLoadingProfiles(false);
    }
  }, [isSignedIn]);

  // Fetch profiles on login
  useEffect(() => {
    if (isSignedIn) {
      fetchProfiles();
    } else {
      setProfiles([]);
      setActiveProfile(null);
      localStorage.removeItem('active_profile');
      localStorage.removeItem('profile_session_token');
    }
  }, [isSignedIn, fetchProfiles]);

  const selectProfile = useCallback((profile) => {
    if (!profile) {
      setActiveProfile(null);
      localStorage.removeItem('active_profile');
      localStorage.removeItem('profile_session_token');
      return;
    }

    setActiveProfile(profile);
    localStorage.setItem('active_profile', JSON.stringify(profile));
  }, []);

  const createProfile = useCallback(async (data) => {
    try {
      const res = await profileAPI.create(data);
      if (res.data.profile) {
        setProfiles((prev) => [...prev, res.data.profile]);
        return res.data.profile;
      }
    } catch (e) {
      console.error('[CineNexuz] Profile creation failed:', e);
      throw e;
    }
  }, []);

  const updateProfile = useCallback(async (id, data) => {
    try {
      const res = await profileAPI.update(id, data);
      if (res.data.profile) {
        setProfiles((prev) =>
          prev.map((p) => (p._id === id ? res.data.profile : p))
        );
        if (activeProfile && activeProfile._id === id) {
          selectProfile(res.data.profile);
        }
        return res.data.profile;
      }
    } catch (e) {
      console.error('[CineNexuz] Profile update failed:', e);
      throw e;
    }
  }, [activeProfile, selectProfile]);

  const deleteProfile = useCallback(async (id) => {
    try {
      await profileAPI.delete(id);
      setProfiles((prev) => prev.filter((p) => p._id !== id));
      if (activeProfile && activeProfile._id === id) {
        selectProfile(null);
      }
    } catch (e) {
      console.error('[CineNexuz] Profile deletion failed:', e);
      throw e;
    }
  }, [activeProfile, selectProfile]);

  const verifyPin = useCallback(async (id, pin) => {
    try {
      const res = await profileAPI.verifyPin(id, pin);
      if (res.data.valid && res.data.profile_token) {
        localStorage.setItem('profile_session_token', res.data.profile_token);
        // Find profile and select it
        const prof = profiles.find((p) => p._id === id);
        if (prof) {
          selectProfile(prof);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error('[CineNexuz] PIN verification failed:', e);
      throw e;
    }
  }, [profiles, selectProfile]);

  const clearActiveProfile = useCallback(() => {
    selectProfile(null);
  }, [selectProfile]);

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        activeProfile,
        loadingProfiles: loadingProfiles || authLoading,
        fetchProfiles,
        selectProfile,
        createProfile,
        updateProfile,
        deleteProfile,
        verifyPin,
        clearActiveProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
