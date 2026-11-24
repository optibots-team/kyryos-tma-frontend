import { useState } from 'react'

const SUPABASE_URL = 'https://uuxgtpzfxymhyekeuryf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1eGd0cHpmeHltaHlla2V1cnlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDI5MjQsImV4cCI6MjA5MTM3ODkyNH0.c0czFMKIDWoQfAMHA4TWclWfIAXvNt3nucf9wT_aJG8' 

const CHECKOUT_URL = `${SUPABASE_URL}/functions/v1/smart-function`

export function usePurchaseTicket() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // Изменили eventId на ticketTypeId
  // ticketTypeId = null → режим «У меня есть код»: тип билета бэкенд берёт из кода
  // opts.paymentMethod → payment_method ('card' | 'blik'); opts.eventId → tier_id (только в режиме «по коду», когда ticketTypeId = null)
  const purchaseTicket = async (ticketTypeId: string | null, quantity: number = 1, promoCode?: string, opts?: { paymentMethod?: 'card' | 'blik'; eventId?: string }) => {
    setLoading(true)
    setError(null)

    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;

    if (!user || !user.id) {
      setError('Open this app inside Telegram')
      setLoading(false)
      return null;
    }

    try {
      const response = await fetch(CHECKOUT_URL, {
        method:  'POST',
        headers: { 
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          telegram_id:    user.id,
          // Только по коду: ticket_type_id не нужен, тип берётся из кода; id события идёт в поле tier_id
          ...(ticketTypeId ? { ticket_type_id: ticketTypeId, quantity } : { tier_id: opts?.eventId }),
          ...(opts?.paymentMethod ? { payment_method: opts.paymentMethod } : {}),
          promo_code:     promoCode || null,
          user_data: {
            username:   user.username || '',
            first_name: user.first_name || '',
            last_name:  user.last_name || ''
          }
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? 'Payment initialization failed')
      }

      return data;

    } catch (err: any) {
      console.error('Purchase error:', err)
      setError(err.message || 'Unknown error')
      return null;
    } finally {
      setLoading(false)
    }
  }

  return { purchaseTicket, loading, error }
}
