import { useEffect, useState } from 'react';

type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export function useAsync<T>(loader: () => Promise<T>, dependencies: unknown[] = []) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    let isMounted = true;
    setState(previous => ({ ...previous, loading: true, error: null }));

    loader()
      .then(data => {
        if (isMounted) {
          setState({ data, loading: false, error: null });
        }
      })
      .catch(error => {
        if (isMounted) {
          setState({ data: null, loading: false, error: error instanceof Error ? error.message : 'Something went wrong.' });
        }
      });

    return () => {
      isMounted = false;
    };
  }, dependencies);

  return state;
}
