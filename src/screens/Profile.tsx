import { useEffect, useState } from 'react';
import { 
  Share2, Trophy, User, ShieldCheck, QrCode,
  Flame, Lock, CreditCard, Crown, Instagram 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Screen } from '../App';
import { supabase } from '../lib/supabaseClient';

interface ProfileProps {
  onNavigate: (screen: Screen) => void;
  userRole: string | null;
}

export default function Profile({ onNavigate, userRole }: ProfileProps) {
  const { t } = useTranslation();
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const photoUrl = tgUser?.photo_url;

  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  
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

  // Levels algorithm
  const POINTS_PER_LEVEL = 1000;
  const MAX_LEVEL = 10;
  const calculatedLevel = Math.floor(points / POINTS_PER_LEVEL) + 1;
  const currentLevel = Math.min(calculatedLevel, MAX_LEVEL);
  const isMaxLevel = currentLevel === MAX_LEVEL;
  const pointsInCurrentLevel = isMaxLevel ? POINTS_PER_LEVEL : points % POINTS_PER_LEVEL;
  const progressPercentage = isMaxLevel ? 100 : Math.min(100, (pointsInCurrentLevel / POINTS_PER_LEVEL) * 100);
  const pointsToNextLevel = isMaxLevel ? 0 : POINTS_PER_LEVEL - pointsInCurrentLevel;

  const getRankName = (lvl: number) => {
    if (lvl <= 2) return t('profile_screen.rank_dancer');
    if (lvl <= 4) return t('profile_screen.rank_insider');
    if (lvl <= 7) return t('profile_screen.rank_headliner');
    if (lvl <= 9) return t('profile_screen.rank_legend');
    return t('profile_screen.rank_vip');
  };

  const displayName = fullName || tgUser?.first_name || tgUser?.username || 'Guest';
  const isProfileComplete = isNameFilled && isInstaFilled;

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="w-full sticky top-0 z-50 bg-surface-variant/70 backdrop-blur-xl flex items-center justify-center px-6 pt-6 pb-2 border-b border-outline-variant/30">
        <img src="/logo.png" alt="Kyrios Logo" className="h-[55px] w-auto object-contain dark:invert" />
      </header>

      {xpNotify.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 text-white px-6 py-3 rounded-2xl shadow-2xl border border-[#A50021] animate-in slide-in-from-top-10 duration-300">
          <p className="font-headline font-black text-sm tracking-widest text-[#A50021]">{xpNotify.msg}</p>
        </div>
      )}

      <main className="px-6 py-4 space-y-6 overflow-x-hidden">
        
        {/* 1. ШАПКА: АВАТАРКА, ИМЯ И ИНСТАГРАМ */}
        <div className="pt-4 flex flex-col items-center justify-center text-center animate-fade-up">
          {photoUrl ? (
            <img src={photoUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-surface mb-4" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#A50021] flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-surface mb-4">
              {displayName.charAt(0)}
            </div>
          )}
          <h2 className="text-on-surface font-headline font-bold text-2xl tracking-tight leading-none">{displayName}</h2>
          
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-on-surface-variant text-sm font-medium mt-1.5">
            <span>tg: @{tgUser?.username || 'unknown'}</span>
            
            {isInstaFilled && (
              <>
                <span className="text-on-surface-variant/50">•</span>
                <div className="flex items-center gap-1">
                  <Instagram size={14} className="text-[#A50021]" />
                  <span>@{instaHandle.replace('@', '')}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 2. ЗАПОЛНЕНИЕ ПРОФИЛЯ */}
        {!isProfileComplete && (
          <section className="bg-surface rounded-[2rem] p-6 border border-outline-variant/40 shadow-sm space-y-4 animate-fade-up delay-75">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">{t('profile_screen.complete_profile')}</h3>
              <button 
                onClick={handleSaveProfile}
                disabled={saveLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-on-primary rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-zinc-200 dark:shadow-black/30"
              >
                {saveLoading ? '...' : t('profile_screen.save')}
              </button>
            </div>

            <div className="space-y-3">
              {!isNameFilled && (
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder={t('profile_screen.name_placeholder')}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/40 rounded-2xl px-5 py-3.5 text-sm font-bold text-on-surface focus:outline-none focus:border-[#A50021]/30 transition-all pr-24"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="text-[9px] font-black bg-zinc-900 text-[#A50021] px-2 py-1 rounded-lg border border-[#A50021]/30 animate-pulse">
                      +500 XP ✨
                    </span>
                  </div>
                </div>
              )}

              {!isInstaFilled && (
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder={t('profile_screen.instagram_placeholder')}
                    value={instaHandle.startsWith('@') || !instaHandle ? instaHandle : `@${instaHandle}`}
                    onChange={(e) => setInstaHandle(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/40 rounded-2xl px-5 py-3.5 text-sm font-bold text-on-surface focus:outline-none focus:border-[#A50021]/30 transition-all pr-24"
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

        {/* ✅ 3. КНОПКА ВХОДА В НОВУЮ АДМИН-ПАНЕЛЬ (карточка намеренно всегда тёмная — акцентный блок) */}
        {(userRole === 'admin' || userRole === 'promoter' || userRole === 'hostess' || userRole === 'scanner') && (
          <section className="w-full animate-fade-up">
            <button 
              onClick={() => onNavigate('admin-panel')} 
              className="w-full bg-zinc-900 text-white p-5 rounded-[2rem] flex items-center justify-between active:scale-[0.98] transition-all shadow-lg shadow-zinc-900/20 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 11h10"/><path d="M7 15h10"/><path d="M7 7h10"/></svg>
                </div>
                <div className="text-left">
                  <p className="text-white font-headline font-black text-base tracking-tight uppercase">{t('profile_screen.admin_panel')}</p>
                  <p className="text-white/60 text-xs font-medium mt-0.5">{t('profile_screen.admin_panel_desc')}</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#A50021] transition-colors duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </div>
            </button>
          </section>
        )}

        {/* 4. ШКАЛА УРОВНЯ (карточка намеренно всегда тёмная — акцентный блок с прогресс-баром) */}
        <section className="bg-zinc-900 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden animate-fade-up delay-100 border border-zinc-800">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Trophy size={100} className="text-[#A50021]" />
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-[#A50021] text-[10px] font-bold uppercase tracking-widest mb-1">{t('profile_screen.current_rank')}</p>
                <h3 className="text-white font-headline font-black text-3xl tracking-tight">
                  {getRankName(currentLevel)} <span className="text-zinc-500 text-xl font-medium">{t('profile_screen.level_short')} {currentLevel}</span>
                </h3>
              </div>
              {streak > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-xl">
                  <Flame size={14} className="text-orange-500" />
                  <span className="text-orange-500 font-bold text-xs">{streak} {t('profile_screen.streak')}</span>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">{t('profile_screen.progress')}</span>
                <span className="text-white font-bold text-sm">
                  {isMaxLevel ? t('profile_screen.max') : pointsInCurrentLevel} <span className="text-zinc-500 font-normal">/ {POINTS_PER_LEVEL} XP</span>
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
                  ✨ {t('profile_screen.auto_vip_hint')}
                </span>
                <p className="text-zinc-500 text-[10px] font-medium">
                  {isMaxLevel ? t('profile_screen.max_level_reached') : t('profile_screen.xp_left_to_level', { xp: pointsToNextLevel, level: currentLevel + 1 })}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. КАРТА VIP-КЛУБА */}
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
                  <h4 className="font-headline font-bold text-white text-lg tracking-tight">{t('profile_screen.vip_membership')}</h4>
                  <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mt-1">{t('profile_screen.vip_status_active')}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-surface to-surface-container/50 rounded-[2rem] p-6 border border-outline-variant/40 shadow-sm relative overflow-hidden flex gap-5 items-start">
              <div className="w-12 h-12 bg-surface-container rounded-2xl flex items-center justify-center border border-outline-variant/40 shrink-0 mt-0.5">
                <Lock className="text-on-surface-variant/60 w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-headline font-bold text-on-surface text-base flex items-center gap-1.5">
                  {t('profile_screen.vip_card')}
                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">{t('profile_screen.locked')}</span>
                </h4>
                <p className="text-on-surface-variant text-xs leading-relaxed font-medium">
                  {t('profile_screen.vip_card_desc')}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* 6. СПИСОК ЗАДАНИЙ */}
        <section className="space-y-4 animate-fade-up delay-150">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60">{t('profile_screen.how_to_earn_xp')}</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-surface rounded-2xl p-4 border border-outline-variant/40 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/30">
                  <Share2 className="text-blue-500 dark:text-blue-400 w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-on-surface text-xs">{t('profile_screen.invite_friend')}</h4>
                  <p className="text-blue-500 dark:text-blue-400 font-bold text-[10px] mt-0.5">+500 XP</p>
                </div>
              </div>
              <button onClick={handleInvite} className="px-4 py-2 bg-primary text-on-primary font-bold text-[10px] uppercase rounded-xl active:scale-95 transition-all">{t('profile_screen.share')}</button>
            </div>

            <div className="bg-surface rounded-2xl p-4 border border-outline-variant/40 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/30">
                  <QrCode className="text-emerald-500 dark:text-emerald-400 w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-on-surface text-xs">{t('profile_screen.attend_event')}</h4>
                  <p className="text-emerald-500 dark:text-emerald-400 font-bold text-[10px] mt-0.5">+250 XP</p>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-surface-container text-on-surface-variant/70 font-bold text-[9px] uppercase tracking-wider rounded-lg">{t('profile_screen.auto')}</div>
            </div>
          </div>
        </section>

        {/* ✅ 7. ОТДЕЛЬНАЯ КНОПКА ДЛЯ СТАРОГО СКАНЕРА БИЛЕТОВ (Только для admin/hostess/scanner) */}
        {(userRole === 'admin' || userRole === 'hostess' || userRole === 'scanner') && (
          <section className="space-y-4 animate-fade-up delay-200">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60 ml-2">{t('profile_screen.access_control')}</h3>
            <button onClick={() => onNavigate('admin')} className="w-full bg-surface border border-outline-variant/40 p-5 rounded-[2rem] flex items-center justify-between active:scale-[0.98] transition-all shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface border border-outline-variant/40"><User size={24} /></div>
                <div className="text-left">
                  <p className="text-on-surface font-bold text-base tracking-tight">{t('profile_screen.ticket_scanner')}</p>
                  <p className="text-on-surface-variant/70 text-xs font-medium mt-0.5">{t('profile_screen.ticket_scanner_desc')}</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center"><ShieldCheck className="text-on-surface w-5 h-5" /></div>
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
