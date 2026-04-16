import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;

  try {
    // Проверка, что запрос действительно пришел от Stripe
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, eventId, quantity } = session.metadata;

    // Генерируем билеты в базе данных
    const tickets = [];
    for (let i = 0; i < parseInt(quantity); i++) {
      tickets.push({
        user_id: userId,
        event_id: eventId,
        status: 'active',
        // Генерируем случайный уникальный ID, который станет QR-кодом
        ticket_code: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      });
    }

    const { error } = await supabase.from('tickets').insert(tickets);
    
    if (error) console.error('Ошибка записи билетов:', error);
  }

  return NextResponse.json({ received: true });
}
