import { User, Settings, ShieldCheck, QrCode } from 'lucide-react';
import { Screen } from '../App';

interface ProfileProps {
  onNavigate: (screen: Screen) => void;
  userRole: string | null;
}

export default function Profile({ onNavigate, userRole }: ProfileProps) {
  // Получаем данные пользователя из Telegram
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const photoUrl = user?.photo_url;

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* ГЛОБАЛЬНАЯ ШТОРКА */}
      <header className="w-full sticky top-0 z-50 bg-zinc-280/70 backdrop-blur-xl flex items-center justify-center px-6 pt-6.5 pb-2 border-b border-zinc-400/30">
  <img 
    src="/logo.png" 
    alt="Kyrios Logo" 
    className="h-[55px] w-auto object-contain" 
  />
</header>

      <main className="px-6 space-y-8">
        {/* ПРОФИЛЬ: Центрирование, отступ сверху и загрузка фото */}
        <div className="pt-10 pb-2 flex flex-col items-center justify-center text-center">
          {photoUrl ? (
            <img 
              src={photoUrl} 
              alt={user?.first_name || 'Profile'} 
              className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white mb-4"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#D4AF37] flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white mb-4">
              {user?.first_name?.charAt(0) || <User size={40} />}
            </div>
          )}
          
          <h2 className="text-zinc-900 font-headline font-bold text-2xl tracking-tight">
            {user?.first_name || 'Guest'} {user?.last_name || ''}
          </h2>
          <p className="text-zinc-500 text-sm font-medium mt-1">
            @{user?.username || 'unknown'}
          </p>
        </div>

        {/* АДМИН-ПАНЕЛЬ: Видна только админам и хостес */}
        {(userRole === 'admin' || userRole === 'hostess') && (
          <section className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 ml-2">Admin Panel</h3>
            <button 
              onClick={() => onNavigate('admin')}
              className="w-full bg-white border border-zinc-100 p-5 rounded-[2rem] flex items-center justify-between active:scale-[0.98] transition-all shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-900 border border-zinc-100">
                  <QrCode size={24} />
                </div>
                <div className="text-left">
                  <p className="text-zinc-900 font-bold text-base tracking-tight">Ticket Scanner</p>
                  <p className="text-zinc-400 text-xs font-medium mt-0.5">Verify guest QR codes</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center">
                <ShieldCheck className="text-zinc-900 w-5 h-5" />
              </div>
            </button>
          </section>
        )}

        {/* НАСТРОЙКИ */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 ml-2">Settings</h3>
          <div className="bg-white rounded-[2rem] overflow-hidden border border-zinc-100 shadow-sm">
            <button className="w-full p-5 flex items-center justify-between border-b border-zinc-50 active:bg-zinc-50 transition-colors">
              <div className="flex items-center gap-4 text-zinc-900">
                <Settings size={20} className="text-zinc-400" />
                <span className="text-sm font-bold tracking-tight">Notification Settings</span>
              </div>
            </button>
            <button className="w-full p-5 flex items-center justify-between active:bg-zinc-50 transition-colors">
              <div className="flex items-center gap-4 text-zinc-900">
                <User size={20} className="text-zinc-400" />
                <span className="text-sm font-bold tracking-tight">Edit Profile</span>
              </div>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
