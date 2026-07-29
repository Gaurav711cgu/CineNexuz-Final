import { createContext, useContext, useCallback } from 'react';

const SoundContext = createContext();

// Sound effect URLs (can be replaced with actual audio files)
const SOUNDS = {
  hover: '/sounds/hover.mp3',
  click: '/sounds/click.mp3',
  success: '/sounds/success.mp3',
  error: '/sounds/error.mp3',
  whoosh: '/sounds/whoosh.mp3',
  pop: '/sounds/pop.mp3',
};

export function SoundProvider({ children }) {
  const playSound = useCallback((soundName) => {
    try {
      // Check if sounds are enabled in localStorage
      const soundsEnabled = localStorage.getItem('soundsEnabled') !== 'false';
      if (!soundsEnabled) return;

      // Create and play audio
      const audio = new Audio(SOUNDS[soundName]);
      audio.volume = 0.3; // 30% volume
      audio.play().catch(() => {
        // Silently fail if audio can't play
      });
    } catch (error) {
      // Silently fail
    }
  }, []);

  const toggleSounds = useCallback(() => {
    const current = localStorage.getItem('soundsEnabled') !== 'false';
    localStorage.setItem('soundsEnabled', (!current).toString());
    return !current;
  }, []);

  const isSoundsEnabled = () => {
    return localStorage.getItem('soundsEnabled') !== 'false';
  };

  return (
    <SoundContext.Provider value={{ playSound, toggleSounds, isSoundsEnabled }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within SoundProvider');
  }
  return context;
}

// Hook for button clicks
export function useSoundClick() {
  const { playSound } = useSound();
  return () => playSound('click');
}

// Hook for hover effects
export function useSoundHover() {
  const { playSound } = useSound();
  return () => playSound('hover');
}

// Utility: Create silent audio files in public/sounds/
export const createPlaceholderSounds = () => {
  // This function would be run once to create placeholder sounds
  // In production, replace with actual sound files
  console.log('Add sound files to public/sounds/');
};
