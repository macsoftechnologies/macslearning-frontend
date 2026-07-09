import { useCallback, useEffect, useState } from 'react';

/**
 * Generic paginated-list hook.
 * fetcher(params) must return an axios response shaped like:
 * { data: { data: [...], meta: { totalItems, currentPage, totalPages, limit } } }
 */
export default function usePagination(fetcher, extraParams = {}, limit = 10) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalItems: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const paramsKey = JSON.stringify(extraParams);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await fetcher({ page, limit, ...JSON.parse(paramsKey) });
      setItems(data?.data || []);
      setMeta(data?.meta || { totalItems: (data?.data || []).length, totalPages: 1 });
    } catch (err) {
      setError(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, paramsKey, reloadKey]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [paramsKey]);

  const refresh = () => setReloadKey((k) => k + 1);

  return { items, page, setPage, meta, loading, error, refresh };
}
