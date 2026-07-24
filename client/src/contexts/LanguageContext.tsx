import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { dictionaries, type Locale, type Namespace } from '../locales';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const VALID_LOCALES: Locale[] = ['pt', 'en', 'es'];

function normalizeLocale(value: string | undefined): Locale {
  return (value && (VALID_LOCALES as string[]).includes(value)) ? (value as Locale) : 'pt';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { userData, updateUserData } = useAuth();

  // Estado local pra quando o usuário não está logado — mesmo padrão do ThemeContext.
  const [localLocale, setLocalLocale] = useState<Locale>(() => {
    return normalizeLocale(localStorage.getItem('tutorai_temp_locale') || undefined);
  });

  const locale = normalizeLocale(userData ? userData.locale : localLocale);

  // Migra o idioma temporário (deslogado) pra conta real assim que o usuário loga.
  useEffect(() => {
    if (userData) {
      const tempLocale = localStorage.getItem('tutorai_temp_locale');
      if (tempLocale) {
        updateUserData({ locale: normalizeLocale(tempLocale) as any }).then(() => {
          localStorage.removeItem('tutorai_temp_locale');
        }).catch(err => {
          console.error('Falha ao exportar idioma temporário para a conta:', err);
        });
      }
    }
  }, [userData, updateUserData]);

  const setLocale = (newLocale: Locale) => {
    if (userData) {
      updateUserData({ locale: newLocale as any });
    } else {
      localStorage.setItem('tutorai_temp_locale', newLocale);
      setLocalLocale(newLocale);
    }
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

/**
 * Hook de tradução por namespace. Cai pro português e, na falta disso, pra própria
 * chave — nunca renderiza `undefined` mesmo se uma string não tiver sido extraída ainda.
 */
export function useT(namespace: Namespace) {
  const { locale } = useLanguage();
  return (key: string, vars?: Record<string, string | number>) => {
    const dict = dictionaries[locale]?.[namespace] ?? {};
    const ptDict = dictionaries.pt[namespace] ?? {};
    let value: string = dict[key] ?? ptDict[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        value = value.replaceAll(`{${k}}`, String(v));
      }
    }
    return value;
  };
}
