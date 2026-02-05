import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownLeft, Coins, CreditCard, TrendingUp, TrendingDown, DollarSign, Filter } from 'lucide-react';
import { Helmet } from 'react-helmet';

const Transactions = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [filter, setFilter] = useState('all'); // all, purchase, withdrawal, match, tip

    useEffect(() => {
        const session = db.getSession();
        if (!session) {
            navigate('/login');
            return;
        }
        setUser(session);
        setTransactions(session.transactions || []);
    }, [navigate]);

    const getFilteredTransactions = () => {
        if (filter === 'all') return transactions;
        return transactions.filter(t => t.type === filter);
    };

    const getTransactionIcon = (type) => {
        switch(type) {
            case 'purchase': return <CreditCard className="h-5 w-5 text-green-400" />;
            case 'withdrawal': return <DollarSign className="h-5 w-5 text-blue-400" />;
            case 'match_win': return <TrendingUp className="h-5 w-5 text-cyan-400" />;
            case 'match_loss': return <TrendingDown className="h-5 w-5 text-red-400" />;
            case 'tip': return <Coins className="h-5 w-5 text-yellow-400" />;
            default: return <Coins className="h-5 w-5 text-gray-400" />;
        }
    };

    const getTransactionColor = (amount) => {
        return amount > 0 ? 'text-green-400' : 'text-red-400';
    };

    if (!user) return null;

    const filteredTransactions = getFilteredTransactions();

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050911] via-[#0a1628] to-[#050911] pt-10 pb-20 relative">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            
            <Helmet>
                <title>Transacciones | BusFare-tokens</title>
            </Helmet>

            <div className="container mx-auto px-4 relative z-10">
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-white mb-2 text-glow">Historial de Transacciones</h1>
                    <p className="text-blue-200/80">Revisa todos tus movimientos de tokens</p>
                </div>

                {/* Filtros */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <Button
                        onClick={() => setFilter('all')}
                        variant={filter === 'all' ? 'default' : 'outline'}
                        className={filter === 'all' ? 'bg-blue-600' : 'border-blue-500/30 text-blue-300'}
                    >
                        <Filter className="h-4 w-4 mr-2" /> Todas
                    </Button>
                    <Button
                        onClick={() => setFilter('purchase')}
                        variant={filter === 'purchase' ? 'default' : 'outline'}
                        className={filter === 'purchase' ? 'bg-green-600' : 'border-green-500/30 text-green-300'}
                    >
                        <CreditCard className="h-4 w-4 mr-2" /> Compras
                    </Button>
                    <Button
                        onClick={() => setFilter('withdrawal')}
                        variant={filter === 'withdrawal' ? 'default' : 'outline'}
                        className={filter === 'withdrawal' ? 'bg-blue-600' : 'border-blue-500/30 text-blue-300'}
                    >
                        <DollarSign className="h-4 w-4 mr-2" /> Retiros
                    </Button>
                    <Button
                        onClick={() => setFilter('match_win')}
                        variant={filter === 'match_win' ? 'default' : 'outline'}
                        className={filter === 'match_win' ? 'bg-cyan-600' : 'border-cyan-500/30 text-cyan-300'}
                    >
                        <TrendingUp className="h-4 w-4 mr-2" /> Victorias
                    </Button>
                    <Button
                        onClick={() => setFilter('tip')}
                        variant={filter === 'tip' ? 'default' : 'outline'}
                        className={filter === 'tip' ? 'bg-yellow-600' : 'border-yellow-500/30 text-yellow-300'}
                    >
                        <Coins className="h-4 w-4 mr-2" /> Tips
                    </Button>
                </div>

                {/* Lista de transacciones */}
                <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Coins className="h-5 w-5 text-blue-400" />
                            Movimientos ({filteredTransactions.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredTransactions.length === 0 ? (
                            <div className="text-center py-12 text-blue-300/70">
                                <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No hay transacciones que mostrar</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredTransactions.map((transaction, index) => (
                                    <div 
                                        key={transaction.id || index}
                                        className="bg-blue-950/30 rounded-lg p-4 border border-blue-500/20 hover:border-blue-400/40 transition-all"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {getTransactionIcon(transaction.type)}
                                                <div>
                                                    <p className="text-white font-semibold">
                                                        {transaction.description || transaction.type}
                                                    </p>
                                                    <p className="text-blue-300/60 text-sm">
                                                        {new Date(transaction.date).toLocaleDateString('es-ES', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-xl font-bold ${getTransactionColor(transaction.amount)}`}>
                                                    {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} tokens
                                                </p>
                                                <p className={`text-xs ${transaction.status === 'completed' ? 'text-green-400' : transaction.status === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}>
                                                    {transaction.status === 'completed' ? 'Completado' : transaction.status === 'pending' ? 'Pendiente' : 'Fallido'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Transactions;
