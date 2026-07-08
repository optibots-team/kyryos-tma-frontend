import { Home, Ticket, Image, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ✅ Решение: Описываем пропсы через базовый string, чтобы вообще исключить конфликты типов с файлом App.tsx
interface BottomNavProps {
  currentScreen: string;
  onNavigate: (screen: any) => void;
}

export default function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  const { t } = useTranslation();

  const navItems = [
    { id: 'events', label: t('nav.events'), icon: Home },
    { id: 'tickets', label: t('nav.tickets'), icon: Ticket },
    { id: 'gallery', label: t('nav.gallery'), icon: Image },
    { id: 'profile', label: t('nav.profile'), icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-8 pt-4 bg-background/80 backdrop-blur-xl border-t border-outline-variant/30 dark:border-white/10">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;

          // Теперь это чистая проверка строк JavaScript, ломаться тут просто нечему
          const isActive = currentScreen === item.id ||
            (item.id === 'profile' && ['admin', 'admin-panel'].includes(currentScreen));

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                isActive ? 'text-on-surface scale-110' : 'text-on-surface-variant/60 hover:text-on-surface-variant'
              }`}
            >
              <div className={`p-2 rounded-2xl transition-all duration-300 ${
                isActive ? 'bg-surface shadow-sm ring-1 ring-black/5 dark:ring-white/10' : ''
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
