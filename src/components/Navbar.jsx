import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { useToast } from '@/components/ui/use-toast';
import { useChat } from '@/contexts/ChatContext';
import { useLanguage } from '@/contexts/LanguageContext';
import logo from '../../img/logo.png';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Coins, User, LogOut, Shield, Swords, Users, Trophy, Wallet, Settings, Bell, Check, X, Languages, Mail, AlertCircle, Scale } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isChatOpen } = useChat();
  const { language, toggleLanguage, t } = useLanguage();
  const [user, setUser] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const checkAuth = () => {
      const session = db.getSession();
      setUser(session);
    };
    
    checkAuth();
    const interval = setInterval(checkAuth, 1000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Load notifications from localStorage
    if (user) {
      const savedNotifications = JSON.parse(localStorage.getItem(`notifications_${user.id}`) || '[]');
      setNotifications(savedNotifications);
    }
  }, [showNotifications, user]);

  const handleMarkAsRead = (index) => {
    const updatedNotifications = notifications.filter((_, i) => i !== index);
    localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updatedNotifications));
    setNotifications(updatedNotifications);
  };

  const handleClearAll = () => {
    localStorage.setItem(`notifications_${user.id}`, JSON.stringify([]));
    setNotifications([]);
    toast({
      title: "Notificaciones borradas",
      description: "Todas tus notificaciones han sido eliminadas"
    });
  };

  const handleAcceptInvitation = (notification, index) => {
    const result = db.acceptTeamInvitation(notification.teamId, user.id);
    if (result.success) {
      toast({
        title: "¡Te has unido al equipo!",
        description: `Ahora eres miembro de ${notification.teamName}`,
        className: "bg-green-600 text-white"
      });
      handleMarkAsRead(index);
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  const handleRejectInvitation = (notification, index) => {
    db.rejectTeamInvitation(notification.teamId, user.id);
    toast({
      title: "Invitación rechazada",
      description: `Has rechazado la invitación a ${notification.teamName}`
    });
    handleMarkAsRead(index);
  };

  const handleLogout = () => {
    db.logout();
    setUser(null);
    toast({
      title: "Sesión cerrada",
      description: "¡Esperamos verte pronto en la batalla!",
    });
    navigate('/');
  };

  return (
    <nav 
      className="border-b border-blue-500/20 bg-gradient-to-r from-[#050911] via-[#0a1628] to-[#050911] backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-blue-900/20 transition-all duration-300 ease-in-out"
      style={{ 
        marginRight: isChatOpen ? '384px' : '0',
      }}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
                                 <div className="transform group-hover:scale-110 transition-transform duration-300">
                                     <img src={logo} alt="BusFare" className="h-16 w-16 object-contain" />
                                 </div>
           <span className="text-lg font-black tracking-tighter text-white italic uppercase hidden md:block">
             BusFare<span className="text-blue-400">-tokens</span>
           </span>
        </Link>

        {/* Center Nav */}
        <div className="hidden md:flex items-center gap-1 bg-blue-950/30 backdrop-blur-sm p-1 rounded-lg border border-blue-500/20">
            <Link to="/matches">
                <Button variant="ghost" className="text-blue-200 hover:text-white hover:bg-blue-600/30 h-8 text-xs font-bold px-4">
                    {t('nav.matches')}
                </Button>
            </Link>
            <Link to="/teams">
                <Button variant="ghost" className="text-blue-200 hover:text-white hover:bg-blue-600/30 h-8 text-xs font-bold px-4">
                    {t('nav.teams')}
                </Button>
            </Link>
            <Link to="/leaderboard">
                 <Button variant="ghost" className="text-blue-200 hover:text-white hover:bg-blue-600/30 h-8 text-xs font-bold px-4">
                    {t('nav.leaderboard')}
                </Button>
            </Link>
             <Link to="/shop">
                 <Button variant="ghost" className="text-blue-200 hover:text-white hover:bg-blue-600/30 h-8 text-xs font-bold px-4">
                    {t('nav.shop')}
                </Button>
            </Link>
        </div>
        
        {/* Right Actions */}
        <div className="flex items-center gap-4">
            {user ? (
                <>
                    {/* Email Verification Banner */}
                    {!user.emailVerified && (
                        <Button
                            onClick={() => navigate('/verify-email')}
                            className="hidden md:flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white h-8 text-xs animate-pulse"
                        >
                            <Mail className="h-4 w-4" />
                            Verificar Email
                        </Button>
                    )}

                    {/* Wallet/Stats Display */}
                    <div className="hidden lg:flex items-center gap-3 bg-blue-950/30 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                        <div className="flex items-center gap-2 pr-3 border-r border-blue-400/20">
                             <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></div>
                             <span className="text-sm font-bold text-white">{user.tokens.toFixed(2)}</span>
                             <div className="bg-cyan-500/20 p-0.5 rounded-full border border-cyan-400/30">
                                 <Coins className="h-3 w-3 text-cyan-400" />
                             </div>
                        </div>
                        <div className="flex items-center gap-2" title="Snipes">
                             <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></div>
                             <span className="text-sm font-bold text-white">{user.snipes || 0}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Language Selector */}
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={toggleLanguage}
                            className="text-blue-200 hover:text-white hover:bg-blue-600/30 relative"
                            title={language === 'es' ? 'Cambiar a inglés' : 'Switch to Spanish'}
                        >
                            <Languages className="h-5 w-5" />
                            <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-blue-600 px-1 rounded">
                                {language.toUpperCase()}
                            </span>
                        </Button>

                        <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-blue-200 hover:text-white hover:bg-blue-600/30 relative" onClick={() => setShowNotifications(true)}>
                                    <Bell className="h-5 w-5" />
                                    {notifications.length > 0 && (
                                        <span className="absolute top-2 right-2 h-2 w-2 bg-cyan-400 rounded-full border-2 border-[#0a1628] animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]"></span>
                                    )}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-950 border-blue-500/30 text-white max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Bell className="h-5 w-5 text-blue-400" />
                                        {t('nav.notifications')}
                                        {notifications.length > 0 && (
                                            <span className="ml-auto bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                {notifications.length}
                                            </span>
                                        )}
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="text-center py-8 text-blue-300/70">
                                            <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">{t('nav.noNotifications')}</p>
                                        </div>
                                    ) : (
                                        notifications.map((notif, index) => (
                                            <div key={index} className="p-3 rounded-lg bg-blue-950/30 border border-blue-500/30 hover:bg-blue-900/30 transition-colors">
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <div className="flex-1">
                                                        <p className="font-bold text-white text-sm">
                                                            {notif.type === 'team_invitation' ? '🎮 Invitación de Equipo' : notif.title}
                                                        </p>
                                                        <p className="text-xs text-blue-200/70 mt-1">
                                                            {notif.type === 'team_invitation' 
                                                                ? `${notif.invitedBy} te ha invitado a unirte a ${notif.teamName}`
                                                                : notif.message}
                                                        </p>
                                                        <p className="text-xs text-blue-400/50 mt-1">
                                                            {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleMarkAsRead(index)}
                                                        className="text-blue-300/70 hover:text-white transition-colors"
                                                        title="Marcar como leído"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                {notif.type === 'team_invitation' && (
                                                    <div className="flex gap-2 mt-2">
                                                        <Button
                                                            size="sm"
                                                            className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs"
                                                            onClick={() => handleAcceptInvitation(notif, index)}
                                                        >
                                                            <Check className="h-3 w-3 mr-1" /> Aceptar
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="flex-1 border-red-500/50 text-red-400 hover:bg-red-950/50 text-xs"
                                                            onClick={() => handleRejectInvitation(notif, index)}
                                                        >
                                                            <X className="h-3 w-3 mr-1" /> Rechazar
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                                {notifications.length > 0 && (
                                    <div className="pt-3 border-t border-blue-500/30">
                                        <Button 
                                            variant="ghost" 
                                            className="w-full text-blue-300 hover:text-blue-200 hover:bg-blue-900/30 text-sm"
                                            onClick={handleClearAll}
                                        >
                                            {t('nav.clearAll')}
                                        </Button>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-9 w-9 rounded-full overflow-hidden border border-blue-500/30 p-0 hover:border-blue-400/60 transition-all hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                                    <img 
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                                        alt="Avatar" 
                                        className="h-full w-full object-cover bg-slate-900"
                                    />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64 bg-slate-950 border-blue-500/30 text-blue-100 p-2 shadow-xl shadow-blue-900/30 mt-2" align="end">
                                <div className="flex items-center gap-3 p-2 mb-2">
                                     <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-900 shrink-0 border border-blue-500/30">
                                         <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="h-full w-full object-cover"/>
                                     </div>
                                     <div className="overflow-hidden">
                                         <p className="text-sm font-bold text-white truncate">{user.username}</p>
                                         <p className="text-xs text-blue-400/70 truncate font-mono">ID: {user.id.slice(0,8)}</p>
                                     </div>
                                </div>
                                <DropdownMenuSeparator className="bg-blue-500/20 mb-1" />
                                
                                <DropdownMenuItem className="cursor-pointer focus:bg-blue-900/30 text-blue-200 focus:text-white my-0.5 rounded-md px-3 py-2" onClick={() => navigate('/profile')}>
                                    <User className="mr-3 h-4 w-4" />
                                    <span className="font-medium">{t('nav.profile')}</span>
                                </DropdownMenuItem>
                                
                                <div className="mx-2 my-2 bg-blue-950/50 rounded-lg p-3 flex justify-between items-center border border-cyan-500/30 group cursor-pointer hover:border-cyan-400/60 transition-all hover:shadow-[0_0_10px_rgba(34,211,238,0.3)]" onClick={() => navigate('/dashboard')}>
                                     <div className="flex items-center gap-2">
                                         <Wallet className="h-4 w-4 text-cyan-400" />
                                         <span className="font-bold text-sm text-white">{t('nav.wallet')}</span>
                                     </div>
                                     <div className="flex items-center gap-1">
                                         <span className="font-bold text-white">{user.tokens.toFixed(2)}</span>
                                         <Coins className="h-3 w-3 text-cyan-400" />
                                     </div>
                                </div>

                                <DropdownMenuItem className="cursor-pointer focus:bg-blue-900/30 text-blue-200 focus:text-white my-0.5 rounded-md px-3 py-2" onClick={() => navigate('/settings')}>
                                    <Settings className="mr-3 h-4 w-4" />
                                    <span className="font-medium">{t('nav.settings')}</span>
                                </DropdownMenuItem>
                                
                                {/* Admin Panel */}
                                {user.role === 'admin' && (
                                    <>
                                        <DropdownMenuSeparator className="bg-blue-500/20 my-1" />
                                        <DropdownMenuItem className="cursor-pointer focus:bg-red-900/30 text-red-400 focus:text-red-300 my-0.5 rounded-md px-3 py-2" onClick={() => navigate('/admin')}>
                                            <Shield className="mr-3 h-4 w-4" />
                                            <span className="font-medium">Panel Admin</span>
                                        </DropdownMenuItem>
                                    </>
                                )}
                                
                                {/* Moderator Panel */}
                                {(user.role === 'moderator' || user.role === 'admin') && (
                                    <DropdownMenuItem className="cursor-pointer focus:bg-purple-900/30 text-purple-400 focus:text-purple-300 my-0.5 rounded-md px-3 py-2" onClick={() => navigate('/moderator')}>
                                        <Scale className="mr-3 h-4 w-4" />
                                        <span className="font-medium">Panel Moderador</span>
                                    </DropdownMenuItem>
                                )}
                                
                                <DropdownMenuSeparator className="bg-blue-500/20 my-1" />
                                <DropdownMenuItem className="cursor-pointer text-red-400 focus:bg-red-950/20 focus:text-red-300 rounded-md px-3 py-2" onClick={handleLogout}>
                                    <LogOut className="mr-3 h-4 w-4" />
                                    <span className="font-medium">{t('nav.logOut')}</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </>
            ) : (
                <div className="flex items-center gap-3">
                    {/* Language Selector for non-logged users */}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={toggleLanguage}
                        className="text-blue-200 hover:text-white hover:bg-blue-600/30 relative"
                        title={language === 'es' ? 'Cambiar a inglés' : 'Switch to Spanish'}
                    >
                        <Languages className="h-5 w-5" />
                        <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-blue-600 px-1 rounded">
                            {language.toUpperCase()}
                        </span>
                    </Button>
                    
                    <Link to="/login">
                        <Button variant="ghost" className="text-blue-200 hover:text-white hover:bg-blue-600/30 font-bold text-sm">
                            {t('nav.logIn')}
                        </Button>
                    </Link>
                    <Link to="/register">
                        <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm h-9 px-5 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                            {t('nav.signUp')}
                        </Button>
                    </Link>
                </div>
            )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;