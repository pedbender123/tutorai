import ptCommon from './pt/common.json';
import ptSettings from './pt/settings.json';
import ptLayout from './pt/layout.json';
import enCommon from './en/common.json';
import enSettings from './en/settings.json';
import enLayout from './en/layout.json';
import esCommon from './es/common.json';
import esSettings from './es/settings.json';
import esLayout from './es/layout.json';

export type Locale = 'pt' | 'en' | 'es';
export type Namespace = 'common' | 'settings' | 'layout';

type Dict = Record<string, string>;

export const dictionaries: Record<Locale, Record<Namespace, Dict>> = {
  pt: { common: ptCommon, settings: ptSettings, layout: ptLayout },
  en: { common: enCommon, settings: enSettings, layout: enLayout },
  es: { common: esCommon, settings: esSettings, layout: esLayout },
};
