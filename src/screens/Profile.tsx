import { useEffect, useState } from 'react';
import { Share2, Zap, QrCode, Trophy, User, ShieldCheck, Flame, Lock, CreditCard, Crown } from 'lucide-react';
import { Screen } from '../App';
import { supabase } from '../lib/supabaseClient';

interface ProfileProps {
  onNavigate: (screen: Screen) => void;
  userRole: string | null;
}

export default function Profile({ onNavigate, userRole }: ProfileProps) {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const photoUrl = tgUser?.photo_url;

  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    async function fetchPoints() {
      if (tgUser?.id) {
        const { data } = await supabase
          .from('users')
          .select('points, streak_count')
          .eq('telegram_id', tgUser.id)
          .single();
        
        if (data) {
          setPoints(data.points || 0);
          setStreak(data.streak_count || 0);
        }
      }
    }
    fetchPoints();
  }, [tgUser?.id]);

  // Логика уровней и лимита в 10 уровней
  const POINTS_PER_LEVEL = 1000;
  const MAX_LEVEL = 10;
  
  // Вычисляем текущий уровень, но не даем ему подняться выше MAX_LEVEL
  const calculatedLevel = Math.floor(points / POINTS_PER_LEVEL) + 1;
  const currentLevel = Math.min(calculatedLevel, MAX_LEVEL);
  const isMaxLevel = currentLevel === MAX_LEVEL;

  const pointsInCurrentLevel = isMaxLevel ? POINTS_PER_LEVEL : points % POINTS_PER_LEVEL;
  const progressPercentage = isMaxLevel ? 100 : Math.min(100, (pointsInCurrentLevel / POINTS_PER_LEVEL) * 100);
  const pointsToNextLevel = isMaxLevel ? 0 : POINTS_PER_LEVEL - pointsInCurrentLevel;

  const getRankName = (lvl: number) => {
    if (lvl <= 2) return "Dancer";
    if (lvl <= 4) return "Insider";
    if (lvl <= 7) return "Headliner";
    if (lvl <= 9) return "Legend";
    return "Kyrios VIP";
  };

  // ✅ ИСПРАВЛЕНО: Реферальная логика переведена на @kyrios_events_bot с передачей ref_ через /start
  const handleInvite = () => {
    if (!tgUser?.id) return;
    
    // Новая реферальная ссылка на актуального бота
    const refLink = `https://t.me/kyrios_events_bot?start=ref_${tgUser.id}`;
    
    // Текст для шаринга
    const text = `Привет! Присоединяйся к Kyrios Events — крутые мероприятия в Варшаве 🎉`;
    
    // Открываем нативный шаринг Telegram через WebApp
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`;
    
    window.Telegram?.WebApp?.openTelegramLink(shareUrl);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className="w-full sticky top-0 z-50 bg-zinc-300/70 backdrop-blur-xl flex items-center justify-center px-6 pt-6 pb-2 border-b border-zinc-400/30">
        <img src="/logo.png" alt="Kyrios Logo" className="h-[55px] w-auto object-contain" />
      </header>

      <main className="px-6 py-4 space-y-8 overflow-x-hidden">
        
        <div className="pt-4 flex flex-col items-center justify-center text-center animate-fade-up">
          {photoUrl ? (
            <img src={photoUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white mb-4" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#A50021] flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white mb-4">
              {tgUser?.first_name?.charAt(0) || <User size={40} />}
            </div>
          )}
          <h2 className="text-zinc-900 font-headline font-bold text-2xl tracking-tight">
            {tgUser?.first_name || 'Guest'} {tgUser?.last_name || ''}
          </h2>
          <p className="text-zinc-500 text-sm font-medium mt-1">@{tgUser?.username || 'unknown'}</p>
        </div>

        {/* ШКАЛА УРОВНЯ */}
        <section className="bg-zinc-900 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden animate-fade-up delay-100 border border-zinc-800">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Trophy size={100} className="text-[#A50021]" />
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-[#A50021] text-[10px] font-bold uppercase tracking-widest mb-1">Current Rank</p>
                <h3 className="text-white font-headline font-black text-3xl tracking-tight">
                  {getRankName(currentLevel)} <span className="text-zinc-500 text-xl font-medium">Lvl {currentLevel} / {MAX_LEVEL}</span>
                </h3>
              </div>
              {/* Плашка Streak */}
              {streak > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-xl">
                  <Flame size={14} className="text-orange-500" />
                  <span className="text-orange-500 font-bold text-xs">{streak} Streak</span>
                </div>
              )}
            </div>

            <div className="mt-8 space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Progress</span>
                <span className="text-white font-bold text-sm">
                  {isMaxLevel ? 'MAX' : pointsInCurrentLevel} <span className="text-zinc-500 font-normal">/ {isMaxLevel ? 'MAX' : POINTS_PER_LEVEL} XP</span>
                </span>
              </div>
              
              <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-[#A50021] rounded-full shadow-[0_0_15px_rgba(165,0,33,0.5)] transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-zinc-500 text-xs text-right font-medium">
                {isMaxLevel ? 'Maximum level reached!' : `${pointsToNextLevel} XP left to Level ${currentLevel + 1}`}
              </p>
            </div>
          </div>
        </section>

        {/* KYRIOS VIP CARD */}
        <section className="animate-fade-up delay-150">
          {isMaxLevel ? (
            // Открытая VIP-карта
            <div className="bg-gradient-to-br from-zinc-900 to-[#A50021]/30 rounded-[2rem] p-6 border border-[#A50021]/50 relative overflow-hidden shadow-[0_10px_30px_rgba(165,0,33,0.2)]">
              <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none">
                <Crown size={100} className="text-white" />
              </div>
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 bg-[#A50021] rounded-xl flex items-center justify-center shadow-lg shadow-[#A50021]/40 border border-[#A50021]">
                  <CreditCard className="text-white w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-headline font-bold text-white text-lg tracking-tight">Kyrios VIP Card</h4>
                  <p className="text-[#A50021] text-xs font-bold uppercase tracking-widest mt-1">Status: Active</p>
                </div>
              </div>
            </div>
          ) : (
            // Заблокированная VIP-карта
            <div className="bg-white rounded-[2rem] p-6 border border-zinc-100 shadow-sm relative overflow-hidden flex items-center gap-5 grayscale opacity-70">
              <div className="w-14 h-14 bg-zinc-100 rounded-xl flex items-center justify-center border border-zinc-200">
                <Lock className="text-zinc-400 w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 text-base">Kyrios VIP Card</h4>
                <p className="text-zinc-500 text-xs font-medium mt-0.5 leading-tight">Reach Level 10 to unlock exclusive discounts on all tickets</p>
              </div>
            </div>
          )}
        </section>

        {/* EARN XP POINTS */}
        <section className="space-y-4 animate-fade-up delay-200">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Earn XP Points</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
                  <Share2 className="text-blue-500 w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 text-sm">Invite a Friend</h4>
                  {/* ✅ ИСПРАВЛЕНО: Обновлено визуальное отображение начисляемых очков под бэкенд */}
                  <p className="text-blue-500 font-bold text-xs mt-0.5">+500 XP</p>
                </div>
              </div>
              <button onClick={handleInvite} className="px-4 py-2 bg-zinc-900 text-white font-bold text-xs rounded-xl active:scale-95 transition-all">Share</button>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100"><QrCode className="text-emerald-500 w-5 h-5" /></div>
                <div><h4 className="font-bold text-zinc-900 text-sm">Attend an Event</h4><p className="text-emerald-500 font-bold text-xs mt-0.5">+200 XP</p></div>
              </div>
              <div className="px-3 py-1.5 bg-zinc-100 text-zinc-400 font-bold text-[10px] uppercase tracking-wider rounded-lg">Auto</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center border border-purple-100"><Zap className="text-purple-500 w-5 h-5" /></div>
                <div><h4 className="font-bold text-zinc-900 text-sm">Early Bird Ticket</h4><p className="text-purple-500 font-bold text-xs mt-0.5">+150 XP</p></div>
              </div>
              <div className="px-3 py-1.5 bg-zinc-100 text-zinc-400 font-bold text-[10px] uppercase tracking-wider rounded-lg">Auto</div>
            </div>
          </div>
        </section>

        {(userRole === 'admin' || userRole === 'hostess' || userRole === 'scanner') && (
          <section className="space-y-4 animate-fade-up delay-300">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 ml-2">Admin Panel</h3>
            <button onClick={() => onNavigate('admin')} className="w-full bg-white border border-zinc-100 p-5 rounded-[2rem] flex items-center justify-between active:scale-[0.98] transition-all shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-900 border border-zinc-100"><QrCode size={24} /></div>
                <div className="text-left"><p className="text-zinc-900 font-bold text-base tracking-tight">Ticket Scanner</p><p className="text-zinc-400 text-xs font-medium mt-0.5">Verify guest QR codes</p></div>
              </div>
              <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center"><ShieldCheck className="text-zinc-900 w-5 h-5" /></div>
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
