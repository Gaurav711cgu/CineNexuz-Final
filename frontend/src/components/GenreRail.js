import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { GenreCard } from './GenreCard';

export function GenreRail() {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/genres/stats`);
        const data = await response.json();
        // Show top 8 genres
        setGenres((data.genres || []).slice(0, 8));
      } catch (error) {
        console.error('Failed to fetch genres:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, []);

  if (loading) {
    return (
      <div className="mb-12">
        <div className="mb-6 px-1">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
            Browse by Genre
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="min-w-[240px] h-[200px] rounded-xl bg-[hsl(var(--muted))] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (genres.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      <div className="mb-6 px-1 flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
            Browse by Genre
          </h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Discover your next favorite movie
          </p>
        </div>
        <Link 
          to="/genres" 
          className="text-sm text-[hsl(var(--primary))] hover:underline flex items-center gap-1 font-semibold"
          style={{ fontFamily: 'Space Grotesk' }}
        >
          View All <ChevronRight size={16} />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
        {genres.map((genre, index) => (
          <motion.div
            key={genre.genre}
            className="min-w-[260px]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
          >
            <GenreCard genre={{ name: genre.genre }} count={genre.count} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
