import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { User, BarChart3, Users, History, CreditCard, Crown, Settings as SettingsIcon, RefreshCw, TrendingUp } from 'lucide-react';
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

const Profile = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [activeSidebar, setActiveSidebar] = useState('profile');
    
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [epicGamesName, setEpicGamesName] = useState('');
    const [discordUsername, setDiscordUsername] = useState('');
    const [discordLinked, setDiscordLinked] = useState(false);
    const [twitterHandle, setTwitterHandle] = useState('');
    const [twitchUsername, setTwitchUsername] = useState('');
    const [tiktokHandle, setTiktokHandle] = useState('');
    const [teams, setTeams] = useState([]);
    const [matchHistory, setMatchHistory] = useState([]);
    const [avatarConfig, setAvatarConfig] = useState(null);
    const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
    
    // Rankings state
    const [rankings, setRankings] = useState({
        overall: 0,
        earnings: 0,
        winRate: 0,
        gamesPlayed: 0,
        totalUsers: 0
    });
    
    // Tip modal states
    const [tipModalOpen, setTipModalOpen] = useState(false);
    const [tipUsername, setTipUsername] = useState('');
    const [tipAmount, setTipAmount] = useState('');
    const [tipLoading, setTipLoading] = useState(false);

    useEffect(() => {
        const session = db.getSession();
        console.log('[Profile] session:', session);
        if (!session) {
            console.warn('[Profile] No session found, redirecting to /login');
            navigate('/login');
            return;
        }
        setUser(session);
        setUsername(session.username);
        setEmail(session.email);

        // Load social accounts
        loadSocialAccounts();

        // Load teams
        loadTeams();

        // Load match history from user's actual matches
        loadMatchHistory();

        // Load rankings
        loadRankings();

        // Load avatar config
        const loadAvatarConfig = async () => {
            const config = await db.getAvatarConfig(session.id);
            setAvatarConfig(config);
        };
        loadAvatarConfig();
    }, [navigate]);

    const loadSocialAccounts = async () => {
        const session = db.getSession();
        if (!session) return;
        const accounts = await db.getSocialAccounts(session.id);
        setEpicGamesName(accounts.epicGames || '');
        setDiscordUsername(accounts.discord || '');
        setTwitterHandle(accounts.twitter || '');
        setTwitchUsername(accounts.twitch || '');
        setTiktokHandle(accounts.tiktok || '');
    };

    const loadTeams = async () => {
        const session = db.getSession();
        if (!session) return;
        const userTeams = await db.getTeams(session.id);
        setTeams(userTeams);
    };

    const loadMatchHistory = async () => {
        const session = db.getSession();
        if (!session) return;
        const history = await db.getUserMatchHistory(session.id);
        setMatchHistory(history);
    };

    const loadRankings = async () => {
        const session = db.getSession();
        if (!session) return;
        
        try {
            const userRankings = await db.getUserRankings(session.id);
            setRankings(userRankings);
        } catch (error) {
            console.error('Error cargando rankings:', error);
            // Si falla, mantener los valores en 0 (será posición 1 si no hay otros usuarios)
        }
    };

    const handleDiscordLogin = () => {
        const CLIENT_ID = '1234567890';
        const REDIRECT_URI = encodeURIComponent(window.location.origin + '/profile');
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

    const handleSaveConnectedAccounts = async () => {
        const socialLinks = {
            epicGames: epicGamesName,
            discord: discordUsername,
            twitter: twitterHandle,
            twitch: twitchUsername,
            tiktok: tiktokHandle
        };
        const result = await db.updateSocialAccounts(user.id, socialLinks);
        if (result.success) {
            toast({ 
                title: "Cuentas vinculadas guardadas",
                description: "Tus redes sociales han sido actualizadas",
                className: "bg-green-600 text-white" 
            });
        } else {
            toast({ 
                title: "Error al guardar",
                description: "No se pudieron actualizar las cuentas",
                className: "bg-red-600 text-white" 
            });
        }
    };

    const handleDisconnectAccount = async (platform) => {
        // Clear the state
        switch (platform) {
            case 'epic':
                setEpicGamesName('');
                break;
            case 'discord':
                setDiscordUsername('');
                break;
            case 'twitter':
                setTwitterHandle('');
                break;
            case 'twitch':
                setTwitchUsername('');
                break;
            case 'tiktok':
                setTiktokHandle('');
                break;
        }

        // Update database
        const socialLinks = {
            epicGames: platform === 'epic' ? '' : epicGamesName,
            discord: platform === 'discord' ? '' : discordUsername,
            twitter: platform === 'twitter' ? '' : twitterHandle,
            twitch: platform === 'twitch' ? '' : twitchUsername,
            tiktok: platform === 'tiktok' ? '' : tiktokHandle
        };
        
        const result = await db.updateSocialAccounts(user.id, socialLinks);
        if (result.success) {
            toast({ 
                title: "Cuenta desconectada",
                description: `Tu cuenta de ${platform} ha sido desvinculada`,
                className: "bg-blue-600 text-white" 
            });
        } else {
            toast({ 
                title: "Error",
                description: "No se pudo desconectar la cuenta",
                className: "bg-red-600 text-white" 
            });
        }
    };

    const handleSendTip = async () => {
        if (!tipUsername.trim()) {
            toast({ 
                title: "Error", 
                description: "Ingresa un nombre de usuario",
                className: "bg-red-600 text-white" 
            });
            return;
        }

        const amount = parseFloat(tipAmount);
        if (isNaN(amount) || amount <= 0) {
            toast({ 
                title: "Error", 
                description: "Ingresa una cantidad válida",
                className: "bg-red-600 text-white" 
            });
            return;
        }

        if (amount > user.tokens) {
            toast({ 
                title: "Error", 
                description: "No tienes suficientes tokens",
                className: "bg-red-600 text-white" 
            });
            return;
        }

        setTipLoading(true);
        const result = await db.transferTokens(user.id, tipUsername, amount);
        setTipLoading(false);

        if (result.error) {
            toast({ 
                title: "Error", 
                description: result.error,
                className: "bg-red-600 text-white" 
            });
        } else {
            toast({ 
                title: "¡Tip enviado!", 
                description: `${amount} tokens enviados a ${result.recipient.username}`,
                className: "bg-green-600 text-white" 
            });
            setUser(result.sender);
            setTipModalOpen(false);
            setTipUsername('');
            setTipAmount('');
        }
    };

    if (!user) return null;

    const totalMatches = (user.wins || 0) + (user.losses || 0);
    const winRate = totalMatches > 0 ? ((user.wins / totalMatches) * 100).toFixed(2) : "0.00";
    const avgProfit = totalMatches > 0 ? ((user.earnings || 0) / totalMatches).toFixed(2) : "0.00";

    const sidebarItems = [
        { id: 'profile', icon: User, label: 'Profile' },
        { id: 'teams', icon: Users, label: 'Teams' },
        { id: 'history', icon: History, label: 'Match History' },
        { id: 'transactions', icon: CreditCard, label: 'Transactions' },
        { id: 'vip', icon: Crown, label: 'VIP Subscription' },
        { id: 'settings', icon: SettingsIcon, label: 'Settings' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050911] via-[#0a1628] to-[#050911] text-white pb-20 relative">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            
            <Helmet>
                <title>{user.username} | Profile</title>
            </Helmet>
            
            <div className="border-b border-blue-500/20 bg-gradient-to-r from-blue-950/60 via-slate-900/60 to-blue-950/60 backdrop-blur-sm py-4 sm:py-8 px-4 sm:px-8 relative z-10">
                <div className="container mx-auto max-w-7xl">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3 sm:gap-6">
                            <img 
                                src={generateAvatarUrl(avatarConfig ? { ...sanitizeAvatarConfig(avatarConfig), seed: user.username } : { seed: user.username })} 
                                alt="Avatar" 
                                className="h-16 w-16 sm:h-24 sm:w-24 rounded-full border-4 border-cyan-500 bg-blue-950/50 shadow-[0_0_20px_rgba(34,211,238,0.5)] cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                                onClick={() => setAvatarEditorOpen(true)}
                            />
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 sm:gap-3 mb-1">
                                    <h1 className="text-xl sm:text-3xl font-bold text-white text-glow truncate">{user.username}</h1>
                                    <span className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-yellow-50 text-[10px] font-bold px-2 py-0.5 rounded border border-yellow-400/40 uppercase tracking-wider shadow-[0_0_10px_rgba(234,179,8,0.3)] shrink-0">VIP</span>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 flex-wrap">
                                    <span className="bg-blue-950/50 backdrop-blur-sm text-cyan-300 text-xs font-bold px-2 sm:px-3 py-1 rounded-full border border-cyan-500/30 flex items-center gap-1.5 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                                        🏆 Rank #{rankings.overall || '...'}
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${user.earnings >= 0 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'}`}>
                                        {user.earnings >= 0 ? '+' : ''}{user.earnings.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                     <div className="h-6 w-6 rounded-full bg-orange-600 flex items-center justify-center text-[10px] font-bold text-white border border-orange-400">FN</div>
                                     <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white border border-blue-400">CR</div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 sm:gap-3">
                            <Button variant="outline" className="bg-transparent border-blue-500/30 text-blue-300 hover:text-white hover:border-cyan-400/60 hover:bg-blue-950/30 shadow-[0_0_10px_rgba(59,130,246,0.2)] text-xs sm:text-sm h-9 sm:h-10">
                                <BarChart3 className="h-4 w-4 mr-1 sm:mr-2" /> Compare
                            </Button>
                            <Button 
                                onClick={() => setTipModalOpen(true)}
                                className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-yellow-50 border border-yellow-400/40 hover:from-yellow-500 hover:to-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)] text-xs sm:text-sm h-9 sm:h-10"
                            >
                                💰 Tip
                            </Button>
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
                                    onClick={() => {
                                        setActiveSidebar(item.id);
                                        if (item.id === 'profile') setActiveTab('overview');
                                        if (item.id === 'teams') setActiveTab('teams');
                                        if (item.id === 'history') setActiveTab('history');
                                        if (item.id === 'transactions') setActiveTab('transactions');
                                        if (item.id === 'vip') setActiveTab('vip');
                                        if (item.id === 'settings') setActiveTab('settings');
                                    }}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                                        isActive ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-white border border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'text-blue-300/70 hover:text-white border border-transparent'
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
                    {/* Desktop sidebar */}
                    <div className="hidden lg:block w-80 shrink-0">
                        <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20 p-3 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300">
                            <div className="space-y-1">
                                {sidebarItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeSidebar === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setActiveSidebar(item.id);
                                                if (item.id === 'profile') setActiveTab('overview');
                                                if (item.id === 'teams') setActiveTab('teams');
                                                if (item.id === 'history') setActiveTab('history');
                                                if (item.id === 'transactions') setActiveTab('transactions');
                                                if (item.id === 'vip') setActiveTab('vip');
                                                if (item.id === 'settings') setActiveTab('settings');
                                            }}
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
                        {/* Solo mostrar tabs horizontales cuando activeSidebar es 'profile' */}
                        {activeSidebar === 'profile' && (
                            <div className="flex gap-4 sm:gap-8 border-b border-blue-500/20 mb-4 sm:mb-8 overflow-x-auto scrollbar-none">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`pb-3 sm:pb-4 px-1 sm:px-2 font-medium transition-colors relative whitespace-nowrap text-sm sm:text-base ${
                                        activeTab === 'overview' ? 'text-white' : 'text-blue-300/60 hover:text-blue-200'
                                    }`}
                                >
                                    Overview
                                    {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>}
                                </button>
                                <button
                                    onClick={() => setActiveTab('financial')}
                                    className={`pb-3 sm:pb-4 px-1 sm:px-2 font-medium transition-colors relative whitespace-nowrap text-sm sm:text-base ${
                                        activeTab === 'financial' ? 'text-white' : 'text-blue-300/60 hover:text-blue-200'
                                    }`}
                                >
                                    Financial
                                    {activeTab === 'financial' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>}
                                </button>
                            </div>
                        )}

                        {/* Mostrar título para las secciones del sidebar */}
                        {activeSidebar !== 'profile' && (
                            <div className="mb-8">
                                <h2 className="text-3xl font-bold text-white mb-2">
                                    {activeSidebar === 'teams' && 'Teams'}
                                    {activeSidebar === 'history' && 'Match History'}
                                    {activeSidebar === 'transactions' && 'Transactions'}
                                    {activeSidebar === 'vip' && 'VIP Subscription'}
                                    {activeSidebar === 'settings' && 'Settings'}
                                </h2>
                                <div className="h-0.5 w-24 bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                            </div>
                        )}

                        {activeTab === 'overview' && activeSidebar === 'profile' && (
                            <div className="space-y-10">
                                {/* Account Information */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20 p-6 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300">
                                        <div className="flex items-center gap-2 mb-4">
                                            <User className="h-5 w-5 text-cyan-400" />
                                            <h4 className="text-white font-bold">Account Details</h4>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-blue-300/70 text-sm">Username</span>
                                                <span className="text-white font-bold">{user.username}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-blue-300/70 text-sm">Email</span>
                                                <span className="text-white font-medium text-sm">{user.email}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-blue-300/70 text-sm">Member Since</span>
                                                <span className="text-white font-bold">
                                                    {new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20 p-6 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300">
                                        <div className="flex items-center gap-2 mb-4">
                                            <BarChart3 className="h-5 w-5 text-cyan-400" />
                                            <h4 className="text-white font-bold">Resources</h4>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-blue-300/70 text-sm">Current Tokens</span>
                                                <span className="text-cyan-400 font-bold text-lg">{user.tokens}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-blue-300/70 text-sm">Snipes Available</span>
                                                <span className="text-yellow-400 font-bold text-lg">{user.snipes}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-blue-300/70 text-sm">Best Streak</span>
                                                <span className="text-white font-bold">{user.streaks?.best || 0} wins</span>
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                {/* Statistics Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-10">
                                    <Card className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 backdrop-blur-sm border-cyan-500/30 p-4 sm:p-8 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] transition-all duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-12 w-12 bg-cyan-500/20 rounded-lg flex items-center justify-center border border-cyan-500/40">
                                                    <span className="text-2xl">🏆</span>
                                                </div>
                                                <h3 className="text-white font-bold text-lg">Win Rate</h3>
                                            </div>
                                        </div>
                                        <div className="text-3xl sm:text-5xl font-black text-white mb-3">
                                            {winRate}%
                                        </div>
                                        <div className="text-sm text-cyan-300/70">Percentage of victories</div>
                                        <div className="mt-6 h-3 bg-blue-950/50 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                                                style={{ width: `${winRate}%` }}
                                            />
                                        </div>
                                    </Card>

                                    <Card className="bg-gradient-to-br from-yellow-900/30 to-yellow-950/40 backdrop-blur-sm border-yellow-500/30 p-4 sm:p-8 hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] transition-all duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-12 w-12 bg-yellow-500/20 rounded-lg flex items-center justify-center border border-yellow-500/40">
                                                    <span className="text-2xl">🔥</span>
                                                </div>
                                                <h3 className="text-white font-bold text-lg">Best Streak</h3>
                                            </div>
                                        </div>
                                        <div className="text-3xl sm:text-5xl font-black text-white mb-3">
                                            {user.streaks?.best || 0}
                                        </div>
                                        <div className="text-sm text-yellow-300/70">consecutive wins</div>
                                        <div className="mt-6 flex items-center gap-2 text-xs text-yellow-300/60">
                                            <div className="text-xs text-yellow-300/60">Current: </div>
                                            <div className="text-sm font-bold text-white">{user.streaks?.current || 0}</div>
                                        </div>
                                    </Card>

                                    <Card className="bg-gradient-to-br from-purple-900/30 to-purple-950/40 backdrop-blur-sm border-purple-500/30 p-4 sm:p-8 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-12 w-12 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-500/40">
                                                    <span className="text-2xl">📊</span>
                                                </div>
                                                <h3 className="text-white font-bold text-lg">Total Games</h3>
                                            </div>
                                        </div>
                                        <div className="text-3xl sm:text-5xl font-black text-white mb-3">
                                            {totalMatches}
                                        </div>
                                        <div className="text-sm text-purple-300/70">matches completed</div>
                                        <div className="mt-6 grid grid-cols-2 gap-2">
                                            <div className="bg-purple-950/40 rounded px-2 py-1 text-center">
                                                <div className="text-xs text-purple-300/60">Wins</div>
                                                <div className="text-sm font-bold text-cyan-400">{user.wins}</div>
                                            </div>
                                            <div className="bg-purple-950/40 rounded px-2 py-1 text-center">
                                                <div className="text-xs text-purple-300/60">Losses</div>
                                                <div className="text-sm font-bold text-red-400">{user.losses}</div>
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                {/* Tokens Earned Card */}
                                <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20 p-4 sm:p-8 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300 mb-10">
                                    <div className="flex items-center gap-2 mb-4 sm:mb-6">
                                        <CreditCard className="h-5 sm:h-6 w-5 sm:w-6 text-cyan-400" />
                                        <h3 className="text-lg sm:text-2xl font-bold text-white text-glow">Tokens Earned</h3>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
                                        <div>
                                            <div className="text-sm font-semibold text-blue-300/70 mb-3">Net Profit</div>
                                            <div className={`text-2xl sm:text-4xl font-black mb-2 ${user.earnings >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                                                {user.earnings >= 0 ? '+' : ''}{user.earnings.toFixed(2)}
                                            </div>
                                            <div className="text-xs text-blue-300/60">Total balance change</div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-blue-300/70 mb-2 sm:mb-3">Total Won</div>
                                            <div className="text-2xl sm:text-4xl font-black text-cyan-400 mb-2">
                                                +{(user.totalEarned || 0).toFixed(2)}
                                            </div>
                                            <div className="text-xs text-blue-300/60">Tokens from victories</div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-blue-300/70 mb-2 sm:mb-3">Total Wagered</div>
                                            <div className="text-2xl sm:text-4xl font-black text-white mb-2">
                                                {(user.totalPlayed || 0).toFixed(2)}
                                            </div>
                                            <div className="text-xs text-blue-300/60">Tokens bet in total</div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-blue-300/70 mb-2 sm:mb-3">Avg Per Game</div>
                                            <div className={`text-2xl sm:text-4xl font-black mb-2 ${avgProfit >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                                                {avgProfit >= 0 ? '+' : ''}{avgProfit}
                                            </div>
                                            <div className="text-xs text-blue-300/60">Average earnings/match</div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Financial Performance */}
                                <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20 p-4 sm:p-8 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300">
                                    <div className="flex items-center gap-2 mb-4 sm:mb-6">
                                        <CreditCard className="h-5 w-5 text-cyan-400" />
                                        <h3 className="text-lg sm:text-xl font-bold text-white text-glow">Financial Performance</h3>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                                        <div>
                                            <div className="text-sm font-semibold text-blue-300/70 mb-2">Net Profit/Loss</div>
                                            <div className={`text-xl sm:text-3xl font-black mb-1 ${user.earnings >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                                                {user.earnings >= 0 ? '+' : ''}{user.earnings.toFixed(2)}
                                            </div>
                                            <div className="text-xs text-blue-300/60">Total earnings</div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-blue-300/70 mb-2">Total Wagered</div>
                                            <div className="text-xl sm:text-3xl font-black text-white mb-1">{(user.totalPlayed || 0).toFixed(2)}</div>
                                            <div className="text-xs text-blue-300/60">In bets placed</div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-blue-300/70 mb-2">Total Won</div>
                                            <div className="text-xl sm:text-3xl font-black text-cyan-400 mb-1">+{(user.totalEarned || 0).toFixed(2)}</div>
                                            <div className="text-xs text-blue-300/60">From victories</div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-blue-300/70 mb-2">Avg Per Match</div>
                                            <div className={`text-xl sm:text-3xl font-black mb-1 ${user.earnings >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                                                {user.wins + user.losses > 0 ? ((user.earnings >= 0 ? '+' : '') + (user.earnings / (user.wins + user.losses)).toFixed(2)) : '0.00'}
                                            </div>
                                            <div className="text-xs text-blue-300/60">Profit/loss per game</div>
                                        </div>
                                    </div>
                                </Card>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20 p-6 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300">
                                        <h4 className="text-white font-bold mb-6 flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4 text-cyan-400" />
                                            Performance by Game Mode
                                        </h4>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-blue-300/80 text-sm font-medium">1v1 REALISTIC</span>
                                                    <span className="text-white font-bold">0 played</span>
                                                </div>
                                                <div className="h-2 bg-blue-950/50 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: '0%' }} />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-blue-300/80 text-sm font-medium">BOXFIGHT</span>
                                                    <span className="text-white font-bold">0 played</span>
                                                </div>
                                                <div className="h-2 bg-blue-950/50 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: '0%' }} />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-blue-300/80 text-sm font-medium">ZONE WARS</span>
                                                    <span className="text-white font-bold">0 played</span>
                                                </div>
                                                <div className="h-2 bg-blue-950/50 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full" style={{ width: '0%' }} />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-blue-300/80 text-sm font-medium">2v2 / TEAM</span>
                                                    <span className="text-white font-bold">0 played</span>
                                                </div>
                                                <div className="h-2 bg-blue-950/50 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: '0%' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20 p-6 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300">
                                        <h4 className="text-white font-bold mb-6 flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-cyan-400" />
                                            Recent Performance Trend
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 bg-blue-950/30 border border-blue-500/20 rounded-lg">
                                                <div>
                                                    <div className="text-sm text-blue-300/70">Last 5 Games</div>
                                                    <div className="text-lg font-bold text-white mt-1">No data yet</div>
                                                </div>
                                                <div className="text-2xl">📈</div>
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-blue-950/30 border border-blue-500/20 rounded-lg">
                                                <div>
                                                    <div className="text-sm text-blue-300/70">Last 10 Games</div>
                                                    <div className="text-lg font-bold text-white mt-1">No data yet</div>
                                                </div>
                                                <div className="text-2xl">📊</div>
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-blue-950/30 border border-blue-500/20 rounded-lg">
                                                <div>
                                                    <div className="text-sm text-blue-300/70">Peak Performance</div>
                                                    <div className="text-lg font-bold text-white mt-1">{user.streaks?.best || 0} win streak</div>
                                                </div>
                                                <div className="text-2xl">🔥</div>
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                {/* Leaderboard Ranking */}
                                <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20 p-4 sm:p-8 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300">
                                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">🏅</span>
                                            <h3 className="text-lg sm:text-xl font-bold text-white text-glow">Competitive Ranking</h3>
                                        </div>
                                        <div className="bg-cyan-500/20 border border-cyan-500/40 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2">
                                            <span className="text-cyan-300 font-bold text-sm sm:text-lg">Rank #{rankings.overall || 1}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                        <div className="text-center p-4 bg-blue-950/30 border border-blue-500/20 rounded-lg">
                                            <div className="text-sm text-blue-300/70 mb-2">Earnings Rank</div>
                                            <div className="text-2xl font-black text-cyan-400">#{rankings.earnings || 1}</div>
                                            <div className="text-xs text-blue-300/60 mt-1">Top earners</div>
                                        </div>
                                        <div className="text-center p-4 bg-blue-950/30 border border-blue-500/20 rounded-lg">
                                            <div className="text-sm text-blue-300/70 mb-2">Win Rate Rank</div>
                                            <div className="text-2xl font-black text-cyan-400">#{rankings.winRate || 1}</div>
                                            <div className="text-xs text-blue-300/60 mt-1">Best performers</div>
                                        </div>
                                        <div className="text-center p-4 bg-blue-950/30 border border-blue-500/20 rounded-lg">
                                            <div className="text-sm text-blue-300/70 mb-2">Games Played Rank</div>
                                            <div className="text-2xl font-black text-cyan-400">#{rankings.gamesPlayed || 1}</div>
                                            <div className="text-xs text-blue-300/60 mt-1">Most active</div>
                                        </div>
                                    </div>
                                    {rankings.totalUsers > 0 && (
                                        <div className="text-center mt-4 text-xs text-blue-300/50">
                                            De {rankings.totalUsers} jugadores registrados
                                        </div>
                                    )}
                                </Card>
                            </div>
                        )}

                        {activeTab === 'financial' && activeSidebar === 'profile' && (
                            <div className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border border-blue-500/20 rounded-lg p-8 text-center hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300">
                                <CreditCard className="h-12 w-12 text-blue-400/50 mx-auto mb-3" />
                                <p className="text-blue-300/70">Financial data coming soon</p>
                            </div>
                        )}

                        {activeTab === 'teams' && (
                            <div className="space-y-4">
                                {teams.length === 0 ? (
                                    <div className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border border-blue-500/20 rounded-lg p-8 text-center hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300">
                                        <Users className="h-12 w-12 text-blue-400/50 mx-auto mb-3" />
                                        <p className="text-blue-300/70">No perteneces a ningún equipo</p>
                                        <p className="text-blue-300/50 text-sm mt-2">Crea uno o espera una invitación</p>
                                    </div>
                                ) : (
                                    teams.map((team) => {
                                        const isLeader = team.members.some(m => m.name === user.username && m.role === 'Leader');
                                        
                                        const handleDeleteTeam = async () => {
                                            if (confirm(`¿Estás seguro de que deseas eliminar el equipo "${team.name}"?`)) {
                                                await db.deleteTeam(team.id);
                                                await loadTeams();
                                                toast({ 
                                                    title: "Equipo eliminado", 
                                                    description: `${team.name} ha sido eliminado`,
                                                    className: "bg-red-600 text-white" 
                                                });
                                            }
                                        };

                                        const handleRemoveMember = async (memberName) => {
                                            if (confirm(`¿Estás seguro de que deseas expulsar a ${memberName}?`)) {
                                                await db.removeTeamMember(team.id, memberName);
                                                await loadTeams();
                                                toast({ 
                                                    title: "Miembro expulsado", 
                                                    description: `${memberName} ha sido expulsado del equipo`,
                                                    className: "bg-yellow-600 text-white" 
                                                });
                                            }
                                        };

                                        return (
                                            <Card key={team.id} className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20 overflow-hidden hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300">
                                                <div className="p-6 border-b border-blue-500/20">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h3 className="text-xl font-bold text-white text-glow">{team.name}</h3>
                                                            <p className="text-sm text-blue-300/70 mt-1">{team.members.length} miembros</p>
                                                        </div>
                                                        {isLeader && (
                                                            <Button 
                                                                onClick={handleDeleteTeam}
                                                                variant="destructive"
                                                                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                                                            >
                                                                Eliminar Equipo
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="p-6">
                                                    <h4 className="text-sm font-bold text-cyan-300 uppercase mb-4">Miembros</h4>
                                                    <div className="space-y-2">
                                                        {team.members.map((member, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-3 rounded bg-blue-950/30 hover:bg-blue-950/50 border border-blue-500/20 transition-all duration-300">
                                                                <div className="flex items-center gap-3">
                                                                    <img 
                                                                        src={member.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${member.name}`} 
                                                                        alt="Avatar" 
                                                                        className="h-8 w-8 rounded-full bg-blue-900/50 border border-cyan-500/30"
                                                                    />
                                                                    <div>
                                                                        <div className="text-sm font-bold text-white">{member.name}</div>
                                                                        <div className="text-xs text-blue-300/70">{member.role}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {member.role === 'Leader' && <span className="text-yellow-500 text-sm">👑</span>}
                                                                    {isLeader && member.role !== 'Leader' && (
                                                                        <Button 
                                                                            onClick={() => handleRemoveMember(member.name)}
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-6 px-2 text-xs"
                                                                        >
                                                                            Expulsar
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className="space-y-3">
                                {matchHistory.length === 0 ? (
                                    <div className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border border-blue-500/20 rounded-lg p-8 text-center hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300">
                                        <History className="h-12 w-12 text-blue-400/50 mx-auto mb-3" />
                                        <p className="text-blue-300/70">No hay historial de partidos</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border border-blue-500/20 rounded-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-blue-500/20">
                                                    <th className="text-left py-3 px-4 text-sm font-bold text-cyan-300">Fecha</th>
                                                    <th className="text-left py-3 px-4 text-sm font-bold text-cyan-300">Oponente</th>
                                                    <th className="text-left py-3 px-4 text-sm font-bold text-cyan-300">Tipo</th>
                                                    <th className="text-left py-3 px-4 text-sm font-bold text-cyan-300">Modo</th>
                                                    <th className="text-left py-3 px-4 text-sm font-bold text-cyan-300">Resultado</th>
                                                    <th className="text-right py-3 px-4 text-sm font-bold text-cyan-300">Ganancias</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {matchHistory.map((match) => (
                                                    <tr key={match.id} className="border-b border-blue-500/10 hover:bg-blue-950/30 transition-colors">
                                                        <td className="py-3 px-4 text-sm text-white">
                                                            {new Date(match.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                                                        </td>
                                                        <td className="py-3 px-4 text-sm text-white font-bold">{match.opponent}</td>
                                                        <td className="py-3 px-4 text-sm">
                                                            <span className="bg-blue-900/50 text-blue-200 px-2 py-1 rounded text-xs font-bold border border-blue-500/30">
                                                                {match.type}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-sm text-blue-300/70">{match.mode}</td>
                                                        <td className="py-3 px-4">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                                match.result === 'win' 
                                                                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' 
                                                                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                                                            }`}>
                                                                {match.result === 'win' ? '✓ Victoria' : '✗ Derrota'}
                                                            </span>
                                                        </td>
                                                        <td className={`py-3 px-4 text-right font-bold text-sm ${
                                                            match.earnings >= 0 ? 'text-cyan-400' : 'text-red-400'
                                                        }`}>
                                                            {match.earnings >= 0 ? '+' : ''}{match.earnings.toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'transactions' && (
                            <div className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border border-blue-500/20 rounded-lg p-8 text-center hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300">
                                <CreditCard className="h-12 w-12 text-blue-400/50 mx-auto mb-3" />
                                <p className="text-blue-300/70">Historial de transacciones próximamente</p>
                            </div>
                        )}

                        {activeTab === 'vip' && (
                            <div className="space-y-6">
                                {/* VIP Status Card */}
                                <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20 p-8 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                                                <Crown className="h-7 w-7 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-white text-glow">No Active Subscription</h2>
                                                <p className="text-blue-300/70 text-sm">Subscribe to VIP to unlock exclusive benefits</p>
                                            </div>
                                        </div>
                                        <div className="px-4 py-2 bg-blue-950/50 border border-blue-500/30 rounded-lg">
                                            <span className="text-blue-300/70 font-bold text-sm uppercase tracking-wider">Inactive</span>
                                        </div>
                                    </div>
                                    <div className="bg-blue-950/30 border border-blue-500/20 rounded-lg p-4">
                                        <p className="text-blue-200/80 text-sm">
                                            Visit the <span className="text-cyan-400 font-bold cursor-pointer hover:text-cyan-300" onClick={() => navigate('/shop')}>Shop</span> to purchase a VIP subscription for <span className="text-cyan-400 font-bold">4.00 tokens</span> per month.
                                        </p>
                                    </div>
                                </Card>

                                {/* VIP Benefits Card */}
                                <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20 p-8 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300">
                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="text-yellow-400 text-2xl">⭐</span>
                                        <h3 className="text-2xl font-bold text-white text-glow">VIP Benefits</h3>
                                    </div>
                                    <p className="text-blue-300/70 text-sm mb-8">Exclusive perks for subscribers</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Left Column */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 p-3 bg-blue-950/30 rounded-lg border border-cyan-500/20 hover:border-cyan-400/40 transition-all">
                                                <div className="h-6 w-6 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/40">
                                                    <svg className="h-4 w-4 text-cyan-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path d="M5 13l4 4L19 7"></path>
                                                    </svg>
                                                </div>
                                                <span className="text-white font-medium">Ability to Tip and Gift</span>
                                            </div>

                                            <div className="flex items-center gap-3 p-3 bg-blue-950/30 rounded-lg border border-cyan-500/20 hover:border-cyan-400/40 transition-all">
                                                <div className="h-6 w-6 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/40">
                                                    <svg className="h-4 w-4 text-cyan-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path d="M5 13l4 4L19 7"></path>
                                                    </svg>
                                                </div>
                                                <span className="text-white font-medium">Shiny Username</span>
                                            </div>

                                            <div className="flex items-center gap-3 p-3 bg-blue-950/30 rounded-lg border border-cyan-500/20 hover:border-cyan-400/40 transition-all">
                                                <div className="h-6 w-6 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/40">
                                                    <svg className="h-4 w-4 text-cyan-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path d="M5 13l4 4L19 7"></path>
                                                    </svg>
                                                </div>
                                                <span className="text-white font-medium">Quicker Submission Time</span>
                                            </div>

                                            <div className="flex items-center gap-3 p-3 bg-blue-950/30 rounded-lg border border-cyan-500/20 hover:border-cyan-400/40 transition-all">
                                                <div className="h-6 w-6 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/40">
                                                    <svg className="h-4 w-4 text-cyan-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path d="M5 13l4 4L19 7"></path>
                                                    </svg>
                                                </div>
                                                <span className="text-white font-medium">Priority Support</span>
                                            </div>

                                            <div className="flex items-center gap-3 p-3 bg-blue-950/30 rounded-lg border border-cyan-500/20 hover:border-cyan-400/40 transition-all">
                                                <div className="h-6 w-6 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/40">
                                                    <svg className="h-4 w-4 text-cyan-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path d="M5 13l4 4L19 7"></path>
                                                    </svg>
                                                </div>
                                                <span className="text-white font-medium">Multiple Matches at Same Time</span>
                                            </div>
                                        </div>

                                        {/* Right Column */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 p-3 bg-blue-950/30 rounded-lg border border-cyan-500/20 hover:border-cyan-400/40 transition-all">
                                                <div className="h-6 w-6 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/40">
                                                    <svg className="h-4 w-4 text-cyan-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path d="M5 13l4 4L19 7"></path>
                                                    </svg>
                                                </div>
                                                <span className="text-white font-medium">Reduced Withdraw Fees</span>
                                            </div>

                                            <div className="flex items-center gap-3 p-3 bg-blue-950/30 rounded-lg border border-cyan-500/20 hover:border-cyan-400/40 transition-all">
                                                <div className="h-6 w-6 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/40">
                                                    <svg className="h-4 w-4 text-cyan-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path d="M5 13l4 4L19 7"></path>
                                                    </svg>
                                                </div>
                                                <span className="text-white font-medium">Customise Display Name</span>
                                            </div>

                                            <div className="flex items-center gap-3 p-3 bg-blue-950/30 rounded-lg border border-cyan-500/20 hover:border-cyan-400/40 transition-all">
                                                <div className="h-6 w-6 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/40">
                                                    <svg className="h-4 w-4 text-cyan-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path d="M5 13l4 4L19 7"></path>
                                                    </svg>
                                                </div>
                                                <span className="text-white font-medium">Giveaways</span>
                                            </div>

                                            <div className="flex items-center gap-3 p-3 bg-blue-950/30 rounded-lg border border-cyan-500/20 hover:border-cyan-400/40 transition-all">
                                                <div className="h-6 w-6 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/40">
                                                    <svg className="h-4 w-4 text-cyan-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path d="M5 13l4 4L19 7"></path>
                                                    </svg>
                                                </div>
                                                <span className="text-white font-medium">10 Free Snipes per Month</span>
                                            </div>

                                            <div className="flex items-center gap-3 p-3 bg-blue-950/30 rounded-lg border border-cyan-500/20 hover:border-cyan-400/40 transition-all">
                                                <div className="h-6 w-6 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/40">
                                                    <svg className="h-4 w-4 text-cyan-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path d="M5 13l4 4L19 7"></path>
                                                    </svg>
                                                </div>
                                                <span className="text-white font-medium">Additional Profile Presets</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8">
                                        <Button 
                                            onClick={() => navigate('/shop')}
                                            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold py-4 text-lg shadow-[0_0_25px_rgba(234,179,8,0.5)]"
                                        >
                                            <Crown className="h-5 w-5 mr-2" />
                                            Subscribe to VIP Now
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="space-y-6">
                                {/* Personal Info */}
                                <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm border-blue-500/20 p-6 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 text-glow">
                                        <User className="h-5 w-5 text-cyan-400" /> Información Personal
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs text-cyan-300 font-bold mb-2">NOMBRE DE USUARIO</label>
                                            <Input 
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className="bg-blue-950/50 border-blue-500/30 text-white"
                                                disabled
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-cyan-300 font-bold mb-2">EMAIL</label>
                                            <Input 
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="bg-blue-950/50 border-blue-500/30 text-white"
                                                type="email"
                                            />
                                        </div>
                                        <Button 
                                            onClick={handleSavePersonalInfo}
                                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                                        >
                                            <RefreshCw className="h-4 w-4 mr-2" /> Guardar Cambios
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tip Modal */}
            <Dialog open={tipModalOpen} onOpenChange={setTipModalOpen}>
                <DialogContent className="bg-gradient-to-br from-blue-950/95 to-slate-900/95 backdrop-blur-md border-blue-500/30 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                            💰 Enviar Tip
                        </DialogTitle>
                        <DialogDescription className="text-blue-300/70">
                            Envía tokens a otro usuario registrado
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-cyan-300 mb-2">
                                Nombre de Usuario
                            </label>
                            <Input
                                value={tipUsername}
                                onChange={(e) => setTipUsername(e.target.value)}
                                placeholder="Ingresa el nombre de usuario"
                                className="bg-blue-950/50 border-blue-500/30 text-white placeholder:text-blue-300/40"
                                disabled={tipLoading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-cyan-300 mb-2">
                                Cantidad de Tokens
                            </label>
                            <Input
                                type="number"
                                value={tipAmount}
                                onChange={(e) => setTipAmount(e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className="bg-blue-950/50 border-blue-500/30 text-white placeholder:text-blue-300/40"
                                disabled={tipLoading}
                            />
                            <p className="text-xs text-blue-300/60 mt-1">
                                Disponible: {user.tokens} tokens
                            </p>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setTipModalOpen(false);
                                    setTipUsername('');
                                    setTipAmount('');
                                }}
                                className="flex-1 bg-transparent border-blue-500/30 text-blue-300 hover:text-white hover:border-cyan-400/60 hover:bg-blue-950/30"
                                disabled={tipLoading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSendTip}
                                className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white shadow-[0_0_15px_rgba(234,179,8,0.4)]"
                                disabled={tipLoading}
                            >
                                {tipLoading ? 'Enviando...' : 'Enviar Tip'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AvatarEditor
                open={avatarEditorOpen}
                onOpenChange={setAvatarEditorOpen}
                userId={user?.id}
                username={user?.username}
                onSave={(newConfig) => setAvatarConfig(newConfig)}
            />
        </div>
    );
};

export default Profile;
