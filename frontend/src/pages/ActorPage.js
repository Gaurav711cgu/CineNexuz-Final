import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { actorsAPI } from '../lib/api';
import { MovieCard } from '../components/MovieCard';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { ArrowLeft, Calendar, MapPin, Star } from 'lucide-react';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w300';

export default function ActorPage() {
  const { id } = useParams();
  const [actor, setActor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await actorsAPI.get(id);
        setActor(res.data);
      } catch (err) {
        console.error('Failed to load actor:', err);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Skeleton className="h-64 w-48 rounded-xl" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!actor) return <div className="p-6 text-center">Actor not found</div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1200px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-4 gap-2">
            <ArrowLeft size={14} /> Back
          </Button>
        </Link>

        <div className="lg:grid lg:grid-cols-[250px_1fr] gap-8">
          {/* Photo */}
          <div className="mb-6 lg:mb-0">
            <div className="w-[200px] md:w-[250px] rounded-xl overflow-hidden shadow-xl">
              {actor.profile_path ? (
                <img 
                  src={`${TMDB_IMG}${actor.profile_path}`} 
                  alt={actor.name} 
                  className="w-full" 
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=450&fit=crop';
                  }}
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-white/5 flex items-center justify-center text-4xl">
                  {actor.name?.[0]}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div>
            <h1 className="text-3xl font-semibold tracking-tight mb-2" style={{ fontFamily: 'Space Grotesk' }}>
              {actor.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {actor.birthday && (
                <div className="flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))]">
                  <Calendar size={14} /> {actor.birthday}
                </div>
              )}
              {actor.place_of_birth && (
                <div className="flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))]">
                  <MapPin size={14} /> {actor.place_of_birth}
                </div>
              )}
              <Badge variant="secondary">{actor.known_for_department || 'Acting'}</Badge>
            </div>

            {actor.biography && (
              <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))] mb-8">
                {actor.biography}
              </p>
            )}

            {/* Filmography */}
            {actor.movies?.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold tracking-tight mb-4" style={{ fontFamily: 'Space Grotesk' }}>Filmography</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {actor.movies.map(m => <MovieCard key={m._id} movie={m} />)}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
