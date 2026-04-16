// Хук для получения билетов текущего пользователя
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface FullTicket {
  ticket_id:         string
  ticket_code:       string | null  // <-- ДОДАНО ДЛЯ QR
  order_id:          string | null  // <-- ДОДАНО ДЛЯ КОШИКА
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

  // Винесли функцію назовні, щоб її можна було повертати у refresh
  const fetchTickets = useCallback(async () => {
    if (!telegramId) return

    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('tickets_full')
      .select('*')
      .eq('user_id', telegramId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setTickets(data ?? [])
    }
    setLoading(false)
  }, [telegramId])

  useEffect(() => {
    if (!telegramId) return

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
  }, [telegramId, fetchTickets])

  return { tickets, loading, error, refresh: fetchTickets }
}
