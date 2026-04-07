import { Grid, Search, SlidersHorizontal, Sparkles, BadgeCheck, ChevronUp, History } from 'lucide-react';
import { Screen } from '../App';

export default function Tickets({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <div className="min-h-screen bg-background font-body text-on-background pb-32">
      <header className="bg-neutral-50/80 dark:bg-neutral-950/80 backdrop-blur-xl w-full sticky top-0 z-50 border-b border-neutral-200/10 dark:border-neutral-800/10 shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.05)]">
        <div className="flex items-center justify-between px-6 py-4 w-full">
          <div className="flex items-center gap-4">
            <button className="active:scale-95 duration-200 hover:opacity-80 transition-opacity">
              <Grid className="text-neutral-950 dark:text-neutral-50 w-6 h-6" />
            </button>
            <h1 className="font-headline font-bold tracking-tighter text-2xl text-neutral-950 dark:text-neutral-50">My Tickets</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-container overflow-hidden border border-white/20">
              <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_WZoK15uUITmrLJlCX8xZiDPyLHMyHSW3cKFdetIxR1TsWigsaFBv2KER-VvPxaKco-46hEFEr2fID7dH-ueD2H9-t6R63ObVwf7SZNugbUv7FScu1VLYiBY4u6AlGnJPYRyW-e9cIFXpPgb7654mDTMKfhlXLDmwpMucuakXF_I-rjh52ltTQLZG3eNMVk0HoS3eogKludwL6avTXmq0GGCamkOPx-7rUWo5zP9v4epekqRLShx63riPcAQBdK5t7-2st2XWXHCZ" alt="User" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-8 space-y-8">
        <div className="recessed-well bg-surface-container-low rounded-full px-6 py-4 flex items-center gap-3">
          <Search className="text-outline w-5 h-5" />
          <input className="bg-transparent border-none focus:outline-none text-sm w-full font-medium tracking-wide" placeholder="Search events..." type="text" />
          <SlidersHorizontal className="text-outline w-5 h-5" />
        </div>

        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="font-headline font-extrabold text-on-surface tracking-tight text-lg">Upcoming Events</h2>
            <span className="text-xs font-label uppercase tracking-widest text-outline">2 active</span>
          </div>

          <div className="glass-card rounded-xl overflow-hidden p-1">
            <div className="bg-surface-container-lowest rounded-[1.25rem] p-6 space-y-6 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="inline-block px-3 py-1 rounded-full bg-surface-container-high text-[10px] font-bold tracking-widest text-on-surface-variant">PENDING</span>
                  <h3 className="font-headline font-bold text-3xl tracking-tighter">UNITS FEST</h3>
                </div>
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-surface-container-low">
                  <Sparkles className="text-primary w-6 h-6" />
                </div>
              </div>
              <div className="flex items-center gap-8 py-2 border-y border-outline-variant/15">
                <div className="space-y-1">
                  <p className="text-[10px] font-label text-outline uppercase tracking-wider">Date</p>
                  <p className="font-bold text-sm">Oct 24, 2024</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-label text-outline uppercase tracking-wider">Location</p>
                  <p className="font-bold text-sm">Warsaw, 42 Floor</p>
                </div>
              </div>
              <button className="chrome-button w-full py-4 rounded-full text-white font-headline font-bold text-sm tracking-wide active:scale-95 transition-all duration-300">
                Check or Pay
              </button>
            </div>
          </div>

          <div className="glass-card rounded-xl overflow-hidden p-1">
            <div className="bg-surface-container-lowest rounded-[1.25rem] p-6 space-y-8 relative">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-block px-3 py-1 rounded-full bg-primary text-[10px] font-bold tracking-widest text-white">PAID</span>
                    <BadgeCheck className="text-primary w-4 h-4 fill-primary text-white" />
                  </div>
                  <h3 className="font-headline font-bold text-3xl tracking-tighter">NEON PULSE</h3>
                </div>
                <button className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low active:scale-90 transition-transform">
                  <ChevronUp className="text-primary w-6 h-6" />
                </button>
              </div>
              <div className="flex items-center gap-8 py-2">
                <div className="space-y-1">
                  <p className="text-[10px] font-label text-outline uppercase tracking-wider">Date</p>
                  <p className="font-bold text-sm">Nov 02, 2024</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-label text-outline uppercase tracking-wider">Venue</p>
                  <p className="font-bold text-sm">The Blue Room, Warsaw</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="recessed-well bg-surface-container-low rounded-xl aspect-square flex items-center justify-center p-8 border border-outline-variant/10">
                  <div className="w-full h-full rounded-lg bg-white p-4 shadow-sm flex items-center justify-center relative">
                    <img className="w-full h-full object-contain opacity-90" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTPTgRF4hu_8mp2vxIOav5umu9FIgdpq_I9K4HwjRT00kWtxDxBJkTR1TmuAZq7GAU5EgbT3Ag7zxq386olfzf_VFzi6e7SSJMWSd7PvE4Nm6ldHsu9ST-Wk1AiSWZYiGD8bqgyooopIJ-7ZPEujJsK38F6vPLL" alt="QR Code" />
                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-primary/20 shadow-[0_0_10px_rgba(0,0,0,0.2)]"></div>
                  </div>
                </div>
                <p className="text-center text-[10px] font-label text-outline uppercase tracking-[0.2em]">Scan at entrance • Section A-12</p>
              </div>

              <div className="flex items-center gap-2 py-4">
                <div className="h-4 w-4 rounded-full bg-background -ml-8 border-r border-outline-variant/10"></div>
                <div className="flex-1 border-t-2 border-dashed border-outline-variant/20"></div>
                <div className="h-4 w-4 rounded-full bg-background -mr-8 border-l border-outline-variant/10"></div>
              </div>
              <div className="flex justify-between items-center text-xs font-bold px-2">
                <span className="text-outline">TICKET ID</span>
                <span className="font-mono tracking-tighter">#NP-2024-X992-01</span>
              </div>
            </div>
          </div>
        </section>

        <section className="pt-4 pb-12">
          <button className="w-full py-4 bg-surface-container-low border border-outline-variant/10 rounded-full flex items-center justify-center gap-3 hover:bg-surface-container transition-colors">
            <History className="text-sm w-5 h-5" />
            <span className="text-xs font-bold tracking-widest uppercase">View Expired Tickets</span>
          </button>
        </section>
      </main>
    </div>
  );
}
