import type { ExpirelyItem } from '../types';

import i18n from 'i18next';
import { useState, useEffect, useCallback } from 'react';

import { listItems } from '../api';

// ----------------------------------------------------------------------

type State = {
  data: ExpirelyItem[];
  loading: boolean;
  error: string | null;
};

export function useItemList() {
  const [state, setState] = useState<State>({
    data: [],
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const result = await listItems();
      setState({ data: result.data, loading: false, error: null });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : i18n.t('expirely:errors.loadData'),
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}
