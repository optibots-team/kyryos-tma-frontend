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

  useEffect(() => {
    async function fetchUserRole() {
      // 1. Получаем ID пользователя из Telegram
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      
      if (tgUser?.id) {
        console.log('Checking role for Telegram ID:', tgUser.id);
        
        // 2. Ищем роль в таблице users по колонке telegram_id
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('telegram_id', tgUser.id) 
          .single();
        
        if (!error && data) {
          console.log('Role found:', data.role);
          setUserRole(data.role);
        } else if (error) {
          console.error('Supabase error fetching role:', error.message);
        }
      } else {
        console.warn('Telegram WebApp user data not found');
      }
    }
    fetchUserRole();

    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      window.history.replaceState({}, '', window.location.pathname);
      setCurrentScreen('tickets');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background font-body text-on-surface">
      {currentScreen === 'events' && <Events onNavigate={setCurrentScreen} />}
      {currentScreen === 'event-details' && <EventDetails onNavigate={setCurrentScreen} />}
      {currentScreen === 'tickets' && <Tickets onNavigate={setCurrentScreen} />}
      {currentScreen === 'gallery' && <Gallery onNavigate={setCurrentScreen} />}
      {currentScreen === 'profile' && <Profile onNavigate={setCurrentScreen} />}
      
      {/* Экран сканера отображается только если выбрана вкладка admin */}
      {currentScreen === 'admin' && <AdminScanner userRole={userRole as any} />}
      
      {currentScreen !== 'event-details' && (
        <BottomNav 
          currentScreen={currentScreen} 
          onNavigate={setCurrentScreen} 
          userRole={userRole} // Передаем роль сюда для отрисовки кнопки
        />
      )}
    </div>
  );
}
