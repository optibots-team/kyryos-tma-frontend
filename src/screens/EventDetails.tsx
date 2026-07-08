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
  const { t } = useTranslation();
  const { purchaseTicket, loading: purchaseLoading, error: purchaseError } = usePurchaseTicket();
  
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState({ percent: 0, amount: 0 });
  const [promoStatus, setPromoStatus] = useState<'none' | 'validating' | 'success' | 'error'>('none');

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
    setPromoStatus('validating');
    
    try {
      const { data, error } = await supabase.rpc('validate_promo', { p_code: promoCode.trim().toUpperCase() });
      if (error || !data?.valid) {
        setPromoStatus('error');
        setPromoDiscount({ percent: 0, amount: 0 });
      } else {
        setPromoStatus('success');
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
    }
  };

  const executeGuestlistPurchase = async (validCode: string) => {
    if (window.Telegram?.WebApp?.BackButton) {
      window.Telegram.WebApp.BackButton.hide();
    }
    const data = await purchaseTicket(event.ticket_type_id, 1, validCode);
    if (data) {
      setShowModal(false);
      onNavigate('tickets');
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
  const mainButtonText = isGuestlist ? t('event_details_screen.get_ticket') : t('event_details_screen.buy_ticket');

  const maxCapacity = event.capacity || 400;
  const placesLeft = event.available !== null && event.available !== undefined ? event.available : maxCapacity;
  const fillPercentage = Math.min(100, (placesLeft / maxCapacity) * 100);
  
  const currentBatchName = event.ticket_type_name || 'Standard Ticket';
  const batchAvailable = event.available || 0;
  
  const basePrice = event.current_price || 200;

  let finalTotal = basePrice * quantity;
  if (promoDiscount.percent > 0) {
    finalTotal = Math.round(finalTotal * (1 - promoDiscount.percent / 100));
  } else if (promoDiscount.amount > 0) {
    finalTotal = Math.max(0, finalTotal - promoDiscount.amount);
  }

  const eventDate = new Date(event.event_date);
  const dateString = eventDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeString = eventDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  // 🎯 Проверка: видео или изображение в обложке
  const isVideo = event.image_url?.match(/\.(mp4|webm)$/i);

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="w-full sticky top-0 z-50 bg-surface-variant/70 backdrop-blur-xl flex items-center justify-center px-6 pt-6 pb-2 border-b border-outline-variant/30">
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
                  <p className="text-sm font-bold text-on-surface">{timeString} - {t('event_details_screen.till_late')}</p>
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
                <div>
                  <span className="text-xs font-label uppercase tracking-wider text-[#A50021] font-bold block mb-1">{t('event_details_screen.total_capacity')}</span>
                  <span className="text-sm font-bold text-on-surface">{placesLeft}/{maxCapacity} <span className="text-on-surface-variant font-normal">{t('event_details_screen.places_left')}</span></span>
                </div>
                
                <div className="text-right flex items-center">
                  <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-3 py-1 rounded-full border border-purple-100 dark:border-purple-500/30">
                    <Zap size={10} className="fill-purple-600 dark:fill-purple-400" />
                    {isGuestlist ? t('event_details_screen.guestlist_mode') : t('event_details_screen.batch_active', { batch: currentBatchName })}
                  </div>
                </div>
              </div>

              <div className="w-full h-2.5 bg-zinc-200/50 dark:bg-zinc-700/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#A50021] rounded-full shadow-[0_4px_16px_rgba(239,68,68,0.5)] transition-all duration-1000 ease-out"
                  style={{ width: `${fillPercentage}%` }}
                ></div>
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
                          {batch.available} left · <span className="font-headline">{batch.price} PLN</span>
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
              
              {/* 1. SIENNA */}
              <a href="https://www.instagram.com/sienna.warsaw?igsh=MWZ0MWJsbHZhem93ag==" target="_blank" rel="noopener noreferrer" className="h-20 rounded-2xl bg-surface p-0.5 shadow-sm transition-all active:scale-[0.98] block relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#A50021]/20 via-transparent to-[#A50021]/10 group-hover:from-[#A50021]/50 group-hover:to-[#A50021]/30 rounded-2xl transition-all duration-300 pointer-events-none"></div>
                <div className="w-full h-full bg-surface rounded-2xl flex flex-col items-center justify-center p-3 relative z-10 text-center">
                  <span className="text-[11px] font-black uppercase tracking-wider text-on-surface group-hover:text-[#A50021] transition-colors duration-300 block truncate w-full">SIENNA</span>
                  <span className="text-[9px] text-on-surface-variant/60 font-semibold mt-0.5 block truncate w-full">Restauracja & Lounge</span>
                </div>
              </a>

              {/* 2. BOHEMIAN OKO */}
              <a href="https://www.instagram.com/bohemianoko?igsh=MXY3ajh3Ymg0OWl2eA==" target="_blank" rel="noopener noreferrer" className="h-20 rounded-2xl bg-surface p-0.5 shadow-sm transition-all active:scale-[0.98] block relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#A50021]/20 via-transparent to-[#A50021]/10 group-hover:from-[#A50021]/50 group-hover:to-[#A50021]/30 rounded-2xl transition-all duration-300 pointer-events-none"></div>
                <div className="w-full h-full bg-surface rounded-2xl flex flex-col items-center justify-center p-3 relative z-10 text-center">
                  <span className="text-[11px] font-black uppercase tracking-wider text-on-surface group-hover:text-[#A50021] transition-colors duration-300 block truncate w-full">BOHEMIAN OKO</span>
                  <span className="text-[9px] text-on-surface-variant/60 font-semibold mt-0.5 block truncate w-full">Music events</span>
                </div>
              </a>

              {/* 3. KYRIOS */}
              <a href="https://www.instagram.com/kyrioseventagency?igsh=YWplZ2RvenozN2Vj" target="_blank" rel="noopener noreferrer" className="h-20 rounded-2xl bg-surface p-0.5 shadow-sm transition-all active:scale-[0.98] block relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#A50021]/20 via-transparent to-[#A50021]/10 group-hover:from-[#A50021]/50 group-hover:to-[#A50021]/30 rounded-2xl transition-all duration-300 pointer-events-none"></div>
                <div className="w-full h-full bg-surface rounded-2xl flex flex-col items-center justify-center p-3 relative z-10 text-center">
                  <span className="text-[11px] font-black uppercase tracking-wider text-on-surface group-hover:text-[#A50021] transition-colors duration-300 block truncate w-full">KYRIOS</span>
                  <span className="text-[9px] text-on-surface-variant/60 font-semibold mt-0.5 block truncate w-full">Event agency</span>
                </div>
              </a>

              {/* 4. JUSTCARS */}
              <a href="https://www.instagram.com/justcars_sng" target="_blank" rel="noopener noreferrer" className="h-20 rounded-2xl bg-surface p-0.5 shadow-sm transition-all active:scale-[0.98] block relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#A50021]/20 via-transparent to-[#A50021]/10 group-hover:from-[#A50021]/50 group-hover:to-[#A50021]/30 rounded-2xl transition-all duration-300 pointer-events-none"></div>
                <div className="w-full h-full bg-surface rounded-2xl flex flex-col items-center justify-center p-3 relative z-10 text-center">
                  <span className="text-[11px] font-black uppercase tracking-wider text-on-surface group-hover:text-[#A50021] transition-colors duration-300 block truncate w-full">JUSTCARS</span>
                  <span className="text-[9px] text-on-surface-variant/60 font-semibold mt-0.5 block truncate w-full">@justcars_sng</span>
                </div>
              </a>

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
                    {isGuestlist ? t('event_details_screen.free_promo') : `${basePrice} PLN`}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    if (batchAvailable > 0 || isGuestlist) {
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
                  {isGuestlist ? t('event_details_screen.guestlist_invitation') : t('event_details_screen.select_tickets')}
                </h3>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                  {isGuestlist ? t('event_details_screen.promo_code_required') : t('event_details_screen.batch_active_modal', { batch: currentBatchName })}
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
                {!isGuestlist && (
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
                      {isGuestlist ? t('event_details_screen.enter_guestlist_promo') : t('event_details_screen.promo_code')}
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
                  {promoStatus === 'success' && !isGuestlist && (
                    <p className="text-emerald-500 dark:text-emerald-400 text-xs font-bold ml-1">
                      {promoDiscount.amount > 0 
                        ? t('event_details_screen.promo_applied_amount', { amount: promoDiscount.amount })
                        : t('event_details_screen.promo_applied_percent', { percent: promoDiscount.percent })
                      }
                    </p>
                  )}
                </div>

                {!isGuestlist && (
                  <button 
                    onClick={async () => {
                      const codeToSend = promoCode.trim() !== '' ? promoCode.trim() : undefined;
                      if (window.Telegram?.WebApp?.BackButton) {
                        window.Telegram.WebApp.BackButton.hide();
                      }

                      const data = await purchaseTicket(event.ticket_type_id, quantity, codeToSend);
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
                    }}
                    disabled={purchaseLoading}
                    className={`w-full py-4 text-white font-headline font-black text-sm rounded-xl transition-all disabled:opacity-50 ${finalTotal === 0 ? 'bg-emerald-500 shadow-[0_4px_16px_rgba(16,185,129,0.5)]' : 'bg-[#A50021] shadow-[0_4px_16px_rgba(239,68,68,0.5)]'}`}
                  >
                    {purchaseLoading ? t('event_details_screen.processing') : (
                      finalTotal === 0 
                        ? t('event_details_screen.claim_free_ticket')
                        : t('event_details_screen.proceed_to_payment', { total: finalTotal })
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
