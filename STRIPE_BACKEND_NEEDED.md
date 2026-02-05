# ⚠️ Backend Necesario para Stripe

## 🚨 IMPORTANTE: Actualmente solo tienes el FRONTEND

Para procesar pagos reales con Stripe, **NECESITAS UN BACKEND**. El frontend solo captura los datos de la tarjeta, pero el pago real se procesa en el servidor.

---

## 📋 Lo que tienes actualmente (Frontend):

✅ Interfaz de pago con Stripe Elements  
✅ Captura de datos de tarjeta (CardElement)  
✅ Creación de Payment Method  
❌ **NO procesa pagos reales** (solo simulación)

---

## 🔧 Lo que necesitas implementar (Backend):

### 1. Servidor Backend (Node.js/Express recomendado)

```bash
# En una carpeta separada (por ejemplo: tokens-backend)
npm init -y
npm install express stripe cors dotenv
```

### 2. Código del servidor (ejemplo básico)

**`server.js`**:
```javascript
const express = require('express');
const stripe = require('stripe')('sk_test_TU_CLAVE_SECRETA'); // ⚠️ Clave SECRETA aquí
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint para crear Payment Intent
app.post('/create-payment-intent', async (req, res) => {
  const { amount, packageId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe usa centavos
      currency: 'eur',
      metadata: { packageId },
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Endpoint para crear suscripción VIP
app.post('/create-subscription', async (req, res) => {
  const { paymentMethodId, customerId } = req.body;

  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: 'price_VIP_ID' }], // Crea un Price en Stripe Dashboard
      default_payment_method: paymentMethodId,
      expand: ['latest_invoice.payment_intent'],
    });

    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Backend running on http://localhost:3001');
});
```

### 3. Archivo `.env` del backend:

```env
STRIPE_SECRET_KEY=sk_test_TU_CLAVE_SECRETA_AQUI
PORT=3001
```

---

## 🔄 Cambios necesarios en tu Frontend

Actualizar `Shop.jsx` para llamar a tu backend:

```javascript
const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) return;
    
    setIsProcessing(true);

    try {
        // 1. Crear Payment Intent desde tu backend
        const response = await fetch('http://localhost:3001/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: selectedPackage.price,
                packageId: selectedPackage.id
            })
        });

        const { clientSecret } = await response.json();

        // 2. Confirmar el pago
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: elements.getElement(CardElement),
            }
        });

        if (error) {
            throw new Error(error.message);
        }

        if (paymentIntent.status === 'succeeded') {
            // 3. Pago exitoso - actualizar base de datos
            await db.addTokens(selectedPackage.tokens + selectedPackage.bonus, selectedPackage.price);
            onSuccess();
        }

    } catch (error) {
        onError(error.message);
    } finally {
        setIsProcessing(false);
    }
};
```

---

## 📦 Opciones de Backend:

### Opción 1: Node.js + Express (Recomendado)
- ✅ Fácil de integrar
- ✅ Muchos ejemplos disponibles
- ✅ Oficial de Stripe

### Opción 2: PHP (Si prefieres usar XAMPP)
```php
<?php
require 'vendor/autoload.php';
\Stripe\Stripe::setApiKey('sk_test_TU_CLAVE_SECRETA');

$paymentIntent = \Stripe\PaymentIntent::create([
  'amount' => $_POST['amount'] * 100,
  'currency' => 'eur',
]);

echo json_encode(['clientSecret' => $paymentIntent->client_secret]);
?>
```

### Opción 3: Servicios sin servidor
- Netlify Functions
- Vercel Serverless
- AWS Lambda

---

## 🎯 Pasos Rápidos para Empezar:

1. **Crea una carpeta para el backend:**
   ```bash
   mkdir tokens-backend
   cd tokens-backend
   npm init -y
   npm install express stripe cors dotenv
   ```

2. **Copia el código de `server.js` de arriba**

3. **Crea archivo `.env` con tu clave SECRETA:**
   ```env
   STRIPE_SECRET_KEY=sk_test_TU_CLAVE_SECRETA
   ```

4. **Inicia el servidor:**
   ```bash
   node server.js
   ```

5. **Actualiza el frontend para llamar a `http://localhost:3001`**

---

## 🔒 SEGURIDAD CRÍTICA:

⚠️ **NUNCA pongas la clave SECRETA (`sk_test_` o `sk_live_`) en el frontend**

✅ Clave PÚBLICA (`pk_test_`) → Frontend  
❌ Clave SECRETA (`sk_test_`) → Backend SOLAMENTE  

---

## 📚 Recursos:

- [Stripe Payment Intents Guide](https://stripe.com/docs/payments/payment-intents)
- [Stripe Node.js Library](https://github.com/stripe/stripe-node)
- [Accept a Payment Tutorial](https://stripe.com/docs/payments/accept-a-payment)

---

## 💡 ¿Quieres que te ayude a crear el backend?

Puedo generarte el código completo del backend en:
- Node.js/Express
- PHP para XAMPP
- O el que prefieras

Solo dime qué opción prefieres y te ayudo a configurarlo paso a paso.
