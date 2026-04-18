import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, Play } from 'lucide-react';
import { Screen } from '../App';
import { usePurchaseTicket } from '../hooks/usePurchaseTicket';
import { supabase } from '../lib/supabaseClient';

export default function EventDetails({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { purchaseTicket, loading, error } = usePurchaseTicket();
  
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [soldCount, setSoldCount] = useState(0);
  
  const TICKET_PRICE = 200;
  const MAX_CAPACITY = 300;

  useEffect(() => {
    async function fetchCapacity() {
      const { count } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .in('status', ['paid', 'used']);
      
      if (count !== null) setSoldCount(count);
    }
    fetchCapacity();
  }, []);

  const placesLeft = Math.max(0, MAX_CAPACITY - soldCount);
  const fillPercentage = Math.min(100, (soldCount / MAX_CAPACITY) * 100);

  return (
    <>
    <header className="w-full sticky top-0 z-50 bg-zinc-300/70 backdrop-blur-xl flex items-center justify-center px-6 pt-14 pb-6 border-b border-zinc-400/30">
  <img 
    src="/logo.png.png" 
    alt="Kyrios Logo" 
    className="h-5 w-auto object-contain" 
  />
</header>

      <main className="pb-32 bg-black min-h-screen">
        <section className="relative w-full h-[397px] overflow-hidden">
          <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80" alt="Festival" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
        </section>

        <div className="px-6 -mt-12 relative z-10 space-y-8">
          <div className="space-y-4">
            <h2 className="font-headline font-extrabold text-4xl tracking-tighter text-white">UNITIS FEST</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white/60 border border-white/10">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-label uppercase tracking-widest text-white/40 font-semibold">Date</p>
                  <p className="text-sm font-medium text-white">Saturday, 24 August 2024</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white/60 border border-white/10">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-label uppercase tracking-widest text-white/40 font-semibold">Time</p>
                  <p className="text-sm font-medium text-white">14:00 - 06:00 (+1 Day)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white/60 border border-white/10">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-label uppercase tracking-widest text-white/40 font-semibold">Location</p>
                  <p className="text-sm font-medium text-white">Techno Forest, Warsaw</p>
                </div>
              </div>
            </div>
          </div>

          {/* DYNAMIC CAPACITY BLOCK */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-3 backdrop-blur-md">
            <div className="flex justify-between items-end">
              <span className="text-xs font-label uppercase tracking-wider text-white/40 font-bold">Capacity</span>
              <span className="text-sm font-bold text-white">{placesLeft}/{MAX_CAPACITY} <span className="text-white/40 font-normal">places left</span></span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#D4AF37] rounded-full shadow-[0_0_10px_rgba(212,175,55,0.6)] transition-all duration-1000 ease-out"
                style={{ width: `${fillPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-headline font-bold text-lg tracking-tight text-white">DAYTIME</h3>
              <p className="text-white/60 text-sm leading-relaxed tracking-wide">Experience the ethereal transition of sound as the sun hangs high. A curated journey through melodic deep house and organic textures.</p>
              <ul className="space-y-2 pt-2">
                <li className="flex items-center gap-3 text-sm text-white/60">
                  <div className="w-1 h-1 bg-[#D4AF37] rounded-full shadow-[0_0_5px_rgba(212,175,55,0.8)]"></div>
                  <span>Open air garden access</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-white/60">
                  <div className="w-1 h-1 bg-[#D4AF37] rounded-full shadow-[0_0_5px_rgba(212,175,55,0.8)]"></div>
                  <span>Curated artisanal cocktail bar</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-headline font-bold text-lg tracking-tight text-white">NIGHTTIME</h3>
              <p className="text-white/60 text-sm leading-relaxed tracking-wide">The transformation begins at twilight. High-precision industrial techno takes center stage in our warehouse bunker.</p>
              <ul className="space-y-2 pt-2">
                <li className="flex items-center gap-3 text-sm text-white/60">
                  <div className="w-1 h-1 bg-[#D4AF37] rounded-full shadow-[0_0_5px_rgba(212,175,55,0.8)]"></div>
                  <span>Immersive LED installation</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-white/60">
                  <div className="w-1 h-1 bg-[#D4AF37] rounded-full shadow-[0_0_5px_rgba(212,175,55,0.8)]"></div>
                  <span>Void Acoustics sound system</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-headline font-bold text-lg tracking-tight px-0 text-white">ARTISTS & MEDIA</h3>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
              <div className="flex-shrink-0 relative w-48 h-20 rounded-xl overflow-hidden bg-white/5 border border-white/10">
                <img className="w-full h-full object-cover opacity-60" src="https://images.unsplash.com/photo-1574096079513-d8259312b785?auto=format&fit=crop&w=400&q=80" alt="Video" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER BUY BUTTON */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40 flex flex-col gap-2">
        {error && (
          <div className="bg-red-500/90 text-white text-xs font-bold text-center py-2 px-4 rounded-full backdrop-blur-sm shadow-lg border border-red-500/50">
            {error}
          </div>
        )}
        <div className="bg-black/80 backdrop-blur-xl rounded-full p-2 pl-6 flex items-center justify-between shadow-2xl border border-white/10">
          <div className="flex flex-col">
            <span className="text-[10px] font-label uppercase text-white/40 font-bold tracking-widest">Entry from</span>
            <span className="font-headline font-extrabold text-lg text-white">{TICKET_PRICE} PLN</span>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="px-8 py-3.5 bg-[#D4AF37] text-black font-headline font-black text-sm rounded-full shadow-[0_4px_16px_rgba(212,175,55,0.4)] active:scale-95 transition-all"
          >
            BUY TICKET
          </button>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div 
            className="bg-zinc-900 border-t border-white/10 w-full max-w-md rounded-t-3xl p-6 pb-12 animate-in slide-in-from-bottom-8 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-xl text-white">Select Tickets</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-white/60 border border-white/5 active:scale-95">✕</button>
            </div>
            
            <div className="flex items-center justify-between bg-black/40 border border-white/5 p-4 rounded-2xl mb-6">
              <span className="font-medium text-white/80">Quantity</span>
              <div className="flex items-center gap-6">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center font-bold text-xl text-white active:scale-95">-</button>
                <span className="font-headline font-bold text-xl w-4 text-center text-white">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(10, quantity + 1))} className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center font-bold text-xl text-white active:scale-95">+</button>
              </div>
            </div>

            <div className="flex justify-between items-center px-2 mb-6">
              <span className="text-white/60 font-medium">Total:</span>
              <span className="font-headline font-extrabold text-3xl text-white">{TICKET_PRICE * quantity} PLN</span>
            </div>

            <button 
              onClick={() => purchaseTicket('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb1a', quantity)}
              disabled={loading}
              className="w-full py-4 bg-[#D4AF37] text-black font-headline font-black text-sm rounded-xl shadow-[0_4px_16px_rgba(212,175,55,0.4)] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                  <span>PROCESSING...</span>
                </>
              ) : (
                'PROCEED TO PAYMENT'
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
