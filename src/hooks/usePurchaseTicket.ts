import { useState } from 'react'

// Твой проектный URL и Anon Key (возьми их из настроек Supabase -> API)
const SUPABASE_URL = 'https://uuxgtpzfxymhyekeuryf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1eGd0cHpmeHltaHlla2V1cnlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDI5MjQsImV4cCI6MjA5MTM3ODkyNH0.c0czFMKIDWoQfAMHA4TWclWfIAXvNt3nucf9wT_aJG8' 

const CHECKOUT_URL = `${SUPABASE_URL}/functions/v1/smart-function`

function getTelegramId(): number | null {
  // Проверяем наличие WebApp и ID пользователя
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
  return user?.id ?? null;
}

export function usePurchaseTicket() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const purchaseTicket = async (tierId: string) => {
    setLoading(true)
    setError(null)

    const telegramId = getTelegramId()

    if (!telegramId) {
      setError('Open this app inside Telegram')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(CHECKOUT_URL, {
        method:  'POST',
        headers: { 
          'Content-Type': 'application/json',
          // ВАЖНО: без этого заголовка Supabase выдаст ошибку авторизации
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body:    JSON.stringify({
          telegram_id: telegramId,
          tier_id:     tierId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Если функция вернула ошибку (например, 404 или 400), выводим её текст
        throw new Error(data.error ?? 'Payment initialization failed')
      }

      if (data.checkout_url) {
        // Открываем Stripe Checkout через системный метод Telegram
        window.Telegram?.WebApp?.openLink(data.checkout_url)
      } else {
        throw new Error('No checkout URL received')
      }

    } catch (err: any) {
      console.error('Purchase error:', err)
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return { purchaseTicket, loading, error }
}
