import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Screen } from '../App';
import { useMyTickets } from '../hooks/useMyTickets';
import TicketCard from '../components/TicketCard';

export default function Tickets({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  // ВОТ ЗДЕСЬ ДОБАВЛЕНО СЛОВО refresh, НА КОТОРОЕ РУГАЛСЯ КОМПИЛЯТОР
  const { tickets, loading, refresh } = useMyTickets();

  // Polling: проверяем базу каждые 3 секунды, чтобы узнать, прошла ли оплата
  useEffect(() => {
    const interval = setInterval(() => {
      if (refresh) refresh();
    }, 3000);

    return () => clearInterval(interval);
  }, [refresh]);

  // Защита от белого экрана: гарантируем, что tickets - это всегда массив
  const safeTickets = Array.isArray(tickets) ? tickets : [];

  return (
    <div className="min-h-screen bg-black pb-32">
      <header className="w-full sticky top-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-between px-6 py-4">
        <button 
          onClick={() => onNavigate('events')} 
          className="flex items-center justify-center w-10 h-10 rounded-full active:scale-95 duration-200 transition-all cursor-pointer"
        >
          <ArrowLeft className="text-white w-6 h-6" />
        </button>
        <h1 className="font-headline font-bold tracking-tight text-white text-base">My Tickets</h1>
        <div className="w-10"></div>
      </header>

      <main className="px-6 py-8">
        {/* Состояние загрузки */}
        {loading && safeTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white/60 text-sm font-medium">Checking tickets...</p>
          </div>
        ) : safeTickets.length === 0 ? (
          /* Если билетов нет в базе */
          <div className="text-center py-20 space-y-4">
            <div className="text-6xl">🎟️</div>
            <h3 className="font-headline font-bold text-xl text-white">No tickets yet</h3>
            <p className="text-white/60 text-sm px-10">If you just paid, please wait a few seconds...</p>
          </div>
        ) : (
          /* Успешный рендер билетов */
          <div className="grid gap-6">
            {safeTickets.map((ticket: any) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
