import { Menu, Bell, ArrowRight, QrCode, Calendar } from 'lucide-react';
import { Screen } from '../App';

export default function Events({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <>
      <header className="fixed top-0 left-0 w-full z-40 flex items-center justify-between px-6 h-16 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-4">
          <button className="text-zinc-900 hover:opacity-80 transition-opacity active:scale-95 duration-200">
            <Menu className="w-6 h-6" />
          </button>
        </div>
        <div className="font-headline font-black text-2xl tracking-[0.2em] text-zinc-950 uppercase">KYRYOS</div>
        <div className="flex items-center gap-4">
          <button className="text-zinc-900 hover:opacity-80 transition-opacity active:scale-95 duration-200">
            <Bell className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-5xl mx-auto space-y-12">
        <section className="relative group cursor-pointer" onClick={() => onNavigate('event-details')}>
          <div className="relative w-full aspect-[4/5] md:aspect-[16/9] rounded-xl overflow-hidden shadow-2xl transition-transform duration-700 hover:scale-[1.01]">
            <img alt="Unitis Fest" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9EvTVmKAoRm1Mh4tdQWPo2cRjhtodBkkAAGXB2TIS0CAraIf2P3kWc9-XBG5sCizKNC5lE6TQMQjWxtih4YU2uQX10HvIUIDO8K7F_5MNB67PAdiI-4P1V25uKnoHzH4xRmAyaci67nDvQk2BV3CjNNKvcBpeukheSHmwT5NPIVAgTmF0KKdSFTPgZAHA_QSDc6lmo_O34vzvhPWmu8AWVwrf2sIHm4rFx42umHynewnXoIM3o0pRFVuc4NJccJvwft1_E_MgoN0s" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-8 md:p-12">
              <div className="glass-card-strong p-8 rounded-xl border border-white/20 max-w-xl self-start">
                <span className="font-label text-xs tracking-widest uppercase text-white/80 mb-2 block">Featured Experience</span>
                <h1 className="font-headline font-black text-4xl md:text-6xl text-white tracking-tighter mb-6">UNITIS FEST</h1>
                
                <div className="space-y-2 mb-8">
                  <div className="flex justify-between items-end mb-1">
                    <span className="font-label text-[10px] tracking-widest text-white/70 uppercase">Event Capacity</span>
                    <span className="font-headline font-bold text-white text-sm">58 / 200</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full chrome-button w-[29%] rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)]"></div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <button className="chrome-button-alt text-white px-8 py-4 rounded-full font-headline font-bold text-sm tracking-widest uppercase shadow-xl hover:opacity-90 active:scale-95 transition-all">
                    from 200 PLN
                  </button>
                  <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 py-4 rounded-full font-label text-xs tracking-widest uppercase hover:bg-white/20 active:scale-95 transition-all">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-surface-container-lowest rounded-xl p-8 flex flex-col justify-between min-h-[400px] shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <img alt="Nightlife" className="w-full h-full object-cover grayscale opacity-20" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_lVxn1kfjbJbrU7D6kL0cSe9iL3QnNw6nnsbcmBwVfUu_MW7tLoW6ZOz8v3F8jkmeW9BUEB1d3oKwnPUqpfdF2VlnV0uN9FACUvxZWP-PxVCIwgy8bBSfHaAOAZn4i9OASyj9jbaaWBabEdB7h_Bvyi0C-YyQBxnmHMjzjamF3KRZp5nw22aGlgfyoHV7gMEIRF8N0D_yrdRfPfC37wdN-N8rnK6WQZDjALwT1LoVj13DowxTWLXvqNnuyTV9UZe2-tKGt9fl61Ng" />
            </div>
            <div className="relative z-10">
              <h2 className="font-headline font-extrabold text-3xl tracking-tight text-on-surface">Private Sessions</h2>
              <p className="font-body text-secondary mt-2 max-w-xs">Curated boutique experiences for the discerning collector.</p>
            </div>
            <div className="relative z-10 mt-12 flex justify-between items-end">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full border-2 border-surface bg-surface-container-high"></div>
                <div className="w-10 h-10 rounded-full border-2 border-surface bg-zinc-300"></div>
                <div className="w-10 h-10 rounded-full border-2 border-surface bg-zinc-400 flex items-center justify-center text-[10px] font-bold">+12</div>
              </div>
              <button className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white hover:scale-110 active:scale-90 transition-all">
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-surface-container-high rounded-xl p-6 h-1/2 flex flex-col justify-center items-center text-center recessed-well-deep">
              <QrCode className="text-primary w-10 h-10 mb-4" />
              <h3 className="font-headline font-bold text-sm tracking-widest uppercase">Quick Check-in</h3>
            </div>
            <div className="bg-white rounded-xl p-6 h-1/2 flex flex-col justify-center shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="text-zinc-400 w-5 h-5" />
                <span className="font-label text-[10px] tracking-[0.2em] uppercase text-zinc-500">Aug 24, 2024</span>
              </div>
              <h3 className="font-headline font-bold text-lg leading-tight">Silver Linings Gallery Opening</h3>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="font-headline font-black text-2xl tracking-tight">VIRTUAL GALLERY</h2>
            <button onClick={() => onNavigate('gallery')} className="font-label text-[10px] font-bold tracking-widest uppercase text-zinc-400 hover:text-primary transition-colors">Enter Meta</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "https://lh3.googleusercontent.com/aida-public/AB6AXuDOH_k05uOHdYXxNqL7CrZ464TNDyobN9MUkrFkYv0IjQL8kof9p8ngzV9Dh_db2rYAijkVCUvbqud-uL1qDscTA8I5yR3YkYQmpuGqsFXApF44TCOQdjR4uIrwaaBhGzvpLGDrgbJkQUrd6RGb8h4Ai86RqTT3rMeP0JTirtpwH_VKyiKStCi7zKNOGfG8e0wuj2mYLxbCtCGqaIO5s6YIMX1RA7iAR3VCcvYBcoQTasfbHNTNuW_HHIS6RlMZ0dRHLG29Nl85_HPh",
              "https://lh3.googleusercontent.com/aida-public/AB6AXuDmVneNyjoJPehc6aACKbRieLx2y7Nn25rPn41r6HHHrzojDWOsbROrJvMB6DiXmhbOilDGeY33gXsL2eFRYD9PbGp2SGgmiV21YMxveyrJNqdH2vokfa4fzNxipmM23STKsbPEFGkqjLrefnqj0HBYuUu37O8beaX6fqrELbgwrFmy1bXS_YE_cx0LKxBTjeeXIXZfhf8TYjgnwSfkXt4f-IvSBQ-zMiHRHNU5ACKlDhi8kl2Y33sblPTOI6YRDKzCaSCvUuP7BnNa",
              "https://lh3.googleusercontent.com/aida-public/AB6AXuAdA8hCNvEu_iMIv-PqaDAr9Ytvc7NDv9S1WgIKxepTeeEKGmYyiwCRsQMDnMPZyQtvlULh92KTcuD1e1gzcH6RqEbmdsya4O292EiGNro-ea5b568Nw3Q6Rd1CuRwaY1bviJAHV5_WzX_PF5do1nu4idYgnyYzWtHo9cr913y7c_jZf0QAyVihWueG4Xy6W1UG5up_d5xZ7N0uPMXn6iogWStjgTFyqDDo3mqapqvuPKctPNxJ8X1JJBWnxmgrF4H9VcmoEb6Lg6K_",
              "https://lh3.googleusercontent.com/aida-public/AB6AXuBYuJVCh6B6-FtKKrEu53fL45HHQbHA51mNb8QQb7ev9uKeiIfQNJSTYaRcE1ul_DWKB1eIxCq86B9_Hj4N0XAwW6HK0nodmpxEjgVvg3GJSe33uUfqucVwLCjZlEDg8UA4-8Q2rFCdAeWGhGmgDUI1iKWT9Je7bXGdBDL6q6jXRs7nh76Zdoc5ztgcUa8a2mOjzajT5G5d1twwFz1GDzoo04Zt0JKfL1URbYlBJDDD9yuhl2E5C6BZMZ4oAWV8AgVAvYEfMG1QcBQ2"
            ].map((src, i) => (
              <div key={i} className="aspect-square bg-surface-container-lowest rounded-xl overflow-hidden group cursor-pointer shadow-sm">
                <img alt={`Art ${i+1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale" src={src} />
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
