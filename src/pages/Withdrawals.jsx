import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, AlertCircle, CheckCircle, Clock, Coins } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useToast } from '@/components/ui/use-toast';

const Withdrawals = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [user, setUser] = useState(null);
    const [withdrawals, setWithdrawals] = useState([]);
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('');
    const [accountInfo, setAccountInfo] = useState('');
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
        loadWithdrawals(session.id);
    }, [navigate]);

    const loadWithdrawals = async (userId) => {
        try {
            const userWithdrawals = await db.getUserWithdrawals(userId);
            setWithdrawals(userWithdrawals);
        } catch (error) {
            console.error('Error loading withdrawals:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const tokens = parseFloat(amount);

        if (!tokens || tokens < 10) {
            toast({
                title: "Error",
                description: "El mínimo para retirar es 10 tokens",
                variant: "destructive"
            });
            setLoading(false);
            return;
        }

        if (tokens > user.tokens) {
            toast({
                title: "Error",
                description: "No tienes suficientes tokens",
                variant: "destructive"
            });
            setLoading(false);
            return;
        }

        if (!method || !accountInfo) {
            toast({
                title: "Error",
                description: "Completa todos los campos",
                variant: "destructive"
            });
            setLoading(false);
            return;
        }

        const result = await db.requestWithdrawal(user.id, tokens, method, accountInfo);

        if (result.success) {
            toast({
                title: "✅ Solicitud Enviada",
                description: `Tu retiro de ${tokens} tokens está siendo procesado`,
                className: "bg-green-950 border-green-800 text-white"
            });
            // Actualizar estado
            const allUsers = JSON.parse(localStorage.getItem('fortnite_platform_users') || '[]');
            const updatedUser = allUsers.find(u => u.id === user.id);
            setUser(updatedUser);
            loadWithdrawals(user.id);
            // Limpiar formulario
            setAmount('');
            setMethod('');
            setAccountInfo('');
        }
        else {
            toast({
                title: "Error",
                description: result.error || 'Error procesando retiro',
                variant: "destructive"
            });
        }

        setLoading(false);
    };

    if (!user) return null;

    const statusConfig = {
        pending: { color: 'text-yellow-400', bg: 'bg-yellow-950/30', border: 'border-yellow-500/30', icon: Clock, label: 'Pendiente' },
        completed: { color: 'text-green-400', bg: 'bg-green-950/30', border: 'border-green-500/30', icon: CheckCircle, label: 'Completado' },
        failed: { color: 'text-red-400', bg: 'bg-red-950/30', border: 'border-red-500/30', icon: AlertCircle, label: 'Fallido' }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050911] via-[#0a1628] to-[#050911] pt-10 pb-20 relative">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-green-600/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-emerald-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            
            <Helmet>
                <title>Retiros | BusFare-tokens</title>
            </Helmet>

            <div className="container mx-auto px-4 relative z-10">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-4xl font-black text-white mb-2 text-glow">Retiros de Tokens</h1>
                    <p className="text-blue-200/80 text-sm sm:text-base">Convierte tus tokens en dinero real</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                    {/* Formulario de Retiro */}
                    <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-green-400" />
                                Solicitar Retiro
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-6 p-4 bg-blue-950/30 rounded-lg border border-blue-500/20">
                                <div className="flex items-center justify-between">
                                    <span className="text-blue-200">Balance disponible:</span>
                                    <span className="text-2xl font-bold text-green-400 flex items-center gap-1">
                                        {user.tokens.toFixed(2)} <Coins className="h-5 w-5" />
                                    </span>
                                </div>
                                <div className="text-sm text-blue-300/60 mt-1">
                                    ≈ ${(user.tokens / 100).toFixed(2)} USD
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label className="text-blue-200">Cantidad de Tokens</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="10"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="Mínimo 10 tokens"
                                        className="bg-blue-950/30 border-blue-500/30 text-white mt-1"
                                    />
                                    <p className="text-xs text-blue-300/60 mt-1">
                                        Recibirás: ${amount ? (parseFloat(amount) / 100).toFixed(2) : '0.00'} USD
                                    </p>
                                </div>

                                <div>
                                    <Label className="text-blue-200">Método de Pago</Label>
                                    <Select value={method} onValueChange={setMethod}>
                                        <SelectTrigger className="bg-blue-950/30 border-blue-500/30 text-white mt-1">
                                            <SelectValue placeholder="Selecciona método" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-blue-500/30">
                                            <SelectItem value="paypal">PayPal</SelectItem>
                                            <SelectItem value="stripe">Stripe</SelectItem>
                                            <SelectItem value="bank">Transferencia Bancaria</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-blue-200">
                                        {method === 'paypal' && 'Email de PayPal'}
                                        {method === 'stripe' && 'Email de Stripe'}
                                        {method === 'bank' && 'Número de Cuenta'}
                                        {!method && 'Información de la Cuenta'}
                                    </Label>
                                    <Input
                                        type="text"
                                        value={accountInfo}
                                        onChange={(e) => setAccountInfo(e.target.value)}
                                        placeholder={
                                            method === 'paypal' ? 'tu@email.com' :
                                            method === 'stripe' ? 'tu@email.com' :
                                            method === 'bank' ? 'ES00 0000 0000 0000 0000' :
                                            'Selecciona un método primero'
                                        }
                                        className="bg-blue-950/30 border-blue-500/30 text-white mt-1"
                                    />
                                </div>

                                <div className="bg-yellow-950/30 border border-yellow-500/30 rounded-lg p-3">
                                    <div className="flex gap-2">
                                        <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                                        <div className="text-xs text-yellow-200">
                                            <p className="font-semibold mb-1">Información importante:</p>
                                            <ul className="list-disc list-inside space-y-1">
                                                <li>Mínimo: 10 tokens ($0.10 USD)</li>
                                                <li>Procesamiento: 2-5 días hábiles</li>
                                                <li>Comisión: 5% del total</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                >
                                    {loading ? 'Procesando...' : 'Solicitar Retiro'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Historial de Retiros */}
                    <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Clock className="h-5 w-5 text-blue-400" />
                                Historial de Retiros
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {withdrawals.length === 0 ? (
                                <div className="text-center py-12 text-blue-300/70">
                                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No tienes retiros realizados</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {withdrawals.map((withdrawal) => {
                                        const config = statusConfig[withdrawal.status];
                                        const StatusIcon = config.icon;
                                        
                                        return (
                                            <div
                                                key={withdrawal.id}
                                                className={`p-4 rounded-lg border ${config.bg} ${config.border} hover:scale-105 transition-all`}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <StatusIcon className={`h-5 w-5 ${config.color}`} />
                                                        <span className={`text-sm font-semibold ${config.color}`}>
                                                            {config.label}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-blue-300/60">
                                                        {new Date(withdrawal.date).toLocaleDateString('es-ES')}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-white font-bold">
                                                            {withdrawal.amount.toFixed(2)} Tokens
                                                        </p>
                                                        <p className="text-sm text-blue-300/70">
                                                            ${(withdrawal.amount / 100).toFixed(2)} USD
                                                        </p>
                                                        <p className="text-xs text-blue-300/50 mt-1">
                                                            {withdrawal.method.toUpperCase()}
                                                        </p>
                                                    </div>
                                                    {withdrawal.status === 'completed' && withdrawal.processedAt && (
                                                        <div className="text-right text-xs text-green-400/70">
                                                            Procesado el<br />
                                                            {new Date(withdrawal.processedAt).toLocaleDateString('es-ES')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Withdrawals;
