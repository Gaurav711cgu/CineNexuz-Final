import { Link } from 'react-router-dom';
import { Film, Star } from 'lucide-react';
import ContentRail from './ContentRail';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';

function getPoster(movie) {
  if (movie.poster_path?.startsWith('http')) return movie.poster_path;
  if (movie.poster_path) return `${TMDB_IMG}${movie.poster_path}`;
  return null;
}

/**
 * FranchiseSection — horizontal chronological timeline of all parts in a franchise.
 * Props:
 *   - collection: collection object (name, poster_path, parts[])
 *   - currentMovieId: string — ID of current movie (highlighted)
 *   - loading: boolean
 */
export default function FranchiseSection({ collection, currentMovieId, loading = false }) {
  if (!loading && !collection?.parts?.length) return null;

  const parts = collection?.parts || [];

  return (
    <div className="mt-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
          <Film size={16} className="text-cyan-400" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400/80">Franchise</p>
          <h3
            className="text-base font-bold text-white leading-tight"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            {collection?.name || 'Franchise Timeline'}
          </h3>
        </div>
      </div>

      <ContentRail
        loading={loading}
        items={parts}
        renderCard={(part) => {
          const isCurrent = part.movie_id === currentMovieId || String(part.tmdb_id) === String(currentMovieId);
          const poster = getPoster(part);

          return (
            <Link
              key={part.movie_id || part.tmdb_id}
              to={part.movie_id ? `/movie/${part.movie_id}` : '#'}
              className="group block w-36 focus:outline-none"
            >
              <div
                className={`relative w-36 rounded-xl overflow-hidden aspect-[2/3] transition-all duration-200 ${
                  isCurrent
                    ? 'ring-2 ring-cyan-400 shadow-[0_0_16px_rgba(0,228,255,0.4)]'
                    : 'ring-1 ring-white/10 group-hover:ring-cyan-400/50'
                }`}
              >
                {poster ? (
                  <img
                    src={poster}
                    alt={part.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/30 text-xs">
                    No Image
                  </div>
                )}

                {/* Part number badge */}
                <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                  #{part.part_number ?? '?'}
                </div>

                {/* Stream status badge */}
                {part.stream_status && (
                  <div
                    className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      part.stream_status === 'Free'
                        ? 'bg-green-500/80 text-white'
                        : 'bg-purple-600/80 text-white'
                    }`}
                  >
                    {part.stream_status}
                  </div>
                )}

                {/* Current indicator */}
                {isCurrent && (
                  <div className="absolute bottom-0 left-0 right-0 bg-cyan-500/90 text-black text-[10px] font-bold text-center py-0.5">
                    NOW WATCHING
                  </div>
                )}
              </div>
              <div className="mt-1.5 px-0.5">
                <p className="text-xs font-medium text-white truncate group-hover:text-cyan-300 transition-colors">
                  {part.title}
                </p>
                <p className="text-[10px] text-white/50 flex items-center gap-1 mt-0.5">
                  <span>{part.release_date ? part.release_date.slice(0, 4) : '—'}</span>
                  {part.vote_average ? (
                    <>
                      <span>·</span>
                      <Star size={10} className="fill-amber-400 stroke-amber-400 inline-block align-middle" />
                      <span>{Number(part.vote_average).toFixed(1)}</span>
                    </>
                  ) : ''}
                </p>
              </div>
            </Link>
          );
        }}
      />
    </div>
  );
}
