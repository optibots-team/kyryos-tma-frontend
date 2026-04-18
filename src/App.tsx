import { useState, useEffect } from 'react';
import Events from './screens/Events';
import EventDetails from './screens/EventDetails';
import Profile from './screens/Profile';
import Tickets from './screens/Tickets';
import Gallery from './screens/Gallery';
import { AdminScanner } from './AdminScanner';
import BottomNav from './components/BottomNav';
import { supabase } from './lib/supabaseClient';

export type Screen = 'events' | 'event-details' | 'tickets' | 'gallery' | 'profile' | 'admin';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('events');
  const [userRole, setUserRole] = useState<string | null>(null);

  // Получение роли
  useEffect(() => {
    async function fetchUserRole() {
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      
      if (tgUser?.id) {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('telegram_id', tgUser.id)
          .single();
        
        if (!error && data) {
          setUserRole(data.role);
        }
      }
    }
    fetchUserRole();

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

    // Логика возврата
    const handleBackClick = () => {
      if (currentScreen === 'admin') {
        setCurrentScreen('profile'); // Из админки возвращаемся в профиль
      } else {
        setCurrentScreen('events');  // Со всех остальных вкладок - на главную
      }
    };

    if (currentScreen === 'events') {
      tg.BackButton.hide();
    } else {
      tg.BackButton.show();
    }

    tg.BackButton.onClick(handleBackClick);

    // Очистка слушателя при размонтировании или смене экрана
    return () => {
      tg.BackButton.offClick(handleBackClick);
    };
  }, [currentScreen]);

  return (
    <div className="min-h-screen bg-background font-body text-on-surface">
      {currentScreen === 'events' && <Events onNavigate={setCurrentScreen} />}
      {currentScreen === 'event-details' && <EventDetails onNavigate={setCurrentScreen} />}
      {currentScreen === 'tickets' && <Tickets onNavigate={setCurrentScreen} />}
      {currentScreen === 'gallery' && <Gallery onNavigate={setCurrentScreen} />}
      
      {currentScreen === 'profile' && (
        <Profile 
          onNavigate={setCurrentScreen} 
          userRole={userRole} 
        />
      )}
      
      {currentScreen === 'admin' && <AdminScanner userRole={userRole as any} />}
      
      {currentScreen !== 'event-details' && (
        <BottomNav 
          currentScreen={currentScreen === 'admin' ? 'profile' : currentScreen} 
          onNavigate={setCurrentScreen} 
        />
      )}
    </div>
  );
}
