// ============================================================
// lib/ticketTransfer.ts — передача билета другу
//
// 🔌 КОНТРАКТ С БЭКЕНДОМ (edge function `transfer-ticket`, ещё не создана):
//   POST {SUPABASE_URL}/functions/v1/transfer-ticket
//   Body: { action, init_data, ticket_id?, transfer_code? }
//     action 'create'  + ticket_id     → { transfer_code }        (идемпотентно: если передача уже ждёт — вернуть тот же код)
//     action 'preview' + transfer_code → { event_title, from_name } (необязательно, для красивого окна)
//     action 'accept'  + transfer_code → { success: true }        (билет переезжает на аккаунт принявшего, QR обновляется)
//     action 'cancel'  + ticket_id     → { success: true }
//   Ошибки: HTTP != 200 и { error: "текст" }.
//   В tickets_full нужно поле transfer_pending (boolean) — «ждёт, пока друг примет».
// ============================================================

// ⚠️ Включить (true), когда бэкенд задеплоит transfer-ticket. Пока false — кнопка «Передать другу» скрыта.
export const TRANSFER_ENABLED = false;

export const BOT_APP_URL = 'https://t.me/kyrios_events_bot/app';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

type TransferResult<T> = { ok: boolean; error?: string } & Partial<T>;

async function call<T>(body: Record<string, unknown>): Promise<TransferResult<T>> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/transfer-ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ ...body, init_data: window.Telegram?.WebApp?.initData || '' }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.error) {
      return { ok: false, error: data?.error || data?.message || 'Transfer failed' } as TransferResult<T>;
    }
    return { ok: true, ...(data as T) } as TransferResult<T>;
  } catch (err) {
    console.error('[ticketTransfer] network error:', err);
    return { ok: false, error: 'Network error — try again' } as TransferResult<T>;
  }
}

export const createTransfer = (ticketId: string) =>
  call<{ transfer_code: string }>({ action: 'create', ticket_id: ticketId });

export const previewTransfer = (code: string) =>
  call<{ event_title?: string; from_name?: string }>({ action: 'preview', transfer_code: code });

export const acceptTransfer = (code: string) =>
  call<{ success: boolean }>({ action: 'accept', transfer_code: code });

export const cancelTransfer = (ticketId: string) =>
  call<{ success: boolean }>({ action: 'cancel', ticket_id: ticketId });

// Тексты (RU/EN/UA) — внутри модуля, чтобы не править файлы локалей
const TEXTS = {
  ru: {
    btn: 'Передать другу',
    pending: 'Ждём, пока друг примет билет',
    cancel: 'Отменить передачу',
    shareTable: (e: string) => `Привет! Я купил нам билеты и стол на ${e}. Тебе нужно только перейти в бот, открыть приложение и принять билет.`,
    share: (e: string) => `Привет! Я купил нам билеты на ${e}. Тебе нужно только перейти в бот, открыть приложение и принять билет.`,
    title: 'Вам передали билет',
    desc: (e: string, from: string) => `${from ? `${from} передаёт вам билет` : 'Вам передают билет'}${e ? ` на ${e}` : ''}. Принять?`,
    accept: 'Принять билет',
    decline: 'Не сейчас',
    accepting: 'ОБРАБОТКА...',
  },
  en: {
    btn: 'Send to a friend',
    pending: 'Waiting for your friend to accept',
    cancel: 'Cancel transfer',
    shareTable: (e: string) => `Hey! I bought us tickets and a table for ${e}. All you need to do is open the bot, launch the app and accept the ticket.`,
    share: (e: string) => `Hey! I bought us tickets for ${e}. All you need to do is open the bot, launch the app and accept the ticket.`,
    title: 'A ticket was sent to you',
    desc: (e: string, from: string) => `${from ? `${from} is sending you a ticket` : 'You are being sent a ticket'}${e ? ` for ${e}` : ''}. Accept it?`,
    accept: 'Accept ticket',
    decline: 'Not now',
    accepting: 'PROCESSING...',
  },
  ua: {
    btn: 'Передати другу',
    pending: 'Чекаємо, поки друг прийме квиток',
    cancel: 'Скасувати передачу',
    shareTable: (e: string) => `Привіт! Я купив нам квитки та стіл на ${e}. Тобі потрібно лише перейти в бот, відкрити застосунок і прийняти квиток.`,
    share: (e: string) => `Привіт! Я купив нам квитки на ${e}. Тобі потрібно лише перейти в бот, відкрити застосунок і прийняти квиток.`,
    title: 'Вам передали квиток',
    desc: (e: string, from: string) => `${from ? `${from} передає вам квиток` : 'Вам передають квиток'}${e ? ` на ${e}` : ''}. Прийняти?`,
    accept: 'Прийняти квиток',
    decline: 'Не зараз',
    accepting: 'ОБРОБКА...',
  },
} as const;

export function transferTexts(lang?: string) {
  const l = (lang || 'ru').slice(0, 2).toLowerCase();
  if (l === 'en') return TEXTS.en;
  if (l === 'ua' || l === 'uk') return TEXTS.ua;
  return TEXTS.ru;
}

// Открывает стандартное окно Telegram «Поделиться» (список друзей, поиск по нику, кнопка «Отправить»)
export function shareTransferLink(code: string, text: string) {
  const link = `${BOT_APP_URL}?startapp=tr_${code}`;
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
  const tg = window.Telegram?.WebApp;
  if (tg?.openTelegramLink) tg.openTelegramLink(shareUrl);
  else window.open(shareUrl, '_blank');
}

export function notify(message: string) {
  const tg = window.Telegram?.WebApp;
  if (tg?.showAlert) tg.showAlert(message);
  else alert(message);
}
