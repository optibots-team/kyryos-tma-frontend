// Хук для получения билетов текущего пользователя
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface FullTicket {
  ticket_id:         string
  user_id:           number
  status:            'pending' | 'paid' | 'used'
  created_at:        string
  stripe_session_id: string | null
  tier_id:           string
  tier_name:         string
  tier_price:        number
  event_id:          string
  event_title:       string
  event_description: string
  event_location:    string
  event_date:        string
}

export function useMyTickets(telegramId: number | null) {
  const [tickets, setTickets]   = useState<FullTicket[]>([])
  const [loading, setLoading]   = useState(true)
  const [error,   setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!telegramId) return

    const fetchTickets = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('tickets_full')
        .select('*')
        .eq('user_id', telegramId)
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setTickets(data ?? [])
      }
      setLoading(false)
    }

    fetchTickets()

    // Realtime: автообновление когда webhook меняет статус на 'paid'
    const channel = supabase
      .channel('tickets-changes')
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'tickets',
        filter: `user_id=eq.${telegramId}`,
      }, () => {
        fetchTickets()   // перезапрашиваем при любом UPDATE
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [telegramId])

  return { tickets, loading, error }
}
