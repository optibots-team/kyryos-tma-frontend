import { useState, useEffect } from 'react';
import { Ticket as TicketIcon, MapPin, Calendar, Clock, User } from 'lucide-react';
import { Screen } from '../App';
import { supabase } from '../lib/supabaseClient';

export default function Tickets({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Получаем и форматируем имя гостя из Telegram
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
        // Делаем запрос к новому View (tickets_full), где уже есть все данные ивента
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        {/* Темно-красный спиннер загрузки */}
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
              // Форматируем дату из базы
              const eventDate = new Date(ticket.event_date);
              const dateString = eventDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
              const timeString = eventDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

              return (
                <div 
                  key={ticket.id}
                  className="bg-white rounded-[2rem] overflow-hidden shadow-xl shadow-zinc-200/50 border border-zinc-100 animate-fade-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Верхняя часть билета (QR и Имя) */}
                  <div className="bg-zinc-900 p-8 text-center relative overflow-hidden">
                    {/* Декоративный фон */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#A50021] rounded-full mix-blend-screen filter blur-[80px] opacity-50 pointer-events-none"></div>
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600 rounded-full mix-blend-screen filter blur-[80px] opacity-30 pointer-events-none"></div>
                    
                    <div className="relative z-10 flex flex-col items-center">
                      <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-4">Scan at entrance</p>
                      
                      {/* QR Код (заглушка/генерация) */}
                      <div className="w-48 h-48 bg-white rounded-3xl p-4 shadow-2xl mb-6">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticket.ticket_code}&color=000000&bgcolor=ffffff`}
                          alt="QR Code" 
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      </div>
                      
                      <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-1 font-bold">Ticket ID</p>
                      <p className="text-white font-mono text-sm opacity-80">{ticket.ticket_code}</p>
                    </div>
                  </div>

                  {/* Линия отрыва */}
                  <div className="relative h-8 flex items-center justify-between px-4 -my-4 z-20">
                    <div className="w-6 h-6 rounded-full bg-slate-50 border border-zinc-100 absolute -left-3"></div>
                    <div className="w-full border-t-2 border-dashed border-zinc-200"></div>
                    <div className="w-6 h-6 rounded-full bg-slate-50 border border-zinc-100 absolute -right-3"></div>
                  </div>

                  {/* Инфо часть билета (Динамическая) */}
                  <div className="p-8 pt-10 space-y-6">
                    {/* Блок гостя */}
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
                        <p className="font-bold text-zinc-900 text-sm leading-tight">{timeString} onwards</p>
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

                    {/* Статус билета */}
                    <div className="pt-4 border-t border-zinc-100 flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        ticket.status === 'used' 
                          ? 'bg-zinc-100 text-zinc-500' 
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}>
                        {ticket.status === 'used' ? 'SCANNED' : 'VALID ENTRY'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
