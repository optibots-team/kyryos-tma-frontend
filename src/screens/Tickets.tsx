import { useMyTickets } from '../hooks/useMyTickets';
import TicketCard from '../components/TicketCard';
import type { Screen }  from '../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

// Берём telegram_id из Telegram SDK
function getTelegramId(): number | null {
  return window.Telegram?.WebApp?.initDataUnsafe?.user?.id ?? null;
}

export default function Tickets({ onNavigate }: Props) {
  const telegramId = getTelegramId();
  const { tickets, loading, error } = useMyTickets(telegramId);

  const visibleTickets = tickets.filter(
    t => t.status === 'paid' || t.status === 'used'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-3 px-6">
        <span className="text-4xl">⚠️</span>
        <p className="text-red-400 text-sm text-center">{error}</p>
      </div>
    );
  }

  if (visibleTickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <span className="text-6xl">🎟</span>
        <p className="text-white/40 text-sm">No tickets yet</p>
        <button
          onClick={() => onNavigate('events')}
          className="mt-2 px-6 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-all"
        >
          Browse events
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 pt-8 pb-28 space-y-5">
      <h1 className="text-white font-bold text-xl text-center mb-6">
        My Tickets
      </h1>
      {visibleTickets.map(ticket => (
        <TicketCard
          key={ticket.ticket_id}
          ticket={{
            id:                ticket.ticket_id,
            status:            ticket.status,
            created_at:        ticket.created_at,
            stripe_session_id: ticket.stripe_session_id,
            tier: {
              name:  ticket.tier_name,
              price: ticket.tier_price,
              event: {
                title:      ticket.event_title,
                event_date: ticket.event_date,
                location:   ticket.event_location,
              },
            },
          }}
        />
      ))}
    </div>
  );
}
