import { ArrowLeft, Edit2, Star, ChevronRight, User, Bell, CreditCard, Shield, Info, LogOut } from 'lucide-react';
import { Screen } from '../App';

export default function Profile({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <>
      <header className="bg-[#f9f9f9] dark:bg-neutral-950 flex items-center justify-between px-6 py-4 w-full top-0 sticky z-40">
        <button onClick={() => onNavigate('events')} className="hover:opacity-80 transition-opacity active:scale-95 duration-200">
          <ArrowLeft className="text-black dark:text-white w-6 h-6" />
        </button>
        <h1 className="font-headline font-bold tracking-tight text-on-surface text-lg text-black dark:text-white">Profile</h1>
        <div className="w-6"></div>
      </header>

      <main className="px-6 pb-32 pt-8 max-w-md mx-auto">
        <section className="flex flex-col items-center mb-10">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-surface-container-high to-surface-container-lowest overflow-hidden shadow-xl">
              <img alt="User Profile" className="w-full h-full object-cover rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBvf75dpU3Jh2sTAuV6CZKGpfhKF9FXQxY3TEOzi1SJ3-1F8XQsbCcbPMu6K36Htx5x6iiWpFVzjkSjb2aiKYYjzljqQ9jzAdMYoDZFyr9KubHb0tTlxf64DpLS_DgyXUh9YdE6eV70-C35-c1HG2vkaL2LMTAqQ06-qKYrkghpuUz2fANjBK77CdjOLahKfJLiQyTmiS5Mq4SJiGw1f45YJui0dX6g51x1kXiwNaakVMAGDVdstoScQ2D2GQhSTovO98VHgknHb101" />
            </div>
            <div className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full shadow-lg border-2 border-white">
              <Edit2 className="w-4 h-4" />
            </div>
          </div>
          <h2 className="mt-4 font-headline font-extrabold text-2xl tracking-tight text-on-surface">Alexandru Mihai</h2>
          <p className="text-secondary-fixed-dim text-sm font-medium tracking-wide">ID: KY-8821-WRSW</p>
        </section>

        <section className="mb-8">
          <button className="w-full bg-primary py-5 px-6 rounded-xl flex items-center justify-between group overflow-hidden relative shadow-2xl transition-all duration-300 active:scale-95">
            <div className="flex items-center gap-4 z-10">
              <div className="gold-gradient p-2 rounded-full shadow-inner flex items-center justify-center">
                <Star className="text-white w-5 h-5 fill-white" />
              </div>
              <span className="text-white font-headline font-bold text-lg tracking-tight">Become a Partner</span>
            </div>
            <ChevronRight className="text-white/50 w-6 h-6 group-hover:translate-x-1 transition-transform z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          </button>
        </section>

        <section className="bg-surface-container-lowest rounded-xl p-2 shadow-sm mb-8">
          <div className="flex flex-col">
            {[
              { icon: User, label: 'Personal Information' },
              { icon: Bell, label: 'Notification Preferences' },
              { icon: CreditCard, label: 'Payment Methods' },
              { icon: Shield, label: 'Privacy & Security' },
              { icon: Info, label: 'About Kyryos' },
            ].map((item, i) => (
              <button key={i} className="flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors rounded-lg group">
                <div className="flex items-center gap-4">
                  <item.icon className="text-on-surface-variant w-6 h-6" />
                  <span className="font-medium text-on-surface">{item.label}</span>
                </div>
                <ChevronRight className="text-outline-variant w-5 h-5 group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4 mb-8">
          <h3 className="text-[10px] uppercase tracking-widest font-bold text-secondary-fixed-dim px-2">Application Language</h3>
          <div className="flex p-1.5 bg-surface-container-high rounded-full w-full max-w-[280px]">
            <button className="flex-1 py-2 rounded-full gold-gradient shadow-lg text-white font-bold text-sm transition-all chrome-edge-top">EN</button>
            <button className="flex-1 py-2 rounded-full text-secondary-fixed-dim font-bold text-sm hover:text-on-surface transition-colors">PL</button>
            <button className="flex-1 py-2 rounded-full text-secondary-fixed-dim font-bold text-sm hover:text-on-surface transition-colors">DE</button>
          </div>
        </section>

        <section>
          <button className="w-full flex items-center justify-center gap-2 text-error py-4 font-bold tracking-tight hover:bg-error-container/20 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </section>
      </main>
    </>
  );
}
