import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Stripe Backend API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Crear Payment Intent para compra de tokens
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, packageId, packageName } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Cantidad inválida' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe usa centavos
      currency: 'eur',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        packageId: packageId || 'unknown',
        packageName: packageName || 'Token Package',
        timestamp: new Date().toISOString()
      },
      description: `Compra de ${packageName || 'tokens'}`
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creando Payment Intent:', error);
    res.status(500).json({ 
      error: error.message || 'Error procesando el pago'
    });
  }
});

// Crear suscripción VIP
app.post('/create-subscription', async (req, res) => {
  try {
    const { paymentMethodId, email, userId } = req.body;

    if (!paymentMethodId || !email) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    // Crear o buscar customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: email,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
        metadata: {
          userId: userId || 'unknown'
        }
      });
    }

    // Crear producto VIP si no existe (solo primera vez)
    let product;
    const products = await stripe.products.list({ limit: 1 });
    const vipProduct = products.data.find(p => p.name === 'VIP Subscription');
    
    if (vipProduct) {
      product = vipProduct;
    } else {
      product = await stripe.products.create({
        name: 'VIP Subscription',
        description: 'Suscripción VIP mensual con beneficios exclusivos'
      });
    }

    // Crear precio si no existe
    let price;
    const prices = await stripe.prices.list({
      product: product.id,
      limit: 1
    });

    if (prices.data.length > 0) {
      price = prices.data[0];
    } else {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: 400, // €4.00
        currency: 'eur',
        recurring: {
          interval: 'month'
        }
      });
    }

    // Crear suscripción
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      default_payment_method: paymentMethodId,
      expand: ['latest_invoice.payment_intent'],
    });

    res.json({
      subscriptionId: subscription.id,
      customerId: customer.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      status: subscription.status
    });

  } catch (error) {
    console.error('Error creando suscripción:', error);
    res.status(500).json({ 
      error: error.message || 'Error creando suscripción'
    });
  }
});

// Webhook para eventos de Stripe (opcional pero recomendado)
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(400).send('Webhook secret no configurado');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Error verificando webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar eventos
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('✅ Pago exitoso:', paymentIntent.id);
      // Aquí actualizarías tu base de datos
      break;
    
    case 'payment_intent.payment_failed':
      console.log('❌ Pago fallido:', event.data.object.id);
      break;
    
    case 'customer.subscription.created':
      console.log('🎉 Suscripción creada:', event.data.object.id);
      break;
    
    case 'customer.subscription.deleted':
      console.log('❌ Suscripción cancelada:', event.data.object.id);
      break;

    default:
      console.log(`Evento no manejado: ${event.type}`);
  }

  res.json({ received: true });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════╗
  ║   🚀 Backend de Stripe funcionando        ║
  ║                                            ║
  ║   📍 Puerto: ${PORT}                          ║
  ║   🌐 URL: http://localhost:${PORT}           ║
  ║   ✅ CORS habilitado                       ║
  ║                                            ║
  ║   Endpoints disponibles:                   ║
  ║   • POST /create-payment-intent            ║
  ║   • POST /create-subscription              ║
  ║   • POST /webhook                          ║
  ╚════════════════════════════════════════════╝
  `);
});
