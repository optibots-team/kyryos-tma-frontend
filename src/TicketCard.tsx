// ============================================================
// types/tickets.ts — shared types used by both components
// ============================================================

export type TicketStatus = 'pending' | 'paid' | 'used'
export type UserRole     = 'user' | 'admin' | 'hostess'

export interface TicketWithEvent {
  id:                string
  status:            TicketStatus
  created_at:        string
  stripe_session_id: string | null
  tier: {
    name:  string
    price: number
    event: {
      title:      string
      event_date: string
      location:   string
    }
  }
}

export type ScanResult =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'success'; message: string }
  | { state: 'error';   message: string }
