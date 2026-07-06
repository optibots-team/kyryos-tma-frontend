import { useEffect, useState } from 'react';
import { 
  Share2, Trophy, User, ShieldCheck, QrCode,
  Flame, Lock, CreditCard, Crown, CheckCircle2, Instagram 
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
  
  // Поля профиля
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

      const cleanInsta = instaHandle.replace('@', '').trim();

      const res = await fetch(`${supabaseUrl}/functions/v1/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || (supabase as any).supabaseKey}`
        },
        body: JSON.stringify({
          telegram_id: tgUser.id,
          full_name: fullName.trim(),
          instagram: cleanInsta
        })
      });

      const result = await res.json();

      // ГАРАНТИРОВАННОЕ ОБНОВЛЕНИЕ ОЧКОВ И ШКАЛЫ
      if (result.points_earned > 0) {
        setPoints(prev => prev + result.points_earned);
        setXpNotify({ show: true, msg: `+${result.points_earned} XP EARNED! ✨` });
        setTimeout(() => setXpNotify({ show: false, msg: '' }), 4000);
      }

      if (fullName.trim()) setIsNameFilled(true);
      if (cleanInsta) setIsInstaFilled(true);

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

  // 🎯 Имя: приоритет ручному вводу, затем Телеграм
  const displayName = fullName || tgUser?.first_name || tgUser?.username || 'Guest';
  
  // 🎯 Подзаголовок: приоритет Instagram с собачкой, если нет — ник ТГ
  const displaySub = instaHandle ? `@${instaHandle.replace('@', '')}` : (tgUser?.username ? `@${tgUser.username}` : 'unknown');

  // Проверяем, заполнено ли всё, чтобы скрыть блок ввода
  const isProfileComplete = isNameFilled && isInstaFilled;

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
        
       {/* 1. ШАПКА: АВАТАРКА, ИМЯ И ИНСТАГРАМ */}
        <div className="pt-4 flex flex-col items-center justify-center text-center animate-fade-up">
          {photoUrl ? (
            <img src={photoUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white mb-4" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#A50021] flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white mb-4">
              {displayName.charAt(0)}
            </div>
          )}
          <h2 className="text-zinc-900 font-headline font-bold text-2xl tracking-tight leading-none">{displayName}</h2>
          
          {/* ✅ ИСПРАВЛЕНО: Теперь выводятся ОБА никнейма в одну аккуратную строку */}
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-zinc-500 text-sm font-medium mt-1.5">
            <span>tg: @{tgUser?.username || 'unknown'}</span>
            
            {isInstaFilled && (
              <>
                <span className="text-zinc-300">•</span>
                <div className="flex items-center gap-1">
                  <Instagram size={14} className="text-[#A50021]" />
                  <span>@{instaHandle.replace('@', '')}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 2. ЗАПОЛНЕНИЕ ПРОФИЛЯ (ИСЧЕЗАЕТ, ЕСЛИ ВСЁ ЗАПОЛНЕНО) */}
        {!isProfileComplete && (
          <section className="bg-white rounded-[2rem] p-6 border border-zinc-100 shadow-sm space-y-4 animate-fade-up delay-75">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Complete Your Profile</h3>
              <button 
                onClick={handleSaveProfile}
                disabled={saveLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-zinc-200"
              >
                {saveLoading ? '...' : 'Save'}
              </button>
            </div>

            <div className="space-y-3">
              {/* Поле имени (скрывается индивидуально, если заполнено) */}
              {!isNameFilled && (
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Enter Name & Surname"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-zinc-900 focus:outline-none focus:border-[#A50021]/30 transition-all pr-24"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="text-[9px] font-black bg-zinc-900 text-[#A50021] px-2 py-1 rounded-lg border border-[#A50021]/30 animate-pulse">
                      +500 XP ✨
                    </span>
                  </div>
                </div>
              )}

              {/* Поле Instagram (скрывается индивидуально, если заполнено) */}
              {!isInstaFilled && (
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="@your_instagram"
                    value={instaHandle.startsWith('@') || !instaHandle ? instaHandle : `@${instaHandle}`}
                    onChange={(e) => setInstaHandle(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-zinc-900 focus:outline-none focus:border-[#A50021]/30 transition-all pr-24"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="text-[9px] font-black bg-zinc-900 text-[#A50021] px-2 py-1 rounded-lg border border-[#A50021]/30 animate-pulse">
                      +500 XP ✨
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ✅ КНОПКА ВХОДА В АДМИН-ПАНЕЛЬ */}
          {(userRole === 'admin' || userRole === 'promoter' || userRole === 'hostess' || userRole === 'scanner') && (
            <section className="w-full mt-6 animate-fade-up">
              <button 
                onClick={() => onNavigate('admin')} 
                className="w-full bg-zinc-900 text-white p-5 rounded-[2rem] flex items-center justify-between active:scale-[0.98] transition-all shadow-lg shadow-zinc-900/20 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 11h10"/><path d="M7 15h10"/><path d="M7 7h10"/></svg>
                  </div>
                  <div className="text-left">
                    <p className="text-white font-headline font-black text-base tracking-tight uppercase">Admin Panel</p>
                    <p className="text-white/60 text-xs font-medium mt-0.5">Codes, stats & tools</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#A50021] transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </div>
              </button>
            </section>
          )}
        
        {/* 3. ШКАЛА УРОВНЯ */}
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
              
              <div className="flex justify-between items-center pt-1">
                <span className="text-[9px] font-bold text-[#A50021] tracking-wide bg-[#A50021]/10 px-2 py-0.5 rounded-md">
                  ✨ Get 10,000 XP for Auto-VIP
                </span>
                <p className="text-zinc-500 text-[10px] font-medium">
                  {isMaxLevel ? 'Maximum level reached!' : `${pointsToNextLevel} XP left to Level ${currentLevel + 1}`}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. КАРТА VIP-КЛУБА */}
        <section className="animate-fade-up delay-125">
          {isMaxLevel ? (
            <div className="bg-gradient-to-br from-zinc-900 to-[#A50021]/30 rounded-[2rem] p-6 border border-[#A50021]/50 relative overflow-hidden shadow-[0_10px_30px_rgba(165,0,33,0.2)]">
              <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none">
                <Crown size={100} className="text-white" />
              </div>
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 bg-[#A50021] rounded-xl flex items-center justify-center shadow-lg shadow-[#A50021]/40 border border-[#A50021]">
                  <CreditCard className="text-white w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-headline font-bold text-white text-lg tracking-tight">Kyrios VIP Membership</h4>
                  <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mt-1">Status: Active · Unlimited Perks</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-white to-zinc-50/50 rounded-[2rem] p-6 border border-zinc-200/60 shadow-sm relative overflow-hidden flex gap-5 items-start">
              <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center border border-zinc-200 shrink-0 mt-0.5">
                <Lock className="text-zinc-400 w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-headline font-bold text-zinc-900 text-base flex items-center gap-1.5">
                  Kyrios VIP Card
                  <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">Locked</span>
                </h4>
                <p className="text-zinc-500 text-xs leading-relaxed font-medium">
                  Unlock Level 10 to activate your VIP membership: exclusive token rewards, free access to selected events, and priority guestlist slots.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* 5. СПИСОК ЗАДАНИЙ */}
        <section className="space-y-4 animate-fade-up delay-150">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">How to Earn XP</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                  <Share2 className="text-blue-500 w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 text-xs">Invite a Friend</h4>
                  <p className="text-blue-500 font-bold text-[10px] mt-0.5">+500 XP</p>
                </div>
              </div>
              <button onClick={handleInvite} className="px-4 py-2 bg-zinc-900 text-white font-bold text-[10px] uppercase rounded-xl active:scale-95 transition-all">Share</button>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                  <QrCode className="text-emerald-500 w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 text-xs">Attend an Event</h4>
                  <p className="text-emerald-500 font-bold text-[10px] mt-0.5">+250 XP</p>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-zinc-100 text-zinc-400 font-bold text-[9px] uppercase tracking-wider rounded-lg">Auto</div>
            </div>
          </div>
        </section>

        {/* АДМИН ПАНЕЛЬ */}
        {(userRole === 'admin' || userRole === 'hostess' || userRole === 'scanner') && (
          <section className="space-y-4 animate-fade-up delay-200">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 ml-2">Admin Panel</h3>
            <button onClick={() => onNavigate('admin')} className="w-full bg-white border border-zinc-100 p-5 rounded-[2rem] flex items-center justify-between active:scale-[0.98] transition-all shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-900 border border-zinc-100"><User size={24} /></div>
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
