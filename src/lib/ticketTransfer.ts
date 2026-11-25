// ============================================================
// lib/ticketTransfer.ts — передача билета другу
//
// 🔌 БЭКЕНД: edge function `ticket-transfer` (готова).
//   POST {SUPABASE_URL}/functions/v1/ticket-transfer
//   Личность берётся из подписанных данных Telegram → в каждом запросе `init_data`
//   (Telegram.WebApp.initData), `telegram_id` НЕ отправляем.
//     { action:'create', init_data, ticket_id }  → { token, link, share_text, share_url }
//         (если по билету уже есть ожидающая передача — вернётся тот же token)
//     { action:'cancel', init_data, token }      → { success }   (только отправитель)
//     { action:'preview', init_data, token }     → { status: 'pending'|'accepted'|'cancelled',
//                                                    event_title, event_date, ticket_category, access_category, from_name }
//     { action:'accept', init_data, token }      → { success }   (билет переходит получателю, QR меняется)
//   Ошибки: { success:false, error:"…" }.
//   Один токен = один билет. Токен приходит в startapp=tr_<token>.
// ============================================================

export const TRANSFER_ENABLED = true;

export const BOT_APP_URL = 'https://t.me/kyrios_events_bot/app';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

type TransferResult<T> = { ok: boolean; error?: string } & Partial<T>;

async function call<T>(body: Record<string, unknown>): Promise<TransferResult<T>> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/ticket-transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ ...body, init_data: window.Telegram?.WebApp?.initData || '' }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.error || data?.success === false) {
      return { ok: false, error: data?.error || data?.message || 'Transfer failed' } as TransferResult<T>;
    }
    return { ok: true, ...(data as T) } as TransferResult<T>;
  } catch (err) {
    console.error('[ticketTransfer] network error:', err);
    return { ok: false, error: 'Network error — try again' } as TransferResult<T>;
  }
}

export const createTransfer = (ticketId: string) =>
  call<{ token: string; link: string; share_text: string; share_url: string }>({ action: 'create', ticket_id: ticketId });

export const previewTransfer = (token: string) =>
  call<{ status: string; event_title: string; event_date: string; ticket_category: string; access_category: string; from_name: string }>({ action: 'preview', token });

export const acceptTransfer = (token: string) =>
  call<{ success: boolean }>({ action: 'accept', token });

// Отмена идёт по токену. create идемпотентен (для ожидающей передачи вернёт тот же token),
// поэтому токен берём через него — работает и после перезагрузки списка билетов.
export async function cancelTransfer(ticketId: string): Promise<TransferResult<{ success: boolean }>> {
  const c = await createTransfer(ticketId);
  if (!c.ok || !c.token) return { ok: false, error: c.error || 'Transfer failed' };
  return call<{ success: boolean }>({ action: 'cancel', token: c.token });
}

// Тексты (RU/EN/UA) — внутри модуля, чтобы не править файлы локалей
const TEXTS = {
  ru: {
    btn: 'Передать другу',
    pending: 'Ждём, пока друг примет билет',
    cancel: 'Отменить передачу',
    title: 'Вам передали билет',
    desc: (e: string, from: string) => `${from ? `${from} передаёт вам билет` : 'Вам передают билет'}${e ? ` на ${e}` : ''}. Принять?`,
    accept: 'Принять билет',
    decline: 'Не сейчас',
    accepting: 'ОБРАБОТКА...',
    gone: 'Эта передача уже принята или отменена',
  },
  en: {
    btn: 'Send to a friend',
    pending: 'Waiting for your friend to accept',
    cancel: 'Cancel transfer',
    title: 'A ticket was sent to you',
    desc: (e: string, from: string) => `${from ? `${from} is sending you a ticket` : 'You are being sent a ticket'}${e ? ` for ${e}` : ''}. Accept it?`,
    accept: 'Accept ticket',
    decline: 'Not now',
    accepting: 'PROCESSING...',
    gone: 'This transfer was already accepted or cancelled',
  },
  ua: {
    btn: 'Передати другу',
    pending: 'Чекаємо, поки друг прийме квиток',
    cancel: 'Скасувати передачу',
    title: 'Вам передали квиток',
    desc: (e: string, from: string) => `${from ? `${from} передає вам квиток` : 'Вам передають квиток'}${e ? ` на ${e}` : ''}. Прийняти?`,
    accept: 'Прийняти квиток',
    decline: 'Не зараз',
    accepting: 'ОБРОБКА...',
    gone: 'Цю передачу вже прийнято або скасовано',
  },
} as const;

export function transferTexts(lang?: string) {
  const l = (lang || 'ru').slice(0, 2).toLowerCase();
  if (l === 'en') return TEXTS.en;
  if (l === 'ua' || l === 'uk') return TEXTS.ua;
  return TEXTS.ru;
}

// Открывает стандартное окно Telegram «Поделиться» (друзья, поиск по нику, «Отправить»).
// share_url приходит готовым от бэкенда (с текстом и ссылкой).
export function openShare(shareUrl: string) {
  const tg = window.Telegram?.WebApp;
  if (tg?.openTelegramLink) tg.openTelegramLink(shareUrl);
  else window.open(shareUrl, '_blank');
}

export function notify(message: string) {
  const tg = window.Telegram?.WebApp;
  if (tg?.showAlert) tg.showAlert(message);
  else alert(message);
}
