import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Star, Info } from 'lucide-react';
import { Badge } from './ui/badge';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342';
const TMDB_BACKDROP = 'https://image.tmdb.org/t/p/original';

export function EnhancedMovieCard({ movie, onHover, onHoverEnd, showTrailer = true }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const hoverTimeoutRef = useRef(null);

  useEffect(() => {
    if (isHovered && showTrailer) {
      // Start preview after 5 seconds of hover
      hoverTimeoutRef.current = setTimeout(() => {
        setShowPreview(true);
      }, 5000);
    } else {
      setShowPreview(false);
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    }

    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [isHovered, showTrailer]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (onHover) {
      onHover(movie);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowPreview(false);
    if (onHoverEnd) {
      onHoverEnd();
    }
  };

  return (
    <motion.div
      className="group cursor-pointer relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      transition={{ duration: 0.3 }}
      data-testid={`movie-card-${movie._id}`}
    >
      <Link to={`/movie/${movie._id}`}>
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5">
          {/* Poster Image */}
          {(movie.poster_url || movie.poster_path) ? (
            <img
              src={movie.poster_url 
                ? (movie.poster_url.startsWith('http') ? movie.poster_url : `${TMDB_IMG}${movie.poster_url}`)
                : `${TMDB_IMG}${movie.poster_path}`
              }
              alt={movie.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1563089145-599997674d42?w=300&h=450&fit=crop';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5">
              <Play size={32} className="text-[hsl(var(--muted-foreground))]" />
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Preview State (after 5s hover) */}
          {showPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/80 flex items-center justify-center"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="w-16 h-16 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center mx-auto mb-3 shadow-[0_0_30px_rgba(0,228,255,0.6)]"
                >
                  <Play size={28} className="text-white ml-1" fill="white" />
                </motion.div>
                <p className="text-sm text-white font-medium">Watch Trailer</p>
              </div>
            </motion.div>
          )}

          {/* Info Overlay on Hover */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
            initial={false}
          >
            <div className="flex items-center gap-2 mb-2">
              {movie.vote_average > 0 && (
                <div className="flex items-center gap-1 text-xs text-yellow-400">
                  <Star size={12} fill="currentColor" />
                  <span className="font-semibold">{movie.vote_average.toFixed(1)}</span>
                </div>
              )}
              {movie.release_date && (
                <span className="text-xs text-white/70">
                  {new Date(movie.release_date).getFullYear()}
                </span>
              )}
            </div>
            
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {movie.genres.slice(0, 2).map((genre) => (
                  <Badge
                    key={genre}
                    className="text-[10px] px-1.5 py-0.5 bg-white/10 text-white border-white/20"
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            )}
          </motion.div>

          {/* Hover Progress Bar (shows trailer countdown) */}
          {isHovered && showTrailer && !showPreview && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-1 bg-white/20"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 5, ease: "linear" }}
              style={{ transformOrigin: "left" }}
            >
              <div className="h-full bg-[hsl(var(--primary))] w-full" />
            </motion.div>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-2 text-sm font-medium line-clamp-2 group-hover:text-[hsl(var(--primary))] transition-colors">
          {movie.title}
        </h3>
      </Link>
    </motion.div>
  );
}

export function EnhancedMovieRail({ title, genre, movies, loading, onMovieHover, onHoverEnd }) {
  return (
    <div 
      className="mb-8 scroll-mt-20" 
      data-genre={genre}
      onMouseEnter={() => onMovieHover && onMovieHover(null, genre)}
    >
      <div className="mb-4 px-1">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
          {title}
        </h2>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 px-1">
        {loading
          ? Array(6).fill(0).map((_, i) => (
              <div key={i} className="min-w-[160px] md:min-w-[180px]">
                <div className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse" />
              </div>
            ))
          : movies?.map(movie => (
              <div key={movie._id} className="min-w-[160px] md:min-w-[180px]">
                <EnhancedMovieCard 
                  movie={movie} 
                  onHover={(m) => onMovieHover && onMovieHover(m, genre)}
                  onHoverEnd={onHoverEnd}
                />
              </div>
            ))
        }
      </div>
    </div>
  );
}
