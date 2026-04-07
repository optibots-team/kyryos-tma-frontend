import { CircleDot, Ticket, Image, User } from 'lucide-react';
import { Screen } from '../App';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export default function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  const isEvents = currentScreen === 'events' || currentScreen === 'event-details';
  
  return (
    <nav className="fixed bottom-8 left-0 w-full z-50 flex justify-center items-center">
      <div className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-3xl w-[90%] max-w-md rounded-full px-2 py-2 flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
        <button 
          onClick={() => onNavigate('events')}
          className={`flex flex-col items-center justify-center rounded-full px-5 py-2 transition-all duration-500 ease-out ${isEvents ? 'bg-gradient-to-b from-zinc-700 to-black text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)] scale-105' : 'text-zinc-400 hover:text-zinc-600 active:scale-110'}`}
        >
          <CircleDot className="w-6 h-6 mb-0.5" />
          <span className="font-body text-[10px] font-bold tracking-widest uppercase">Events</span>
        </button>

        <button 
          onClick={() => onNavigate('tickets')}
          className={`flex flex-col items-center justify-center rounded-full px-5 py-2 transition-all duration-500 ease-out ${currentScreen === 'tickets' ? 'bg-gradient-to-b from-zinc-700 to-black text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)] scale-105' : 'text-zinc-400 hover:text-zinc-600 active:scale-110'}`}
        >
          <Ticket className="w-6 h-6 mb-0.5" />
          <span className="font-body text-[10px] font-bold tracking-widest uppercase">Tickets</span>
        </button>

        <button 
          onClick={() => onNavigate('gallery')}
          className={`flex flex-col items-center justify-center rounded-full px-5 py-2 transition-all duration-500 ease-out ${currentScreen === 'gallery' ? 'bg-gradient-to-b from-zinc-700 to-black text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)] scale-105' : 'text-zinc-400 hover:text-zinc-600 active:scale-110'}`}
        >
          <Image className="w-6 h-6 mb-0.5" />
          <span className="font-body text-[10px] font-bold tracking-widest uppercase">Gallery</span>
        </button>

        <button 
          onClick={() => onNavigate('profile')}
          className={`flex flex-col items-center justify-center rounded-full px-5 py-2 transition-all duration-500 ease-out ${currentScreen === 'profile' ? 'bg-gradient-to-b from-zinc-700 to-black text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)] scale-105' : 'text-zinc-400 hover:text-zinc-600 active:scale-110'}`}
        >
          <User className="w-6 h-6 mb-0.5" />
          <span className="font-body text-[10px] font-bold tracking-widest uppercase">Profile</span>
        </button>
      </div>
    </nav>
  );
}
