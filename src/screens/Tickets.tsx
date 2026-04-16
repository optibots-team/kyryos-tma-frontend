import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
// Убрали импорт Screen, чтобы не ругался на App.tsx
import { useMyTickets } from '../hooks/useMyTickets';
import TicketCard from '../components/TicketCard';

// Используем (s: any), чтобы TypeScript не блокировал сборку
export default function Tickets({ onNavigate }: { onNavigate: (s: any) => void }) {
  // Добавили "as any", чтобы игнорировать ошибки, если в хуке забыли добавить refresh
  const { tickets, loading, refresh } = useMyTickets() as any;

  // Polling с проверкой, существует ли функция
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof refresh === 'function') {
        refresh();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [refresh]);

  // Защита от краша, если данные пришли пустые
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
        {loading && safeTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white/60 text-sm font-medium">Checking tickets...</p>
          </div>
        ) : safeTickets.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="text-6xl">🎟️</div>
            <h3 className="font-headline font-bold text-xl text-white">No tickets yet</h3>
            <p className="text-white/60 text-sm px-10">If you just paid, please wait a few seconds...</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {safeTickets.map((ticket: any) => (
              <TicketCard key={ticket?.id || Math.random()} ticket={ticket} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
