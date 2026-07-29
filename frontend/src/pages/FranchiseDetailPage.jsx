import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Film, Star, Calendar } from 'lucide-react';
import { useCollection } from '../lib/useCollection';
import { useSimilarMovies } from '../lib/useSimilarMovies';
import FranchiseSection from '../components/FranchiseSection';
import SimilarMoviesSection from '../components/SimilarMoviesSection';

const TMDB_ORIG = 'https://image.tmdb.org/t/p/original';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';

function getBackdrop(c) {
  if (!c?.backdrop_path) return null;
  if (c.backdrop_path.startsWith('http')) return c.backdrop_path;
  return `${TMDB_ORIG}${c.backdrop_path}`;
}
function getPoster(c) {
  if (!c?.poster_path) return null;
  if (c.poster_path.startsWith('http')) return c.poster_path;
  return `${TMDB_IMG}${c.poster_path}`;
}

export default function FranchiseDetailPage() {
  const { id } = useParams();
  const { data: collection, loading, error } = useCollection(id);

  // Use first part's movie_id for similar movies context (optional)
  const firstPartId = collection?.parts?.[0]?.movie_id;
  const { franchiseParts, similarMovies, loading: simLoading } = useSimilarMovies(firstPartId);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white/60 gap-4">
        <Film size={48} className="opacity-30" />
        <p className="text-lg font-medium">Franchise not found</p>
        <Link to="/franchises" className="text-sm text-cyan-400 hover:underline">
          ← Back to Franchises
        </Link>
      </div>
    );
  }

  const backdrop = getBackdrop(collection);
  const poster = getPoster(collection);
  const parts = collection?.parts || [];
  const avgRating = parts.length > 0
    ? (parts.reduce((sum, p) => sum + (p.vote_average || 0), 0) / parts.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen">
      {/* Hero backdrop */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        {backdrop ? (
          <img
            src={backdrop}
            alt={collection?.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/60 to-transparent" />

        {/* Back button */}
        <Link
          to="/franchises"
          className="absolute top-4 left-4 md:left-8 flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          Franchises
        </Link>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-20 relative z-10 pb-12">
        <div className="flex gap-6 items-end mb-8">
          {/* Poster */}
          {poster && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="hidden sm:block flex-shrink-0 w-32 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10"
            >
              <img src={poster} alt={collection?.name} className="w-full aspect-[2/3] object-cover" />
            </motion.div>
          )}

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 min-w-0"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400/80 mb-1">
              Franchise
            </p>
            <h1
              className="text-2xl md:text-4xl font-bold text-white leading-tight mb-2"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              {loading ? (
                <span className="inline-block w-64 h-8 bg-white/10 rounded animate-pulse" />
              ) : (
                collection?.name
              )}
            </h1>

            {/* Stats row */}
            {!loading && (
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                {parts.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Film size={13} className="text-cyan-400" />
                    {parts.length} Films
                  </span>
                )}
                {avgRating && (
                  <span className="flex items-center gap-1.5">
                    <Star size={13} className="text-yellow-400 fill-yellow-400" />
                    {avgRating} avg
                  </span>
                )}
                {parts[0]?.release_date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-purple-400" />
                    Since {parts[0].release_date.slice(0, 4)}
                  </span>
                )}
              </div>
            )}

            {!loading && collection?.overview && (
              <p className="mt-3 text-sm text-white/60 max-w-2xl leading-relaxed line-clamp-3">
                {collection.overview}
              </p>
            )}
          </motion.div>
        </div>

        {/* Franchise Timeline */}
        <FranchiseSection
          collection={collection}
          currentMovieId={null}
          loading={loading}
        />

        {/* Similar Movies */}
        {firstPartId && (
          <SimilarMoviesSection
            franchiseParts={franchiseParts}
            similarMovies={similarMovies}
            loading={simLoading}
          />
        )}
      </div>
    </div>
  );
}
