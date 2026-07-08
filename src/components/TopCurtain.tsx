import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Languages } from 'lucide-react';

export default function TopCurtain() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  type ConfigTheme = 'light' | 'dark';

  const getInitialTheme = (): ConfigTheme => {
    const saved = localStorage.getItem('theme') as ConfigTheme | null;
    if (saved === 'light' || saved === 'dark') return saved;
    // Если пользователь ещё не выбирал тему вручную — уважаем тему самого Telegram
    return window.Telegram?.WebApp?.colorScheme === 'dark' ? 'dark' : 'light';
  };

  const [theme, setTheme] = useState<ConfigTheme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const changeLang = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('lang', code);
    // Сразу закрываем панель после выбора языка — не нужно её отдельно закрывать руками
    setIsOpen(false);
  };

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      // Сохраняем в localStorage только когда пользователь САМ явно переключил тему —
      // до этого момента приложение должно продолжать следовать теме самого Telegram
      localStorage.setItem('theme', next);
      return next;
    });
  };

  return (
    <>
      {/* top-[30px] подобран так, чтобы центр круглых кнопок (34px) совпадал
          с центром логотипа в шапке экранов (padding-top 24px + высота лого 55px) */}

      {/* Кнопка ТЕМЫ — левый верхний угол */}
      <div className="fixed top-[30px] left-4 z-[70]">
        <button
          onClick={toggleTheme}
          className="p-2 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm"
        >
          {theme === 'light' ? <Moon size={18} className="text-zinc-700 dark:text-zinc-200" /> : <Sun size={18} className="text-zinc-700 dark:text-zinc-200" />}
        </button>
      </div>

      {/* Кнопка ЯЗЫКА — правый верхний угол, та же форма, что и кнопка темы */}
      <div className="fixed top-[30px] right-4 z-[70]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm"
        >
          <Languages size={18} className="text-zinc-700 dark:text-zinc-200" />
        </button>

        {/* Выпадающее меню — выбор языка. Закрывается сразу после клика по языку (см. changeLang) */}
        {isOpen && (
          <div className="absolute top-12 right-0 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-3 shadow-xl animate-fade-down">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1 pb-1.5">Language</p>
            <div className="grid grid-cols-3 gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
              {['en', 'ru', 'ua'].map((l) => (
                <button
                  key={l}
                  onClick={() => changeLang(l)}
                  className={`py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                    i18n.language === l
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
