import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface ThemeContextType {
  themeMode: 'light' | 'dark';
  accentColor: string;
  setThemeMode: (mode: 'light' | 'dark') => void;
  setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ACCENT_COLORS = {
  cyberSky: '#38bdf8', // Cyber Sky (Acento de IA)
  quantumGreen: '#10b981', // Quantum Green (Acento de Ciência)
  auraViolet: '#a78bfa', // Aura Violet (Acento de Insight)
  white: '#ffffff',
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { userData, updateUserData } = useAuth();

  const themeMode = userData?.themeMode || 'dark';
  const accentColor = userData?.accentColor || 'cyberSky';

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Handle dark/light mode
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Handle accent color
    const hexColor = ACCENT_COLORS[accentColor as keyof typeof ACCENT_COLORS] || ACCENT_COLORS.cyberSky;
    root.style.setProperty('--color-primary', hexColor);
    
    // If accent is white in light mode, it might be invisible. Let's make it black in light mode.
    if (accentColor === 'white' && themeMode === 'light') {
      root.style.setProperty('--color-primary', '#000000');
      root.style.setProperty('--color-primary-foreground', '#ffffff');
    } else if (accentColor === 'white' && themeMode === 'dark') {
      root.style.setProperty('--color-primary', '#ffffff');
      root.style.setProperty('--color-primary-foreground', '#000000');
    } else {
      root.style.setProperty('--color-primary-foreground', '#ffffff');
    }

  }, [themeMode, accentColor]);

  const setThemeMode = (mode: 'light' | 'dark') => {
    updateUserData({ themeMode: mode });
  };

  const setAccentColor = (color: string) => {
    updateUserData({ accentColor: color as any });
  };

  return (
    <ThemeContext.Provider value={{ themeMode, accentColor, setThemeMode, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
