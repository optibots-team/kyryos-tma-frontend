import { useEffect, useState, useRef } from 'react';
import { 
  ArrowLeft, QrCode, BarChart3, Users, Radio, Activity,
  PlusCircle, RefreshCw, Share2, Save, AlertTriangle, CheckCircle2 
} from 'lucide-react';
import { Screen } from '../App';

interface AdminPanelProps {
  onNavigate: (s: Screen) => void;
  userRole: string | null; // 'admin' | 'promoter' | 'scanner' и т.д.
}

export default function AdminPanel({ onNavigate, userRole }: AdminPanelProps) {
  const initData = window.Telegram?.WebApp?.initData || '';
  const BASE_URL = 'https://uuxgtpzfxymhyekeuryf.supabase.co/functions/v1/admin-api';

  // Состояние табов и данных
  const [activeTab, setActiveTab] = useState<'codes' | 'stats' | 'users' | 'broadcast' | 'live'>('codes');
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  
  // Состояния для вкладки Codes
  const [generateCount, setGenerateCount] = useState<number>(10);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [myCodesList, setMyCodesList] = useState<any[]>([]);
  
  // Состояние для вкладки Stats
  const [statsList, setStatsList] = useState<any[]>([]);

  // Системные состояния
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Редактирование строк в таблице
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [tempGuestName, setTempGuestName] = useState('');
  const [tempGuestInstagram, setTempGuestInstagram] = useState('');

  // Загрузка базовых данных при старте
  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchCodesAndStats();
    }
  }, [selectedEventId, activeTab]);

  // Универсальный хэндлер запросов к Edge Function
  const apiRequest = async (action: string, payload: Record<string, any> = {}) => {
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          init_data: initData,
          ...payload
        })
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

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('list_events');
      if (data.events && data.events.length > 0) {
        setEvents(data.events);
        setSelectedEventId(data.events[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCodesAndStats = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      if (activeTab === 'codes') {
        const data = await apiRequest('my_codes', { event_id: selectedEventId });
        setMyCodesList(data.codes || []);
      } else if (activeTab === 'stats') {
        const data = await apiRequest('promoter_stats', { event_id: selectedEventId });
        setStatsList(data.promoters || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    setGeneratedCodes([]);
    try {
      const data = await apiRequest('generate_codes', {
        event_id: selectedEventId,
        count: generateCount
      });
      if (data.codes) {
        setGeneratedCodes(data.codes);
        showSuccess(`Successfully generated ${data.count} codes!`);
        // Сразу обновляем таблицу кодов промоутера
        const updated = await apiRequest('my_codes', { event_id: selectedEventId });
        setMyCodesList(updated.codes || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (row: any) => {
    setEditingRow(row.code);
    setTempGuestName(row.guest_name || '');
    setTempGuestInstagram(row.guest_instagram || '');
  };

  const handleSaveGuest = async (code: string) => {
    try {
      await apiRequest('update_guest', {
        code,
        guest_name: tempGuestName.trim(),
        guest_instagram: tempGuestInstagram.replace('@', '').trim()
      });
      
      // Обновляем локальный стейт без перезапроса всей таблицы
      setMyCodesList(prev => prev.map(item => {
        if (item.code === code) {
          return { ...item, guest_name: tempGuestName, guest_instagram: tempGuestInstagram };
        }
        return item;
      }));
      setEditingRow(null);
      showSuccess("Guest details saved!");
    } catch (e) {
      console.error(e);
    }
  };

  const handleShareCode = (code: string) => {
    const activeEvent = events.find(e => e.id === selectedEventId);
    const eventTitle = activeEvent ? activeEvent.title : 'Kyrios Event';
    
    const text = `Твой промокод на ${eventTitle}: ${code}\nВведи его в приложении: https://t.me/kyrios_events_bot/app`;
    window.Telegram?.WebApp?.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent('https://t.me/kyrios_events_bot/app')}&text=${encodeURIComponent(text)}`);
  };

  // Фильтрация видимости табов на основе роли
  const isAdmin = userRole === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 pb-32 select-none text-zinc-900">
      {/* HEADER */}
      <header className="w-full sticky top-0 z-50 bg-zinc-300/70 backdrop-blur-xl flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-400/30">
        <button onClick={() => onNavigate('profile')} className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-zinc-200 active:scale-95 transition-all">
          <ArrowLeft size={18} className="text-zinc-700" />
        </button>
        <h1 className="font-headline font-black text-lg uppercase tracking-wider text-zinc-900">
          {isAdmin ? 'Admin Station' : 'Promoter Hub'}
        </h1>
        <button onClick={fetchCodesAndStats} className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-zinc-200 active:scale-95 transition-all">
          <RefreshCw size={16} className={`text-zinc-700 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* УВЕДОМЛЕНИЯ О СИСТЕМНЫХ ОШИБКАХ / УСПЕХЕ */}
      {errorMsg && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 animate-fade-up">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p className="text-xs font-bold leading-relaxed">{errorMsg}</p>
        </div>
      )}
      {successMsg && (
        <div className="mx-6 mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-800 animate-fade-up">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          <p className="text-xs font-bold leading-relaxed">{successMsg}</p>
        </div>
      )}

      {/* ДРОПДАУН ВЫБОРА ИВЕНТА */}
      <section className="px-6 pt-6">
        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2 px-1">Select Active Event</label>
        <select 
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-4 text-sm font-black text-zinc-900 focus:outline-none shadow-sm"
        >
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>
              {ev.title} ({new Date(ev.event_date).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})})
            </option>
          ))}
        </select>
      </section>

      {/* ВНУТРЕННЯЯ НАВИГАЦИЯ (ТАБЫ) */}
      <nav className="px-6 pt-6 flex gap-1 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('codes')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shrink-0 transition-all ${activeTab === 'codes' ? 'bg-zinc-900 text-white shadow-md' : 'bg-white border border-zinc-100 text-zinc-500'}`}
        >
          <QrCode size={14} /> Codes
        </button>
        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shrink-0 transition-all ${activeTab === 'stats' ? 'bg-zinc-900 text-white shadow-md' : 'bg-white border border-zinc-100 text-zinc-500'}`}
        >
          <BarChart3 size={14} /> Stats
        </button>

        {/* Заглушки только для роли Admin */}
        {isAdmin && (
          <>
            <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shrink-0 transition-all ${activeTab === 'users' ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-100 text-zinc-400'}`}>
              <Users size={14} /> Users
            </button>
            <button onClick={() => setActiveTab('broadcast')} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shrink-0 transition-all ${activeTab === 'broadcast' ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-100 text-zinc-400'}`}>
              <Radio size={14} /> Broadcast
            </button>
            <button onClick={() => setActiveTab('live')} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shrink-0 transition-all ${activeTab === 'live' ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-100 text-zinc-400'}`}>
              <Activity size={14} /> Live
            </button>
          </>
        )}
      </nav>

      {/* ОСНОВНОЙ КОНТЕНТ В ЗАВИСИМОСТИ ОТ ТАБА */}
      <main className="px-6 py-6 space-y-6">
        
        {/* TAB 1: CODES (ГЕНЕРАТОР + ТАБЛИЦА СВОИХ КОДОВ) */}
        {activeTab === 'codes' && (
          <div className="space-y-6">
            
            {/* Панель генерации */}
            <section className="bg-white rounded-[2rem] p-6 border border-zinc-100 shadow-sm space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Generate Invites</h3>
              <div className="flex gap-3">
                <input 
                  type="number" 
                  min="1" 
                  max="500"
                  value={generateCount}
                  onChange={(e) => setGenerateCount(Number(e.target.value))}
                  className="w-1/3 bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-3.5 text-center font-black text-sm"
                />
                <button 
                  onClick={handleGenerate}
                  disabled={loading || !selectedEventId}
                  className="flex-1 bg-[#A50021] text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest active:scale-[0.98] transition-all shadow-md shadow-red-900/10 disabled:opacity-50"
                >
                  <PlusCircle size={16} /> Generate
                </button>
              </div>

              {/* Быстрый показ только что сгенерированного пула */}
              {generatedCodes.length > 0 && (
                <div className="pt-3 border-t border-zinc-100">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">Fresh pool created:</p>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-zinc-50 rounded-xl border border-zinc-100">
                    {generatedCodes.map((c, i) => (
                      <span key={i} className="text-[10px] font-mono font-black px-2 py-0.5 bg-white border border-zinc-200 rounded text-zinc-700">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Таблица кодов промоутера */}
            <section className="bg-white rounded-[2rem] p-6 border border-zinc-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">My Promo Codes</h3>
                <span className="text-[10px] font-black bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-full">Total: {myCodesList.length}</span>
              </div>

              <div className="overflow-x-auto -mx-6 px-6 no-scrollbar">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      <th className="pb-3 font-medium">Code</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Guest Name</th>
                      <th className="pb-3 font-medium">Instagram</th>
                      <th className="pb-3 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 text-xs font-bold text-zinc-800">
                    {myCodesList.map((row) => {
                      const isEditing = editingRow === row.code;
                      const isUsed = row.used_count > 0;

                      return (
                        <tr key={row.code} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="py-3.5 font-mono font-black text-sm tracking-tight text-zinc-900">{row.code}</td>
                          <td className="py-3.5">
                            {isUsed ? (
                              <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-md uppercase font-black">Used ✅</span>
                            ) : (
                              <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-md uppercase">Idle</span>
                            )}
                          </td>
                          <td className="py-3.5">
                            {isEditing ? (
                              <input 
                                type="text" 
                                value={tempGuestName}
                                onChange={(e) => setTempGuestName(e.target.value)}
                                className="bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:border-zinc-900 w-28"
                                placeholder="Name"
                              />
                            ) : (
                              <span onClick={() => handleStartEdit(row)} className="cursor-pointer border-b border-dashed border-zinc-300 pb-0.5 text-zinc-700 block min-w-[50px]">
                                {row.guest_name || '—'}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5">
                            {isEditing ? (
                              <input 
                                type="text" 
                                value={tempGuestInstagram}
                                onChange={(e) => setTempGuestInstagram(e.target.value)}
                                className="bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:border-zinc-900 w-24"
                                placeholder="@username"
                              />
                            ) : (
                              <span onClick={() => handleStartEdit(row)} className="cursor-pointer border-b border-dashed border-zinc-300 pb-0.5 text-zinc-500 block min-w-[50px]">
                                {row.guest_instagram ? `@${row.guest_instagram}` : '—'}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isEditing ? (
                                <button 
                                  onClick={() => handleSaveGuest(row.code)}
                                  className="p-2 bg-zinc-900 text-white rounded-lg active:scale-90 transition-all"
                                >
                                  <Save size={14} />
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleShareCode(row.code)}
                                  className="p-2 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 rounded-lg active:scale-90 transition-all"
                                >
                                  <Share2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {myCodesList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-400 font-medium">No codes generated for this event yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: STATS (КОНВЕРСИЯ ПРОМОУТЕРОВ) */}
        {activeTab === 'stats' && (
          <section className="bg-white rounded-[2rem] p-6 border border-zinc-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                {isAdmin ? 'All Promoters Standing' : 'My Performance Statistics'}
              </h3>
            </div>

            <div className="overflow-x-auto -mx-6 px-6 no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[400px]">
                <thead>
                  <tr className="border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="pb-3 font-medium">Promoter</th>
                    <th className="pb-3 font-medium text-center">Generated</th>
                    <th className="pb-3 font-medium text-center">Used</th>
                    <th className="pb-3 text-right font-medium">Conversion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 text-xs font-bold text-zinc-800">
                  {statsList.map((p, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-4 text-zinc-900 font-black">@{p.username || 'unknown'}</td>
                      <td className="py-4 text-center font-mono text-zinc-600">{p.codes_generated}</td>
                      <td className="py-4 text-center font-mono text-[#A50021]">{p.codes_used}</td>
                      <td className="py-4 text-right">
                        <span className="px-2.5 py-1 bg-zinc-900 text-white rounded-lg font-mono text-[11px] font-black">
                          {p.conversion || '0%'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {statsList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-zinc-400 font-medium">No conversion stats available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ЭТАПЫ 2-3: ЗАГЛУШКИ ДЛЯ АДМИН-ТАБОВ */}
        {(activeTab === 'users' || activeTab === 'broadcast' || activeTab === 'live') && (
          <section className="bg-white rounded-[2rem] p-12 border border-zinc-100 shadow-sm text-center space-y-3">
            <div className="w-16 h-16 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
              <Activity size={28} className="animate-pulse" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-wider text-zinc-900">Module Locked</h4>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-[240px] mx-auto">
              This panel tier is coming in Stage 2 & 3 updates. Stay tuned for real-time live metrics and multi-broadcast arrays.
            </p>
          </section>
        )}

      </main>
    </div>
  );
}
