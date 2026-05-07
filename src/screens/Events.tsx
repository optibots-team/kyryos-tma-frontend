import { useEffect, useState } from 'react';
import { ChevronRight, Ticket as TicketIcon, Info } from 'lucide-react';
import { Screen } from '../App';
import { supabase } from '../lib/supabaseClient';

export default function Events({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [soldCount, setSoldCount] = useState(0);
  const [hasTicket, setHasTicket] = useState(false);
  const MAX_CAPACITY = 300;

  useEffect(() => {
    async function fetchStats() {
      const { count } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .in('status', ['paid', 'used']);
      
      if (count !== null) setSoldCount(count);

      const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
      if (user?.id) {
        const { count: userTickets } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'paid');
          
        setHasTicket((userTickets || 0) > 0);
      }
    }
    fetchStats();
  }, []);

  const placesLeft = Math.max(0, MAX_CAPACITY - soldCount);
  const fillPercentage = Math.min(100, (placesLeft / MAX_CAPACITY) * 100);

  // Массив будущих ивентов для карусели
  const upcomingEvents = [
    { 
      id: 'event-details2', 
      title: 'Midnight Mirage', 
      date: 'Fri, 13 Sep 2024', 
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80' 
    },
    { 
      id: 'event-details3', 
      title: 'Sonic Sanctuary', 
      date: 'Sat, 28 Sep 2024', 
      image: 'https://images.unsplash.com/photo-1540039155732-d674d0e8c8b1?auto=format&fit=crop&w=800&q=80' 
    },
    { 
      id: 'event-details4', 
      title: 'Eclipse Gathering', 
      date: 'Sat, 12 Oct 2024', 
      image: 'https://images.unsplash.com/photo-1558317751-bc3ed6f85f72?auto=format&fit=crop&w=800&q=80' 
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* ГЛОБАЛЬНАЯ ШТОРКА */}
      <header className="w-full sticky top-0 z-50 bg-zinc-300/70 backdrop-blur-xl flex items-center justify-center px-6 pt-6 pb-2 border-b border-zinc-400/30">
        <img 
          src="/logo.png" 
          alt="Kyrios Logo" 
          className="h-[55px] w-auto object-contain" 
        />
      </header>

      <main className="px-6 py-8 space-y-8">
        {/* Main Event Card */}
        <section 
          onClick={() => onNavigate('event-details')}
          className="relative w-full aspect-[4/5] rounded-[2rem] overflow-hidden cursor-pointer group shadow-xl shadow-zinc-200/50 animate-fade-up"
        >
          <img 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80" 
            alt="ROAR Party" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
          
          <div className="absolute inset-0 p-8 flex flex-col justify-end">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-bold uppercase tracking-widest">
                Warsaw
              </span>
            </div>
            
            <h2 className="text-white font-headline font-extrabold text-4xl mb-2 tracking-tight">ROAR Party</h2>
            <p className="text-white/70 text-sm mb-6 font-medium">Saturday, 24 August 2024</p>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[1.5rem] p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">Capacity</p>
                  <p className="text-white font-bold text-sm">
                    {placesLeft} <span className="text-white/60 font-normal">places left</span>
                  </p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // Чтобы клик по кнопке не дублировал клик по карточке
                    onNavigate('event-details');
                  }}
                  className="px-5 py-2.5 bg-[#A50021] text-white font-headline font-bold text-xs rounded-xl shadow-[0_4px_16px_rgba(239,68,68,0.5)] active:scale-95 transition-all"
                >
                  BUY TICKET
                </button>
              </div>
              
              {/* Динамическая тающая шкала */}
              <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#A50021] rounded-full shadow-[0_4px_16px_rgba(239,68,68,0.5)] transition-all duration-1000 ease-out"
                  style={{ width: `${fillPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Check-in */}
        {hasTicket && (
          <section 
            onClick={() => onNavigate('tickets')}
            className="w-full bg-emerald-50 rounded-[2rem] p-6 flex items-center justify-between cursor-pointer border border-emerald-100 transition-all active:scale-[0.98] shadow-sm animate-fade-up delay-100"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <TicketIcon className="text-emerald-600 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-emerald-900 font-bold text-base tracking-tight">Quick check-in</h3>
                <p className="text-emerald-600/70 text-xs font-medium">Show your ticket at entrance</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <ChevronRight className="text-emerald-600 w-4 h-4" />
            </div>
          </section>
        )}

        {/* UPCOMING EVENTS CAROUSEL */}
        <section className="space-y-4 animate-fade-up delay-200">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Upcoming Events</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
            {upcomingEvents.map((event) => (
              <div 
                key={event.id}
                // Передаем id ивента в навигацию (нужно будет добавить в Screen тип)
                onClick={() => onNavigate(event.id as Screen)}
                className="flex-shrink-0 w-60 aspect-[4/5] rounded-[2rem] overflow-hidden relative shadow-lg shadow-zinc-200/50 cursor-pointer group active:scale-[0.98] transition-all"
              >
                <img 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  src={event.image} 
                  alt={event.title} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6">
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1.5">{event.date}</p>
                  <h4 className="text-white font-headline font-bold text-xl tracking-tight leading-tight">{event.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ABOUT KYRIOS */}
        <section className="space-y-4 animate-fade-up delay-300">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">About Agency</h3>
          </div>
          <div 
            onClick={() => onNavigate('about')}
            className="bg-white rounded-[2rem] p-8 relative overflow-hidden h-[240px] flex flex-col justify-end group cursor-pointer border border-zinc-100 shadow-sm active:scale-[0.98] transition-all"
          >
            <div className="absolute top-0 right-0 p-8">
              <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-900">
                <Info className="w-6 h-6" />
              </div>
            </div>
            <div className="relative z-10">
              <h4 className="text-zinc-900 font-headline font-bold text-2xl mb-2 tracking-tight">About Kyrios</h4>
              <p className="text-zinc-500 text-sm leading-relaxed max-w-[200px]">Discover the vision and core values of our creative agency.</p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
