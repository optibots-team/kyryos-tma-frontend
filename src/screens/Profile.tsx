import { useEffect, useState } from 'react';
import { Share2, Zap, QrCode, Trophy, User } from 'lucide-react';
import { Screen } from '../App';
import { supabase } from '../lib/supabaseClient';

export default function Profile({ onNavigate, userRole }: { onNavigate: (s: Screen) => void, userRole: string | null }) {
  const [points, setPoints] = useState(0);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    async function fetchUserData() {
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      if (tgUser?.id) {
        // Подтягиваем поинты и данные из базы
        const { data } = await supabase
          .from('users')
          .select('points, first_name, last_name, username')
          .eq('telegram_id', tgUser.id)
          .single();
        
        if (data) {
          setPoints(data.points || 0);
          setProfileData({ ...tgUser, ...data });
        } else {
          setProfileData(tgUser);
        }
      }
    }
    fetchUserData();
  }, []);

  // Логика уровней (1000 points = 1 level)
  const POINTS_PER_LEVEL = 1000;
  const currentLevel = Math.floor(points / POINTS_PER_LEVEL) + 1;
  const pointsInCurrentLevel = points % POINTS_PER_LEVEL;
  const progressPercentage = Math.min(100, (pointsInCurrentLevel / POINTS_PER_LEVEL) * 100);
  const pointsToNextLevel = POINTS_PER_LEVEL - pointsInCurrentLevel;

  // Названия рангов для атмосферы
  const getRankName = (lvl: number) => {
    if (lvl === 1) return "Raver";
    if (lvl === 2) return "Insider";
    if (lvl === 3) return "Headliner";
    if (lvl === 4) return "Legend";
    return "Kyrios";
  };

  const handleInvite = () => {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (!tgUser?.id) return;

    // ВАЖНО: Замени на юзернейм своего бота
    const BOT_USERNAME = "roar_party_bot"; 
    const inviteLink = `https://t.me/${kyrios_events_bot}?start=ref_${tgUser.id}`;
    
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

      <main className="px-6 py-8 space-y-8">
        {/* Хедер профиля */}
        <section className="flex items-center gap-4 animate-fade-up">
          <div className="w-16 h-16 rounded-full bg-zinc-200 overflow-hidden shadow-inner border-2 border-white flex-shrink-0">
            {profileData?.photo_url ? (
              <img src={profileData.photo_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-[#D4AF37]">
                <User size={32} />
              </div>
            )}
          </div>
          <div>
            <h2 className="font-headline font-extrabold text-2xl text-zinc-900 tracking-tight">
              {profileData?.first_name || 'Guest'} {profileData?.last_name || ''}
            </h2>
            <p className="text-zinc-500 font-medium text-sm">
              @{profileData?.username || 'username'}
            </p>
          </div>
        </section>

        {/* ШКАЛА УРОВНЯ (Gamification Card) */}
        <section className="bg-zinc-900 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden animate-fade-up delay-100 border border-zinc-800">
          <div className="absolute top-0 right-0 p-6 opacity-10">
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

            {/* Attend Event Card (Info only) */}
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

            {/* Early Bird Card (Info only) */}
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

        {/* ADMIN PANEL BUTTON (Показываем только если роль admin/scanner) */}
        {(userRole === 'admin' || userRole === 'scanner') && (
          <section className="pt-4 animate-fade-up delay-300">
            <button 
              onClick={() => onNavigate('admin')}
              className="w-full py-4 bg-zinc-900 text-white font-headline font-bold text-sm rounded-xl shadow-lg active:scale-95 transition-all border border-zinc-800"
            >
              OPEN SCANNER PANEL
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
