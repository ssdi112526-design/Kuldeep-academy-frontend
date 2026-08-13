import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import en from '../locales/en.json';
import hi from '../locales/hi.json';

const STORAGE_KEY = 'ra-lang';
const dictionaries = { en, hi };

function detectInitialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'hi') return saved;
  } catch {
    /* ignore */
  }

  const browser = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
  return browser.startsWith('hi') ? 'hi' : 'en';
}

function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] != null ? acc[key] : undefined), obj);
}

export const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(detectInitialLanguage);
  const [fade, setFade] = useState(false);

  const setLanguage = useCallback((next) => {
    if (next !== 'en' && next !== 'hi') return;
    setFade(true);
    window.setTimeout(() => {
      setLanguageState(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      setFade(false);
    }, 150);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.lang = language;
    document.body.classList.toggle('lang-hi', language === 'hi');
    document.body.classList.toggle('lang-en', language === 'en');

    if (language === 'hi') {
      let link = document.getElementById('font-hi');
      if (!link) {
        link = document.createElement('link');
        link.id = 'font-hi';
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap';
        document.head.appendChild(link);
      }
    }

    const title =
      language === 'hi'
        ? 'कुलदीप मलिक स्पोर्ट्स अकादमी | सोनीपत'
        : 'Kuldeep Malik Sports Academy | Sonipat';
    document.title = title;
  }, [language]);

  const t = useCallback(
    (key, fallback = key) => {
      const value = getByPath(dictionaries[language], key);
      if (typeof value === 'string') return value;
      if (Array.isArray(value)) return value;
      const enValue = getByPath(dictionaries.en, key);
      if (typeof enValue === 'string') return enValue;
      if (Array.isArray(enValue)) return enValue;
      return fallback;
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      fade,
      isHindi: language === 'hi',
    }),
    [language, setLanguage, t, fade],
  );

  return (
    <LanguageContext.Provider value={value}>
      <div
        className={`lang-root transition-opacity duration-300 ${fade ? 'opacity-0' : 'opacity-100'}`}
      >
        {children}
      </div>
    </LanguageContext.Provider>
  );
}
