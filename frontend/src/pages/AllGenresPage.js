import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Loader2, Film } from 'lucide-react';
import { Button } from '../components/ui/button';
import { GenreCard } from '../components/GenreCard';

export default function AllGenresPage() {
  const navigate = useNavigate();
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/genres/stats`);
        const data = await response.json();
        setGenres(data.genres || []);
      } catch (error) {
        console.error('Failed to fetch genres:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[hsl(var(--background))]/95 backdrop-blur-xl">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              data-testid="back-button"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/');
                }
              }}
            >
              <ChevronLeft size={20} />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3" style={{ fontFamily: 'Space Grotesk' }}>
                <Film size={28} className="text-[hsl(var(--primary))]" />
                All Genres
              </h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Discover movies by genre
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

        {!loading && genres.length === 0 && (
          <div className="text-center py-20">
            <Film size={48} className="mx-auto mb-4 text-[hsl(var(--muted-foreground))]" />
            <h3 className="text-xl font-semibold mb-2">No Genres Found</h3>
            <p className="text-[hsl(var(--muted-foreground))]">Check back soon!</p>
          </div>
        )}

        {!loading && genres.length > 0 && (
          <>
            <div className="mb-6">
              <p className="text-[hsl(var(--muted-foreground))]">
                {genres.length} genres • {genres.reduce((sum, g) => sum + g.count, 0).toLocaleString()} total movies
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {genres.map((genre, index) => (
                <motion.div
                  key={genre.genre}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.8) }}
                >
                  <GenreCard genre={{ name: genre.genre }} count={genre.count} />
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
