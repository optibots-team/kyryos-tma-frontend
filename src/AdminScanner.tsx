// ============================================================
// components/AdminScanner.tsx
//
// Camera-based QR scanner for hostess/admin roles.
// Uses Telegram Native QR Scanner API.
// ============================================================

import { useState, useCallback, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import type { UserRole, ScanResult } from './types/tickets' 
// Если Vite настроен с алиасами, пути могут быть '@/lib/supabaseClient' и '@/types/tickets'

interface AdminScannerProps {
  userRole: UserRole
}

const CODE_REGEX = /^(KYR-[A-Z0-9]{8}|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

export function AdminScanner({ userRole }: AdminScannerProps) {
  // ── Guard: only render for privileged roles ───────────────
  if (userRole !== 'admin' && userRole !== 'hostess') {
    return null
  }

  return <ScannerView />
}

function ScannerView() {
  const [scanResult, setScanResult] = useState<ScanResult>({ state: 'idle' })

  // ── Ticket verification logic ─────────────────────────────
  const verifyTicket = useCallback(async (scannedCode: string) => {
    setScanResult({ state: 'loading' })

    try {
      const { data: ticket, error: fetchError } = await supabase
        .from('tickets')
        .select('id, status')
        .or(`id.eq.${scannedCode},ticket_code.eq.${scannedCode}`)
        .single()

      if (fetchError || !ticket) {
        setScanResult({ state: 'error', message: 'Ticket not found in database' })
        return
      }

      if (ticket.status === 'used') {
        setScanResult({ state: 'error', message: 'Already scanned — ticket was used previously' })
        return
      }

      if (ticket.status === 'pending') {
        setScanResult({ state: 'error', message: 'Payment not completed for this ticket' })
        return
      }

      if (ticket.status !== 'paid') {
        setScanResult({ state: 'error', message: `Unexpected ticket status: ${ticket.status}` })
        return
      }

      // Atomic update
      const { data: updated, error: updateError } = await supabase
        .from('tickets')
        .update({ status: 'used' })
        .eq('id', ticket.id)      
        .eq('status', 'paid')     
        .select('id')
        .single()

      if (updateError || !updated) {
        setScanResult({ state: 'error', message: 'Already scanned — ticket was just used by another scanner' })
        return
      }

      setScanResult({ state: 'success', message: '✓ Guest admitted' })

    } catch (err) {
      console.error('[AdminScanner] verifyTicket error:', err)
      setScanResult({ state: 'error', message: 'Network error — try again' })
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
      // Закрываем нативное окно сканера
      tg.closeScanQrPopup();

      if (!CODE_REGEX.test(decodedText.trim())) {
        setScanResult({ state: 'error', message: 'Invalid QR code format' });
        return true; 
      }

      verifyTicket(decodedText.trim());
      
      // Возвращаем true, чтобы Telegram знал, что мы обработали скан и окно можно закрыть
      return true; 
    });
  }

  // ── Auto-reset: clear success/error messages ──────────────
  useEffect(() => {
    if (scanResult.state === 'success' || scanResult.state === 'error') {
      const timer = setTimeout(() => {
        setScanResult({ state: 'idle' })
      }, 4000)
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
        <p className="text-white/80 font-medium">Checking database...</p>
      </div>
    )
  }

  if (result.state === 'success') {
    return (
      <div className="w-full px-5 py-6 rounded-2xl text-center bg-emerald-500/20 border border-emerald-500/40 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 mx-auto bg-emerald-500 rounded-full flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
          <span className="text-white text-3xl font-bold">✓</span>
        </div>
        <p className="text-emerald-400 font-bold text-xl">{result.message}</p>
      </div>
    )
  }

  return (
    <div className="w-full px-5 py-6 rounded-2xl text-center bg-red-500/20 border border-red-500/40 animate-in zoom-in-95 duration-200">
      <div className="w-16 h-16 mx-auto bg-red-500 rounded-full flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
        <span className="text-white text-3xl font-bold">✕</span>
      </div>
      <p className="text-red-400 font-bold text-lg">{result.message}</p>
    </div>
  )
}
