import { useState } from 'react'

// ВАЖНО: slug функции — smart-function (не create-checkout)
const CHECKOUT_URL =
  'https://uuxgtpzfxymhyekeuryf.supabase.co/functions/v1/smart-function'

function getTelegramId(): number | null {
  return window.Telegram?.WebApp?.initDataUnsafe?.user?.id ?? null
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
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          telegram_id: telegramId,
          tier_id:     tierId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? 'Payment initialization failed')
      }

      // Открываем Stripe Checkout прямо внутри Telegram
      window.Telegram?.WebApp?.openLink(data.checkout_url)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return { purchaseTicket, loading, error }
}
