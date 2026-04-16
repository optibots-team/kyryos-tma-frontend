import { useState } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, Play } from 'lucide-react';
import { Screen } from '../App';
import { usePurchaseTicket } from '../hooks/usePurchaseTicket';

export default function EventDetails({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { purchaseTicket, loading, error } = usePurchaseTicket();
  
  // Состояния для модального окна и количества
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const TICKET_PRICE = 200;

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
        {/* ... (ВЕСЬ КОД ОСТАЕТСЯ БЕЗ ИЗМЕНЕНИЙ ВПЛОТЬ ДО НИЖНЕЙ ПАНЕЛИ) ... */}
        {/* Замени секцию main на свой текущий код */}
        <section className="relative w-full h-[397px] overflow-hidden">
          <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2NqPJV5pGbOhULMXSZAYeyybcXGOBDXAOQ0uKzOKrVf2Q_Rk5I3S6LDM7ZYyNQILK5s6X-pZcoiCieDrcjSBnda4to82ON4wYfkwKJowSIgD8UHTn7vXxNM0s26y64iQT05eNEXul2l0wk4kO2wRnwUTZGuDkxu3QrUVmZtPP-ACuLXl4WHi7FqJc_yq10x0fqOj8i7bHA3VJlogUN2eKbVq93TDwOf0EnaXTvlTbzs6Q0TEVjaBoxqDOgYTC0_KSq-icYUH-8CHQ" alt="Festival" />
          <div className="absolute inset-0 hero-fade"></div>
        </section>

        <div className="px-6 -mt-12 relative z-10 space-y-8">
           {/* Твой текущий контент */}
        </div>
      </main>

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40 flex flex-col gap-2">
        {error && (
          <div className="bg-red-500/90 text-white text-xs font-bold text-center py-2 px-4 rounded-full backdrop-blur-sm shadow-lg">
            {error}
          </div>
        )}
        <div className="glass-card rounded-full p-2 pl-6 flex items-center justify-between shadow-lg border border-white/20 bg-white/80">
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

      {/* Модальное окно выбора количества билетов */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div 
            className="bg-surface-container-lowest w-full max-w-md rounded-t-3xl p-6 pb-12 animate-in slide-in-from-bottom-8 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-xl">Select Tickets</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-secondary">
                ✕
              </button>
            </div>
            
            <div className="flex items-center justify-between bg-surface-container-high p-4 rounded-2xl mb-6">
              <span className="font-medium text-on-surface">Quantity</span>
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                  className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-xl text-black active:scale-95"
                >
                  -
                </button>
                <span className="font-headline font-bold text-xl w-4 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(10, quantity + 1))} 
                  className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-xl text-black active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center px-2 mb-6">
              <span className="text-secondary font-medium">Total:</span>
              <span className="font-headline font-extrabold text-3xl">{TICKET_PRICE * quantity} PLN</span>
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
