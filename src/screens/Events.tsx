import { useEffect, useState } from 'react';
import { ChevronRight, Ticket as TicketIcon } from 'lucide-react';
import { Screen } from '../App';
import { supabase } from '../lib/supabaseClient';

export default function Events({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [soldCount, setSoldCount] = useState(0);
  const [hasTicket, setHasTicket] = useState(false);
  const MAX_CAPACITY = 300;

  useEffect(() => {
    async function fetchStats() {
      // Подсчет всех проданных (и уже использованных) билетов для счетчика
      const { count } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .in('status', ['paid', 'used']);
      
      if (count !== null) setSoldCount(count);

      // Проверка, есть ли у текущего юзера активный билет для входа
      const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
      if (user?.id) {
        const { count: userTickets } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'paid'); // Если билет 'used', плашка чек-ина исчезнет
          
        setHasTicket((userTickets || 0) > 0);
      }
    }
    fetchStats();
  }, []);

  const placesLeft = Math.max(0, MAX_CAPACITY - soldCount);

  return (
    <div className="min-h-screen bg-black pb-32">
      {/* Убрали кнопки меню и колокольчика */}
      <header className="w-full pt-12 pb-4 px-6 flex items-center justify-between z-50 relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20">
            <div className="w-3 h-3 bg-[#D4AF37] rounded-full shadow-[0_0_10px_rgba(212,175,55,0.8)] animate-pulse" />
          </div>
          <span className="text-white font-headline font-bold tracking-widest text-sm">KYRYOS</span>
        </div>
      </header>

      <main className="px-6 space-y-8">
        {/* Главная карточка события */}
        <section 
          onClick={() => onNavigate('event-details')}
          className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer group shadow-2xl ring-1 ring-white/10"
        >
          <img 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80" 
            alt="UNITIS FEST" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90"></div>
          
          <div className="absolute inset-0 p-6 flex flex-col justify-end">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
                Main Event
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
                Warsaw
              </span>
            </div>
            
            <h2 className="text-white font-headline font-black text-4xl mb-2 tracking-tight leading-none">UNITIS FEST</h2>
            <p className="text-white/60 text-sm mb-6 font-medium">Techno Forest • 24 Aug 2024</p>
            
            <div className="flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
              <div>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Capacity</p>
                <p className="text-white font-bold text-sm">
                  {placesLeft} <span className="text-white/60 font-normal">places left</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                <ChevronRight className="text-black w-5 h-5" />
              </div>
            </div>
          </div>
        </section>

        {/* Интеллектуальный Quick Check-in (виден только если есть билет) */}
        {hasTicket && (
          <section 
            onClick={() => onNavigate('tickets')}
            className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-5 flex items-center justify-between cursor-pointer active:scale-95 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <TicketIcon className="text-emerald-400 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-emerald-400 font-bold text-base">Quick check-in</h3>
                <p className="text-emerald-400/60 text-xs">Show your ticket at entrance</p>
              </div>
            </div>
            <ChevronRight className="text-emerald-400/50 w-5 h-5" />
          </section>
        )}

        {/* ABOUT KYRYOS */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-headline font-bold tracking-widest text-xs uppercase">ABOUT KYRYOS</h3>
            {/* Позже сюда добавим onNavigate('about') */}
            <button className="text-white/40 text-xs font-bold uppercase tracking-widest">Read</button>
          </div>
          <div className="relative w-full h-40 rounded-3xl overflow-hidden group">
            <img 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              src="https://images.unsplash.com/photo-1555040479-c949debe66c1?auto=format&fit=crop&w=800&q=80" 
              alt="About Kyryos" 
            />
            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors"></div>
            <div className="absolute inset-0 p-5 flex flex-col justify-end">
              <h4 className="text-white font-bold text-lg mb-1">Upcoming event</h4>
              <p className="text-white/60 text-xs">Discover the vision behind our agency.</p>
            </div>
          </div>
        </section>

        {/* PAST EVENTS с новыми картинками */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-headline font-bold tracking-widest text-xs uppercase">PAST EVENTS</h3>
            <button className="text-white/40 text-xs font-bold uppercase tracking-widest">View All</button>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
            <div className="flex-shrink-0 w-64 h-40 rounded-3xl overflow-hidden relative">
              <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1574096079513-d8259312b785?auto=format&fit=crop&w=800&q=80" alt="Past Party 1" />
              <div className="absolute inset-0 bg-black/30 flex items-end p-4">
                <span className="text-white font-bold text-sm drop-shadow-md">Neon Nights</span>
              </div>
            </div>
            <div className="flex-shrink-0 w-64 h-40 rounded-3xl overflow-hidden relative">
              <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80" alt="Past Party 2" />
              <div className="absolute inset-0 bg-black/30 flex items-end p-4">
                <span className="text-white font-bold text-sm drop-shadow-md">Warehouse Project</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
