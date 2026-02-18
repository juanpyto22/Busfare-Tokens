import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }
  try {
    const { amount, packageId, packageName, userId } = req.body;
    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Cantidad inválida' });
      return;
    }
    if (!userId) {
      res.status(400).json({ error: 'Usuario no identificado' });
      return;
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: {
        packageId: packageId || 'unknown',
        packageName: packageName || 'Token Package',
        userId: userId,
        timestamp: new Date().toISOString()
      },
      description: `Compra de ${packageName || 'tokens'} - Usuario ${userId}`
    });
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error procesando el pago' });
  }
}
