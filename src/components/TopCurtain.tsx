import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, MessageCircle, Settings } from 'lucide-react';

export default function TopCurtain() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  );

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
    // Фиксируем всю панель на самом верхнем слое (z-50) с отступом сверху, чтобы не перекрывать статус-бар
    <div className="fixed top-3 left-0 right-0 z-50 px-4 pointer-events-none">
      <div className="max-w-md mx-auto flex flex-col items-end gap-2">
        
        {/* КНОПКИ НА ГЛАВНОМ ЭКРАНЕ (ЯЗЫКИ + ТЕМА) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Кнопка изменения ТЕМЫ (вынесена на главный экран) */}
          <button 
            onClick={toggleTheme}
            className="w-11 h-11 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md flex items-center justify-center active:scale-95 transition-all text-zinc-800 dark:text-zinc-200"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Кнопка вызова дополнительных настроек ЯЗЫКА (шире и крупнее) */}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="px-4 h-11 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md flex items-center gap-2 font-black text-xs uppercase tracking-wider active:scale-95 transition-all text-zinc-800 dark:text-zinc-200"
          >
            <Settings size={16} className={isOpen ? 'rotate-45 transition-transform' : 'transition-transform'} />
            {i18n.language}
          </button>
        </div>

        {/* СДВИГАЮЩАЯСЯ ПАНЕЛЬ ЯЗЫКОВ И ДОП. ФУНКЦИЙ */}
        {isOpen && (
          <div className="w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-4 shadow-xl pointer-events-auto animate-fade-down space-y-4">
            {/* Выбор языков — увеличенные кнопки */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Select Language</p>
              <div className="grid grid-cols-3 gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-xl">
                {['en', 'ru', 'ua'].map((l) => (
                  <button
                    key={l}
                    onClick={() => changeLang(l)}
                    className={`py-2.5 rounded-lg text-xs font-black uppercase transition-all ${
                      i18n.language === l 
                        ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-md scale-105' 
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Быстрая ссылка на чат поддержки */}
            <button 
              onClick={openChat}
              className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors rounded-xl text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
            >
              <MessageCircle size={14} />
              Support Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
