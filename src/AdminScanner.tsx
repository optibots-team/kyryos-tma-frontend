// ============================================================
// components/AdminScanner.tsx
//
// Camera-based QR scanner for hostess/admin roles.
// Scans ticket UUIDs and updates their status via Supabase.
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5QrcodeScanner, Html5QrcodeScanType }  from 'html5-qrcode'
import { supabase }                                  from '@/lib/supabaseClient'
import type { UserRole, ScanResult }                 from '@/types/tickets'

interface AdminScannerProps {
  userRole: UserRole
}

// UUID v4 regex — rejects obviously invalid QR payloads immediately
// Этот regex пропускает и новые коды KYR-XXXXXXXX, и старые UUID
const CODE_REGEX = /^(KYR-[A-Z0-9]{8}|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

const SCAN_DEBOUNCE_MS = 2000   // prevent accidental double-scans
const SCANNER_ELEMENT_ID = 'admin-qr-scanner'

export function AdminScanner({ userRole }: AdminScannerProps) {

  // ── Guard: only render for privileged roles ───────────────
  if (userRole !== 'admin' && userRole !== 'hostess') {
    return null
  }

  return <ScannerView />
}

// ---- Inner component (role already verified above) ----------

function ScannerView() {
  const [scanResult, setScanResult] = useState<ScanResult>({ state: 'idle' })
  const [isScanning, setIsScanning] = useState(true)

  const scannerRef      = useRef<Html5QrcodeScanner | null>(null)
  const lastScanTimeRef = useRef<number>(0)
  const isProcessingRef = useRef(false)

  // ── Ticket verification logic ─────────────────────────────
  const verifyTicket = useCallback(async (uuid: string) => {
    setScanResult({ state: 'loading' })

    try {
      // Step 1: Fetch the current ticket state
      const { data: ticket, error: fetchError } = await supabase
        .from('tickets')
        .select('id, status')
        .eq('id', uuid)
        .single()

      if (fetchError || !ticket) {
        setScanResult({ state: 'error', message: 'Ticket not found in database' })
        return
      }

      // Step 2: Branch on current status
      if (ticket.status === 'used') {
        setScanResult({
          state:   'error',
          message: 'Already scanned — ticket was used previously',
        })
        return
      }

      if (ticket.status === 'pending') {
        setScanResult({
          state:   'error',
          message: 'Payment not completed for this ticket',
        })
        return
      }

      if (ticket.status !== 'paid') {
        setScanResult({
          state:   'error',
          message: `Unexpected ticket status: ${ticket.status}`,
        })
        return
      }

      // Step 3: Status is 'paid' — attempt to mark as 'used'.
      // The RLS hostess policy enforces: paid → used only.
      // The .eq('status', 'paid') guard prevents race conditions
      // where two scanners hit the same ticket simultaneously.
      const { data: updated, error: updateError } = await supabase
        .from('tickets')
        .update({ status: 'used' })
        .eq('id', uuid)
        .eq('status', 'paid')     // atomic guard against double-scan race
        .select('id')
        .single()

      if (updateError || !updated) {
        // If another scanner beat us to it, the row was already updated
        setScanResult({
          state:   'error',
          message: 'Already scanned — ticket was just used by another scanner',
        })
        return
      }

      setScanResult({
        state:   'success',
        message: '✓ Guest admitted',
      })

    } catch (err) {
      console.error('[AdminScanner] verifyTicket error:', err)
      setScanResult({ state: 'error', message: 'Network error — try again' })
    } finally {
      isProcessingRef.current = false
    }
  }, [])

  // ── QR scan callback (called by html5-qrcode on each frame) ─
  const onScanSuccess = useCallback((decodedText: string) => {
    const now = Date.now()

    // Debounce: ignore scans within 2 seconds of the last one
    if (now - lastScanTimeRef.current < SCAN_DEBOUNCE_MS) return

    // Prevent concurrent processing
    if (isProcessingRef.current) return

    // Validate UUID format before hitting the DB
    if (!UUID_REGEX.test(decodedText.trim())) {
      setScanResult({
        state:   'error',
        message: 'Invalid QR code — not a ticket',
      })
      lastScanTimeRef.current = now
      return
    }

    lastScanTimeRef.current = now
    isProcessingRef.current = true

    verifyTicket(decodedText.trim())
  }, [verifyTicket])

  // ── Scanner lifecycle ─────────────────────────────────────
  useEffect(() => {
    if (!isScanning) return

    // Reset result when scanner restarts
    setScanResult({ state: 'idle' })

    const scanner = new Html5QrcodeScanner(
      SCANNER_ELEMENT_ID,
      {
        fps:                  10,
        qrbox:                { width: 240, height: 240 },
        aspectRatio:          1.0,
        supportedScanTypes:   [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        showTorchButtonIfSupported: true,
        videoConstraints: {
          facingMode: 'environment',   // rear camera on mobile
        },
      },
      /* verbose */ false
    )

    scanner.render(onScanSuccess, (errorMessage) => {
      // QR not found in frame — this fires constantly, suppress noise
      if (!errorMessage.includes('No MultiFormat Readers')) {
        console.debug('[AdminScanner] scan frame error:', errorMessage)
      }
    })

    scannerRef.current = scanner

    return () => {
      scanner.clear().catch(console.error)
      scannerRef.current = null
    }
  }, [isScanning, onScanSuccess])

  // ── Auto-reset: return to scanning after success/error ────
  useEffect(() => {
    if (scanResult.state === 'success' || scanResult.state === 'error') {
      const timer = setTimeout(() => {
        setScanResult({ state: 'idle' })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [scanResult.state])

  return (
    <div className="flex flex-col items-center gap-5 p-4 min-h-screen bg-gray-950">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="w-full max-w-sm">
        <h1 className="text-white font-bold text-xl text-center">
          Ticket Scanner
        </h1>
        <p className="text-white/40 text-sm text-center mt-1">
          Point camera at guest QR code
        </p>
      </div>

      {/* ── Camera viewport ────────────────────────────────── */}
      <div className="relative w-full max-w-sm">
        <div
          className="
            overflow-hidden rounded-2xl
            ring-1 ring-white/10
            bg-black
          "
        >
          {/* html5-qrcode mounts into this div */}
          <div id={SCANNER_ELEMENT_ID} className="w-full" />
        </div>

        {/* Corner brackets overlay for scan area feel */}
        <ScannerCorners />
      </div>

      {/* ── Result feedback ────────────────────────────────── */}
      <div className="w-full max-w-sm min-h-[80px] flex items-center justify-center">
        <ResultDisplay result={scanResult} />
      </div>

      {/* ── Manual reset button ────────────────────────────── */}
      {(scanResult.state === 'success' || scanResult.state === 'error') && (
        <button
          onClick={() => {
            setScanResult({ state: 'idle' })
            isProcessingRef.current = false
          }}
          className="
            px-6 py-2.5 rounded-xl
            bg-white/10 text-white text-sm font-medium
            hover:bg-white/20 active:scale-95
            transition-all duration-150
          "
        >
          Scan next ticket
        </button>
      )}

    </div>
  )
}

// ---- Sub-components -----------------------------------------

function ResultDisplay({ result }: { result: ScanResult }) {
  if (result.state === 'idle') {
    return (
      <p className="text-white/30 text-sm text-center">
        Ready to scan
      </p>
    )
  }

  if (result.state === 'loading') {
    return (
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        <p className="text-white/60 text-sm">Verifying ticket…</p>
      </div>
    )
  }

  if (result.state === 'success') {
    return (
      <div
        className="
          w-full px-5 py-4 rounded-2xl text-center
          bg-emerald-500/15 border border-emerald-500/30
          animate-in fade-in slide-in-from-bottom-2 duration-300
        "
      >
        <p className="text-emerald-300 font-bold text-2xl mb-1">✓</p>
        <p className="text-emerald-300 font-semibold text-base">
          {result.message}
        </p>
      </div>
    )
  }

  // state === 'error'
  return (
    <div
      className="
        w-full px-5 py-4 rounded-2xl text-center
        bg-red-500/15 border border-red-500/30
        animate-in fade-in slide-in-from-bottom-2 duration-300
      "
    >
      <p className="text-red-400 font-bold text-2xl mb-1">✕</p>
      <p className="text-red-400 font-semibold text-sm">
        {result.message}
      </p>
    </div>
  )
}

function ScannerCorners() {
  const cornerClass = 'absolute w-7 h-7 border-white/60'
  return (
    <>
      <div className={`${cornerClass} top-3 left-3 border-t-2 border-l-2 rounded-tl-lg`} />
      <div className={`${cornerClass} top-3 right-3 border-t-2 border-r-2 rounded-tr-lg`} />
      <div className={`${cornerClass} bottom-3 left-3 border-b-2 border-l-2 rounded-bl-lg`} />
      <div className={`${cornerClass} bottom-3 right-3 border-b-2 border-r-2 rounded-br-lg`} />
    </>
  )
}
