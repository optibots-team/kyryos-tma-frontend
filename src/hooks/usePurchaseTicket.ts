import { useState } from 'react'

const SUPABASE_URL = 'https://uuxgtpzfxymhyekeuryf.supabase.co'
// 🚨 ВАЖНО: Вставь сюда свой реальный ключ из настроек Supabase (Settings -> API -> anon public)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1eGd0cHpmeHltaHlla2V1cnlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDI5MjQsImV4cCI6MjA5MTM3ODkyNH0.c0czFMKIDWoQfAMHA4TWclWfIAXvNt3nucf9wT_aJG8' 

const CHECKOUT_URL = `${SUPABASE_URL}/functions/v1/smart-function`

export function usePurchaseTicket() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const purchaseTicket = async (tierId: string, quantity: number = 1) => {
    setLoading(true)
    setError(null)

    try {
      // Безопасное обращение к объекту Telegram
      const tg = (window as any).Telegram?.WebApp;
      const telegramId = tg?.initDataUnsafe?.user?.id;

      if (!telegramId) {
        setError('Нет связи с Telegram. Откройте приложение внутри мессенджера.');
        setLoading(false);
        return;
      }

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
          quantity: quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка со стороны сервера при создании чекаута');
      }

      // Бэкенд может вернуть ссылку как checkout_url или просто url
      const finalUrl = data.checkout_url || data.url;

      if (finalUrl) {
        // Если мы внутри телеграма - открываем через его метод, иначе через обычный браузер
        if (tg && typeof tg.openLink === 'function') {
          tg.openLink(finalUrl);
        } else {
          window.location.href = finalUrl;
        }
      } else {
        throw new Error('Сервер не вернул ссылку на оплату Stripe');
      }

    } catch (err: any) {
      // Специально перехватываем TypeError, чтобы показать понятную причину
      if (err.name === 'TypeError') {
        setError(`Блокировка браузера (CORS) или неверный API-ключ: ${err.message}`);
      } else {
        setError(`Ошибка: ${err.message}`);
      }
    } finally {
      setLoading(false)
    }
  }

  return { purchaseTicket, loading, error }
}
