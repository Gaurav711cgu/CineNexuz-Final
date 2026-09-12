import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { moviesAPI, aiAPI, recommendationsAPI, onboardingAPI, continueWatchingAPI, top10API, collectionsAPI, watchProvidersAPI } from '../lib/api';
import { useAuth } from '../lib/auth';
import { MovieRail } from '../components/MovieCard';
import { EnhancedMovieRail } from '../components/EnhancedMovieCard';
import { Top10Rail } from '../components/Top10Rail';
import { ContinueWatchingRail } from '../components/ContinueWatchingRail';
import { CollectionRail } from '../components/CollectionRail';
import { LanguageRail } from '../components/LanguageRail';
import { GenreRail } from '../components/GenreRail';
import { StudiosRail, ComingSoonRail } from '../components/StudiosAndComingSoon';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ProviderList } from '../components/ProviderBadge';
import { Search, Play, Sparkles, TrendingUp, Film, Ticket, Dna, Loader2, ChevronLeft, ChevronRight, Shuffle, Star, X, Tv, ExternalLink } from 'lucide-react';

const TMDB_IMG = 'https://image.tmdb.org/t/p/original';
const TMDB_BACKDROP = 'https://image.tmdb.org/t/p/w1280';
const HERO_ROTATION_INTERVAL = 5000; // 5 seconds

