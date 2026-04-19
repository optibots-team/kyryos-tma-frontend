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

  // Синхронизация и авто-регистрация пользователя
  useEffect(() => {
    async function syncUser() {
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      
      if (tgUser?.id) {
        // Проверяем, есть ли юзер в базе
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('telegram_id', tgUser.id)
          .single();
        
        if (error && error.code === 'PGRST116') {
          // Юзер не найден (код PGRST116) — создаем запись
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
          // Юзер есть, просто ставим роль
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
      if (currentScreen === 'admin') {
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
