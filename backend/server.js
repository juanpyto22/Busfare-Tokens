import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Inicializar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// Middleware
app.use(cors());
// Para webhook, necesitamos raw body
app.use('/webhook', express.raw({ type: 'application/json' }));
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
    const { amount, packageId, packageName, userId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Cantidad inválida' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'Usuario no identificado' });
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
        userId: userId, // IMPORTANTE: para identificar al usuario en el webhook
        timestamp: new Date().toISOString()
      },
      description: `Compra de ${packageName || 'tokens'} - Usuario ${userId}`
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

// Webhook para eventos de Stripe
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('⚠️ Webhook secret no configurado - eventos no verificados');
  }

  let event;

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // Modo desarrollo sin verificación
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('Error verificando webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar eventos
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('✅ Pago exitoso:', paymentIntent.id);
        
        // Extraer metadata
        const { packageId, packageName, userId } = paymentIntent.metadata || {};
        const tokensToAdd = getTokensFromAmount(paymentIntent.amount / 100); // Convertir de centavos

        if (userId) {
          // Actualizar tokens del usuario
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('tokens')
            .eq('id', userId)
            .single();

          if (!userError && user) {
            await supabase
              .from('users')
              .update({
                tokens: user.tokens + tokensToAdd
              })
              .eq('id', userId);

            // Registrar transacción
            await supabase
              .from('transactions')
              .insert({
                user_id: userId,
                type: 'purchase',
                amount: tokensToAdd,
                description: `Compra de ${packageName || 'tokens'}`,
                stripe_payment_id: paymentIntent.id
              });

            console.log(`💰 ${tokensToAdd} tokens añadidos al usuario ${userId}`);
          }
        }
        break;
      
      case 'payment_intent.payment_failed':
        console.log('❌ Pago fallido:', event.data.object.id);
        break;
      
      case 'customer.subscription.created':
        const subscription = event.data.object;
        console.log('🎉 Suscripción creada:', subscription.id);
        
        // Actualizar usuario a VIP
        if (subscription.customer && subscription.metadata?.userId) {
          await supabase
            .from('users')
            .update({
              is_vip: true,
              vip_expires_at: new Date(subscription.current_period_end * 1000).toISOString()
            })
            .eq('id', subscription.metadata.userId);
        }
        break;
      
      case 'customer.subscription.deleted':
        const canceledSub = event.data.object;
        console.log('❌ Suscripción cancelada:', canceledSub.id);
        
        // Remover VIP del usuario
        if (canceledSub.metadata?.userId) {
          await supabase
            .from('users')
            .update({
              is_vip: false,
              vip_expires_at: null
            })
            .eq('id', canceledSub.metadata.userId);
        }
        break;

      default:
        console.log(`Evento no manejado: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.status(500).json({ error: 'Error procesando evento' });
  }
});

// Helper para calcular tokens según precio
function getTokensFromAmount(euros) {
  // Mapear según los paquetes definidos en Shop.jsx
  const packages = {
    5: 100,    // €5 = 100 tokens
    10: 250,   // €10 = 250 tokens
    20: 550,   // €20 = 550 tokens
    50: 1500   // €50 = 1500 tokens
  };
  
  return packages[euros] || Math.round(euros * 20); // Default: 20 tokens por euro
}

// ===============================
// 🔗 OAUTH ENDPOINTS - SOCIAL MEDIA CONNECTIONS
// ===============================

// Epic Games OAuth
app.get('/auth/epic', (req, res) => {
  const { userId } = req.query;
  const clientId = process.env.EPIC_CLIENT_ID;
  const redirectUri = encodeURIComponent('http://localhost:3001/auth/epic/callback');
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
  
  const authUrl = `https://www.epicgames.com/id/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=basic_profile&state=${state}`;
  res.redirect(authUrl);
});

app.get('/auth/epic/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());
    
    // Intercambiar código por token
    const tokenResponse = await fetch('https://api.epicgames.dev/epic/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.EPIC_CLIENT_ID}:${process.env.EPIC_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'http://localhost:3001/auth/epic/callback'
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    // Obtener información del usuario
    const userResponse = await fetch('https://api.epicgames.dev/epic/id/v1/accounts', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });
    
    const userData = await userResponse.json();
    const epicName = userData.displayName || userData.id;
    
    // Guardar en Supabase
    await supabase
      .from('users')
      .update({ epic_games_name: epicName })
      .eq('id', userId);
    
    res.redirect('http://localhost:3002/profile?tab=settings&connected=epic');
  } catch (error) {
    console.error('Error en Epic OAuth:', error);
    res.redirect('http://localhost:3002/profile?tab=settings&error=epic');
  }
});

