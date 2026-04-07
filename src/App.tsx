import { useState } from 'react';
import Events from './screens/Events';
import EventDetails from './screens/EventDetails';
import Profile from './screens/Profile';
import Tickets from './screens/Tickets';
import Gallery from './screens/Gallery';
import BottomNav from './components/BottomNav';

export type Screen = 'events' | 'event-details' | 'tickets' | 'gallery' | 'profile';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('events');

  return (
    <div className="min-h-screen bg-background font-body text-on-surface selection:bg-primary selection:text-white">
      {currentScreen === 'events' && <Events onNavigate={setCurrentScreen} />}
      {currentScreen === 'event-details' && <EventDetails onNavigate={setCurrentScreen} />}
      {currentScreen === 'tickets' && <Tickets onNavigate={setCurrentScreen} />}
      {currentScreen === 'gallery' && <Gallery onNavigate={setCurrentScreen} />}
      {currentScreen === 'profile' && <Profile onNavigate={setCurrentScreen} />}
      
      {currentScreen !== 'event-details' && (
        <BottomNav currentScreen={currentScreen} onNavigate={setCurrentScreen} />
      )}
    </div>
  );
}
