import { useEffect, useState } from 'react';
import { ChevronRight, Ticket as TicketIcon, Info, Calendar } from 'lucide-react';
import { Screen } from '../App';
import { supabase } from '../lib/supabaseClient';

export default function Events({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [soldCount, setSoldCount] = useState(0);
  const [hasTicket, setHasTicket] = useState(false);
  const MAX_CAPACITY = 300;

  useEffect(() => {
    async function fetchStats() {
      const { count } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .in('status', ['paid', 'used']);
      
      if (count !== null) setSoldCount(count);

      const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
      if (user?.id) {
        const { count: userTickets } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'paid');
          
        setHasTicket((userTickets || 0) > 0);
      }
    }
    fetchStats();
  }, []);

  const placesLeft = Math.max(0, MAX_CAPACITY - soldCount);

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* ГЛОБАЛЬНАЯ ШТОРКА (Увеличенный отступ pt-14 для челки iPhone) */}
 <header className="w-full sticky top-0 z-50 bg-zinc-250/70 backdrop-blur-xl flex items-center justify-center px-6 pt-11 pb-2 border-b border-zinc-400/30">
  <img 
    src="/logo.png" 
    alt="Kyrios Logo" 
    className="h-[70px] w-auto object-contain" 
  />
</header>

      <main className="px-6 py-8 space-y-8">
        {/* Main Event Card */}
        <section 
          onClick={() => onNavigate('event-details')}
          className="relative w-full aspect-[4/5] rounded-[2rem] overflow-hidden cursor-pointer group shadow-xl shadow-zinc-200/50"
        >
          <img 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80" 
            alt="UNITIS FEST" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          
          <div className="absolute inset-0 p-8 flex flex-col justify-end">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-bold uppercase tracking-widest">
                Warsaw
              </span>
            </div>
            
            <h2 className="text-white font-headline font-extrabold text-4xl mb-2 tracking-tight">UNITIS FEST</h2>
            <p className="text-white/70 text-sm mb-6 font-medium">Saturday, 24 August 2024</p>
            
            <div className="flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
              <div>
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">Capacity</p>
                <p className="text-white font-bold text-sm">
                  {placesLeft} <span className="text-white/60 font-normal">places left</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-lg">
                <ChevronRight className="text-black w-5 h-5" />
              </div>
            </div>
          </div>
        </section>

        {/* Quick Check-in */}
        {hasTicket && (
          <section 
            onClick={() => onNavigate('tickets')}
            className="w-full bg-emerald-50 rounded-[2rem] p-6 flex items-center justify-between cursor-pointer border border-emerald-100 transition-all active:scale-[0.98] shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <TicketIcon className="text-emerald-600 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-emerald-900 font-bold text-base tracking-tight">Quick check-in</h3>
                <p className="text-emerald-600/70 text-xs font-medium">Show your ticket at entrance</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <ChevronRight className="text-emerald-600 w-4 h-4" />
            </div>
          </section>
        )}

        {/* ABOUT KYRYOS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">About Agency</h3>
          </div>
          <div 
            className="bg-white rounded-[2rem] p-8 relative overflow-hidden h-[240px] flex flex-col justify-end group cursor-pointer border border-zinc-100 shadow-sm"
          >
            <div className="absolute top-0 right-0 p-8">
              <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-900">
                <Info className="w-6 h-6" />
              </div>
            </div>
            <div className="relative z-10">
              <h4 className="text-zinc-900 font-headline font-bold text-2xl mb-2 tracking-tight">About Kyrios</h4>
              <p className="text-zinc-500 text-sm leading-relaxed max-w-[200px]">Discover the vision and core values of our creative agency.</p>
            </div>
          </div>
        </section>

        {/* UPCOMING EVENT */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Next Experience</h3>
          </div>
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-zinc-100 flex items-center justify-between group cursor-pointer transition-all active:scale-[0.98]">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100">
                <Calendar className="text-zinc-900 w-6 h-6" />
              </div>
              <div>
                <h4 className="text-zinc-900 font-bold text-base tracking-tight">Upcoming event</h4>
                <p className="text-zinc-400 text-xs font-medium">To be announced soon</p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-all">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* PAST EVENTS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Past Events</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
            <div className="flex-shrink-0 w-72 h-44 rounded-[2rem] overflow-hidden relative shadow-lg shadow-zinc-200/50">
              <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1574096079513-d8259312b785?auto=format&fit=crop&w=800&q=80" alt="Neon Nights" />
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute bottom-0 left-0 p-5">
                <span className="text-white font-bold text-sm">Neon Nights</span>
              </div>
            </div>
            <div className="flex-shrink-0 w-72 h-44 rounded-[2rem] overflow-hidden relative shadow-lg shadow-zinc-200/50">
              <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80" alt="Warehouse" />
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute bottom-0 left-0 p-5">
                <span className="text-white font-bold text-sm">Warehouse Project</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
