import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ru from './locales/ru.json';
import ua from './locales/ua.json';

const detectLanguage = (): string => {
  const saved = localStorage.getItem('lang');
  if (saved) return saved;

  const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
  if (tgLang === 'ru') return 'ru';
  if (tgLang === 'uk') return 'ua';
  return 'en';
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
    ua: { translation: ua }
  },
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export default i18n;
