import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'tools:favorites';

interface FavoritesContextValue {
  favorites: string[];
  isFavorite: (path: string) => boolean;
  toggleFavorite: (path: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function load(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === 'string') : [];
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(load);

  const toggleFavorite = useCallback((path: string) => {
    setFavorites((current) => {
      const next = current.includes(path) ? current.filter((p) => p !== path) : [...current, path];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage can be unavailable (private mode); favorites then last for the session only.
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ favorites, isFavorite: (path: string) => favorites.includes(path), toggleFavorite }),
    [favorites, toggleFavorite],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used inside FavoritesProvider');
  return ctx;
}
