import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';

export function ContinueWatchingCard({ movie, onHover }) {
  const progress = movie.progress || 0;

  return (
    <motion.div
      className="group cursor-pointer relative"
      whileHover={{ scale: 1.05, zIndex: 10 }}
      onMouseEnter={() => onHover && onHover(movie)}
      data-testid={`continue-watching-${movie._id}`}
    >
      <Link to={`/movie/${movie._id}`}>
        <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-white/5">
          {/* Backdrop Image */}
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

          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <motion.div
              className="h-full bg-[hsl(var(--primary))]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-end justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold line-clamp-1 mb-1">{movie.title}</h3>
                <p className="text-xs text-white/70">{Math.round(progress)}% watched</p>
              </div>
              
              {/* Play Button - Shows on Hover */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileHover={{ opacity: 1, scale: 1 }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Button
                  size="sm"
                  className="bg-white hover:bg-white/90 text-black gap-1"
                  data-testid={`continue-play-${movie._id}`}
                >
                  <RotateCcw size={14} />
                  Resume
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Circular Progress Indicator */}
          <div className="absolute top-3 right-3">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="3"
                fill="none"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ContinueWatchingRail({ movies, loading, onMovieHover }) {
  if (loading || !movies || movies.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="mb-4 px-1">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
          Continue Watching
        </h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Pick up where you left off</p>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 px-1">
        {movies.map((movie) => (
          <div key={movie._id} className="min-w-[300px] md:min-w-[350px]">
            <ContinueWatchingCard movie={movie} onHover={onMovieHover} />
          </div>
        ))}
      </div>
    </div>
  );
}
