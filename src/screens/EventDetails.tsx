import { useState } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, Play } from 'lucide-react';
import { Screen } from '../App';
import { usePurchaseTicket } from '../hooks/usePurchaseTicket';

export default function EventDetails({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { purchaseTicket, loading, error } = usePurchaseTicket();
  
  // Состояния для модального окна и количества
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const TICKET_PRICE = 100; // Цена одного билета, как в твоей базе

  return (
    <>
      <header className="w-full sticky top-0 z-50 bg-slate-50/80 backdrop-blur-xl flex items-center justify-between px-6 py-4">
        <button onClick={() => onNavigate('events')} className="flex items-center justify-center w-10 h-10 rounded-full active:scale-95 duration-200 transition-all cursor-pointer">
          <ArrowLeft className="text-zinc-900 w-6 h-6" />
        </button>
        <h1 className="font-headline font-bold tracking-tight text-zinc-900 text-base">Event Details</h1>
        <div className="w-10"></div>
      </header>

      <main className="pb-32">
        <section className="relative w-full h-[397px] overflow-hidden">
          <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2NqPJV5pGbOhULMXSZAYeyybcXGOBDXAOQ0uKzOKrVf2Q_Rk5I3S6LDM7ZYyNQILK5s6X-pZcoiCieDrcjSBnda4to82ON4wYfkwKJowSIgD8UHTn7vXxNM0s26y64iQT05eNEXul2l0wk4kO2wRnwUTZGuDkxu3QrUVmZtPP-ACuLXl4WHi7FqJc_yq10x0fqOj8i7bHA3VJlogUN2eKbVq93TDwOf0EnaXTvlTbzs6Q0TEVjaBoxqDOgYTC0_KSq-icYUH-8CHQ" alt="Festival" />
          <div className="absolute inset-0 hero-fade"></div>
        </section>

        <div className="px-6 -mt-12 relative z-10 space-y-8">
          <div className="space-y-4">
            <h2 className="font-headline font-extrabold text-4xl tracking-tighter text-on-surface">UNITIS FEST</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low text-secondary">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-label uppercase tracking-widest text-secondary font-semibold">Date</p>
                  <p className="text-sm font-medium">Saturday, 24 August 2024</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low text-secondary">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-label uppercase tracking-widest text-secondary font-semibold">Time</p>
                  <p className="text-sm font-medium">14:00 - 06:00 (+1 Day)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low text-secondary">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-label uppercase tracking-widest text-secondary font-semibold">Location</p>
                  <p className="text-sm font-medium">Techno Forest, Warsaw</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-xs font-label uppercase tracking-wider text-secondary font-bold">Capacity</span>
              <span className="text-sm font-bold">58/200 <span className="text-secondary font-normal">places left</span></span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-[#D4AF37] w-[29%] rounded-full shadow-[0_0_8px_rgba(212,175,55,0.4)]"></div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-headline font-bold text-lg tracking-tight">DAYTIME</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed tracking-wide">Experience the ethereal transition of sound as the sun hangs high. A curated journey through melodic deep house and organic textures.</p>
              <ul className="space-y-2 pt-2">
                <li className="flex items-center gap-3 text-sm text-secondary">
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                  <span>Open air garden access</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-secondary">
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                  <span>Curated artisanal cocktail bar</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-headline font-bold text-lg tracking-tight">NIGHTTIME</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed tracking-wide">The transformation begins at twilight. High-precision industrial techno takes center stage in our warehouse bunker.</p>
              <ul className="space-y-2 pt-2">
                <li className="flex items-center gap-3 text-sm text-secondary">
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                  <span>Immersive LED installation</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-secondary">
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                  <span>Void Acoustics sound system</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-headline font-bold text-lg tracking-tight px-0">ARTISTS & MEDIA</h3>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
              <div className="flex-shrink-0 text-center space-y-2">
                <div className="w-20 h-20 rounded-full border-2 border-surface-container overflow-hidden">
                  <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsc1_7e_8Ono64rkduXz00YIy3WlSp5B1Ry-UGbubfQLQvO7Bc6_pJnPP0fyt814inoABVZthJXwK4SO4ZkAf5TvbgK4_bFrwWp-8g2v6M-RwhDw0-rjgCBpBC9fzI04qHhNFLze7ZvGrDoaaLqCOqfUee4Ru_GEPQGd63pnRKuPti7d3ILaE4gPncW7M8HAbBr-6_rB9hijPb3VjbzRFLd_QSGLV00uDR4Ua-ANfq5N3hjvDx1ObmXFtsnuGAicoR6FeGD7f4Eayc" alt="Artist 1" />
                </div>
                <span className="text-[10px] font-label font-bold uppercase tracking-tighter">K. VORTEX</span>
              </div>
              <div className="flex-shrink-0 text-center space-y-2">
                <div className="w-20 h-20 rounded-full border-2 border-surface-container overflow-hidden">
                  <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9IFFdsdLZNQhZuyAEZ43lNMNOJ4mwn823IPgllfxR5_3uIiAhg9hxWreci9qIC-Kny9scWE7qbdT7wilCY1IxmYhFGLCo7lbNIrcYK3h6or_t8g3frlW-b_682XtjhNqYlTYnQKvMR4iw9sgawM-23LFKbhdmy-AXxrBMO8jyNZYqJ7f08Gm_H5rdMUC92uDbr94z4ptwWGJFHTO8AWOfO7U8XOcPWnMoOrnl0-YO8ldZVpzaMhSCf_EkEkNaaLCQSurfkl_e5JEc" alt="Artist 2" />
                </div>
                <span className="text-[10px] font-label font-bold uppercase tracking-tighter">ELARA</span>
              </div>
              <div className="flex-shrink-0 relative w-48 h-20 rounded-xl overflow-hidden bg-zinc-800">
                <img className="w-full h-full object-cover opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwkiYy-6rHUHaenBMgMhSBEAZxcGi5PF90ETgPzsgHCS06fd38hWFg1VpfW4EwFgqeJb0ZT4lUvFU04FZfQz6uqu0CghcHrd1fmLxHI340mIrPFQzDrFb0Sv50c083_yEc50R6ZQ9cLMQ1pt-gexdMJa7VylE8okyinDBSX3of3dkbA2MgpmXTYtsWgerOUvbBAiLLk_OD8h6SkyfaoXfHYUVtmCockfIxJ_7rBiF2_dZ_P3glfDMg1iXyW2EMtnULpQ6BM5tyyV3Y" alt="Video" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full glass-card flex items-center justify-center">
                    <Play className="w-4 h-4 text-white fill-white" />
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 text-center space-y-2">
                <div className="w-20 h-20 rounded-full border-2 border-surface-container overflow-hidden">
                  <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBE91BQybQwjQU4SQBd7woSqFTnQn03uwctbnHc99v-BtuuJLOjVWW5Fo5DeJoM_xlX5ANUvFVuzdoOR6u3ph1b_155Hu4BwKMhuTz2a66OhJjxMIntw2QhGTuM1Z2t3Yjom-2y1qqcb1tcfbzSzRuFWeYeibQKx84YovV6nPixa2fB2PmH4FuPGQFLnwPDpYYxLGRkB50YJ-ZSjUF6xD8rmvVtziqcV2xBtHGm1iu0FAAKPh9h4LTnGqkCfKbWyR0okpO6W2k33AJs" alt="Artist 3" />
                </div>
                <span className="text-[10px] font-label font-bold uppercase tracking-tighter">MAKR</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Плавающая панель с кнопкой (до открытия модалки) */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40 flex flex-col gap-2">
        {error && (
          <div className="bg-red-500/90 text-white text-xs font-bold text-center py-2 px-4 rounded-full backdrop-blur-sm shadow-lg">
            {error}
          </div>
        )}
        <div className="glass-card rounded-full p-2 pl-6 flex items-center justify-between shadow-lg border border-white/20 bg-white/80 backdrop-blur-md">
          <div className="flex flex-col">
            <span className="text-[10px] font-label uppercase text-secondary font-bold tracking-widest">Entry from</span>
            <span className="font-headline font-extrabold text-lg">{TICKET_PRICE} PLN</span>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="px-8 py-3.5 bg-[#D4AF37] text-black font-headline font-black text-sm rounded-full shadow-[0_4px_16px_rgba(212,175,55,0.4)] active:scale-95 transition-all"
          >
            BUY TICKET
          </button>
        </div>
      </div>

      {/* Выезжающее модальное окно выбора количества билетов */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div 
            className="bg-zinc-900 border-t border-white/10 w-full max-w-md rounded-t-3xl p-6 pb-12 animate-in slide-in-from-bottom-8 duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
            onClick={e => e.stopPropagation()} // Предотвращаем закрытие при клике внутри модалки
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-xl text-white">Select Tickets</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-white/50 active:scale-95">
                ✕
              </button>
            </div>
            
            <div className="flex items-center justify-between bg-black/50 border border-white/5 p-4 rounded-2xl mb-6">
              <span className="font-medium text-white/80">Quantity</span>
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-xl text-white active:scale-95 transition-all"
                >
                  -
                </button>
                <span className="font-headline font-bold text-xl w-4 text-center text-white">{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(10, quantity + 1))} 
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-xl text-black active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center px-2 mb-6">
              <span className="text-white/50 font-medium">Total:</span>
              <span className="font-headline font-extrabold text-3xl text-white">{TICKET_PRICE * quantity} PLN</span>
            </div>

            <button 
              onClick={() => purchaseTicket('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb1a', quantity)}
              disabled={loading}
              className="w-full py-4 bg-[#D4AF37] text-black font-headline font-black text-sm rounded-xl shadow-[0_4px_16px_rgba(212,175,55,0.4)] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'PROCESSING...' : 'PROCEED TO PAYMENT'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
