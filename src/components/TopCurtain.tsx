import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, MessageCircle, Languages } from 'lucide-react';

export default function TopCurtain() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<ConfigTheme>(
    (localStorage.getItem('theme') as ConfigTheme) || 'light'
  );

  type ConfigTheme = 'light' | 'dark';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const changeLang = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('lang', code);
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const openChat = () => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink('https://t.me/kyrios_chat');
    } else {
      window.open('https://t.me/kyrios_chat', '_blank');
    }
  };

 return (
  <div className="fixed top-0 right-0 z-50">
      {/* Кнопка открытия шторки/триггер */}
      <div className="flex justify-end p-4 bg-transparent absolute right-0 top-0">
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-2 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm"
        >
          <Languages size={18} className="text-zinc-700 dark:text-zinc-200" />
        </button>
      </div>

      {/* Выпадающее меню шторки */}
      {isOpen && (
        <div className="absolute top-16 right-4 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shadow-xl animate-fade-up space-y-4">
          {/* Языки */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Language</p>
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

          {/* Тема и Чат */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button 
              onClick={toggleTheme}
              className="flex items-center justify-center gap-2 py-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300"
            >
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
              {theme === 'light' ? 'Dark' : 'Light'}
            </button>

            <button 
              onClick={openChat}
              className="flex items-center justify-center gap-2 py-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300"
            >
              <MessageCircle size={14} />
              Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
