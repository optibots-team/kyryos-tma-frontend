import { User, Settings, ShieldCheck, QrCode } from 'lucide-react';
import { Screen } from '../App';

interface ProfileProps {
  onNavigate: (screen: Screen) => void;
  userRole: string | null;
}

export default function Profile({ onNavigate, userRole }: ProfileProps) {
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;

  return (
    <div className="min-h-screen bg-black pb-32">
      <header className="px-6 pt-12 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-[#D4AF37] flex items-center justify-center text-black text-2xl font-bold border-4 border-white/10">
            {user?.first_name?.charAt(0) || <User />}
          </div>
          <div>
            <h1 className="text-white font-bold text-2xl">{user?.first_name || 'Guest'}</h1>
            <p className="text-white/40 text-sm">@{user?.username || 'unknown'}</p>
          </div>
        </div>
      </header>

      <main className="px-6 space-y-6">
        {/* АДМИН-ПАНЕЛЬ: Видна только админам и хостес */}
        {(userRole === 'admin' || userRole === 'hostess') && (
          <section className="space-y-3">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] ml-2">Admin Panel</h2>
            <button 
              onClick={() => onNavigate('admin')}
              className="w-full bg-white/5 border border-[#D4AF37]/30 p-4 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
                  <QrCode size={20} />
                </div>
                <div className="text-left">
                  <p className="text-white font-bold text-sm">Ticket Scanner</p>
                  <p className="text-white/40 text-xs">Verify guest QR codes</p>
                </div>
              </div>
              <ShieldCheck className="text-[#D4AF37]" size={20} />
            </button>
          </section>
        )}

        {/* Остальные настройки профиля */}
        <section className="space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-2">Settings</h2>
          <div className="bg-white/5 rounded-3xl overflow-hidden border border-white/5">
            <button className="w-full p-4 flex items-center justify-between border-b border-white/5 active:bg-white/10 transition-colors">
              <div className="flex items-center gap-3 text-white">
                <Settings size={18} className="text-white/60" />
                <span className="text-sm font-medium">Notification Settings</span>
              </div>
            </button>
            <button className="w-full p-4 flex items-center justify-between active:bg-white/10 transition-colors">
              <div className="flex items-center gap-3 text-white">
                <User size={18} className="text-white/60" />
                <span className="text-sm font-medium">Edit Profile</span>
              </div>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
