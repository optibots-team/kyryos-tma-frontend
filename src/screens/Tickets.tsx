import { useEffect } from 'react';
import { useMyTickets } from '../hooks/useMyTickets';
import TicketCard from '../components/TicketCard';

export default function Tickets() {
  const { tickets, loading, refresh } = useMyTickets();

  useEffect(() => {
    // Создаем интервал для проверки статуса (Polling)
    // Это нужно, если пользователь оплатил в браузере и просто вернулся в апп
    const interval = setInterval(() => {
      refresh(); 
    }, 3000); // Проверяем каждые 3 секунды

    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <main className="px-6 py-8">
      {loading && tickets.length === 0 ? (
        <div className="flex justify-center">Крутилка загрузки...</div>
      ) : (
        <div className="grid gap-6">
          {tickets.map(t => <TicketCard key={t.id} ticket={t} />)}
        </div>
      )}
    </main>
  );
}
