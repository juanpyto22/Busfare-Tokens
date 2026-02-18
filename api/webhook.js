import Stripe from 'stripe';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event;
  try {
    const sig = req.headers['stripe-signature'];
    const buf = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => { data += chunk; });
      req.on('end', () => resolve(Buffer.from(data)));
      req.on('error', reject);
    });
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    res.status(400).json({ error: `Webhook Error: ${err.message}` });
    return;
  }
  // Aquí procesas el evento
  res.json({ received: true });
}
