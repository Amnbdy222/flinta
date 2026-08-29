import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StoreSettings } from '../types/database.types';
import { fetchStoreSettings, DEFAULT_STORE_SETTINGS } from '../services/storeSettingsService';

interface StoreSettingsContextType {
  settings: StoreSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const StoreSettingsContext = createContext<StoreSettingsContextType>({
  settings: DEFAULT_STORE_SETTINGS,
  loading: true,
  refreshSettings: async () => {},
});

export const StoreSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const data = await fetchStoreSettings();
      setSettings(data);
    } catch (err) {
      console.warn('Failed to load store settings, using fallback defaults:', err);
      setSettings(DEFAULT_STORE_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <StoreSettingsContext.Provider
      value={{
        settings,
        loading,
        refreshSettings: loadSettings,
      }}
    >
      {children}
    </StoreSettingsContext.Provider>
  );
};

export const useStoreSettings = () => {
  const context = useContext(StoreSettingsContext);
  if (!context) {
    throw new Error('useStoreSettings must be used within a StoreSettingsProvider');
  }
  return context;
};
