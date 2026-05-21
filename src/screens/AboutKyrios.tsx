import { useEffect } from 'react';
import { ArrowLeft, Instagram, Music, Globe, ExternalLink } from 'lucide-react';
import { Screen } from '../App';

export default function AboutKyrios({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  
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
    <div className="min-h-screen bg-slate-50 pb-32">
      
      {/* ФОНОВЫЙ БАННЕР НА ПОЛ-ЭКРАНА */}
      <section className="relative w-full h-[50vh] overflow-hidden animate-fade-up">
        <img 
          className="w-full h-full object-cover" 
          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80" 
          alt="Kyrios Agency Background" 
        />
        {/* Градиент для плавного перехода в контент */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-50/40 to-black/60"></div>
        
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
        <section className="space-y-4 animate-fade-up delay-100 bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] border border-white/40 shadow-lg shadow-zinc-200/50">
          <div className="w-16 h-16 bg-zinc-900 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-xl shadow-zinc-900/20">
            <img src="/logo.png" alt="Kyrios Logo" className="w-10 h-auto object-contain brightness-0 invert" />
          </div>
          <h1 className="font-headline font-extrabold text-4xl tracking-tighter text-zinc-900">
            We Are Kyrios
          </h1>
          <p className="text-zinc-600 text-sm leading-relaxed tracking-wide font-medium">
            We create conceptual events and immersive experiences where music, aesthetics, atmosphere, and people become one story. From private celebrations and luxury brand activations to corporate events, festivals, and underground parties - our agency focuses on emotion, visual identity, and unforgettable energy in every detail.  
          </p>
        </section>

        {/* СМЕЖНЫЕ ПРОЕКТЫ (3 большие кнопки) */}
        <section className="space-y-4 animate-fade-up delay-200">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 px-2">Our Projects</h3>
          
          <div className="space-y-3">
            {/* Кнопка 1: Instagram */}
            <a 
              href="https://www.instagram.com/kyrioseventagency?igsh=YWplZ2RvenozN2Vj" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full p-5 bg-white rounded-2xl border border-zinc-100 shadow-sm active:scale-95 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center border border-pink-100 group-hover:bg-pink-100 transition-colors">
                  <Instagram className="text-pink-600 w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 text-base">Kyrios Community</h4>
                  <p className="text-zinc-400 text-xs font-medium">Follow us on Instagram</p>
                </div>
              </div>
              <ExternalLink size={18} className="text-zinc-300 group-hover:text-pink-500 transition-colors" />
            </a>
          </div>
        </section>

      </main>
    </div>
  );
}
