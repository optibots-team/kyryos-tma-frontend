import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const { eventId, quantity } = await req.json();

  // Имитация получения цены из базы данных (никогда не берите цену с фронтенда!)
  const unitAmount = 150 * 100; // 150 PLN в грошах (Stripe считает в минимальных единицах)

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
          quantity: quantity, // Stripe сам умножит unit_amount на quantity
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
