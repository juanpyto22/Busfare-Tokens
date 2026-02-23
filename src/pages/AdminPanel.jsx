import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Users, Ban, Trash2, Check, X, Clock, DollarSign, AlertTriangle } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useToast } from '@/components/ui/use-toast';

const AdminPanel = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [currentUser, setCurrentUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const session = db.getSession();
        if (!session) {
            navigate('/login');
            return;
        }
        if (session.role !== 'admin') {
            toast({
                title: "Acceso Denegado",
                description: "No tienes permisos de administrador",
                variant: "destructive"
            });
            navigate('/dashboard');
            return;
        }
        setCurrentUser(session);
        loadData();
    }, [navigate]);

    const loadData = () => {
        setUsers(db.getAllUsers());
        setPendingWithdrawals(db.getPendingWithdrawals());
    };

    const handleBanUser = (userId, username) => {
        const duration = prompt(`¿Cuántos días banear a ${username}?`, '7');
        if (!duration) return;
        
        const reason = prompt('Razón del ban:', '');
        const result = db.banUser(userId, parseInt(duration), reason);
        
        if (result.success) {
            toast({
                title: "Usuario Baneado",
                description: `${username} baneado por ${duration} días`,
                className: "bg-red-950 border-red-800 text-white"
            });
            loadData();
        }
    };

    const handleUnbanUser = (userId, username) => {
        const result = db.unbanUser(userId);
        if (result.success) {
            toast({
                title: "Usuario Desbaneado",
                description: `${username} puede acceder de nuevo`,
                className: "bg-green-950 border-green-800 text-white"
            });
            loadData();
        }
    };

    const handleDeleteUser = (userId, username) => {
        if (!confirm(`¿Eliminar permanentemente a ${username}?`)) return;
        
        const result = db.deleteUser(userId);
        if (result.success) {
            toast({
                title: "Usuario Eliminado",
                description: `${username} ha sido eliminado del sistema`,
                className: "bg-red-950 border-red-800 text-white"
            });
            loadData();
        }
    };

    const handleUpdateTokens = (userId, username, currentTokens) => {
        const newAmount = prompt(`Tokens actuales de ${username}: ${currentTokens}\n\nNuevo valor:`, currentTokens);
        if (!newAmount) return;

        const result = db.updateUser(userId, { tokens: parseFloat(newAmount) });
        if (result.success) {
            toast({
                title: "Tokens Actualizados",
                description: `${username} ahora tiene ${newAmount} tokens`,
                className: "bg-blue-950 border-blue-800 text-white"
            });
            loadData();
        }
    };

    const handleProcessWithdrawal = (userId, withdrawalId, action, amount, userName) => {
        const result = db.processWithdrawal(userId, withdrawalId, action);
        if (result.success) {
            toast({
                title: action === 'completed' ? "Retiro Aprobado" : "Retiro Rechazado",
                description: `${amount} tokens de ${userName}`,
                className: action === 'completed' ? "bg-green-950 border-green-800 text-white" : "bg-red-950 border-red-800 text-white"
            });
            loadData();
        }
    };

    if (!currentUser) return null;

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (filter === 'all') return matchesSearch;
        if (filter === 'banned') return matchesSearch && u.bannedUntil && new Date(u.bannedUntil) > new Date();
        if (filter === 'verified') return matchesSearch && u.emailVerified;
        if (filter === 'unverified') return matchesSearch && !u.emailVerified;
        return matchesSearch;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050911] via-[#0a1628] to-[#050911] pt-10 pb-20 relative">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-orange-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            
            <Helmet>
                <title>Panel de Administración | BusFare-tokens</title>
            </Helmet>

            <div className="container mx-auto px-4 relative z-10">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-4xl font-black text-white mb-2 text-glow flex items-center gap-2 sm:gap-3">
                        <Shield className="h-7 w-7 sm:h-10 sm:w-10 text-red-400 shrink-0" />
                        Panel de Administración
                    </h1>
                    <p className="text-blue-200/80 text-sm sm:text-base">Control total del sistema</p>
                </div>

                {/* Estadísticas Rápidas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-200/70 text-sm">Total Usuarios</p>
                                    <p className="text-3xl font-black text-white">{users.length}</p>
                                </div>
                                <Users className="h-10 w-10 text-blue-400 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-950/40 to-slate-900/40 backdrop-blur-sm border-green-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-200/70 text-sm">Verificados</p>
                                    <p className="text-3xl font-black text-white">
                                        {users.filter(u => u.emailVerified).length}
                                    </p>
                                </div>
                                <Check className="h-10 w-10 text-green-400 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-950/40 to-slate-900/40 backdrop-blur-sm border-red-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-red-200/70 text-sm">Baneados</p>
                                    <p className="text-3xl font-black text-white">
                                        {users.filter(u => u.bannedUntil && new Date(u.bannedUntil) > new Date()).length}
                                    </p>
                                </div>
                                <Ban className="h-10 w-10 text-red-400 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-yellow-950/40 to-slate-900/40 backdrop-blur-sm border-yellow-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-yellow-200/70 text-sm">Retiros Pendientes</p>
                                    <p className="text-3xl font-black text-white">{pendingWithdrawals.length}</p>
                                </div>
                                <Clock className="h-10 w-10 text-yellow-400 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Retiros Pendientes */}
                {pendingWithdrawals.length > 0 && (
                    <Card className="bg-gradient-to-br from-yellow-950/40 to-slate-900/40 backdrop-blur-sm border-yellow-500/20 mb-8">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-yellow-400" />
                                Retiros Pendientes de Aprobación
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {pendingWithdrawals.map((withdrawal) => (
                                    <div key={withdrawal.id} className="flex items-center justify-between p-4 bg-yellow-950/20 rounded-lg border border-yellow-500/30">
                                        <div>
                                            <p className="text-white font-bold">{withdrawal.userName}</p>
                                            <p className="text-yellow-200/70 text-sm">{withdrawal.userEmail}</p>
                                            <p className="text-yellow-300 font-semibold">{withdrawal.amount} tokens (${(withdrawal.amount / 100).toFixed(2)})</p>
                                            <p className="text-yellow-200/50 text-xs mt-1">
                                                {withdrawal.method.toUpperCase()} - {withdrawal.accountInfo}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleProcessWithdrawal(withdrawal.userId, withdrawal.id, 'completed', withdrawal.amount, withdrawal.userName)}
                                                className="bg-green-600 hover:bg-green-700"
                                                size="sm"
                                            >
                                                <Check className="h-4 w-4 mr-1" />
                                                Aprobar
                                            </Button>
                                            <Button
                                                onClick={() => handleProcessWithdrawal(withdrawal.userId, withdrawal.id, 'failed', withdrawal.amount, withdrawal.userName)}
                                                className="bg-red-600 hover:bg-red-700"
                                                size="sm"
                                            >
                                                <X className="h-4 w-4 mr-1" />
                                                Rechazar
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Gestión de Usuarios */}
                <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-400" />
                                Gestión de Usuarios
                            </span>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Input
                                    placeholder="Buscar usuario..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full sm:w-64 bg-blue-950/30 border-blue-500/30 text-white"
                                />
                            </div>
                        </CardTitle>
                        <div className="flex flex-wrap gap-2 mt-4">
                            <Button
                                onClick={() => setFilter('all')}
                                variant={filter === 'all' ? 'default' : 'outline'}
                                size="sm"
                            >
                                Todos
                            </Button>
                            <Button
                                onClick={() => setFilter('verified')}
                                variant={filter === 'verified' ? 'default' : 'outline'}
                                size="sm"
                            >
                                Verificados
                            </Button>
                            <Button
                                onClick={() => setFilter('unverified')}
                                variant={filter === 'unverified' ? 'default' : 'outline'}
                                size="sm"
                            >
                                Sin Verificar
                            </Button>
                            <Button
                                onClick={() => setFilter('banned')}
                                variant={filter === 'banned' ? 'default' : 'outline'}
                                size="sm"
                            >
                                Baneados
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-[600px] overflow-y-auto">
                            {filteredUsers.map((user) => {
                                const isBanned = user.bannedUntil && new Date(user.bannedUntil) > new Date();
                                
                                return (
                                    <div
                                        key={user.id}
                                        className={`p-4 rounded-lg border ${
                                            isBanned ? 'bg-red-950/30 border-red-500/30' : 'bg-blue-950/20 border-blue-500/20'
                                        } hover:scale-[1.02] transition-all`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <p className="text-white font-bold">{user.username}</p>
                                                    {user.role === 'admin' && (
                                                        <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">ADMIN</span>
                                                    )}
                                                    {user.role === 'moderator' && (
                                                        <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">MODERADOR</span>
                                                    )}
                                                    {user.emailVerified && (
                                                        <Check className="h-4 w-4 text-green-400" />
                                                    )}
                                                    {isBanned && (
                                                        <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                                            <Ban className="h-3 w-3" />
                                                            BANEADO
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-blue-200/70 text-sm">{user.email}</p>
                                                <div className="flex gap-4 mt-2 text-xs">
                                                    <span className="text-green-400">Tokens: {user.tokens.toFixed(2)}</span>
                                                    <span className="text-cyan-400">Nivel: {user.level || 1}</span>
                                                    <span className="text-purple-400">Reputación: {user.reputation || 100}</span>
                                                    {user.reportedCount > 0 && (
                                                        <span className="text-red-400 flex items-center gap-1">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            Reportes: {user.reportedCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleUpdateTokens(user.id, user.username, user.tokens)}
                                                    className="bg-blue-600 hover:bg-blue-700"
                                                    size="sm"
                                                >
                                                    💰 Tokens
                                                </Button>
                                                {!isBanned ? (
                                                    <Button
                                                        onClick={() => handleBanUser(user.id, user.username)}
                                                        className="bg-orange-600 hover:bg-orange-700"
                                                        size="sm"
                                                    >
                                                        <Ban className="h-4 w-4" />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={() => handleUnbanUser(user.id, user.username)}
                                                        className="bg-green-600 hover:bg-green-700"
                                                        size="sm"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {user.role !== 'admin' && (
                                                    <Button
                                                        onClick={() => handleDeleteUser(user.id, user.username)}
                                                        className="bg-red-600 hover:bg-red-700"
                                                        size="sm"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminPanel;