export default function HomePage() {
  const { user } = useAuth();
  const [trending, setTrending] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [personalized, setPersonalized] = useState([]);
  const [genreMovies, setGenreMovies] = useState({});
  const [infiniteMovies, setInfiniteMovies] = useState([]);
  const [onboardingComplete, setOnboardingComplete] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [heroMovies, setHeroMovies] = useState([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hoveredMovie, setHoveredMovie] = useState(null);
  const [currentGenreTheme, setCurrentGenreTheme] = useState('default');
  const [continueWatching, setContinueWatching] = useState([]);
  const [top10Movies, setTop10Movies] = useState([]);
  const [featuredCollections, setFeaturedCollections] = useState([]);
  const [collectionMovies, setCollectionMovies] = useState({});
  const [animeMovies, setAnimeMovies] = useState([]);
  const [indianMovies, setIndianMovies] = useState([]);
  const [decade90s, setDecade90s] = useState([]);
  const [decade2000s, setDecade2000s] = useState([]);
  
  // Surprise Me Roulette State
  const [rouletteOpen, setRouletteOpen] = useState(false);
  const [rouletteState, setRouletteState] = useState('idle'); // 'idle' | 'rolling' | 'revealed'
  const [rouletteMovie, setRouletteMovie] = useState(null);
  const [rouletteProviders, setRouletteProviders] = useState(null);
  const [rollingMovieIndex, setRollingMovieIndex] = useState(0);
  
  const loadMoreRef = useRef(null);
  const isLoadMoreInView = useInView(loadMoreRef);
  const heroTimerRef = useRef(null);

  const GENRE_THEMES = {
    'Horror': { bg: 'radial-gradient(900px circle at 50% 30%, rgba(139,0,0,0.3), transparent 60%)', mood: 'dark' },
    'Thriller': { bg: 'radial-gradient(900px circle at 50% 30%, rgba(75,0,130,0.25), transparent 60%)', mood: 'intense' },
    'Romance': { bg: 'radial-gradient(900px circle at 50% 30%, rgba(255,105,180,0.2), transparent 60%)', mood: 'warm' },
    'Comedy': { bg: 'radial-gradient(900px circle at 50% 30%, rgba(255,215,0,0.15), transparent 60%)', mood: 'light' },
    'Action': { bg: 'radial-gradient(900px circle at 50% 30%, rgba(255,69,0,0.25), transparent 60%)', mood: 'energetic' },
    'Science Fiction': { bg: 'radial-gradient(900px circle at 50% 30%, rgba(0,191,255,0.25), transparent 60%)', mood: 'futuristic' },
    'Fantasy': { bg: 'radial-gradient(900px circle at 50% 30%, rgba(138,43,226,0.25), transparent 60%)', mood: 'magical' },
    'Drama': { bg: 'radial-gradient(900px circle at 50% 30%, rgba(105,105,105,0.2), transparent 60%)', mood: 'serious' },
  };

  useEffect(() => {
    async function load() {
      try {
        const [trendRes, npRes] = await Promise.all([
          moviesAPI.trending(20),
          moviesAPI.nowPlaying(20),
        ]);
        const trendingMovies = trendRes.data.movies || [];
        setTrending(trendingMovies);
        setNowPlaying(npRes.data.movies || []);
        
        // Set first 5 trending movies for hero carousel
        if (trendingMovies.length > 0) {
          setHeroMovies(trendingMovies.slice(0, 5));
        }

        // Group movies by genre
        const genres = ['Action', 'Horror', 'Comedy', 'Romance', 'Science Fiction', 'Thriller', 'Drama', 'Fantasy'];
        const genrePromises = genres.map(async (genre) => {
          try {
            const res = await moviesAPI.search(genre, false);
            return { genre, movies: res.data.movies.slice(0, 15) };
          } catch {
            return { genre, movies: [] };
          }
        });
        
        const genreResults = await Promise.all(genrePromises);
        const genreMap = {};
        genreResults.forEach(({ genre, movies }) => {
          if (movies.length > 0) {
            genreMap[genre] = movies;
          }
        });
        setGenreMovies(genreMap);

        // Load AI Hybrid Recommendations (combines multiple signals)
        try {
          const hybridRes = await recommendationsAPI.hybrid(20);
          setRecommended(hybridRes.data.movies || []);
        } catch { /* recommendations are optional */ }

        // Load personalized recommendations if user is logged in
        if (user) {
          try {
            const [personalizedRes, onboardingRes] = await Promise.all([
              recommendationsAPI.personalized(20),
              onboardingAPI.status(),
            ]);
            if (personalizedRes.data.personalized) {
              setPersonalized(personalizedRes.data.movies || []);
            }
            setOnboardingComplete(onboardingRes.data.completed);
          } catch { /* personalized is optional */ }
        }

        // Load first batch for infinite scroll
        const infiniteRes = await moviesAPI.discover(1, 20);
        setInfiniteMovies(infiniteRes.data.movies || []);

        // Load Continue Watching (only for logged-in users)
        if (user) {
          try {
            const cwRes = await continueWatchingAPI.get();
            setContinueWatching(cwRes.data.movies || []);
          } catch { /* optional */ }
        }

        // Load Top 10
        try {
          const top10Res = await top10API.get();
          setTop10Movies(top10Res.data.movies || []);
        } catch { /* optional */ }

        // FRANCHISE COLLECTIONS - Use proper collections API
        const franchiseCollections = [
          { id: 'mcu', name: 'Marvel Cinematic Universe', description: 'Follow the complete saga of Marvel\'s mightiest heroes.', theme: 'superhero' },
          { id: 'lord_rings', name: 'The Lord of the Rings Collection', description: 'Journey through Middle-earth in this legendary fantasy saga.', theme: 'fantasy' },
          { id: 'godzilla', name: 'MonsterVerse Collection', description: 'Witness the epic clashes of Godzilla, Kong, and the ancient Titans.', theme: 'action' },
          { id: 'harry_potter', name: 'Harry Potter Collection', description: 'Return to Hogwarts and experience the complete wizarding world.', theme: 'magical' },
          { id: 'mission_impossible', name: 'Mission: Impossible Series', description: 'Watch Ethan Hunt and the IMF team execute their most high-stakes operations.', theme: 'action' },
          { id: 'conjuring', name: 'The Conjuring Universe', description: 'Experience the complete paranormal case files of Ed and Lorraine Warren.', theme: 'horror' },
        ];

        const franchiseCollectionsData = {};
        for (const franchise of franchiseCollections) {
          try {
            const res = await collectionsAPI.get(franchise.id);
            const movies = res.data.movies || [];
            if (movies.length > 0) {
              franchiseCollectionsData[franchise.id] = {
                collection: {
                  id: franchise.id,
                  name: franchise.name,
                  description: franchise.description,
                  theme: franchise.theme,
                },
                movies: movies.slice(0, 10)
              };
            }
          } catch (err) {
            console.log(`Failed to load ${franchise.name}:`, err);
          }
        }

        setFeaturedCollections(Object.keys(franchiseCollectionsData).map(id => franchiseCollectionsData[id].collection));
        const collectionsMap = {};
        Object.keys(franchiseCollectionsData).forEach(id => {
          collectionsMap[id] = franchiseCollectionsData[id].movies;
        });
        setCollectionMovies(collectionsMap);

        // Load Anime and Indian content
        try {
          // Skip anime for now - Jikan API posters have CORS/loading issues
          // Will re-enable when we have anime from TMDB instead
          setAnimeMovies([]);
        } catch { /* anime optional */ }

        try {
          // Fetch Indian/family content
          const indianRes = await moviesAPI.search('Family', false);
          const indianResults = indianRes.data.movies || [];
          // Filter for Indian/family content
          const indianFiltered = indianResults.filter(m =>
            m.source === 'tmdb_indian' ||
            m.genres?.includes('Family') ||
            m.keyword_source // Check if ingested via keyword
          );
          setIndianMovies(indianFiltered.slice(0, 15));
        } catch { /* indian content optional */ }

        // Fetch Decade Nostalgia Rails
        try {
          const res90 = await moviesAPI.list({ decade: '1990s', limit: 15 });
          setDecade90s(res90.data.movies || []);
        } catch { /* optional */ }

        try {
          const res2000 = await moviesAPI.list({ decade: '2000s', limit: 15 });
          setDecade2000s(res2000.data.movies || []);
        } catch { /* optional */ }
      } catch (err) {
        console.error('Failed to load movies:', err);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const triggerRoulette = useCallback(async () => {
    setRouletteOpen(true);
    setRouletteState('rolling');
    setRouletteMovie(null);
    setRouletteProviders(null);
    
    const candidates = trending.length > 0 ? trending : nowPlaying;
    
    let cycleInterval = null;
    if (candidates.length > 0) {
      cycleInterval = setInterval(() => {
        setRollingMovieIndex(prev => (prev + 1) % candidates.length);
      }, 100);
    }

    const startTime = Date.now();
    let randomMovie = null;
    let providers = null;

    try {
      const res = await moviesAPI.random();
      randomMovie = res.data;
      if (randomMovie) {
        const id = randomMovie._id || randomMovie.movie_id || randomMovie.tmdb_id;
        try {
          const provRes = await watchProvidersAPI.get(id);
          providers = provRes.data;
        } catch (e) {
          console.error("Failed to load providers for roulette movie:", e);
        }
      }
    } catch (err) {
      console.error("Failed to fetch random movie:", err);
    }

    const elapsed = Date.now() - startTime;
    const remainingDelay = Math.max(0, 1500 - elapsed);

    setTimeout(() => {
      if (cycleInterval) clearInterval(cycleInterval);
      
      if (randomMovie) {
        setRouletteMovie(randomMovie);
        setRouletteProviders(providers);
        setRouletteState('revealed');
      } else {
        if (candidates.length > 0) {
          const fallback = candidates[Math.floor(Math.random() * candidates.length)];
          setRouletteMovie(fallback);
          setRouletteState('revealed');
        } else {
          setRouletteState('idle');
          setRouletteOpen(false);
        }
      }
    }, remainingDelay);
  }, [trending, nowPlaying]);

  // Auto-rotate hero carousel
  useEffect(() => {
    if (heroMovies.length <= 1 || isPaused) return;

    heroTimerRef.current = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroMovies.length);
    }, HERO_ROTATION_INTERVAL);

    return () => {
      if (heroTimerRef.current) {
        clearInterval(heroTimerRef.current);
      }
    };
  }, [heroMovies.length, isPaused]);

  const nextHero = useCallback(() => {
    setCurrentHeroIndex((prev) => (prev + 1) % heroMovies.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000); // Resume auto-play after 10s
  }, [heroMovies.length]);

  const prevHero = useCallback(() => {
    setCurrentHeroIndex((prev) => (prev - 1 + heroMovies.length) % heroMovies.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000);
  }, [heroMovies.length]);

  const goToHero = useCallback((index) => {
    setCurrentHeroIndex(index);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000);
  }, []);

  // Infinite scroll effect
  useEffect(() => {
    if (isLoadMoreInView && !loadingMore && hasMore && !loading) {
      loadMoreMovies();
    }
  }, [isLoadMoreInView]);

  const loadMoreMovies = useCallback(async () => {
    if (loadingMore) return;
    
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await moviesAPI.discover(nextPage, 20);
      const newMovies = res.data.movies || [];
      
      if (newMovies.length === 0) {
        setHasMore(false);
      } else {
        setInfiniteMovies(prev => [...prev, ...newMovies]);
        setPage(nextPage);
      }
    } catch (err) {
      console.error('Failed to load more movies:', err);
    }
    setLoadingMore(false);
  }, [page, loadingMore]);

  return (
    <div className="min-h-screen relative">
      {/* Dynamic Background Based on Hover */}
      <AnimatePresence>
        {hoveredMovie && hoveredMovie.backdrop_path && (
          <motion.div
            key={hoveredMovie._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-0 pointer-events-none"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center blur-3xl scale-110"
              style={{ backgroundImage: `url(${TMDB_BACKDROP}${hoveredMovie.backdrop_path})` }}
            />
            <div className="absolute inset-0 bg-[hsl(var(--background))]/70" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Genre Theme Background */}
      <motion.div
        className="fixed inset-0 z-0 pointer-events-none transition-all duration-1000"
        style={{
          background: GENRE_THEMES[currentGenreTheme]?.bg || 'transparent'
        }}
      />
      {/* Brutalist Editorial Hero */}
      {heroMovies.length > 0 && (
        <div className="relative h-[600px] md:h-[750px] overflow-hidden bg-[#0a0a0c] border-b border-white/10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentHeroIndex}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, filter: 'blur(10px)' }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col md:flex-row"
            >
              {/* Left Side: Harsh Typographic Block */}
              <div className="w-full md:w-[45%] h-full relative z-20 flex flex-col justify-center px-6 md:px-12 pt-20 pb-12 bg-black/40 md:bg-transparent backdrop-blur-md md:backdrop-blur-none border-r border-white/5">
                <motion.div 
                  initial={{ opacity: 0, x: -40 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="inline-block border border-[hsl(var(--primary))] text-[hsl(var(--primary))] px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold mb-6 select-none">
                    No. 0{currentHeroIndex + 1} — Trending
                  </div>
                  
                  <motion.h1 
                    className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.85] text-white mb-6" 
                    style={{ fontFamily: 'Space Grotesk', wordBreak: 'break-word' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {heroMovies[currentHeroIndex].title}
                  </motion.h1>
                  
                  <motion.p 
                    className="text-sm md:text-base text-white/60 line-clamp-4 mb-8 max-w-md font-mono tracking-tight leading-relaxed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  >
                    {heroMovies[currentHeroIndex].overview}
                  </motion.p>
                  
                  <motion.div 
                    className="flex flex-col sm:flex-row gap-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    <Link to={`/movie/${heroMovies[currentHeroIndex]._id}`}>
                      <Button className="w-full sm:w-auto rounded-none border border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-black hover:bg-transparent hover:text-[hsl(var(--primary))] transition-colors uppercase font-bold tracking-widest text-xs px-8 py-6" data-testid="hero-play-button">
                        [ Watch Now ]
                      </Button>
                    </Link>
                    <Link to="/search">
                      <Button variant="outline" className="w-full sm:w-auto rounded-none border-white/20 bg-transparent text-white hover:bg-white hover:text-black transition-colors uppercase font-bold tracking-widest text-xs px-8 py-6" data-testid="hero-search-button">
                        Explore
                      </Button>
                    </Link>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center gap-3 mt-8 font-mono text-[10px] text-white/40 uppercase tracking-widest"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                  >
                    {heroMovies[currentHeroIndex].genres?.slice(0, 3).map(g => (
                      <span key={g} className="border-b border-white/20 pb-0.5">{g}</span>
                    ))}
                    <span>//</span>
                    <span>{heroMovies[currentHeroIndex].runtime && `${heroMovies[currentHeroIndex].runtime}M`}</span>
                    <span>//</span>
                    <span className="text-[hsl(var(--primary))]">{heroMovies[currentHeroIndex].vote_average && `${heroMovies[currentHeroIndex].vote_average.toFixed(1)} RTG`}</span>
                  </motion.div>
                </motion.div>
              </div>

              {/* Right Side: Bleed-Edge Image */}
              <div className="absolute inset-0 md:relative md:w-[55%] h-full z-0 md:z-10">
                <div className="w-full h-full relative overflow-hidden">
                  <img
                    src={heroMovies[currentHeroIndex].backdrop_path ? `${TMDB_BACKDROP}${heroMovies[currentHeroIndex].backdrop_path}` : ''}
                    alt=""
                    className="w-full h-full object-cover object-right md:object-center filter contrast-125 saturate-[0.85]"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&h=600&fit=crop';
                    }}
                  />
                  {/* Brutalist Hard Shadows instead of soft gradients */}
                  <div className="absolute inset-0 bg-black/20 mix-blend-multiply" />
                  <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black/80 to-transparent md:hidden" />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls - Minimalist Architecture */}
          {heroMovies.length > 1 && (
            <div className="absolute bottom-0 right-0 z-30 flex bg-black border-t border-l border-white/10">
              <button
                onClick={prevHero}
                className="w-16 h-16 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-colors border-r border-white/10"
                data-testid="hero-prev-button"
                aria-label="Previous movie"
              >
                <ChevronLeft size={20} strokeWidth={1.5} />
              </button>
              
              <div className="flex items-center justify-center px-6 font-mono text-[10px] tracking-[0.2em] text-white/50 w-24">
                0{currentHeroIndex + 1} / 0{heroMovies.length}
              </div>

              <button
                onClick={nextHero}
                className="w-16 h-16 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-colors border-l border-white/10"
                data-testid="hero-next-button"
                aria-label="Next movie"
              >
                <ChevronRight size={20} strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 -mt-8 relative z-10">
        {/* Continue Watching Rail */}
        {user && continueWatching.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ContinueWatchingRail
              movies={continueWatching}
              loading={loading}
              onMovieHover={(movie) => {
                if (movie) setHoveredMovie(movie);
              }}
            />
          </motion.div>
        )}

        {/* Quick chips */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="border-2 border-[hsl(var(--primary))] bg-black p-4 mb-12 flex items-center justify-between flex-wrap gap-4 uppercase font-mono tracking-widest text-xs"
          >
            <div className="flex items-center gap-4 text-[hsl(var(--primary))]">
              <Sparkles size={16} strokeWidth={2} />
              <span>[ Authentication Required For Advanced Recommendations ]</span>
            </div>
            <Link to="/auth/login">
              <Button size="sm" className="rounded-none border border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-black hover:bg-transparent hover:text-[hsl(var(--primary))] transition-colors font-bold uppercase tracking-widest text-[10px]" data-testid="home-login-button">
                Sign In
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Onboarding CTA */}
        {user && !onboardingComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="border-2 border-cyan-500 bg-black p-4 mb-12 flex items-center justify-between flex-wrap gap-4 uppercase font-mono tracking-widest text-xs"
          >
            <div className="flex items-center gap-4 text-cyan-500">
              <Dna size={16} strokeWidth={2} />
              <span>[ Missing Taste Data: Complete DNA Sequence ]</span>
            </div>
            <Link to="/onboarding">
              <Button size="sm" className="rounded-none border border-cyan-500 bg-cyan-500 text-black hover:bg-transparent hover:text-cyan-500 transition-colors font-bold uppercase tracking-widest text-[10px]" data-testid="home-onboarding-cta">
                Start Sequence
              </Button>
            </Link>
          </motion.div>
        )}

        {/* FRANCHISE COLLECTIONS - PRIORITY SECTION AT TOP */}
        {featuredCollections.map((collection) => {
          const movies = collectionMovies[collection.id] || [];
          if (movies.length === 0) return null;
          
          return (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <CollectionRail
                collection={collection}
                movies={movies}
                loading={loading}
                onMovieHover={(movie) => {
                  if (movie) setHoveredMovie(movie);
                }}
              />
            </motion.div>
          );
        })}

        {/* Top 10 Rail */}
        {top10Movies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <Top10Rail
              movies={top10Movies}
              loading={loading}
              onMovieHover={(movie) => {
                if (movie) setHoveredMovie(movie);
              }}
            />
          </motion.div>
        )}

        {/* Popular Languages Rail */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <LanguageRail />
        </motion.div>

        {/* Popular Genres Rail */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <GenreRail />
        </motion.div>

        {/* Studios Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <StudiosRail />
        </motion.div>

        {/* Coming Soon Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <ComingSoonRail />
        </motion.div>

        {/* Personalized Rail (For You) - Using Hybrid Recommendations */}
        {personalized.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-4 px-1">
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight flex items-center gap-2" style={{ fontFamily: 'Space Grotesk' }}>
                <Dna size={20} className="text-[hsl(var(--primary))]" />
                For You
              </h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                Personalized picks based on your unique taste
              </p>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
              {personalized.map((movie, index) => (
                <div key={movie._id} className="min-w-[160px] md:min-w-[200px]">
                  <Link to={`/movie/${movie._id}`}>
                    <div className="group cursor-pointer">
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5">
                        {movie.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                            alt={movie.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1563089145-599997674d42?w=300&h=450&fit=crop';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film size={32} className="text-[hsl(var(--muted-foreground))]" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        {/* Recommendation Reason Badge */}
                        {movie.recommendation_reason && (
                          <div className="absolute top-2 left-2 right-2">
                            <div className="text-[10px] px-2 py-1 rounded-full bg-[hsl(var(--primary))]/90 text-white font-medium line-clamp-1">
                              {movie.recommendation_reason}
                            </div>
                          </div>
                        )}
                      </div>
                      <h3 className="mt-2 text-sm font-medium line-clamp-2 group-hover:text-[hsl(var(--primary))] transition-colors">
                        {movie.title}
                      </h3>
                      {movie.vote_average > 0 && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                          <Star size={11} className="fill-amber-400 stroke-amber-400" />
                          <span>{movie.vote_average.toFixed(1)}</span>
                        </p>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <MovieRail title="Trending Now" movies={trending} loading={loading} />
        </motion.div>

        {nowPlaying.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <MovieRail title="In Theatres" movies={nowPlaying} loading={loading} />
          </motion.div>
        )}

        {/* Anime Spotlight Rail */}
        {animeMovies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <CollectionRail
              collection={{
                id: "anime_spotlight",
                name: "Anime Spotlight",
                description: "Journey into the world of Japanese animation",
                theme: "anime",
              }}
              movies={animeMovies}
              loading={loading}
              onMovieHover={(movie) => {
                if (movie) setHoveredMovie(movie);
              }}
            />
          </motion.div>
        )}

        {/* Indian Cartoons & Family Rail */}
        {indianMovies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <CollectionRail
              collection={{
                id: "indian_family",
                name: "Indian Cartoons & Family",
                description: "Beloved childhood favorites from India",
                theme: "family",
              }}
              movies={indianMovies}
              loading={loading}
              onMovieHover={(movie) => {
                if (movie) setHoveredMovie(movie);
              }}
            />
          </motion.div>
        )}

        {/* Decade Nostalgia Rail — 90s */}
        {decade90s.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <MovieRail title="90s Classics" movies={decade90s} loading={loading} />
          </motion.div>
        )}

        {/* Decade Nostalgia Rail — 2000s */}
        {decade2000s.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <MovieRail title="2000s Hits" movies={decade2000s} loading={loading} />
          </motion.div>
        )}

        {/* Genre-Based Rails with Enhanced Cards */}
        {Object.entries(genreMovies).map(([genre, movies]) => (
          <motion.div
            key={genre}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <EnhancedMovieRail
              title={genre}
              genre={genre}
              movies={movies}
              loading={loading}
              onMovieHover={(movie, genreName) => {
                if (movie) setHoveredMovie(movie);
                if (genreName) setCurrentGenreTheme(genreName);
              }}
              onHoverEnd={() => {
                setHoveredMovie(null);
                setCurrentGenreTheme('default');
              }}
            />
          </motion.div>
        ))}

        {recommended.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <MovieRail title="Recommended For You" movies={recommended} loading={loading} showReason />
          </motion.div>
        )}

        {/* Infinite Scroll Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 px-1">
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
              Discover More
            </h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Keep scrolling for endless entertainment</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {infiniteMovies.map((movie, index) => (
              <motion.div
                key={`${movie._id}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: (index % 6) * 0.05 }}
              >
                <Link to={`/movie/${movie._id}`}>
                  <div className="group cursor-pointer">
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5">
                      {movie.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                          alt={movie.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1563089145-599997674d42?w=300&h=450&fit=crop';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film size={32} className="text-[hsl(var(--muted-foreground))]" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="mt-2 text-sm font-medium line-clamp-2 group-hover:text-[hsl(var(--primary))] transition-colors">
                      {movie.title}
                    </h3>
                    {movie.vote_average > 0 && (
                      <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1 mt-0.5">
                        <Star size={12} className="fill-amber-400 stroke-amber-400 inline" />
                        <span>{movie.vote_average.toFixed(1)}</span>
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Load More Trigger */}
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {loadingMore && (
            <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Loading more movies...</span>
            </div>
          )}
          {!hasMore && infiniteMovies.length > 0 && (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">You've reached the end!</p>
          )}
        </div>
      </div>

      {/* ── Brutalist Surprise Me Button ── */}
      <motion.button
        id="surprise-me-fab"
        aria-label="Surprise Me"
        onClick={triggerRoulette}
        className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-none
          border-2 border-white bg-black text-white font-bold text-xs uppercase tracking-widest shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]
          hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-1 hover:translate-y-1 transition-all duration-200 select-none"
      >
        <Shuffle size={18} strokeWidth={2.5} />
        [ Surprise Me ]
      </motion.button>

      {/* ── Roulette Modal ── */}
      <AnimatePresence>
        {rouletteOpen && (
          <motion.div
            key="roulette-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
            onClick={(e) => { if (e.target === e.currentTarget) { setRouletteOpen(false); setRouletteState('idle'); } }}
          >
            <motion.div
              key="roulette-card"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 260 }}
              className="relative w-full max-w-lg rounded-none overflow-hidden bg-black border-2 border-white shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]"
              style={{ maxHeight: '90vh', overflowY: 'auto' }}
            >
              {/* Close */}
              <button
                onClick={() => { setRouletteOpen(false); setRouletteState('idle'); }}
                className="absolute top-4 right-4 z-10 p-2 bg-transparent hover:bg-white hover:text-black border border-white text-white transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>

              {/* Rolling state */}
              {rouletteState === 'rolling' && (() => {
                const candidates = trending.length > 0 ? trending : nowPlaying;
                const rolling = candidates[rollingMovieIndex];
                const posterUrl = rolling?.poster_path
                  ? `https://image.tmdb.org/t/p/w500${rolling.poster_path}`
                  : null;
                return (
                  <div className="flex flex-col items-center justify-center p-8 min-h-[340px]">
                    <div className="w-36 aspect-[2/3] overflow-hidden mb-4 border border-[hsl(var(--primary))] shadow-[8px_8px_0px_0px_hsl(var(--primary))]">
                      {posterUrl
                        ? <img src={posterUrl} alt="" className="w-full h-full object-cover filter grayscale opacity-70 mix-blend-screen" />
                        : <div className="w-full h-full bg-black flex items-center justify-center border border-white/20"><Film size={40} className="text-[hsl(var(--primary))]" /></div>
                      }
                    </div>
                    <div className="flex gap-2 mt-4">
                      {[0,1,2].map(i => (
                        <motion.div key={i} className="w-3 h-3 bg-[hsl(var(--primary))]"
                          animate={{ opacity: [0.1, 1, 0.1] }}
                          transition={{ duration: 0.6, delay: i*0.2, repeat: Infinity }} />
                      ))}
                    </div>
                    <p className="mt-6 text-xs uppercase tracking-widest text-[hsl(var(--primary))] font-mono">INITIATING ROULETTE SEQUENCE...</p>
                  </div>
                );
              })()}

              {/* Revealed state */}
              {rouletteState === 'revealed' && rouletteMovie && (() => {
                const m = rouletteMovie;
                const posterUrl = m.poster_path
                  ? (m.poster_path.startsWith('http') ? m.poster_path : `https://image.tmdb.org/t/p/w500${m.poster_path}`)
                  : null;
                const backdropUrl = m.backdrop_path
                  ? `https://image.tmdb.org/t/p/w780${m.backdrop_path}`
                  : null;
                return (
                  <div>
                    {/* Backdrop hero */}
                    <div className="relative h-44 bg-black overflow-hidden border-b border-white/20">
                      {backdropUrl && <img src={backdropUrl} alt="" className="w-full h-full object-cover opacity-30 filter grayscale" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                      {/* Poster floating */}
                      <div className="absolute -bottom-8 left-6 w-24 aspect-[2/3] overflow-hidden border border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                        {posterUrl
                          ? <img src={posterUrl} alt={m.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-black flex items-center justify-center"><Film size={24} className="text-white" /></div>
                        }
                      </div>
                    </div>

                    {/* Details */}
                    <div className="pt-12 px-6 pb-6">
                      <h2 className="text-2xl font-black uppercase text-white mb-2 tracking-tighter" style={{fontFamily:'Space Grotesk'}}>{m.title}</h2>

                      <div className="flex flex-wrap items-center gap-2 mb-4 font-mono text-[10px] tracking-widest text-white/50 uppercase">
                        {m.release_date && (
                          <span className="border border-white/20 px-2 py-1">{m.release_date.slice(0,4)}</span>
                        )}
                        {m.vote_average > 0 && (
                          <span className="border border-[hsl(var(--primary))] text-[hsl(var(--primary))] px-2 py-1">
                            {Number(m.vote_average).toFixed(1)} RTG
                          </span>
                        )}
                        {m.genres?.slice(0,2).map(g => (
                          <span key={g} className="px-2 py-1 border-b border-white/20">{g}</span>
                        ))}
                      </div>

                      {m.overview && (
                        <p className="text-xs text-white/70 leading-relaxed mb-6 font-mono break-words">{m.overview}</p>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <Link
                          to={`/movie/${m._id || m.movie_id}`}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-none
                            border border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-black text-xs font-bold uppercase tracking-widest
                            hover:bg-transparent hover:text-[hsl(var(--primary))] transition-colors"
                          onClick={() => setRouletteOpen(false)}
                        >
                          <Play size={15} /> [ Details ]
                        </Link>
                        {m.trailer_key && (
                          <a
                            href={`https://www.youtube.com/watch?v=${m.trailer_key}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-none
                              border border-white/20 hover:bg-white hover:text-black text-white text-xs font-bold uppercase tracking-widest transition-colors"
                          >
                            <Tv size={15} /> Trailer
                          </a>
                        )}
                        <button
                          onClick={triggerRoulette}
                          className="flex items-center justify-center gap-2 px-4 py-3 rounded-none
                            border border-white/20 hover:bg-white hover:text-black text-white text-xs font-bold uppercase tracking-widest transition-colors"
                        >
                          <Shuffle size={15} /> Reroll
                        </button>
                      </div>

                      {/* OTT Providers */}
                      {rouletteProviders && (
                        <div className="border-t border-white/10 pt-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Tv size={16} className="text-white/50" />
                            <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wide">Where to Watch</h4>
                          </div>
                          <ProviderList
                            providers={{
                              flatrate: rouletteProviders.flatrate || [],
                              rent: rouletteProviders.rent || [],
                              buy: rouletteProviders.buy || [],
                              ads: rouletteProviders.ads || []
                            }}
                            watchLink={rouletteProviders.justwatch_link || rouletteProviders.tmdb_link}
                          />
                          {rouletteProviders.tmdb_link && (
                            <a
                              href={rouletteProviders.tmdb_link} target="_blank" rel="noopener noreferrer"
                              className="mt-3 text-xs text-white/40 hover:text-white/70 flex items-center gap-1 transition-colors"
                            >
                              View all options <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <Footer />
    </div>
  );
}
