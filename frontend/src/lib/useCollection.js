import { useState, useEffect } from 'react';
import { collectionsAPI } from './api';

/**
 * Fetch a single franchise collection by ID or name.
 * @param {string} collectionId
 */
export function useCollection(collectionId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!collectionId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    collectionsAPI.get(collectionId)
      .then(res => { if (!cancelled) setData(res.data); })
      .catch(err => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [collectionId]);

  return { data, loading, error };
}
