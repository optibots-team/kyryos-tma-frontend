import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PhoneField from '../components/PhoneField';
import {
  regTexts, registerUser, validNational, fullPhone, EMAIL_RE, formatBirthInput, birthToIso,
} from '../lib/registration';

// Экран «Прежде чем начнём» — показывается перед входом в приложение, пока не зарегистрирован
export default function Registration({ onDone }: { onDone: () => void }) {
  const { i18n } = useTranslation();
  const tx = regTexts(i18n.language);
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

  const [firstName, setFirstName] = useState(tgUser?.first_name || '');
  const [lastName, setLastName] = useState(tgUser?.last_name || '');
  const [iso, setIso] = useState('PL');
  const [national, setNational] = useState('');
  const [email, setEmail] = useState('');
  const [birth, setBirth] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.first = tx.required;
    if (!lastName.trim()) e.last = tx.required;
    if (!validNational(national, iso)) e.phone = tx.badPhone;
    if (!EMAIL_RE.test(email.trim())) e.email = tx.badEmail;
    const birthIso = birthToIso(birth);
    if (!birthIso) e.birth = tx.badBirth;
    setErrors(e);
    if (Object.keys(e).length || !consent || !birthIso) return;

    setBusy(true);
    try {
      const { ok, data } = await registerUser({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: fullPhone(iso, national),
        email: email.trim(),
        birth_date: birthIso,
      });
      if (ok) {
        onDone();
        return;
      }
      // Текст ошибки бэкенда показываем под подходящим полем
      const msg: string = data?.error || tx.netError;
      const key = /phone|телефон|тел\./i.test(msg) ? 'phone'
        : /e-?mail|почт/i.test(msg) ? 'email'
        : /birth|рожд|дат/i.test(msg) ? 'birth'
        : 'form';
      setErrors({ [key]: msg });
    } catch {
      setErrors({ form: tx.netError });
    } finally {
      setBusy(false);
    }
  };

  const inputCls = (err?: string) =>
    `w-full bg-surface-container border ${err ? 'border-red-500' : 'border-outline-variant/40'} rounded-2xl px-4 py-3.5 text-base font-bold text-on-surface focus:outline-none focus:border-[#A50021]`;
  const Err = ({ k }: { k: string }) => (errors[k] ? <p className="text-red-500 dark:text-red-400 text-xs font-bold ml-1 mt-1">{errors[k]}</p> : null);
  const Label = ({ children }: { children: string }) => (
    <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 mb-1.5 ml-1">{children}</label>
  );

  return (
    <div className="fixed inset-0 z-[200] bg-background overflow-y-auto">
      <div className="max-w-md mx-auto px-6 pt-[calc(2.5rem+var(--safe-top))] pb-12 space-y-5">
        <img src="/logo.png" alt="Kyrios Logo" className="h-[55px] w-auto object-contain dark:invert mx-auto" />
        <div className="text-center space-y-1">
          <h1 className="font-headline font-black text-2xl text-on-surface">{tx.title}</h1>
          <p className="text-sm text-on-surface-variant">{tx.subtitle}</p>
        </div>

        <div>
          <Label>{tx.firstName}</Label>
          <input value={firstName} onChange={ev => setFirstName(ev.target.value)} autoComplete="given-name" className={inputCls(errors.first)} />
          <Err k="first" />
        </div>
        <div>
          <Label>{tx.lastName}</Label>
          <input value={lastName} onChange={ev => setLastName(ev.target.value)} autoComplete="family-name" className={inputCls(errors.last)} />
          <Err k="last" />
        </div>
        <div>
          <Label>{tx.phone}</Label>
          <PhoneField iso={iso} national={national} onChange={(i, n) => { setIso(i); setNational(n); }} hasError={!!errors.phone} />
          <Err k="phone" />
        </div>
        <div>
          <Label>{tx.email}</Label>
          <input type="email" inputMode="email" autoComplete="email" value={email} onChange={ev => setEmail(ev.target.value)} className={inputCls(errors.email)} />
          <Err k="email" />
        </div>
        <div>
          <Label>{tx.birth}</Label>
          <input inputMode="numeric" placeholder={tx.birthPh} value={birth} onChange={ev => setBirth(formatBirthInput(ev.target.value))} className={inputCls(errors.birth)} />
          <Err k="birth" />
        </div>

        <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
          <input type="checkbox" checked={consent} onChange={ev => setConsent(ev.target.checked)} className="mt-0.5 w-5 h-5 accent-[#A50021] shrink-0" />
          <span className="text-sm text-on-surface-variant leading-snug">{tx.consent}</span>
        </label>

        <button
          onClick={submit}
          disabled={!consent || busy}
          className="w-full py-4 bg-[#A50021] text-white font-headline font-black text-sm rounded-xl shadow-[0_4px_16px_rgba(165,0,33,0.3)] active:scale-95 transition-all disabled:opacity-40 disabled:shadow-none"
        >
          {busy ? tx.creating : tx.create}
        </button>
        <Err k="form" />
      </div>
    </div>
  );
}
