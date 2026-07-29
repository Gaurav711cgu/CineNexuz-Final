import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { moviesAPI, accessAPI, paymentsAPI, watchProvidersAPI } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useFranchise } from '../lib/useFranchise';
import { useSimilarMovies } from '../lib/useSimilarMovies';
import { MovieCard, MovieCardSkeleton } from '../components/MovieCard';
import { ReviewSummary } from '../components/ReviewSummary';
import { ProviderList } from '../components/ProviderBadge';
import { VideoPlayer } from '../components/VideoPlayer';
import FranchiseSection from '../components/FranchiseSection';
import SimilarMoviesSection from '../components/SimilarMoviesSection';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import {
  Play, Star, Clock, Calendar, Globe, DollarSign,
  ShoppingCart, Ticket, Lock, ExternalLink, ChevronRight, Tv, Sparkles
} from 'lucide-react';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';
const TMDB_ORIG = 'https://image.tmdb.org/t/p/original';

function getPosterUrl(movie) {
  if (movie.poster_url_custom) return movie.poster_url_custom;
  if (movie.poster_path?.startsWith('http')) return movie.poster_path;
  if (movie.poster_path) return `${TMDB_IMG}${movie.poster_path}`;
  return '';
}
function getBackdropUrl(movie) {
  if (movie.backdrop_url_custom) return movie.backdrop_url_custom;
  if (movie.backdrop_path?.startsWith('http')) return movie.backdrop_path;
  if (movie.backdrop_path) return `${TMDB_ORIG}${movie.backdrop_path}`;
  return '';
}