// Discord OAuth
app.get('/auth/discord', (req, res) => {
  const { userId } = req.query;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = encodeURIComponent('http://localhost:3001/auth/discord/callback');
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
  
  const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify&state=${state}`;
  res.redirect(authUrl);
});

app.get('/auth/discord/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());
    
    // Intercambiar código por token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'http://localhost:3001/auth/discord/callback'
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    // Obtener información del usuario
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });
    
    const userData = await userResponse.json();
    const discordUsername = `${userData.username}#${userData.discriminator}`;
    
    // Guardar en Supabase
    await supabase
      .from('users')
      .update({ 
        discord_username: discordUsername,
        discord_id: userData.id
      })
      .eq('id', userId);
    
    res.redirect('http://localhost:3002/profile?tab=settings&connected=discord');
  } catch (error) {
    console.error('Error en Discord OAuth:', error);
    res.redirect('http://localhost:3002/profile?tab=settings&error=discord');
  }
});

// Twitter OAuth
app.get('/auth/twitter', (req, res) => {
  const { userId } = req.query;
  const clientId = process.env.TWITTER_CLIENT_ID;
  const redirectUri = encodeURIComponent('http://localhost:3001/auth/twitter/callback');
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
  
  const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=tweet.read%20users.read&state=${state}&code_challenge=challenge&code_challenge_method=plain`;
  res.redirect(authUrl);
});

app.get('/auth/twitter/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());
    
    // Intercambiar código por token
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: 'http://localhost:3001/auth/twitter/callback',
        code_verifier: 'challenge'
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    // Obtener información del usuario
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });
    
    const userData = await userResponse.json();
    const twitterHandle = userData.data.username;
    
    // Guardar en Supabase
    await supabase
      .from('users')
      .update({ twitter_handle: twitterHandle })
      .eq('id', userId);
    
    res.redirect('http://localhost:3002/profile?tab=settings&connected=twitter');
  } catch (error) {
    console.error('Error en Twitter OAuth:', error);
    res.redirect('http://localhost:3002/profile?tab=settings&error=twitter');
  }
});

// Twitch OAuth
app.get('/auth/twitch', (req, res) => {
  const { userId } = req.query;
  const clientId = process.env.TWITCH_CLIENT_ID;
  const redirectUri = encodeURIComponent('http://localhost:3001/auth/twitch/callback');
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
  
  const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=user:read:email&state=${state}`;
  res.redirect(authUrl);
});

app.get('/auth/twitch/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());
    
    // Intercambiar código por token
    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: 'http://localhost:3001/auth/twitch/callback'
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    // Obtener información del usuario
    const userResponse = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID
      }
    });
    
    const userData = await userResponse.json();
    const twitchUsername = userData.data[0].login;
    
    // Guardar en Supabase
    await supabase
      .from('users')
      .update({ twitch_username: twitchUsername })
      .eq('id', userId);
    
    res.redirect('http://localhost:3002/profile?tab=settings&connected=twitch');
  } catch (error) {
    console.error('Error en Twitch OAuth:', error);
    res.redirect('http://localhost:3002/profile?tab=settings&error=twitch');
  }
});

// TikTok OAuth
app.get('/auth/tiktok', (req, res) => {
  const { userId } = req.query;
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = encodeURIComponent('http://localhost:3001/auth/tiktok/callback');
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
  
  const authUrl = `https://www.tiktok.com/auth/authorize/?client_key=${clientKey}&scope=user.info.basic&response_type=code&redirect_uri=${redirectUri}&state=${state}`;
  res.redirect(authUrl);
});

app.get('/auth/tiktok/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());
    
    // Intercambiar código por token
    const tokenResponse = await fetch('https://open-api.tiktok.com/oauth/access_token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code'
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    // Obtener información del usuario
    const userResponse = await fetch('https://open-api.tiktok.com/user/info/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.data.access_token}`
      }
    });
    
    const userData = await userResponse.json();
    const tiktokHandle = userData.data.user.unique_id;
    
    // Guardar en Supabase
    await supabase
      .from('users')
      .update({ tiktok_handle: tiktokHandle })
      .eq('id', userId);
    
    res.redirect('http://localhost:3002/profile?tab=settings&connected=tiktok');
  } catch (error) {
    console.error('Error en TikTok OAuth:', error);
    res.redirect('http://localhost:3002/profile?tab=settings&error=tiktok');
  }
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
  ║   💳 Endpoints de Stripe:                  ║
  ║   • POST /create-payment-intent            ║
  ║   • POST /create-subscription              ║
  ║   • POST /webhook                          ║
  ║                                            ║
  ║   🔗 Endpoints de OAuth:                   ║
  ║   • GET /auth/epic                         ║
  ║   • GET /auth/discord                      ║
  ║   • GET /auth/twitter                      ║
  ║   • GET /auth/twitch                       ║
  ║   • GET /auth/tiktok                       ║
  ╚════════════════════════════════════════════╝
  `);
});
