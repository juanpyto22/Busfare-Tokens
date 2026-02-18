import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Trophy, Plus, Coins, Clock, Flag, Filter, ArrowDownUp, ChevronDown } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';

// Helper function to calculate remaining time
const getTimeRemaining = (createdAt) => {
    const now = Date.now();
    const expirationTime = createdAt + (30 * 60 * 1000); // 30 minutes
    const remaining = expirationTime - now;
    
    if (remaining <= 0) return null;
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const Matches = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [matches, setMatches] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [modalStep, setModalStep] = useState(1); // 1: configuración básica, 2: rondas y tokens
    const [activeTab, setActiveTab] = useState('available'); // 'available' o 'ongoing'
    const [user, setUser] = useState(null);
    const [userTeams, setUserTeams] = useState([]);
    const [currentTime, setCurrentTime] = useState(Date.now()); // Para actualizar el temporizador
    const [filters, setFilters] = useState({
        regions: [],
        platforms: [],
        gameModes: [],
        teamSizes: [],
        sort: 'newest'
    });
    const [newMatch, setNewMatch] = useState({
        type: '1v1',
        mode: 'REALISTIC',
        entryFee: 0.5,
        rounds: 5,
        region: 'NAE',
        platform: 'ANY',
        mapCode: '0000-0000-0000',
        teamId: null,
        shotgun: 'META LOOT'
    });

    const filterOptions = {
        regions: ['NAE', 'EU'],
        platforms: ['PC', 'Console', 'ANY'],
        gameModes: ['REALISTIC', 'BOXFIGHT', 'ZONE WARS', 'BUILD FIGHTS'],
        teamSizes: ['1v1', '2v2', '3v3', '4v4'],
        sortOptions: [
            { value: 'newest', label: t('matches.newestFirst') },
            { value: 'oldest', label: t('matches.oldestFirst') },
            { value: 'highestEntry', label: t('matches.highestEntry') },
            { value: 'lowestEntry', label: t('matches.lowestEntry') },
            { value: 'highestPrize', label: t('matches.highestPrize') }
        ]
    };

    const toggleFilter = (category, value) => {
        setFilters(prev => {
            const current = prev[category];
            const updated = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value];
            return { ...prev, [category]: updated };
        });
    };

    const clearFilters = () => {
        setFilters({
            regions: [],
            platforms: [],
            gameModes: [],
            teamSizes: [],
            sort: 'newest'
        });
    };

    const getFilteredMatches = () => {
        let filtered = [...matches];

        // Filtrar según la pestaña activa
        if (activeTab === 'available') {
            // Mostrar matches en estado 'waiting'
            filtered = filtered.filter(m => m.status === 'waiting');
        } else if (activeTab === 'ongoing') {
            // En 'ongoing': todos los matches en los que participo que ya tienen 2+ jugadores o están started/ready
            if (user) {
                filtered = filtered.filter(m => {
                    const isParticipant = m.players.some(p => p.id === user.id);
                    const hasMultiplePlayers = m.players.length > 1;
                    const isStartedOrReady = m.status === 'started' || m.status === 'ready';
                    
                    return isParticipant && (hasMultiplePlayers || isStartedOrReady);
                });
            }
        }

        // Apply filters
        if (filters.regions.length > 0) {
            filtered = filtered.filter(m => filters.regions.includes(m.region));
        }
        if (filters.platforms.length > 0) {
            filtered = filtered.filter(m => filters.platforms.includes(m.platform || 'ANY'));
        }
        if (filters.gameModes.length > 0) {
            filtered = filtered.filter(m => filters.gameModes.includes(m.mode));
        }
        if (filters.teamSizes.length > 0) {
            filtered = filtered.filter(m => filters.teamSizes.includes(m.type));
        }

        // Apply sorting
        switch (filters.sort) {
            case 'oldest':
                filtered.sort((a, b) => a.createdAt - b.createdAt);
                break;
            case 'highestEntry':
                filtered.sort((a, b) => b.entryFee - a.entryFee);
                break;
            case 'lowestEntry':
                filtered.sort((a, b) => a.entryFee - b.entryFee);
                break;
            case 'highestPrize':
                filtered.sort((a, b) => (b.prize || b.entryFee * 1.9) - (a.prize || a.entryFee * 1.9));
                break;
            default: // newest
                filtered.sort((a, b) => b.createdAt - a.createdAt);
        }

        return filtered;
    };

    const activeFiltersCount = filters.regions.length + filters.platforms.length + 
                               filters.gameModes.length + filters.teamSizes.length;

    useEffect(() => {
        const fetchMatches = async () => {
             const session = db.getSession();
             
             // Obtener datos actualizados del usuario desde localStorage
             if (session) {
                 const allUsers = JSON.parse(localStorage.getItem('fortnite_platform_users') || '[]');
                 const updatedUser = allUsers.find(u => u.id === session.id);
                 let finalUser = updatedUser || session;
                 
                 // Si el usuario no tiene tokens, darle algunos tokens iniciales
                 if (!finalUser.tokens || finalUser.tokens === 0) {
                     finalUser.tokens = 10; // 10 tokens iniciales
                     // Actualizar en localStorage
                     if (updatedUser) {
                         const userIndex = allUsers.findIndex(u => u.id === session.id);
                         if (userIndex !== -1) {
                             allUsers[userIndex] = finalUser;
                             localStorage.setItem('fortnite_platform_users', JSON.stringify(allUsers));
                         }
                     }
                 }
                 
                 setUser(finalUser);
             }
             
             // Filtrar partidas que no hayan expirado (30 minutos)
             const allMatches = await db.getMatches();
             const now = Date.now();
             const validMatches = allMatches.filter(match => {
                 const expirationTime = match.createdAt + (30 * 60 * 1000);
                 return now < expirationTime;
             });
             
             setMatches(validMatches);
             
             // Cargar equipos del usuario desde localStorage
             if (session) {
                 const myTeams = await db.getTeams(session.id);
                 setUserTeams(myTeams);
             }
        };
        fetchMatches();
        const interval = setInterval(fetchMatches, 3000); 
        return () => clearInterval(interval);
    }, []);

    // Actualizar el tiempo cada segundo para el temporizador
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleCreateMatch = async () => {
        if (!user) {
            toast({ title: "Error", description: "Debes iniciar sesión", variant: "destructive" });
            navigate('/login');
            return;
        }

        // Verificar si el usuario ya está en un match activo
        const allMatches = await db.getMatches();
        const userActiveMatch = allMatches.find(m => 
            m.players.some(p => p.id === user.id) && 
            (m.status === 'waiting' || m.status === 'ready' || m.status === 'started')
        );
        
        if (userActiveMatch) {
            toast({ 
                title: "Ya estás en un match activo", 
                description: "Debes completar o abandonar tu match actual antes de crear uno nuevo", 
                variant: "destructive",
                duration: 3000
            });
            return;
        }

        // Validar que se haya seleccionado un equipo con el número correcto de miembros
        const requiredMembers = parseInt(newMatch.type.charAt(0));
        if (!newMatch.teamId) {
            toast({ 
                title: "Error", 
                description: `Debes seleccionar un equipo para partidas ${newMatch.type}`, 
                variant: "destructive" 
            });
            return;
        }
        
        // Verificar que el equipo tenga el número correcto de miembros
        console.log('Buscando equipo con ID:', newMatch.teamId);
        console.log('Equipos disponibles:', userTeams);
        const selectedTeam = userTeams.find(t => String(t.id) === String(newMatch.teamId));
        console.log('Equipo encontrado:', selectedTeam);
        
        if (!selectedTeam) {
            toast({ 
                title: "Error", 
                description: `No se encontró el equipo seleccionado. Por favor, selecciona un equipo nuevamente.`, 
                variant: "destructive" 
            });
            return;
        }
        
        if (selectedTeam.members.length !== requiredMembers) {
            toast({ 
                title: "Error", 
                description: `El equipo debe tener exactamente ${requiredMembers} ${requiredMembers === 1 ? 'miembro' : 'miembros'}. Tu equipo tiene ${selectedTeam.members.length}`, 
                variant: "destructive" 
            });
            return;
        }

        // Verificar que el usuario tenga suficientes tokens
        const userBalance = user.tokens || 0;
        
        // Validar mínimo de entrada
        if (newMatch.entryFee < 0.5) {
            toast({ 
                title: "Error", 
                description: "La apuesta mínima es de 0.5 tokens", 
                variant: "destructive"
            });
            return;
        }
        
        if (userBalance < newMatch.entryFee) {
            toast({ 
                title: "❌ Fondos Insuficientes", 
                description: `Necesitas ${newMatch.entryFee} tokens pero solo tienes ${userBalance.toFixed(2)} tokens`, 
                variant: "destructive",
                className: "bg-red-600 text-white border-red-700"
            });
            return;
        }
        
        try {
            const match = await db.createMatch(newMatch);
            setShowCreateModal(false);
            setModalStep(1);
            toast({ 
                title: "✅ Match Creado", 
                description: "Tu partida está lista. Espera a que alguien se una.", 
                className: "bg-green-600 text-white border-none" 
            });
            // Refrescar lista de matches inmediatamente
            await fetchMatches();
            navigate(`/match/${match.id}`);
        } catch (error) {
            console.error('Error al crear match:', error);
            toast({ 
                title: "Error al crear partida", 
                description: "Hubo un problema al crear la partida. Inténtalo de nuevo.", 
                variant: "destructive" 
            });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050911] via-[#0a1628] to-[#050911] pt-8 pb-20 font-sans relative">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            
            <Helmet>
                <title>Matches Activos | BusFare-tokens</title>
            </Helmet>
            <div className="container mx-auto px-4 relative z-10">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-4xl font-black text-white tracking-tight text-glow">{t('matches.title')}</h1>
                    <Dialog open={showCreateModal} onOpenChange={async (open) => {
                        setShowCreateModal(open);
                        if (open && user) {
                            // Recargar equipos cuando se abre el modal
                            const myTeams = await db.getTeams(user.id);
                            setUserTeams(myTeams);
                            console.log('Equipos recargados al abrir modal:', myTeams);
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold uppercase tracking-wide shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                                {t('matches.createMatch')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-950 border-blue-500/30 text-white">
                             <DialogHeader>
                                <DialogTitle className="text-2xl font-black text-glow">
                                    {modalStep === 1 ? t('matches.configureMatch') : 'Configurar Apuesta'}
                                </DialogTitle>
                            </DialogHeader>
                            
                            {/* PASO 1: Configuración básica */}
                            {modalStep === 1 && (
                                <div className="space-y-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-blue-200 font-semibold">{t('matches.format')}</Label>
                                            <Select 
                                                value={newMatch.type} 
                                                onValueChange={(val) => setNewMatch({...newMatch, type: val, teamId: null})}
                                                disabled={newMatch.mode === 'BUILD FIGHTS'}
                                            >
                                                <SelectTrigger className="bg-blue-950/50 border-blue-500/30 text-white"><SelectValue /></SelectTrigger>
                                                <SelectContent className="bg-slate-950 border-blue-500/30 text-white">
                                                    <SelectItem value="1v1">1 vs 1</SelectItem>
                                                    <SelectItem value="2v2">2 vs 2</SelectItem>
                                                    <SelectItem value="3v3">3 vs 3</SelectItem>
                                                    <SelectItem value="4v4">4 vs 4</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {newMatch.mode === 'BUILD FIGHTS' && (
                                                <p className="text-xs text-yellow-400/80">Build Fights solo está disponible en modo 1v1</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-blue-200 font-semibold">{t('matches.region')}</Label>
                                            <Select value={newMatch.region} onValueChange={(val) => setNewMatch({...newMatch, region: val})}>
                                                <SelectTrigger className="bg-blue-950/50 border-blue-500/30 text-white"><SelectValue /></SelectTrigger>
                                                <SelectContent className="bg-slate-950 border-blue-500/30 text-white">
                                                 <SelectItem value="EU">Europe</SelectItem>
                                                <SelectItem value="NAE">NA East</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Team selector */}
                                    <div className="space-y-2">
                                        <Label className="text-blue-200 font-semibold">
                                            Selecciona tu equipo {newMatch.type === '1v1' ? '(1 miembro)' : newMatch.type === '2v2' ? '(2 miembros)' : newMatch.type === '3v3' ? '(3 miembros)' : '(4 miembros)'}
                                        </Label>
                                        <Select 
                                            value={newMatch.teamId ? String(newMatch.teamId) : ''} 
                                            onValueChange={(val) => setNewMatch({...newMatch, teamId: val})}
                                            onOpenChange={() => {
                                                console.log('Equipos disponibles:', userTeams);
                                                console.log('Tipo de match:', newMatch.type);
                                                console.log('Equipos filtrados:', userTeams.filter(team => team.members.length === parseInt(newMatch.type.charAt(0))));
                                            }}
                                        >
                                            <SelectTrigger className="bg-blue-950/50 border-blue-500/30 text-white">
                                                <SelectValue placeholder="Elige un equipo..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-950 border-blue-500/30">
                                                {userTeams.filter(team => team.members.length === parseInt(newMatch.type.charAt(0))).length === 0 ? (
                                                    <SelectItem value="none" disabled className="text-blue-300/50">
                                                        No tienes equipos de {newMatch.type} - Crea uno en la sección "Equipos"
                                                    </SelectItem>
                                                ) : (
                                                    userTeams
                                                        .filter(team => team.members.length === parseInt(newMatch.type.charAt(0)))
                                                        .map(team => (
                                                            <SelectItem key={team.id} value={String(team.id)} className="text-cyan-300 hover:text-cyan-200 focus:text-cyan-200 focus:bg-cyan-500/20">
                                                                {team.name} ({team.members.length} {team.members.length === 1 ? 'miembro' : 'miembros'})
                                                            </SelectItem>
                                                        ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {newMatch.teamId && userTeams.find(t => String(t.id) === String(newMatch.teamId)) && (
                                            <div className="bg-blue-950/30 p-3 rounded-lg border border-blue-500/20 mt-2">
                                                <p className="text-xs text-blue-300/70 mb-2">Miembros del equipo:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {userTeams.find(t => String(t.id) === String(newMatch.teamId))?.members.map(member => (
                                                        <span key={member.id} className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded border border-cyan-500/30">
                                                            {member.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label className="text-blue-200 font-semibold">{t('matches.mode')}</Label>
                                        <Select value={newMatch.mode} onValueChange={(val) => {
                                            // Si selecciona Build Fights, forzar a 1v1
                                            if (val === 'BUILD FIGHTS') {
                                                setNewMatch({...newMatch, mode: val, type: '1v1'});
                                            } else {
                                                setNewMatch({...newMatch, mode: val});
                                            }
                                        }}>
                                            <SelectTrigger className="bg-blue-950/50 border-blue-500/30 text-white"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-slate-950 border-blue-500/30 text-white">
                                                <SelectItem value="REALISTIC">Realistic</SelectItem>
                                                <SelectItem value="BOXFIGHT">Boxfight</SelectItem>
                                                <SelectItem value="ZONE WARS">Zone Wars</SelectItem>
                                                <SelectItem value="BUILD FIGHTS">Build Fights (Solo 1v1)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-blue-200 font-semibold">Escopeta</Label>
                                        <Select value={newMatch.shotgun} onValueChange={(val) => setNewMatch({...newMatch, shotgun: val})}>
                                            <SelectTrigger className="bg-blue-950/50 border-blue-500/30 text-white"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-slate-950 border-blue-500/30 text-white">
                                                <SelectItem value="META LOOT">Meta Loot</SelectItem>
                                                <SelectItem value="SPAS">SPAS</SelectItem>
                                                <SelectItem value="HAVOC">Havoc</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-blue-200 font-semibold">Plataforma</Label>
                                        <Select value={newMatch.platform} onValueChange={(val) => setNewMatch({...newMatch, platform: val})}>
                                            <SelectTrigger className="bg-blue-950/50 border-blue-500/30 text-white"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-slate-950 border-blue-500/30 text-white">
                                                <SelectItem value="PC">PC</SelectItem>
                                                <SelectItem value="CONSOLE">Consola</SelectItem>
                                                <SelectItem value="CONSOLE">ANY</SelectItem>

                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <Button 
                                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold shadow-[0_0_20px_rgba(59,130,246,0.5)]" 
                                        onClick={() => {
                                            if (!newMatch.teamId) {
                                                toast({ 
                                                    title: "Error", 
                                                    description: "Debes seleccionar un equipo", 
                                                    variant: "destructive" 
                                                });
                                                return;
                                            }
                                            setModalStep(2);
                                        }}
                                    >
                                        CONTINUAR
                                    </Button>
                                </div>
                            )}

                            {/* PASO 2: Rondas y Tokens */}
                            {modalStep === 2 && (
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label className="text-blue-200 font-semibold">Número de Rondas</Label>
                                        <Select value={newMatch.rounds.toString()} onValueChange={(val) => setNewMatch({...newMatch, rounds: parseInt(val)})}>
                                            <SelectTrigger className="bg-blue-950/50 border-blue-500/30 text-white"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-slate-950 border-blue-500/30 text-white">
                                                <SelectItem value="1">1 Ronda</SelectItem>
                                                <SelectItem value="3">3 Rondas</SelectItem>
                                                <SelectItem value="5">5 Rondas</SelectItem>
                                                
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label className="text-blue-200 font-semibold">Tokens a Apostar</Label>
                                        <Input 
                                            type="number" 
                                            value={newMatch.entryFee} 
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setNewMatch({...newMatch, entryFee: val === '' ? '' : parseFloat(val)});
                                            }} 
                                            className="bg-blue-950/50 border-blue-500/30 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                            step="0.5" 
                                            min="0.5" 
                                            placeholder="Cantidad de tokens"
                                        />
                                        <p className="text-xs text-blue-300/70">Mínimo: 0.5 tokens</p>
                                    </div>

                                    <div className="bg-blue-950/30 p-4 rounded-lg border border-blue-500/20">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-blue-300 text-sm">Premio total:</span>
                                            <span className="text-cyan-400 font-bold text-lg">{(newMatch.entryFee * 2 * 0.95).toFixed(2)} tokens</span>
                                        </div>
                                        <p className="text-xs text-blue-400/60">El ganador recibe el 95% del total apostado</p>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button 
                                            variant="outline"
                                            className="flex-1 border-blue-500/30 text-blue-300 hover:bg-blue-950/50" 
                                            onClick={() => setModalStep(1)}
                                        >
                                            ATRÁS
                                        </Button>
                                        <Button 
                                            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold shadow-[0_0_20px_rgba(59,130,246,0.5)]" 
                                            onClick={handleCreateMatch}
                                        >
                                            {t('matches.publishMatch')}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filters Bar */}
                <div className="flex flex-col xl:flex-row gap-4 mb-8">
                     <div className="flex bg-blue-950/30 backdrop-blur-sm p-1 rounded-lg border border-blue-500/20 w-fit">
                         <Button 
                            variant="ghost" 
                            onClick={() => setActiveTab('available')}
                            className={`text-xs font-bold h-8 transition-all ${activeTab === 'available' ? 'bg-blue-600/50 text-white' : 'text-blue-300/70 hover:text-white hover:bg-blue-600/30'}`}
                         >
                            {t('matches.availableMatches')} 
                            <span className={`ml-2 px-1.5 rounded-full text-[10px] ${activeTab === 'available' ? 'bg-cyan-400 text-black' : 'bg-blue-900/50 text-blue-300'}`}>
                                {activeTab === 'available' ? getFilteredMatches().length : matches.filter(m => user && m.hostId !== user.id).length}
                            </span>
                         </Button>
                         <Button 
                            variant="ghost" 
                            onClick={() => setActiveTab('ongoing')}
                            className={`text-xs font-bold h-8 transition-all ${activeTab === 'ongoing' ? 'bg-blue-600/50 text-white' : 'text-blue-300/70 hover:text-white hover:bg-blue-600/30'}`}
                         >
                            {t('matches.ongoingMatches')} 
                            <span className={`ml-2 px-1.5 rounded-full text-[10px] ${activeTab === 'ongoing' ? 'bg-cyan-400 text-black' : 'bg-blue-900/50 text-blue-300'}`}>
                                {activeTab === 'ongoing' && user ? matches.filter(m => m.players.some(p => p.id === user.id)).length : 0}
                            </span>
                         </Button>
                     </div>
                     
                     <div className="flex flex-wrap gap-2 xl:ml-auto items-center">
                        {/* Region Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className={`border-blue-500/30 bg-blue-950/30 text-blue-200 hover:text-white hover:bg-blue-900/50 h-9 px-3 text-xs font-medium gap-2 ${filters.regions.length > 0 ? 'border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : ''}`}>
                                    {t('matches.regions')} {filters.regions.length > 0 && `(${filters.regions.length})`} <ChevronDown className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-slate-950 border-blue-500/30 text-white shadow-xl">
                                {filterOptions.regions.map(region => (
                                    <DropdownMenuCheckboxItem
                                        key={region}
                                        checked={filters.regions.includes(region)}
                                        onCheckedChange={() => toggleFilter('regions', region)}
                                        className="cursor-pointer focus:bg-blue-900/40 hover:bg-blue-900/40 focus:text-white hover:text-white transition-colors data-[state=checked]:text-cyan-400 data-[state=checked]:font-bold"
                                    >
                                        {region}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Platform Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className={`border-blue-500/30 bg-blue-950/30 text-blue-200 hover:text-white hover:bg-blue-900/50 h-9 px-3 text-xs font-medium gap-2 ${filters.platforms.length > 0 ? 'border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : ''}`}>
                                    {t('matches.platforms')} {filters.platforms.length > 0 && `(${filters.platforms.length})`} <ChevronDown className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-slate-950 border-blue-500/30 text-white shadow-xl">
                                {filterOptions.platforms.map(platform => (
                                    <DropdownMenuCheckboxItem
                                        key={platform}
                                        checked={filters.platforms.includes(platform)}
                                        onCheckedChange={() => toggleFilter('platforms', platform)}
                                        className="cursor-pointer focus:bg-blue-900/40 hover:bg-blue-900/40 focus:text-white hover:text-white transition-colors data-[state=checked]:text-cyan-400 data-[state=checked]:font-bold"
                                    >
                                        {platform}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Game Mode Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className={`border-blue-500/30 bg-blue-950/30 text-blue-200 hover:text-white hover:bg-blue-900/50 h-9 px-3 text-xs font-medium gap-2 ${filters.gameModes.length > 0 ? 'border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : ''}`}>
                                    {t('matches.gameModes')} {filters.gameModes.length > 0 && `(${filters.gameModes.length})`} <ChevronDown className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-slate-950 border-blue-500/30 text-white shadow-xl">
                                {filterOptions.gameModes.map(mode => (
                                    <DropdownMenuCheckboxItem
                                        key={mode}
                                        checked={filters.gameModes.includes(mode)}
                                        onCheckedChange={() => toggleFilter('gameModes', mode)}
                                        className="cursor-pointer focus:bg-blue-900/40 hover:bg-blue-900/40 focus:text-white hover:text-white transition-colors data-[state=checked]:text-cyan-400 data-[state=checked]:font-bold"
                                    >
                                        {mode}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Team Size Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className={`border-blue-500/30 bg-blue-950/30 text-blue-200 hover:text-white hover:bg-blue-900/50 h-9 px-3 text-xs font-medium gap-2 ${filters.teamSizes.length > 0 ? 'border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : ''}`}>
                                    {t('matches.teamSize')} {filters.teamSizes.length > 0 && `(${filters.teamSizes.length})`} <ChevronDown className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-slate-950 border-blue-500/30 text-white shadow-xl">
                                {filterOptions.teamSizes.map(size => (
                                    <DropdownMenuCheckboxItem
                                        key={size}
                                        checked={filters.teamSizes.includes(size)}
                                        onCheckedChange={() => toggleFilter('teamSizes', size)}
                                        className="cursor-pointer focus:bg-blue-900/40 hover:bg-blue-900/40 focus:text-white hover:text-white transition-colors data-[state=checked]:text-cyan-400 data-[state=checked]:font-bold"
                                    >
                                        {size}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Sort Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="border-blue-500/30 bg-blue-950/30 text-blue-200 hover:text-white hover:bg-blue-900/50 h-9 px-3 text-xs font-medium gap-2">
                                    {t('matches.sort')} <ArrowDownUp className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-slate-950 border-blue-500/30 text-white shadow-xl">
                                {filterOptions.sortOptions.map(option => (
                                    <DropdownMenuItem
                                        key={option.value}
                                        onClick={() => setFilters(prev => ({ ...prev, sort: option.value }))}
                                        className={`cursor-pointer focus:bg-blue-900/40 hover:bg-blue-900/40 focus:text-white hover:text-white transition-colors ${filters.sort === option.value ? 'text-cyan-400 font-bold' : ''}`}
                                    >
                                        {option.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Clear Filters */}
                        {activeFiltersCount > 0 && (
                            <Button 
                                onClick={clearFilters}
                                variant="ghost" 
                                className="text-red-400 hover:text-red-300 hover:bg-red-950/20 h-9 px-3 text-xs font-medium"
                            >
                                {t('matches.clear')} ({activeFiltersCount})
                            </Button>
                        )}
                     </div>
                </div>

                {/* Matches Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {getFilteredMatches().map((match, idx) => (
                        <motion.div
                            key={match.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20 hover:border-blue-400/60 transition-all duration-300 group rounded-xl overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                                <CardContent className="p-0">
                                    {/* Card Header Info */}
                                    <div className="p-4 pb-2">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="text-white font-black text-lg uppercase leading-none mb-2 text-glow">{match.type} {match.mode}</h3>
                                                <div className="flex gap-1.5">
                                                    <span className="bg-blue-950/50 text-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-500/30">{match.type}</span>
                                                    <span className="bg-blue-950/50 text-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-500/30">{match.region}</span>
                                                    {match.tags && match.tags.map(tag => (
                                                        <span key={tag} className="bg-cyan-950/50 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-cyan-500/30">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="bg-blue-950/50 p-1.5 rounded-full border border-blue-500/30">
                                                <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
                                            </div>
                                        </div>

                                        {/* Match Stats Grid */}
                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                            <div className="bg-blue-950/30 p-2 rounded-lg border border-blue-500/20">
                                                <div className="text-[10px] text-blue-400/70 font-bold uppercase mb-1">{t('matches.firstTo')}</div>
                                                <div className="text-white text-sm font-bold flex items-center gap-1.5">
                                                    <Flag className="h-3 w-3 text-cyan-400" />
                                                    {match.firstTo || '5'}
                                                </div>
                                            </div>
                                            <div className="bg-blue-950/30 p-2 rounded-lg border border-blue-500/20">
                                                <div className="text-[10px] text-blue-400/70 font-bold uppercase mb-1">{t('matches.expiresIn')}</div>
                                                <div className="text-white text-sm font-bold flex items-center gap-1.5">
                                                    <Clock className="h-3 w-3 text-cyan-400" />
                                                    {getTimeRemaining(match.createdAt) || '0:00'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Entry / Prize */}
                                        <div className="flex items-center justify-between px-2 mb-4">
                                            <div className="text-left">
                                                <div className="text-[10px] text-blue-400/70 font-bold uppercase mb-0.5">{t('matches.entryFee')}</div>
                                                <div className="flex items-center gap-1 text-cyan-400 font-bold text-sm">
                                                    <Coins className="h-3.5 w-3.5" /> {match.entryFee.toFixed(2)}
                                                </div>
                                            </div>
                                            <div className="text-blue-600">→</div>
                                            <div className="text-right">
                                                <div className="text-[10px] text-blue-400/70 font-bold uppercase mb-0.5">{t('matches.prize')}</div>
                                                <div className="flex items-center gap-1 text-blue-400 font-bold text-sm justify-end">
                                                    <Trophy className="h-3.5 w-3.5" /> {match.prize ? match.prize.toFixed(2) : (match.entryFee * 1.9).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="px-4 pb-4">
                                        <Button 
                                            onClick={() => navigate(`/match/${match.id}`)}
                                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold uppercase text-sm h-10 tracking-wide shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                                        >
                                            {match.hostId === user?.id ? 'VER MATCH' : t('matches.joinMatch')}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Matches;