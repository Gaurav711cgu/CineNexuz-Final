import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Ghost, Target, Shield, Flame, Star, Wine, Film, Castle, Clock } from 'lucide-react';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342';

const THEME_ICONS = {
  magical: Sparkles,
  horror: Ghost,
  action: Zap,
  superhero: Shield,
  fantasy: Star,
  scifi: Target,
  spy: Wine,
  anime: Film,
  family: Castle,
  nostalgia: Clock,
};

const THEME_COLORS = {
  magical: 'from-purple-600 to-pink-600',
  horror: 'from-red-900 to-black',
  action: 'from-orange-600 to-red-600',
  superhero: 'from-blue-600 to-purple-600',
  fantasy: 'from-green-600 to-emerald-600',
  scifi: 'from-cyan-600 to-blue-600',
  spy: 'from-gray-700 to-black',
  anime: 'from-pink-500 to-purple-500',
  family: 'from-yellow-500 to-orange-500',
  nostalgia: 'from-amber-600 to-yellow-600',
};

export function CollectionRail({ collection, movies, loading, onMovieHover }) {
  const Icon = THEME_ICONS[collection.theme] || Sparkles;
  const gradient = THEME_COLORS[collection.theme] || 'from-purple-600 to-blue-600';

  if (loading || !movies || movies.length === 0) return null;

  return (
    <div className="mb-10">
      {/* Collection Header - Minimalist OTT style */}
      <div className="mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 rounded-sm bg-[hsl(var(--primary))]" />
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
            {collection.name}
          </h2>
          {collection.description && (
            <span className="text-xs text-[hsl(var(--muted-foreground))] hidden sm:inline ml-2">
              · {collection.description}
            </span>
          )}
        </div>
        {collection.description && (
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 sm:hidden ml-3.5">
            {collection.description}
          </p>
        )}
      </div>

      {/* Movies Rail */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 px-1">
        {movies.map((movie, index) => (
          <motion.div
            key={movie._id}
            className="min-w-[180px] md:min-w-[200px]"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
          >
            <Link to={`/movie/${movie._id}`}>
              <div
                className="group cursor-pointer relative"
                onMouseEnter={() => onMovieHover && onMovieHover(movie)}
              >
                {/* Poster */}
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5">
                  {(movie.poster_url || movie.poster_path) ? (
                    <motion.img
                      src={movie.poster_url 
                        ? (movie.poster_url.startsWith('http') ? movie.poster_url : `${TMDB_IMG}${movie.poster_url}`)
                        : `${TMDB_IMG}${movie.poster_path}`
                      }
                      alt={movie.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      whileHover={{ scale: 1.05 }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5">
                      <Film size={40} className="text-white/40" />
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Collection Badge */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className={`px-2 py-1 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${gradient}`}>
                      {collection.theme.toUpperCase()}
                    </div>
                  </div>

                  {/* Play Button Overlay */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={false}
                  >
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent ml-1" />
                    </div>
                  </motion.div>
                </div>

                {/* Title */}
                <h3 className="mt-2 text-sm font-medium line-clamp-2 group-hover:text-[hsl(var(--primary))] transition-colors">
                  {movie.title}
                </h3>
                
                {/* Year & Rating */}
                {(movie.release_date || movie.vote_average > 0) && (
                  <div className="flex items-center gap-2 mt-1">
                    {movie.release_date && (
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        {new Date(movie.release_date).getFullYear()}
                      </span>
                    )}
                    {movie.vote_average > 0 && (
                      <span className="text-xs text-yellow-500 flex items-center gap-1">
                        <Star size={12} className="fill-amber-500 stroke-amber-500 inline-block align-middle" />
                        <span>{movie.vote_average.toFixed(1)}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
