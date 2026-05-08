import { useState } from 'react'

const SUPABASE_URL = 'https://uuxgtpzfxymhyekeuryf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1eGd0cHpmeHltaHlla2V1cnlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDI5MjQsImV4cCI6MjA5MTM3ODkyNH0.c0czFMKIDWoQfAMHA4TWclWfIAXvNt3nucf9wT_aJG8' 

const CHECKOUT_URL = `${SUPABASE_URL}/functions/v1/smart-function`

export function usePurchaseTicket() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // Добавили promoCode и поменяли tierId на eventId
  const purchaseTicket = async (eventId: string, quantity: number = 1, promoCode?: string) => {
    setLoading(true)
    setError(null)

    // Получаем сразу ВЕСЬ объект юзера из ТГ
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;

    if (!user || !user.id) {
      setError('Open this app inside Telegram')
      setLoading(false)
      return { success: false, is_free: false }
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
          telegram_id: user.id,
          event_id:    eventId, // Отправляем event_id
          quantity:    quantity,
          promo_code:  promoCode || null, // Отправляем промокод бэкенду
          // Передаем полные данные для Upsert на бэкенде
          user_data: {
            username: user.username || '',
            first_name: user.first_name || '',
            last_name: user.last_name || ''
          }
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? 'Payment initialization failed')
      }

      // ВЕТКА А: Платный билет (Stripe)
      if (data.checkout_url) {
        // Оставляем пользователя строго внутри Mini App
        window.location.href = data.checkout_url;
        return { success: true, is_free: false };
      } 
      // ВЕТКА Б: Бесплатный билет по промокоду (100% скидка)
      else if (data.is_free) {
        return { success: true, is_free: true };
      } 
      // Непредвиденный ответ бэкенда
      else {
        throw new Error('No checkout URL received')
      }

    } catch (err: any) {
      console.error('Purchase error:', err)
      setError(err.message || 'Unknown error')
      return { success: false, is_free: false };
    } finally {
      setLoading(false)
    }
  }

  return { purchaseTicket, loading, error }
}
