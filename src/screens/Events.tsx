import { useEffect, useState } from 'react';
import { ChevronRight, Ticket as TicketIcon, Info } from 'lucide-react';
import { Screen } from '../App';
import { supabase } from '../lib/supabaseClient';

interface EventsProps {
  onNavigate: (s: Screen) => void;
  onEventSelect: (id: string) => void;
}

export default function Events({ onNavigate, onEventSelect }: EventsProps) {
  const [mainEvent, setMainEvent] = useState<any>(null);
  const [hasTicket, setHasTicket] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Запрашиваем только один самый актуальный ивент
        const { data: events } = await supabase
          .from('active_events')
          .select('*')
          .limit(1);

        if (events && events.length > 0) {
          setMainEvent(events[0]);
        }

        // Проверяем наличие активных билетов для плашки быстрого чекина
        const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
        if (user?.id) {
          const { count } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'paid');
            
          setHasTicket((count || 0) > 0);
        }
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleEventClick = (eventId: string) => {
    onEventSelect(eventId);
    onNavigate('event-details');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#A50021]/20 border-t-[#A50021] rounded-full animate-spin"></div>
      </div>
    );
  }

  // ⚡ ИСПРАВЛЕННЫЙ РАСЧЕТ КАПАСИТИ ДЛЯ ТЕКУЩЕЙ АКТИВНОЙ ПАРТИИ
  const maxCapacity = mainEvent?.capacity || 400;
  const placesLeft = mainEvent?.available !== null && mainEvent?.available !== undefined ? mainEvent.available : maxCapacity;
  const fillPercentage = Math.min(100, (placesLeft / maxCapacity) * 100);

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className="w-full sticky top-0 z-50 bg-zinc-300/70 backdrop-blur-xl flex items-center justify-center px-6 pt-6 pb-2 border-b border-zinc-400/30">
        <img src="/logo.png" alt="Kyrios Logo" className="h-[55px] w-auto object-contain" />
      </header>

      <main className="px-6 py-8 space-y-8">
        
        {/* ГЛАВНЫЙ ИВЕНТ */}
        {mainEvent && (
          <section 
            onClick={() => handleEventClick(mainEvent.id)}
            className="relative w-full aspect-[4/5] rounded-[2rem] overflow-hidden cursor-pointer group shadow-xl shadow-zinc-200/50 animate-fade-up"
          >
            <img 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              src={mainEvent.image_url} 
              alt={mainEvent.title} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
            
            <div className="absolute inset-0 p-8 flex flex-col justify-end">
              <h2 className="text-white font-headline font-extrabold text-4xl mb-2 tracking-tight">{mainEvent.title}</h2>
              <p className="text-white/70 text-sm mb-6 font-medium">
                {new Date(mainEvent.event_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[1.5rem] p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">Capacity</p>
                    <p className="text-white font-bold text-sm">
                      {placesLeft} <span className="text-white/60 font-normal">places left</span>
                    </p>
                  </div>
                  <div className="px-5 py-2.5 bg-[#A50021] text-white font-headline font-bold text-xs rounded-xl shadow-[0_4px_16px_rgba(239,68,68,0.5)]">
                    {placesLeft === 0 ? 'SOLD OUT' : 'BUY TICKET'}
                  </div>
                </div>
                
                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#A50021] rounded-full shadow-[0_4px_16px_rgba(239,68,68,0.5)] transition-all duration-1000 ease-out"
                    style={{ width: `${fillPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Quick Check-in */}
        {hasTicket && (
          <section 
            onClick={() => onNavigate('tickets')}
            className="w-full bg-emerald-50 rounded-[2rem] p-6 flex items-center justify-between cursor-pointer border border-emerald-100 transition-all active:scale-[0.98] shadow-sm animate-fade-up"
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
            <ChevronRight className="text-emerald-600 w-4 h-4" />
          </section>
        )}

        {/* ABOUT KYRIOS */}
        <section className="space-y-4 animate-fade-up">
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
