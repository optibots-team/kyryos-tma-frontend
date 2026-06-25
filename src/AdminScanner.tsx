// ============================================================
// components/AdminScanner.tsx
//
// Camera-based QR scanner for hostess/admin roles.
// Uses Telegram Native QR Scanner API.
// Updated to interact ONLY with Supabase Edge Function v5.
// ============================================================

import { useState, useCallback, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import type { UserRole, ScanResult } from './types/tickets' 

interface AdminScannerProps {
  userRole: UserRole
}

const CODE_REGEX = /^(KYR-[A-Z0-9]{6,15}|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

export function AdminScanner({ userRole }: AdminScannerProps) {
  // ── Guard: only render for privileged roles ───────────────
  if (userRole !== 'admin' && userRole !== 'hostess') {
    return null
  }

  return <ScannerView />
}

function ScannerView() {
  const [scanResult, setScanResult] = useState<ScanResult>({ state: 'idle' })

  // ── Ticket verification via Edge Function v5 ─────────────────
  const verifyTicket = useCallback(async (scannedCode: string) => {
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
        body: JSON.stringify({ ticket_code: scannedCode })
      });

      // Если Edge Function вернула ошибку уровня сервера (500, 403, 404)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setScanResult({ 
          state: 'error', 
          message: errData.error || errData.message || 'Verification failed on server' 
        });
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
        setScanResult({ 
          state: 'error', 
          message: result.error || result.message || 'Invalid or inactive ticket' 
        });
      }

    } catch (err) {
      console.error('[AdminScanner] Edge Function fetch error:', err);
      setScanResult({ state: 'error', message: 'Network error — try again' });
    }
  }, [])

  // ── Trigger Telegram Native Scanner ───────────────────────
  const handleOpenScanner = () => {
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
    if (scanResult.state === 'success' || scanResult.state === 'error') {
      const timer = setTimeout(() => {
        setScanResult({ state: 'idle' })
      }, 5000) // Увеличил до 5 секунд, чтобы хостес успела прочитать инфу про стрики и очки
      return () => clearTimeout(timer)
    }
  }, [scanResult.state])

  return (
    <div className="flex flex-col items-center justify-center gap-8 p-6 min-h-screen bg-gray-950">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-white font-bold text-2xl">Access Control</h1>
        <p className="text-white/40 text-sm mt-2">Use the built-in Telegram scanner to verify guest tickets.</p>
      </div>

      {/* ── Status Indicator ────────────────────────────────── */}
      <div className="w-full max-w-sm min-h-[100px] flex items-center justify-center">
        <ResultDisplay result={scanResult} />
      </div>

      {/* ── Action Button ───────────────────────────────────── */}
      <button
        onClick={handleOpenScanner}
        disabled={scanResult.state === 'loading'}
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

  return (
    <div className="w-full px-5 py-6 rounded-2xl text-center bg-red-500/20 border border-red-500/40 animate-in zoom-in-95 duration-200">
      <div className="w-16 h-16 mx-auto bg-red-500 rounded-full flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
        <span className="text-white text-3xl font-bold">✕</span>
      </div>
      <p className="text-red-400 font-bold text-base">{result.message}</p>
    </div>
  )
}
