import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Users, Shield, Plus, Crown, Settings, LogOut, X, UserPlus, Trash2, Lock } from 'lucide-react';
import { Helmet } from 'react-helmet';

const Teams = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [teams, setTeams] = useState([]);
    const [newTeamName, setNewTeamName] = useState("");
    const [teamType, setTeamType] = useState("1v1");
    const [inviteUser, setInviteUser] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [user, setUser] = useState(null);
    const [settingsTeam, setSettingsTeam] = useState(null);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [inviteNewUser, setInviteNewUser] = useState("");
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        const fetchTeams = async () => {
            const session = db.getSession();
            setUser(session);
            setIsLoading(false);
            if (session) {
                try {
                    const userTeams = await db.getTeams(session.id);
                    setTeams(userTeams || []);
                } catch (err) {
                    setTeams([]);
                }
            }
        };
        fetchTeams();
        // Actualizar equipos cada 3 segundos para ver cambios en tiempo real
        const interval = setInterval(fetchTeams, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleCreateTeam = async () => {
        if (!user) {
             toast({ title: "Error", description: "Inicia sesión para crear equipo", variant: "destructive" });
             return;
        }
        if (!newTeamName.trim()) {
            toast({ title: "Error", description: "Ingresa un nombre para el equipo", variant: "destructive" });
            return;
        }

        const team = db.createTeam(newTeamName.trim());
        const updatedTeams = await db.getTeams(user.id);
        setTeams(updatedTeams);
        setShowModal(false);
        setNewTeamName("");
        setTeamType("1v1");
        setInviteUser("");
        toast({ title: "Equipo Creado", description: `Has fundado el equipo ${team.name} (${teamType})` });
    };

    const handleDeleteTeam = async (teamId) => {
        db.deleteTeam(teamId);
        const updatedTeams = await db.getTeams(user.id);
        setTeams(updatedTeams);
        setShowSettingsModal(false);
        toast({ title: "Equipo Eliminado", description: "El equipo ha sido eliminado" });
    };

    const handleRemoveTeamMember = async (teamId, memberName) => {
        db.removeTeamMember(teamId, memberName);
        const updatedTeams = await db.getTeams(user.id);
        setTeams(updatedTeams);
        toast({ title: "Miembro Expulsado", description: `${memberName} ha sido expulsado del equipo` });
    };

    const handleInviteTeamMember = (teamId) => {
        if (!inviteNewUser.trim()) {
            toast({ title: "Error", description: "Ingresa un nombre de usuario", variant: "destructive" });
            return;
        }
        
        const team = teams.find(t => t.id === teamId);
        const result = db.sendTeamInvitation(teamId, inviteNewUser, user.username);
        
        if (!result.success) {
            toast({ title: "Error", description: result.error, variant: "destructive" });
            return;
        }
        
        setInviteNewUser("");
        toast({ 
            title: "Invitación Enviada", 
            description: `Se ha enviado una invitación a ${result.user.username}`,
            className: "bg-green-600 text-white"
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050911] via-[#0a1628] to-[#050911] pt-10 pb-20 relative overflow-hidden">
            
            <Helmet>
                <title>Mis Equipos | BusFare-tokens</title>
            </Helmet>
            <div className="container mx-auto px-4 relative z-10">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 text-glow">My Teams</h1>
                        <p className="text-blue-200/80">Gestiona tus squads, invita amigos y compite.</p>
                    </div>
                    {user && (
                    <div className="flex gap-2">
                         <Dialog open={showModal} onOpenChange={setShowModal}>
                            <DialogTrigger asChild>
                                 <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                                    <Plus className="h-4 w-4 mr-2" /> Create Team
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-950 border-blue-500/30 text-white">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black text-glow">Fundar Nuevo Equipo</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label className="text-blue-200 font-semibold">Nombre del Equipo</Label>
                                        <Input 
                                            value={newTeamName}
                                            onChange={(e) => setNewTeamName(e.target.value)}
                                            placeholder="Ej: Kings of Tilted"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-blue-200 font-semibold">Tipo de Equipo</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['1v1', '2v2', '3v3', '4v4'].map((type) => (
                                                <button
                                                    key={type}
                                                    onClick={() => setTeamType(type)}
                                                    className={`py-2 px-3 rounded-lg font-bold transition-all duration-300 ${
                                                        teamType === type
                                                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                                                            : 'bg-blue-950/50 text-blue-200 hover:bg-blue-900/50 border border-blue-500/30'
                                                    }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {teamType !== '1v1' && (
                                        <div className="space-y-2">
                                            <Label className="text-blue-200 font-semibold">Invitar Usuario </Label>
                                            <Input 
                                                value={inviteUser}
                                                onChange={(e) => setInviteUser(e.target.value)}
                                                placeholder="Ej: @username"
                                            />
                                        </div>
                                    )}

                                    <Button 
                                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] disabled:opacity-50 disabled:cursor-not-allowed" 
                                        onClick={handleCreateTeam}
                                        disabled={!newTeamName.trim()}
                                    >
                                        Confirmar Creación
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
                    </div>
                ) : !user ? (
                    <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20">
                        <div className="p-12 text-center">
                            <div className="mb-6 flex justify-center">
                                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-600/20 flex items-center justify-center border border-purple-400/30">
                                    <Lock className="h-10 w-10 text-purple-400" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-black text-white mb-3">Contenido Bloqueado</h2>
                            <p className="text-blue-200/70 mb-6">Inicia sesión o regístrate para crear y ver tus equipos</p>
                            <div className="flex gap-3 justify-center">
                                <Button
                                    onClick={() => navigate('/login')}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8"
                                >
                                    Iniciar Sesión
                                </Button>
                                <Button
                                    onClick={() => navigate('/register')}
                                    variant="outline"
                                    className="border-purple-500/30 text-purple-300 hover:bg-purple-950/50 px-8"
                                >
                                    Registrarse
                                </Button>
                            </div>
                        </div>
                    </Card>
                ) : (
                <div className="space-y-4">
                    {teams.map((team) => (
                        <div key={team.id} className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border border-blue-500/20 rounded-xl overflow-hidden hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-300">
                            <div className="p-4 flex items-center justify-between border-b border-blue-500/20">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-bold text-white text-glow">{team.name}</h3>
                                        <span className="bg-blue-900/50 text-blue-200 text-xs px-2 py-0.5 rounded-full border border-blue-500/30">{team.members.length}/4</span>
                                    </div>
                                    <div className="text-xs text-blue-300/70 flex items-center gap-1 mt-1">
                                        <Shield className="h-3 w-3" /> Member
                                    </div>
                                </div>
                                <Dialog open={showSettingsModal && settingsTeam?.id === team.id} onOpenChange={(open) => {
                                    if (open) {
                                        setSettingsTeam(team);
                                        setShowSettingsModal(true);
                                    } else {
                                        setShowSettingsModal(false);
                                    }
                                }}>
                                    <DialogTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-blue-300 hover:text-white hover:bg-blue-600/30"
                                            onClick={() => {
                                                setSettingsTeam(team);
                                                setShowSettingsModal(true);
                                            }}
                                        >
                                            <Settings className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-slate-950 border-blue-500/30 text-white">
                                        <DialogHeader>
                                            <DialogTitle className="text-xl font-black text-glow">Configuración del Equipo</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-3">
                                                <h3 className="text-sm font-bold text-blue-200">Invitar Nuevo Miembro</h3>
                                                <div className="flex gap-2">
                                                    <Input 
                                                        value={inviteNewUser}
                                                        onChange={(e) => setInviteNewUser(e.target.value)}
                                                        placeholder="Nombre de usuario"
                                                    />
                                                    <Button 
                                                        className="bg-blue-600 hover:bg-blue-700"
                                                        onClick={() => handleInviteTeamMember(team.id)}
                                                    >
                                                        <UserPlus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="border-t border-blue-500/20 pt-4">
                                                <h3 className="text-sm font-bold text-blue-200 mb-3">Miembros del Equipo</h3>
                                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                                    {team.members.map((member, i) => (
                                                        <div key={i} className="flex items-center justify-between p-2 rounded bg-blue-950/30 border border-blue-500/20">
                                                            <div className="flex items-center gap-2">
                                                                <img 
                                                                    src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} 
                                                                    alt="Avatar" 
                                                                    className="h-6 w-6 rounded-full"
                                                                />
                                                                <span className="text-sm font-bold text-white">{member.name}</span>
                                                            </div>
                                                            {member.role !== 'Leader' && (
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon"
                                                                    className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                                                    onClick={() => handleRemoveTeamMember(team.id, member.name)}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="border-t border-blue-500/20 pt-4">
                                                <Button 
                                                    className="w-full bg-red-600 hover:bg-red-700"
                                                    onClick={() => handleDeleteTeam(team.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" /> Eliminar Equipo
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            
                            <div className="p-4 bg-blue-950/20">
                                <div className="text-sm text-blue-300/80 font-bold uppercase mb-3 flex items-center gap-2">
                                    <Users className="h-4 w-4" /> Team Members
                                </div>
                                <div className="space-y-2">
                                    {team.members.map((member, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 rounded bg-blue-950/30 hover:bg-blue-900/30 transition-colors border border-blue-500/10">
                                            <div className="flex items-center gap-3">
                                                 <img 
                                                    src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} 
                                                    alt="Avatar" 
                                                    className="h-8 w-8 rounded-full bg-slate-900 border border-blue-500/30"
                                                />
                                                <div>
                                                    <div className="text-sm font-bold text-white">{member.name}</div>
                                                    <div className="text-xs text-blue-400/70">{member.role}</div>
                                                </div>
                                            </div>
                                            {member.role === 'Leader' && <Crown className="h-4 w-4 text-cyan-400" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {teams.length === 0 && (
                        <div className="text-center py-12 border border-dashed border-blue-500/30 rounded-lg bg-blue-950/20">
                            <Users className="h-10 w-10 text-blue-400/50 mx-auto mb-3" />
                            <h3 className="text-blue-200 font-bold">No perteneces a ningún equipo</h3>
                            <p className="text-blue-400/60 text-sm">Crea uno o espera una invitación.</p>
                        </div>
                    )}
                </div>
                )}
            </div>
        </div>
    );
};

export default Teams;