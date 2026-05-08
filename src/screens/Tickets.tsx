import { useState, useEffect } from 'react';
import { Ticket as TicketIcon, MapPin, Calendar, Clock, User, Tag } from 'lucide-react';
import { Screen } from '../App';
import { supabase } from '../lib/supabaseClient';

export default function Tickets({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [expandedQr, setExpandedQr] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);

  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  let guestName = "Guest";
  if (tgUser) {
    if (tgUser.first_name && tgUser.last_name) {
      guestName = `${tgUser.first_name} ${tgUser.last_name}`;
    } else if (tgUser.first_name) {
      guestName = tgUser.first_name;
    } else if (tgUser.username) {
      guestName = `@${tgUser.username}`;
    }
  }

  useEffect(() => {
    async function fetchTickets() {
      if (!tgUser?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('tickets_full')
          .select('*')
          .eq('user_id', tgUser.id)
          .in('status', ['paid', 'used'])
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setTickets(data);
      } catch (err) {
        console.error("Error fetching tickets:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTickets();
  }, [tgUser?.id]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    const dx = touchEnd.x - touchStart.x;
    const dy = touchEnd.y - touchStart.y;
    
    if (Math.abs(dx) > 50 || Math.abs(dy) > 50) {
      setExpandedQr(null);
    }
    setTouchStart(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-4 border-[#A50021]/20 border-t-[#A50021] rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-medium text-sm animate-pulse">Loading your tickets...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className="w-full sticky top-0 z-50 bg-zinc-300/70 backdrop-blur-xl flex items-center justify-center px-6 pt-6 pb-2 border-b border-zinc-400/30">
        <img src="/logo.png" alt="Kyrios Logo" className="h-[55px] w-auto object-contain" />
      </header>

      <main className="px-6 py-8 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-headline font-extrabold text-3xl tracking-tight text-zinc-900">My Tickets</h2>
          <div className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-sm">
            <TicketIcon className="w-5 h-5" />
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-8 text-center border border-zinc-100 shadow-sm animate-fade-up">
            <div className="w-16 h-16 mx-auto bg-zinc-50 rounded-2xl flex items-center justify-center mb-4">
              <TicketIcon className="w-8 h-8 text-zinc-300" />
            </div>
            <h3 className="font-headline font-bold text-xl text-zinc-900 mb-2">No tickets yet</h3>
            <p className="text-zinc-500 text-sm mb-6">Looks like you haven't purchased any tickets for upcoming events.</p>
            <button 
              onClick={() => onNavigate('events')}
              className="px-6 py-3 bg-zinc-900 text-white font-bold text-sm rounded-xl active:scale-95 transition-all shadow-lg shadow-zinc-900/20"
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {tickets.map((ticket, index) => {
              const eventDate = new Date(ticket.event_date);
              const dateString = eventDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
              const timeString = eventDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
              const isUsed = ticket.status === 'used';

              return (
                <div 
                  key={ticket.id}
                  className="bg-white rounded-[2rem] overflow-hidden shadow-xl shadow-zinc-200/50 border border-zinc-100 animate-fade-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative p-8 text-center bg-zinc-900 overflow-hidden">
                    {ticket.event_image_url && (
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-40 blur-md scale-110"
                        style={{ backgroundImage: `url(${ticket.event_image_url})` }}
                      ></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-zinc-900/95 pointer-events-none"></div>
                    
                    <div className="relative z-10 flex flex-col items-center">
                      <p className="text-zinc-300 text-[10px] font-bold uppercase tracking-widest mb-4">
                        {isUsed ? 'Ticket successfully verified' : 'Tap QR to expand & scan'}
                      </p>
                      
                      <div 
                        onClick={() => !isUsed && setExpandedQr(ticket.ticket_code)}
                        className={`relative w-48 h-48 bg-white rounded-3xl p-4 mb-6 transition-all ${
                          isUsed 
                            ? 'opacity-40 grayscale pointer-events-none' 
                            : 'shadow-[0_0_30px_rgba(255,255,255,0.15)] cursor-pointer active:scale-95'
                        }`}
                      >
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticket.ticket_code}&color=000000&bgcolor=ffffff`}
                          alt="QR Code" 
                          className={`w-full h-full object-contain ${isUsed ? 'blur-[2px]' : 'mix-blend-multiply'}`}
                        />
                        
                        {isUsed && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-3xl overflow-hidden">
                            <div className="absolute w-[140%] h-1.5 bg-red-600 transform -rotate-45 shadow-sm"></div>
                            <div className="absolute w-[140%] h-1.5 bg-red-600 transform rotate-45 shadow-sm"></div>
                            <div className="z-10 transform -rotate-12 bg-white/95 px-5 py-2 rounded-xl border-4 border-red-600 text-red-600 font-black text-2xl tracking-widest shadow-xl backdrop-blur-sm">
                              SCANNED
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-zinc-400 text-[10px] uppercase tracking-widest mb-1 font-bold">Ticket ID</p>
                      <p className="text-white font-mono text-sm opacity-90">{ticket.ticket_code}</p>
                    </div>
                  </div>

                  <div className="relative h-8 flex items-center justify-between px-4 -my-4 z-20">
                    <div className="w-6 h-6 rounded-full bg-slate-50 border border-zinc-100 absolute -left-3"></div>
                    <div className="w-full border-t-2 border-dashed border-zinc-200"></div>
                    <div className="w-6 h-6 rounded-full bg-slate-50 border border-zinc-100 absolute -right-3"></div>
                  </div>

                  <div className="p-8 pt-10 space-y-6 relative bg-white">
                    <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="w-10 h-10 bg-zinc-200 rounded-xl flex items-center justify-center text-zinc-500">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Guest Name</p>
                        <p className="font-bold text-zinc-900 text-base">{guestName}</p>
                      </div>
                    </div>

                    <div className="border-t border-zinc-100"></div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Event</p>
                      <h3 className="font-headline font-black text-2xl tracking-tight text-zinc-900">
                        {ticket.event_title || 'Kyrios Event'}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Calendar className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Date</span>
                        </div>
                        <p className="font-bold text-zinc-900 text-sm leading-tight">{dateString}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Clock className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Time</span>
                        </div>
                        <p className="font-bold text-zinc-900 text-sm leading-tight">{timeString}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <MapPin className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Location</span>
                      </div>
                      <p className="font-bold text-zinc-900 text-base leading-tight">
                        {ticket.event_location_name || 'Secret Location'}
                      </p>
                      <p className="text-zinc-500 text-sm font-medium">
                        {ticket.event_location_address || 'To be announced'}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-zinc-100 flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Status</span>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest w-fit ${
                            isUsed 
                              ? 'bg-zinc-100 text-zinc-500' 
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          }`}>
                            {isUsed ? 'SCANNED' : 'VALID ENTRY'}
                          </span>
                        </div>

                        {/* Плашка промокода (emerald стиль как предложил бэк) */}
                        {ticket.promo_code && (
                          <div className="flex items-center gap-1.5 pt-1">
                             <span className="text-[10px] font-mono bg-emerald-50 text-emerald-600 
                                             px-2 py-0.5 rounded-full border border-emerald-200 font-bold uppercase">
                              🎟 {ticket.promo_code} −{ticket.promo_discount_percent}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {expandedQr && (
          <div 
            className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in zoom-in-95 duration-200"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs mb-8 text-center">
                Show this code at entrance<br/>(Swipe to close)
              </p>
              
              <div className="w-full max-w-sm aspect-square bg-white rounded-3xl p-4">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${expandedQr}&color=000000&bgcolor=ffffff`}
                  alt="Expanded QR Code" 
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              </div>
            </div>
            
            <div className="w-full p-6 pb-12 bg-white">
              <button 
                onClick={() => setExpandedQr(null)}
                className="w-full py-4 bg-[#A50021] text-white font-headline font-black text-lg rounded-2xl shadow-[0_8px_30px_rgba(165,0,33,0.3)] active:scale-95 transition-all"
              >
                BACK
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
