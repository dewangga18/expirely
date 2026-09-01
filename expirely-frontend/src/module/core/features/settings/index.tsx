// Minimal settings module for Expirely

import { useMemo, useState, useContext, useCallback, createContext } from 'react';

// ----------------------------------------------------------------------

export type SettingsState = {
  themeColorPresets: string;
  themeMode: string;
  themeLayout: string;
  themeStretch: boolean;
  themeContrast: string;
  direction: 'ltr' | 'rtl';
  compact: boolean;
  compactLayout: boolean;
  navColor: string;
  dashboardLayout: string;
  navLayout: string;
  fontFamily: string;
  fontSize: number;
  contrast: string;
  primaryColor: 'default' | 'preset1' | 'preset2' | 'preset3';
};

export const defaultSettings: SettingsState = {
  themeColorPresets: 'default',
  themeMode: 'light',
  themeLayout: 'vertical',
  themeStretch: false,
  themeContrast: 'default',
  direction: 'ltr',
  compact: false,
  navColor: 'integrate',
  dashboardLayout: 'vertical',
  navLayout: 'vertical',
  compactLayout: false,
  fontFamily: 'Inter, sans-serif',
  fontSize: 14,
  contrast: 'default',
  primaryColor: 'default',
};

type SettingsContextValue = {
  state: SettingsState;
  onUpdate: (settings: Partial<SettingsState>) => void;
  onReset: () => void;
  setField: (key: string, value: unknown) => void;
  canReset: boolean;
  onToggleDrawer: () => void;
};

const SettingsContext = createContext<SettingsContextValue>({
  state: defaultSettings,
  onUpdate: () => {},
  onReset: () => {},
  setField: () => {},
  canReset: false,
  onToggleDrawer: () => {},
});

export function useSettingsContext() {
  return useContext(SettingsContext);
}

export function SettingsProvider({
  children,
  defaultSettings: defaults,
}: {
  children: React.ReactNode;
  defaultSettings?: SettingsState;
}) {
  const [state, setState] = useState<SettingsState>(defaults ?? defaultSettings);

  const onUpdate = useCallback((update: Partial<SettingsState>) => {
    setState((prev) => ({ ...prev, ...update }));
  }, []);

  const onReset = useCallback(() => {
    setState(defaults ?? defaultSettings);
  }, [defaults]);

  const setField = useCallback((key: string, value: unknown) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const onToggleDrawer = useCallback(() => {}, []);

  const canReset = useMemo(
    () => JSON.stringify(state) !== JSON.stringify(defaults ?? defaultSettings),
    [state, defaults]
  );

  const value = useMemo(
    () => ({ state, onUpdate, onReset, setField, canReset, onToggleDrawer }),
    [state, onUpdate, onReset, setField, canReset, onToggleDrawer]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function SettingsDrawer({
  defaultSettings: _defaults,
}: {
  defaultSettings?: SettingsState;
}) {
  return null;
}
