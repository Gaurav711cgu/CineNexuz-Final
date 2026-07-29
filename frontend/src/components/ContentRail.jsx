import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';

function getPoster(movie) {
  if (movie.poster_path?.startsWith('http')) return movie.poster_path;
  if (movie.poster_path) return `${TMDB_IMG}${movie.poster_path}`;
  return null;
}

// Shimmer skeleton card
function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-40 rounded-xl overflow-hidden animate-pulse bg-white/10">
      <div className="w-full aspect-[2/3] bg-white/10" />
      <div className="p-2 space-y-1.5">
        <div className="h-3 bg-white/10 rounded w-3/4" />
        <div className="h-2.5 bg-white/10 rounded w-1/2" />
      </div>
    </div>
  );
}

/**
 * Horizontal snapping content rail with shimmer skeletons.
 * Props:
 *   - title: string (section heading)
 *   - items: array of movie objects
 *   - loading: boolean
 *   - onMovieClick: (movie) => void
 *   - renderCard: (movie) => JSX (optional custom renderer)
 */
export default function ContentRail({ title, items = [], loading = false, onMovieClick, renderCard }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  return (
    <section className="mb-8">
      {title && (
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-lg font-semibold text-white tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
            {title}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => scroll(-1)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll(1)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2"
        style={{ scrollbarWidth: 'none' }}
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : items.map((movie, i) => (
              <div key={movie._id || movie.tmdb_id || i} className="snap-start flex-shrink-0">
                {renderCard
                  ? renderCard(movie)
                  : (
                    <button
                      onClick={() => onMovieClick?.(movie)}
                      className="w-36 group text-left focus:outline-none"
                    >
                      <div className="relative w-36 rounded-xl overflow-hidden aspect-[2/3] bg-white/5 ring-1 ring-white/10 group-hover:ring-cyan-400/60 transition-all duration-200">
                        {getPoster(movie) ? (
                          <img
                            src={getPoster(movie)}
                            alt={movie.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">
                            No Image
                          </div>
                        )}
                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </div>
                      <div className="mt-1.5 px-0.5">
                        <p className="text-xs font-medium text-white truncate">{movie.title}</p>
                        <p className="text-[10px] text-white/50 flex items-center gap-1 mt-0.5">
                          <span>{movie.release_date ? movie.release_date.slice(0, 4) : '—'}</span>
                          {movie.vote_average ? (
                            <>
                              <span>·</span>
                              <Star size={10} className="fill-amber-400 stroke-amber-400 inline-block align-middle" />
                              <span>{Number(movie.vote_average).toFixed(1)}</span>
                            </>
                          ) : ''}
                        </p>
                      </div>
                    </button>
                  )
                }
              </div>
            ))
        }
      </div>
    </section>
  );
}
