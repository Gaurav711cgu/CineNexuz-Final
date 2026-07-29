import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Film, ChevronRight, Play, Compass, Award, Star, TrendingUp } from 'lucide-react';
import { useCollections } from '../lib/useCollections';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP = 'https://image.tmdb.org/t/p/original';

function getPoster(c) {
  if (!c.poster_path) return null;
  if (c.poster_path.startsWith('http')) return c.poster_path;
  return `${TMDB_IMG}${c.poster_path}`;
}

function getBackdrop(c) {
  if (!c.backdrop_path) return null;
  if (c.backdrop_path.startsWith('http')) return c.backdrop_path;
  return `${TMDB_BACKDROP}${c.backdrop_path}`;
}

function CollectionCard({ collection }) {
  const poster = getPoster(collection);
  const backdrop = getBackdrop(collection) || poster;
  const partCount = collection.parts?.length ?? 0;

  return (
    <Link to={`/franchise/${collection.tmdb_id || collection._id}`}>
      <motion.div
        whileHover={{ y: -8 }}
        transition={{ type: 'spring', stiffness: 250, damping: 22 }}
        className="group relative rounded-2xl overflow-hidden bg-slate-900/40 border border-white/5 hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all duration-300 cursor-pointer h-full flex flex-col"
      >
        {/* Poster / Backdrop */}
        <div className="aspect-[16/10] relative overflow-hidden bg-black/40">
          {backdrop ? (
            <img
              src={backdrop.replace('/original/', '/w780/')}
              alt={collection.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-hover:blur-[1px]"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
              <Film size={36} className="text-white/10" />
            </div>
          )}

          {/* Glowing Play Icon Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-12 h-12 rounded-full bg-cyan-500 text-black flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]"
            >
              <Play size={20} fill="currentColor" className="ml-1" />
            </motion.div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
          
          {partCount > 0 && (
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-extrabold tracking-wider text-cyan-400 uppercase">
              {partCount} Movies
            </div>
          )}
        </div>

        {/* Content Info */}
        <div className="p-5 flex-1 flex flex-col justify-between bg-slate-950/50 backdrop-blur-sm">
          <div>
            <h3
              className="text-lg font-bold text-white tracking-tight group-hover:text-cyan-400 transition-colors duration-200 line-clamp-1"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {collection.name}
            </h3>
            {collection.overview ? (
              <p className="text-xs text-white/50 mt-2 line-clamp-2 leading-relaxed">
                {collection.overview}
              </p>
            ) : (
              <p className="text-xs text-white/30 mt-2 italic">
                Complete movie collection details and chronological timeline.
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
              View Franchise
            </span>
            <ChevronRight size={14} className="text-white/40 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse bg-slate-900/50 border border-white/5">
      <div className="aspect-[16/10] bg-white/5" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-white/10 rounded w-2/3" />
        <div className="h-3 bg-white/5 rounded w-full" />
        <div className="h-3 bg-white/5 rounded w-5/6" />
      </div>
    </div>
  );
}

export default function FranchisesPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState('All');

  const { data: collections, pagination, loading } = useCollections({
    q: query || undefined,
    page,
    limit: 12,
  });

  // Spotlight Item: First item that has an overview and poster/backdrop
  const spotlightItem = collections?.find(c => c.backdrop_path && c.overview) || collections?.[0];

  const categories = [
    { name: 'All', icon: Compass },
    { name: 'Marvel', keyword: 'Marvel' },
    { name: 'Star Wars', keyword: 'Star Wars' },
    { name: 'Harry Potter', keyword: 'Harry Potter' },
    { name: 'Sagas', keyword: 'Collection' }
  ];

  return (
    <div className="min-h-screen px-4 md:px-8 py-8 max-w-7xl mx-auto space-y-12">
      
      {/* Dynamic Cinematic Hero Spotlight */}
      {spotlightItem && !query && page === 1 && (
        <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-0 bg-black/40 z-10" />
          
          {/* Backdrop Image */}
          <div className="absolute inset-0">
            {getBackdrop(spotlightItem) ? (
              <img
                src={getBackdrop(spotlightItem)}
                alt={spotlightItem.name}
                className="w-full h-full object-cover scale-102 filter blur-[1px] brightness-[0.6]"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/50 to-transparent" />
          </div>

          {/* Spotlight Content */}
          <div className="relative z-20 px-6 py-12 md:p-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 min-h-[420px] max-w-6xl">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <TrendingUp size={12} /> Featured Collections
              </div>
              
              <h1
                className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-none"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {spotlightItem.name}
              </h1>
              
              <p className="text-sm md:text-base text-white/70 leading-relaxed line-clamp-3">
                {spotlightItem.overview || 'Explore the complete movie collection and view the films in chronological order.'}
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  to={`/franchise/${spotlightItem.tmdb_id || spotlightItem._id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-sm transition-all shadow-[0_4px_20px_rgba(6,182,212,0.4)]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <Play size={16} fill="currentColor" /> Explore Saga
                </Link>
                {spotlightItem.parts?.length > 0 && (
                  <div className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm font-semibold backdrop-blur-md">
                    Contains {spotlightItem.parts.length} films
                  </div>
                )}
              </div>
            </div>

            {/* Quick Sibling List (OTT concept) */}
            {spotlightItem.parts?.length > 0 && (
              <div className="hidden lg:block w-80 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-5 space-y-3">
                <p className="text-[10px] font-extrabold tracking-widest text-cyan-400 uppercase">Collection preview</p>
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {spotlightItem.parts.slice(0, 3).map((p, idx) => (
                    <div key={p.id || idx} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
                      <span className="text-xs font-bold text-white/30">0{idx + 1}</span>
                      <p className="text-xs font-bold text-white truncate flex-1">{p.title || p.name}</p>
                      {p.release_date && (
                        <span className="text-[10px] font-semibold text-white/40">{p.release_date.split('-')[0]}</span>
                      )}
                    </div>
                  ))}
                  {spotlightItem.parts.length > 3 && (
                    <p className="text-[10px] text-white/40 text-center pt-1">+ {spotlightItem.parts.length - 3} more entries</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Categories & Search Layout */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
        {/* Title Style exactly matching the requested look */}
        <div>
          <h2
            className="text-3xl font-extrabold text-white tracking-tight"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            All Movie Collections
          </h2>
          <p
            className="text-xs md:text-sm text-white/40 mt-1.5 font-medium"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Browse complete movie series and chronological collections
          </p>
        </div>

        {/* Filters & Search container */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 min-w-[320px] md:min-w-[450px]">
          {/* Quick Category Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((c) => (
              <button
                key={c.name}
                onClick={() => {
                  setActiveFilter(c.name);
                  if (c.name === 'All') {
                    setQuery('');
                  } else {
                    setQuery(c.keyword);
                  }
                  setPage(1);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                  activeFilter === c.name
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Search bar with glow */}
          <div className="relative flex-1 group">
            <div className="absolute -inset-0.5 bg-cyan-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-300" />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4 transition-colors group-hover:text-cyan-400" />
              <input
                type="text"
                placeholder="Search saga universes..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveFilter('All');
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : collections.length > 0
            ? collections.map((c) => <CollectionCard key={c._id || c.tmdb_id} collection={c} />)
            : (
              <div className="col-span-full text-center py-24 bg-slate-900/10 rounded-3xl border border-white/5 backdrop-blur-md">
                <Film size={48} className="mx-auto mb-4 text-white/10 animate-bounce" />
                <h3 className="text-xl font-bold text-white mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>No Sagas Found</h3>
                <p className="text-sm text-white/40 max-w-sm mx-auto leading-relaxed">We couldn't find any collection fitting your search. Double-check your spelling or clear filters.</p>
                <button
                  onClick={() => {
                    setQuery('');
                    setActiveFilter('All');
                    setPage(1);
                  }}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all shadow-[0_4px_15px_rgba(6,182,212,0.3)]"
                >
                  Clear search and filters
                </button>
              </div>
            )
        }
      </div>

      {/* Premium Glassmorphic Pagination Controls */}
      {pagination && pagination.pages > 1 && (
        <div className="mt-12 flex flex-col items-center gap-4 border-t border-white/5 pt-8">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-cyan-500/20 hover:border-cyan-500/40 disabled:hover:border-white/10 text-xs font-bold text-white/70 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all duration-200"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Previous
            </button>

            {/* Dynamic page numbers */}
            <div className="flex items-center gap-1.5 mx-2">
              {Array.from({ length: Math.min(5, pagination.pages) }).map((_, index) => {
                let pageNum = index + 1;
                if (page > 3 && pagination.pages > 5) {
                  if (page + 2 > pagination.pages) {
                    pageNum = pagination.pages - 4 + index;
                  } else {
                    pageNum = page - 2 + index;
                  }
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-xl text-xs font-extrabold transition-all duration-200 border ${
                      page === pageNum
                        ? 'bg-cyan-500 text-black border-cyan-400 font-extrabold shadow-[0_0_15px_rgba(6,182,212,0.45)]'
                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-cyan-500/20 hover:border-cyan-500/40 disabled:hover:border-white/10 text-xs font-bold text-white/70 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all duration-200"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Next
            </button>
          </div>

          <p
            className="text-[10px] tracking-widest text-white/40 mt-1 uppercase"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Showing page <span className="text-cyan-400 font-extrabold">{pagination.page}</span> of <span className="text-white/70 font-extrabold">{pagination.pages}</span> <span className="text-white/20 mx-1">•</span> <span className="text-white/70 font-extrabold">{pagination.total}</span> Universes
          </p>
        </div>
      )}
    </div>
  );
}
