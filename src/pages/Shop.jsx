import React, { useState } from 'react';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { Coins, Check, Lock, Loader2, CreditCard, Crown, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Carga la clave pública de Stripe desde las variables de entorno
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const tokenPackages = [
    {
        id: 'starter',
        name: 'Pack Inicial',
        tokens: 5,
        bonus: 0,
        price: 0.01,
        popular: false,
        color: 'from-blue-950/40 to-slate-900/40'
    },
    {
        id: 'gamer',
        name: 'Pack Jugador',
        tokens: 10,
        bonus: 1,
        price: 10,
        popular: true,
        color: 'from-cyan-900/30 to-blue-900/30'
    },
    {
        id: 'pro',
        name: 'Pack Pro',
        tokens: 25,
        bonus: 5,
        price: 25,
        popular: false,
        color: 'from-blue-950/40 to-slate-900/40'
    },
    {
        id: 'elite',
        name: 'Pack Elite',
        tokens: 50,
        bonus: 10,
        price: 50,
        popular: false,
        color: 'from-blue-950/50 to-cyan-950/30'
    }
];

const vipPackage = {
    id: 'vip-subscription',
    name: 'VIP Subscription',
    description: 'Suscripción mensual con beneficios exclusivos',
    price: 4,
    duration: '30 días',
    color: 'from-yellow-900/30 to-yellow-950/50',
    benefits: [
        'Ability to Tip and Gift',
        'Shiny Username',
        'Priority Support',
        'Multiple Matches at Same Time',
        'Reduced Withdraw Fees',
        'Customise Display Name',
        'Giveaways',
        '10 Free Snipes per Month',
        'Additional Profile Presets',
        'Quicker Submission Time'
    ]
};

const CheckoutForm = ({ selectedPackage, onSuccess, onError }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);

        try {
            const session = db.getSession();
            
            // Si es VIP, crear suscripción
            if (selectedPackage.id === 'vip-subscription') {
                // Crear Payment Method primero
                const cardElement = elements.getElement(CardElement);
                const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
                    type: 'card',
                    card: cardElement,
                });

                if (pmError) {
                    throw new Error(pmError.message);
                }

                // Crear suscripción en el backend
                const response = await fetch('http://localhost:3002/create-subscription', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        paymentMethodId: paymentMethod.id,
                        email: session.email,
                        userId: session.id
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Error creando suscripción');
                }

                // Confirmar pago de suscripción si es necesario
                if (data.clientSecret) {
                    const { error: confirmError } = await stripe.confirmCardPayment(data.clientSecret);
                    if (confirmError) {
                        throw new Error(confirmError.message);
                    }
                }

                // Guardar suscripción VIP localmente
                const vipData = {
                    userId: session.id,
                    subscriptionId: data.subscriptionId,
                    customerId: data.customerId,
                    startDate: new Date().toISOString(),
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'active'
                };
                localStorage.setItem(`vip_subscription_${session.id}`, JSON.stringify(vipData));

                toast({
                    title: "¡Suscripción VIP Activada!",
                    description: "Disfruta de todos los beneficios VIP durante 30 días.",
                    className: "bg-green-600 border-none text-white"
                });

            } else {
                // Compra de tokens - crear Payment Intent
                const response = await fetch('http://localhost:3001/create-payment-intent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: selectedPackage.price,
                        packageId: selectedPackage.id,
                        packageName: selectedPackage.name,
                        userId: session.id // Incluir userId para el webhook
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Error procesando el pago');
                }

                // Confirmar el pago
                const cardElement = elements.getElement(CardElement);
                const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
                    data.clientSecret,
                    {
                        payment_method: {
                            card: cardElement,
                        }
                    }
                );

                if (confirmError) {
                    throw new Error(confirmError.message);
                }

                if (paymentIntent.status !== 'succeeded') {
                    throw new Error('El pago no se completó correctamente');
                }

                // Añadir tokens a la cuenta
                const result = await db.addTokens(
                    selectedPackage.tokens + selectedPackage.bonus, 
                    selectedPackage.price
                );

                if (result.error) {
                    throw new Error(result.error);
                }

                toast({
                    title: "¡Compra Exitosa!",
                    description: `Has recibido ${selectedPackage.tokens + selectedPackage.bonus} tokens.`,
                    className: "bg-green-600 border-none text-white"
                });
            }

            setIsProcessing(false);
            onSuccess();

        } catch (error) {
            console.error('Error en el pago:', error);
            setIsProcessing(false);
            onError(error.message);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
                <label className="text-xs font-semibold text-blue-300/80 uppercase">
                    Información de Tarjeta
                </label>
                <div className="border border-blue-500/30 bg-blue-950/30 rounded-lg p-4">
                    <CardElement
                        options={{
                            hidePostalCode: true,
                            style: {
                                base: {
                                    fontSize: '16px',
                                    color: '#ffffff',
                                    '::placeholder': {
                                        color: '#94a3b8',
                                    },
                                },
                                invalid: {
                                    color: '#ef4444',
                                },
                            },
                        }}
                    />
                </div>
            </div>

            <Button 
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold shadow-[0_0_20px_rgba(59,130,246,0.5)]" 
                disabled={!stripe || isProcessing}
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                    </>
                ) : (
                    `Pagar €${selectedPackage?.price}`
                )}
            </Button>
        </form>
    );
};

