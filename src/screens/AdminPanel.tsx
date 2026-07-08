import { useEffect, useState, useRef } from 'react';
import { 
  ArrowLeft, QrCode, BarChart3, Users, Radio, Activity,
  PlusCircle, RefreshCw, Share2, Save, AlertTriangle, CheckCircle2,
  UserX, UserCheck, Send, Image, Flame, Clock, ChevronLeft, ChevronRight, Smile
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Screen } from '../App';

interface AdminPanelProps {
  onNavigate: (s: Screen) => void;
  userRole: string | null;
}

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
  const { t } = useTranslation();
  const initData = window.Telegram?.WebApp?.initData || '';
  const BASE_URL = 'https://uuxgtpzfxymhyekeuryf.supabase.co/functions/v1/admin-api';

  const [role, setRole] = useState<string | null>(initialRole);
  const [activeTab, setActiveTab] = useState<'codes' | 'stats' | 'users' | 'broadcast' | 'live'>('codes');
  const [loading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [activeEvents, setActiveEvents] = useState<EventItem[]>([]);
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  
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
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const USERS_LIMIT = 50;

  // === ТАБ: BROADCAST ===
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastImg, setBroadcastImg] = useState('');
  const [audienceType, setAudienceType] = useState<'all' | 'event_buyers' | 'selected'>('all');
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastJob[]>([]);
  const [workerProgress, setWorkerProgress] = useState<{ current: number; total: number } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // === ТАБ: LIVE DASHBOARD ===
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const livePollingRef = useRef<NodeJS.Timeout | null>(null);

  const isAdmin = role === 'admin';
  const isPromoter = role === 'promoter';
  const isHostess = role === 'hostess';

  const quickEmojis = ['🔥', '✨', '⚡', '🎉', '🎫', '🚀', '⚠️', '👀', '🥂', '🔊', '🔴', '✅'];

  useEffect(() => {
    async function initPanel() {
      await fetchCurrentRole();
      fetchActiveEvents();
    }
    initPanel();
  }, []);

  useEffect(() => {
    if (activeTab !== 'live' && livePollingRef.current) {
      clearInterval(livePollingRef.current);
    }
    if (activeTab === 'codes' && selectedActiveEventId) fetchCodesData();
    if (activeTab === 'stats') fetchAllStatsEvents();
    if (activeTab === 'users') fetchUsersList();
    if (activeTab === 'broadcast') fetchBroadcastHistory();
    if (activeTab === 'live' && selectedLiveEventId) startLivePolling(selectedLiveEventId);
  }, [activeTab, selectedActiveEventId, selectedStatsEventId, selectedLiveEventId, userPage]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        showSuccess(t('admin_panel_screen.generated_toast', { count: data.count }));
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
      showSuccess(t('admin_panel_screen.saved_toast'));
    } catch (e) { console.error(e); }
  };

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

  const fetchUsersList = async () => {
    setLoading(true);
    const calculatedOffset = (userPage - 1) * USERS_LIMIT;
    try {
      const data = await apiRequest('list_users', { 
        search: userSearch,
        limit: USERS_LIMIT,
        offset: calculatedOffset
      });
      setUsersList(data.users || []);
      setUserTotal(data.total || 0);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserPage(1);
    fetchUsersList();
  };

  const handleToggleBlacklist = async (tgId: string, currentStatus: boolean) => {
    try {
      await apiRequest('toggle_blacklist', { telegram_id: tgId, is_blacklisted: !currentStatus });
      setUsersList(prev => prev.map(u => u.telegram_id === tgId ? { ...u, is_blacklisted: !currentStatus } : u));
      showSuccess(t('admin_panel_screen.security_status_updated'));
    } catch (e) { console.error(e); }
  };

  const fetchBroadcastHistory = async () => {
    try {
      const data = await apiRequest('list_broadcasts');
      setBroadcastHistory(data.jobs || []);
    } catch (e) { console.error(e); }
  };

  const handleBroadcast = async (isTest: boolean) => {
    if (!broadcastText.trim()) return showError(t('admin_panel_screen.message_empty_error'));
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
        showSuccess(t('admin_panel_screen.test_broadcast_sent'));
      } else {
        const data = await apiRequest('create_broadcast', payload);
        if (data.job_id) {
          showSuccess(t('admin_panel_screen.job_created', { count: data.total_recipients }));
          setBroadcastText('');
          setBroadcastImg('');
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
        return processJob(jobId);
      } else {
        showSuccess(t('admin_panel_screen.broadcast_complete', { count: data.total_sent }));
        setWorkerProgress(null);
        fetchBroadcastHistory();
      }
    } catch (err: any) {
      showError(t('admin_panel_screen.worker_failed', { msg: err.message }));
      setWorkerProgress(null);
    }
  };

  const insertEmoji = (emoji: string) => {
    setBroadcastText(prev => prev + emoji);
  };

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
    tick();
    livePollingRef.current = setInterval(tick, 7000);
  };

  const handleShareCode = (code: string) => {
    const activeEvent = activeEvents.find(e => e.id === selectedActiveEventId);
    const text = `Твой промокод на ${activeEvent?.title || 'Kyrios Event'}: ${code}\nВведи его в приложении: https://t.me/kyrios_events_bot/app`;
    window.Telegram?.WebApp?.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent('https://t.me/kyrios_events_bot/app')}&text=${encodeURIComponent(text)}`);
  };

  const openTgUser = (username: string) => {
    if (username) window.Telegram?.WebApp?.openTelegramLink(`https://t.me/${username.replace('@', '')}`);
  };

  const handleManualRefresh = () => {
    fetchCurrentRole();
    if (activeTab === 'codes') fetchCodesData();
    if (activeTab === 'stats') fetchAllStatsEvents();
    if (activeTab === 'users') fetchUsersList();
    if (activeTab === 'broadcast') fetchBroadcastHistory();
    if (activeTab === 'live' && selectedLiveEventId) startLivePolling(selectedLiveEventId);
  };

  const totalPages = Math.ceil(userTotal / USERS_LIMIT) || 1;

  return (
    <div className="min-h-screen bg-background pb-32 select-none text-on-surface font-sans">
      {/* HEADER */}
      <header className="w-full sticky top-0 z-50 bg-surface-variant/80 backdrop-blur-xl flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/30">
        <button onClick={() => onNavigate('profile')} className="w-10 h-10 rounded-full bg-surface flex items-center justify-center border border-outline-variant/40 active:scale-95 transition-all">
          <ArrowLeft size={18} className="text-on-surface-variant" />
        </button>
        <h1 className="font-black text-sm uppercase tracking-wider text-on-surface">
          {t('admin_panel_screen.terminal')} : <span className="text-[#A50021] dark:text-red-400 font-mono">{role || t('admin_panel_screen.syncing')}</span>
        </h1>
        <button onClick={handleManualRefresh} className="w-10 h-10 rounded-full bg-surface flex items-center justify-center border border-outline-variant/40 active:scale-95 transition-all">
          <RefreshCw size={16} className={`text-on-surface-variant ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* NOTIFICATIONS */}
      {errorMsg && (
        <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl flex items-start gap-3 text-red-700 dark:text-red-400 animate-bounce">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p className="text-xs font-black leading-relaxed">{errorMsg}</p>
        </div>
      )}
      {successMsg && (
        <div className="mx-6 mt-4 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl flex items-start gap-3 text-emerald-800 dark:text-emerald-400">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          <p className="text-xs font-bold leading-relaxed">{successMsg}</p>
        </div>
      )}

      {/* PROGRESS BAR */}
      {workerProgress && (
        <div className="mx-6 mt-4 p-4 bg-zinc-900 text-white rounded-2xl space-y-2">
          <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-400">
            <span>{t('admin_panel_screen.pipeline_broadcasting')}</span>
            <span>{Math.round((workerProgress.current / workerProgress.total) * 100)}%</span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div className="bg-red-600 h-full transition-all duration-300" style={{ width: `${(workerProgress.current / workerProgress.total) * 100}%` }} />
          </div>
          <p className="text-[10px] font-mono text-center text-zinc-500">{t('admin_panel_screen.profiles_arrayed', { current: workerProgress.current, total: workerProgress.total })}</p>
        </div>
      )}

      {/* TABS */}
      <nav className="px-6 pt-6 flex gap-1 overflow-x-auto no-scrollbar">
        {!isHostess && (
          <button onClick={() => setActiveTab('codes')} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shrink-0 transition-all ${activeTab === 'codes' ? 'bg-primary text-on-primary shadow-md' : 'bg-surface border border-outline-variant/40 text-on-surface-variant'}`}>
            <QrCode size={14} /> {t('admin_panel_screen.tab_codes')}
          </button>
        )}
        {!isHostess && (
          <button onClick={() => setActiveTab('stats')} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shrink-0 transition-all ${activeTab === 'stats' ? 'bg-primary text-on-primary shadow-md' : 'bg-surface border border-outline-variant/40 text-on-surface-variant'}`}>
            <BarChart3 size={14} /> {t('admin_panel_screen.tab_stats')}
          </button>
        )}
        {isAdmin && (
          <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shrink-0 transition-all ${activeTab === 'users' ? 'bg-primary text-on-primary' : 'bg-surface border border-outline-variant/40 text-on-surface-variant'}`}>
            <Users size={14} /> {t('admin_panel_screen.tab_users')}
          </button>
        )}
        {isAdmin && (
          <button onClick={() => setActiveTab('broadcast')} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shrink-0 transition-all ${activeTab === 'broadcast' ? 'bg-primary text-on-primary' : 'bg-surface border border-outline-variant/40 text-on-surface-variant'}`}>
            <Radio size={14} /> {t('admin_panel_screen.tab_broadcast')}
          </button>
        )}
        {(isAdmin || isPromoter || isHostess) && (
          <button onClick={() => setActiveTab('live')} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shrink-0 transition-all ${activeTab === 'live' ? 'bg-primary text-on-primary' : 'bg-surface border border-outline-variant/40 text-on-surface-variant'}`}>
            <Activity size={14} /> {t('admin_panel_screen.tab_live')}
          </button>
        )}
      </nav>

      {/* VIEWPORT AREA */}
      <main className="px-6 py-6 space-y-6">
        
        {/* TAB: CODES */}
        {activeTab === 'codes' && !isHostess && (
          <div className="space-y-6">
            <section className="bg-surface rounded-[2rem] p-6 border border-outline-variant/40 shadow-sm space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">{t('admin_panel_screen.active_pool_registry')}</h3>
              <select value={selectedActiveEventId} onChange={(e) => setSelectedActiveEventId(e.target.value)} className="w-full bg-surface-container border border-outline-variant/40 rounded-2xl px-5 py-4 text-sm font-black text-on-surface focus:outline-none">
                {activeEvents.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
              
              <div className="flex gap-3 pt-2">
                <input type="number" min="1" max="500" value={generateCount} onChange={(e) => setGenerateCount(Number(e.target.value))} className="w-1/3 bg-surface-container border border-outline-variant/40 rounded-2xl px-4 py-3.5 text-center font-black text-sm text-on-surface" />
                <button onClick={handleGenerate} disabled={loading || !selectedActiveEventId} className="flex-1 bg-[#A50021] text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest active:scale-[0.98] transition-all disabled:opacity-50">
                  <PlusCircle size={16} /> {t('admin_panel_screen.generate_array')}
                </button>
              </div>

              {generatedCodes.length > 0 && (
                <div className="pt-3 border-t border-outline-variant/40 flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {generatedCodes.map((c, i) => (
                    <span key={i} className="text-[9px] font-mono font-black px-2 py-0.5 bg-zinc-900 text-white rounded">{c}</span>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-surface rounded-[2rem] p-6 border border-outline-variant/40 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">{t('admin_panel_screen.my_pool_allocations')}</h3>
                <span className="text-[10px] font-black bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-full">{t('admin_panel_screen.size_label', { count: myCodesList.length })}</span>
              </div>
              <div className="overflow-x-auto -mx-6 px-6 no-scrollbar">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-outline-variant/30 text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-wider">
                      <th className="pb-3 font-medium">{t('admin_panel_screen.col_code')}</th>
                      <th className="pb-3 font-medium">{t('admin_panel_screen.col_status')}</th>
                      <th className="pb-3 font-medium">{t('admin_panel_screen.col_guest_identity')}</th>
                      <th className="pb-3 font-medium">{t('admin_panel_screen.col_instagram')}</th>
                      <th className="pb-3 text-right font-medium">{t('admin_panel_screen.col_action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20 text-xs font-bold">
                    {myCodesList.map((row) => {
                      const isEditing = editingRow === row.code;
                      return (
                        <tr key={row.code} className="hover:bg-surface-container/40">
                          <td className="py-3.5 font-mono font-black text-sm text-on-surface">{row.code}</td>
                          <td className="py-3.5">
                            {row.used_count > 0 ? (
                              <span className="text-[9px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/30 px-2 py-0.5 rounded-md uppercase font-black">{t('admin_panel_screen.status_used')}</span>
                            ) : (
                              <span className="text-[9px] bg-surface-container text-on-surface-variant/60 px-2 py-0.5 rounded-md uppercase">{t('admin_panel_screen.status_idle')}</span>
                            )}
                          </td>
                          <td className="py-3.5">
                            {isEditing ? (
                              <input type="text" value={tempGuestName} onChange={(e) => setTempGuestName(e.target.value)} className="bg-surface-container border border-outline-variant/40 rounded-lg px-2 py-1 text-xs w-28 text-on-surface" />
                            ) : (
                              <span onClick={() => { setEditingRow(row.code); setTempGuestName(row.guest_name || ''); setTempGuestInstagram(row.guest_instagram || ''); }} className="border-b border-dashed border-outline-variant/60 cursor-pointer block text-on-surface-variant">{row.guest_name || '—'}</span>
                            )}
                          </td>
                          <td className="py-3.5">
                            {isEditing ? (
                              <input type="text" value={tempGuestInstagram} onChange={(e) => setTempGuestInstagram(e.target.value)} className="bg-surface-container border border-outline-variant/40 rounded-lg px-2 py-1 text-xs w-24 text-on-surface" />
                            ) : (
                              <span onClick={() => { setEditingRow(row.code); setTempGuestName(row.guest_name || ''); setTempGuestInstagram(row.guest_instagram || ''); }} className="border-b border-dashed border-outline-variant/60 cursor-pointer block text-on-surface-variant/70">{row.guest_instagram ? `@${row.guest_instagram}` : '—'}</span>
                            )}
                          </td>
                          <td className="py-3.5 text-right">
                            {isEditing ? (
                              <button onClick={() => handleSaveGuest(row.code)} className="p-2 bg-primary text-on-primary rounded-lg"><Save size={12} /></button>
                            ) : (
                              <button onClick={() => handleShareCode(row.code)} className="p-2 bg-surface-container text-on-surface-variant rounded-lg"><Share2 size={12} /></button>
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
            <section className="bg-surface rounded-[2rem] p-6 border border-outline-variant/40 shadow-sm space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 block px-1">{t('admin_panel_screen.view_stats_event')}</label>
              <select value={selectedStatsEventId} onChange={(e) => { setSelectedStatsEventId(e.target.value); fetchDetailedStats(e.target.value); }} className="w-full bg-surface border border-outline-variant/40 rounded-2xl px-5 py-4 text-sm font-black text-on-surface focus:outline-none">
                {allEvents.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} {ev.is_upcoming ? t('admin_panel_screen.upcoming_tag') : t('admin_panel_screen.past_tag')}
                  </option>
                ))}
              </select>
            </section>

            {detailedStats ? (
              <>
                <section className="bg-surface rounded-[2rem] p-6 border border-outline-variant/40 shadow-sm">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-2xl font-black font-mono text-on-surface">{detailedStats.total_issued}</p>
                      <p className="text-[10px] font-black uppercase text-on-surface-variant/60">{t('admin_panel_screen.issued')}</p>
                    </div>
                    <div className="border-x border-outline-variant/30">
                      <p className="text-2xl font-black text-[#A50021] font-mono">{detailedStats.total_scanned}</p>
                      <p className="text-[10px] font-black uppercase text-on-surface-variant/60">{t('admin_panel_screen.scanned')}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black bg-zinc-900 text-white rounded-xl px-2 inline-block font-mono">{detailedStats.conversion}%</p>
                      <p className="text-[10px] font-black uppercase text-on-surface-variant/60 block mt-1">{t('admin_panel_screen.conversion')}</p>
                    </div>
                  </div>
                </section>

                <section className="bg-surface rounded-[2rem] p-6 border border-outline-variant/40 shadow-sm space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70">{t('admin_panel_screen.by_series')}</h3>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-outline-variant/30 text-[10px] font-black uppercase text-on-surface-variant/60">
                        <th className="pb-2">{t('admin_panel_screen.col_series')}</th>
                        <th className="pb-2 text-center">{t('admin_panel_screen.issued')}</th>
                        <th className="pb-2 text-center">{t('admin_panel_screen.scanned')}</th>
                        <th className="pb-2 text-right">{t('admin_panel_screen.conversion')}</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-bold divide-y divide-outline-variant/20">
                      {detailedStats.by_series?.map((s: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-3 font-mono font-black text-on-surface">{s.series}</td>
                          <td className="py-3 text-center text-on-surface-variant font-mono">{s.issued}</td>
                          <td className="py-3 text-center text-on-surface font-mono">{s.scanned}</td>
                          <td className="py-3 text-right font-mono text-on-surface">{s.conversion}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                <section className="bg-surface rounded-[2rem] p-6 border border-outline-variant/40 shadow-sm space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70">{t('admin_panel_screen.top_promoters')}</h3>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-outline-variant/30 text-[10px] font-black uppercase text-on-surface-variant/60">
                        <th className="pb-2">{t('admin_panel_screen.col_promoter')}</th>
                        <th className="pb-2 text-center">{t('admin_panel_screen.col_generated')}</th>
                        <th className="pb-2 text-center">{t('admin_panel_screen.col_used')}</th>
                        <th className="pb-2 text-right">{t('admin_panel_screen.conversion')}</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-bold divide-y divide-outline-variant/20">
                      {detailedStats.top_promoters?.map((p: any, idx: number) => (
                        <tr key={idx} className="cursor-pointer" onClick={() => openTgUser(p.username)}>
                          <td className="py-3 font-black text-blue-600 dark:text-blue-400">@{p.username || 'unknown'}</td>
                          <td className="py-3 text-center font-mono text-on-surface-variant">{p.generated}</td>
                          <td className="py-3 text-center font-mono text-[#A50021]">{p.used}</td>
                          <td className="py-3 text-right font-mono text-on-surface">{p.conversion}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              </>
            ) : (
              <div className="bg-surface rounded-[2rem] p-8 text-center text-on-surface-variant/60 text-xs">{t('admin_panel_screen.no_analytics')}</div>
            )}
          </div>
        )}

        {/* TAB: USERS */}
        {activeTab === 'users' && isAdmin && (
          <section className="bg-surface rounded-[2rem] p-6 border border-outline-variant/40 shadow-sm space-y-4 animate-fade-up">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <input type="text" placeholder={t('admin_panel_screen.search_profiles')} value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="flex-1 bg-surface-container border border-outline-variant/40 rounded-xl px-4 py-3 text-xs font-bold text-on-surface focus:outline-none" />
              <button type="submit" className="bg-primary text-on-primary px-5 rounded-xl text-xs font-bold active:scale-95 transition-all">{t('admin_panel_screen.query')}</button>
            </form>

            <div className="overflow-x-auto -mx-6 px-6 no-scrollbar">
              <table className="w-full text-left min-w-[450px]">
                <thead>
                  <tr className="border-b border-outline-variant/30 text-[10px] text-on-surface-variant/60 uppercase font-black">
                    <th className="pb-2">{t('admin_panel_screen.col_identity')}</th>
                    <th className="pb-2">{t('admin_panel_screen.col_access_tier')}</th>
                    <th className="pb-2 text-right">{t('admin_panel_screen.col_security_action')}</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-bold divide-y divide-outline-variant/20">
                  {usersList.map(u => (
                    <tr key={u.id} className={u.is_blacklisted ? 'opacity-40 bg-red-50/30 dark:bg-red-500/5' : ''}>
                      <td className="py-3">
                        <span onClick={() => openTgUser(u.username)} className="text-on-surface font-black cursor-pointer hover:underline block">@{u.username || 'null'}</span>
                        <span className="text-[10px] text-on-surface-variant/60 block font-normal">{u.first_name} {u.last_name}</span>
                      </td>
                      <td className="py-3 font-mono text-[11px] uppercase tracking-wider text-on-surface">{u.role}</td>
                      <td className="py-3 text-right">
                        <button onClick={() => handleToggleBlacklist(u.telegram_id, u.is_blacklisted)} className={`p-2 rounded-xl transition-all ${u.is_blacklisted ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                          {u.is_blacklisted ? <UserCheck size={14} /> : <UserX size={14} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-outline-variant/30 pt-4 text-xs">
                <span className="font-mono text-on-surface-variant/60 font-bold">{t('admin_panel_screen.total_label', { count: userTotal })}</span>
                <div className="flex items-center gap-1.5">
                  <button type="button" disabled={userPage === 1 || loading} onClick={() => setUserPage(prev => Math.max(prev - 1, 1))} className="w-8 h-8 rounded-lg border border-outline-variant/40 flex items-center justify-center bg-surface disabled:opacity-40 text-on-surface"><ChevronLeft size={14} /></button>
                  <span className="font-mono font-black px-3 py-1 bg-surface-container rounded-md text-on-surface">{userPage} / {totalPages}</span>
                  <button type="button" disabled={userPage === totalPages || loading} onClick={() => setUserPage(prev => Math.min(prev + 1, totalPages))} className="w-8 h-8 rounded-lg border border-outline-variant/40 flex items-center justify-center bg-surface disabled:opacity-40 text-on-surface"><ChevronRight size={14} /></button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* TAB: BROADCAST */}
        {activeTab === 'broadcast' && isAdmin && (
          <div className="space-y-6">
            <section className="bg-surface rounded-[2rem] p-6 border border-outline-variant/40 shadow-sm space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70">{t('admin_panel_screen.compose_broadcast')}</h3>
              
              <div className="space-y-2 relative">
                <div className="relative">
                  <textarea placeholder={t('admin_panel_screen.write_message_placeholder')} value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} className="w-full min-h-[120px] bg-surface-container border border-outline-variant/40 rounded-2xl p-4 pr-12 text-xs font-bold text-on-surface focus:outline-none" />
                  <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="absolute right-4 top-4 p-1 text-on-surface-variant/60"><Smile size={18} /></button>
                </div>

                {showEmojiPicker && (
                  <div ref={emojiPickerRef} className="absolute right-0 top-[130px] z-50 bg-surface border border-outline-variant/40 rounded-2xl p-3 shadow-xl max-w-[240px]">
                    <div className="grid grid-cols-6 gap-2">
                      {quickEmojis.map(emoji => (
                        <button key={emoji} type="button" onClick={() => insertEmoji(emoji)} className="w-7 h-7 flex items-center justify-center text-sm rounded-lg hover:bg-surface-container">{emoji}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 bg-surface-container border border-outline-variant/40 rounded-2xl px-4 py-3">
                  <Image size={14} className="text-on-surface-variant/60" />
                  <input type="text" placeholder={t('admin_panel_screen.image_url_placeholder')} value={broadcastImg} onChange={(e) => setBroadcastImg(e.target.value)} className="bg-transparent w-full text-xs font-bold text-on-surface focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-2">
                {['all', 'event_buyers'].map((type) => (
                  <button key={type} onClick={() => setAudienceType(type as any)} className={`py-2.5 px-1 rounded-xl font-bold text-[10px] uppercase tracking-wider border ${audienceType === type ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container text-on-surface-variant/60 border-outline-variant/40'}`}>
                    {type === 'all' ? t('admin_panel_screen.audience_all') : t('admin_panel_screen.audience_event_buyers')}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => handleBroadcast(true)} className="w-1/3 border border-outline-variant/60 rounded-2xl py-3.5 text-[11px] font-black uppercase tracking-wider text-on-surface-variant">{t('admin_panel_screen.test_run')}</button>
                <button onClick={() => handleBroadcast(false)} className="flex-1 bg-[#A50021] text-white rounded-2xl py-3.5 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-wider active:scale-95 transition-all shadow-md"><Send size={12} /> {t('admin_panel_screen.blast_matrix')}</button>
              </div>
            </section>

            <section className="bg-surface rounded-[2rem] p-6 border border-outline-variant/40 shadow-sm space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70">{t('admin_panel_screen.broadcast_pipeline_history')}</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {broadcastHistory.map(job => (
                  <div key={job.id} className="p-3 bg-surface-container border border-outline-variant/30 rounded-xl flex justify-between items-center text-xs">
                    <div className="max-w-[70%]">
                      <p className="font-bold text-on-surface truncate">{job.message_text}</p>
                      <p className="text-[9px] font-mono text-on-surface-variant/60">{new Date(job.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-mono bg-zinc-900 text-white px-2 py-0.5 rounded uppercase font-black">{job.status}</span>
                      <span className="text-[9px] text-on-surface-variant/60 font-bold block mt-0.5">{job.total_recipients} {t('admin_panel_screen.recipients_short')}</span>
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
            <section className="bg-surface rounded-[2rem] p-6 border border-outline-variant/40 shadow-sm space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 block px-1">{t('admin_panel_screen.hook_target_stream')}</label>
              <select value={selectedLiveEventId} onChange={(e) => { setSelectedLiveEventId(e.target.value); startLivePolling(e.target.value); }} className="w-full bg-surface-container border border-outline-variant/40 rounded-2xl px-5 py-4 text-sm font-black text-on-surface focus:outline-none">
                {activeEvents.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </section>

            {liveData ? (
              <>
                <section className="grid grid-cols-2 gap-3">
                  <div className="bg-surface border border-outline-variant/40 rounded-[1.5rem] p-4 text-center">
                    <p className="text-2xl font-black font-mono text-on-surface">{liveData.total_issued}</p>
                    <p className="text-[9px] font-black uppercase text-on-surface-variant/60 tracking-wider">{t('admin_panel_screen.issued_pool')}</p>
                  </div>
                  <div className="bg-surface border border-outline-variant/40 rounded-[1.5rem] p-4 text-center">
                    <p className="text-2xl font-black font-mono text-[#A50021]">{liveData.total_scanned}</p>
                    <p className="text-[9px] font-black uppercase text-on-surface-variant/60 tracking-wider">{t('admin_panel_screen.scanned_guard')}</p>
                  </div>
                  <div className="bg-surface border border-outline-variant/40 rounded-[1.5rem] p-4 text-center">
                    <p className="text-2xl font-black font-mono text-on-surface-variant">{liveData.remaining}</p>
                    <p className="text-[9px] font-black uppercase text-on-surface-variant/60 tracking-wider">{t('admin_panel_screen.remaining_outside')}</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-900 rounded-[1.5rem] p-4 text-center text-white">
                    <p className="text-2xl font-black font-mono text-emerald-400">{liveData.conversion}%</p>
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">{t('admin_panel_screen.gate_conversion')}</p>
                  </div>
                </section>

                <section className="bg-surface rounded-[2rem] p-6 border border-outline-variant/40 shadow-sm space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 flex items-center gap-1"><Clock size={12} /> {t('admin_panel_screen.hourly_scan_influx')}</h3>
                  <div className="flex items-end justify-between h-24 pt-4 border-b border-outline-variant/30 px-2">
                    {liveData.hourly?.map((h, i) => {
                      const maxCount = Math.max(...liveData.hourly.map(o => o.count), 1);
                      const barHeight = (h.count / maxCount) * 100;
                      return (
                        <div key={i} className="flex flex-col items-center flex-1 group">
                          <span className="text-[8px] font-mono font-black opacity-0 group-hover:opacity-100 text-on-surface mb-1">{h.count}</span>
                          <div className="w-4 bg-zinc-900 dark:bg-zinc-600 group-hover:bg-[#A50021] rounded-t transition-all duration-500" style={{ height: `${Math.max(barHeight, 8)}%` }} />
                          <span className="text-[8px] font-mono font-bold text-on-surface-variant/60 mt-1.5">{h.hour}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="bg-surface rounded-[2rem] p-6 border border-outline-variant/40 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 flex items-center gap-1"><Flame size={12} className="text-orange-500 animate-pulse" /> {t('admin_panel_screen.live_scan_feed')}</h3>
                    <span className="text-[8px] font-mono text-on-surface-variant/60">{t('admin_panel_screen.sync_label', { time: liveData.updated_at ? new Date(liveData.updated_at).toLocaleTimeString() : '...' })}</span>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {liveData.recent_scans?.map((scan, idx) => (
                      <div key={idx} className="p-3 bg-surface-container border border-outline-variant/30 rounded-2xl flex justify-between items-center">
                        <div>
                          <p className="text-xs font-black text-on-surface">{scan.first_name || 'Guest'}</p>
                          <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400" onClick={() => openTgUser(scan.username)}>@{scan.username || 'unknown'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-mono font-black bg-surface-container-high dark:bg-zinc-700 text-on-surface px-2 py-0.5 rounded">{scan.ticket_code}</p>
                          <p className="text-[8px] font-mono text-on-surface-variant/60 mt-1">{new Date(scan.scanned_at).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <div className="bg-surface rounded-[2rem] p-12 text-center text-on-surface-variant/60 text-xs">{t('admin_panel_screen.awaiting_gate_stream')}</div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
