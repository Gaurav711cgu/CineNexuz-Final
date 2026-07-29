import { useState, useEffect } from 'react';
import { collectionsAPI } from './api';

/**
 * Fetch both similar movies AND franchise sibling parts for a movie.
 * Returns { franchiseParts, similarMovies }.
 * @param {string} movieId
 */
export function useSimilarMovies(movieId) {
  const [franchiseParts, setFranchiseParts] = useState([]);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!movieId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    collectionsAPI.movieSimilar(movieId)
      .then(res => {
        if (cancelled) return;
        setFranchiseParts(res.data.franchise_parts || []);
        setSimilarMovies(res.data.similar_movies || []);
      })
      .catch(err => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [movieId]);

  return { franchiseParts, similarMovies, loading, error };
}
