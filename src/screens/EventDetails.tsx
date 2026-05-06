import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, ExternalLink, Zap } from 'lucide-react';
import { Screen } from '../App';
import { usePurchaseTicket } from '../hooks/usePurchaseTicket';
import { supabase } from '../lib/supabaseClient';

export default function EventDetails({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { purchaseTicket, loading, error } = usePurchaseTicket();
  
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [soldCount, setSoldCount] = useState(0);
  
  const BASE_PRICE = 200;
  const MAX_CAPACITY = 300;
  const EARLY_BIRD_CAPACITY = Math.floor(MAX_CAPACITY / 4); 

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
  const fillPercentage = Math.min(100, (placesLeft / MAX_CAPACITY) * 100);
  
  const earlyBirdPlacesLeft = Math.max(0, EARLY_BIRD_CAPACITY - soldCount);
  const isEarlyBirdActive = earlyBirdPlacesLeft > 0;

  // Динамическая цена: -30% если Early Bird активен
  const currentPrice = isEarlyBirdActive ? Math.round(BASE_PRICE * 0.7) : BASE_PRICE;

  const googleMapsUrl = `https://maps.app.goo.gl/YCnMzfJxYW4ncYceA`;

  return (
    <div className="min-h-screen bg-slate-50 pb-40">
      <header className="w-full sticky top-0 z-50 bg-zinc-300/70 backdrop-blur-xl flex items-center justify-center px-6 pt-6 pb-2 border-b border-zinc-400/30">
        <img 
          src="/logo.png" 
          alt="Kyrios Logo" 
          className="h-[55px] w-auto object-contain" 
        />
      </header>

      <main>
        <section className="relative w-full h-[397px] overflow-hidden animate-fade-up">
          <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80" alt="ROAR Party" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-50/20 to-transparent"></div>
        </section>

        <div className="px-6 -mt-12 relative z-10 space-y-8">
          <div className="space-y-4 animate-fade-up delay-100">
            <h2 className="font-headline font-extrabold text-4xl tracking-tighter text-zinc-900">ROAR Party</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-[1rem] bg-white border border-zinc-200 text-zinc-500 shadow-sm">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-label uppercase tracking-widest text-zinc-400 font-semibold">Date</p>
                  <p className="text-sm font-bold text-zinc-900">Saturday, 24 August 2024</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-[1rem] bg-white border border-zinc-200 text-zinc-500 shadow-sm">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-label uppercase tracking-widest text-zinc-400 font-semibold">Time</p>
                  <p className="text-sm font-bold text-zinc-900">14:00 - 06:00 (+1 Day)</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-[1rem] bg-white border border-zinc-200 text-zinc-500 shadow-sm">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-label uppercase tracking-widest text-zinc-400 font-semibold">Location</p>
                    <p className="text-sm font-bold text-zinc-900">Techno Forest, Warsaw</p>
                  </div>
                </div>
                
                <a 
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-[52px] inline-flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-[10px] font-bold uppercase tracking-wider text-zinc-600 active:scale-95 transition-all shadow-sm"
                >
                  Location address → check Google maps
                  <ExternalLink size={12} className="text-[#65000B]" />
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white border border-zinc-100 p-6 rounded-[2rem] space-y-4 shadow-sm animate-fade-up delay-200">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-xs font-label uppercase tracking-wider text-zinc-400 font-bold block mb-1">Capacity</span>
                <span className="text-sm font-bold text-zinc-900">{placesLeft}/{MAX_CAPACITY} <span className="text-zinc-400 font-normal">places left</span></span>
              </div>
              
              <div className="text-right">
                <div className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${isEarlyBirdActive ? 'text-purple-600' : 'text-zinc-400'}`}>
                  <Zap size={10} className={isEarlyBirdActive ? 'fill-purple-600' : ''} />
                  Early Bird
                </div>
                <p className={`text-xs font-bold mt-0.5 ${isEarlyBirdActive ? 'text-purple-600' : 'text-zinc-400 line-through'}`}>
                  {earlyBirdPlacesLeft > 0 ? `${earlyBirdPlacesLeft} left at -30%` : 'Sold out'}
                </p>
              </div>
            </div>

            <div className="relative w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-[#65000B] rounded-full shadow-[0_0_10px_rgba(212,175,55,0.4)] transition-all duration-1000 ease-out"
                style={{ width: `${fillPercentage}%` }}
              ></div>
              
              <div className="absolute right-[25%] top-0 bottom-0 w-[2px] bg-white/80 z-10"></div>
              <div className="absolute right-0 top-0 h-full w-[25%] bg-purple-500/20 mix-blend-multiply border-l border-purple-500/30"></div>
            </div>
          </div>

          <div className="space-y-3 animate-fade-up delay-300">
            <h3 className="font-headline font-bold text-lg tracking-tight text-zinc-900">ABOUT</h3>
            <p className="text-zinc-500 text-sm leading-relaxed tracking-wide">
              Experience the ethereal transition of sound as the sun hangs high. A curated journey through melodic deep house and organic textures.
            </p>
          </div>
        </div>
      </main>

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40 flex flex-col gap-2 animate-fade-up delay-400">
        {error && (
          <div className="bg-red-500/90 text-white text-xs font-bold text-center py-2 px-4 rounded-full backdrop-blur-sm shadow-lg border border-red-500/50">
            {error}
          </div>
        )}
        <div className="bg-zinc-900 rounded-full p-2 pl-6 flex items-center justify-between shadow-2xl border border-zinc-800">
          <div className="flex flex-col">
            <span className="text-[10px] font-label uppercase text-zinc-400 font-bold tracking-widest">Entry from</span>
            <span className="font-headline font-extrabold text-lg text-white">
              {/* Если активен Early Bird, зачеркиваем старую цену */}
              {isEarlyBirdActive && <span className="text-zinc-500 line-through text-sm mr-2">{BASE_PRICE}</span>}
              {currentPrice} PLN
            </span>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="px-8 py-3.5 bg-[#65000B] text-white font-headline font-black text-sm rounded-full shadow-[0_4px_16px_rgba(212,175,55,0.4)] active:scale-95 transition-all"
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
              <h3 className="font-headline font-bold text-xl text-zinc-900">Select Tickets</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-500 active:scale-95">✕</button>
            </div>
            
            <div className="flex items-center justify-between bg-zinc-50 border border-zinc-100 p-4 rounded-2xl mb-6">
              <span className="font-bold text-zinc-900">Quantity</span>
              <div className="flex items-center gap-6">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-[1rem] bg-white border border-zinc-200 flex items-center justify-center font-bold text-xl text-zinc-900 shadow-sm active:scale-95">-</button>
                <span className="font-headline font-bold text-xl w-4 text-center text-zinc-900">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(10, quantity + 1))} className="w-10 h-10 rounded-[1rem] bg-white border border-zinc-200 flex items-center justify-center font-bold text-xl text-zinc-900 shadow-sm active:scale-95">+</button>
              </div>
            </div>

            <button 
              onClick={() => purchaseTicket('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb1a', quantity)}
              disabled={loading}
              className="w-full py-4 bg-[#65000B] text-white font-headline font-black text-sm rounded-xl shadow-[0_4px_16px_rgba(212,175,55,0.4)] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'PROCESSING...' : `PROCEED TO PAYMENT — ${currentPrice * quantity} PLN`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
