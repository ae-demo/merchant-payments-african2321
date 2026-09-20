import { useEffect, useRef, useState, useCallback } from "react";

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: string | undefined;
  reload: () => void;
}

/**
 * Fetches on mount and whenever `deps` changes, tracking loading/error state
 * so every list/detail page renders the same three shapes: loading, error,
 * and the real content. `reload()` re-runs the same fetcher (used after a
 * mutation — save, refund, payout — so the page reflects the new state
 * without a full page reload).
 */
export function useAsync<T>(fetcher: () => Promise<T>, deps: ReadonlyArray<unknown>): AsyncState<T> {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(undefined);
    fetcherRef
      .current()
      .then((result) => {
        if (live) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (live) {
          setError(err instanceof Error ? err.message : "Something went wrong");
          setLoading(false);
        }
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return { data, loading, error, reload };
}
