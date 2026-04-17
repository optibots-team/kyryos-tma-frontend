import { Home, Ticket, Image, User } from 'lucide-react';
import { Screen } from '../App';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export default function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  const navItems = [
    { id: 'events', label: 'Events', icon: Home },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'gallery', label: 'Gallery', icon: Image },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-8 pt-4 bg-slate-50/80 backdrop-blur-xl border-t border-white/20">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Если мы в админке, подсвечиваем кнопку профиля, так как вход в админку оттуда
          const isActive = currentScreen === item.id || (item.id === 'profile' && currentScreen === 'admin');
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as Screen)}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                isActive ? 'text-zinc-900 scale-110' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <div className={`p-2 rounded-2xl transition-all duration-300 ${
                isActive ? 'bg-white shadow-sm ring-1 ring-black/5' : ''
              }`}>
                <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tighter">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
