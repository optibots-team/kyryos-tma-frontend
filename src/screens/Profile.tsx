import { useEffect, useState } from 'react';
import { 
  Share2, Zap, QrCode, Trophy, User, ShieldCheck, 
  Flame, Lock, CreditCard, Crown, CheckCircle2, Instagram, Save 
} from 'lucide-react';
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
  
  // Новые поля профиля
  const [fullName, setFullName] = useState('');
  const [instaHandle, setInstaHandle] = useState('');
  const [isNameFilled, setIsNameFilled] = useState(false);
  const [isInstaFilled, setIsInstaFilled] = useState(false);
  
  const [saveLoading, setSaveLoading] = useState(false);
  const [xpNotify, setXpNotify] = useState<{show: boolean, msg: string}>({show: false, msg: ''});

  useEffect(() => {
    async function fetchUserData() {
      if (tgUser?.id) {
        const { data } = await supabase
          .from('users')
          .select('points, streak_count, full_name, instagram')
          .eq('telegram_id', tgUser.id)
          .single();
        
        if (data) {
          setPoints(data.points || 0);
          setStreak(data.streak_count || 0);
          setFullName(data.full_name || '');
          setInstaHandle(data.instagram || '');
          setIsNameFilled(!!data.full_name);
          setIsInstaFilled(!!data.instagram);
        }
      }
    }
    fetchUserData();
  }, [tgUser?.id]);

  const handleSaveProfile = async () => {
    if (!tgUser?.id || saveLoading) return;
    setSaveLoading(true);

    try {
      const supabaseUrl = (supabase as any).supabaseUrl;
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`${supabaseUrl}/functions/v1/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || (supabase as any).supabaseKey}`
        },
        body: JSON.stringify({
          telegram_id: tgUser.id,
          full_name: fullName.trim(),
          instagram: instaHandle.replace('@', '').trim()
        })
      });

      const result = await res.json();

      if (result.points_earned > 0) {
        setPoints(prev => prev + result.points_earned);
        setXpNotify({ show: true, msg: `+${result.points_earned} XP EARNED! ✨` });
        setTimeout(() => setXpNotify({ show: false, msg: '' }), 4000);
      }

      if (result.full_name_updated) setIsNameFilled(true);
      if (result.instagram_updated) setIsInstaFilled(true);

    } catch (err) {
      console.error("Error updating profile:", err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleInvite = () => {
    if (!tgUser?.id) return;
    const refLink = `https://t.me/kyrios_events_bot?start=ref_${tgUser.id}`;
    const text = `Привет! Присоединяйся к Kyrios Events — крутые мероприятия в Варшаве 🎉`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`;
    window.Telegram?.WebApp?.openTelegramLink(shareUrl);
  };

  // Логика уровней
  const POINTS_PER_LEVEL = 1000;
  const MAX_LEVEL = 10;
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

  // 🎯 Динамическое имя пользователя
  const displayName = fullName || tgUser?.first_name || tgUser?.username || 'Guest';

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className="w-full sticky top-0 z-50 bg-zinc-300/70 backdrop-blur-xl flex items-center justify-center px-6 pt-6 pb-2 border-b border-zinc-400/30">
        <img src="/logo.png" alt="Kyrios Logo" className="h-[55px] w-auto object-contain" />
      </header>

      {/* Уведомление о XP */}
      {xpNotify.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 text-white px-6 py-3 rounded-2xl shadow-2xl border border-[#A50021] animate-in slide-in-from-top-10 duration-300">
          <p className="font-headline font-black text-sm tracking-widest text-[#A50021]">{xpNotify.msg}</p>
        </div>
      )}

      <main className="px-6 py-4 space-y-6 overflow-x-hidden">
        
        <div className="pt-4 flex flex-col items-center justify-center text-center animate-fade-up">
          {photoUrl ? (
            <img src={photoUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white mb-4" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#A50021] flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white mb-4">
              {displayName.charAt(0)}
            </div>
          )}
          <h2 className="text-zinc-900 font-headline font-bold text-2xl tracking-tight leading-none">{displayName}</h2>
          <p className="text-zinc-500 text-sm font-medium mt-1">@{tgUser?.username || 'unknown'}</p>
        </div>

        {/* 🆕 НОВЫЙ БЛОК: РЕДАКТИРОВАНИЕ ПРОФИЛЯ */}
        <section className="bg-white rounded-[2rem] p-6 border border-zinc-100 shadow-sm space-y-4 animate-fade-up delay-75">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Complete Your Profile</h3>
            <button 
              onClick={handleSaveProfile}
              disabled={saveLoading}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
            >
              {saveLoading ? '...' : <><Save size={12} /> Save</>}
            </button>
          </div>

          <div className="space-y-3">
            {/* Имя и Фамилия */}
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Enter Name & Surname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-zinc-900 focus:outline-none focus:border-[#A50021]/30 transition-all pr-24"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isNameFilled ? (
                  <CheckCircle2 size={18} className="text-emerald-500" />
                ) : (
                  <span className="text-[9px] font-black bg-zinc-900 text-[#A50021] px-2 py-1 rounded-lg border border-[#A50021]/30 animate-pulse">
                    +500 XP ✨
                  </span>
                )}
              </div>
            </div>

            {/* Instagram */}
            <div className="relative group">
              <input 
                type="text" 
                placeholder="@your_instagram"
                value={instaHandle.startsWith('@') || !instaHandle ? instaHandle : `@${instaHandle}`}
                onChange={(e) => setInstaHandle(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-zinc-900 focus:outline-none focus:border-[#A50021]/30 transition-all pr-24"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isInstaFilled ? (
                  <CheckCircle2 size={18} className="text-emerald-500" />
                ) : (
                  <span className="text-[9px] font-black bg-zinc-900 text-[#A50021] px-2 py-1 rounded-lg border border-[#A50021]/30 animate-pulse">
                    +500 XP ✨
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

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
                  {getRankName(currentLevel)} <span className="text-zinc-500 text-xl font-medium">Lvl {currentLevel}</span>
                </h3>
              </div>
              {streak > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-xl">
                  <Flame size={14} className="text-orange-500" />
                  <span className="text-orange-500 font-bold text-xs">{streak} Streak</span>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Progress</span>
                <span className="text-white font-bold text-sm">
                  {isMaxLevel ? 'MAX' : pointsInCurrentLevel} <span className="text-zinc-500 font-normal">/ {POINTS_PER_LEVEL} XP</span>
                </span>
              </div>
              <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-[#A50021] rounded-full shadow-[0_0_15px_rgba(165,0,33,0.5)] transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-zinc-500 text-[10px] text-right font-medium">
                {isMaxLevel ? 'Maximum level reached!' : `${pointsToNextLevel} XP left to Level ${currentLevel + 1}`}
              </p>
            </div>
          </div>
        </section>

        {/* EARN XP POINTS */}
        <section className="space-y-4 animate-fade-up delay-200">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">How to Earn XP</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {/* New Tasks */}
            <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center border border-zinc-100"><User className="text-zinc-400 w-5 h-5" /></div>
                <div><h4 className="font-bold text-zinc-900 text-xs">Fill in your name</h4><p className="text-zinc-400 font-bold text-[10px] mt-0.5">{isNameFilled ? '✅ Completed' : '+500 XP'}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center border border-zinc-100"><Instagram className="text-zinc-400 w-5 h-5" /></div>
                <div><h4 className="font-bold text-zinc-900 text-xs">Add Instagram handle</h4><p className="text-zinc-400 font-bold text-[10px] mt-0.5">{isInstaFilled ? '✅ Completed' : '+500 XP'}</p></div>
              </div>
            </div>

            {/* Existing Tasks */}
            <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100"><Share2 className="text-blue-500 w-5 h-5" /></div>
                <div><h4 className="font-bold text-zinc-900 text-xs">Invite a Friend</h4><p className="text-blue-500 font-bold text-[10px] mt-0.5">+500 XP</p></div>
              </div>
              <button onClick={handleInvite} className="px-4 py-2 bg-zinc-900 text-white font-bold text-[10px] uppercase rounded-xl active:scale-95 transition-all">Share</button>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100"><QrCode className="text-emerald-500 w-5 h-5" /></div>
                <div><h4 className="font-bold text-zinc-900 text-xs">Attend an Event</h4><p className="text-emerald-500 font-bold text-[10px] mt-0.5">+200 XP</p></div>
              </div>
              <div className="px-3 py-1.5 bg-zinc-100 text-zinc-400 font-bold text-[9px] uppercase tracking-wider rounded-lg">Auto</div>
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
