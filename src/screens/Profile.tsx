import { useEffect, useState } from 'react';
import { Share2, Zap, QrCode, Trophy, User, ShieldCheck } from 'lucide-react';
import { Screen } from '../App';
import { supabase } from '../lib/supabaseClient';

interface ProfileProps {
  onNavigate: (screen: Screen) => void;
  userRole: string | null;
}

export default function Profile({ onNavigate, userRole }: ProfileProps) {
  // Получаем данные пользователя напрямую из Telegram (чтобы фото работало моментально)
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const photoUrl = tgUser?.photo_url;

  // Состояние только для поинтов из базы данных
  const [points, setPoints] = useState(0);

  useEffect(() => {
    async function fetchPoints() {
      if (tgUser?.id) {
        const { data } = await supabase
          .from('users')
          .select('points')
          .eq('telegram_id', tgUser.id)
          .single();
        
        if (data) {
          setPoints(data.points || 0);
        }
      }
    }
    fetchPoints();
  }, [tgUser?.id]);

  // Логика уровней (1000 points = 1 level)
  const POINTS_PER_LEVEL = 1000;
  const currentLevel = Math.floor(points / POINTS_PER_LEVEL) + 1;
  const pointsInCurrentLevel = points % POINTS_PER_LEVEL;
  const progressPercentage = Math.min(100, (pointsInCurrentLevel / POINTS_PER_LEVEL) * 100);
  const pointsToNextLevel = POINTS_PER_LEVEL - pointsInCurrentLevel;

  const getRankName = (lvl: number) => {
    if (lvl === 1) return "Raver";
    if (lvl === 2) return "Insider";
    if (lvl === 3) return "Headliner";
    if (lvl === 4) return "Legend";
    return "Kyrios";
  };

  const handleInvite = () => {
    if (!tgUser?.id) return;

    const BOT_USERNAME = "roar_party_bot"; 
    const inviteLink = `https://t.me/${BOT_USERNAME}?start=ref_${tgUser.id}`;
    
    const shareText = `Join the best underground parties in Warsaw! Get exclusive tickets and rewards. 🚀`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;
    
    window.Telegram?.WebApp?.openTelegramLink(shareUrl);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* ГЛОБАЛЬНАЯ ШТОРКА */}
      <header className="w-full sticky top-0 z-50 bg-zinc-300/70 backdrop-blur-xl flex items-center justify-center px-6 pt-6 pb-2 border-b border-zinc-400/30">
        <img 
          src="/logo.png" 
          alt="Kyrios Logo" 
          className="h-[55px] w-auto object-contain" 
        />
      </header>

      <main className="px-6 py-4 space-y-8 overflow-x-hidden">
        
        {/* ПРОФИЛЬ: Центрирование, отступ сверху и загрузка фото */}
        <div className="pt-4 flex flex-col items-center justify-center text-center animate-fade-up">
          {photoUrl ? (
            <img 
              src={photoUrl} 
              alt={tgUser?.first_name || 'Profile'} 
              className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white mb-4"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#D4AF37] flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white mb-4">
              {tgUser?.first_name?.charAt(0) || <User size={40} />}
            </div>
          )}
          
          <h2 className="text-zinc-900 font-headline font-bold text-2xl tracking-tight">
            {tgUser?.first_name || 'Guest'} {tgUser?.last_name || ''}
          </h2>
          <p className="text-zinc-500 text-sm font-medium mt-1">
            @{tgUser?.username || 'unknown'}
          </p>
        </div>

        {/* ШКАЛА УРОВНЯ (Gamification Card) */}
        <section className="bg-zinc-900 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden animate-fade-up delay-100 border border-zinc-800">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Trophy size={100} className="text-[#D4AF37]" />
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest mb-1">Current Rank</p>
                <h3 className="text-white font-headline font-black text-3xl tracking-tight">
                  {getRankName(currentLevel)} <span className="text-zinc-500 text-xl font-medium">Lvl {currentLevel}</span>
                </h3>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Progress</span>
                <span className="text-white font-bold text-sm">{pointsInCurrentLevel} <span className="text-zinc-500 font-normal">/ {POINTS_PER_LEVEL} XP</span></span>
              </div>
              
              {/* Прогресс-бар */}
              <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-[#D4AF37] rounded-full shadow-[0_0_15px_rgba(212,175,55,0.5)] transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-zinc-500 text-xs text-right font-medium">
                {pointsToNextLevel} XP left to Level {currentLevel + 1}
              </p>
            </div>
          </div>
        </section>

        {/* EARN POINTS SECTION */}
        <section className="space-y-4 animate-fade-up delay-200">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Earn XP Points</h3>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Invite Friend Card */}
            <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
                  <Share2 className="text-blue-500 w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 text-sm">Invite a Friend</h4>
                  <p className="text-blue-500 font-bold text-xs mt-0.5">+1000 XP</p>
                </div>
              </div>
              <button 
                onClick={handleInvite}
                className="px-4 py-2 bg-zinc-900 text-white font-bold text-xs rounded-xl active:scale-95 transition-all"
              >
                Share
              </button>
            </div>

            {/* Attend Event Card */}
            <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                  <QrCode className="text-emerald-500 w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 text-sm">Attend an Event</h4>
                  <p className="text-emerald-500 font-bold text-xs mt-0.5">+200 XP</p>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-zinc-100 text-zinc-400 font-bold text-[10px] uppercase tracking-wider rounded-lg">
                Auto
              </div>
            </div>

            {/* Early Bird Card */}
            <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center border border-purple-100">
                  <Zap className="text-purple-500 w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 text-sm">Early Bird Ticket</h4>
                  <p className="text-purple-500 font-bold text-xs mt-0.5">+150 XP</p>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-zinc-100 text-zinc-400 font-bold text-[10px] uppercase tracking-wider rounded-lg">
                Auto
              </div>
            </div>
          </div>
        </section>

        {/* АДМИН-ПАНЕЛЬ: Видна только админам и хостес */}
        {(userRole === 'admin' || userRole === 'hostess' || userRole === 'scanner') && (
          <section className="space-y-4 animate-fade-up delay-300">
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
      </main>
    </div>
  );
}
