import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, Plus, Star, Ticket } from 'lucide-react';
import { Badge } from './ui/badge';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';

export function MovieCard({ movie, showReason }) {
  const posterUrl = movie.poster_url
    ? (movie.poster_url.startsWith('http') ? movie.poster_url : `${TMDB_IMG}${movie.poster_url}`)
    : movie.poster_url_custom
      ? movie.poster_url_custom
      : movie.poster_path
        ? (movie.poster_path.startsWith('http') ? movie.poster_path : `${TMDB_IMG}${movie.poster_path}`)
        : 'https://images.unsplash.com/photo-1563089145-599997674d42?w=300&h=450&fit=crop';

  return (
    <Link to={`/movie/${movie._id}`} data-testid={`movie-card-${movie._id}`}>
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="group relative rounded-none overflow-hidden border border-white/10 bg-black cursor-pointer hover:border-white transition-colors"
      >
        <div className="aspect-[2/3] overflow-hidden">
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 filter grayscale hover:grayscale-0"
            loading="lazy"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1563089145-599997674d42?w=300&h=450&fit=crop';
            }}
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-4 border-[4px] border-transparent group-hover:border-[hsl(var(--primary))]">
            <div className="flex gap-2">
              <button className="p-3 rounded-none border border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-black hover:bg-transparent hover:text-[hsl(var(--primary))] transition-colors">
                <Play size={14} fill="currentColor" />
              </button>
              <button className="p-3 rounded-none border border-white bg-transparent text-white hover:bg-white hover:text-black transition-colors">
                <Plus size={14} />
              </button>
              {movie.in_theatres && (
                <button className="p-3 rounded-none border border-cyan-500 bg-transparent text-cyan-500 hover:bg-cyan-500 hover:text-black transition-colors">
                  <Ticket size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="p-3 border-t border-white/10 group-hover:bg-[hsl(var(--primary))] transition-colors">
          <h3 className="text-xs font-bold uppercase tracking-wide truncate group-hover:text-black">{movie.title}</h3>
          <div className="flex items-center gap-2 mt-2 font-mono text-[10px]">
            <div className="flex items-center gap-1 group-hover:text-black/70 text-white/50">
              <Star size={10} />
              <span>
                {movie.vote_average?.toFixed(1)}
              </span>
            </div>
            {movie.genres?.slice(0, 2).map(g => (
              <span key={g} className="px-1 border border-white/20 group-hover:border-black/20 group-hover:text-black">{g}</span>
            ))}
          </div>
          {showReason && movie.recommendation_reason && (
            <div className="mt-3 text-[9px] uppercase tracking-widest border-l-2 border-[hsl(var(--primary))] group-hover:border-black group-hover:text-black pl-2 py-0.5 text-[hsl(var(--primary))] font-bold">
              {movie.recommendation_reason}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

export function MovieCardSkeleton() {
  return (
    <div className="rounded-none overflow-hidden border border-white/10 bg-black animate-pulse">
      <div className="aspect-[2/3] bg-white/5" />
      <div className="p-3 space-y-2 border-t border-white/10">
        <div className="h-3 bg-white/10 w-3/4" />
        <div className="h-2 bg-white/10 w-1/2" />
      </div>
    </div>
  );
}

export function MovieRail({ title, subtitle, icon, movies, loading, showReason }) {
  return (
    <div className="mb-8">
      <div className="mb-6 px-1 border-l-4 border-[hsl(var(--primary))] pl-4">
        <div className="flex items-center gap-3">
          {icon && <span className="text-[hsl(var(--primary))]">{icon}</span>}
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest text-white">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="text-xs font-mono uppercase tracking-widest text-white/50 mt-1">{subtitle}</p>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 px-1">
        {loading
          ? Array(6).fill(0).map((_, i) => (
              <div key={i} className="min-w-[160px] md:min-w-[180px]">
                <MovieCardSkeleton />
              </div>
            ))
          : movies?.map(movie => (
              <div key={movie._id} className="min-w-[160px] md:min-w-[180px]">
                <MovieCard movie={movie} showReason={showReason} />
              </div>
            ))
        }
      </div>
    </div>
  );
}
