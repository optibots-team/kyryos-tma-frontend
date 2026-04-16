'use client';
import { useState } from 'react';

export default function PurchasePage({ params }) {
  const [quantity, setQuantity] = useState(1);
  const basePrice = 150; // В реальности лучше тянуть из базы по params.eventId
  const totalPrice = basePrice * quantity;

  const handlePayment = async () => {
    // Отправляем запрос на наш сервер для создания сессии Stripe
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        eventId: params.eventId, 
        quantity: quantity 
      }),
    });

    const { url } = await response.json();
    if (url) window.location.href = url; // Переход на Stripe
  };

  return (
    <div className="purchase-container" style={{ padding: '20px', color: 'white', background: '#1a1a1a' }}>
      <h2>Покупка билета</h2>
      <p>Вечірка 90-х та 2000-х</p>
      
      <div className="quantity-selector" style={{ display: 'flex', alignItems: 'center', gap: '20px', margin: '20px 0' }}>
        <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
        <span style={{ fontSize: '24px' }}>{quantity}</span>
        <button onClick={() => setQuantity(quantity + 1)}>+</button>
      </div>

      <div style={{ marginTop: '20px', fontSize: '20px', fontWeight: 'bold' }}>
        Цена: {totalPrice} PLN
      </div>

      <button 
        onClick={handlePayment}
        style={{ width: '100%', padding: '15px', background: '#e91e63', border: 'none', borderRadius: '10px', marginTop: '20px', color: 'white' }}
      >
        Купить билет • {totalPrice} PLN
      </button>
    </div>
  );
}
