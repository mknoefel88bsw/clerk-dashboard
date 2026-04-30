import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { Period } from '../types';

interface PersistedKeys {
  googleApiKey: string;
  anthropicApiKey: string;
  remember: boolean;
}

const STORAGE_KEY = 'clerk-dashboard-keys';

function loadPersisted(): PersistedKeys {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { googleApiKey: '', anthropicApiKey: '', remember: false };
    const obj = JSON.parse(raw);
    return {
      googleApiKey: obj.googleApiKey ?? '',
      anthropicApiKey: obj.anthropicApiKey ?? '',
      remember: !!obj.remember,
    };
  } catch {
    return { googleApiKey: '', anthropicApiKey: '', remember: false };
  }
}

interface DashboardContextValue {
  periods: Period[];
  setPeriods: Dispatch<SetStateAction<Period[]>>;
  addPeriods: (newPeriods: Period[]) => void;
  removePeriod: (id: string) => void;
  resetPeriods: () => void;

  selectedPeriodIds: Set<string>;
  toggleSelected: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;

  basePeriodId: string | null;
  setBasePeriodId: (id: string | null) => void;

  googleApiKey: string;
  setGoogleApiKey: (k: string) => void;
  anthropicApiKey: string;
  setAnthropicApiKey: (k: string) => void;
  rememberKeys: boolean;
  setRememberKeys: (v: boolean) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriodIds, setSelectedPeriodIds] = useState<Set<string>>(new Set());
  const [basePeriodId, setBasePeriodId] = useState<string | null>(null);

  const initial = useMemo(loadPersisted, []);
  const [googleApiKey, setGoogleApiKeyState] = useState(initial.googleApiKey);
  const [anthropicApiKey, setAnthropicApiKeyState] = useState(initial.anthropicApiKey);
  const [rememberKeys, setRememberKeysState] = useState(initial.remember);

  useEffect(() => {
    if (rememberKeys) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ googleApiKey, anthropicApiKey, remember: true }),
      );
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [rememberKeys, googleApiKey, anthropicApiKey]);

  const addPeriods = useCallback((newPeriods: Period[]) => {
    setPeriods((prev) => {
      const map = new Map(prev.map((p) => [p.id, p]));
      for (const np of newPeriods) map.set(np.id, np);
      const merged = Array.from(map.values()).sort((a, b) => a.sortKey - b.sortKey);
      return merged;
    });
    setSelectedPeriodIds((prev) => {
      const next = new Set(prev);
      for (const np of newPeriods) next.add(np.id);
      return next;
    });
    setBasePeriodId((prev) => {
      if (prev) return prev;
      const sorted = [...newPeriods].sort((a, b) => a.sortKey - b.sortKey);
      return sorted[0]?.id ?? null;
    });
  }, []);

  const removePeriod = useCallback((id: string) => {
    setPeriods((prev) => prev.filter((p) => p.id !== id));
    setSelectedPeriodIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setBasePeriodId((prev) => (prev === id ? null : prev));
  }, []);

  const resetPeriods = useCallback(() => {
    setPeriods([]);
    setSelectedPeriodIds(new Set());
    setBasePeriodId(null);
  }, []);

  const toggleSelected = useCallback((id: string) => {
    setSelectedPeriodIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedPeriodIds(new Set(periods.map((p) => p.id)));
  }, [periods]);

  const deselectAll = useCallback(() => setSelectedPeriodIds(new Set()), []);

  const setGoogleApiKey = useCallback((k: string) => setGoogleApiKeyState(k), []);
  const setAnthropicApiKey = useCallback((k: string) => setAnthropicApiKeyState(k), []);
  const setRememberKeys = useCallback((v: boolean) => setRememberKeysState(v), []);

  const value: DashboardContextValue = {
    periods,
    setPeriods,
    addPeriods,
    removePeriod,
    resetPeriods,
    selectedPeriodIds,
    toggleSelected,
    selectAll,
    deselectAll,
    basePeriodId,
    setBasePeriodId,
    googleApiKey,
    setGoogleApiKey,
    anthropicApiKey,
    setAnthropicApiKey,
    rememberKeys,
    setRememberKeys,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}
