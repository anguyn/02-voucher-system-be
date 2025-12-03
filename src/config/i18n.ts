import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';
import { Language } from '@/types';

const localesPath = path.join(__dirname, '../locales');

void i18next.use(Backend).init({
  lng: process.env.DEFAULT_LANGUAGE || Language.EN,
  fallbackLng: Language.EN,
  supportedLngs: [Language.EN, Language.VI],
  preload: [Language.EN, Language.VI],
  backend: {
    loadPath: path.join(localesPath, '{{lng}}.json'),
  },
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
  returnEmptyString: false,
});

export const t = (key: string, options?: Record<string, unknown>, language?: Language): string => {
  if (language) {
    return i18next.t(key, { ...options, lng: language });
  }
  return i18next.t(key, options);
};

export const changeLanguage = async (lng: Language): Promise<void> => {
  await i18next.changeLanguage(lng);
};

export const getCurrentLanguage = (): Language => {
  return i18next.language as Language;
};

export default i18next;
