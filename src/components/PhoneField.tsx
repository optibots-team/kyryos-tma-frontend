import { COUNTRIES, flagEmoji, formatNational } from '../lib/registration';

// Слева выбор страны (флаг + код), справа номер с маской. По умолчанию Польша +48
export default function PhoneField({
  iso, national, onChange, hasError,
}: {
  iso: string;
  national: string;
  onChange: (iso: string, national: string) => void;
  hasError?: boolean;
}) {
  const country = COUNTRIES.find(c => c.iso === iso) || COUNTRIES[0];
  return (
    <div className={`flex gap-2 ${hasError ? '[&_*]:!border-red-500' : ''}`}>
      <select
        value={iso}
        onChange={e => onChange(e.target.value, formatNational(national, e.target.value))}
        className="w-[8.75rem] shrink-0 bg-surface-container border border-outline-variant/40 rounded-2xl px-3 py-3.5 text-base font-bold text-on-surface focus:outline-none focus:border-[#A50021]"
      >
        {COUNTRIES.map(c => (
          <option key={c.iso} value={c.iso}>{flagEmoji(c.iso)} {c.iso} +{c.dial}</option>
        ))}
      </select>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={formatNational(national, iso)}
        onChange={e => onChange(iso, formatNational(e.target.value, iso))}
        placeholder={iso === 'PL' ? '123 456 789' : ''}
        className="flex-1 min-w-0 bg-surface-container border border-outline-variant/40 rounded-2xl px-4 py-3.5 text-base font-bold text-on-surface focus:outline-none focus:border-[#A50021]"
      />
      <span className="sr-only">+{country.dial}</span>
    </div>
  );
}
