import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './ui/Logo';

export default function SplashScreen({ onComplete }) {
  const [show, setShow] = useState(true);
  const [stage, setStage] = useState('intro'); // intro -> expand -> lift -> done

  useEffect(() => {
    // Check if splash was shown in this session
    const splashShown = sessionStorage.getItem('splashShown');
    if (splashShown) {
      setShow(false);
      onComplete();
      return;
    }

    // Play ta-dum sound
    const audio = new Audio();
    // Create ta-dum sound effect (can be replaced with actual file)
    try {
      // Placeholder - in production, use actual Netflix ta-dum sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(196, audioContext.currentTime); // G
      oscillator.frequency.setValueAtTime(262, audioContext.currentTime + 0.3); // C
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1.5);
    } catch (err) {
      // Silent fail if audio context not supported
    }

    // Animation sequence
    const expandTimer = setTimeout(() => setStage('expand'), 800);
    const liftTimer = setTimeout(() => setStage('lift'), 2500);
    const completeTimer = setTimeout(() => {
      sessionStorage.setItem('splashShown', 'true');
      setShow(false);
      setTimeout(onComplete, 300);
    }, 3500);

    return () => {
      clearTimeout(expandTimer);
      clearTimeout(liftTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] overflow-hidden"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Stage 1 & 2: Intro + Expand (Black → Cyan screen) */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ backgroundColor: '#000000' }}
          animate={{
            backgroundColor: stage === 'expand' ? '#00E4FF' : '#000000',
          }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          {/* Logo Container */}
          <motion.div
            className="relative flex items-center justify-center"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{
              scale: stage === 'intro' ? 1 : stage === 'expand' ? 15 : 15,
              opacity: stage === 'intro' ? 1 : stage === 'expand' ? 1 : 0,
            }}
            transition={{
              scale: { duration: 1.5, ease: [0.6, 0.01, 0.05, 0.95] },
              opacity: { duration: 0.3 },
            }}
          >
            {/* Glowing Circle Background */}
            <motion.div
              className="absolute w-32 h-32 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(0,228,255,0.3) 0%, transparent 70%)',
              }}
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Logo */}
            <div className="relative w-28 h-28 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-[0_0_60px_rgba(0,228,255,0.4)]">
              <Logo size={64} glow={true} />
            </div>
          </motion.div>

          {/* Brand Name (appears during intro) */}
          {stage === 'intro' && (
            <motion.div
              className="absolute"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 80 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <h1
                className="text-5xl font-bold tracking-tight text-white"
                style={{ fontFamily: 'Space Grotesk' }}
              >
                CineNexus
              </h1>
            </motion.div>
          )}
        </motion.div>

        {/* Stage 3: Lift Effect (Screen slides up to reveal app) */}
        {stage === 'lift' && (
          <motion.div
            className="absolute inset-0 bg-[#00E4FF]"
            initial={{ y: 0 }}
            animate={{ y: '-100%' }}
            transition={{
              duration: 1,
              ease: [0.6, 0.01, 0.05, 0.95], // Netflix easing curve
            }}
            style={{
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Bottom shadow during lift */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/30 to-transparent" />
          </motion.div>
        )}

        {/* Subtle particles during expand */}
        {stage === 'expand' && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  x: (Math.random() - 0.5) * 200,
                  y: (Math.random() - 0.5) * 200,
                }}
                transition={{
                  duration: 1.5,
                  delay: Math.random() * 0.5,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>
        )}

        {/* Skip button (appears after 1 second) */}
        {stage === 'intro' && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={() => {
              sessionStorage.setItem('splashShown', 'true');
              setShow(false);
              setTimeout(onComplete, 100);
            }}
            className="absolute bottom-8 right-8 z-50 text-xs text-white/60 hover:text-white transition-colors"
          >
            Skip intro
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

