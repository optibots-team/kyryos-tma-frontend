// ============================================================
// components/AdminScanner.tsx
//
// Camera-based QR scanner for hostess/admin roles.
// Uses Telegram Native QR Scanner API.
// Updated to interact ONLY with Supabase Edge Function v5.
// 🔒 КРИТИЧНО: теперь передаёт event_id — бэкенд отклоняет билет,
// если он куплен на другое мероприятие (не то, что сейчас сканируется).
// ============================================================

import { useState, useCallback, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'

type UserRole = string | null;

type ScanState = 'idle' | 'loading' | 'success' | 'error' | 'wrong_event';

interface ScanResult {
  state: ScanState;
  message?: string;
}

interface EventOption {
  id: string;
  title: string;
  event_date: string;
}

interface AdminScannerProps {
  userRole: UserRole
}

const CODE_REGEX = /^(KYR-[A-Z0-9]{6,15}|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

const SELECTED_EVENT_STORAGE_KEY = 'kyrios_scanner_event_id';

export function AdminScanner({ userRole }: AdminScannerProps) {
  // ── Guard: only render for privileged roles ───────────────
  if (userRole !== 'admin' && userRole !== 'hostess') {
    return null
  }

  return <ScannerView />
}

function ScannerView() {
  const [scanResult, setScanResult] = useState<ScanResult>({ state: 'idle' })

  // ── 🔒 Выбор мероприятия, для которого идёт сканирование ──
  const [events, setEvents] = useState<EventOption[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [selectedEventId, setSelectedEventId] = useState<string>(
    () => localStorage.getItem(SELECTED_EVENT_STORAGE_KEY) || ''
  )

  useEffect(() => {
    async function fetchEvents() {
      setLoadingEvents(true)
      try {
        const { data } = await supabase
          .from('active_events')
          .select('id, title, event_date')
          .order('event_date', { ascending: true })

        if (data) {
          setEvents(data)
          // Если сохранённого выбора нет или его больше нет среди активных — берём первый попавшийся
          setSelectedEventId(prev => (prev && data.some((e: EventOption) => e.id === prev)) ? prev : (data[0]?.id || ''))
        }
      } catch (err) {
        console.error('[AdminScanner] Failed to fetch events:', err)
      } finally {
        setLoadingEvents(false)
      }
    }
    fetchEvents()
  }, [])

  const handleEventChange = (id: string) => {
    setSelectedEventId(id)
    localStorage.setItem(SELECTED_EVENT_STORAGE_KEY, id)
  }

  // ── Ticket verification via Edge Function v5 ─────────────────
  const verifyTicket = useCallback(async (scannedCode: string) => {
    if (!selectedEventId) {
      setScanResult({ state: 'error', message: 'Select an event before scanning' })
      return
    }

    setScanResult({ state: 'loading' })

    try {
      // Динамически получаем URL твоего Supabase проекта из клиента
      const supabaseUrl = (supabase as any).supabaseUrl; 

      const res = await fetch(`${supabaseUrl}/functions/v1/scan-ticket`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Если на бэкенде включена базовая авторизация для Edge Functions, 
          // передаем анонимный ключ клиента
          'Authorization': `Bearer ${(supabase as any).supabaseKey}`
        },
        body: JSON.stringify({
          ticket_code: scannedCode,
          init_data: window.Telegram?.WebApp?.initData || '',
          event_id: selectedEventId, // 🔒 НОВОЕ обязательное поле
        })
      });

      // Если Edge Function вернула ошибку уровня сервера (500, 403, 404)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg: string = errData.error || errData.message || 'Verification failed on server';
        setScanResult(buildErrorResult(errMsg));
        return;
      }

      const result = await res.json();

      if (result.success) {
        // Формируем красивое сообщение об успехе с инфой про поинты и стрик
        let successMessage = `✓ Admitted. Earned: +${result.points_earned} pts`;
        if (result.streak_bonus) {
          successMessage += ' 🔥 STREAK BONUS!';
        } else if (result.streak_count > 1) {
          successMessage += ` (Streak: ${result.streak_count})`;
        }

        setScanResult({ 
          state: 'success', 
          message: successMessage 
        });
      } else {
        const errMsg: string = result.error || result.message || 'Invalid or inactive ticket';
        setScanResult(buildErrorResult(errMsg));
      }

    } catch (err) {
      console.error('[AdminScanner] Edge Function fetch error:', err);
      setScanResult({ state: 'error', message: 'Network error — try again' });
    }
  }, [selectedEventId])

  // ── Trigger Telegram Native Scanner ───────────────────────
  const handleOpenScanner = () => {
    if (!selectedEventId) {
      setScanResult({ state: 'error', message: 'Select an event before scanning' })
      return
    }

    setScanResult({ state: 'idle' });

    const tg = window.Telegram?.WebApp;
    
    if (!tg || !tg.showScanQrPopup) {
      setScanResult({ state: 'error', message: 'Telegram scanner is not available in this environment' });
      return;
    }

    tg.showScanQrPopup({ text: 'Point camera at guest QR code' }, (decodedText: string) => {
      tg.closeScanQrPopup();

      const cleanCode = decodedText.trim().toUpperCase();

      if (!CODE_REGEX.test(cleanCode)) {
        setScanResult({ state: 'error', message: 'Invalid QR code format' });
        return true; 
      }

      verifyTicket(cleanCode);
      return true; 
    });
  }

  // ── Auto-reset: clear success/error messages ──────────────
  useEffect(() => {
    if (scanResult.state === 'success' || scanResult.state === 'error' || scanResult.state === 'wrong_event') {
      const timer = setTimeout(() => {
        setScanResult({ state: 'idle' })
      }, 5000) // Увеличил до 5 секунд, чтобы хостес успела прочитать инфу про стрики и очки
      return () => clearTimeout(timer)
    }
  }, [scanResult.state])

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-6 min-h-screen bg-gray-950">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-white font-bold text-2xl">Access Control</h1>
        <p className="text-white/40 text-sm mt-2">Use the built-in Telegram scanner to verify guest tickets.</p>
      </div>

      {/* ── 🔒 Выбор мероприятия — обязателен перед сканированием ── */}
      <div className="w-full max-w-sm space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1">
          Scanning for event
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => handleEventChange(e.target.value)}
          disabled={loadingEvents || events.length === 0}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold text-white focus:outline-none disabled:opacity-50"
        >
          {loadingEvents && <option>Loading events...</option>}
          {!loadingEvents && events.length === 0 && <option>No active events</option>}
          {events.map(ev => (
            <option key={ev.id} value={ev.id} className="bg-gray-900">
              {new Date(ev.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} — {ev.title}
            </option>
          ))}
        </select>
        {selectedEvent && (
          <p className="text-[10px] text-[#D4AF37] font-bold px-1">
            Scanning entries for: {selectedEvent.title}
          </p>
        )}
      </div>

      {/* ── Status Indicator ────────────────────────────────── */}
      <div className="w-full max-w-sm min-h-[100px] flex items-center justify-center">
        <ResultDisplay result={scanResult} />
      </div>

      {/* ── Action Button ───────────────────────────────────── */}
      <button
        onClick={handleOpenScanner}
        disabled={scanResult.state === 'loading' || !selectedEventId}
        className="
          w-full max-w-xs py-4 rounded-2xl
          bg-[#D4AF37] text-black font-bold text-lg shadow-[0_4px_16px_rgba(212,175,55,0.4)]
          active:scale-95 transition-all disabled:opacity-50
        "
      >
        {scanResult.state === 'loading' ? 'Verifying...' : 'OPEN SCANNER'}
      </button>
    </div>
  )
}

