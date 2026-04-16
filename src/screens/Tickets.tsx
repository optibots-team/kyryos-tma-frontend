import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Screen } from '../App';
import { useMyTickets } from '../hooks/useMyTickets';
import TicketCard from '../components/TicketCard';

export default function Tickets({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  // Получаем билеты из хука
  const { tickets, loading, error, refresh } = useMyTickets();

  return (
    <>
      <header className="w-full sticky top-0 z-50 bg-slate-50/80 backdrop-blur-xl flex items-center justify-between px-6 py-4">
        <button 
          onClick={() => onNavigate('events')} 
          className="flex items-center justify-center w-10 h-10 rounded-full active:scale-95 duration-200 transition-all cursor-pointer"
        >
          <ArrowLeft className="text-zinc-900 w-6 h-6" />
        </button>
        <h1 className="font-headline font-bold tracking-tight text-zinc-900 text-base">My Tickets</h1>
        <button 
          onClick={refresh}
          className="flex items-center justify-center w-10 h-10 rounded-full active:scale-95 duration-200 transition-all cursor-pointer"
        >
          <RefreshCw className={`text-zinc-900 w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      <main className="px-6 py-8 pb-32 space-y-8">
        {/* Состояние загрузки */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-secondary text-sm font-medium">Loading your tickets...</p>
          </div>
        )}

        {/* Состояние ошибки */}
        {error && !loading && (
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
            <p className="text-red-500 text-sm font-bold mb-2">Error loading tickets</p>
            <p className="text-red-400 text-xs mb-4">{error}</p>
            <button onClick={refresh} className="text-xs font-bold uppercase tracking-widest text-red-500 underline">Try again</button>
          </div>
        )}

        {/* Если билетов нет */}
        {!loading && !error && (!tickets || tickets.length === 0) && (
          <div className="text-center py-20 space-y-4">
            <div className="text-6xl">🎟️</div>
            <h3 className="font-headline font-bold text-xl">No tickets found</h3>
            <p className="text-secondary text-sm px-10">After payment is processed, your ticket will appear here automatically.</p>
            <button 
              onClick={() => onNavigate('events')}
              className="mt-6 px-8 py-3 bg-zinc-900 text-white rounded-full font-bold text-sm"
            >
              Browse Events
            </button>
          </div>
        )}

        {/* Список билетов - БЕЗОПАСНЫЙ ЦИКЛ */}
        {!loading && tickets && tickets.length > 0 && (
          <div className="grid grid-cols-1 gap-8">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
