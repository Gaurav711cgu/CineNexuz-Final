import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { moviesAPI } from '../lib/api';
import { MovieCard, MovieCardSkeleton } from '../components/MovieCard';
import { Button } from '../components/ui/button';
import { ChevronLeft, Film, Loader2 } from 'lucide-react';

const STUDIO_METADATA = {
  netflix: {
    name: 'Netflix',
    tagline: 'See What\'s Next',
    description: 'Stream unlimited movies, TV shows, and original content from around the globe.',
    color: 'from-[#0f0000] via-[#1f0a0a] to-[#0d0505]',
    accent: '#E50914',
    glow: 'rgba(229, 9, 20, 0.15)',
    logo: (
      <img src="/logos/Netflix_icon.svg" className="h-16 w-auto object-contain" alt="Netflix" />
    )
  },
  prime: {
    name: 'Amazon Prime Video',
    tagline: 'For People Who Love Great Entertainment',
    description: 'Watch exclusive Prime Originals, popular movies, award-winning series, and live sports.',
    color: 'from-[#000511] via-[#00102b] to-[#000511]',
    accent: '#00A8E1',
    glow: 'rgba(0, 168, 225, 0.15)',
    logo: (
      <img src="/logos/Amazon_Prime_Video_blue_logo_1.svg" className="h-12 w-auto object-contain" alt="Amazon Prime Video" />
    )
  },
  apple: {
    name: 'Apple TV+',
    tagline: 'Stories that Move You',
    description: 'Discover critically acclaimed Apple Original series and movies, star-studded dramas, and documentaries.',
    color: 'from-[#0a0a0a] via-[#1c1c1c] to-[#0a0a0a]',
    accent: '#FFFFFF',
    glow: 'rgba(255, 255, 255, 0.1)',
    logo: (
      <img src="/logos/Apple_TV_logo.svg" className="h-12 w-auto object-contain" alt="Apple TV+" />
    )
  },
  hbo: {
    name: 'HBO Max',
    tagline: 'The One to Watch',
    description: 'Experience groundbreaking series, blockbuster movies, family favorites, and Max Originals.',
    color: 'from-[#0c001f] via-[#1a003b] to-[#0c001f]',
    accent: '#9F7AEA',
    glow: 'rgba(159, 122, 234, 0.15)',
    logo: (
      <img src="/logos/HBO_Max_(2025).svg" className="h-12 w-auto object-contain" alt="HBO Max" />
    )
  },
  hotstar: {
    name: 'JioHotstar',
    tagline: 'India\'s Ultimate Entertainment Destination',
    description: 'Watch the biggest Indian blockbusters, live cricket, Marvel, Disney classics, and exclusive Hotstar Specials.',
    color: 'from-[#020d1c] via-[#051a36] to-[#020d1c]',
    accent: '#FFCC00',
    glow: 'rgba(255, 204, 0, 0.15)',
    logo: (
      <img src="/logos/JioHotstar_2025.png" className="h-16 w-auto object-contain" alt="JioHotstar" />
    )
  },
  disney: {
    name: 'Disney+',
    tagline: 'Stories You Live, Worlds You Imagine',
    description: 'Immerse yourself in beloved animated classics, modern blockbusters, Pixar masterpieces, and the entire Star Wars and Marvel universes.',
    color: 'from-[#040813] via-[#0D1527] to-[#020409]',
    accent: '#113CCF',
    glow: 'rgba(17, 60, 207, 0.2)',
    logo: (
      <svg className="h-16 w-auto" viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 90 Q 200 10 380 90" stroke="#00D4FF" strokeWidth="4" fill="none" strokeDasharray="6 6" />
        <path d="M250 35 Q 260 20 270 35 Q 280 50 250 80 Q 220 50 230 35 Z" fill="#00D4FF" />
        <text x="30" y="85" fill="#113CCF" fontSize="68" fontWeight="900" fontFamily="Georgia, serif" letterSpacing="-2">Disney</text>
        <text x="285" y="80" fill="#00D4FF" fontSize="72" fontWeight="900" fontFamily="Space Grotesk, sans-serif">+</text>
      </svg>
    )
  },
  peacock: {
    name: 'Peacock',
    tagline: 'Stream What You Love',
    description: 'Discover popular laugh-out-loud comedies, classic animation, family blockbusters, and direct-to-digital films that entertain everyone.',
    color: 'from-[#0A0710] via-[#130E20] to-[#040306]',
    accent: '#FF6B35',
    glow: 'rgba(255, 107, 53, 0.15)',
    logo: (
      <svg className="h-16 w-auto" viewBox="0 0 350 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="170" cy="35" r="10" fill="#FFCC00" />
        <circle cx="190" cy="40" r="10" fill="#FF6B35" />
        <circle cx="210" cy="55" r="10" fill="#FF007F" />
        <circle cx="150" cy="40" r="10" fill="#00D4FF" />
        <circle cx="130" cy="55" r="10" fill="#00FF66" />
        <text x="25" y="85" fill="#1A1A1A" fontSize="72" fontWeight="900" fontFamily="Space Grotesk, sans-serif" letterSpacing="-1">peacock</text>
      </svg>
    )
  },
  paramount: {
    name: 'Paramount+',
    tagline: 'A Mountain of Entertainment',
    description: 'Embark on high-octane action missions, spectacular sci-fi spectacles, animated comedies, and epic Hollywood adventures.',
    color: 'from-[#051026] via-[#0A1C3B] to-[#020712]',
    accent: '#0064FF',
    glow: 'rgba(0, 100, 255, 0.2)',
    logo: (
      <svg className="h-16 w-auto" viewBox="0 0 450 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M60 90 L95 30 L130 90 Z" stroke="#0064FF" strokeWidth="6" fill="none" strokeLinejoin="round" />
        <circle cx="95" cy="20" r="3" fill="#FFFFFF" />
        <circle cx="75" cy="30" r="3" fill="#FFFFFF" />
        <circle cx="65" cy="45" r="3" fill="#FFFFFF" />
        <circle cx="62" cy="65" r="3" fill="#FFFFFF" />
        <circle cx="115" cy="30" r="3" fill="#FFFFFF" />
        <circle cx="125" cy="45" r="3" fill="#FFFFFF" />
        <circle cx="128" cy="65" r="3" fill="#FFFFFF" />
        <text x="155" y="85" fill="#020712" fontSize="62" fontWeight="900" fontFamily="Space Grotesk, sans-serif" fontStyle="italic" letterSpacing="-2">Paramount</text>
        <text x="390" y="80" fill="#0064FF" fontSize="72" fontWeight="900" fontFamily="Space Grotesk, sans-serif">+</text>
      </svg>
    )
  },
  aha: {
    name: 'Aha',
    tagline: '100% Telugu & Tamil Entertainment',
    description: 'Discover local movies, web series, reality shows, and regional content made for the ultimate south cinema experience.',
    color: 'from-[#2d0a00] via-[#521c00] to-[#2d0a00]',
    accent: '#FF5722',
    glow: 'rgba(255, 87, 34, 0.15)',
    logo: (
      <img src="/logos/Aha_OTT_Logo.svg" className="h-12 w-auto object-contain" alt="Aha" />
    )
  },
  crunchyroll: {
    name: 'Crunchyroll',
    tagline: 'Anime. Anytime. Anywhere.',
    description: 'Stream the world\'s largest library of anime, direct-from-Japan simulcasts, movies, and exclusive originals.',
    color: 'from-[#1c0e00] via-[#3d1f00] to-[#1c0e00]',
    accent: '#FF9900',
    glow: 'rgba(255, 153, 0, 0.15)',
    logo: (
      <img src="/logos/Cib-crunchyroll_(CoreUI_Icons_v1.0.0)_orange.svg" className="h-12 w-auto object-contain" alt="Crunchyroll" />
    )
  }
};

