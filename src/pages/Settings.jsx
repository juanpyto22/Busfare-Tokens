import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { User, BarChart3, Users, History, CreditCard, Crown, Settings as SettingsIcon, RefreshCw, Bell, Shield, Eye, EyeOff, Mail, Lock, Globe, Monitor } from 'lucide-react';
import { Helmet } from 'react-helmet';
import AvatarEditor, { generateAvatarUrl, sanitizeAvatarConfig } from '@/components/AvatarEditor';
import {
    SKIN_COLORS,
    HAIR_STYLES,
    HAIR_COLORS,
    FACIAL_HAIR_STYLES,
    EYES_STYLES,
    EYEBROW_STYLES,
    MOUTH_STYLES,
    ACCESSORIES,
    CLOTHING_STYLES,
    CLOTHING_COLORS,
    HAT_STYLES,
    HAT_COLORS,
    CLOTHING_GRAPHIC,
    FACIAL_HAIR_COLORS,
    ACCESSORIES_COLORS,
    skinColorMap,
    hairColorMap,
    clothingColorMap,
    hatColorMap,
    accessoriesColorMap,
    facialHairColorMap
} from '@/lib/avatar-constants';

const Settings = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('personal');
    const [activeSidebar, setActiveSidebar] = useState('profile');
    
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [epicGamesName, setEpicGamesName] = useState('');
    const [discordUsername, setDiscordUsername] = useState('');
    const [discordLinked, setDiscordLinked] = useState(false);
    const [twitterHandle, setTwitterHandle] = useState('');
    const [twitchUsername, setTwitchUsername] = useState('');
    const [tiktokHandle, setTiktokHandle] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [matchAlerts, setMatchAlerts] = useState(true);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [showAvatarEditor, setShowAvatarEditor] = useState(false);
    const [avatarConfig, setAvatarConfig] = useState(null);

    useEffect(() => {
        const session = db.getSession();
        if (!session) {
            navigate('/login');
            return;
        }
        setUser(session);
        setUsername(session.username);
        setEmail(session.email);
        
        const savedLinks = JSON.parse(localStorage.getItem(`social_links_${session.id}`) || '{}');
        setEpicGamesName(savedLinks.epicGames || '');
        setDiscordUsername(savedLinks.discord || '');
        setDiscordLinked(savedLinks.discordLinked || false);
        setTwitterHandle(savedLinks.twitter || '');
        setTwitchUsername(savedLinks.twitch || '');
        setTiktokHandle(savedLinks.tiktok || '');
        
        // Cargar configuración de avatar
        const loadAvatarConfig = async () => {
            const config = await db.getAvatarConfig(session.id);
            setAvatarConfig(config);
        };
        loadAvatarConfig();
    }, [navigate]);

    const handleDiscordLogin = () => {
        const CLIENT_ID = '1234567890';
        const REDIRECT_URI = encodeURIComponent(window.location.origin + '/settings');
        const SCOPE = 'identify%20email';
        const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${SCOPE}`;
        window.location.href = discordAuthUrl;
    };

    const handleDiscordUnlink = () => {
        setDiscordUsername('');
        setDiscordLinked(false);
        const savedLinks = JSON.parse(localStorage.getItem(`social_links_${user.id}`) || '{}');
        savedLinks.discord = '';
        savedLinks.discordLinked = false;
        localStorage.setItem(`social_links_${user.id}`, JSON.stringify(savedLinks));
        toast({ title: "Discord desvinculado", className: "bg-slate-800 text-white" });
    };

    const handleSavePersonalInfo = () => {
        toast({ 
            title: "Información actualizada", 
            description: "Tus datos han sido guardados",
            className: "bg-green-600 text-white" 
        });
    };

    const handleSaveConnectedAccounts = () => {
        const socialLinks = {
            epicGames: epicGamesName,
            discord: discordUsername,
            discordLinked: discordLinked,
            twitter: twitterHandle,
            twitch: twitchUsername,
            tiktok: tiktokHandle
        };
        localStorage.setItem(`social_links_${user.id}`, JSON.stringify(socialLinks));
        toast({ 
            title: "Cuentas vinculadas guardadas",
            className: "bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-0" 
        });
    };

    const handleChangePassword = () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast({ 
                title: "Error", 
                description: "Completa todos los campos",
                variant: "destructive" 
            });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({ 
                title: "Error", 
                description: "Las contraseñas no coinciden",
                variant: "destructive" 
            });
            return;
        }
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast({ 
            title: "Contraseña actualizada",
            description: "Tu contraseña ha sido cambiada exitosamente",
            className: "bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-0" 
        });
    };

    if (!user) return null;

    const sidebarItems = [
        { id: 'profile', icon: User, label: 'Profile' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050911] via-[#0a1628] to-[#050911] text-white relative">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            
            <Helmet>
                <title>Profile Settings | BusFare-tokens</title>
            </Helmet>
            
            <div className="border-b border-blue-500/20 bg-gradient-to-r from-blue-950/60 via-slate-900/60 to-blue-950/60 backdrop-blur-sm py-4 sm:py-8 px-4 sm:px-8 relative z-10">
                <div className="container mx-auto max-w-7xl">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 text-glow">Profile Settings</h1>
                            <p className="text-blue-300/70 text-xs sm:text-base truncate">Gestiona tu información personal y preferencias</p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <img 
                                src={generateAvatarUrl(avatarConfig ? { ...sanitizeAvatarConfig(avatarConfig), seed: user.username } : { seed: user.username })} 
                                alt="Avatar" 
                                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                            />
                            <span className="text-white font-bold text-sm sm:text-base hidden sm:inline">{user.username}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-7xl px-4 sm:px-8 py-4 sm:py-8 relative z-10">
                {/* Mobile horizontal tabs */}
                <div className="lg:hidden mb-4 -mx-4 px-4 overflow-x-auto scrollbar-none">
                    <div className="flex gap-1.5 min-w-max bg-blue-950/30 backdrop-blur-sm p-1.5 rounded-xl border border-blue-500/20">
                        {sidebarItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeSidebar === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSidebar(item.id)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                                        isActive ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-white border border-cyan-500/40' : 'text-blue-300/70 hover:text-white border border-transparent'
                                    }`}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex gap-8">
                    <div className="hidden lg:block w-80 shrink-0">
                        <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20 p-3 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300">
                            <div className="space-y-1">
                                {sidebarItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeSidebar === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveSidebar(item.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-300 ${
                                                isActive ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-white border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'text-blue-300/70 hover:text-white hover:bg-blue-950/40 border border-transparent'
                                            }`}
                                        >
                                            <Icon className="h-4 w-4" />
                                            <span className="font-medium text-sm">{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex gap-3 sm:gap-8 border-b border-blue-500/20 mb-4 sm:mb-8 overflow-x-auto scrollbar-none">
                            <button
                                onClick={() => setActiveTab('personal')}
                                className={`pb-3 sm:pb-4 px-1 sm:px-2 font-medium transition-colors relative whitespace-nowrap text-xs sm:text-base ${
                                    activeTab === 'personal' ? 'text-white' : 'text-blue-300/60 hover:text-blue-200'
                                }`}
                            >
                                Personal Info
                                {activeTab === 'personal' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>}
                            </button>
                            <button
                                onClick={() => setActiveTab('security')}
                                className={`pb-3 sm:pb-4 px-1 sm:px-2 font-medium transition-colors relative whitespace-nowrap text-xs sm:text-base ${
                                    activeTab === 'security' ? 'text-white' : 'text-blue-300/60 hover:text-blue-200'
                                }`}
                            >
                                Security
                                {activeTab === 'security' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>}
                            </button>

                            <button
                                onClick={() => setActiveTab('notifications')}
                                className={`pb-3 sm:pb-4 px-1 sm:px-2 font-medium transition-colors relative whitespace-nowrap text-xs sm:text-base ${
                                    activeTab === 'notifications' ? 'text-white' : 'text-blue-300/60 hover:text-blue-200'
                                }`}
                            >
                                Notifications
                                {activeTab === 'notifications' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>}
                            </button>
                        </div>

                        {activeTab === 'personal' && (
                            <div className="space-y-6">
                                <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20 p-6 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300">
                                    <div className="flex items-center gap-2 mb-4">
                                        <User className="h-5 w-5 text-cyan-400" />
                                        <h2 className="text-xl font-bold text-white text-glow">Información Personal</h2>
                                    </div>
                                    <p className="text-blue-300/70 text-sm mb-6">Actualiza tus datos personales y perfil</p>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-cyan-300 font-bold text-sm mb-3 block flex items-center gap-2">
                                                <User className="h-4 w-4" /> Avatar
                                            </label>
                                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                                <img 
                                                    src={generateAvatarUrl(avatarConfig ? { ...sanitizeAvatarConfig(avatarConfig), seed: user.username } : { seed: user.username })} 
                                                    alt="Avatar" 
                                                    className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-4 border-cyan-500 bg-blue-950/50 shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                                                />
                                                <div className="flex gap-3">
                                                    <Button 
                                                        onClick={() => setShowAvatarEditor(true)}
                                                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                                                    >
                                                        Personalizar
                                                    </Button>
                                                    <Button variant="outline" className="bg-transparent border-blue-500/30 text-blue-300 hover:bg-blue-950/30 hover:border-cyan-400/60">
                                                        Presets
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-cyan-300 font-bold text-sm mb-3 block">NOMBRE DE USUARIO</label>
                                            <div className="flex gap-3">
                                                <Input 
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    className="bg-blue-950/50 border-blue-500/30 text-white flex-1 focus:border-cyan-400/60 focus:ring-cyan-400/20"
                                                    disabled
                                                />
                                                <Button variant="outline" size="icon" className="bg-transparent border-blue-500/30 hover:bg-blue-950/30 hover:border-cyan-400/60">
                                                    <RefreshCw className="h-4 w-4 text-cyan-400" />
                                                </Button>
                                            </div>
                                            <p className="text-blue-300/50 text-xs mt-2">El nombre de usuario no se puede cambiar</p>
                                        </div>

                                        <div>
                                            <label className="text-cyan-300 font-bold text-sm mb-3 block flex items-center gap-2">
                                                <Mail className="h-4 w-4" /> EMAIL
                                            </label>
                                            <Input 
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="bg-blue-950/50 border-blue-500/30 text-white focus:border-cyan-400/60 focus:ring-cyan-400/20"
                                                type="email"
                                            />
                                            <p className="text-blue-300/50 text-xs mt-2">Usaremos este email para notificaciones importantes</p>
                                        </div>

                                        <Button 
                                            onClick={handleSavePersonalInfo}
                                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                                        >
                                            <RefreshCw className="h-4 w-4 mr-2" /> Guardar Cambios
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20 p-6 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Shield className="h-5 w-5 text-cyan-400" />
                                        <h2 className="text-xl font-bold text-white text-glow">Seguridad de la Cuenta</h2>
                                    </div>
                                    <p className="text-blue-300/70 text-sm mb-6">Protege tu cuenta y datos personales</p>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-cyan-300 font-bold text-sm mb-3 block flex items-center gap-2">
                                                <Lock className="h-4 w-4" /> CONTRASEÑA ACTUAL
                                            </label>
                                            <div className="relative">
                                                <Input 
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Ingresa tu contraseña actual"
                                                    className="bg-blue-950/50 border-blue-500/30 text-white focus:border-cyan-400/60 focus:ring-cyan-400/20 pr-10"
                                                />
                                                <button
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/70 hover:text-cyan-400"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-cyan-300 font-bold text-sm mb-3 block flex items-center gap-2">
                                                <Lock className="h-4 w-4" /> NUEVA CONTRASEÑA
                                            </label>
                                            <Input 
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Ingresa tu nueva contraseña"
                                                className="bg-blue-950/50 border-blue-500/30 text-white focus:border-cyan-400/60 focus:ring-cyan-400/20"
                                            />
                                            <p className="text-blue-300/50 text-xs mt-2">Mínimo 8 caracteres, incluye mayúsculas y números</p>
                                        </div>

                                        <div>
                                            <label className="text-cyan-300 font-bold text-sm mb-3 block flex items-center gap-2">
                                                <Lock className="h-4 w-4" /> CONFIRMAR CONTRASEÑA
                                            </label>
                                            <Input 
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Confirma tu nueva contraseña"
                                                className="bg-blue-950/50 border-blue-500/30 text-white focus:border-cyan-400/60 focus:ring-cyan-400/20"
                                            />
                                        </div>

                                        <Button 
                                            onClick={handleChangePassword}
                                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                                        >
                                            <Lock className="h-4 w-4 mr-2" /> Cambiar Contraseña
                                        </Button>
                                    </div>
                                </Card>

                                <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20 p-6 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-5 w-5 text-cyan-400" />
                                            <h3 className="text-lg font-bold text-white text-glow">Autenticación de Dos Factores</h3>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${twoFactorEnabled ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-blue-950/50 text-blue-300/70 border border-blue-500/30'}`}>
                                            {twoFactorEnabled ? 'Activado' : 'Desactivado'}
                                        </div>
                                    </div>
                                    <p className="text-blue-300/70 text-sm mb-6">Añade una capa extra de seguridad a tu cuenta</p>
                                    <Button 
                                        onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                                        variant="outline"
                                        className={`w-full ${twoFactorEnabled ? 'bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30' : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30'}`}
                                    >
                                        {twoFactorEnabled ? 'Desactivar 2FA' : 'Activar 2FA'}
                                    </Button>
                                </Card>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20 p-6 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Bell className="h-5 w-5 text-cyan-400" />
                                        <h2 className="text-xl font-bold text-white text-glow">Notificaciones</h2>
                                    </div>
                                    <p className="text-blue-300/70 text-sm mb-6">Configura cómo quieres recibir notificaciones</p>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-blue-950/30 rounded-lg border border-blue-500/20 hover:bg-blue-950/40 transition-all">
                                            <div className="flex items-center gap-3">
                                                <Bell className="h-5 w-5 text-cyan-400" />
                                                <div>
                                                    <h3 className="text-white font-bold text-sm">Notificaciones Push</h3>
                                                    <p className="text-blue-300/60 text-xs">Recibe alertas en tiempo real</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                    notificationsEnabled ? 'bg-cyan-500' : 'bg-blue-950/50 border border-blue-500/30'
                                                }`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                    notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                                                }`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-blue-950/30 rounded-lg border border-blue-500/20 hover:bg-blue-950/40 transition-all">
                                            <div className="flex items-center gap-3">
                                                <Mail className="h-5 w-5 text-cyan-400" />
                                                <div>
                                                    <h3 className="text-white font-bold text-sm">Notificaciones por Email</h3>
                                                    <p className="text-blue-300/60 text-xs">Recibe resúmenes por correo</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setEmailNotifications(!emailNotifications)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                    emailNotifications ? 'bg-cyan-500' : 'bg-blue-950/50 border border-blue-500/30'
                                                }`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                    emailNotifications ? 'translate-x-6' : 'translate-x-1'
                                                }`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-blue-950/30 rounded-lg border border-blue-500/20 hover:bg-blue-950/40 transition-all">
                                            <div className="flex items-center gap-3">
                                                <Monitor className="h-5 w-5 text-cyan-400" />
                                                <div>
                                                    <h3 className="text-white font-bold text-sm">Alertas de Matches</h3>
                                                    <p className="text-blue-300/60 text-xs">Notificaciones cuando empiece un match</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setMatchAlerts(!matchAlerts)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                    matchAlerts ? 'bg-cyan-500' : 'bg-blue-950/50 border border-blue-500/30'
                                                }`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                    matchAlerts ? 'translate-x-6' : 'translate-x-1'
                                                }`} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                                        <p className="text-cyan-300 text-sm font-medium">
                                            💡 Tip: Mantén las notificaciones activadas para no perderte ninguna partida importante
                                        </p>
                                    </div>

                                    <Button 
                                        onClick={() => toast({ 
                                            title: "Preferencias guardadas",
                                            description: "Tus configuraciones han sido actualizadas",
                                            className: "bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-0" 
                                        })}
                                        className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" /> Guardar Preferencias
                                    </Button>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Avatar Editor Modal */}
            {user && (
                <AvatarEditor 
                    open={showAvatarEditor}
                    onOpenChange={setShowAvatarEditor}
                    userId={user.id}
                    username={user.username}
                    onSave={(newConfig) => setAvatarConfig(newConfig)}
                />
            )}
        </div>
    );
};

export default Settings;
