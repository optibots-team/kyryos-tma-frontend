import { useMemo } from 'react';
import QRCode from 'react-qr-code';

// Бронебойный компонент, который не роняет приложение
export default function TicketCard({ ticket }: { ticket: any }) {
  // Безопасное извлечение данных: ищем как tier, так и price_tiers
  const tierData = ticket?.price_tiers || ticket?.tier || {};
  const eventData = tierData?.events || tierData?.event || {};

  // Заглушки на случай, если данные еще грузятся
  const title = eventData?.title || 'Loading Event...';
  const location = eventData?.location || 'Location TBA';
  const rawDate = eventData?.event_date || new Date().toISOString();
  const tierName = tierData?.name || 'Ticket';

  const eventDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(rawDate));
    } catch (e) {
      return 'Date TBA';
    }
  }, [rawDate]);

  const isPaid = ticket?.status === 'paid';
  const isUsed = ticket?.status === 'used';

  // Если пропсов вообще нет, ничего не рендерим (защита от белого экрана)
  if (!ticket || !ticket.id) return null;

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="relative overflow-hidden rounded-3xl p-6 bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
        <div aria-hidden className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-purple-500/30 blur-3xl pointer-events-none" />
        <div aria-hidden className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 mb-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <h2 className="text-white font-bold text-xl leading-tight">{title}</h2>
            <StatusBadge status={ticket.status || 'pending'} />
          </div>
          <div className="space-y-1.5">
            <InfoRow icon="📅" text={eventDate} />
            <InfoRow icon="📍" text={location} />
            <InfoRow icon="🎟" text={tierName} />
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 my-5">
          <div className="w-5 h-5 rounded-full bg-black/40 -ml-9 flex-shrink-0" />
          <div className="flex-1 border-t-2 border-dashed border-white/20" />
          <div className="w-5 h-5 rounded-full bg-black/40 -mr-9 flex-shrink-0" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="p-4 rounded-2xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
            {isPaid ? (
              <QRCode value={ticket.ticket_code ?? ticket.id} size={180} bgColor="#ffffff" fgColor="#0f0f0f" level="H" />
            ) : isUsed ? (
              <UsedOverlay />
            ) : (
              <PendingOverlay />
            )}
          </div>
          <p className="text-white/40 text-xs font-mono tracking-widest select-none">
            {formatUUID(ticket.id)}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string, className: string }> = {
    paid: { label: 'Active', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    used: { label: 'Used', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    pending: { label: 'Pending', className: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  };
  
  const current = config[status] || { label: status, className: 'bg-white/10 text-white/60 border-white/20' };

  return <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${current.className}`}>{current.label}</span>;
}

function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2 text-white/70 text-sm">
      <span className="text-base leading-none">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function UsedOverlay() {
  return (
    <div className="w-[180px] h-[180px] flex flex-col items-center justify-center gap-2">
      <span className="text-4xl">✓</span>
      <p className="text-gray-500 text-sm font-medium text-center">Ticket used</p>
    </div>
  );
}

function PendingOverlay() {
  return (
    <div className="w-[180px] h-[180px] flex flex-col items-center justify-center gap-2">
      <span className="text-4xl">⏳</span>
      <p className="text-gray-400 text-sm font-medium text-center">Awaiting payment</p>
    </div>
  );
}

function formatUUID(uuid: string): string {
  if (!uuid) return '';
  return `${uuid.slice(0, 8)}...${uuid.slice(-4)}`;
}