const Shop = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [customAmount, setCustomAmount] = useState('5');
    const [showCustomDialog, setShowCustomDialog] = useState(false);

    const handlePurchaseClick = (pkg) => {
        const session = db.getSession();
        if (!session) {
            toast({
                title: "Inicia sesión",
                description: "Debes estar registrado para comprar tokens.",
                variant: "destructive"
            });
            navigate('/login');
            return;
        }
        setSelectedPackage(pkg);
    };

    const handleCustomPurchase = () => {
        const session = db.getSession();
        if (!session) {
            toast({
                title: "Inicia sesión",
                description: "Debes estar registrado para comprar tokens.",
                variant: "destructive"
            });
            navigate('/login');
            return;
        }

        const amount = parseFloat(customAmount);
        if (isNaN(amount) || amount < 5) {
            toast({
                title: "Cantidad inválida",
                description: "La cantidad mínima de compra es de €5.",
                variant: "destructive"
            });
            return;
        }

        // Calcular tokens: 1 token por cada euro
        const tokens = Math.floor(amount);
        
        setSelectedPackage({
            id: 'custom',
            name: 'Cantidad Personalizada',
            tokens: tokens,
            bonus: 0,
            price: amount
        });
        setShowCustomDialog(false);
    };

    const handleSuccess = () => {
        setShowSuccess(true);
        setSelectedPackage(null);
    };

    const handleError = (errorMessage) => {
        toast({
            title: "Error en el pago",
            description: errorMessage || "Hubo un problema procesando tu pago.",
            variant: "destructive"
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050911] via-[#0a1628] to-[#050911] pt-10 pb-20 relative">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            
             <Helmet>
                <title>Tienda | BusFare-tokens</title>
            </Helmet>
            
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-black text-white mb-4 text-glow">TIENDA DE TOKENS</h1>
                    <p className="text-blue-200/80">Elige el paquete que mejor se adapte a tu estilo de juego.</p>
                </div>

                {/* VIP Subscription Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <Card className="bg-gradient-to-br from-yellow-900/30 to-yellow-950/50 backdrop-blur-sm border-2 border-yellow-500/40 hover:border-yellow-400/60 hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] transition-all duration-300">
                        <div className="p-8 md:flex md:items-center md:justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-14 w-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                                        <Crown className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-white text-glow">VIP SUBSCRIPTION</h2>
                                        <p className="text-yellow-200/70 text-sm">Suscripción mensual · {vipPackage.duration}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                                    {vipPackage.benefits.slice(0, 5).map((benefit, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs text-yellow-100/80">
                                            <Check className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                                            <span className="truncate">{benefit}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-yellow-200/60 text-xs">+{vipPackage.benefits.length - 5} beneficios más incluidos</p>
                            </div>
                            <div className="mt-6 md:mt-0 md:ml-8 flex-shrink-0 text-center">
                                <div className="text-4xl font-black text-white mb-2">€{vipPackage.price}</div>
                                <div className="text-sm text-yellow-200/70 mb-4">por mes</div>
                                <Button
                                    onClick={() => handlePurchaseClick(vipPackage)}
                                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold px-8 py-6 text-lg shadow-[0_0_25px_rgba(234,179,8,0.5)]"
                                >
                                    <Crown className="h-5 w-5 mr-2" />
                                    Suscribirse Ahora
                                </Button>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Token Packages Title */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Paquetes de Tokens</h2>
                    <p className="text-blue-300/70 text-sm">Compra tokens para participar en partidas y más</p>
                </div>

                {/* Custom Amount Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 max-w-2xl mx-auto"
                >
                    <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm border-2 border-purple-500/50 hover:border-purple-400/70 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300">
                        <CardHeader className="text-center pb-4">
                            <CardTitle className="text-2xl font-black text-white flex items-center justify-center gap-2">
                                <Sparkles className="h-6 w-6 text-purple-400" />
                                Cantidad Personalizada
                                <Sparkles className="h-6 w-6 text-purple-400" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-purple-200/80 mb-4">
                                ¿Necesitas una cantidad específica? Elige tú mismo cuántos tokens comprar
                            </p>
                            <div className="flex items-center justify-center gap-2 text-sm text-purple-300/70 mb-4">
                                <Check className="h-4 w-4 text-purple-400" />
                                <span>Mínimo €5</span>
                                <span className="mx-2">•</span>
                                <Check className="h-4 w-4 text-purple-400" />
                                <span>1 Token = €1</span>
                                <span className="mx-2">•</span>
                                <Check className="h-4 w-4 text-purple-400" />
                                <span>Sin máximos</span>
                            </div>
                            <Button
                                onClick={() => setShowCustomDialog(true)}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-8 py-6 text-lg shadow-[0_0_25px_rgba(168,85,247,0.5)]"
                            >
                                <Sparkles className="h-5 w-5 mr-2" />
                                Comprar Cantidad Personalizada
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Packages Title */}
                <div className="text-center mb-8">
                    <h3 className="text-xl font-bold text-white mb-2">O elige un paquete predefinido</h3>
                    <p className="text-blue-300/70 text-sm">Paquetes con bonus incluidos</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {tokenPackages.map((pkg, idx) => (
                        <motion.div
                            key={pkg.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Card className={`relative h-full flex flex-col bg-gradient-to-br ${pkg.color} backdrop-blur-sm border-blue-500/20 ${pkg.popular ? 'border-2 border-cyan-400/60 scale-105 shadow-2xl shadow-cyan-900/30 z-10' : 'hover:border-blue-400/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]'} transition-all duration-300`}>
                                {pkg.popular && (
                                    <div className="absolute -top-4 left-0 right-0 mx-auto w-max bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                                        Más Vendido
                                    </div>
                                )}
                                <CardHeader className="text-center pb-2">
                                    <CardTitle className="text-white text-xl font-black">{pkg.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                                    <div className="mb-4">
                                        <Coins className={`h-12 w-12 ${pkg.id === 'elite' || pkg.popular ? 'text-cyan-400' : 'text-blue-400'}`} />
                                    </div>
                                    <div className="text-4xl font-black text-white mb-1">
                                        {pkg.tokens.toLocaleString()}
                                    </div>
                                    <div className="text-sm font-medium text-blue-300/80 uppercase tracking-widest mb-6">Tokens</div>
                                    
                                    {pkg.bonus > 0 && (
                                        <div className="bg-cyan-500/20 text-cyan-300 text-xs font-bold px-2 py-1 rounded mb-4 border border-cyan-400/30">
                                            +{pkg.bonus} BONUS GRATIS
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="pt-2 pb-6 flex flex-col gap-3">
                                    <div className="text-2xl font-bold text-white mb-2">
                                        €{pkg.price}
                                    </div>
                                    <Button 
                                        className="w-full font-bold" 
                                        variant={pkg.popular ? "neonBlue" : "secondary"}
                                        onClick={() => handlePurchaseClick(pkg)}
                                    >
                                        Comprar Ahora
                                    </Button>
                                    <div className="flex items-center gap-1 text-xs text-blue-400/70">
                                        <Lock className="h-3 w-3" /> Pago Seguro con Stripe
                                    </div>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Custom Amount Dialog */}
            <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
                <DialogContent className="sm:max-w-[425px] bg-slate-950 border-purple-500/30 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-black text-glow">
                            <Sparkles className="h-5 w-5 text-purple-400" />
                            Cantidad Personalizada
                        </DialogTitle>
                        <DialogDescription className="text-purple-200/80">
                            Elige cuántos tokens deseas comprar. La cantidad mínima es de €5.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-6">
                        <div className="space-y-3">
                            <Label htmlFor="custom-amount" className="text-sm font-semibold text-purple-300/80 uppercase">
                                Cantidad en Euros (€)
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 font-bold text-lg">€</span>
                                <Input
                                    id="custom-amount"
                                    type="number"
                                    min="5"
                                    step="0.01"
                                    value={customAmount}
                                    onChange={(e) => setCustomAmount(e.target.value)}
                                    className="pl-8 bg-purple-950/30 border-purple-500/30 text-white text-lg font-bold focus:border-purple-400 focus:ring-purple-400"
                                    placeholder="5.00"
                                />
                            </div>
                            <p className="text-xs text-purple-300/60">Mínimo: €5.00</p>
                        </div>

                        <div className="bg-purple-950/40 backdrop-blur-sm p-4 rounded-lg border border-purple-500/30">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-purple-300/80">Recibirás</span>
                                <span className="font-bold text-xl text-purple-400 flex items-center gap-1">
                                    <Coins className="h-5 w-5" />
                                    {Math.floor(parseFloat(customAmount) || 0)} Tokens
                                </span>
                            </div>
                            <div className="border-t border-purple-500/30 my-2 pt-2 flex justify-between items-center">
                                <span className="text-sm text-purple-300/80">Precio por token</span>
                                <span className="text-purple-200">€1.00</span>
                            </div>
                            <div className="flex justify-between items-center font-bold text-lg">
                                <span className="text-white">Total a pagar</span>
                                <span className="text-purple-400">€{parseFloat(customAmount || 0).toFixed(2)}</span>
                            </div>
                        </div>

                        <Button
                            onClick={handleCustomPurchase}
                            disabled={parseFloat(customAmount) < 5}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold shadow-[0_0_20px_rgba(168,85,247,0.5)]"
                        >
                            Continuar al pago
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Payment Modal Simulation */}
            <Dialog open={!!selectedPackage} onOpenChange={(open) => {
                if (!open) {
                    setSelectedPackage(null);
                }
            }}>
                <DialogContent className="sm:max-w-[425px] bg-slate-950 border-blue-500/30 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-black text-glow">
                            {selectedPackage?.id === 'vip-subscription' ? (
                                <Crown className="h-5 w-5 text-yellow-400" />
                            ) : (
                                <CreditCard className="h-5 w-5 text-cyan-400" />
                            )}
                            Checkout Seguro
                        </DialogTitle>
                        <DialogDescription className="text-blue-200/80">
                            Estás a punto de comprar <strong className="text-cyan-400">{selectedPackage?.name}</strong> por <strong className="text-cyan-400">€{selectedPackage?.price}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6">
                        <div className="bg-blue-950/40 backdrop-blur-sm p-4 rounded-lg border border-blue-500/30 mb-4">
                            {selectedPackage?.id === 'vip-subscription' ? (
                                <>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-blue-300/80">Producto</span>
                                        <span className="font-semibold text-white">{selectedPackage?.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2 text-yellow-400">
                                        <span className="text-sm">Duración</span>
                                        <span className="font-semibold">{selectedPackage?.duration}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-blue-300/80">Producto</span>
                                        <span className="font-semibold text-white">{selectedPackage?.tokens} Tokens</span>
                                    </div>
                                    {selectedPackage?.bonus > 0 && (
                                        <div className="flex justify-between items-center mb-2 text-cyan-400">
                                            <span className="text-sm">Bonus</span>
                                            <span className="font-semibold">+{selectedPackage?.bonus} Tokens</span>
                                        </div>
                                    )}
                                </>
                            )}
                            <div className="border-t border-blue-500/30 my-2 pt-2 flex justify-between items-center font-bold text-lg">
                                <span className="text-white">Total</span>
                                <span className="text-cyan-400">€{selectedPackage?.price}</span>
                            </div>
                        </div>

                        {selectedPackage && (
                            <Elements stripe={stripePromise}>
                                <CheckoutForm 
                                    selectedPackage={selectedPackage}
                                    onSuccess={handleSuccess}
                                    onError={handleError}
                                />
                            </Elements>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Success Modal */}
            <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
                <DialogContent className="sm:max-w-[400px] bg-slate-950 border-cyan-500/50 text-white text-center">
                    <div className="flex flex-col items-center py-6">
                        <div className="h-20 w-20 bg-cyan-500/20 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(34,211,238,0.4)]">
                            <Check className="h-10 w-10 text-cyan-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2 text-glow">¡Pago Completado!</h2>
                        <p className="text-blue-200/80 mb-6">Tus tokens han sido añadidos a tu cuenta correctamente.</p>
                        <Button 
                            variant="neonBlue" 
                            className="w-full"
                            onClick={() => {
                                setShowSuccess(false);
                                navigate('/dashboard');
                            }}
                        >
                            Ver mi balance
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Shop;