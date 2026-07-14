import { useEffect, useState } from 'react';
import { ChevronRight, Ticket as TicketIcon, Info, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Screen } from '../App';
import { supabase } from '../lib/supabaseClient';

interface EventsProps {
  onNavigate: (s: Screen) => void;
  onEventSelect: (id: string) => void;
}

export default function Events({ onNavigate, onEventSelect }: EventsProps) {
  const { t } = useTranslation();
  // 🎯 ТЕПЕРЬ ХРАНИМ МАССИВ ИВЕНТОВ
  const [events, setEvents] = useState<any[]>([]);
  const [hasTicket, setHasTicket] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // ✅ ИСПРАВЛЕНО: Запрашиваем 2 самых актуальных ивента (пятница + суббота)
        const { data } = await supabase
          .from('active_events')
          .select('*'); // Убираем жесткий .limit(2) здесь, чтобы сначала отсортировать

        if (data) {
          const now = new Date().getTime();
          
          const sortedEvents = data
            // 1. Оставляем только те, которые еще не прошли (или идут сегодня)
            .filter((e: any) => new Date(e.event_date).getTime() >= now - 86400000)
            // 2. Сортируем: чем ближе дата к сегодняшней, тем выше ивент
            .sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
            // 3. Берем только первые 2 главных ивента для экрана
            .slice(0, 2);

          setEvents(sortedEvents);
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

  const openChat = () => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink('https://t.me/kyrios_chat');
    } else {
      window.open('https://t.me/kyrios_chat', '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#A50021]/20 border-t-[#A50021] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="w-full sticky top-0 z-50 bg-surface-variant/70 backdrop-blur-xl flex items-center justify-center px-6 pt-6 pb-2 border-b border-outline-variant/30">
        <img src="/logo.png" alt="Kyrios Logo" className="h-[55px] w-auto object-contain dark:invert" />
      </header>

      <main className="px-6 py-8 space-y-8">
        
        {/* 🎯 РАЗДЕЛ С ГЛАВНЫМИ ИВЕНТАМИ (ПЯТНИЦА + СУББОТА) */}
        <div className="space-y-6">
          {events.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              onCardClick={handleEventClick} 
            />
          ))}
        </div>


        {/* Quick Check-in */}
        {hasTicket && (
          <section 
            onClick={() => onNavigate('tickets')}
            className="w-full bg-emerald-50 dark:bg-emerald-500/10 rounded-[2rem] p-6 flex items-center justify-between cursor-pointer border border-emerald-100 dark:border-emerald-500/20 transition-all active:scale-[0.98] shadow-sm animate-fade-up"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                <TicketIcon className="text-emerald-600 dark:text-emerald-400 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-emerald-900 dark:text-emerald-300 font-bold text-base tracking-tight">{t('events_screen.quick_checkin_title')}</h3>
                <p className="text-emerald-600/70 dark:text-emerald-400/70 text-xs font-medium">{t('events_screen.quick_checkin_desc')}</p>
              </div>
            </div>
            <ChevronRight className="text-emerald-600 dark:text-emerald-400 w-4 h-4" />
          </section>
        )}

        {/* ABOUT KYRIOS */}
        <section className="space-y-4 animate-fade-up">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60">{t('events_screen.about_agency_label')}</h3>
          </div>
          <div 
            onClick={() => onNavigate('about')}
            className="bg-surface rounded-[2rem] p-8 relative overflow-hidden h-[240px] flex flex-col justify-end group cursor-pointer border border-outline-variant/40 shadow-sm active:scale-[0.98] transition-all"
          >
            <div className="absolute top-0 right-0 p-8">
              <div className="w-12 h-12 rounded-2xl bg-surface-container border border-outline-variant/40 flex items-center justify-center text-on-surface">
                <Info className="w-6 h-6" />
              </div>
            </div>
            <div className="relative z-10">
              <h4 className="text-on-surface font-headline font-bold text-2xl mb-2 tracking-tight">{t('events_screen.about_title')}</h4>
              <p className="text-on-surface-variant text-sm leading-relaxed max-w-[200px]">{t('events_screen.about_desc')}</p>
            </div>
          </div>
        </section>

        {/* Secret Chat — тонкий баннер на всю ширину, прямо над Quick Check-in */}
        <button
          onClick={openChat}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#A50021] text-white font-bold text-xs uppercase tracking-widest shadow-[0_4px_16px_rgba(165,0,33,0.35)] active:scale-[0.98] transition-all animate-fade-up"
        >
          <MessageCircle className="w-4 h-4" />
          {t('events_screen.secret_chat')}
        </button>

      </main>
    </div>
  );
}

// ── ВНУТРЕННИЙ КОМПОНЕНТ КАРТОЧКИ ДЛЯ ИСКЛЮЧЕНИЯ ДУБЛИРОВАНИЯ КОДА ──
function EventCard({ event, onCardClick }: { event: any; onCardClick: (id: string) => void }) {
  const { t } = useTranslation();
  const isGuestlist = event?.ticket_mode === 'guestlist';
  const placesLeft = event?.available !== null && event?.available !== undefined ? event.available : (event?.capacity || 400);
  const isSoldOut = !isGuestlist && placesLeft === 0 && (!event?.batches || !event.batches.some((b: any) => !b.is_sold_out && b.available > 0));

  const centerButtonText = event?.sales_paused 
    ? t('ticket_status.sales_paused')
    : isSoldOut 
      ? t('ticket_status.sold_out')
      : isGuestlist 
        ? t('ticket_status.get_ticket')
        : t('ticket_status.buy_ticket');

  const isVideo = event?.image_url?.match(/\.(mp4|webm)$/i);

  return (
    <section 
      onClick={() => onCardClick(event.id)}
      className="relative w-full aspect-[4/5] rounded-[2rem] overflow-hidden cursor-pointer group shadow-xl shadow-zinc-200/50 dark:shadow-black/50 animate-fade-up block"
    >
      {isVideo ? (
        <video
          src={event.image_url}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <img 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          src={event.image_url} 
          alt={event.title} 
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
      
      <div className="absolute inset-0 p-8 flex flex-col justify-end">
        <h2 className="text-white font-headline font-extrabold text-4xl mb-2 tracking-tight">{event.title}</h2>
        <p className="text-white/70 text-sm mb-6 font-medium">
          {new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[1.5rem] p-4 flex items-center justify-center">
          <div className={`w-full max-w-[260px] text-center py-3.5 text-white font-headline font-black text-sm tracking-widest rounded-xl transition-all transform group-hover:scale-[1.02] ${event.sales_paused ? 'bg-zinc-800 border border-zinc-700 text-zinc-400 shadow-inner' : 'bg-[#A50021] shadow-[0_4px_16px_rgba(165,0,33,0.4)]'}`}>
            {centerButtonText}
          </div>
        </div>
      </div>
    </section>
  );
}
