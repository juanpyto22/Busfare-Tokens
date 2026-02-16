import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Coins, Lock } from 'lucide-react';
import { Helmet } from 'react-helmet';

const Leaderboard = () => {
    const navigate = useNavigate();
    const [players, setPlayers] = useState([]);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        const fetchData = async () => {
            const session = db.getSession();
            setUser(session);
            setIsLoading(false);
            if (session) {
                try {
                    const leaderboard = await db.getLeaderboard();
                    setPlayers(leaderboard || []);
                } catch (err) {
                    setPlayers([]);
                }
            }
        };
        fetchData();
    }, []);

    const getRankIcon = (rank) => {
        if (rank === 0) return <Trophy className="h-6 w-6 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />;
        if (rank === 1) return <Medal className="h-6 w-6 text-blue-300 drop-shadow-[0_0_10px_rgba(147,197,253,0.6)]" />;
        if (rank === 2) return <Medal className="h-6 w-6 text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]" />;
        return <span className="text-lg font-bold text-blue-400/70">#{rank + 1}</span>;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050911] via-[#0a1628] to-[#050911] pt-10 pb-20 relative">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            
             <Helmet>
                <title>Ranking Global | BusFare-tokens</title>
            </Helmet>
            <div className="container mx-auto px-4 max-w-4xl relative z-10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-white mb-2 text-glow">RANKING GLOBAL</h1>
                    <p className="text-blue-200/80">Los jugadores con mayores ganancias.</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
                    </div>
                ) : !user ? (
                    <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20">
                        <div className="p-12 text-center">
                            <div className="mb-6 flex justify-center">
                                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-400/30">
                                    <Lock className="h-10 w-10 text-cyan-400" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-black text-white mb-3">Contenido Bloqueado</h2>
                            <p className="text-blue-200/70 mb-6">Inicia sesión o regístrate para ver el ranking global</p>
                            <div className="flex gap-3 justify-center">
                                <Button
                                    onClick={() => navigate('/login')}
                                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 px-8"
                                >
                                    Iniciar Sesión
                                </Button>
                                <Button
                                    onClick={() => navigate('/register')}
                                    variant="outline"
                                    className="border-blue-500/30 text-blue-300 hover:bg-blue-950/50 px-8"
                                >
                                    Registrarse
                                </Button>
                            </div>
                        </div>
                    </Card>
                ) : (
                <div className="space-y-2">
                    {players.map((player, idx) => (
                        <div 
                            key={player.id}
                            className={`flex items-center p-4 rounded-xl border transition-all duration-300 ${
                                idx <= 2
                                    ? 'bg-gradient-to-r from-blue-950/60 to-cyan-950/40 border-cyan-400/40 shadow-[0_0_20px_rgba(34,211,238,0.2)]' 
                                    : 'bg-gradient-to-br from-blue-950/30 to-slate-900/30 border-blue-500/20 hover:border-blue-400/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                            }`}
                        >
                            <div className="w-16 flex justify-center">
                                {getRankIcon(idx)}
                            </div>
                            
                            <div className="flex-1 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-slate-900 border border-blue-500/30 overflow-hidden">
                                     <img 
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.username}`} 
                                        alt="Avatar" 
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div>
                                    <div className="font-bold text-white">{player.username}</div>
                                    <div className="text-xs text-blue-300/70">{player.wins} Victorias</div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="flex items-center gap-1 justify-end font-black text-cyan-400 text-lg">
                                    <Coins className="h-4 w-4" />
                                    {player.earnings.toLocaleString()}
                                </div>
                                <div className="text-xs text-blue-400/70 uppercase">Ganancias Totales</div>
                            </div>
                        </div>
                    ))}
                    {players.length === 0 && (
                        <div className="text-center text-blue-300/70 py-10">
                            No hay datos suficientes aún.
                        </div>
                    )}
                </div>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;