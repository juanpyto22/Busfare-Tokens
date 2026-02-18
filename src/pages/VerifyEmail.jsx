import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, CheckCircle, AlertCircle, Gift } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useToast } from '@/components/ui/use-toast';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [user, setUser] = useState(null);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const session = db.getSession();
        if (!session) {
            navigate('/login');
            return;
        }
        const allUsers = JSON.parse(localStorage.getItem('fortnite_platform_users') || '[]');
        const updatedUser = allUsers.find(u => u.id === session.id);
        setUser(updatedUser || session);

        // Si ya está verificado, redirigir al dashboard
        if (updatedUser?.emailVerified) {
            navigate('/dashboard');
        }
    }, [navigate]);

    const handleVerify = (e) => {
        e.preventDefault();
        setLoading(true);

        if (!code || code.length !== 6) {
            toast({
                title: "Error",
                description: "Ingresa un código de 6 dígitos",
                variant: "destructive"
            });
            setLoading(false);
            return;
        }

        const result = db.verifyEmail(user.id, code);

        if (result.success) {
            toast({
                title: "✅ Email Verificado",
                description: "¡Has recibido 10 tokens de bonificación!",
                className: "bg-green-950 border-green-800 text-white"
            });
            
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } else {
            toast({
                title: "Error",
                description: result.message,
                variant: "destructive"
            });
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        try {
            const response = await fetch('/api/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data?.error || 'Error al reenviar')

            toast({
                title: 'Correo reenviado',
                description: 'Revisa tu buzón para confirmar tu correo.',
                className: 'bg-blue-950 border-blue-800 text-white'
            })
        } catch (err) {
            toast({ title: 'Error', description: err.message || 'Error reenviando correo', variant: 'destructive' })
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050911] via-[#0a1628] to-[#050911] pt-20 pb-20 relative flex items-center justify-center">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            
            <Helmet>
                <title>Verificar Email | BusFare-tokens</title>
            </Helmet>

            <div className="container mx-auto px-4 relative z-10 max-w-md">
                <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-4">
                            <Mail className="h-8 w-8 text-blue-400" />
                        </div>
                        <CardTitle className="text-2xl font-black text-white">
                            Verifica tu Email
                        </CardTitle>
                        <p className="text-blue-200/70 text-sm">
                            Hemos enviado un código de 6 dígitos a tu correo
                        </p>
                    </CardHeader>
                    <CardContent>
                        {/* Mostrar el código para desarrollo (en producción esto se enviaría por email) */}
                        <div className="mb-6 p-4 bg-gradient-to-r from-green-950/50 to-emerald-950/50 rounded-lg border border-green-500/30">
                            <div className="flex items-center gap-3">
                                <Gift className="h-8 w-8 text-green-400 flex-shrink-0" />
                                <div>
                                    <p className="text-green-400 font-semibold text-sm">¡Bonificación por verificar!</p>
                                    <p className="text-green-300/80 text-xs">Recibirás 0.25 tokens gratis</p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6 p-4 bg-blue-950/30 rounded-lg border border-blue-500/20">
                            <p className="text-blue-300/70 text-xs mb-2">Tu código de verificación:</p>
                            <p className="text-2xl font-mono font-black text-cyan-400 text-center tracking-widest">
                                {user.verificationCode}
                            </p>
                            <p className="text-blue-300/50 text-xs mt-2 text-center">
                                (En producción se enviará por email)
                            </p>
                        </div>

                        <form onSubmit={handleVerify} className="space-y-4">
                            <div>
                                <Input
                                    type="text"
                                    maxLength="6"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    className="bg-blue-950/30 border-blue-500/30 text-white text-center text-2xl font-mono tracking-widest"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading || code.length !== 6}
                                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-12"
                            >
                                {loading ? (
                                    'Verificando...'
                                ) : (
                                    <>
                                        <CheckCircle className="mr-2 h-5 w-5" />
                                        Verificar Email
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                onClick={handleResendCode}
                                className="text-blue-400 hover:text-blue-300 text-sm underline"
                            >
                                Reenviar código
                            </button>
                        </div>

                        <div className="mt-6 p-3 bg-yellow-950/30 border border-yellow-500/30 rounded-lg">
                            <div className="flex gap-2">
                                <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                                <div className="text-xs text-yellow-200">
                                    <p className="font-semibold mb-1">Importante:</p>
                                    <p>Verifica tu email para acceder a todas las funciones de la plataforma.</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default VerifyEmail;
