import { Menu, ShoppingBag, Image as ImageIcon } from 'lucide-react';
import { Screen } from '../App';

export default function Gallery({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-neutral-50/80 dark:bg-neutral-900/80 backdrop-blur-xl flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-4">
        </div>
        <h1 className="text-lg font-black tracking-[0.2em] text-neutral-950 dark:text-neutral-50 font-headline uppercase">WARSAW</h1>
        <div className="flex items-center gap-4">
          <button className="text-neutral-950 dark:text-neutral-50 active:scale-95 duration-200 transition-opacity hover:opacity-70">
            <ShoppingBag className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-5xl mx-auto">
        <div className="mb-12 text-center">
          <h2 className="font-headline font-extrabold text-5xl tracking-tighter uppercase mb-2">Gallery</h2>
          <p className="font-body text-sm text-on-surface-variant tracking-widest uppercase">The Archive 2024</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-[1rem] shadow-sm mb-4 bg-surface-container-high etched-well aspect-[4/5]">
              <img alt="SOLSTICE RAVE" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD6i4yXDukWt41YnRsBtKsoQKf0wHhI4NEoSKZakCZ5LHvMfjcvbEvzpXGiGdphl75OuYc5lBpA2MxLZKAY41bnBgPjU9umhouXYYiEIy1AgAJe-ZUWz_mjAow0q_i2E1T_Z6S6b_cNSpW6_3JRGixJPUi9tc1Rf9NsrrsUJwVgo84E1F5mvtpqEbBm_B0P_xNaiLJK9rjlyClbfwiQQ8RXk_EfdjZxCT2UE2RacjB1PYy63JGtqWtQE0U3ffXaqudl7NbZ3dHrhYI6" />
              <div className="absolute top-4 right-4 glass-card px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-white/20">
                <ImageIcon className="w-4 h-4" />
                <span className="text-[10px] font-bold tracking-tight">24</span>
              </div>
            </div>
            <div className="px-1">
              <h3 className="font-headline font-bold text-xl tracking-tight text-on-surface">SOLSTICE RAVE</h3>
              <p className="font-body text-xs text-on-surface-variant uppercase tracking-[0.15em] mt-1">JUNE 21, 2024</p>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-[1rem] shadow-sm mb-4 bg-surface-container-high etched-well aspect-[4/5]">
              <img alt="TECHNO BUNKER" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAO9UCxjZAjxZ1LLXhwlAkri7pE8_vxCmxmdrXdN0zuZCqsK5gA1z531SOuKH0tisgdKKF0-Fk5hMue0ShqhKjMj7mmj2J1vkN5XHlXBOlhQ1vsC2oshd4uC-pMJ_B5aOTVPpeNtiYf0Akla7jYCnQQLxWY78MLIlpAejQG6CX_Z1kXMHAXjpIiVMpciUzYyJ2YNb7eQV5GG8Z0P9elFK81pK8CD8ylYZ-7HqUZ32-m0zqf_aoTpE9gm84VJJn65e5ifo72-_892qGD" />
              <div className="absolute top-4 right-4 glass-card px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-white/20">
                <ImageIcon className="w-4 h-4" />
                <span className="text-[10px] font-bold tracking-tight">18</span>
              </div>
            </div>
            <div className="px-1">
              <h3 className="font-headline font-bold text-xl tracking-tight text-on-surface">TECHNO BUNKER</h3>
              <p className="font-body text-xs text-on-surface-variant uppercase tracking-[0.15em] mt-1">MAY 12, 2024</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
