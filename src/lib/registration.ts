// ============================================================
// lib/registration.ts — регистрация при первом входе и контакты в профиле
// API: функция update-profile (как и раньше, с telegram_id)
//   {telegram_id, action:'status'}                     → { registered, marketing_consent, (phone, email, birth_date) }
//   {telegram_id, action:'register', first_name, last_name, phone, email, birth_date, data_consent:true}
//                                                      → { success:true, registered:true } | 400 { success:false, error }
//   {telegram_id, action:'set_marketing', marketing_consent:boolean}
//   {telegram_id, action:'update_contact', phone, email}
// ============================================================
import { supabase } from './supabaseClient';

export interface Country {
  iso: string;
  dial: string;
}

// Только европейские страны и Великобритания — бэкенд принимает только эти коды
export const COUNTRIES: Country[] = [
  { iso: 'PL', dial: '48' }, // по умолчанию
  { iso: 'AT', dial: '43' }, { iso: 'AL', dial: '355' }, { iso: 'AD', dial: '376' }, { iso: 'BE', dial: '32' },
  { iso: 'BG', dial: '359' }, { iso: 'BA', dial: '387' }, { iso: 'GB', dial: '44' }, { iso: 'HU', dial: '36' },
  { iso: 'DE', dial: '49' }, { iso: 'GR', dial: '30' }, { iso: 'DK', dial: '45' }, { iso: 'IE', dial: '353' },
  { iso: 'IS', dial: '354' }, { iso: 'ES', dial: '34' }, { iso: 'IT', dial: '39' }, { iso: 'CY', dial: '357' },
  { iso: 'XK', dial: '383' }, { iso: 'LV', dial: '371' }, { iso: 'LT', dial: '370' }, { iso: 'LI', dial: '423' },
  { iso: 'LU', dial: '352' }, { iso: 'MT', dial: '356' }, { iso: 'MD', dial: '373' }, { iso: 'MC', dial: '377' },
  { iso: 'NL', dial: '31' }, { iso: 'MK', dial: '389' }, { iso: 'NO', dial: '47' }, { iso: 'PT', dial: '351' },
  { iso: 'RO', dial: '40' }, { iso: 'SM', dial: '378' }, { iso: 'RS', dial: '381' }, { iso: 'SK', dial: '421' },
  { iso: 'SI', dial: '386' }, { iso: 'UA', dial: '380' }, { iso: 'FI', dial: '358' }, { iso: 'FR', dial: '33' },
  { iso: 'HR', dial: '385' }, { iso: 'ME', dial: '382' }, { iso: 'CZ', dial: '420' }, { iso: 'CH', dial: '41' },
  { iso: 'SE', dial: '46' }, { iso: 'EE', dial: '372' },
];

export const flagEmoji = (iso: string) =>
  iso.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));

export const digitsOnly = (v: string) => v.replace(/\D/g, '');

// Маска номера: "123 456 789"
export function formatNational(digits: string, iso: string) {
  const max = iso === 'PL' ? 9 : 12;
  return digitsOnly(digits).slice(0, max).replace(/(\d{3})(?=\d)/g, '$1 ').trim();
}

export function validNational(digits: string, iso: string) {
  const d = digitsOnly(digits);
  return iso === 'PL' ? d.length === 9 : d.length >= 6 && d.length <= 12;
}

export const fullPhone = (iso: string, digits: string) => {
  const c = COUNTRIES.find(x => x.iso === iso) || COUNTRIES[0];
  return `+${c.dial}${digitsOnly(digits)}`;
};

// "+48570272435" → { iso:'PL', national:'570272435' } (по самому длинному совпавшему коду)
export function splitPhone(full?: string | null): { iso: string; national: string } {
  const d = digitsOnly(full || '');
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  const hit = sorted.find(c => d.startsWith(c.dial));
  return hit ? { iso: hit.iso, national: d.slice(hit.dial.length) } : { iso: 'PL', national: d };
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ДД.ММ.ГГГГ (маска при вводе)
export function formatBirthInput(v: string) {
  const d = digitsOnly(v).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}.${d.slice(2)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 4)}.${d.slice(4)}`;
}

// 'ДД.ММ.ГГГГ' → 'YYYY-MM-DD' или null, если дата невозможна / в будущем
export function birthToIso(v: string): string | null {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(v);
  if (!m) return null;
  const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) return null;
  if (year < 1900 || dt.getTime() > Date.now()) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

export const isoToBirth = (iso?: string | null) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
};

async function call(body: Record<string, unknown>) {
  const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  const supabaseUrl = (supabase as any).supabaseUrl;
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${supabaseUrl}/functions/v1/update-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token || (supabase as any).supabaseKey}`,
    },
    body: JSON.stringify({ telegram_id: tgId, ...body }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data?.success !== false, data };
}

