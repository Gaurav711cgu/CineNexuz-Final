import { useState, useEffect } from 'react';
import { collectionsAPI } from './api';

/**
 * Fetch paginated list of franchise collections.
 * @param {object} params  - { q, page, limit }
 */
export function useCollections(params = {}) {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    collectionsAPI.list(params)
      .then(res => {
        if (cancelled) return;
        setData(res.data.collections || []);
        setPagination(res.data.pagination || null);
      })
      .catch(err => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.q, params.page, params.limit]);

  return { data, pagination, loading, error };
}
