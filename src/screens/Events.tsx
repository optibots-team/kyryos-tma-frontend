import { useEffect, useState } from 'react';
import { ChevronRight, Ticket as TicketIcon, Info } from 'lucide-react';
import { Screen } from '../App';
import { supabase } from '../lib/supabaseClient';

interface EventsProps {
  onNavigate: (s: Screen) => void;
  onEventSelect: (id: string) => void;
}

export default function Events({ onNavigate, onEventSelect }: EventsProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [hasTicket, setHasTicket] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Календарь и управление колодой
  const [calendarDays, setCalendarDays] = useState<any[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Получаем активные мероприятия
        const { data } = await supabase.from('active_events').select('*');

        let sortedEvents: any[] = [];
        if (data) {
          const now = new Date().getTime();
          sortedEvents = data
            .filter((e: any) => new Date(e.event_date).getTime() >= now - 86400000)
            .sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
            .slice(0, 2);

          setEvents(sortedEvents);
        }

        // Генерация календарной полоски (7 дней)
        const days = [];
        const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() + i);
          
          const hasEvent = sortedEvents.find(e => 
            new Date(e.event_date).toDateString() === d.toDateString()
          );

          days.push({
            dateObj: d,
            dayNum: d.getDate(),
            weekday: weekdays[d.getDay()],
            isToday: i === 0,
            eventId: hasEvent ? hasEvent.id : null
          });
        }
        setCalendarDays(days);

        // Проверка наличия билетов
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

  const handleDayClick = (eventId: string | null) => {
    if (!eventId) return;
    const index = events.findIndex(e => e.id === eventId);
    if (index !== -1) {
      setActiveCardIndex(index);
    }
  };

  const handleEventClick = (eventId: string) => {
    onEventSelect(eventId);
    onNavigate('event-details');
  };

  // Переключение карточек по тапу на нижнюю карту в колоде
  const toggleStack = () => {
    if (events.length < 2) return;
    setActiveCardIndex((prev) => (prev === 0 ? 1 : 0));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#A50021]/20 border-t-[#A50021] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32 select-none overflow-x-hidden">
      <header className="w-full sticky top-0 z-50 bg-zinc-300/70 backdrop-blur-xl flex flex-col items-center justify-center px-6 pt-6 pb-3 border-b border-zinc-400/30">
        <img src="/logo.png" alt="Kyrios Logo" className="h-[55px] w-auto object-contain mb-3" />
        
        {/* 📅 CALENDAR STRIP */}
        <div className="w-full flex justify-between items-center gap-1 overflow-x-auto no-scrollbar pt-1">
          {calendarDays.map((day, idx) => {
            const isEventDay = !!day.eventId;
            const isSelectedEvent = isEventDay && events[activeCardIndex]?.id === day.eventId;

            return (
              <div 
                key={idx}
                onClick={() => handleDayClick(day.eventId)}
                className={`flex flex-col items-center py-2 px-2.5 rounded-xl transition-all duration-300 shrink-0 min-w-[42px] cursor-pointer
                  ${isSelectedEvent ? 'bg-[#A50021] text-white shadow-lg shadow-[#A50021]/30 scale-105' : 'bg-transparent'}
                `}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelectedEvent ? 'text-white/80' : 'text-zinc-400'}`}>
                  {day.weekday}
                </span>
                <span className={`text-sm font-black mt-0.5 ${isSelectedEvent ? 'text-white' : 'text-zinc-900'}`}>
                  {day.dayNum}
                </span>
                
                <div className="mt-1">
                  {isEventDay && !isSelectedEvent ? (
                    <div className="w-1.5 h-1.5 bg-[#A50021] rounded-full animate-pulse"></div>
                  ) : day.isToday && !isSelectedEvent ? (
                    <div className="w-1 h-1 bg-zinc-400 rounded-full"></div>
                  ) : (
                    <div className="w-1 h-1 bg-transparent"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </header>

      <main className="py-6 space-y-12">
        
        {/* 🎯 КОНЦЕПТ КОЛОДЫ КАРТ (THE STACK SHIFT) */}
        <div className="space-y-4 px-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Weekend Stack</h3>
            <span className="text-[10px] font-black text-zinc-400 bg-zinc-200/50 px-2.5 py-1 rounded-full">
              Tap lower card to shift
            </span>
          </div>

          {/* Контейнер колоды */}
          <div className="relative w-full aspect-[4/5] mt-2">
            {events.map((event, index) => {
              const isTop = index === activeCardIndex;
              
              return (
                <div
                  key={event.id}
                  onClick={() => isTop ? handleEventClick(event.id) : toggleStack()}
                  className={`absolute inset-0 w-full h-full transition-all duration-500 ease-out origin-bottom rounded-[2.5rem] overflow-hidden shadow-2xl cursor-pointer
                    ${isTop 
                      ? 'z-20 translate-y-0 rotate-0 scale-100 opacity-100 pointer-events-auto' 
                      : 'z-10 translate-y-6 rotate-3 scale-[0.94] opacity-70 blur-[0.5px] pointer-events-auto hover:translate-y-4 hover:rotate-1'
                    }
                  `}
                >
                  <EventCardContent event={event} isTop={isTop} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Check-in */}
        {hasTicket && (
          <div className="px-6 animate-fade-up">
            <section 
              onClick={() => onNavigate('tickets')}
              className="w-full bg-emerald-50 rounded-[2rem] p-6 flex items-center justify-between cursor-pointer border border-emerald-100 transition-all active:scale-[0.98] shadow-sm"
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
          </div>
        )}

        {/* ABOUT KYRIOS */}
        <section className="space-y-4 px-6 animate-fade-up">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">About Agency</h3>
          </div>
          <div 
            onClick={() => onNavigate('about')}
            className="bg-white rounded-[2rem] p-8 relative overflow-hidden h-[180px] flex flex-col justify-end group cursor-pointer border border-zinc-100 shadow-sm active:scale-[0.98] transition-all"
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

// ── ВНУТРЕННИЙ РЕНДЕР КАРТЫ С КНОПКАМИ И ДЕТАЛЯМИ ──
function EventCardContent({ event, isTop }: { event: any; isTop: boolean }) {
  const isGuestlist = event?.ticket_mode === 'guestlist';
  const placesLeft = event?.available !== null && event?.available !== undefined ? event.available : (event?.capacity || 400);
  const isSoldOut = !isGuestlist && placesLeft === 0 && (!event?.batches || !event.batches.some((b: any) => !b.is_sold_out && b.available > 0));

  const centerButtonText = event?.sales_paused 
    ? 'SALES PAUSED' 
    : isSoldOut 
      ? 'SOLD OUT' 
      : isGuestlist 
        ? 'GET TICKET' 
        : 'BUY TICKET';

  const isVideo = event?.image_url?.match(/\.(mp4|webm)$/i);

  return (
    <>
      <div className="w-full h-full overflow-hidden relative bg-black">
        {isVideo ? (
          <video
            src={event.image_url}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img 
            className="w-full h-full object-cover" 
            src={event.image_url} 
            alt={event.title} 
          />
        )}
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
      
      <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
        <span className="text-[#A50021] text-[10px] font-black uppercase tracking-[0.2em] mb-1">
          {new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'long' })}
        </span>
        <h2 className="text-white font-headline font-extrabold text-3xl mb-1 tracking-tight leading-none">
          {event.title}
        </h2>
        <p className="text-white/60 text-[11px] mb-5 font-bold uppercase tracking-wider">
          {new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
        
        {/* Кнопка активна и видна только на верхней карточке */}
        <div className={`bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex items-center justify-center transition-all duration-300
          ${isTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}>
          <div className={`w-full text-center py-3 text-white font-headline font-black text-xs tracking-widest rounded-xl transform ${event.sales_paused ? 'bg-zinc-800 border border-zinc-700 text-zinc-400 shadow-inner' : 'bg-[#A50021] shadow-[0_4px_16px_rgba(165,0,33,0.3)]'}`}>
            {centerButtonText}
          </div>
        </div>
      </div>
    </>
  );
}
