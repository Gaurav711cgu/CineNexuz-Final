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
        className="group relative rounded-xl overflow-hidden glass-card cursor-pointer"
      >
        <div className="aspect-[2/3] overflow-hidden">
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1563089145-599997674d42?w=300&h=450&fit=crop';
            }}
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
            <div className="flex gap-2">
              <button className="p-2 rounded-full bg-[hsl(var(--primary))] text-white hover:brightness-110">
                <Play size={14} fill="white" />
              </button>
              <button className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20">
                <Plus size={14} />
              </button>
              {movie.in_theatres && (
                <button className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20">
                  <Ticket size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="p-3">
          <h3 className="text-sm font-semibold truncate">{movie.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              <Star size={12} className="text-yellow-500 fill-yellow-500" />
              <span className="text-xs text-[hsl(var(--muted-foreground))] tabular-nums">
                {movie.vote_average?.toFixed(1)}
              </span>
            </div>
            {movie.genres?.slice(0, 2).map(g => (
              <Badge key={g} variant="secondary" className="text-[10px] px-1.5 py-0">{g}</Badge>
            ))}
          </div>
          {showReason && movie.recommendation_reason && (
            <Badge className="mt-2 text-[10px] bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))] border-[hsl(var(--primary))]/30">
              {movie.recommendation_reason}
            </Badge>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

export function MovieCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden glass-card animate-pulse">
      <div className="aspect-[2/3] bg-white/5" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-white/5 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
      </div>
    </div>
  );
}

export function MovieRail({ title, subtitle, icon, movies, loading, showReason }) {
  return (
    <div className="mb-8">
      <div className="mb-4 px-1">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{subtitle}</p>
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
