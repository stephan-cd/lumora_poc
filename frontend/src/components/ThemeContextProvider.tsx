'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from '@/app/theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read from local storage
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode | null;
    if (savedMode) {
      setMode(savedMode);
    } else {
      // Fallback to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setMode(prefersDark ? 'dark' : 'light');
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextMode = mode === 'light' ? 'dark' : 'light';
    setMode(nextMode);
    localStorage.setItem('theme-mode', nextMode);
  };

  const activeTheme = mode === 'light' ? lightTheme : darkTheme;

  // Prevent flash by waiting to mount
  if (!mounted) {
    return (
      <div style={{ visibility: 'hidden', background: '#0b0f19', width: '100vw', height: '100vh' }} />
    );
  }

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={activeTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeContextProvider');
  }
  return context;
};
