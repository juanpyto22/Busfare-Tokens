export default function handler(req, res) {
  res.status(200).json({ 
    message: 'Stripe Backend API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
}
