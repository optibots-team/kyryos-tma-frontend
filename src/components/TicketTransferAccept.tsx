import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gift } from 'lucide-react';
import { acceptTransfer, previewTransfer, transferTexts, notify } from '../lib/ticketTransfer';

// Окно «Вам передали билет, принять?» — открывается по ссылке с startapp=tr_<код>
export default function TicketTransferAccept({
  code,
  onClose,
  onAccepted,
}: {
  code: string;
  onClose: () => void;
  onAccepted: () => void;
}) {
  const { i18n } = useTranslation();
  const tx = transferTexts(i18n.language);
  const [info, setInfo] = useState<{ event_title?: string; from_name?: string; status?: string }>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    previewTransfer(code).then(r => {
      if (r.ok) setInfo({ event_title: r.event_title, from_name: r.from_name, status: r.status });
    });
  }, [code]);

  const gone = info.status === 'accepted' || info.status === 'cancelled';

  const handleAccept = async () => {
    setBusy(true);
    const r = await acceptTransfer(code);
    setBusy(false);
    if (r.ok) onAccepted();
    else notify(r.error || 'Transfer failed');
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
      <div className="w-full max-w-sm bg-surface rounded-[2rem] p-6 border border-outline-variant/40 shadow-2xl text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#A50021]/10 flex items-center justify-center mb-4">
          <Gift className="w-7 h-7 text-[#A50021]" />
        </div>
        <h3 className="font-headline font-black text-xl text-on-surface mb-2">{tx.title}</h3>
        <p className="text-sm text-on-surface-variant mb-6">
          {gone ? tx.gone : tx.desc(info.event_title || '', info.from_name || '')}
        </p>
        {!gone && (
        <button
          onClick={handleAccept}
          disabled={busy}
          className="w-full py-4 bg-[#A50021] text-white font-headline font-black text-sm rounded-xl active:scale-95 transition-all disabled:opacity-50 mb-2"
        >
          {busy ? tx.accepting : tx.accept}
        </button>
        )}
        <button
          onClick={onClose}
          disabled={busy}
          className="w-full py-3 text-on-surface-variant font-bold text-xs uppercase tracking-widest active:scale-95 transition-all"
        >
          {tx.decline}
        </button>
      </div>
    </div>
  );
}
