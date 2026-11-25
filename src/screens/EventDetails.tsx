import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, ExternalLink, Zap, Tag, PlayCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Screen } from '../App';
import { usePurchaseTicket } from '../hooks/usePurchaseTicket';
import { supabase } from '../lib/supabaseClient';

interface EventDetailsProps {
  onNavigate: (s: Screen) => void;
  eventId?: string | null;
}

export default function EventDetails({ onNavigate, eventId }: EventDetailsProps) {
  const { t, i18n } = useTranslation();
  const { purchaseTicket, loading: purchaseLoading, error: purchaseError } = usePurchaseTicket();
  
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState({ percent: 0, amount: 0 });
  const [promoStatus, setPromoStatus] = useState<'none' | 'validating' | 'success' | 'error'>('none');
    // validate_promo теперь может вернуть access_category ('FAN' | 'BACKSTAGE' | null)
  const [promoAccess, setPromoAccess] = useState<string | null>(null);
  // Режим «У меня есть код»: модалка только с вводом кода, билет выдаётся по коду без ticket_type_id (работает и при sold out)
  const [codeMode, setCodeMode] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false); // окно стола: чат менеджера / код стола

  useEffect(() => {
    async function fetchEvent() {
      if (!eventId) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('active_events')
          .select('*')
          .eq('id', eventId)
          .single();
        
        if (data) setEvent(data);
      } catch (err) {
        console.error("Error fetching event:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg || !tg.BackButton) return;

    tg.BackButton.show();

    const handleBackClick = () => {
      if (showModal) {
        setShowModal(false);
      } else {
        onNavigate('events');
      }
    };

    tg.BackButton.onClick(handleBackClick);

    return () => {
      tg.BackButton.offClick(handleBackClick);
      tg.BackButton.hide();
    };
  }, [showModal, onNavigate]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim() || event?.sales_paused) return;

    // «У меня есть код»: тип билета берётся из кода на бэкенде — сразу отправляем код в smart-function
    if (codeMode) {
      await executeGuestlistPurchase(promoCode.trim().toUpperCase());
      return;
    }

    setPromoStatus('validating');
    
    try {
      const { data, error } = await supabase.rpc('validate_promo', { p_code: promoCode.trim().toUpperCase() });
      if (error || !data?.valid) {
        setPromoStatus('error');
        setPromoDiscount({ percent: 0, amount: 0 });
        setPromoAccess(null);
      } else {
        setPromoStatus('success');
        setPromoAccess(data.access_category || null);
        setPromoDiscount({
          percent: data.discount_percent || 0,
          amount: data.discount_amount || 0
        });

        if (event?.ticket_mode === 'guestlist') {
          await executeGuestlistPurchase(promoCode.trim().toUpperCase());
        }
      }
    } catch (err) {
      setPromoStatus('error');
      setPromoDiscount({ percent: 0, amount: 0 });
      setPromoAccess(null);
    }
  };

  const executeGuestlistPurchase = async (validCode: string) => {
    if (window.Telegram?.WebApp?.BackButton) {
      window.Telegram.WebApp.BackButton.hide();
    }
    // В режиме «У меня есть код» ticket_type_id не передаём — бэкенд определяет тип билета по коду
    const data = await purchaseTicket(codeMode ? null : event.ticket_type_id, 1, validCode, { eventId: event.id });
    if (data) {
      setShowModal(false);
      if (data.checkout_url && !data.is_free) {
        // Код со скидкой, но не 100%: нужна оплата
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.openLink(data.checkout_url);
        } else {
          window.open(data.checkout_url, '_blank');
        }
      } else {
        // is_free: true — билеты уже выданы
        onNavigate('tickets');
      }
    }
  };

  if (loading || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#A50021]/20 border-t-[#A50021] rounded-full animate-spin"></div>
      </div>
    );
  }

  const isGuestlist = event.ticket_mode === 'guestlist';
    // 🤝 Партнёры мероприятия. На S.V.E.T — только KYRIOS и SVET, на остальных ивентах — полный список
  const isSvetEvent = /\bS\.?V\.?E\.?T\b/i.test(event.title || '');
  const allPartners = [
    { name: 'SIENNA', sub: 'Restauracja & Lounge', url: 'https://www.instagram.com/sienna.warsaw?igsh=MWZ0MWJsbHZhem93ag==' },
    { name: 'BOHEMIAN OKO', sub: 'Music events', url: 'https://www.instagram.com/bohemianoko?igsh=MXY3ajh3Ymg0OWl2eA==' },
    { name: 'KYRIOS', sub: 'Event agency', url: 'https://www.instagram.com/kyrioseventagency?igsh=YWplZ2RvenozN2Vj' },
    { name: 'JUSTCARS', sub: '@justcars_sng', url: 'https://www.instagram.com/justcars_sng' },
  ];
  const svetPartners = [
    { name: 'KYRIOS', sub: 'Event agency', url: 'https://www.instagram.com/kyrioseventagency?igsh=YWplZ2RvenozN2Vj' },
    { name: 'SVET', sub: '@letunasvet.ua', url: 'https://www.instagram.com/letunasvet.ua/' },
  ];
  // BAL DE ROÁR (12.12): только KYRIOS и ROAR
  const isRoarEvent = event.id === '0889b3f6-cebd-4362-ade3-4e2dcace764e' || /BAL\s+DE\s+RO/i.test(event.title || '');
  const ROAR_URL = 'https://www.instagram.com/roar.poland?lqvp=MW14aW4zbHFsaGo5cg=='; // ⚠️ вставьте ссылку на Instagram ROAR — пока пусто, карточка не кликабельна
  const roarPartners = [
    { name: 'KYRIOS', sub: 'Event agency', url: 'https://www.instagram.com/kyrioseventagency?igsh=YWplZ2RvenozN2Vj' },
    { name: 'ROAR', sub: 'Fashion Brand', url: ROAR_URL },
    { name: 'YBC WARSAW', sub: 'Young Business Club', url: 'https://www.instagram.com/ybc.warsaw?fqnt=MXdmb2xxZ3JvOGVmag==' },
    { name: 'NICE GUYS', sub: '@itsniceguys__', url: 'https://www.instagram.com/itsniceguys__?knvt=MXFjeWIxdzNtY2p5cQ==' },
  ];
  const partners = isSvetEvent ? svetPartners : isRoarEvent ? roarPartners : allPartners;
  const codeOnly = isGuestlist || codeMode; // модалка только с вводом кода
  const lang = (i18n.language || 'ru').slice(0, 2).toLowerCase();
  const L = ({
    ru: { card: 'Карта', bookTable: 'Забронировать стол', tableCode: 'У меня есть код стола', close: 'Закрыть' },
    en: { card: 'Card', bookTable: 'Book a table', tableCode: 'I have a table code', close: 'Close' },
    ua: { card: 'Картка', bookTable: 'Забронювати стіл', tableCode: 'У мене є код столу', close: 'Закрити' },
  } as any)[lang === 'uk' ? 'ua' : lang] || { card: 'Card', bookTable: 'Book a table', tableCode: 'I have a table code', close: 'Close' };

  // 💳 Покупка: method = 'card' | 'blik' (передаётся в smart-function как payment_method)
  const handlePurchase = async (method?: 'card' | 'blik') => {
    const codeToSend = promoCode.trim() !== '' ? promoCode.trim() : undefined;
    if (window.Telegram?.WebApp?.BackButton) {
      window.Telegram.WebApp.BackButton.hide();
    }
    const data = await purchaseTicket(event.ticket_type_id, quantity, codeToSend, { paymentMethod: method });
    if (data) {
      setShowModal(false);
      if (data.is_free) {
        onNavigate('tickets');
      } else if (data.checkout_url) {
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.openLink(data.checkout_url);
        } else {
          window.open(data.checkout_url, '_blank');
        }
      }
    }
  };
  const mainButtonText = isGuestlist ? t('event_details_screen.get_ticket') : t('event_details_screen.buy_ticket');

  // 📊 Шкала остатка строится по event.scale (пулы), а не по event.capacity / event.available (там только текущий пул)
  const scalePools: any[] = Array.isArray(event.scale)
    ? [...event.scale].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    : [];
  const hasScale = scalePools.some((pl: any) => (pl.capacity || 0) > 0);
  const scaleCapacity = scalePools.reduce((sum: number, pl: any) => sum + (pl.capacity || 0), 0);
  const scaleAvailable = scalePools.reduce((sum: number, pl: any) => sum + (pl.available || 0), 0);
  const maxCapacity = event.total_capacity ?? (hasScale ? scaleCapacity : (event.capacity || 400));
  const placesLeft = event.total_available ?? (hasScale ? scaleAvailable : (event.available ?? maxCapacity));
  // Если шкалы нет (например, гостевой список) — рисуем один сегмент по общим цифрам
  const barPools: any[] = hasScale ? scalePools : [{ name: '', capacity: maxCapacity, available: placesLeft }];
  const POOL_COLORS = ['#22c55e', '#06b6d4', '#8b5cf6', '#f59e0b', '#f97316', '#A50021'];
  
  const currentBatchName = event.ticket_type_name || 'Standard Ticket';
  const batchAvailable = event.available || 0;
  
  // Цену показываем как есть: current_price активного пула (без запасных значений)
  const hasPrice = event.current_price !== null && event.current_price !== undefined;
  const basePrice = hasPrice ? event.current_price : 0;

  let finalTotal = basePrice * quantity;
  if (promoDiscount.percent > 0) {
    finalTotal = Math.round(finalTotal * (1 - promoDiscount.percent / 100));
  } else if (promoDiscount.amount > 0) {
    finalTotal = Math.max(0, finalTotal - promoDiscount.amount);
  }

  const eventDate = new Date(event.event_date);
  const dateString = eventDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeFmt: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' };
  const timeString = eventDate.toLocaleTimeString('en-GB', timeFmt);
  // Время окончания (по Варшаве). Если event_end_date нет — показываем «till late» как раньше
  const endTimeString = event.event_end_date
    ? new Date(event.event_end_date).toLocaleTimeString('en-GB', timeFmt)
    : null;

  // 🎯 Проверка: видео или изображение в обложке
  const isVideo = event.image_url?.match(/\.(mp4|webm)$/i);

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="w-full sticky top-0 z-50 bg-surface-variant/70 backdrop-blur-xl flex items-center justify-center px-6 pt-[calc(1.5rem+var(--safe-top))] pb-2 border-b border-outline-variant/30">
        <img src="/logo.png" alt="Kyrios Logo" className="h-[55px] w-auto object-contain dark:invert" />
      </header>

      <main>
        {/* БЛОК ОБЛОЖКИ (МЕДИАПЛЕЕР) */}
        <section className="relative w-full h-[397px] overflow-hidden animate-fade-up">
          {isVideo ? (
            <video
              src={event.image_url}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img 
              className="w-full h-full object-cover" 
              src={event.image_url} 
              alt={event.title} 
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>
        </section>

        <div className="px-6 -mt-12 relative z-10 space-y-8">
          <div className="space-y-4 animate-fade-up delay-100">
            <h2 className="font-headline font-extrabold text-4xl tracking-tighter text-on-surface">{event.title}</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-[1rem] bg-surface border border-outline-variant/40 text-on-surface-variant shadow-sm">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant/70 font-semibold">{t('event_details_screen.date')}</p>
                  <p className="text-sm font-bold text-on-surface">{dateString}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-[1rem] bg-surface border border-outline-variant/40 text-on-surface-variant shadow-sm">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant/70 font-semibold">{t('event_details_screen.time')}</p>
                  <p className="text-sm font-bold text-on-surface">{timeString} - {endTimeString || t('event_details_screen.till_late')}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-[1rem] bg-surface border border-outline-variant/40 text-on-surface-variant shadow-sm">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant/70 font-semibold">{t('event_details_screen.location')}</p>
                    <p className="text-sm font-bold text-on-surface">{event.location_name}</p>
                  </div>
                </div>
                
                {event.location_link && (
                  <a 
                    href={event.location_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-[52px] inline-flex items-center gap-2 px-4 py-2 bg-surface border border-outline-variant/40 rounded-xl text-[10px] font-bold uppercase tracking-wider text-on-surface-variant active:scale-95 transition-all shadow-sm"
                  >
                    {t('event_details_screen.location_check_maps')}
                    <ExternalLink size={12} className="text-[#A50021]" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="relative bg-surface border-2 border-[#A50021]/20 p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(165,0,33,0.08)] animate-fade-up delay-200 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#A50021]/5 to-transparent pointer-events-none"></div>

            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                
                <div className="text-right flex items-center">
                  <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-3 py-1 rounded-full border border-purple-100 dark:border-purple-500/30">
                    <Zap size={10} className="fill-purple-600 dark:fill-purple-400" />
                    {isGuestlist ? t('event_details_screen.guestlist_mode') : t('event_details_screen.batch_active', { batch: currentBatchName })}
                  </div>
                </div>
              </div>

              {/* Шкала остатка: сегмент = пул, ширина ∝ capacity, у каждого свой цвет.
                  Заполненная часть = available / capacity и тает по мере продаж. Цифр нет, границы пулов — зазоры между сегментами. */}
              <div className="w-full flex gap-[3px]" aria-hidden="true">
                {barPools.map((pool: any, i: number) => {
                  const cap = pool.capacity || 0;
                  const pct = cap > 0 ? Math.max(0, Math.min(100, ((pool.available || 0) / cap) * 100)) : 0;
                  return (
                    <div
                      key={pool.name || i}
                      className="h-2.5 rounded-full overflow-hidden bg-zinc-200/60 dark:bg-zinc-700/50"
                      style={{ flex: `${cap || 1} 1 0%`, minWidth: 6 }}
                      title={pool.name || undefined}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${pct}%`, backgroundColor: POOL_COLORS[i % POOL_COLORS.length] }}
                      ></div>
                    </div>
                  );
                })}
              </div>

              {!isGuestlist && event.batches && event.batches.length > 0 && (
                <div className="mt-2 space-y-2 bg-surface/80 backdrop-blur p-4 rounded-2xl border border-[#A50021]/10">
                  <span className="text-[10px] font-label uppercase tracking-wider text-on-surface-variant/70 font-bold block mb-2">{t('event_details_screen.ticket_batches')}</span>
                  {event.batches.map((batch: any) => (
                    <div key={batch.id} className="flex items-center justify-between py-1.5 border-b border-outline-variant/30 last:border-0 last:pb-0">
                      <span className={`text-xs font-bold ${batch.is_sold_out ? 'text-on-surface-variant/50 line-through' : 'text-on-surface'}`}>
                        {batch.name}
                      </span>
                      {batch.is_sold_out ? (
                        <span className="text-red-500 dark:text-red-400 text-[10px] font-black tracking-wider uppercase bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-md border border-red-100 dark:border-red-500/30">
                          {t('event_details_screen.sold_out')}
                        </span>
                      ) : (
                        <span className={`text-xs ${batch.id === event.ticket_type_id ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-on-surface-variant'}`}>
                          <span className="font-headline">{batch.price} PLN</span>
                          {batch.id === event.ticket_type_id && ' 🔥'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 animate-fade-up delay-300">
            <h3 className="font-headline font-bold text-on-surface-variant/60 uppercase tracking-[0.15em] text-xs">{t('event_details_screen.about_event')}</h3>
            <div className="text-on-surface-variant text-sm leading-relaxed tracking-wide whitespace-pre-line space-y-3">
              {event.description ? (
                event.description.split('\n\n').map((paragraph: string, i: number) => (
                  <p key={i}>{paragraph}</p>
                ))
              ) : (
                <p>{t('event_details_screen.default_description')}</p>
              )}
            </div>
          </div>

          {event.youtube_link && (
            <div className="space-y-3 animate-fade-up delay-300">
              <div className="flex items-center gap-2 text-on-surface">
                <PlayCircle className="w-5 h-5 text-[#A50021]" />
                <h3 className="font-headline font-bold text-lg tracking-tight">{t('event_details_screen.preview')}</h3>
              </div>
              <div className="w-full aspect-video rounded-[2rem] overflow-hidden shadow-lg border border-outline-variant/40">
                <iframe 
                  className="w-full h-full"
                  src={event.youtube_link} 
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}

                   <div className="space-y-4 pt-4 animate-fade-up">
            <h3 className="font-headline font-bold text-on-surface-variant/60 uppercase tracking-[0.15em] text-xs text-center">{t('event_details_screen.partners')}</h3>
            <div className="grid grid-cols-2 gap-3">
              {partners.map((p) => (
                <a
                  key={p.name}
                  href={p.url || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-20 rounded-2xl bg-surface p-0.5 shadow-sm transition-all active:scale-[0.98] block relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#A50021]/20 via-transparent to-[#A50021]/10 group-hover:from-[#A50021]/50 group-hover:to-[#A50021]/30 rounded-2xl transition-all duration-300 pointer-events-none"></div>
                  <div className="w-full h-full bg-surface rounded-2xl flex flex-col items-center justify-center p-3 relative z-10 text-center">
                    <span className="text-[11px] font-black uppercase tracking-wider text-on-surface group-hover:text-[#A50021] transition-colors duration-300 block truncate w-full">{p.name}</span>
                    <span className="text-[9px] text-on-surface-variant/60 font-semibold mt-0.5 block truncate w-full">{p.sub}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="pt-4 pb-8 animate-fade-up">
            {purchaseError && (
              <div className="bg-red-500/90 text-white text-xs font-bold text-center py-2 px-4 rounded-full backdrop-blur-sm shadow-lg border border-red-500/50 mb-3">
                {purchaseError}
              </div>
            )}
            
            {event.sales_paused ? (
              <div className="w-full bg-zinc-800/80 backdrop-blur border border-zinc-700 rounded-2xl py-4 text-center text-sm font-bold text-zinc-300 tracking-wide shadow-inner flex items-center justify-center gap-2">
                {t('event_details_screen.sales_paused_notice')}
              </div>
            ) : (
              <div className="bg-zinc-900 rounded-[2rem] p-3 pl-6 flex items-center justify-between shadow-xl border border-zinc-800">
                <div className="flex flex-col">
                  <span className="text-[10px] font-label uppercase text-zinc-400 font-bold tracking-widest">
                    {isGuestlist ? t('event_details_screen.access') : t('event_details_screen.entry_from')}
                  </span>
                  <span className="font-headline font-extrabold text-lg text-white">
                    {isGuestlist ? t('event_details_screen.free_promo') : (hasPrice ? `${event.current_price} PLN` : '—')}
                  </span>
                  {!isGuestlist && hasPrice && (
                    <span className="text-[9px] text-zinc-500 font-semibold mt-0.5">{t('event_details_screen.service_fee_note')}</span>
                  )}
                </div>
                <button 
                  onClick={() => {
                    if (batchAvailable > 0 || isGuestlist) {
                      setCodeMode(false);
                      setShowModal(true);
                    }
                  }}
                  disabled={batchAvailable === 0 && !isGuestlist}
                  className="px-8 py-4 bg-[#A50021] text-white font-headline font-black text-sm rounded-[1.5rem] shadow-[0_4px_16px_rgba(165,0,33,0.3)] active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  {batchAvailable === 0 && !isGuestlist ? t('event_details_screen.sold_out_btn') : mainButtonText}
                </button>
              </div>
            )}

            {/* 🔑 «У меня есть код» — работает всегда, в том числе когда все пулы проданы. Для гостевого списка основная кнопка и так открывает ввод кода */}
            {!isGuestlist && !event.sales_paused && (
              <button
                onClick={() => {
                  setCodeMode(true);
                  setPromoCode('');
                  setPromoStatus('none');
                  setShowModal(true);
                }}
                className="mt-3 w-full py-3.5 rounded-[1.5rem] bg-surface border border-outline-variant/50 text-on-surface font-headline font-black text-xs tracking-widest uppercase active:scale-95 transition-all"
              >
                {t('event_details_screen.have_code')}
              </button>
            )}

            {/* 🪑 Кнопка «Купить стол» — только если у ивента есть table_booking_url */}
            {event.table_booking_url && (
              <button
                onClick={() => setShowTableModal(true)}
                className="mt-3 w-full py-4 rounded-[1.5rem] border-2 border-[#A50021] text-[#A50021] dark:text-white dark:border-white/40 font-headline font-black text-sm tracking-widest uppercase active:scale-95 transition-all"
              >
                BOOK TABLE
              </button>
            )}
          </div>

        </div>
      </main>

      {/* МОДАЛКА ВЫБОРА КОЛИЧЕСТВА БИЛЕТОВ / ВВОДА ПРОМОКОДА */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div 
            className="bg-surface border-t border-outline-variant/40 w-full max-w-md rounded-t-[2rem] p-6 pb-12 animate-in slide-in-from-bottom-8 duration-300 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col">
                <h3 className="font-headline font-bold text-xl text-on-surface">
                  {codeMode ? t('event_details_screen.have_code') : isGuestlist ? t('event_details_screen.guestlist_invitation') : t('event_details_screen.select_tickets')}
                </h3>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                  {codeMode ? t('event_details_screen.promo_code') : isGuestlist ? t('event_details_screen.promo_code_required') : t('event_details_screen.batch_active_modal', { batch: currentBatchName })}
                </span>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-bold text-on-surface-variant active:scale-95">✕</button>
            </div>
            
            {event.sales_paused ? (
              <div className="w-full bg-surface-container border border-outline-variant/40 rounded-2xl py-4 text-center text-sm font-bold text-on-surface-variant mb-4">
                {t('event_details_screen.sales_paused_notice')}
              </div>
            ) : (
              <>
                {!codeOnly && (
                  <div className="flex items-center justify-between bg-surface-container border border-outline-variant/40 p-4 rounded-2xl mb-4">
                    <span className="font-bold text-on-surface">{t('event_details_screen.quantity')}</span>
                    <div className="flex items-center gap-6">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-[1rem] bg-surface border border-outline-variant/40 flex items-center justify-center font-bold text-xl text-on-surface shadow-sm active:scale-95">-</button>
                      <span className="font-headline font-bold text-xl w-4 text-center text-on-surface">{quantity}</span>
                      <button onClick={() => setQuantity(Math.min(10, Math.min(quantity + 1, batchAvailable)))} className="w-10 h-10 rounded-[1rem] bg-surface border border-outline-variant/40 flex items-center justify-center font-bold text-xl text-on-surface shadow-sm active:scale-95">+</button>
                    </div>
                  </div>
                )}

                <div className="mb-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-on-surface-variant/60" />
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      {isGuestlist && !codeMode ? t('event_details_screen.enter_guestlist_promo') : t('event_details_screen.promo_code')}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());
                        setPromoStatus('none');
                        setPromoDiscount({ percent: 0, amount: 0 });
                        setPromoAccess(null);
                      }}
                      placeholder={t('event_details_screen.enter_code')}
                      className="flex-1 bg-surface-container border border-outline-variant/40 rounded-xl px-4 py-3 text-sm font-bold text-on-surface focus:outline-none focus:border-zinc-400 transition-colors uppercase"
                    />
                    <button 
                      onClick={handleApplyPromo}
                      disabled={!promoCode.trim() || promoStatus === 'validating' || purchaseLoading}
                      className="px-6 bg-primary text-on-primary rounded-xl text-xs font-bold tracking-widest uppercase active:scale-95 disabled:opacity-50 transition-all"
                    >
                      {promoStatus === 'validating' ? '...' : t('event_details_screen.apply')}
                    </button>
                  </div>
                  {promoStatus === 'error' && <p className="text-red-500 dark:text-red-400 text-xs font-bold ml-1">{t('event_details_screen.invalid_code')}</p>}
                  {promoStatus === 'success' && promoAccess && (
                    <p className="text-fuchsia-500 dark:text-fuchsia-400 text-xs font-black uppercase tracking-widest ml-1">
                      {t('event_details_screen.access')}: {promoAccess}
                    </p>
                  )}
                  {codeMode && purchaseError && (
                    <p className="text-red-500 dark:text-red-400 text-xs font-bold ml-1">{purchaseError}</p>
                  )}
                  {promoStatus === 'success' && !codeOnly && (
                    <p className="text-emerald-500 dark:text-emerald-400 text-xs font-bold ml-1">
                      {promoDiscount.amount > 0 
                        ? t('event_details_screen.promo_applied_amount', { amount: promoDiscount.amount })
                        : t('event_details_screen.promo_applied_percent', { percent: promoDiscount.percent })
                      }
                    </p>
                  )}
                </div>

                {!codeOnly && (finalTotal === 0 ? (
                  <button
                    onClick={() => handlePurchase()}
                    disabled={purchaseLoading}
                    className="w-full py-4 text-white font-headline font-black text-sm rounded-xl transition-all disabled:opacity-50 bg-emerald-500 shadow-[0_4px_16px_rgba(16,185,129,0.3)] active:scale-95"
                  >
                    {purchaseLoading ? t('event_details_screen.processing') : t('event_details_screen.claim_free_ticket')}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-center text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      {t('event_details_screen.proceed_to_payment', { total: finalTotal })}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handlePurchase('card')}
                        disabled={purchaseLoading}
                        className="py-4 bg-[#A50021] text-white font-headline font-black text-sm rounded-xl shadow-[0_4px_16px_rgba(165,0,33,0.3)] active:scale-95 transition-all disabled:opacity-50"
                      >
                        {purchaseLoading ? '...' : L.card}
                      </button>
                      <button
                        onClick={() => handlePurchase('blik')}
                        disabled={purchaseLoading}
                        className="py-4 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-headline font-black text-sm rounded-xl active:scale-95 transition-all disabled:opacity-50"
                      >
                        {purchaseLoading ? '...' : 'BLIK'}
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* 🪑 Окно стола: чат менеджера или ввод кода стола */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowTableModal(false)}>
          <div
            className="bg-surface border-t border-outline-variant/40 w-full max-w-md rounded-t-[2rem] p-6 pb-12 space-y-3 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => {
                const tg = window.Telegram?.WebApp;
                if (tg?.openTelegramLink) tg.openTelegramLink(event.table_booking_url);
                else window.open(event.table_booking_url, '_blank');
                setShowTableModal(false);
              }}
              className="w-full py-4 bg-[#A50021] text-white font-headline font-black text-sm rounded-xl shadow-[0_4px_16px_rgba(165,0,33,0.3)] active:scale-95 transition-all uppercase tracking-widest"
            >
              {L.bookTable}
            </button>
            <button
              onClick={() => {
                // Код стола вводится так же, как «У меня есть код»: бэкенд сам различает «оплачено» и «оплатить в приложении»
                setShowTableModal(false);
                setCodeMode(true);
                setPromoCode('');
                setPromoStatus('none');
                setShowModal(true);
              }}
              className="w-full py-4 border-2 border-[#A50021] text-[#A50021] dark:text-white dark:border-white/40 font-headline font-black text-sm rounded-xl active:scale-95 transition-all uppercase tracking-widest"
            >
              {L.tableCode}
            </button>
            <button onClick={() => setShowTableModal(false)} className="w-full py-2 text-on-surface-variant font-bold text-xs uppercase tracking-widest">
              {L.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
