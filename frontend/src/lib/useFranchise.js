import { useState, useEffect } from 'react';
import { collectionsAPI } from './api';

/**
 * Fetch franchise / collection info for a specific movie.
 * Returns { belongs_to_collection, collection, current_part }.
 * @param {string} movieId
 */
export function useFranchise(movieId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!movieId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    collectionsAPI.movieFranchise(movieId)
      .then(res => { if (!cancelled) setData(res.data); })
      .catch(err => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [movieId]);

  return { data, loading, error };
}
