import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight, Play } from 'lucide-react';

const STUDIOS = [
  { 
    id: 'netflix', 
    name: 'Netflix', 
    logo: <img src="/logos/Netflix_icon.svg" className="h-10 md:h-12 w-auto object-contain" alt="Netflix" />,
    color: 'from-[#0f0000] to-[#0d0505]', 
    accent: '#E50914'
  },
  { 
    id: 'prime', 
    name: 'Amazon Prime Video', 
    logo: <img src="/logos/Amazon_Prime_Video_blue_logo_1.svg" className="h-8 md:h-10 w-auto object-contain" alt="Amazon Prime" />,
    color: 'from-[#000511] to-[#00102b]', 
    accent: '#00A8E1'
  },
  { 
    id: 'apple', 
    name: 'Apple TV+', 
    logo: <img src="/logos/Apple_TV_logo.svg" className="h-8 md:h-10 w-auto object-contain" alt="Apple TV" />,
    color: 'from-[#0a0a0a] to-[#1c1c1c]', 
    accent: '#FFFFFF'
  },
  { 
    id: 'hbo', 
    name: 'HBO Max', 
    logo: <img src="/logos/HBO_Max_(2025).svg" className="h-8 md:h-10 w-auto object-contain" alt="HBO Max" />,
    color: 'from-[#0c001f] to-[#1a003b]', 
    accent: '#9F7AEA'
  },
  { 
    id: 'hotstar', 
    name: 'JioHotstar', 
    logo: <img src="/logos/JioHotstar_2025.png" className="h-10 md:h-12 w-auto object-contain" alt="JioHotstar" />,
    color: 'from-[#020d1c] to-[#051a36]', 
    accent: '#FFCC00'
  },
  { 
    id: 'aha', 
    name: 'Aha', 
    logo: <img src="/logos/Aha_OTT_Logo.svg" className="h-8 md:h-10 w-auto object-contain" alt="Aha" />,
    color: 'from-[#2d0a00] to-[#521c00]', 
    accent: '#FF5722'
  },
  { 
    id: 'crunchyroll', 
    name: 'Crunchyroll', 
    logo: <img src="/logos/Cib-crunchyroll_(CoreUI_Icons_v1.0.0)_orange.svg" className="h-8 md:h-10 w-auto object-contain" alt="Crunchyroll" />,
    color: 'from-[#1c0e00] to-[#3d1f00]', 
    accent: '#FF9900'
  }
];

export function StudiosRail() {
  return (
    <div className="mb-12">
      <div className="mb-6 px-1">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
          Studios
        </h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Premium content from leading networks</p>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
        {STUDIOS.map((studio, index) => (
          <motion.div
            key={studio.id}
            className="min-w-[200px] md:min-w-[240px]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
          >
            <Link to={`/studio/${studio.id}`}>
              <motion.div
                className="group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer bg-slate-900 border border-white/5 shadow-xl hover:shadow-2xl transition-all"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                {/* Dark Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${studio.color}`} />
                
                {/* Studio Logo SVG */}
                <div className="absolute inset-0 flex items-center justify-center p-6 z-10 transition-transform duration-300 group-hover:scale-110">
                  <div className="bg-white p-3 rounded-xl flex items-center justify-center shadow-lg w-28 h-16 md:w-32 md:h-20 border border-white/10">
                    {studio.logo}
                  </div>
                </div>

                {/* Subtle Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
                  backgroundImage: `linear-gradient(${studio.accent} 1px, transparent 1px), linear-gradient(90deg, ${studio.accent} 1px, transparent 1px)`,
                  backgroundSize: '15px 15px',
                }} />

                {/* Ambient Glow Aura */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 blur-xl pointer-events-none"
                  style={{
                    background: `radial-gradient(circle, ${studio.accent} 0%, transparent 70%)`
                  }}
                />

                {/* Border Glow on Hover */}
                <motion.div
                  className="absolute inset-0 border-2 rounded-xl transition-all"
                  style={{
                    borderColor: 'transparent',
                  }}
                  whileHover={{
                    borderColor: `${studio.accent}80`,
                    boxShadow: `0 0 20px ${studio.accent}40`,
                  }}
                />
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function ComingSoonRail() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/movies/upcoming?limit=12`
        );
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setMovies(data.movies || []);
      } catch (e) {
        console.error('Failed to fetch upcoming movies:', e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchUpcoming();
  }, []);

  if (loading) {
    return (
      <div className="mb-12">
        <div className="mb-6 px-1">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
            Coming Soon
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="min-w-[160px] md:min-w-[200px] aspect-[2/3] rounded-xl bg-white/5 animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (error || movies.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="mb-6 px-1 flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
            Coming Soon
          </h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Upcoming releases · {new Date().getFullYear()}
          </p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
        {movies.map((movie, index) => (
          <motion.div
            key={movie.id || movie.tmdb_id || index}
            className="min-w-[160px] md:min-w-[200px] flex-shrink-0"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
          >
            <motion.div
              className="group relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer bg-gradient-to-br from-white/5 to-white/10"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              {/* Badge */}
              <div className="absolute top-3 left-3 z-10">
                <div className="px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[hsl(var(--primary))] to-purple-600 shadow-lg">
                  Coming Soon
                </div>
              </div>

              {movie.poster_url ? (
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                  <Play size={32} className="text-white/20" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-sm font-semibold line-clamp-2 text-white">{movie.title}</h3>
                {movie.release_date && (
                  <p className="text-xs text-white/60 mt-1 font-mono">
                    {new Date(movie.release_date + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'short', year: 'numeric',
                    })}
                  </p>
                )}
              </div>

              <motion.div
                className="absolute inset-0 border-2 border-white/0 group-hover:border-[hsl(var(--primary))]/60 rounded-xl transition-all"
                initial={false}
              />
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

