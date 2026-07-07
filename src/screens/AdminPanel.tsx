import { useEffect, useState, useRef } from 'react';
import { 
  ArrowLeft, QrCode, BarChart3, Users, Radio, Activity,
  PlusCircle, RefreshCw, Share2, Save, AlertTriangle, CheckCircle2,
  UserX, UserCheck, Send, Image, Flame, Clock
} from 'lucide-react';
import { Screen } from '../App';

interface AdminPanelProps {
  onNavigate: (s: Screen) => void;
  userRole: string | null; // Роль, переданная сверху (App.tsx)
}

// === СТРУКТУРЫ ДАННЫХ КОНТРАКТА ===
interface EventItem { id: string; title: string; event_date: string; is_upcoming?: boolean; }
interface CodeItem { code: string; used_count: number; guest_name: string; guest_instagram: string; }
interface BroadcastJob { id: string; message_text: string; status: string; total_recipients: number; created_at: string; }
interface UserItem { id: string; telegram_id: string; username: string; first_name: string; last_name: string; role: string; is_blacklisted: boolean; }

interface LiveData {
  total_issued: number; total_scanned: number; remaining: number; conversion: number;
  hourly: Array<{ hour: string; count: number }>;
  recent_scans: Array<{ ticket_code: string; scanned_at: string; username: string; first_name: string }>;
  updated_at: string;
}

