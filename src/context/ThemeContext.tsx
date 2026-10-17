import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  zoomLevel: number;
  zoomIn: () => void;
  zoomOut: () => void;
  setZoom: (level: number) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
  zoomLevel: 1.35,
  zoomIn: () => {},
  zoomOut: () => {},
  setZoom: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('nexora_theme_mode');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark';
  });

  const [zoomLevel, setZoomState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nexora_ui_zoom');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0.9 && parsed <= 1.8) return parsed;
      }
    } catch {}
    return 1.35; // To hơn 125%: mặc định 135%
  });

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem('nexora_theme_mode', mode);
    } catch {}
  };

  const applyZoom = (level: number) => {
    const root = document.documentElement;
    root.style.zoom = String(level);
    root.style.setProperty('--nx-ui-zoom', String(level));
    try {
      localStorage.setItem('nexora_ui_zoom', String(level));
    } catch {}
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    applyZoom(zoomLevel);
  }, [zoomLevel]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
  };

  const setZoom = (level: number) => {
    const clamped = Math.min(1.7, Math.max(0.95, Math.round(level * 100) / 100));
    setZoomState(clamped);
  };

  const zoomIn = () => {
    setZoomState(prev => Math.min(1.7, Math.round((prev + 0.05) * 100) / 100));
  };

  const zoomOut = () => {
    setZoomState(prev => Math.max(0.95, Math.round((prev - 0.05) * 100) / 100));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, zoomLevel, zoomIn, zoomOut, setZoom }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
