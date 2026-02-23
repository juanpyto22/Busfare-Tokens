import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Coins, Trophy, Map, Monitor, Globe, Users, MessageSquare, Send, Copy, AlertCircle, LogOut, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Helmet } from 'react-helmet';

const MatchDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [match, setMatch] = useState(null);
    const [user, setUser] = useState(null);
    const [chatInput, setChatInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [playerReadyStatus, setPlayerReadyStatus] = useState({}); // Track ready status for each player
    const [showLeaveDialog, setShowLeaveDialog] = useState(false);
    const [showDisputeDialog, setShowDisputeDialog] = useState(false);
    const [showResultDialog, setShowResultDialog] = useState(false);
    const [screenshotUrl, setScreenshotUrl] = useState("");
    const [disputeReason, setDisputeReason] = useState("");
    const [isSubmittingResult, setIsSubmittingResult] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        // Prevenir scroll en el body
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            const session = db.getSession();
            if (!session) {
                navigate('/login');
                return;
            }
            
            setUser(session);
            
            try {
                const m = await db.getMatchById(id);
                console.log('Match obtenido:', m);
                if (m) {
                    setMatch(m);
                    if (m.playersReady) {
                        setPlayerReadyStatus(m.playersReady);
                    }
                } else {
                    console.error('Match no encontrado');
                }
            } catch (error) {
                console.error('Error cargando match:', error);
            }
            setIsLoading(false);
        };
        fetchData();
        
        // Polling para actualizaciones
        const interval = setInterval(async () => {
            try {
                const m = await db.getMatchById(id);
                if (m) {
                    setMatch(m);
                    if (m.playersReady) {
                        setPlayerReadyStatus(m.playersReady);
                    }
                }
            } catch (error) {
                console.error('Error actualizando match:', error);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [id, navigate]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [match?.chat]);

    const handleJoin = async () => {
        if (!user) {
             navigate('/login');
             return;
        }
        const { match: updatedMatch, error } = await db.joinMatch(id);
        if (error) {
            toast({ title: "Error al unirse", description: error, variant: "destructive" });
        } else {
            // Initialize ready status for this player as false in the database
            const matchWithReady = db.updatePlayerReady(id, user.id, false);
            if (matchWithReady) {
                setMatch(matchWithReady);
                setPlayerReadyStatus(matchWithReady.playersReady || {});
            } else {
                setMatch(updatedMatch);
            }
            toast({ title: "Te has unido", description: "¡Prepárate para la batalla!", className: "bg-green-600 text-white" });
        }
    };

    const handleToggleReady = () => {
        if (!user) return;
        const isCurrentlyReady = playerReadyStatus[user.id];
        const newReadyStatus = !isCurrentlyReady;
        
        // Actualizar en la base de datos
        const updatedMatch = db.updatePlayerReady(id, user.id, newReadyStatus);
        
        if (!updatedMatch) {
            // No se pudo actualizar (probablemente tokens insuficientes)
            toast({ 
                title: "Tokens insuficientes",
                description: `Necesitas ${match?.entryFee || 0} tokens para marcar como listo`,
                variant: "destructive"
            });
            return;
        }
        
        setMatch(updatedMatch);
        setPlayerReadyStatus(updatedMatch.playersReady || {});
        
        if (newReadyStatus) {
            // Verificar si ambos jugadores están listos
            const allReady = updatedMatch.players.every(p => updatedMatch.playersReady?.[p.id] === true);
            if (allReady) {
                toast({ 
                    title: "¡Match iniciado!",
                    description: "Ambos jugadores están listos. ¡Buena suerte!",
                    className: "bg-green-600 text-white border-green-500"
                });
            } else {
                toast({ 
                    title: "¡Listo para la batalla!",
                    description: `${match?.entryFee || 0} tokens descontados. Esperando al oponente...`,
                    className: "bg-green-600 text-white border-green-500"
                });
            }
        } else {
            toast({ 
                title: "Ready cancelado",
                description: `${match?.entryFee || 0} tokens devueltos`,
                className: "bg-slate-700 text-white border-slate-600"
            });
        }
    };

    const handleLeaveMatch = () => {
        setShowLeaveDialog(true);
    };

    const confirmLeaveMatch = async () => {
        try {
            await db.leaveMatch(id, user.id);
        } catch (e) {
            console.error('Error leaving match:', e);
        }
        setShowLeaveDialog(false);
        navigate('/matches');
        toast({ 
            title: "Has salido del match",
            description: "Vuelve cuando estés listo para competir",
            variant: "destructive"
        });
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        db.sendMessage(id, chatInput);
        setChatInput("");
    };

    const handleSubmitResult = async () => {
        if (!screenshotUrl.trim()) {
            toast({
                title: "Falta evidencia",
                description: "Debes proporcionar un enlace a tu captura de pantalla",
                variant: "destructive"
            });
            return;
        }

        setIsSubmittingResult(true);
        try {
            const result = await db.uploadScreenshot(id, user.id, screenshotUrl);
            
            if (result.success) {
                toast({
                    title: "¡Resultado enviado!",
                    description: "Tu captura ha sido registrada. Esperando revisión...",
                    className: "bg-green-600 text-white"
                });
                setScreenshotUrl("");
                setShowResultDialog(false);
                // Actualizar match
                fetchData();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error.message || "No se pudo enviar el resultado",
                variant: "destructive"
            });
        } finally {
            setIsSubmittingResult(false);
        }
    };

    const handleCreateDispute = async () => {
        if (!disputeReason.trim()) {
            toast({
                title: "Proporciona un motivo",
                description: "Debes explicar el motivo de tu reporte",
                variant: "destructive"
            });
            return;
        }

        try {
            const result = await db.createDispute(id, user.id, disputeReason, screenshotUrl);
            
            if (result.success) {
                toast({
                    title: "Reporte creado",
                    description: "Un moderador revisará tu caso pronto",
                    className: "bg-green-600 text-white"
                });
                setDisputeReason("");
                setScreenshotUrl("");
                setShowDisputeDialog(false);
                fetchData();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error.message || "No se pudo crear el reporte",
                variant: "destructive"
            });
        }
    };

    if (isLoading) return <div className="min-h-screen bg-gradient-to-br from-[#050911] via-[#0a1628] to-[#050911] flex items-center justify-center text-white">Cargando...</div>;
    if (!match) return <div className="min-h-screen bg-gradient-to-br from-[#050911] via-[#0a1628] to-[#050911] flex items-center justify-center text-white">Match no encontrado</div>;

    const isParticipant = match.players.some(p => p.id === user?.id);

    return (
        <div className="h-screen bg-gradient-to-br from-[#050911] via-[#0a1628] to-[#050911] flex flex-col relative pt-20 md:pt-32 overflow-hidden">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            
            <Helmet>
                <title>{match.mode} Match | BusFare-tokens</title>
            </Helmet>
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-950/60 via-slate-900/60 to-blue-950/60 backdrop-blur-sm border-b border-blue-500/20 p-3 sm:p-6 relative z-10 mt-4 sm:mt-8">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div className="flex-1">
                            <div className="text-blue-300/70 text-sm mb-1 uppercase tracking-widest font-bold">Match #{match.id}</div>
                            <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-white uppercase italic text-glow">{match.type} {match.mode}</h1>
                        </div>
                        <div className="flex gap-4 mt-4 md:mt-0">
                             <div className="flex items-center gap-2 bg-blue-950/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-blue-500/30">
                                <Globe className="h-4 w-4 text-cyan-400" />
                                <span className="font-bold text-white">{match.region}</span>
                             </div>
                             <div className="flex items-center gap-2 bg-blue-950/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-blue-500/30">
                                <Monitor className="h-4 w-4 text-cyan-400" />
                                <span className="font-bold text-white">PC/Console</span>
                             </div>
                        </div>
                    </div>

                    {/* Progress Stepper */}
                    <div className="grid grid-cols-4 gap-2 mb-2 relative">
                         {['Waiting', 'Ready Up', 'Started', 'Ended'].map((step, idx) => {
                             const steps = ['waiting', 'ready', 'started', 'ended'];
                             const currentIdx = steps.indexOf(match.status);
                             const active = idx <= currentIdx;
                             return (
                                 <div key={step} className={`flex flex-col items-center gap-2 relative z-10 ${active ? 'text-cyan-400' : 'text-blue-600/50'}`}>
                                     <div className={`w-full h-1 rounded-full mb-2 ${active ? 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-blue-950/50'}`}></div>
                                     <div className="font-bold uppercase text-xs tracking-wider">{step}</div>
                                 </div>
                             )
                         })}
                    </div>
                </div>
            </div>

            <div className="flex-1 container mx-auto px-4 py-4 sm:py-8 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 relative z-10">
                {/* Left Column: Teams & Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Teams Display */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Team/Player 1 (Host) */}
                        <div className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-12 w-12 bg-cyan-500/20 rounded-full flex items-center justify-center border-2 border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                                    <span className="font-bold text-cyan-400">P1</span>
                                </div>
                                <div>
                                    <div className="text-sm text-blue-300/70 uppercase font-bold">Host</div>
                                    <div className="text-xl font-bold text-white">
                                        {playerReadyStatus[match.hostId] && (match.players[1] ? playerReadyStatus[match.players[1].id] : false)
                                            ? match.hostName 
                                            : "Oponente Oculto"}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className={`p-3 rounded-lg flex justify-between items-center transition-all duration-300 ${playerReadyStatus[match.hostId] ? 'bg-cyan-500/20 border border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'bg-blue-950/30 border border-blue-500/30'}`}>
                                    <span className="text-blue-200/80">Status</span>
                                    <span className={playerReadyStatus[match.hostId] ? "text-cyan-400 font-bold flex items-center gap-1" : "text-blue-300/60"}>
                                        {playerReadyStatus[match.hostId] ? (
                                            <>
                                                <Check className="h-4 w-4" /> Listo
                                            </>
                                        ) : (
                                            "Esperando"
                                        )}
                                    </span>
                                </div>
                                {user?.id === match.hostId && (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            <Button 
                                                className={`flex-1 ${playerReadyStatus[user.id] ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-[0_0_20px_rgba(34,211,238,0.4)]' : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]'}`}
                                                onClick={handleToggleReady}
                                            >
                                                <Check className="h-4 w-4 mr-2" /> {playerReadyStatus[user.id] ? "Cancelar Ready" : "Listo"}
                                            </Button>
                                            <Button 
                                                variant="destructive"
                                                size="icon"
                                                onClick={handleLeaveMatch}
                                            >
                                                <LogOut className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        {match.status === 'in_progress' && (
                                            <div className="flex gap-2">
                                                <Button 
                                                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                                                    onClick={() => setShowResultDialog(true)}
                                                >
                                                    <Trophy className="h-4 w-4 mr-2" /> Subir Resultado
                                                </Button>
                                                <Button 
                                                    variant="outline"
                                                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                                                    onClick={() => setShowDisputeDialog(true)}
                                                >
                                                    <AlertCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                         {/* Team/Player 2 (Joiner) */}
                        <div className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 flex flex-col justify-center hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300">
                            {match.players[1] ? (
                                <>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="h-12 w-12 bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                                            <span className="font-bold text-red-400">P2</span>
                                        </div>
                                        <div>
                                            <div className="text-sm text-blue-300/70 uppercase font-bold">Challenger</div>
                                            <div className="text-xl font-bold text-white">
                                                {playerReadyStatus[match.hostId] && playerReadyStatus[match.players[1].id] 
                                                    ? match.players[1].name 
                                                    : "Oponente Oculto"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className={`p-3 rounded-lg flex justify-between items-center transition-all duration-300 ${playerReadyStatus[match.players[1].id] ? 'bg-cyan-500/20 border border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'bg-blue-950/30 border border-blue-500/30'}`}>
                                            <span className="text-blue-200/80">Status</span>
                                            <span className={playerReadyStatus[match.players[1].id] ? "text-cyan-400 font-bold flex items-center gap-1" : "text-blue-300/60"}>
                                                {playerReadyStatus[match.players[1].id] ? (
                                                    <>
                                                        <Check className="h-4 w-4" /> Listo
                                                    </>
                                                ) : (
                                                    "Esperando"
                                                )}
                                            </span>
                                        </div>
                                        {user?.id === match.players[1].id && (
                                            <div className="flex flex-col gap-2">
                                                <div className="flex gap-2">
                                                    <Button 
                                                        className={`flex-1 ${playerReadyStatus[user.id] ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-[0_0_20px_rgba(34,211,238,0.4)]' : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]'}`}
                                                        onClick={handleToggleReady}
                                                    >
                                                        <Check className="h-4 w-4 mr-2" /> {playerReadyStatus[user.id] ? "Cancelar Ready" : "Listo"}
                                                    </Button>
                                                    <Button 
                                                        variant="destructive"
                                                        size="icon"
                                                        onClick={handleLeaveMatch}
                                                    >
                                                        <LogOut className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                {match.status === 'in_progress' && (
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                                                            onClick={() => setShowResultDialog(true)}
                                                        >
                                                            <Trophy className="h-4 w-4 mr-2" /> Subir Resultado
                                                        </Button>
                                                        <Button 
                                                            variant="outline"
                                                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                                                            onClick={() => setShowDisputeDialog(true)}
                                                        >
                                                            <AlertCircle className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-6">
                                    <div className="h-16 w-16 bg-blue-950/50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse border border-blue-500/30">
                                        <Users className="h-6 w-6 text-blue-400/50" />
                                    </div>
                                    <h3 className="text-white font-bold mb-2">Slot Vacío</h3>
                                    {isParticipant ? (
                                        <div className="text-blue-300/70 text-sm">Esperando oponente...</div>
                                    ) : (
                                        <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 w-full max-w-[200px] shadow-[0_0_20px_rgba(34,211,238,0.4)]" onClick={handleJoin}>
                                            Unirse ({match.entryFee} Tokens)
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Match Actions / Info */}
                    <div className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300">
                        <h3 className="text-lg font-bold text-white mb-4 border-b border-blue-500/20 pb-2 text-glow">Detalles de la Partida</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                             <div className="bg-blue-950/40 backdrop-blur-sm p-4 rounded-lg text-center border border-blue-500/20">
                                <div className="text-blue-300/70 text-xs uppercase mb-1 font-bold">Entry Fee</div>
                                <div className="text-cyan-400 font-bold flex justify-center items-center gap-1">
                                    <Coins className="h-4 w-4" /> {match.entryFee}
                                </div>
                             </div>
                             <div className="bg-blue-950/40 backdrop-blur-sm p-4 rounded-lg text-center border border-blue-500/20">
                                <div className="text-blue-300/70 text-xs uppercase mb-1 font-bold">Prize Pool</div>
                                <div className="text-cyan-400 font-bold flex justify-center items-center gap-1">
                                    <Trophy className="h-4 w-4" /> {match.entryFee * (match.maxPlayers === 2 ? 1.8 : 3.6)}
                                </div>
                             </div>
                             <div className="bg-blue-950/40 backdrop-blur-sm p-4 rounded-lg text-center col-span-2 md:col-span-2 border border-blue-500/20">
                                <div className="text-blue-300/70 text-xs uppercase mb-1 font-bold">Map Code</div>
                                <div className="text-white font-mono font-bold flex justify-center items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => {
                                    navigator.clipboard.writeText(match.mapCode);
                                    toast({title: "Copiado", description: "Código copiado al portapapeles"});
                                }}>
                                    {match.mapCode} <Copy className="h-3 w-3" />
                                </div>
                             </div>
                        </div>
                        
                        <div className="bg-blue-950/30 backdrop-blur-sm p-4 rounded-lg border border-blue-500/30">
                             <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                                 <AlertCircle className="h-4 w-4 text-cyan-400" /> Reglas
                             </h4>
                             <ul className="text-sm text-blue-200/70 space-y-1 list-disc pl-4">
                                 <li>El ganador debe enviar captura de pantalla en caso de disputa.</li>
                                 <li>Prohibido el uso de hacks o exploits.</li>
                                 <li>Si un jugador se desconecta antes de empezar, se cancela el match.</li>
                                 <li>Respawn desactivado.</li>
                             </ul>
                        </div>
                    </div>
                </div>

                {/* Right Column: Chat */}
                <div className="flex flex-col h-[600px] lg:h-auto bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border border-blue-500/20 rounded-xl overflow-hidden hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300">
                    <div className="p-4 border-b border-blue-500/20 flex justify-between items-center bg-blue-950/40 backdrop-blur-sm">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-cyan-400" /> Chat del Match
                        </h3>
                        <div className="text-xs text-blue-300/70 font-semibold">{match.chat.length} mensajes</div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-blue-950/20">
                        {match.chat.length === 0 ? (
                            <div className="text-center text-blue-300/60 mt-10">
                                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                <p>No hay mensajes aún.</p>
                                <p className="text-xs">¡Di hola a tu rival!</p>
                            </div>
                        ) : (
                            match.chat.map((msg) => (
                                <div key={msg.id} className={`flex flex-col ${msg.user === user?.username ? 'items-end' : 'items-start'}`}>
                                    <div className="text-xs text-blue-400/70 mb-1 px-1 font-semibold">{msg.user} • {msg.time}</div>
                                    <div className={`px-4 py-2 rounded-lg max-w-[85%] text-sm ${msg.user === user?.username ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'bg-blue-950/60 backdrop-blur-sm text-blue-100 rounded-tl-none border border-blue-500/30'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 bg-blue-950/40 backdrop-blur-sm border-t border-blue-500/20">
                        {isParticipant ? (
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <Input 
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Escribe un mensaje..."
                                />
                                <Button type="submit" size="icon" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        ) : (
                            <div className="text-center text-xs text-blue-300/60">
                                Solo los participantes pueden chatear.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Diálogo de confirmación para abandonar */}
            <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
                <DialogContent className="bg-gradient-to-br from-blue-950/95 to-slate-900/95 backdrop-blur-md border border-blue-500/30 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-glow flex items-center gap-2">
                            <AlertCircle className="h-6 w-6 text-red-400" />
                            ¿Abandonar el Match?
                        </DialogTitle>
                        <DialogDescription className="text-blue-200/80">
                            Estás a punto de abandonar este match. Si lo haces:
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 my-4">
                        <div className="flex items-start gap-2 text-sm text-blue-200/70">
                            <div className="h-1.5 w-1.5 bg-cyan-400 rounded-full mt-1.5" />
                            <span>Perderás tu entrada de <span className="text-cyan-400 font-bold">{match.entryFee} tokens</span></span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-blue-200/70">
                            <div className="h-1.5 w-1.5 bg-cyan-400 rounded-full mt-1.5" />
                            <span>El slot quedará disponible para otro jugador</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-blue-200/70">
                            <div className="h-1.5 w-1.5 bg-cyan-400 rounded-full mt-1.5" />
                            <span>No podrás recuperar tu posición en este match</span>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setShowLeaveDialog(false)}
                            className="border-blue-500/30 hover:bg-blue-950/50 hover:border-blue-400/50"
                        >
                            Cancelar
                        </Button>
                        <Button 
                            variant="destructive"
                            onClick={confirmLeaveMatch}
                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sí, Abandonar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Diálogo para subir resultado */}
            <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
                <DialogContent className="bg-gradient-to-br from-blue-950/95 to-slate-900/95 backdrop-blur-md border border-blue-500/30 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-glow flex items-center gap-2">
                            <Trophy className="h-6 w-6 text-green-400" />
                            Subir Resultado
                        </DialogTitle>
                        <DialogDescription className="text-blue-200/80">
                            Proporciona evidencia de tu victoria (captura de pantalla)
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 my-4">
                        <div>
                            <Label htmlFor="screenshot" className="text-blue-200 mb-2 block">URL de tu Captura de Pantalla</Label>
                            <Input 
                                id="screenshot"
                                placeholder="https://imgur.com/tu-screenshot.png"
                                value={screenshotUrl}
                                onChange={(e) => setScreenshotUrl(e.target.value)}
                                className="bg-blue-950/50 border-blue-500/30"
                            />
                            <p className="text-xs text-blue-300/60 mt-2">
                                Sube tu imagen a Imgur, Gyazo u otro servicio y pega el enlace aquí
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setShowResultDialog(false)}
                            className="border-blue-500/30 hover:bg-blue-950/50"
                        >
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleSubmitResult}
                            disabled={isSubmittingResult}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                        >
                            <Trophy className="h-4 w-4 mr-2" />
                            {isSubmittingResult ? "Enviando..." : "Enviar Resultado"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Diálogo para crear disputa */}
            <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
                <DialogContent className="bg-gradient-to-br from-blue-950/95 to-slate-900/95 backdrop-blur-md border border-blue-500/30 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-glow flex items-center gap-2">
                            <AlertCircle className="h-6 w-6 text-red-400" />
                            Reportar Problema
                        </DialogTitle>
                        <DialogDescription className="text-blue-200/80">
                            Describe el problema ocurrido durante el match
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 my-4">
                        <div>
                            <Label htmlFor="reason" className="text-blue-200 mb-2 block">Motivo del Reporte</Label>
                            <textarea 
                                id="reason"
                                placeholder="El oponente usó hacks / Se desconectó / No envió evidencia válida..."
                                value={disputeReason}
                                onChange={(e) => setDisputeReason(e.target.value)}
                                className="w-full min-h-[100px] bg-blue-950/50 border border-blue-500/30 rounded-md p-3 text-white placeholder:text-blue-300/40"
                                rows={4}
                            />
                        </div>
                        <div>
                            <Label htmlFor="evidence" className="text-blue-200 mb-2 block">Evidencia (Opcional)</Label>
                            <Input 
                                id="evidence"
                                placeholder="https://imgur.com/tu-evidencia.png"
                                value={screenshotUrl}
                                onChange={(e) => setScreenshotUrl(e.target.value)}
                                className="bg-blue-950/50 border-blue-500/30"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setShowDisputeDialog(false)}
                            className="border-blue-500/30 hover:bg-blue-950/50"
                        >
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleCreateDispute}
                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600"
                        >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Enviar Reporte
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MatchDetail;