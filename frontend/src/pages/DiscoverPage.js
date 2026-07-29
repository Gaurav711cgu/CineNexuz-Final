import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { moviesAPI, aiAPI } from '../lib/api';
import { MovieCard, MovieCardSkeleton } from '../components/MovieCard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group';
import { Compass, Filter, Sparkles } from 'lucide-react';

const MOODS = [
  { value: 'happy', label: 'Feel Good', emoji: 'Cozy' },
  { value: 'excited', label: 'Thrilling', emoji: 'Dark' },
  { value: 'thoughtful', label: 'Mind-bending', emoji: 'Cerebral' },
  { value: 'romantic', label: 'Romantic', emoji: 'Romance' },
  { value: 'scared', label: 'Scary', emoji: 'Horror' },
  { value: 'adventurous', label: 'Adventure', emoji: 'Epic' },
];

export default function DiscoverPage() {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [moodMovies, setMoodMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moodLoading, setMoodLoading] = useState(false);
  const [sort, setSort] = useState('popularity');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    moviesAPI.genres().then(res => setGenres(res.data.genres || [])).catch(() => {});
  }, []);

  useEffect(() => {
    async function loadInitial() {
      setLoading(true);
      try {
        const res = await moviesAPI.list({ page: 1, genre: selectedGenre || undefined, sort });
        setMovies(res.data.movies || []);
        setTotalPages(res.data.pages || 1);
        setHasMore(1 < (res.data.pages || 1));
        setPage(1);
      } catch (err) {
        console.error('Failed to load:', err);
      }
      setLoading(false);
    }
    loadInitial();
  }, [selectedGenre, sort]);

  const loadMore = async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await moviesAPI.list({ page: nextPage, genre: selectedGenre || undefined, sort });
      const newMovies = res.data.movies || [];
      setMovies(prev => {
        // Prevent duplicate keys
        const existingIds = new Set(prev.map(m => m._id));
        const filteredNew = newMovies.filter(m => !existingIds.has(m._id));
        return [...prev, ...filteredNew];
      });
      setPage(nextPage);
      setHasMore(nextPage < (res.data.pages || 1));
    } catch (err) {
      console.error('Failed to load more:', err);
    }
    setLoadingMore(false);
  };

  useEffect(() => {
    if (loading || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    }, { threshold: 0.1 });

    const target = document.getElementById('infinite-scroll-trigger');
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [page, loading, loadingMore, hasMore, selectedGenre, sort]);

  const handleMood = async (mood) => {
    setSelectedMood(mood);
    if (!mood) {
      setMoodMovies([]);
      return;
    }
    setMoodLoading(true);
    try {
      const res = await aiAPI.mood({ mood, limit: 15 });
      setMoodMovies(res.data.movies || []);
    } catch (err) {
      console.error('Mood reco failed:', err);
    }
    setMoodLoading(false);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <Compass size={28} className="text-[hsl(var(--primary))]" />
          <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>Discover</h1>
        </div>

        {/* Mood Selector */}
        <div className="glass-card rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-[hsl(var(--primary))]" />
            <span className="text-sm font-medium">What's your mood?</span>
          </div>
          <ToggleGroup
            type="single"
            value={selectedMood}
            onValueChange={handleMood}
            className="flex flex-wrap gap-2"
          >
            {MOODS.map(mood => (
              <ToggleGroupItem
                key={mood.value}
                value={mood.value}
                className="glass-card text-xs px-3 py-1.5 data-[state=on]:bg-[hsl(var(--primary))]/15 data-[state=on]:text-[hsl(var(--primary))] data-[state=on]:border-[hsl(var(--primary))]/30"
                data-testid={`mood-${mood.value}`}
              >
                {mood.emoji}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {/* Mood Results */}
        {selectedMood && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold tracking-tight mb-4" style={{ fontFamily: 'Space Grotesk' }}>
              For your "{selectedMood}" mood
            </h2>
            {moodLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {Array(5).fill(0).map((_, i) => <MovieCardSkeleton key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {moodMovies.map(m => <MovieCard key={m._id} movie={m} />)}
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Filter size={16} className="text-[hsl(var(--muted-foreground))]" />
          <Select value={selectedGenre} onValueChange={(v) => { setSelectedGenre(v === 'all' ? '' : v); }}>
            <SelectTrigger className="w-[160px] glass-card" data-testid="genre-filter">
              <SelectValue placeholder="All Genres" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {genres.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => { setSort(v); }}>
            <SelectTrigger className="w-[160px] glass-card" data-testid="sort-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity">Most Popular</SelectItem>
              <SelectItem value="vote_average">Highest Rated</SelectItem>
              <SelectItem value="release_date">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array(20).fill(0).map((_, i) => <MovieCardSkeleton key={i} />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {movies.map(m => <MovieCard key={m._id} movie={m} />)}
            </div>
            
            {/* Infinite Scroll trigger element */}
            {hasMore && (
              <div id="infinite-scroll-trigger" className="w-full mt-6 py-4 flex justify-center">
                {loadingMore ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
                    {Array(5).fill(0).map((_, i) => <MovieCardSkeleton key={i} />)}
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full border-2 border-[hsl(var(--primary))]/20 border-t-[hsl(var(--primary))] animate-spin" />
                )}
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
