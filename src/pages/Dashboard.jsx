import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, History, TrendingUp, Calendar, BarChart3, Receipt, ArrowDownToLine } from 'lucide-react';
import { Helmet } from 'react-helmet';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const session = db.getSession();
        if (!session) {
            navigate('/login');
            return;
        }
        const allUsers = JSON.parse(localStorage.getItem('fortnite_platform_users') || '[]');
        const updatedUser = allUsers.find(u => u.id === session.id);
        setUser(updatedUser || session);
    }, [navigate]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-950 pt-10 pb-20">
            <Helmet>
                <title>Dashboard | BusFare-tokens</title>
            </Helmet>
            <div className="container mx-auto px-4">
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-white">Panel de Control</h1>
                    <p className="text-slate-400">Bienvenido de nuevo, <span className="text-green-400 font-semibold">{user.username}</span></p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-8">
                    <Button
                        onClick={() => navigate('/statistics')}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white h-14"
                    >
                        <BarChart3 className="mr-2 h-5 w-5" />
                        Ver Estadísticas Avanzadas
                    </Button>
                    <Button
                        onClick={() => navigate('/transactions')}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-14"
                    >
                        <Receipt className="mr-2 h-5 w-5" />
                        Historial Completo de Transacciones
                    </Button>
                    <Button
                        onClick={() => navigate('/withdrawals')}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-14"
                    >
                        <ArrowDownToLine className="mr-2 h-5 w-5" />
                        Solicitar Retiro de Tokens
                    </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-10">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Balance Total</CardTitle>
                            <Coins className="h-4 w-4 text-green-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{user.tokens.toLocaleString()}</div>
                            <p className="text-xs text-slate-500 mt-1">Tokens Disponibles</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Valor Estimado</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">${(user.tokens / 100).toFixed(2)}</div>
                            <p className="text-xs text-slate-500 mt-1">USD</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Miembro Desde</CardTitle>
                            <Calendar className="h-4 w-4 text-violet-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">
                                {new Date(user.joinedAt).toLocaleDateString()}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Fecha de registro</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <History className="h-5 w-5" />
                            Historial de Transacciones
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {user.transactions && user.transactions.length > 0 ? (
                            <div className="space-y-4">
                                {user.transactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-950/50 border border-slate-800/50">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                                <Coins className="h-5 w-5 text-green-400" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-white">Compra de Tokens</div>
                                                <div className="text-xs text-slate-500">{new Date(tx.date).toLocaleString()}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-green-400">+{tx.amount.toLocaleString()}</div>
                                            <div className="text-xs text-slate-500">Coste: ${tx.cost}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-slate-500">
                                No tienes transacciones recientes.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;