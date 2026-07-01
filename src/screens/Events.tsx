import { useEffect, useState, useRef } from 'react';
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
  
  // Календарь и карусель
  const [calendarDays, setCalendarDays] = useState<any[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

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

        // Генерация календарной полоски (7 дней начиная с сегодня)
        const days = [];
        const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() + i);
          
          // Проверяем, есть ли мероприятие в этот день
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

  // Магия связи: Клик по календарю скроллит карусель на нужный ивент
  const handleDayClick = (eventId: string | null) => {
    if (!eventId || !carouselRef.current) return;
    const index = events.findIndex(e => e.id === eventId);
    if (index !== -1) {
      const cardWidth = carouselRef.current.offsetWidth * 0.85;
      carouselRef.current.scrollTo({
        left: index * (cardWidth + 16), // ширина карты + gap
        behavior: 'smooth'
      });
      setActiveCardIndex(index);
    }
  };

  // Отслеживание скролла карусели для интерактивного изменения масштаба
  const handleScroll = () => {
    if (!carouselRef.current) return;
    const scrollLeft = carouselRef.current.scrollLeft;
    const cardWidth = carouselRef.current.offsetWidth * 0.85 + 16;
    const index = Math.round(scrollLeft / cardWidth);
    if (index !== activeCardIndex && index >= 0 && index < events.length) {
      setActiveCardIndex(index);
    }
  };

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

  return (
    <div className="min-h-screen bg-slate-50 pb-32 select-none">
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
                
                {/* Точка под числом */}
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

      <main className="py-6 space-y-8">
        
        {/* 🎯 HORIZONTAL CINEMATIC CAROUSEL */}
        <div className="space-y-2">
          <div className="px-6 flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Featured Lineup</h3>
            <span className="text-[10px] font-black text-zinc-400 bg-zinc-200/50 px-2.5 py-1 rounded-full">
              {activeCardIndex + 1} / {events.length}
            </span>
          </div>

          <div 
            ref={carouselRef}
            onScroll={handleScroll}
            className="w-full flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar px-6 py-2"
            style={{ scrollPaddingLeft: '24px' }}
          >
            {events.map((event, index) => (
              <EventCard 
                key={event.id} 
                event={event} 
                isActive={index === activeCardIndex}
                onCardClick={handleEventClick} 
              />
            ))}
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
            className="bg-white rounded-[2rem] p-8 relative overflow-hidden h-[200px] flex flex-col justify-end group cursor-pointer border border-zinc-100 shadow-sm active:scale-[0.98] transition-all"
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

// ── ВНУТРЕННИЙ КОРПОНЕНТ КАРТОЧКИ (ГОРИЗОНТАЛЬНЫЙ СТИЛЬ С ПАРАЛЛАКСОМ И МАСШТАБИРОВАНИЕМ) ──
function EventCard({ event, isActive, onCardClick }: { event: any; isActive: boolean; onCardClick: (id: string) => void }) {
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
    <section 
      onClick={() => onCardClick(event.id)}
      className={`relative w-[85%] aspect-[3/4] rounded-[2.5rem] overflow-hidden cursor-pointer group shadow-2xl transition-all duration-500 ease-out shrink-0 snap-center
        ${isActive ? 'scale-100 opacity-100 shadow-zinc-300/60' : 'scale-[0.93] opacity-40 blur-[0.5px]'}
      `}
    >
      {/* Контент обложки */}
      <div className="w-full h-full overflow-hidden relative">
        {isVideo ? (
          <video
            src={event.image_url}
            autoPlay
            loop
            muted
            playsInline
            className={`w-full h-full object-cover transition-transform duration-[1.5s] ease-out ${isActive ? 'scale-100' : 'scale-110'}`}
          />
        ) : (
          <img 
            className={`w-full h-full object-cover transition-transform duration-[1.5s] ease-out ${isActive ? 'scale-100' : 'scale-110'}`} 
            src={event.image_url} 
            alt={event.title} 
          />
        )}
      </div>
      
      {/* Градиентное затемнение */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
      
      {/* Информация поверх карты */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end z-10">
        <span className="text-[#A50021] text-[10px] font-black uppercase tracking-[0.2em] mb-1">
          {new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'long' })}
        </span>
        <h2 className="text-white font-headline font-extrabold text-3xl mb-1 tracking-tight leading-none group-hover:text-[#A50021] transition-colors">
          {event.title}
        </h2>
        <p className="text-white/60 text-[11px] mb-5 font-bold uppercase tracking-wider">
          {new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </p>
        
        {/* Интерактивная кнопка */}
        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex items-center justify-center transition-all duration-300 group-hover:bg-white/15">
          <div className={`w-full text-center py-3 text-white font-headline font-black text-xs tracking-widest rounded-xl transition-all transform ${event.sales_paused ? 'bg-zinc-800 border border-zinc-700 text-zinc-400 shadow-inner' : 'bg-[#A50021] shadow-[0_4px_16px_rgba(165,0,33,0.3)]'}`}>
            {centerButtonText}
          </div>
        </div>
      </div>
    </section>
  );
}
