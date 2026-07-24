import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface ThemeContextType {
  themeMode: 'light' | 'dark';
  accentColor: string;
  setThemeMode: (mode: 'light' | 'dark') => void;
  setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Mesmos 4 temas da landing page (client/src/pages/LandingPage.tsx THEMES) — manter em sincronia.
export const ACCENT_COLORS = {
  teal:    { a1: '#22D3EE', a2: '#14B8A6', a3: '#10B981' },
  lilac:   { a1: '#DDD6FE', a2: '#A78BFA', a3: '#8B5CF6' },
  blue:    { a1: '#93C5FD', a2: '#60A5FA', a3: '#3B82F6' },
  neutral: { a1: '#CBD5E1', a2: '#94A3B8', a3: '#475569' },
};

// Remapeamento 1:1 dos valores antigos (esquema cyberSky/quantumGreen/auraViolet/white),
// inclusive o default de banco 'blue' que não batia com nenhuma chave válida antes desta troca.
const LEGACY_ACCENT_REMAP: Record<string, keyof typeof ACCENT_COLORS> = {
  cyberSky: 'blue',
  quantumGreen: 'teal',
  auraViolet: 'lilac',
  white: 'neutral',
};

function normalizeAccent(color: string | undefined): keyof typeof ACCENT_COLORS {
  if (color && color in ACCENT_COLORS) return color as keyof typeof ACCENT_COLORS;
  if (color && color in LEGACY_ACCENT_REMAP) return LEGACY_ACCENT_REMAP[color];
  return 'blue';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { userData, updateUserData } = useAuth();

  // Estados locais para quando o usuário não está logado
  const [localThemeMode, setLocalThemeMode] = useState<'light' | 'dark'>(() => {
    const val = localStorage.getItem('tutorai_temp_theme');
    return (val === 'light' || val === 'dark') ? val : 'dark';
  });
  const [localAccentColor, setLocalAccentColor] = useState<string>(() => {
    return localStorage.getItem('tutorai_temp_accent') || 'blue';
  });

  const themeMode = userData ? userData.themeMode : localThemeMode;
  const accentColor = normalizeAccent(userData ? userData.accentColor : localAccentColor);

  // Sincroniza as configurações temporárias para as configs reais do usuário após logar
  useEffect(() => {
    if (userData) {
      const tempTheme = localStorage.getItem('tutorai_temp_theme') as 'light' | 'dark' | null;
      const tempAccent = localStorage.getItem('tutorai_temp_accent');

      if (tempTheme || tempAccent) {
        updateUserData({
          themeMode: tempTheme || userData.themeMode,
          accentColor: (tempAccent || userData.accentColor) as any
        }).then(() => {
          localStorage.removeItem('tutorai_temp_theme');
          localStorage.removeItem('tutorai_temp_accent');
        }).catch(err => {
          console.error('Falha ao exportar tema temporário para as configs do usuário:', err);
        });
      }
    }
  }, [userData, updateUserData]);

  // Migra automaticamente uma conta com valor de acento no esquema antigo pro novo, uma vez.
  useEffect(() => {
    if (userData && userData.accentColor && !(userData.accentColor in ACCENT_COLORS)) {
      const remapped = normalizeAccent(userData.accentColor);
      updateUserData({ accentColor: remapped as any }).catch(err => {
        console.error('Falha ao migrar cor de acento antiga:', err);
      });
    }
  }, [userData, updateUserData]);

  useEffect(() => {
    const root = window.document.documentElement;

    // Configura o tema dark/light
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Configura os 3 stops do gradiente de acento + --color-primary derivado (= a2),
    // mantido por compatibilidade com as ~300 classes bg-primary/text-primary/border-primary já em uso.
    const theme = ACCENT_COLORS[accentColor];
    root.style.setProperty('--color-a1', theme.a1);
    root.style.setProperty('--color-a2', theme.a2);
    root.style.setProperty('--color-a3', theme.a3);
    root.style.setProperty('--color-primary', theme.a2);

    // Contraste do acento neutro (antigo "white"): preto no claro, branco no escuro.
    if (accentColor === 'neutral' && themeMode === 'light') {
      root.style.setProperty('--color-primary', '#000000');
      root.style.setProperty('--color-primary-foreground', '#ffffff');
    } else if (accentColor === 'neutral' && themeMode === 'dark') {
      root.style.setProperty('--color-primary', '#ffffff');
      root.style.setProperty('--color-primary-foreground', '#000000');
    } else {
      root.style.setProperty('--color-primary-foreground', '#ffffff');
    }

  }, [themeMode, accentColor]);

  const setThemeMode = (mode: 'light' | 'dark') => {
    if (userData) {
      updateUserData({ themeMode: mode });
    } else {
      localStorage.setItem('tutorai_temp_theme', mode);
      setLocalThemeMode(mode);
    }
  };

  const setAccentColor = (color: string) => {
    if (userData) {
      updateUserData({ accentColor: color as any });
    } else {
      localStorage.setItem('tutorai_temp_accent', color);
      setLocalAccentColor(color);
    }
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
