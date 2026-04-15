import { useMyTickets } from '@/hooks/useMyTickets'
import { TicketCard }   from '@/components/TicketCard'

interface Props {
  telegramId: number
}

export function TicketsPage({ telegramId }: Props) {
  const { tickets, loading, error } = useMyTickets(telegramId)

  const paidTickets = tickets.filter(t => t.status === 'paid' || t.status === 'used')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <p className="text-red-400 text-sm">Failed to load tickets: {error}</p>
      </div>
    )
  }

  if (paidTickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 gap-3">
        <span className="text-5xl">🎟</span>
        <p className="text-white/40 text-sm">No tickets yet</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8 space-y-5">
      <h1 className="text-white font-bold text-xl text-center mb-6">My Tickets</h1>
      {paidTickets.map(ticket => (
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
              }
            }
          }}
        />
      ))}
    </div>
  )
}
