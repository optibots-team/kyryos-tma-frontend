import { useEffect } from 'react';
import { ArrowLeft, Instagram, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Screen } from '../App';

export default function AboutKyrios({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { t } = useTranslation();

  // --- ПЕРЕХВАТ НАТИВНОЙ КНОПКИ НАЗАД ОТ TELEGRAM ---
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    const handleBackButton = () => {
      onNavigate('events');
    };

    tg.BackButton.show();
    tg.BackButton.onClick(handleBackButton);

    return () => {
      tg.BackButton.offClick(handleBackButton);
      tg.BackButton.hide();
    };
  }, [onNavigate]);

  return (
    <div className="min-h-screen bg-background pb-32">
      
      {/* ФОНОВЫЙ БАННЕР НА ПОЛ-ЭКРАНА */}
      <section className="relative w-full h-[50vh] overflow-hidden animate-fade-up">
        <img 
          className="w-full h-full object-cover" 
          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80" 
          alt="Kyrios Agency Background" 
        />
        {/* Градиент для плавного перехода в контент — использует токен фона, поэтому подстраивается под тему */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/60"></div>
        
        {/* Кнопка НАЗАД (для браузеров вне Telegram) */}
        <button 
          onClick={() => onNavigate('events')}
          className="absolute top-6 left-6 w-10 h-10 bg-black/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white active:scale-95 transition-all z-20"
        >
          <ArrowLeft size={20} />
        </button>
      </section>

      <main className="px-6 -mt-16 relative z-10 space-y-10">
        
        {/* ТЕКСТОВОЕ ОПИСАНИЕ */}
        <section className="space-y-4 animate-fade-up delay-100 bg-surface/60 backdrop-blur-xl p-8 rounded-[2rem] border border-outline-variant/30 shadow-lg shadow-zinc-200/50 dark:shadow-black/40">
          {/* Тёмный квадрат-иконка намеренно всегда тёмный в обеих темах — акцентный блок с логотипом */}
          <div className="w-16 h-16 bg-zinc-900 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-xl shadow-zinc-900/20">
            <img src="/logo.png" alt="Kyrios Logo" className="w-10 h-auto object-contain brightness-0 invert" />
          </div>
          <h1 className="font-headline font-extrabold text-4xl tracking-tighter text-on-surface">
            {t('about_screen.title')}
          </h1>
          <p className="text-on-surface-variant text-sm leading-relaxed tracking-wide font-medium">
            {t('about_screen.description')}
          </p>
        </section>

        {/* СМЕЖНЫЕ ПРОЕКТЫ (3 большие кнопки) */}
        <section className="space-y-4 animate-fade-up delay-200">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60 px-2">{t('about_screen.our_projects')}</h3>
          
          <div className="space-y-3">
            {/* Кнопка 1: Instagram */}
            <a 
              href="https://www.instagram.com/kyrioseventagency?igsh=YWplZ2RvenozN2Vj" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full p-5 bg-surface rounded-2xl border border-outline-variant/40 shadow-sm active:scale-95 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pink-50 dark:bg-pink-500/10 rounded-xl flex items-center justify-center border border-pink-100 dark:border-pink-500/30 group-hover:bg-pink-100 dark:group-hover:bg-pink-500/20 transition-colors">
                  <Instagram className="text-pink-600 dark:text-pink-400 w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-on-surface text-base">{t('about_screen.instagram_title')}</h4>
                  <p className="text-on-surface-variant/70 text-xs font-medium">{t('about_screen.instagram_desc')}</p>
                </div>
              </div>
              <ExternalLink size={18} className="text-on-surface-variant/40 group-hover:text-pink-500 transition-colors" />
            </a>
          </div>
        </section>

      </main>
    </div>
  );
}
