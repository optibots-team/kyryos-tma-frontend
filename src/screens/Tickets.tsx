import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import QRCode from 'react-qr-code';

// 1. Встроенный хук с ТИХОЙ перезагрузкой
function useSafeTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); 

  const fetchTickets = useCallback(async (isSilent = false) => {
    try {
      const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      if (!isSilent) setLoading(true);

      const { data, error } = await supabase
        .from('tickets')
        .select('*, price_tiers(*, events(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTickets(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return { tickets, loading, refresh: fetchTickets };
}

// 2. Бронебойная карточка с "распаковкой" массивов Supabase
function SafeTicketCard({ ticket }: { ticket: any }) {
  if (!ticket || !ticket.id) return null;

  let tier = ticket?.price_tiers;
  if (Array.isArray(tier)) tier = tier[0];
  tier = tier || {};

  let event = tier?.events;
  if (Array.isArray(event)) event = event[0];
  event = event || {};

  const title = event?.title && typeof event.title === 'string' ? event.title : 'UNITIS FEST';
  const location = event?.location && typeof event.location === 'string' ? event.location : 'Warsaw';
  const tierName = tier?.name && typeof tier.name === 'string' ? tier.name : 'Standard Ticket';
  
  const isPaid = ticket.status === 'paid';
  const isUsed = ticket.status === 'used';
  const showQR = isPaid || isUsed;

  const shortId = ticket.id ? `${String(ticket.id).slice(0, 8)}...${String(ticket.id).slice(-4)}` : '';

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-xl w-full max-w-sm mx-auto">
      <div className="mb-4">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-white font-bold text-xl">{title}</h2>
          <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border ${
            isPaid ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 
            isUsed ? 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' : 
            'bg-amber-500/20 text-amber-400 border-amber-500/30'
          }`}>
            {ticket.status || 'pending'}
          </span>
        </div>
        <p className="text-white/60 text-sm">📍 {location}</p>
        <p className="text-white/60 text-sm">🎟 {tierName}</p>
      </div>

      <div className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl mb-4 min-h-[180px] relative overflow-hidden">
        {showQR ? (
          <>
            <div className={isUsed ? 'opacity-20 blur-[2px] transition-all' : ''}>
              <QRCode value={String(ticket.id)} size={160} />
            </div>
            {isUsed && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/80 text-white font-black text-2xl tracking-widest px-6 py-2 rounded-xl -rotate-12 border-2 border-white/20 backdrop-blur-sm">
                  USED
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-zinc-500 text-sm font-medium">Awaiting payment...</div>
        )}
      </div>
      <p className="text-white/30 text-[10px] font-mono text-center tracking-widest">{shortId}</p>
    </div>
  );
}

// 3. Главный экран
export default function Tickets({ onNavigate }: { onNavigate: (s: any) => void }) {
  const { tickets, loading, refresh } = useSafeTickets();

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof refresh === 'function') refresh(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

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
            <p className="text-white/60 text-sm font-medium">Loading tickets...</p>
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
              <SafeTicketCard key={ticket?.id || Math.random()} ticket={ticket} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