// ---- Helpers -----------------------------------------

// 🔒 Отдельно распознаём ошибку "не то мероприятие" (бэкенд присылает текст вида
// `Wrong event: this ticket is for "PADEL BANDA Babylon"`) — она визуально должна
// отличаться от "уже использован"/обычной ошибки, чтобы охрана сразу понимала:
// человек перепутал день, а не пытается пройти повторно.
function buildErrorResult(message: string): ScanResult {
  if (/wrong event/i.test(message)) {
    return { state: 'wrong_event', message };
  }
  return { state: 'error', message };
}

// ---- Sub-components -----------------------------------------

function ResultDisplay({ result }: { result: ScanResult }) {
  if (result.state === 'idle') {
    return (
      <div className="px-6 py-4 rounded-2xl border border-white/10 bg-white/5 w-full text-center">
        <p className="text-white/50 font-medium">Ready for next guest</p>
      </div>
    )
  }

  if (result.state === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
        <p className="text-white/80 font-medium">Processing via Edge Function...</p>
      </div>
    )
  }

  if (result.state === 'success') {
    return (
      <div className="w-full px-5 py-6 rounded-2xl text-center bg-emerald-500/20 border border-emerald-500/40 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 mx-auto bg-emerald-500 rounded-full flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
          <span className="text-white text-3xl font-bold">✓</span>
        </div>
        <p className="text-emerald-400 font-bold text-lg whitespace-pre-line">{result.message}</p>
      </div>
    )
  }

  // 🔒 Отдельный жёлтый/янтарный стиль для "не то мероприятие" — принципиально
  // отличается от красного "уже использован"/ошибки, чтобы не путать охрану
  if (result.state === 'wrong_event') {
    return (
      <div className="w-full px-5 py-6 rounded-2xl text-center bg-amber-500/20 border-2 border-amber-400/60 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 mx-auto bg-amber-500 rounded-full flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
          <span className="text-white text-3xl font-bold">⚠</span>
        </div>
        <p className="text-amber-300 font-black text-sm uppercase tracking-widest mb-1">Wrong Event</p>
        <p className="text-amber-200 font-bold text-base">{result.message}</p>
      </div>
    )
  }

  return (
    <div className="w-full px-5 py-6 rounded-2xl text-center bg-red-500/20 border border-red-500/40 animate-in zoom-in-95 duration-200">
      <div className="w-16 h-16 mx-auto bg-red-500 rounded-full flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
        <span className="text-white text-3xl font-bold">✕</span>
      </div>
      <p className="text-red-400 font-bold text-base">{result.message}</p>
    </div>
  )
}
