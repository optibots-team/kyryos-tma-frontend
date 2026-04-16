// app/api/checkout/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  // Добавлен userId, так как webhook тоже ожидает его в metadata
  const { userId, eventId, quantity } = await req.json();

  const unitAmount = 150 * 100;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'pln',
            product_data: {
              name: `Билеты на мероприятие (ID: ${eventId})`,
            },
            unit_amount: unitAmount,
          },
          quantity: quantity, 
        },
      ],
      mode: 'payment',
      // ДОБАВЛЕНО: передаем данные для вебхука
      metadata: {
        userId: userId,
        eventId: eventId,
        quantity: quantity.toString(), // Stripe требует, чтобы значения metadata были строками
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
