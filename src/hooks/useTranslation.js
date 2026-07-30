import { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';

/**
 * Access translations and language helpers.
 * Usage: const { t, language, setLanguage } = useTranslation();
 */
export default function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within LanguageProvider');
  }
  return ctx;
}
