import { useState } from 'react'

// Твой URL и ключ (убедись, что SUPABASE_ANON_KEY актуален в твоем проекте)
const SUPABASE_URL = 'https://uuxgtpzfxymhyekeuryf.supabase.co'
const SUPABASE_ANON_KEY = 'ТВОЙ_ANON_KEY_ИЗ_НАСТРОЕК_API' 

const CHECKOUT_URL = `${SUPABASE_URL}/functions/v1/smart-function`

function getTelegramId(): number | null {
  return window.Telegram?.WebApp?.initDataUnsafe?.user?.id ?? null
}

export function usePurchaseTicket() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Добавляем quantity (по умолчанию 1)
  const purchaseTicket = async (tierId: string, quantity: number = 1) => {
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
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          telegram_id: telegramId,
          tier_id: tierId,
          quantity: quantity, // Передаем количество на бэкенд
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? 'Payment failed')
      }

      if (data.checkout_url) {
        window.Telegram?.WebApp?.openLink(data.checkout_url)
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return { purchaseTicket, loading, error }
}
