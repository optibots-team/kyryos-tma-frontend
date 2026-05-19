import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, ExternalLink, Zap, Tag, PlayCircle } from 'lucide-react';
import { Screen } from '../App';
import { usePurchaseTicket } from '../hooks/usePurchaseTicket';
import { supabase } from '../lib/supabaseClient';

interface EventDetailsProps {
  onNavigate: (s: Screen) => void;
  eventId?: string | null;
}

export default function EventDetails({ onNavigate, eventId }: EventDetailsProps) {
  const { purchaseTicket, loading: purchaseLoading, error: purchaseError } = usePurchaseTicket();
  
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
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
    const handleBackFromModal = () => setShowModal(false);

    if (showModal) {
      tg.BackButton.show();
      tg.BackButton.onClick(handleBackFromModal);
    }
    return () => {
      tg.BackButton.offClick(handleBackFromModal);
    };
  }, [showModal]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoStatus('validating');
    
    try {
      const { data, error } = await supabase.rpc('validate_promo', { p_code: promoCode.trim().toUpperCase() });
      if (error || !data?.valid) {
        setPromoStatus('error');
        setDiscountPercent(0);
      } else {
        setPromoStatus('success');
        setDiscountPercent(data.discount_percent);
      }
    } catch (err) {
      setPromoStatus('error');
      setDiscountPercent(0);
    }
  };

  if (loading || !event) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#A50021]/20 border-t-[#A50021] rounded-full animate-spin"></div>
      </div>
    );
  }

  // Общая шкала заполненности ивента
  const maxCapacity = event.capacity || 400;
  const placesLeft = Math.max(0, maxCapacity - (event.total_sold || 0));
  const fillPercentage = Math.min(100, (placesLeft / maxCapacity) * 100);
  
  // Данные текущей активной партии
  const currentBatchName = event.ticket_type_name || 'Standard Ticket';
  const batchAvailable = event.available || 0;
  
  // Цена с учетом промокода
  const basePrice = event.current_price || 200;
  const priceAfterPromo = Math.round(basePrice * (1 - discountPercent / 100));
  const finalTotal = priceAfterPromo * quantity;

  const eventDate = new Date(event.event_date);
  const dateString = eventDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeString = eventDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-slate-50 pb-40">
      <header className="w-full sticky top-0 z-50 bg-zinc-300/70 backdrop-blur-xl flex items-center justify-center px-6 pt-6 pb-2 border-b border-zinc-400/30">
        <img src="/logo.png" alt="Kyrios Logo" className="h-[55px] w-auto object-contain" />
      </header>

      <main>
        <section className="relative w-full h-[397px] overflow-hidden animate-fade-up">
          <img className="w-full h-full object-cover" src={event.image_url} alt={event.title} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-50/20 to-transparent"></div>
        </section>

        <div className="px-6 -mt-12 relative z-10 space-y-8">
          <div className="space-y-4 animate-fade-up delay-100">
            <h2 className="font-headline font-extrabold text-4xl tracking-tighter text-zinc-900">{event.title}</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-[1rem] bg-white border border-zinc-200 text-zinc-500 shadow-sm">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-label uppercase tracking-widest text-zinc-400 font-semibold">Date</p>
                  <p className="text-sm font-bold text-zinc-900">{dateString}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-[1rem] bg-white border border-zinc-200 text-zinc-500 shadow-sm">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-label uppercase tracking-widest text-zinc-400 font-semibold">Time</p>
                  <p className="text-sm font-bold text-zinc-900">{timeString} - Till late</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-[1rem] bg-white border border-zinc-200 text-zinc-500 shadow-sm">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-label uppercase tracking-widest text-zinc-400 font-semibold">Location</p>
                    <p className="text-sm font-bold text-zinc-900">{event.location_name}</p>
                  </div>
                </div>
                
                {event.location_link && (
                  <a 
                    href={event.location_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-[52px] inline-flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-[10px] font-bold uppercase tracking-wider text-zinc-600 active:scale-95 transition-all shadow-sm"
                  >
                    Location address → check Google maps
                    <ExternalLink size={12} className="text-[#A50021]" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Плашка Capacity (Подсвеченная с правильной иерархией) */}
          <div className="relative bg-white border-2 border-[#A50021]/20 p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(165,0,33,0.08)] animate-fade-up delay-200 overflow-hidden">
            {/* Декоративный фон для выделения */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#A50021]/5 to-transparent pointer-events-none"></div>

            <div className="relative z-10 flex flex-col gap-4">
              {/* Верхняя часть: Цифры */}
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-xs font-label uppercase tracking-wider text-[#A50021] font-bold block mb-1">Total Capacity</span>
                  <span className="text-sm font-bold text-zinc-900">{placesLeft}/{maxCapacity} <span className="text-zinc-500 font-normal">places left</span></span>
                </div>
                
                <div className="text-right">
                  <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-purple-600">
                    <Zap size={10} className="fill-purple-600" />
                    {currentBatchName} Active
                </div>
              </div>

              {/* КРАСНАЯ ШКАЛА (сразу под цифрами) */}
              <div className="w-full h-2.5 bg-zinc-200/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#A50021] rounded-full shadow-[0_4px_16px_rgba(239,68,68,0.5)] transition-all duration-1000 ease-out"
                  style={{ width: `${fillPercentage}%` }}
                ></div>
              </div>

              {/* СПИСОК ПАРТИЙ */}
              {event.batches && event.batches.length > 0 && (
                <div className="mt-2 space-y-2 bg-white/80 backdrop-blur p-4 rounded-2xl border border-[#A50021]/10">
                  <span className="text-[10px] font-label uppercase tracking-wider text-zinc-400 font-bold block mb-2">Ticket Batches</span>
                  {event.batches.map((batch: any) => (
                    <div key={batch.id} className="flex items-center justify-between py-1.5 border-b border-zinc-200/50 last:border-0 last:pb-0">
                      <span className={`text-xs font-bold ${batch.is_sold_out ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}>
                        {batch.name}
                      </span>
                      {batch.is_sold_out ? (
                        <span className="text-red-500 text-[10px] font-black tracking-wider uppercase bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                          Sold Out
                        </span>
                      ) : (
                        <span className={`text-xs ${batch.id === event.ticket_type_id ? 'text-purple-600 font-bold' : 'text-zinc-500'}`}>
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
            <h3 className="font-headline font-bold text-lg tracking-tight text-zinc-900">ABOUT</h3>
            <p className="text-zinc-500 text-sm leading-relaxed tracking-wide">
              {event.description || 'Experience the ethereal transition of sound as the sun hangs high. A curated journey through melodic deep house and organic textures.'}
            </p>
          </div>

          {event.youtube_link && (
            <div className="space-y-3 animate-fade-up delay-300">
              <div className="flex items-center gap-2 text-zinc-900">
                <PlayCircle className="w-5 h-5 text-[#A50021]" />
                <h3 className="font-headline font-bold text-lg tracking-tight">PREVIEW</h3>
              </div>
              <div className="w-full aspect-video rounded-[2rem] overflow-hidden shadow-lg border border-zinc-100">
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
        </div>
      </main>

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40 flex flex-col gap-2 animate-fade-up delay-400">
        {purchaseError && (
          <div className="bg-red-500/90 text-white text-xs font-bold text-center py-2 px-4 rounded-full backdrop-blur-sm shadow-lg border border-red-500/50">
            {purchaseError}
          </div>
        )}
        <div className="bg-zinc-900 rounded-full p-2 pl-6 flex items-center justify-between shadow-2xl border border-zinc-800">
          <div className="flex flex-col">
            <span className="text-[10px] font-label uppercase text-zinc-400 font-bold tracking-widest">Entry from</span>
            <span className="font-headline font-extrabold text-lg text-white">
              {basePrice} PLN
            </span>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="px-8 py-3.5 bg-[#A50021] text-white font-headline font-black text-sm rounded-full shadow-[0_4px_16px_rgba(239,68,68,0.5)] active:scale-95 transition-all"
          >
            BUY TICKET
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div 
            className="bg-white border-t border-zinc-100 w-full max-w-md rounded-t-[2rem] p-6 pb-12 animate-in slide-in-from-bottom-8 duration-300 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col">
                <h3 className="font-headline font-bold text-xl text-zinc-900">Select Tickets</h3>
                <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">{currentBatchName} Active</span>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-500 active:scale-95">✕</button>
            </div>
            
            <div className="flex items-center justify-between bg-zinc-50 border border-zinc-100 p-4 rounded-2xl mb-4">
              <span className="font-bold text-zinc-900">Quantity</span>
              <div className="flex items-center gap-6">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-[1rem] bg-white border border-zinc-200 flex items-center justify-center font-bold text-xl text-zinc-900 shadow-sm active:scale-95">-</button>
                <span className="font-headline font-bold text-xl w-4 text-center text-zinc-900">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(10, Math.min(quantity + 1, batchAvailable)))} className="w-10 h-10 rounded-[1rem] bg-white border border-zinc-200 flex items-center justify-center font-bold text-xl text-zinc-900 shadow-sm active:scale-95">+</button>
              </div>
            </div>

            <div className="mb-6 space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Promo Code</span>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                    setPromoStatus('none');
                    setDiscountPercent(0);
                  }}
                  placeholder="Enter code" 
                  className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 focus:outline-none focus:border-zinc-400 transition-colors uppercase"
                />
                <button 
                  onClick={handleApplyPromo}
                  disabled={!promoCode.trim() || promoStatus === 'validating'}
                  className="px-6 bg-zinc-900 text-white rounded-xl text-xs font-bold tracking-widest uppercase active:scale-95 disabled:opacity-50 transition-all"
                >
                  {promoStatus === 'validating' ? '...' : 'Apply'}
                </button>
              </div>
              {promoStatus === 'error' && <p className="text-red-500 text-xs font-bold ml-1">Invalid or expired code</p>}
              {promoStatus === 'success' && <p className="text-emerald-500 text-xs font-bold ml-1">Promo applied: -{discountPercent}%</p>}
            </div>

            <button 
              onClick={async () => {
                const codeToSend = promoCode.trim() !== '' ? promoCode.trim() : undefined;
                const data = await purchaseTicket(event.ticket_type_id, quantity, codeToSend);
                
                if (data) {
                  setShowModal(false);
                  
                  if (data.is_free) {
                    onNavigate('tickets');
                  } else if (data.checkout_url) {
                    window.location.href = data.checkout_url;
                  }
                }
              }}
              disabled={purchaseLoading}
              className={`w-full py-4 text-white font-headline font-black text-sm rounded-xl shadow-[0_4px_16px_rgba(239,68,68,0.5)] active:scale-95 transition-all disabled:opacity-50 ${finalTotal === 0 ? 'bg-emerald-500 shadow-[0_4px_16px_rgba(16,185,129,0.5)]' : 'bg-[#A50021]'}`}
            >
              {purchaseLoading ? 'PROCESSING...' : (
                finalTotal === 0 
                  ? 'CLAIM FREE TICKET' 
                  : `PROCEED TO PAYMENT — ${finalTotal} PLN`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
