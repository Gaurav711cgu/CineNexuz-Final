import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, Info } from 'lucide-react';
import { Button } from './ui/button';

const TMDB_IMG = 'https://image.tmdb.org/t/p/original'; // Higher quality images

// Solid, vivid fill colors per rank position
const RANK_FILL = [
  '#FFD700', // 1 — Gold
  '#C8D6E5', // 2 — Silver
  '#CD7F32', // 3 — Bronze
  '#00F3FF', // 4 — Neon Cyan
  '#00F3FF', // 5 — Neon Cyan
  '#00F3FF', // 6 — Neon Cyan
  '#00F3FF', // 7 — Neon Cyan
  '#00F3FF', // 8 — Neon Cyan
  '#00F3FF', // 9 — Neon Cyan
  '#00F3FF', // 10 — Neon Cyan
];

// Matching stroke / glow colour per rank
const RANK_STROKE = [
  'rgba(255,215,0,0.8)',
  'rgba(200,214,229,0.8)',
  'rgba(205,127,50,0.8)',
  'rgba(0,243,255,0.7)',
  'rgba(0,243,255,0.7)',
  'rgba(0,243,255,0.7)',
  'rgba(0,243,255,0.7)',
  'rgba(0,243,255,0.7)',
  'rgba(0,243,255,0.7)',
  'rgba(0,243,255,0.7)',
];

const RANK_GRADIENTS = [
  'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', // Gold
  'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)', // Silver
  'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)', // Bronze
  'linear-gradient(135deg, #00F3FF 0%, #007DFF 100%)', // Neon Cyan-Blue
];

export function Top10Card({ movie, rank, onHover }) {
  const gradient = RANK_GRADIENTS[Math.min(rank - 1, 3)];
  const fillColor  = RANK_FILL[Math.min(rank - 1, 9)];
  const strokeColor = RANK_STROKE[Math.min(rank - 1, 9)];

  return (
    <motion.div
      className="group relative cursor-pointer"
      whileHover={{ scale: 1.05, zIndex: 10 }}
      onMouseEnter={() => onHover && onHover(movie)}
      data-testid={`top10-card-${rank}`}
    >
      <Link to={`/movie/${movie._id}`}>
        <div className="flex items-center gap-3">
          {/* Rank Number — solid vivid colour */}
          <motion.div
            className="relative flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div
              className="text-[80px] md:text-[100px] font-black leading-none select-none"
              style={{
                color: fillColor,
                WebkitTextStroke: `1.5px ${strokeColor}`,
                fontFamily: 'Space Grotesk, sans-serif',
                textShadow: `0 0 16px ${strokeColor}, 0 4px 10px rgba(0,0,0,0.85)`,
                letterSpacing: '0px',
              }}
            >
              {rank}
            </div>

            {/* Subtle rank glow behind the number */}
            <motion.div
              className="absolute inset-0 blur-2xl opacity-30 -z-10"
              style={{ background: gradient }}
              animate={{ opacity: [0.2, 0.45, 0.2] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          </motion.div>

          {/* Movie Card */}
          <div className="flex-1 min-w-0">
            <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-white/5">
              {movie.backdrop_path ? (
                <img
                  src={`${TMDB_IMG}${movie.backdrop_path}`}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&h=281&fit=crop';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5">
                  <Play size={40} className="text-[hsl(var(--muted-foreground))]" />
                </div>
              )}
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Rank Badge */}
              <div className="absolute top-2 right-2">
                <div
                  className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg"
                  style={{ background: gradient }}
                >
                  #{rank}
                </div>
              </div>

              {/* Hover Info */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
                initial={false}
              >
                <h3 className="text-lg font-semibold mb-2 line-clamp-1">{movie.title}</h3>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    className="bg-white hover:bg-white/90 text-black gap-2"
                    data-testid={`top10-play-${rank}`}
                  >
                    <Play size={14} fill="currentColor" /> Play
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white/10 border-white/20 hover:bg-white/20 gap-2"
                  >
                    <Info size={14} /> Info
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function Top10Rail({ movies, loading, onMovieHover }) {
  if (loading || !movies || movies.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="mb-6 px-1">
        <div className="flex items-center gap-3">
          <motion.div
            className="text-5xl font-black"
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: 'Space Grotesk',
            }}
            animate={{
              textShadow: [
                '0 0 10px rgba(255,215,0,0.3)',
                '0 0 20px rgba(255,215,0,0.6)',
                '0 0 10px rgba(255,215,0,0.3)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            TOP 10
          </motion.div>
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
              Movies in Your Region
            </h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Most watched this week</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {movies.slice(0, 10).map((movie) => (
          <motion.div
            key={movie._id}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: (movie.rank - 1) * 0.05 }}
          >
            <Top10Card 
              movie={movie} 
              rank={movie.rank}
              onHover={onMovieHover}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
