import { useState, useEffect } from 'react';
import Events from './screens/Events';
import EventDetails from './screens/EventDetails';
import Profile from './screens/Profile';
import Tickets from './screens/Tickets';
import AdminPanel from './screens/AdminPanel';
import AboutKyrios from './screens/AboutKyrios';
import Gallery from './screens/Gallery';
import { AdminScanner } from './AdminScanner';
import BottomNav from './components/BottomNav';
import TopCurtain from './components/TopCurtain'; // 🌟 Импортируем верхнюю шторку Этапа 4
import { supabase } from './lib/supabaseClient';

export type Screen = 'events' | 'event-details' | 'about' | 'tickets' | 'profile' | 'admin' | 'admin-panel' | 'gallery';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('events');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // 1. Обработка Deep Linking (start_param) из Telegram при старте приложения
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    const startParam = tg.initDataUnsafe?.start_param;
    if (startParam && startParam.startsWith('event_')) {
      const eventId = startParam.replace('event_', '');
      
      // Моментально перенаправляем на детальный экран ивента
      setSelectedEventId(eventId);
      setCurrentScreen('event-details');
    }
  }, []);

  // Синхронизация и авто-регистрация пользователя
  useEffect(() => {
    async function syncUser() {
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      
      if (tgUser?.id) {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('telegram_id', tgUser.id)
          .single();
        
        if (error && error.code === 'PGRST116') {
          const { data: newUser } = await supabase
            .from('users')
            .insert([{
              telegram_id: tgUser.id,
              username: tgUser.username || '',
              first_name: tgUser.first_name || '',
              last_name: tgUser.last_name || '',
              role: 'user'
            }])
            .select('role')
            .single();
            
          if (newUser) setUserRole(newUser.role);
        } else if (data) {
          setUserRole(data.role);
        }
      }
    }
    syncUser();

    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      window.history.replaceState({}, '', window.location.pathname);
      setCurrentScreen('tickets');
    }
  }, []);

  // Управление системной кнопкой "Назад" от Telegram
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg || !tg.BackButton) return;

    const handleBackClick = () => {
      if (currentScreen === 'admin' || currentScreen === 'admin-panel') {
        setCurrentScreen('profile');
      } else {
        setCurrentScreen('events');
      }
    };

    if (currentScreen === 'events') {
      tg.BackButton.hide();
    } else {
      tg.BackButton.show();
    }

    tg.BackButton.onClick(handleBackClick);

    return () => {
      tg.BackButton.offClick(handleBackClick);
    };
  }, [currentScreen]);

  const hideBottomNav = ['event-details', 'about'].includes(currentScreen);
  // Шторка (тема/язык) видна только на 4 основных вкладках — не на AdminPanel, AboutKyrios, EventDetails, сканере
  const showTopCurtain = ['events', 'gallery', 'tickets', 'profile'].includes(currentScreen);

  return (
    <div className="min-h-screen bg-background font-body text-on-surface">
      {/* 🌟 2. Верхняя сквозная шторка (RU/UA/EN, Light/Dark) — только на основных вкладках */}
      {showTopCurtain && <TopCurtain />}

      {currentScreen === 'events' && (
        <Events 
          onNavigate={setCurrentScreen} 
          onEventSelect={(id) => setSelectedEventId(id)} 
        />
      )}
      
      {currentScreen === 'event-details' && (
        <EventDetails 
          onNavigate={setCurrentScreen} 
          eventId={selectedEventId} 
        />
      )}
      
      {currentScreen === 'about' && <AboutKyrios onNavigate={setCurrentScreen} />}
      {currentScreen === 'tickets' && <Tickets onNavigate={setCurrentScreen} />}
      {currentScreen === 'gallery' && <Gallery onNavigate={setCurrentScreen} />}
      
      {currentScreen === 'profile' && (
        <Profile 
          onNavigate={setCurrentScreen} 
          userRole={userRole} 
        />
      )}
      
      {currentScreen === 'admin' && <AdminScanner userRole={userRole as any} />}
      
      {currentScreen === 'admin-panel' && (
        <AdminPanel onNavigate={setCurrentScreen} userRole={userRole} />
      )}
      
      {!hideBottomNav && (
        <BottomNav 
          currentScreen={currentScreen} 
          onNavigate={setCurrentScreen} 
        />
      )}
    </div>
  );
}