export default function MovieDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [access, setAccess] = useState(null);
  const [watchProviders, setWatchProviders] = useState(null);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [streamState, setStreamState] = useState(null);
  const [loadingStream, setLoadingStream] = useState(false);
  const [synopsis, setSynopsis] = useState(null);
  const [synopsisSource, setSynopsisSource] = useState(null);

  // Franchise & similar movies via real API
  const { data: franchiseData, loading: franchiseLoading } = useFranchise(id);
  const { franchiseParts, similarMovies, loading: simLoading } = useSimilarMovies(id);

  // Synopsis enrichment — fetch AI synopsis for thin overviews
  useEffect(() => {
    if (!movie) return;
    const overview = movie.overview || '';
    if (overview.length >= 100) {
      setSynopsis(overview);
      setSynopsisSource('tmdb');
      return;
    }
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/movies/${id}/generate-synopsis`, { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        setSynopsis(data.synopsis || overview);
        setSynopsisSource(data.source || 'tmdb');
      })
      .catch(() => { setSynopsis(overview); setSynopsisSource('tmdb'); });
  }, [movie, id]);

  useEffect(() => {
    async function load() {
      try {
        const res = await moviesAPI.get(id);
        setMovie(res.data);
        
        if (user) {
          try {
            const accessRes = await accessAPI.check(id);
            setAccess(accessRes.data);
          } catch { }
        }
        
        // Fetch watch providers
        setProvidersLoading(true);
        try {
          const providersRes = await watchProvidersAPI.get(id);
          setWatchProviders(providersRes.data);
        } catch { }
        setProvidersLoading(false);
      } catch (err) {
        console.error('Failed to load movie:', err);
      }
      setLoading(false);
    }
    load();
  }, [id, user]);



  const handlePurchase = async (type) => {
    if (!user) {
      toast.error('Please sign in to purchase');
      return;
    }
    setPurchasing(true);
    try {
      const res = await paymentsAPI.checkout({
        movie_id: id,
        purchase_type: type,
        origin_url: window.location.origin,
      });
      window.location.href = res.data.url;
    } catch (err) {
      if (err.response?.status === 503) {
        toast.info('Payments are coming soon — Stripe is not yet configured.');
      } else {
        toast.error(err.response?.data?.detail || 'Stripe credentials missing. Please set your keys in the environment.');
      }
      setPurchasing(false);
    }
  };

  const handleWatchNow = async () => {
    if (!user) {
      toast.error('Please sign in to watch');
      return;
    }
    setLoadingStream(true);
    try {
      const res = await moviesAPI.stream(id);
      setStreamState(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Unable to start stream');
    } finally {
      setLoadingStream(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-[400px] w-full rounded-xl" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
    );
  }

  if (!movie) return <div className="p-6 text-center">Movie not found</div>;

  return (
    <div className="min-h-screen">
      {/* Backdrop */}
      <div className="relative h-[350px] md:h-[450px] overflow-hidden">
        <img
          src={getBackdropUrl(movie)}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&h=450&fit=crop';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--background))] via-[hsl(var(--background))]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--background))]/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 -mt-48 relative z-10">
        <div className="lg:grid lg:grid-cols-[300px_1fr] gap-8 max-w-[1400px]">
          {/* Poster */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-xl overflow-hidden shadow-2xl w-[200px] md:w-[300px]">
              <img
                src={getPosterUrl(movie)}
                alt={movie.title}
                className="w-full"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1563089145-599997674d42?w=300&h=450&fit=crop';
                }}
              />
            </div>
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2 break-words" style={{ fontFamily: 'Space Grotesk' }}>
              {movie.title}
            </h1>
            {movie.tagline && (
              <p className="text-[hsl(var(--muted-foreground))] italic mb-4 break-words">"{movie.tagline}"</p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                <span className="font-semibold tabular-nums">{movie.vote_average?.toFixed(1)}</span>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">({movie.vote_count} votes)</span>
              </div>
              {movie.runtime > 0 && (
                <div className="flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))]">
                  <Clock size={14} /> {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                </div>
              )}
              {movie.release_date && (
                <div className="flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))]">
                  <Calendar size={14} /> {movie.release_date}
                </div>
              )}
              {movie.original_language && (
                <div className="flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))]">
                  <Globe size={14} /> {movie.original_language.toUpperCase()}
                </div>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-6">
              {movie.genres?.map(g => (
                <Badge key={g} variant="secondary" className="text-xs">{g}</Badge>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 mb-6">
              {movie.has_video && access?.allowed ? (
                <Button
                  className="bg-[hsl(var(--primary))] hover:brightness-110 gap-2 glow-purple"
                  data-testid="movie-watch-button"
                  onClick={handleWatchNow}
                  disabled={loadingStream}
                >
                  <Play size={16} fill="white" /> Watch Now
                </Button>
              ) : (
                <>
                  <Button
                    className="bg-[hsl(var(--primary))] hover:brightness-110 gap-2"
                    onClick={() => handlePurchase('rent')}
                    disabled={purchasing}
                    data-testid="movie-rent-button"
                  >
                    <DollarSign size={16} /> Rent ${movie.rent_price?.toFixed(2)}
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 bg-white/5 border-white/10 hover:bg-white/10"
                    onClick={() => handlePurchase('buy')}
                    disabled={purchasing}
                    data-testid="movie-buy-button"
                  >
                    <ShoppingCart size={16} /> Buy ${movie.buy_price?.toFixed(2)}
                  </Button>
                </>
              )}
              {!movie.has_video && (
                <Badge variant="secondary" className="self-center">Not available for streaming</Badge>
              )}
              {movie.in_theatres && (
                <Link to={`/theatre?movie=${movie._id}`}>
                  <Button variant="outline" className="gap-2 bg-white/5 border-white/10 hover:bg-white/10" data-testid="movie-book-tickets-button">
                    <Ticket size={16} /> Book Tickets
                  </Button>
                </Link>
              )}
            </div>

            {/* Access info */}
            {access && !access.allowed && (
              <div className="glass-card rounded-lg p-3 mb-6 flex items-center gap-3 text-sm">
                <Lock size={16} className="text-[hsl(var(--muted-foreground))]" />
                <span className="text-[hsl(var(--muted-foreground))]">{access.message}</span>
              </div>
            )}

            {/* Trailer */}
            {movie.trailer_key && (
              <div className="mb-6">
                <a
                  href={`https://www.youtube.com/watch?v=${movie.trailer_key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card rounded-xl p-4 flex items-center gap-3 hover:bg-white/8 transition-colors"
                  data-testid="movie-trailer-link"
                >
                  <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                    <Play size={16} fill="white" className="ml-0.5" />
                  </div>
                  <div>
                    <span className="text-sm font-medium">Watch Trailer</span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))] block">on YouTube</span>
                  </div>
                  <ExternalLink size={14} className="ml-auto text-[hsl(var(--muted-foreground))]" />
                </a>
              </div>
            )}

            {/* Where to Watch - OTT Providers */}
            {watchProviders && (
              <div className="mb-8 p-6 rounded-xl bg-[hsl(var(--card))] border border-white/10" data-testid="watch-providers-section">
                <div className="flex items-center gap-3 mb-4">
                  <Tv size={24} className="text-[hsl(var(--accent))]" />
                  <h3 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk' }}>
                    Where to Watch
                  </h3>
                </div>

                <ProviderList 
                  providers={{
                    flatrate: watchProviders.flatrate || [],
                    rent: watchProviders.rent || [],
                    buy: watchProviders.buy || [],
                    ads: watchProviders.ads || []
                  }}
                  watchLink={watchProviders.justwatch_link || watchProviders.tmdb_link}
                />

                {/* TMDB link */}
                {watchProviders.tmdb_link && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <a 
                      href={watchProviders.tmdb_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] 
                        inline-flex items-center gap-2 transition-colors"
                    >
                      <span>View all streaming options</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                )}
              </div>
            )}

            {providersLoading && (
              <div className="mb-6 text-xs text-[hsl(var(--muted-foreground))]">
                <Skeleton className="h-12 w-48" />
              </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue={franchiseParts.length > 0 ? "franchise" : "overview"} className="mt-6">
              <TabsList className="bg-white/5">
                {franchiseParts.length > 0 && (
                  <TabsTrigger value="franchise" data-testid="movie-tab-franchise">More Like This</TabsTrigger>
                )}
                <TabsTrigger value="overview" data-testid="movie-tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="cast" data-testid="movie-tab-cast">Cast</TabsTrigger>
                <TabsTrigger value="similar" data-testid="movie-tab-similar">Similar</TabsTrigger>
              </TabsList>

              {/* Franchise/More Like This Tab */}
              {franchiseParts.length > 0 && (
                <TabsContent value="franchise" className="mt-4">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold">From the Same Franchise</h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Continue your journey in this universe</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {franchiseParts.map(m => (
                      <MovieCard key={m._id} movie={m} />
                    ))}
                  </div>
                </TabsContent>
              )}

              <TabsContent value="overview" className="mt-4">
                <div className="space-y-6">
                  {synopsis ? (
                    <div>
                      <p className="text-sm md:text-base leading-relaxed text-[hsl(var(--muted-foreground))] break-words">
                        {synopsis}
                      </p>
                      {synopsisSource === 'ai_generated' && (
                        <p className="text-xs text-violet-400/60 mt-2 flex items-center gap-1">
                          <Sparkles size={10} /> AI-enhanced synopsis
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="h-4 bg-white/5 rounded animate-pulse w-full" />
                      <div className="h-4 bg-white/5 rounded animate-pulse w-5/6" />
                      <div className="h-4 bg-white/5 rounded animate-pulse w-4/6" />
                    </div>
                  )}

                  {/* AI Review Summary */}
                  <ReviewSummary movieId={id} />
                </div>
              </TabsContent>

              <TabsContent value="cast" className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {movie.cast?.map(actor => (
                    <Link key={actor._id} to={`/actor/${actor._id}`} className="glass-card rounded-xl p-3 hover:bg-white/8 transition-colors" data-testid={`cast-card-${actor.tmdb_id}`}>
                      <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-2 bg-white/5">
                        {actor.profile_path ? (
                          <img 
                            src={`${TMDB_IMG}${actor.profile_path}`} 
                            alt={actor.name} 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">
                            {actor.name?.[0]}
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium text-center truncate">{actor.name}</p>
                      <p className="text-xs text-center text-[hsl(var(--muted-foreground))] truncate">{actor.character}</p>
                    </Link>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="similar" className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {(similarMovies && similarMovies.length > 0 ? similarMovies : (movie.similar || [])).map(m => (
                    <MovieCard key={m._id} movie={m} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Franchise Timeline */}
            {(franchiseLoading || franchiseData?.belongs_to_collection) && (
              <FranchiseSection
                collection={franchiseData?.collection}
                currentMovieId={id}
                loading={franchiseLoading}
              />
            )}

            {/* Similar Movies + Franchise Parts */}
            <SimilarMoviesSection
              franchiseParts={franchiseParts}
              similarMovies={similarMovies}
              loading={simLoading}
            />
          </motion.div>
        </div>
      </div>
      {streamState && (
        <VideoPlayer
          streamUrl={streamState.stream_url}
          movieId={id}
          resumePosition={streamState.resume_position}
          movieTitle={movie.title}
          onClose={() => setStreamState(null)}
        />
      )}
    </div>
  );
}
