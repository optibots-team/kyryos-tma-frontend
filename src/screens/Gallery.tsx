import { Image as ImageIcon } from 'lucide-react';
import { Screen } from '../App';

export default function Gallery({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <div className="min-h-screen bg-slate-50 pb-32">
     <header className="w-full sticky top-0 z-50 bg-zinc-280/70 backdrop-blur-xl flex items-center justify-center px-6 pt-6.5 pb-2 border-b border-zinc-400/30">
  <img 
    src="/logo.png" 
    alt="Kyrios Logo" 
    className="h-[55px] w-auto object-contain" 
  />
</header>

      <main className="pt-8 pb-32 px-6 max-w-5xl mx-auto">
        <div className="mb-12 text-center">
          <h2 className="font-headline font-extrabold text-4xl tracking-tighter uppercase mb-2 text-zinc-900">Gallery</h2>
          <p className="font-body text-xs text-zinc-500 tracking-widest uppercase">The Archive 2024</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-[2rem] shadow-lg shadow-zinc-200/50 mb-4 bg-zinc-100 aspect-[4/5]">
              <img alt="SOLSTICE RAVE" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD6i4yXDukWt41YnRsBtKsoQKf0wHhI4NEoSKZakCZ5LHvMfjcvbEvzpXGiGdphl75OuYc5lBpA2MxLZKAY41bnBgPjU9umhouXYYiEIy1AgAJe-ZUWz_mjAow0q_i2E1T_Z6S6b_cNSpW6_3JRGixJPUi9tc1Rf9NsrrsUJwVgo84E1F5mvtpqEbBm_B0P_xNaiLJK9rjlyClbfwiQQ8RXk_EfdjZxCT2UE2RacjB1PYy63JGtqWtQE0U3ffXaqudl7NbZ3dHrhYI6" />
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-white/30 text-white">
                <ImageIcon className="w-4 h-4" />
                <span className="text-[10px] font-bold tracking-tight">24</span>
              </div>
            </div>
            <div className="px-2">
              <h3 className="font-headline font-bold text-xl tracking-tight text-zinc-900">SOLSTICE RAVE</h3>
              <p className="font-body text-xs text-zinc-500 uppercase tracking-[0.15em] mt-1">JUNE 21, 2024</p>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-[2rem] shadow-lg shadow-zinc-200/50 mb-4 bg-zinc-100 aspect-[4/5]">
              <img alt="TECHNO BUNKER" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAO9UCxjZAjxZ1LLXhwlAkri7pE8_vxCmxmdrXdN0zuZCqsK5gA1z531SOuKH0tisgdKKF0-Fk5hMue0ShqhKjMj7mmj2J1vkN5XHlXBOlhQ1vsC2oshd4uC-pMJ_B5aOTVPpeNtiYf0Akla7jYCnQQLxWY78MLIlpAejQG6CX_Z1kXMHAXjpIiVMpciUzYyJ2YNb7eQV5GG8Z0P9elFK81pK8CD8ylYZ-7HqUZ32-m0zqf_aoTpE9gm84VJJn65e5ifo72-_892qGD" />
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-white/30 text-white">
                <ImageIcon className="w-4 h-4" />
                <span className="text-[10px] font-bold tracking-tight">18</span>
              </div>
            </div>
            <div className="px-2">
              <h3 className="font-headline font-bold text-xl tracking-tight text-zinc-900">TECHNO BUNKER</h3>
              <p className="font-body text-xs text-zinc-500 uppercase tracking-[0.15em] mt-1">MAY 12, 2024</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
