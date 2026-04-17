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
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      
      if (tgUser?.id) {
        // Обновлено: используем колонку user_id вместо telegram_id
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('user_id', tgUser.id) 
          .single();
        
        if (!error && data) {
          setUserRole(data.role);
          console.log('User role loaded:', data.role);
        } else if (error) {
          console.error('Error fetching role:', error.message);
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

  return (
    <div className="min-h-screen bg-background font-body text-on-surface selection:bg-primary selection:text-white">
      {currentScreen === 'events' && <Events onNavigate={setCurrentScreen} />}
      {currentScreen === 'event-details' && <EventDetails onNavigate={setCurrentScreen} />}
      {currentScreen === 'tickets' && <Tickets onNavigate={setCurrentScreen} />}
      {currentScreen === 'gallery' && <Gallery onNavigate={setCurrentScreen} />}
      {currentScreen === 'profile' && <Profile onNavigate={setCurrentScreen} />}
      
      {currentScreen === 'admin' && <AdminScanner userRole={userRole as any} />}
      
      {currentScreen !== 'event-details' && (
        <BottomNav 
          currentScreen={currentScreen} 
          onNavigate={setCurrentScreen} 
          userRole={userRole} 
        />
      )}
    </div>
  );
}
