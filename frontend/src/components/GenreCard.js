import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

/**
 * Netflix-style Genre Card
 * - No emojis
 * - Cinematic gradient backgrounds
 * - Typography-focused with movie count
 * - Glassmorphism effects
 */

const GENRE_GRADIENTS = {
  'Action': 'from-red-950 via-orange-950 to-amber-950',
  'Adventure': 'from-emerald-950 via-green-900 to-teal-950',
  'Animation': 'from-purple-950 via-pink-900 to-rose-950',
  'Comedy': 'from-yellow-950 via-amber-900 to-orange-950',
  'Crime': 'from-gray-900 via-slate-900 to-zinc-950',
  'Documentary': 'from-teal-950 via-cyan-900 to-sky-950',
  'Drama': 'from-indigo-950 via-purple-900 to-violet-950',
  'Family': 'from-amber-950 via-yellow-900 to-lime-950',
  'Fantasy': 'from-purple-950 via-fuchsia-900 to-pink-950',
  'History': 'from-amber-950 via-orange-900 to-red-950',
  'Horror': 'from-black via-red-950 to-orange-950',
  'Music': 'from-pink-950 via-purple-900 to-indigo-950',
  'Mystery': 'from-indigo-950 via-purple-950 to-violet-950',
  'Romance': 'from-pink-950 via-rose-900 to-red-950',
  'Science Fiction': 'from-blue-950 via-cyan-900 to-teal-950',
  'TV Movie': 'from-slate-900 via-gray-900 to-zinc-950',
  'Thriller': 'from-gray-950 via-slate-900 to-zinc-950',
  'War': 'from-red-950 via-orange-950 to-amber-950',
  'Western': 'from-orange-950 via-amber-900 to-yellow-950',
};

const GENRE_IMAGES = {
  'Action': 'https://image.tmdb.org/t/p/w500/xPNDRM50a58uvv1il2GVZrtWjkZ.jpg', // Mission: Impossible
  'Adventure': 'https://image.tmdb.org/t/p/w500/2u7zbn8EudG6kLlBzUYqP8RyFU4.jpg', // Lord of the Rings
  'Animation': 'https://image.tmdb.org/t/p/w500/p5ozvmdgsmbWe0H8Xk7Rc8SCwAB.jpg', // Inside Out
  'Comedy': 'https://image.tmdb.org/t/p/w500/9XhZhoSnFJ3AjpfzdIiZVHLQIS4.jpg', // Kung Fu Hustle
  'Crime': 'https://image.tmdb.org/t/p/w500/tSPT36ZKlP2WVHJLM4cQPLSzv3b.jpg', // The Godfather
  'Drama': 'https://image.tmdb.org/t/p/w500/neeNHeXjMF5fXoCJRsOmkNGC7q.jpg', // Oppenheimer
  'Fantasy': 'https://image.tmdb.org/t/p/w500/1stUIsjawROZxjiCMtqqXqgfZWC.jpg', // Harry Potter
  'Horror': 'https://image.tmdb.org/t/p/w500/i8MupUe4xgmYXoRNAQMYvuoexSU.jpg', // The Conjuring
  'Science Fiction': 'https://image.tmdb.org/t/p/w500/2ssWTSVklAEc98frZUQhgtGHx7s.jpg', // Interstellar
  'Thriller': 'https://image.tmdb.org/t/p/w500/cfT29Im5VDvjE0RpyKOSdCKZal7.jpg', // The Dark Knight
  'Romance': 'https://image.tmdb.org/t/p/w500/xnHVX37XZEp33hhCbYlQFq7ux1J.jpg', // Titanic
  'Family': 'https://image.tmdb.org/t/p/w500/3Rfvhy1Nl6sSGJwyjb0QiZzZYlB.jpg', // Toy Story
  'History': 'https://image.tmdb.org/t/p/w500/zb6fM1CX41D9rF9hdgclu0peUmy.jpg', // Schindler's List
  'War': 'https://image.tmdb.org/t/p/w500/jhk6D8pim3yaByu1801kMoxXFaX.jpg', // Gladiator
  'Western': 'https://image.tmdb.org/t/p/w500/rvRGFevvZK48onX0PYI1eQLbuJd.jpg', // Unforgiven
  'Music': 'https://image.tmdb.org/t/p/w500/wbQa0EnWUyRzQ5d1pHLNRlmsCUP.jpg', // Whiplash
  'Mystery': 'https://image.tmdb.org/t/p/w500/7Wev9JMo6R5XAfz2KDvXb7oPMmy.jpg', // Memento
};

export function GenreCard({ genre, count, className = '' }) {
  const genreObj = typeof genre === 'string' ? { name: genre } : genre;
  const { name, backdrop_path, poster_path } = genreObj;
  const gradient = GENRE_GRADIENTS[name] || 'from-gray-900 via-slate-800 to-zinc-950';
  
  // Prioritize dynamic TMDB backdrop from the database first, fallback to hardcoded ones, and then to a premium ambient cinema backdrop
  const DEFAULT_BACKDROP = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500';
  const dynamicBackdrop = backdrop_path || poster_path;
  const bgImage = dynamicBackdrop 
    ? `https://image.tmdb.org/t/p/w500${dynamicBackdrop}`
    : (GENRE_IMAGES[name] || DEFAULT_BACKDROP);



  return (
    <Link to={`/genre/${encodeURIComponent(name)}`} data-testid={`genre-card-${name.replace(/\s+/g, '-')}`}>
      <motion.div
        whileHover={{ scale: 1.03, y: -4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradient} 
          shadow-lg hover:shadow-2xl transition-all duration-300 group border border-white/5 ${className}`}
        style={{ minHeight: '200px' }}
      >
        {/* Background Movie Poster/Backdrop Image with absolute cover */}
        {bgImage && (
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img
              src={bgImage}
              alt=""
              className="w-full h-full object-cover opacity-30 group-hover:opacity-45 group-hover:scale-105 transition-all duration-500"
              loading="lazy"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            {/* Deep soft overlay gradient for ultimate readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          </div>
        )}

        {/* Noise texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay z-10"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
          }}
        />

        {/* Radial glow */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl 
          group-hover:bg-white/10 transition-all duration-500 z-10" />

        {/* Gradient shimmer */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 
          opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

        {/* Content */}
        <div className="relative p-6 h-full flex flex-col justify-between z-20">
          {/* Movie count badge */}
          <div className="flex justify-end">
            <div className="px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-lg">
              <span className="text-sm font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>
                {count}
              </span>
            </div>
          </div>

          {/* Genre name */}
          <div>
            <h3 className="text-4xl font-extrabold text-white mb-3 leading-tight tracking-tight drop-shadow-md" 
                style={{ fontFamily: 'Space Grotesk' }}>
              {name}
            </h3>
            <div className="flex items-center gap-2 text-white/80 group-hover:text-white 
              group-hover:gap-3 transition-all duration-200">
              <span className="text-sm font-semibold uppercase tracking-wide" style={{ fontFamily: 'Space Grotesk' }}>
                Explore
              </span>
              <ArrowRight 
                size={18} 
                className="group-hover:translate-x-1 transition-transform duration-200" 
                strokeWidth={2.5}
              />
            </div>
          </div>
        </div>

        {/* Bottom shadow vignette */}
        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/50 via-black/20 to-transparent 
          pointer-events-none z-10" />
      </motion.div>
    </Link>
  );
}