export default function StudioPage() {
  const { id } = useParams();
  const studio = STUDIO_METADATA[id];

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    async function loadStudioInitial() {
      if (!studio) return;
      setLoading(true);
      setError(null);
      try {
        const response = await moviesAPI.studio(id, { skip: 0, limit: 30 });
        setMovies(response.data.movies || []);
        setTotal(response.data.total || 0);
        setHasMore(response.data.has_more || false);
      } catch (err) {
        console.error('Failed to load studio movies:', err);
        setError('Failed to load this studio\'s catalog. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    loadStudioInitial();
  }, [id, studio]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextSkip = movies.length;
    try {
      const response = await moviesAPI.studio(id, { skip: nextSkip, limit: 30 });
      const newMovies = response.data.movies || [];
      setMovies(prev => [...prev, ...newMovies]);
      setHasMore(response.data.has_more || false);
    } catch (err) {
      console.error('Failed to load more studio movies:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (!studio) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center py-20 px-6 max-w-sm">
          <Film size={48} className="mx-auto mb-4 text-[hsl(var(--muted-foreground))]" />
          <h3 className="text-xl font-semibold mb-2">Studio Not Found</h3>
          <p className="text-[hsl(var(--muted-foreground))] mb-6">
            We don't support a dedicated channel for "{id}" yet.
          </p>
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-white pb-16">
      <div className={`relative pt-24 pb-16 md:py-28 overflow-hidden bg-gradient-to-b ${studio.color} border-b border-white/5`}>
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none opacity-40 transition-all duration-1000"
          style={{ backgroundColor: studio.accent }}
        />

        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: `linear-gradient(${studio.accent} 1px, transparent 1px), linear-gradient(90deg, ${studio.accent} 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
        }} />

        <div className="relative px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 text-sm font-medium transition-colors">
              <ChevronLeft size={16} /> Back to Hub
            </Link>
            
            <div className="mb-6 inline-flex bg-white px-6 py-4 rounded-2xl shadow-xl border border-white/10 drop-shadow-[0_0_30px_rgba(0,0,0,0.5)] items-center justify-center">
              {studio.logo}
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ fontFamily: 'Space Grotesk' }}>
              {studio.name} Catalog
            </h1>
            <p className="text-lg md:text-xl font-medium text-white/80 mb-3 italic">
              "{studio.tagline}"
            </p>
            <p className="text-base text-white/60 leading-relaxed max-w-xl">
              {studio.description}
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl md:min-w-[200px] border border-white/10 flex flex-col items-center justify-center text-center self-start md:self-center">
            <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60" style={{ fontFamily: 'Space Grotesk' }}>
              {total}
            </span>
            <span className="text-xs uppercase tracking-widest text-white/50 mt-1 font-semibold">Movies Available</span>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto py-12">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array(18).fill(0).map((_, i) => <MovieCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20">
            <Film size={48} className="mx-auto mb-4 text-white/20" />
            <h3 className="text-xl font-semibold mb-2">No Movies Found</h3>
            <p className="text-white/40 mb-6">
              We're currently importing more movies for the {studio.name} network.
            </p>
            <Link to="/">
              <Button>Explore Hub</Button>
            </Link>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
            >
              {movies.map((movie, index) => (
                <motion.div
                  key={movie._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(index * 0.02, 0.5) }}
                >
                  <MovieCard movie={movie} />
                </motion.div>
              ))}
            </motion.div>

            {hasMore && (
              <div className="flex justify-center mt-12">
                <Button 
                  onClick={handleLoadMore} 
                  disabled={loadingMore}
                  variant="outline"
                  className="px-8 border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-medium"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    'Load More Masterpieces'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
