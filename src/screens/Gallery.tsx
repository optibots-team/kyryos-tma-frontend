import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, X, Download, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Screen } from '../App';
import { supabase } from '../lib/supabaseClient';

interface EventItem {
  id: string;
  title: string;
  event_date: string;
  image_url: string;
}

interface Photo {
  id: string;
  thumbnail_url: string;
  full_url: string;
  sort_order: number;
  created_at: string;
}

const GALLERY_ENDPOINT = 'https://uuxgtpzfxymhyekeuryf.supabase.co/functions/v1/gallery-upload';

export default function Gallery({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { t } = useTranslation();

  const [pastEvents, setPastEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  // Какие миниатюры уже отрисовались — пока id нет в сете, показываем skeleton
  const [loadedThumbs, setLoadedThumbs] = useState<Set<string>>(new Set());

  // Fullscreen-просмотр
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [fullImageLoaded, setFullImageLoaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    async function fetchPastEvents() {
      setLoadingEvents(true);
      try {
        const { data } = await supabase
          .from('events')
          .select('id, title, event_date, image_url')
          .eq('is_past', true)
          .order('event_date', { ascending: false });

        if (data) setPastEvents(data);
      } catch (err) {
        console.error('Error fetching past events:', err);
      } finally {
        setLoadingEvents(false);
      }
    }
    fetchPastEvents();
  }, []);

  const openEventGallery = async (event: EventItem) => {
    setSelectedEvent(event);
    setPhotos([]);
    setLoadedThumbs(new Set());
    setLoadingPhotos(true);
    try {
      const res = await fetch(GALLERY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_gallery', event_id: event.id })
      });
      const data = await res.json();
      setPhotos(data.photos || []);
    } catch (err) {
      console.error('Error fetching gallery photos:', err);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const backToEvents = () => {
    setSelectedEvent(null);
    setPhotos([]);
  };

  const markThumbLoaded = (id: string) => {
    setLoadedThumbs(prev => new Set(prev).add(id));
  };

  // --- FULLSCREEN ---
  const openFullscreen = (index: number) => {
    setActiveIndex(index);
    setFullImageLoaded(false);
  };

  const closeFullscreen = () => {
    setActiveIndex(null);
    setFullImageLoaded(false);
  };

  const goToIndex = (index: number) => {
    if (index < 0 || index >= photos.length) return;
    setActiveIndex(index);
    setFullImageLoaded(false);
  };

  const goNext = () => { if (activeIndex !== null) goToIndex(activeIndex + 1); };
  const goPrev = () => { if (activeIndex !== null) goToIndex(activeIndex - 1); };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDy > 80 && absDy > absDx) {
      // Свайп вниз (или вверх) — закрываем просмотр
      closeFullscreen();
    } else if (absDx > 50 && absDx > absDy) {
      if (dx < 0) goNext(); else goPrev();
    }
    touchStart.current = null;
  };

  // async function downloadPhoto(url, filename) — точно по ТЗ
  const downloadPhoto = async (url: string, filename?: string) => {
    setDownloading(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename || 'kyrios-photo.jpg';
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Error downloading photo:', err);
    } finally {
      setDownloading(false);
    }
  };

  const activePhoto = activeIndex !== null ? photos[activeIndex] : null;

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="w-full sticky top-0 z-50 bg-surface-variant/70 backdrop-blur-xl flex items-center justify-center px-6 pt-6 pb-2 border-b border-outline-variant/30">
        <img
          src="/logo.png"
          alt="Kyrios Logo"
          className="h-[55px] w-auto object-contain dark:invert"
        />
      </header>

      <main className="pt-8 pb-32 px-6 max-w-5xl mx-auto">

        {/* ЭКРАН 1: СПИСОК ПРОШЕДШИХ МЕРОПРИЯТИЙ */}
        {!selectedEvent && (
          <>
            <div className="mb-10 text-center">
              <h2 className="font-headline font-extrabold text-4xl tracking-tighter uppercase mb-2 text-on-surface">{t('gallery_screen.title')}</h2>
              <p className="font-body text-xs text-on-surface-variant tracking-widest uppercase">{t('gallery_screen.subtitle')}</p>
            </div>

            {loadingEvents ? (
              <div className="grid grid-cols-1 gap-6">
                {[0, 1].map(i => (
                  <div key={i} className="aspect-[4/5] rounded-[2rem] bg-surface-container animate-pulse" />
                ))}
              </div>
            ) : pastEvents.length === 0 ? (
              <div className="text-center py-16 text-on-surface-variant/60 text-sm">{t('gallery_screen.no_past_events')}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                {pastEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={() => openEventGallery(event)}
                    className="group text-left"
                  >
                    <div className="relative overflow-hidden rounded-[2rem] shadow-lg shadow-zinc-200/50 dark:shadow-black/40 mb-4 bg-surface-container aspect-[4/5]">
                      <img
                        src={event.image_url}
                        alt={event.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">
                          {new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <h3 className="font-headline font-bold text-2xl text-white tracking-tight">{event.title}</h3>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ЭКРАН 2: ГРИД ФОТО ВЫБРАННОГО МЕРОПРИЯТИЯ */}
        {selectedEvent && (
          <>
            <div className="flex items-center gap-3 mb-8">
              <button
                onClick={backToEvents}
                className="w-10 h-10 rounded-full bg-surface border border-outline-variant/40 flex items-center justify-center text-on-surface shrink-0 active:scale-95 transition-all"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="min-w-0">
                <h2 className="font-headline font-bold text-xl text-on-surface truncate">{selectedEvent.title}</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                  {new Date(selectedEvent.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            {loadingPhotos ? (
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-surface-container animate-pulse" />
                ))}
              </div>
            ) : photos.length === 0 ? (
              <div className="text-center py-16 text-on-surface-variant/60 text-sm flex flex-col items-center gap-3">
                <ImageIcon className="w-8 h-8 text-on-surface-variant/30" />
                {t('gallery_screen.no_photos')}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => openFullscreen(index)}
                    className="relative aspect-square overflow-hidden bg-surface-container"
                  >
                    {/* Skeleton — виден, пока миниатюра не отрисовалась */}
                    {!loadedThumbs.has(photo.id) && (
                      <div className="absolute inset-0 bg-surface-container animate-pulse" />
                    )}
                    <img
                      src={photo.thumbnail_url}
                      loading="lazy"
                      alt=""
                      onLoad={() => markThumbLoaded(photo.id)}
                      className={`w-full h-full object-cover transition-opacity duration-300 ${loadedThumbs.has(photo.id) ? 'opacity-100' : 'opacity-0'}`}
                    />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* FULLSCREEN ПРОСМОТР ФОТО */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-[100] bg-black flex flex-col"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Верхняя панель: счётчик + закрыть */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
            <span className="text-white/70 text-xs font-mono font-bold">
              {(activeIndex ?? 0) + 1} / {photos.length}
            </span>
            <button
              onClick={closeFullscreen}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Изображение: миниатюра как мгновенный блюр-плейсхолдер, full_url догружается поверх */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <img
              src={activePhoto.thumbnail_url}
              alt=""
              className="absolute inset-0 w-full h-full object-contain blur-lg scale-105 opacity-60"
            />
            <img
              key={activePhoto.id}
              src={activePhoto.full_url}
              alt=""
              onLoad={() => setFullImageLoaded(true)}
              className={`relative w-full h-full object-contain transition-opacity duration-300 ${fullImageLoaded ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Стрелки для навигации (доп. к свайпу — удобно и на десктопе) */}
            {activeIndex !== null && activeIndex > 0 && (
              <button
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            {activeIndex !== null && activeIndex < photos.length - 1 && (
              <button
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>

          {/* Кнопка скачивания */}
          <div className="p-6 pb-10 shrink-0">
            <button
              onClick={() => downloadPhoto(activePhoto.full_url, `kyrios-${selectedEvent?.id || 'photo'}-${activeIndex}.jpg`)}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-white text-zinc-950 font-headline font-black text-sm uppercase tracking-widest rounded-2xl active:scale-95 transition-all disabled:opacity-50"
            >
              <Download size={18} />
              {downloading ? '...' : t('gallery_screen.download')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
