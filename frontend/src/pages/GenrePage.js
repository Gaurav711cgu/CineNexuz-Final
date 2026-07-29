import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { moviesAPI } from '../lib/api';
import { MovieCard } from '../components/MovieCard';
import { Button } from '../components/ui/button';
import { Loader2, ChevronLeft, Film } from 'lucide-react';

export default function GenrePage() {
  const { genre } = useParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [skip, setSkip] = useState(0);
  
  const observerRef = useRef();
  const loadMoreRef = useRef(null);

  // Decode genre from URL (handles spaces, etc.)
  const decodedGenre = decodeURIComponent(genre);
  const LIMIT = 30;

  const loadMovies = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
      setError(null);
      setSkip(0);
      setMovies([]);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const currentSkip = isInitial ? 0 : skip;
      const response = await moviesAPI.list({
        genre: decodedGenre,
        skip: currentSkip,
        limit: LIMIT,
        sort: 'popularity'
      });
      
      const data = response.data;
      const newMovies = data.movies || [];
      
      setMovies(prev => isInitial ? newMovies : [...prev, ...newMovies]);
      setTotal(data.total || 0);
      setHasMore(data.has_more || false);
      setSkip(currentSkip + newMovies.length);
    } catch (err) {
      console.error('Failed to load genre movies:', err);
      setError('Failed to load movies. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [decodedGenre, skip]);

  useEffect(() => {
    loadMovies(true);
  }, [genre]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMovies(false);
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(loadMoreRef.current);
    
    return () => {
      if (observerRef.current) {
        observer.disconnect();
      }
    };
  }, [hasMore, loadingMore, loading, loadMovies]);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[hsl(var(--background))]/95 backdrop-blur-xl">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ChevronLeft size={20} />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
                {decodedGenre}
              </h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {decodedGenre} Movies & Shows
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-[hsl(var(--primary))]" />
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        )}

        {!loading && !error && movies.length === 0 && (
          <div className="text-center py-20">
            <Film size={48} className="mx-auto mb-4 text-[hsl(var(--muted-foreground))]" />
            <h3 className="text-xl font-semibold mb-2">No {decodedGenre} Movies Found</h3>
            <p className="text-[hsl(var(--muted-foreground))] mb-6">
              We're working on adding more {decodedGenre} content. Check back soon!
            </p>
            <Link to="/">
              <Button>Back to Home</Button>
            </Link>
          </div>
        )}

        {!loading && !error && movies.length > 0 && (
          <>
            <div className="mb-6">
              <p className="text-[hsl(var(--muted-foreground))]">
                Showing {movies.length} of {total.toLocaleString()} {decodedGenre} {total === 1 ? 'movie' : 'movies'}
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
            >
              {movies.map((movie, index) => (
                <motion.div
                  key={movie._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(index * 0.02, 0.5) }}
                >
                  <MovieCard movie={movie} />
                </motion.div>
              ))}
            </motion.div>

            {/* Infinite scroll sentinel */}
            {hasMore && (
              <div ref={loadMoreRef} className="flex items-center justify-center py-8">
                {loadingMore && (
                  <Loader2 size={24} className="animate-spin text-[hsl(var(--primary))]" />
                )}
              </div>
            )}

            {!hasMore && movies.length > 0 && (
              <div className="text-center py-8">
                <p className="text-[hsl(var(--muted-foreground))]">
                  You've reached the end!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

