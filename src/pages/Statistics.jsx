import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, TrendingUp, Target, Award, Star, Zap, Shield } from 'lucide-react';
import { Helmet } from 'react-helmet';

const Statistics = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const session = db.getSession();
        if (!session) {
            navigate('/login');
            return;
        }
        const userStats = db.getUserStatistics(session.id);
        setStats(userStats);
    }, [navigate]);

    if (!stats) return null;

    const statCards = [
        {
            title: 'Win Rate',
            value: `${stats.statistics.winRate}%`,
            icon: Trophy,
            color: 'text-yellow-400',
            bgColor: 'from-yellow-600/20 to-orange-600/20'
        },
        {
            title: 'Nivel Actual',
            value: stats.statistics.currentLevel,
            icon: Star,
            color: 'text-cyan-400',
            bgColor: 'from-cyan-600/20 to-blue-600/20'
        },
        {
            title: 'Total Partidas',
            value: stats.statistics.totalMatches,
            icon: Target,
            color: 'text-blue-400',
            bgColor: 'from-blue-600/20 to-indigo-600/20'
        },
        {
            title: 'Promedio Ganado',
            value: `${stats.statistics.averageEarnings} 🪙`,
            icon: TrendingUp,
            color: 'text-green-400',
            bgColor: 'from-green-600/20 to-emerald-600/20'
        },
        {
            title: 'Reputación',
            value: `${stats.statistics.reputation}/100`,
            icon: Shield,
            color: 'text-purple-400',
            bgColor: 'from-purple-600/20 to-pink-600/20'
        },
        {
            title: 'XP Siguiente Nivel',
            value: stats.statistics.nextLevelXP,
            icon: Zap,
            color: 'text-orange-400',
            bgColor: 'from-orange-600/20 to-red-600/20'
        }
    ];

    const recentMatches = (stats.matchHistory || []).slice(0, 10);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050911] via-[#0a1628] to-[#050911] pt-10 pb-20 relative">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            
            <Helmet>
                <title>Estadísticas | BusFare-tokens</title>
            </Helmet>

            <div className="container mx-auto px-4 relative z-10">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-4xl font-black text-white mb-2 text-glow">Tus Estadísticas</h1>
                    <p className="text-blue-200/80 text-sm sm:text-base">Análisis detallado de tu rendimiento</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {statCards.map((stat, index) => (
                        <Card 
                            key={index}
                            className={`bg-gradient-to-br ${stat.bgColor} backdrop-blur-sm border-blue-500/20 hover:scale-105 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]`}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-200/70 text-sm mb-1">{stat.title}</p>
                                        <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                                    </div>
                                    <stat.icon className={`h-12 w-12 ${stat.color} opacity-50`} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Barra de Progreso de Nivel */}
                <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20 mb-8">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Star className="h-5 w-5 text-cyan-400" />
                            Progreso de Nivel {stats.statistics.currentLevel}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-blue-300">Experiencia: {stats.experience || 0} XP</span>
                                <span className="text-blue-300">Siguiente nivel: {stats.statistics.currentLevel * 1000} XP</span>
                            </div>
                            <div className="w-full bg-blue-950/50 rounded-full h-4 overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500 shadow-[0_0_20px_rgba(34,211,238,0.6)]"
                                    style={{ width: `${((stats.experience || 0) / (stats.statistics.currentLevel * 1000)) * 100}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Historial Reciente */}
                <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-blue-400" />
                            Últimas 10 Partidas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentMatches.length === 0 ? (
                            <div className="text-center py-12 text-blue-300/70">
                                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No hay partidas jugadas aún</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {recentMatches.map((match, index) => (
                                    <div 
                                        key={match.id || index}
                                        className={`p-4 rounded-lg border ${match.result === 'win' ? 'bg-green-950/30 border-green-500/30' : 'bg-red-950/30 border-red-500/30'} hover:scale-105 transition-all`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {match.result === 'win' ? (
                                                    <Trophy className="h-5 w-5 text-green-400" />
                                                ) : (
                                                    <Target className="h-5 w-5 text-red-400" />
                                                )}
                                                <div>
                                                    <p className={`font-bold ${match.result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                                                        {match.result === 'win' ? 'VICTORIA' : 'DERROTA'}
                                                    </p>
                                                    <p className="text-blue-200/60 text-sm">
                                                        {match.type} {match.mode} vs {match.opponent}
                                                    </p>
                                                    <p className="text-blue-300/50 text-xs">
                                                        {new Date(match.date).toLocaleDateString('es-ES')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-lg font-bold ${match.result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                                                    {match.result === 'win' ? '+' : '-'}{match.tokens.toFixed(2)} 🪙
                                                </p>
                                                {match.result === 'win' && (
                                                    <p className="text-cyan-400 text-sm">+100 XP</p>
                                                )}
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

export default Statistics;
