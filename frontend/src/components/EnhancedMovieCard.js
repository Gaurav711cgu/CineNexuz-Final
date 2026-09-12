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
        <div className="relative aspect-[2/3] rounded-none overflow-hidden border border-white/20 bg-black group-hover:border-white transition-colors">
          {/* Poster Image */}
          {(movie.poster_url || movie.poster_path) ? (
            <img
              src={movie.poster_url 
                ? (movie.poster_url.startsWith('http') ? movie.poster_url : `${TMDB_IMG}${movie.poster_url}`)
                : `${TMDB_IMG}${movie.poster_path}`
              }
              alt={movie.title}
              className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1563089145-599997674d42?w=300&h=450&fit=crop';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-black border border-white/10">
              <Play size={32} className="text-white/20" />
            </div>
          )}

          {/* Brutalist Hard Shadow Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-[4px] border-transparent group-hover:border-[hsl(var(--primary))]" />

          {/* Preview State (after 5s hover) */}
          {showPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-[hsl(var(--primary))] flex items-center justify-center border-4 border-black"
            >
              <div className="text-center mix-blend-difference text-white">
                <Play size={40} className="mx-auto mb-2" fill="currentColor" />
                <p className="text-xs font-bold uppercase tracking-widest font-mono">[ Preview ]</p>
              </div>
            </motion.div>
          )}

          {/* Info Overlay on Hover */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-black/90 border-t border-[hsl(var(--primary))]"
            initial={false}
          >
            <div className="flex items-center justify-between mb-3 font-mono text-[10px] tracking-widest text-[hsl(var(--primary))]">
              {movie.vote_average > 0 && (
                <span>{movie.vote_average.toFixed(1)} RTG</span>
              )}
              {movie.release_date && (
                <span>
                  {new Date(movie.release_date).getFullYear()}
                </span>
              )}
            </div>
            
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 font-mono text-[9px] uppercase">
                {movie.genres.slice(0, 2).map((genre) => (
                  <span key={genre} className="border border-white/30 px-1 py-0.5 text-white">
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </motion.div>

          {/* Hover Progress Bar */}
          {isHovered && showTrailer && !showPreview && (
            <motion.div
              className="absolute top-0 left-0 right-0 h-1 bg-white/20"
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
        <h3 className="mt-3 text-[11px] font-bold uppercase tracking-wider line-clamp-2 group-hover:text-[hsl(var(--primary))] transition-colors">
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
