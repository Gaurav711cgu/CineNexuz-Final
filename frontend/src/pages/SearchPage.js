import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { moviesAPI } from '../lib/api';
import { MovieCard, MovieCardSkeleton } from '../components/MovieCard';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Search as SearchIcon, Sparkles, X } from 'lucide-react';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [semantic, setSemantic] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [mode, setMode] = useState('');

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await moviesAPI.search(q.trim(), semantic);
      setResults(res.data.movies || []);
      setMode(res.data.mode || '');
    } catch (err) {
      console.error('Search failed:', err);
    }
    setLoading(false);
  }, [semantic]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      doSearch(q);
    }
  }, []); // eslint-disable-line

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
      doSearch(query.trim());
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-semibold tracking-tight mb-6" style={{ fontFamily: 'Space Grotesk' }}>
          Search
        </h1>

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <SearchIcon size={20} className="text-[hsl(var(--muted-foreground))] flex-shrink-0" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={semantic ? 'Describe what you want to watch...' : 'Search movies, actors, genres...'}
                className="border-0 bg-transparent focus-visible:ring-0 text-base p-0 h-auto"
                data-testid="search-input"
              />
              {query && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setQuery(''); setResults([]); setSearched(false); }}>
                  <X size={16} />
                </Button>
              )}
              <Button type="submit" size="sm" className="bg-[hsl(var(--primary))] hover:brightness-110" data-testid="search-submit-button">
                Search
              </Button>
            </div>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/8">
              <Switch
                checked={semantic}
                onCheckedChange={setSemantic}
                data-testid="semantic-search-toggle"
              />
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[hsl(var(--primary))]" />
                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                  Semantic search {semantic ? '(understands plot & mood)' : '(off)'}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array(10).fill(0).map((_, i) => <MovieCardSkeleton key={i} />)}
          </div>
        ) : searched ? (
          results.length > 0 ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                  {results.length} results
                </span>
                {mode && (
                  <Badge variant="secondary" className="text-xs">
                    {mode === 'semantic' ? 'Semantic' : 'Text'} search
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {results.map(movie => (
                  <MovieCard key={movie._id} movie={movie} />
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-xl p-12 text-center">
              <SearchIcon size={48} className="mx-auto mb-4 text-[hsl(var(--muted-foreground))]" />
              <p className="text-lg font-medium mb-2">No results found</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Try different keywords or enable semantic search
              </p>
            </div>
          )
        ) : (
          <div className="glass-card rounded-xl p-12 text-center">
            <Sparkles size={48} className="mx-auto mb-4 text-[hsl(var(--primary))] opacity-50" />
            <p className="text-lg font-medium mb-2">Discover your next favorite movie</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Search by title, genre, actor, or describe what you're in the mood for
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
