import { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BackendStatusContext = createContext({ status: 'unknown', groqReady: false, cfTrained: false });

const TRIVIA = [
  "In Interstellar, the giant dust clouds were created using cardboard dust blown by fans.",
  "In The Dark Knight, Heath Ledger improvised the sarcastic applause Joker does during Gordon's promotion.",
  "The iconic Matrix digital rain code was actually made of Japanese sushi recipes.",
  "The CGI in Avatar took so long to render that some scenes required 1.5 million gigabytes of storage.",
  "In Pulp Fiction, the band-aid on Marsellus Wallace's neck was actually covering a real cut.",
  "For Inception, Christopher Nolan chose to build rotating corridors and giant tilting sets instead of using CGI.",
  "The screech of the T-Rex in Jurassic Park was created by combining the sounds of a baby elephant, a tiger, and an alligator."
];

export function BackendWakeupProvider({ children }) {
  const [status, setStatus] = useState('checking'); // checking | warming | ready
  const [groqReady, setGroqReady] = useState(false);
  const [cfTrained, setCfTrained] = useState(false);
  const [triviaIndex, setTriviaIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let retryTimer = null;

    const ping = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/health`,
          { signal: controller.signal }
        );
        clearTimeout(timeout);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setStatus('ready');
          setGroqReady(data.groq_configured || false);
          setCfTrained(data.cf_trained || false);
        }
      } catch (e) {
        if (!cancelled) {
          setStatus('warming');
          retryTimer = setTimeout(ping, 4000);
        }
      }
    };

    ping();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  // Rotate trivia every 5 seconds
  useEffect(() => {
    if (status !== 'warming' && status !== 'checking') return;
    const interval = setInterval(() => {
      setTriviaIndex(prev => (prev + 1) % TRIVIA.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [status]);

  return (
    <BackendStatusContext.Provider value={{ status, groqReady, cfTrained }}>
      <AnimatePresence mode="wait">
        {(status === 'checking' || status === 'warming') ? (
          <motion.div
            key="wakeup-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="fixed inset-0 z-[9999] bg-[#0A0A0C] flex flex-col items-center justify-center p-6 text-center select-none"
          >
            {/* Visual ambient backdrop glow */}
            <div className="absolute inset-0 bg-radial-glow opacity-20 pointer-events-none" />

            <div className="max-w-md w-full relative z-10 space-y-8">
              {/* CineNexuz Logo */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl font-extrabold tracking-wider bg-gradient-to-r from-violet-400 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent filter drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                  CINENEXUZ
                </span>
                <span className="text-xs uppercase tracking-[0.25em] text-violet-400/80 font-semibold font-mono">
                  Cinema AI Engine
                </span>
              </div>

              {/* Status & Loader */}
              <div className="space-y-4">
                <p className="text-lg font-medium text-white/95" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Initializing CineNexuz Cinematic Engine...
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] px-4 leading-relaxed">
                  Connecting to our secure cinematic clusters. Fetching personalized vector recommendations and dynamic assets.
                </p>

                {/* Shimmer loading bar */}
                <div className="w-full h-[6px] bg-white/5 rounded-full overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 rounded-full animate-shimmer-fast" style={{ width: '80%' }} />
                </div>
              </div>

              {/* Trivia Block */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
                <span className="absolute top-2 left-4 text-[9px] uppercase tracking-widest text-violet-400 font-mono">
                  Movie Trivia
                </span>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={triviaIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="text-sm italic text-white/70 leading-relaxed pt-2"
                  >
                    "{TRIVIA[triviaIndex]}"
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {children}
    </BackendStatusContext.Provider>
  );
}

export function useBackendStatus() {
  return useContext(BackendStatusContext);
}
