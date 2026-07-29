import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { moviesAPI } from '../lib/api';
import { MovieCard } from '../components/MovieCard';
import { Button } from '../components/ui/button';
import { Loader2, ChevronLeft, Film } from 'lucide-react';

const LANGUAGE_MAP = {
  // Indian languages
  hi: { name: 'Hindi',      nativeName: 'हिंदी',       tmdbCode: 'hi' },
  ta: { name: 'Tamil',      nativeName: 'தமிழ்',       tmdbCode: 'ta' },
  te: { name: 'Telugu',     nativeName: 'తెలుగు',      tmdbCode: 'te' },
  ml: { name: 'Malayalam',  nativeName: 'മലയാളം',      tmdbCode: 'ml' },
  bn: { name: 'Bengali',    nativeName: 'বাংলা',        tmdbCode: 'bn' },
  kn: { name: 'Kannada',    nativeName: 'ಕನ್ನಡ',       tmdbCode: 'kn' },
  mr: { name: 'Marathi',    nativeName: 'मराठी',        tmdbCode: 'mr' },
  // English
  en: { name: 'English',    nativeName: 'English',      tmdbCode: 'en' },
  // East Asian
  ja: { name: 'Japanese',   nativeName: '日本語',        tmdbCode: 'ja' },
  ko: { name: 'Korean',     nativeName: '한국어',        tmdbCode: 'ko' },
  zh: { name: 'Chinese',    nativeName: '普通话',        tmdbCode: 'zh' },
  cn: { name: 'Cantonese',  nativeName: '粤语',         tmdbCode: 'cn' },
  // European
  es: { name: 'Spanish',    nativeName: 'Español',      tmdbCode: 'es' },
  fr: { name: 'French',     nativeName: 'Français',     tmdbCode: 'fr' },
  de: { name: 'German',     nativeName: 'Deutsch',      tmdbCode: 'de' },
  it: { name: 'Italian',    nativeName: 'Italiano',     tmdbCode: 'it' },
  pt: { name: 'Portuguese', nativeName: 'Português',    tmdbCode: 'pt' },
  ru: { name: 'Russian',    nativeName: 'Русский',       tmdbCode: 'ru' },
  // Middle East / Asia
  ar: { name: 'Arabic',     nativeName: 'العربية',      tmdbCode: 'ar' },
  tr: { name: 'Turkish',    nativeName: 'Türkçe',       tmdbCode: 'tr' },
  th: { name: 'Thai',       nativeName: 'ภาษาไทย',     tmdbCode: 'th' },
};

export default function LanguagePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const lowerCode = code?.toLowerCase();
  const language = LANGUAGE_MAP[lowerCode]; // Case-insensitive lookup

  const LIMIT = 30;

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [skip, setSkip] = useState(0);
  
  const observerRef = useRef();
  const loadMoreRef = useRef(null);

  const tmdbCode = language?.tmdbCode;

  const loadMovies = useCallback(async (isInitial = false) => {
    if (!tmdbCode) return;

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
        language: tmdbCode,
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
      console.error('Failed to load language movies:', err);
      setError('Failed to load movies. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [tmdbCode, skip]);

  useEffect(() => {
    if (tmdbCode) {
      loadMovies(true);
    } else {
      setLoading(false);
    }
  }, [code, tmdbCode]);

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

  // Guard: unknown language code — show proper not-found UI (after all hooks)
  if (!language) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center py-20 px-6 max-w-sm">
          <Film size={48} className="mx-auto mb-4 text-[hsl(var(--muted-foreground))]" />
          <h3 className="text-xl font-semibold mb-2">Language Not Found</h3>
          <p className="text-[hsl(var(--muted-foreground))] mb-6">
            We don't have a page for language code "<code className="text-cyan-400">{code}</code>" yet.
          </p>
          <Link to="/languages">
            <Button>Browse All Languages</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[hsl(var(--background))]/95 backdrop-blur-xl">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/languages');
                }
              }}
              data-testid="back-button"
            >
              <ChevronLeft size={20} />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
                {language.nativeName}
              </h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {language.name} Movies & Shows
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
            <h3 className="text-xl font-semibold mb-2">No {language.name} Movies Found</h3>
            <p className="text-[hsl(var(--muted-foreground))] mb-6">
              We're working on adding more {language.name} content. Check back soon!
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
                Showing {movies.length} of {total.toLocaleString()} {language.name} {total === 1 ? 'movie' : 'movies'}
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
