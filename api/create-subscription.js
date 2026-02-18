import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }
  try {
    const { paymentMethodId, email, userId } = req.body;
    if (!paymentMethodId || !email) {
      res.status(400).json({ error: 'Datos incompletos' });
      return;
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    // Aquí deberías crear el cliente y la suscripción en Stripe
    // Ejemplo básico:
    const customer = await stripe.customers.create({
      payment_method: paymentMethodId,
      email,
      invoice_settings: { default_payment_method: paymentMethodId },
    });
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_VIP_PRICE_ID }],
      expand: ['latest_invoice.payment_intent'],
    });
    res.json({ subscription });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error creando suscripción' });
  }
}