export const getStatus = () => call({ action: 'status' });

export const registerUser = (p: {
  first_name: string; last_name: string; phone: string; email: string; birth_date: string;
}) => call({ action: 'register', ...p, data_consent: true });

export const setMarketing = (value: boolean) => call({ action: 'set_marketing', marketing_consent: value });

export const updateContact = (phone: string, email: string) => call({ action: 'update_contact', phone, email });

// ---------- Тексты (RU/EN/UA) — внутри модуля, файлы локалей править не нужно ----------
const TEXTS = {
  ru: {
    title: 'Прежде чем начнём', subtitle: 'Несколько данных, чтобы создать ваш аккаунт',
    firstName: 'Имя', lastName: 'Фамилия', phone: 'Телефон', email: 'Email', birth: 'Дата рождения', birthPh: 'ДД.ММ.ГГГГ',
    consent: 'Я согласен(на) на обработку персональных данных', create: 'Создать аккаунт', creating: 'Создаём...',
    required: 'Обязательное поле', badPhone: 'Проверьте номер телефона', badEmail: 'Проверьте email', badBirth: 'Введите корректную дату рождения',
    netError: 'Не удалось связаться с сервером, попробуйте ещё раз',
    contactTitle: 'Контакты и уведомления', marketing: 'Хочу получать анонсы и новости', birthLabel: 'Дата рождения',
    birthHint: 'Изменить можно только через администратора', save: 'Сохранить', saved: 'Сохранено', edit: 'Редактировать', cancel: 'Отмена',
  },
  en: {
    title: 'Before we start', subtitle: 'A few details to create your account',
    firstName: 'First name', lastName: 'Last name', phone: 'Phone', email: 'Email', birth: 'Date of birth', birthPh: 'DD.MM.YYYY',
    consent: 'I agree to the processing of my personal data', create: 'Create account', creating: 'Creating...',
    required: 'Required field', badPhone: 'Check the phone number', badEmail: 'Check the email', badBirth: 'Enter a valid date of birth',
    netError: 'Could not reach the server, please try again',
    contactTitle: 'Contacts & notifications', marketing: 'I want to receive announcements and news', birthLabel: 'Date of birth',
    birthHint: 'Can only be changed by an administrator', save: 'Save', saved: 'Saved', edit: 'Edit', cancel: 'Cancel',
  },
  ua: {
    title: 'Перш ніж почнемо', subtitle: 'Кілька даних, щоб створити ваш акаунт',
    firstName: "Ім'я", lastName: 'Прізвище', phone: 'Телефон', email: 'Email', birth: 'Дата народження', birthPh: 'ДД.ММ.РРРР',
    consent: 'Я погоджуюсь на обробку персональних даних', create: 'Створити акаунт', creating: 'Створюємо...',
    required: "Обов'язкове поле", badPhone: 'Перевірте номер телефону', badEmail: 'Перевірте email', badBirth: 'Введіть коректну дату народження',
    netError: "Не вдалося зв'язатися із сервером, спробуйте ще раз",
    contactTitle: 'Контакти та сповіщення', marketing: 'Хочу отримувати анонси та новини', birthLabel: 'Дата народження',
    birthHint: 'Змінити можна лише через адміністратора', save: 'Зберегти', saved: 'Збережено', edit: 'Редагувати', cancel: 'Скасувати',
  },
} as const;

export function regTexts(lang?: string) {
  const l = (lang || 'ru').slice(0, 2).toLowerCase();
  if (l === 'en') return TEXTS.en;
  if (l === 'ua' || l === 'uk') return TEXTS.ua;
  return TEXTS.ru;
}