export default function AdminPanel({ onNavigate, userRole: initialRole }: AdminPanelProps) {
  const initData = window.Telegram?.WebApp?.initData || '';
  const BASE_URL = 'https://uuxgtpzfxymhyekeuryf.supabase.co/functions/v1/admin-api';

  // Динамическое определение роли из контракта (fallbacks на пропс)
  const [role, setRole] = useState<string | null>(initialRole);
  const [activeTab, setActiveTab] = useState<'codes' | 'stats' | 'users' | 'broadcast' | 'live'>('codes');
  const [loading, setLoading] = useState(false);

  // Системные уведомления
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Списки событий
  const [activeEvents, setActiveEvents] = useState<EventItem[]>([]);
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  
  // Выбранные ID событий
  const [selectedActiveEventId, setSelectedActiveEventId] = useState<string>('');
  const [selectedStatsEventId, setSelectedStatsEventId] = useState<string>('');
  const [selectedLiveEventId, setSelectedLiveEventId] = useState<string>('');

  // === ТАБ: CODES ===
  const [generateCount, setGenerateCount] = useState<number>(10);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [myCodesList, setMyCodesList] = useState<CodeItem[]>([]);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [tempGuestName, setTempGuestName] = useState('');
  const [tempGuestInstagram, setTempGuestInstagram] = useState('');

  // === ТАБ: STATS ===
  const [detailedStats, setDetailedStats] = useState<any>(null);

  // === ТАБ: USERS ===
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // === ТАБ: BROADCAST ===
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastImg, setBroadcastImg] = useState('');
  const [audienceType, setAudienceType] = useState<'all' | 'event_buyers' | 'selected'>('all');
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastJob[]>([]);
  const [workerProgress, setWorkerProgress] = useState<{ current: number; total: number } | null>(null);

  // === ТАБ: LIVE DASHBOARD ===
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const livePollingRef = useRef<NodeJS.Timeout | null>(null);

  // Права доступа на основе ролей контракта
  const isAdmin = role === 'admin';
  const isPromoter = role === 'promoter';
  const isHostess = role === 'hostess';

  // Автоматический запрос роли и базовых данных
  useEffect(() => {
    async function initPanel() {
      await fetchCurrentRole();
      fetchActiveEvents();
    }
    initPanel();
  }, []);

  // Переключение табов и запуск зависимых процессов
  useEffect(() => {
    // Чистим полинг Live таба, если ушли с него
    if (activeTab !== 'live' && livePollingRef.current) {
      clearInterval(livePollingRef.current);
    }

    if (activeTab === 'codes' && selectedActiveEventId) fetchCodesData();
    if (activeTab === 'stats') fetchAllStatsEvents();
    if (activeTab === 'users') fetchUsersList();
    if (activeTab === 'broadcast') fetchBroadcastHistory();
    if (activeTab === 'live' && selectedLiveEventId) startLivePolling(selectedLiveEventId);
  }, [activeTab, selectedActiveEventId, selectedStatsEventId, selectedLiveEventId]);

  // === ЯДРО API ===
  const apiRequest = async (action: string, payload: Record<string, any> = {}) => {
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, init_data: initData, ...payload })
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || `Error ${res.status}: Request failed`);
      }
      return data;
    } catch (err: any) {
      showError(err.message);
      throw err;
    }
  };

  const showError = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(null), 6000); };
  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 4000); };

  // === СИСТЕМНЫЕ ЗАПРОСЫ ===
  const fetchCurrentRole = async () => {
    try {
      const data = await apiRequest('get_role');
      if (data.role) setRole(data.role);
    } catch (e) { console.error("Failed to sync role", e); }
  };

  const fetchActiveEvents = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('list_events');
      if (data.events?.length > 0) {
        setActiveEvents(data.events);
        setSelectedActiveEventId(data.events[0].id);
        setSelectedLiveEventId(data.events[0].id);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // === ТАБ: CODES ЛОГИКА ===
  const fetchCodesData = async () => {
    if (!selectedActiveEventId) return;
    setLoading(true);
    try {
      const data = await apiRequest('my_codes', { event_id: selectedActiveEventId });
      setMyCodesList(data.codes || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    if (!selectedActiveEventId) return;
    setLoading(true);
    setGeneratedCodes([]);
    try {
      const data = await apiRequest('generate_codes', { event_id: selectedActiveEventId, count: generateCount });
      if (data.codes) {
        setGeneratedCodes(data.codes);
        showSuccess(`Generated ${data.count} codes!`);
        fetchCodesData();
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSaveGuest = async (code: string) => {
    try {
      await apiRequest('update_guest', {
        code,
        guest_name: tempGuestName.trim(),
        guest_instagram: tempGuestInstagram.replace('@', '').trim()
      });
      setMyCodesList(prev => prev.map(item => item.code === code ? { ...item, guest_name: tempGuestName, guest_instagram: tempGuestInstagram } : item));
      setEditingRow(null);
      showSuccess("Saved!");
    } catch (e) { console.error(e); }
  };

  // === ТАБ: STATS ЛОГИКА ===
  const fetchAllStatsEvents = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('list_all_events');
      if (data.events?.length > 0) {
        setAllEvents(data.events);
        if (!selectedStatsEventId) {
          setSelectedStatsEventId(data.events[0].id);
        } else {
          fetchDetailedStats(selectedStatsEventId);
        }
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchDetailedStats = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await apiRequest('event_stats', { event_id: id });
      setDetailedStats(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // === ТАБ: USERS ЛОГИКА ===
  const fetchUsersList = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('list_users', { search: userSearch });
      setUsersList(data.users || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleToggleBlacklist = async (tgId: string, currentStatus: boolean) => {
    try {
      await apiRequest('toggle_blacklist', { telegram_id: tgId, is_blacklisted: !currentStatus });
      setUsersList(prev => prev.map(u => u.telegram_id === tgId ? { ...u, is_blacklisted: !currentStatus } : u));
      showSuccess("User security status updated");
    } catch (e) { console.error(e); }
  };

  // === ТАБ: BROADCAST ЛОГИКА ===
  const fetchBroadcastHistory = async () => {
    try {
      const data = await apiRequest('list_broadcasts');
      setBroadcastHistory(data.jobs || []);
    } catch (e) { console.error(e); }
  };

  const handleBroadcast = async (isTest: boolean) => {
    if (!broadcastText.trim()) return showError("Message text cannot be empty");
    setLoading(true);
    try {
      const payload: Record<string, any> = {
        message_text: broadcastText,
        audience_type: audienceType,
        ...(broadcastImg && { image_url: broadcastImg })
      };

      if (isTest) {
        payload.test_only = true;
        await apiRequest('create_broadcast', payload);
        showSuccess("Test broadcast sent to you successfully!");
      } else {
        const data = await apiRequest('create_broadcast', payload);
        if (data.job_id) {
          showSuccess(`Job created for ${data.total_recipients} recipients. Initializing pipeline...`);
          setBroadcastText('');
          setBroadcastImg('');
          // Запускаем реактивный воркер батчей
          processJob(data.job_id);
        }
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const processJob = async (jobId: string) => {
    try {
      const res = await fetch(`https://uuxgtpzfxymhyekeuryf.supabase.co/functions/v1/broadcast-worker?key=kyrios2024admin&job_id=${jobId}`);
      const data = await res.json();
      
      setWorkerProgress({ current: data.total_sent, total: data.total });

      if (!data.done) {
        // Рекурсивный моментальный вызов без блокирования UI тайм-аутами
        return processJob(jobId);
      } else {
        showSuccess(`Broadcast complete! Sent: ${data.total_sent}, Failed: ${data.total_failed}`);
        setWorkerProgress(null);
        fetchBroadcastHistory();
      }
    } catch (err: any) {
      showError(`Worker pipeline failed: ${err.message}`);
      setWorkerProgress(null);
    }
  };

  // === ТАБ: LIVE DASHBOARD POLLING ===
  const startLivePolling = (eventId: string) => {
    if (livePollingRef.current) clearInterval(livePollingRef.current);

    const tick = async () => {
      try {
        const res = await fetch(`${BASE_URL}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'live_dashboard', init_data: initData, event_id: eventId })
        });
        const data = await res.json();
        if (data && data.success !== false) setLiveData(data);
      } catch (e) { console.error("Polling fault", e); }
    };

    tick(); // Первый моментальный запуск
    livePollingRef.current = setInterval(tick, 7000); // Интервал обновления 7 секунд
  };

  useEffect(() => {
    return () => { if (livePollingRef.current) clearInterval(livePollingRef.current); };
  }, []);

  const handleShareCode = (code: string) => {
    const activeEvent = activeEvents.find(e => e.id === selectedActiveEventId);
    const text = `Твой промокод на ${activeEvent?.title || 'Kyrios Event'}: ${code}\nВведи его в приложении: https://t.me/kyrios_events_bot/app`;
    window.Telegram?.WebApp?.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent('https://t.me/kyrios_events_bot/app')}&text=${encodeURIComponent(text)}`);
  };

  const openTgUser = (username: string) => {
    if (username) window.Telegram?.WebApp?.openTelegramLink(`https://t.me/${username.replace('@', '')}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32 select-none text-zinc-900 font-sans">
      {/* HEADER */}
      <header className="w-full sticky top-0 z-50 bg-zinc-300/80 backdrop-blur-xl flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-400/20">
        <button onClick={() => onNavigate('profile')} className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-zinc-200 active:scale-95 transition-all">
          <ArrowLeft size={18} className="text-zinc-700" />
        </button>
        <h1 className="font-black text-sm uppercase tracking-wider text-zinc-900">
          Terminal : <span className="text-red-700 font-mono">{role || 'Syncing'}</span>
        </h1>
        <button onClick={handleManualRefresh} className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-zinc-200 active:scale-95 transition-all">
          <RefreshCw size={16} className={`text-zinc-700 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* ALERTS */}
      {errorMsg && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 animate-bounce">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p className="text-xs font-black leading-relaxed">{errorMsg}</p>
        </div>
      )}
      {successMsg && (
        <div className="mx-6 mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-800">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          <p className="text-xs font-bold leading-relaxed">{successMsg}</p>
        </div>
      )}

      {/* WORKER PROGRESS STREAM */}
      {workerProgress && (
        <div className="mx-6 mt-4 p-4 bg-zinc-900 text-white rounded-2xl space-y-2">
          <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-400">
            <span>Pipeline Broadcasting Arrays</span>
            <span>{Math.round((workerProgress.current / workerProgress.total) * 100)}%</span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div className="bg-red-600 h-full transition-all duration-300" style={{ width: `${(workerProgress.current / workerProgress.total) * 100}%` }} />
          </div>
          <p className="text-[10px] font-mono text-center text-zinc-500">{workerProgress.current} / {workerProgress.total} profiles arrayed.</p>
        </div>
      )}

      {/* ТАБ БАР ВЕРХНЕГО СЕГМЕНТА */}
      <nav className="px-6 pt-6 flex gap-1 overflow-x-auto no-scrollbar">
        {(!isHostess) && (
          <button onClick={() => setActiveTab('codes')} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shrink-0 transition-all ${activeTab === 'codes' ? 'bg-zinc-900 text-white shadow-md' : 'bg-white border border-zinc-200 text-zinc-500'}`}>
            <QrCode size={14} /> Codes
          </button>
        )}
        {(!isHostess) && (
          <button onClick={() => setActiveTab('stats')} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shrink-0 transition-all ${activeTab === 'stats' ? 'bg-zinc-900 text-white shadow-md' : 'bg-white border border-zinc-200 text-zinc-500'}`}>
            <BarChart3 size={14} /> Stats
          </button>
        )}
        {isAdmin && (
          <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shrink-0 transition-all ${activeTab === 'users' ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-zinc-500'}`}>
            <Users size={14} /> Users
          </button>
        )}
        {isAdmin && (
          <button onClick={() => setActiveTab('broadcast')} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shrink-0 transition-all ${activeTab === 'broadcast' ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-zinc-500'}`}>
            <Radio size={14} /> Broadcast
          </button>
        )}
        {(isAdmin || isPromoter || isHostess) && (
          <button onClick={() => setActiveTab('live')} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shrink-0 transition-all ${activeTab === 'live' ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-zinc-500'}`}>
            <Activity size={14} /> Live Terminal
          </button>
        )}
      </nav>

      {/* MAIN LAYOUT */}
      <main className="px-6 py-6 space-y-6">
        
        {/* TAB: CODES */}
        {activeTab === 'codes' && !isHostess && (
          <div className="space-y-6">
            <section className="bg-white rounded-[2rem] p-6 border border-zinc-200 shadow-sm space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Active Pool Registry</h3>
              <select value={selectedActiveEventId} onChange={(e) => setSelectedActiveEventId(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-sm font-black text-zinc-900 focus:outline-none">
                {activeEvents.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
              
              <div className="flex gap-3 pt-2">
                <input type="number" min="1" max="500" value={generateCount} onChange={(e) => setGenerateCount(Number(e.target.value))} className="w-1/3 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 text-center font-black text-sm" />
                <button onClick={handleGenerate} disabled={loading || !selectedActiveEventId} className="flex-1 bg-[#A50021] text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest active:scale-[0.98] transition-all disabled:opacity-50">
                  <PlusCircle size={16} /> Generate Array
                </button>
              </div>

              {generatedCodes.length > 0 && (
                <div className="pt-3 border-t border-zinc-100 flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {generatedCodes.map((c, i) => (
                    <span key={i} className="text-[9px] font-mono font-black px-2 py-0.5 bg-zinc-900 text-white rounded">{c}</span>
                  ))}
                </div>
              )}
            </section>

            {/* ТАБЛИЦА СВОИХ КОДОВ */}
            <section className="bg-white rounded-[2rem] p-6 border border-zinc-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">My Pool Allocations</h3>
                <span className="text-[10px] font-black bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-full">Size: {myCodesList.length}</span>
              </div>
              <div className="overflow-x-auto -mx-6 px-6 no-scrollbar">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      <th className="pb-3 font-medium">Code</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Guest Identity</th>
                      <th className="pb-3 font-medium">Instagram</th>
                      <th className="pb-3 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 text-xs font-bold">
                    {myCodesList.map((row) => {
                      const isEditing = editingRow === row.code;
                      return (
                        <tr key={row.code} className="hover:bg-zinc-50/40">
                          <td className="py-3.5 font-mono font-black text-sm text-zinc-950">{row.code}</td>
                          <td className="py-3.5">
                            {row.used_count > 0 ? (
                              <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-md uppercase font-black">Used</span>
                            ) : (
                              <span className="text-[9px] bg-zinc-100 text-zinc-400 px-2 py-0.5 rounded-md uppercase">Idle</span>
                            )}
                          </td>
                          <td className="py-3.5">
                            {isEditing ? (
                              <input type="text" value={tempGuestName} onChange={(e) => setTempGuestName(e.target.value)} className="bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-xs w-28" />
                            ) : (
                              <span onClick={() => { setEditingRow(row.code); setTempGuestName(row.guest_name || ''); setTempGuestInstagram(row.guest_instagram || ''); }} className="border-b border-dashed border-zinc-300 cursor-pointer block text-zinc-700">{row.guest_name || '—'}</span>
                            )}
                          </td>
                          <td className="py-3.5">
                            {isEditing ? (
                              <input type="text" value={tempGuestInstagram} onChange={(e) => setTempGuestInstagram(e.target.value)} className="bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-xs w-24" />
                            ) : (
                              <span onClick={() => { setEditingRow(row.code); setTempGuestName(row.guest_name || ''); setTempGuestInstagram(row.guest_instagram || ''); }} className="border-b border-dashed border-zinc-300 cursor-pointer block text-zinc-500">{row.guest_instagram ? `@${row.guest_instagram}` : '—'}</span>
                            )}
                          </td>
                          <td className="py-3.5 text-right">
                            {isEditing ? (
                              <button onClick={() => handleSaveGuest(row.code)} className="p-2 bg-zinc-900 text-white rounded-lg"><Save size={12} /></button>
                            ) : (
                              <button onClick={() => handleShareCode(row.code)} className="p-2 bg-zinc-100 text-zinc-600 rounded-lg"><Share2 size={12} /></button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* TAB: STATS */}
        {activeTab === 'stats' && !isHostess && (
          <div className="space-y-6">
            <section className="bg-white rounded-[2rem] p-6 border border-zinc-200 shadow-sm space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block px-1">View Stats Event</label>
              <select value={selectedStatsEventId} onChange={(e) => { setSelectedStatsEventId(e.target.value); fetchDetailedStats(e.target.value); }} className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-4 text-sm font-black text-zinc-900 focus:outline-none">
                {allEvents.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} {ev.is_upcoming ? '🔥 [Upcoming]' : '⏳ [Past]'}
                  </option>
                ))}
              </select>
            </section>

            {detailedStats ? (
              <>
                <section className="bg-white rounded-[2rem] p-6 border border-zinc-200 shadow-sm">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-2xl font-black font-mono">{detailedStats.total_issued}</p>
                      <p className="text-[10px] font-black uppercase text-zinc-400">Issued</p>
                    </div>
                    <div className="border-x border-zinc-100">
                      <p className="text-2xl font-black text-[#A50021] font-mono">{detailedStats.total_scanned}</p>
                      <p className="text-[10px] font-black uppercase text-zinc-400">Scanned</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black bg-zinc-900 text-white rounded-xl px-2 inline-block font-mono">{detailedStats.conversion}%</p>
                      <p className="text-[10px] font-black uppercase text-zinc-400 block mt-1">Conversion</p>
                    </div>
                  </div>
                </section>

                <section className="bg-white rounded-[2rem] p-6 border border-zinc-200 shadow-sm space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">By Series</h3>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b text-[10px] font-black uppercase text-zinc-400">
                        <th className="pb-2">Series</th>
                        <th className="pb-2 text-center">Issued</th>
                        <th className="pb-2 text-center">Scanned</th>
                        <th className="pb-2 text-right">Conversion</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-bold divide-y divide-zinc-50">
                      {detailedStats.by_series?.map((s: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-3 font-mono font-black">{s.series}</td>
                          <td className="py-3 text-center text-zinc-500 font-mono">{s.issued}</td>
                          <td className="py-3 text-center text-zinc-950 font-mono">{s.scanned}</td>
                          <td className="py-3 text-right font-mono">{s.conversion}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                <section className="bg-white rounded-[2rem] p-6 border border-zinc-200 shadow-sm space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Top Promoters</h3>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b text-[10px] font-black uppercase text-zinc-400">
                        <th className="pb-2">Promoter</th>
                        <th className="pb-2 text-center">Generated</th>
                        <th className="pb-2 text-center">Used</th>
                        <th className="pb-2 text-right">Conversion</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-bold divide-y divide-zinc-50">
                      {detailedStats.top_promoters?.map((p: any, idx: number) => (
                        <tr key={idx} className="cursor-pointer" onClick={() => openTgUser(p.username)}>
                          <td className="py-3 font-black text-blue-600">@{p.username || 'unknown'}</td>
                          <td className="py-3 text-center font-mono text-zinc-500">{p.generated}</td>
                          <td className="py-3 text-center font-mono text-[#A50021]">{p.used}</td>
                          <td className="py-3 text-right font-mono">{p.conversion}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              </>
            ) : (
              <div className="bg-white rounded-[2rem] p-8 text-center text-zinc-400 text-xs">No analytics data streamed.</div>
            )}
          </div>
        )}

        {/* TAB: USERS (ONLY ADMIN) */}
        {activeTab === 'users' && isAdmin && (
          <section className="bg-white rounded-[2rem] p-6 border border-zinc-200 shadow-sm space-y-4">
            <div className="flex gap-2">
              <input type="text" placeholder="Search profiles, Telegram ID..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold" />
              <button onClick={fetchUsersList} className="bg-zinc-900 text-white px-4 rounded-xl text-xs font-bold">Query</button>
            </div>

            <div className="overflow-x-auto -mx-6 px-6 no-scrollbar">
              <table className="w-full text-left min-w-[450px]">
                <thead>
                  <tr className="border-b text-[10px] text-zinc-400 uppercase font-black">
                    <th className="pb-2">Identity</th>
                    <th className="pb-2">Access Tier</th>
                    <th className="pb-2 text-right">Security Action</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-bold divide-y divide-zinc-50">
                  {usersList.map(u => (
                    <tr key={u.id} className={u.is_blacklisted ? 'opacity-40 bg-red-50/30' : ''}>
                      <td className="py-3">
                        <span onClick={() => openTgUser(u.username)} className="text-zinc-950 font-black cursor-pointer hover:underline block">@{u.username || 'null'}</span>
                        <span className="text-[10px] text-zinc-400 block font-normal">{u.first_name} {u.last_name}</span>
                      </td>
                      <td className="py-3 font-mono text-[11px] uppercase tracking-wider">{u.role}</td>
                      <td className="py-3 text-right">
                        <button onClick={() => handleToggleBlacklist(u.telegram_id, u.is_blacklisted)} className={`p-2 rounded-xl transition-all ${u.is_blacklisted ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                          {u.is_blacklisted ? <UserCheck size={14} /> : <UserX size={14} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB: BROADCAST (ONLY ADMIN) */}
        {activeTab === 'broadcast' && isAdmin && (
          <div className="space-y-6">
            <section className="bg-white rounded-[2rem] p-6 border border-zinc-200 shadow-sm space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Compose Global Broadcast</h3>
              
              <div className="space-y-2">
                <textarea placeholder="Write text message array..." value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} className="w-full min-h-[100px] bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-xs font-bold focus:outline-none" />
                <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3">
                  <Image size={14} className="text-zinc-400" />
                  <input type="text" placeholder="Optional image CDN URL..." value={broadcastImg} onChange={(e) => setBroadcastImg(e.target.value)} className="bg-transparent w-full text-xs font-bold focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-2">
                {['all', 'event_buyers'].map((type) => (
                  <button key={type} onClick={() => setAudienceType(type as any)} className={`py-2 px-1 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border ${audienceType === type ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-zinc-50 text-zinc-400 border-zinc-200'}`}>
                    {type === 'all' ? 'All System' : 'Event Buyers'}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => handleBroadcast(true)} className="w-1/3 border border-zinc-300 rounded-2xl py-3.5 text-[11px] font-black uppercase tracking-wider text-zinc-700 active:scale-95 transition-all">Test Run</button>
                <button onClick={() => handleBroadcast(false)} className="flex-1 bg-[#A50021] text-white rounded-2xl py-3.5 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-wider active:scale-95 transition-all shadow-md"><Send size={12} /> Blast Matrix</button>
              </div>
            </section>

            {/* ИСТОРИЯ СТРИМОВ */}
            <section className="bg-white rounded-[2rem] p-6 border border-zinc-200 shadow-sm space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Broadcast Pipeline History</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {broadcastHistory.map(job => (
                  <div key={job.id} className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl flex justify-between items-center text-xs">
                    <div className="max-w-[70%]">
                      <p className="font-bold text-zinc-900 truncate">{job.message_text}</p>
                      <p className="text-[9px] font-mono text-zinc-400">{new Date(job.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-mono bg-zinc-900 text-white px-2 py-0.5 rounded uppercase tracking-wider block font-black">{job.status}</span>
                      <span className="text-[9px] text-zinc-400 font-bold block mt-0.5">{job.total_recipients} prf</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* TAB: LIVE DASHBOARD */}
        {activeTab === 'live' && (
          <div className="space-y-6">
            <section className="bg-white rounded-[2rem] p-6 border border-zinc-200 shadow-sm space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block px-1">Hook Target Live Stream</label>
              <select value={selectedLiveEventId} onChange={(e) => { setSelectedLiveEventId(e.target.value); startLivePolling(e.target.value); }} className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-sm font-black text-zinc-900 focus:outline-none">
                {activeEvents.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </section>

            {liveData ? (
              <>
                {/* 4 Матричные плашки контракта */}
                <section className="grid grid-cols-2 gap-3">
                  <div className="bg-white border border-zinc-200 rounded-[1.5rem] p-4 text-center">
                    <p className="text-2xl font-black font-mono text-zinc-900">{liveData.total_issued}</p>
                    <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Issued Pool</p>
                  </div>
                  <div className="bg-white border border-zinc-200 rounded-[1.5rem] p-4 text-center">
                    <p className="text-2xl font-black font-mono text-[#A50021]">{liveData.total_scanned}</p>
                    <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Scanned Guard</p>
                  </div>
                  <div className="bg-white border border-zinc-200 rounded-[1.5rem] p-4 text-center">
                    <p className="text-2xl font-black font-mono text-zinc-600">{liveData.remaining}</p>
                    <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Remaining Outside</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-900 rounded-[1.5rem] p-4 text-center text-white">
                    <p className="text-2xl font-black font-mono text-emerald-400">{liveData.conversion}%</p>
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Gate Conversion</p>
                  </div>
                </section>

                {/* ХРОНОЛОГИЯ ПО ЧАСАМ (ГРАФИК СТОЛБИКАМИ НА ТЕЙЛВИНДЕ) */}
                <section className="bg-white rounded-[2rem] p-6 border border-zinc-200 shadow-sm space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1"><Clock size={12} /> Hourly Scan Influx</h3>
                  <div className="flex items-end justify-between h-24 pt-4 border-b border-zinc-100 px-2">
                    {liveData.hourly?.map((h, i) => {
                      const maxCount = Math.max(...liveData.hourly.map(o => o.count), 1);
                      const barHeight = (h.count / maxCount) * 100;
                      return (
                        <div key={i} className="flex flex-col items-center flex-1 group">
                          <span className="text-[8px] font-mono font-black opacity-0 group-hover:opacity-100 transition-opacity text-zinc-900 mb-1">{h.count}</span>
                          <div className="w-4 bg-zinc-900 group-hover:bg-[#A50021] rounded-t transition-all duration-500" style={{ height: `${Math.max(barHeight, 8)}%` }} />
                          <span className="text-[8px] font-mono font-bold text-zinc-400 mt-1.5">{h.hour}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* ЛИВ-ЛЕНТА СКАНОВ С КРАСИВОЙ СТРУКТУРОЙ */}
                <section className="bg-white rounded-[2rem] p-6 border border-zinc-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1"><Flame size={12} className="text-orange-500 animate-pulse" /> Live Scan Feed</h3>
                    <span className="text-[8px] font-mono text-zinc-400">Sync: {liveData.updated_at ? new Date(liveData.updated_at).toLocaleTimeString() : '...'}</span>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {liveData.recent_scans?.map((scan, idx) => (
                      <div key={idx} className="p-3 bg-zinc-50 border border-zinc-100 rounded-2xl flex justify-between items-center animate-fade-down">
                        <div>
                          <p className="text-xs font-black text-zinc-950">{scan.first_name || 'Guest'}</p>
                          <p className="text-[10px] font-bold text-blue-600" onClick={() => openTgUser(scan.username)}>@{scan.username || 'unknown'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-mono font-black bg-zinc-200 text-zinc-800 px-2 py-0.5 rounded">{scan.ticket_code}</p>
                          <p className="text-[8px] font-mono text-zinc-400 mt-1">{new Date(scan.scanned_at).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))}
                    {(!liveData.recent_scans || liveData.recent_scans.length === 0) && (
                      <p className="text-center text-zinc-400 py-6 text-xs font-medium">Waiting for first scan arrivals...</p>
                    )}
                  </div>
                </section>
              </>
            ) : (
              <div className="bg-white rounded-[2rem] p-12 text-center text-zinc-400 text-xs">Awaiting gate stream arrays...</div>
            )}
          </div>
        )}

      </main>
    </div>
  );

  // Хэндлер ручного сброса/обновления для верхней правой кнопки
  function handleManualRefresh() {
    fetchCurrentRole();
    if (activeTab === 'codes') fetchCodesData();
    if (activeTab === 'stats') fetchAllStatsEvents();
    if (activeTab === 'users') fetchUsersList();
    if (activeTab === 'broadcast') fetchBroadcastHistory();
    if (activeTab === 'live' && selectedLiveEventId) startLivePolling(selectedLiveEventId);
  }
}
