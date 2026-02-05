import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Users, Coins } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';

const GlobalChat = () => {
    const { isChatOpen, setIsChatOpen } = useChat();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [showCoinAnimation, setShowCoinAnimation] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);
    const session = db.getSession();

    useEffect(() => {
        // Cargar mensajes del localStorage
        const savedMessages = localStorage.getItem('globalChatMessages');
        if (savedMessages) {
            setMessages(JSON.parse(savedMessages));
        }

        // Cargar usuarios online
        updateOnlineUsers();

        // Actualizar usuarios online cada 30 segundos
        const interval = setInterval(updateOnlineUsers, 30000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Mostrar animación de carga cuando se abre el chat
        if (isChatOpen) {
            setIsLoading(true);
            setTimeout(() => {
                setIsLoading(false);
            }, 1500); // Duración de la animación de carga
        }
    }, [isChatOpen]);

    useEffect(() => {
        // Scroll al final cuando hay nuevos mensajes - solo si el chat está abierto
        if (scrollRef.current && isChatOpen) {
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }, 100);
        }
    }, [messages, isChatOpen]);

    const updateOnlineUsers = async () => {
        try {
            const users = await db.getAllUsers();
            const now = Date.now();
            const fiveMinutesAgo = now - 5 * 60 * 1000;

            // Filtrar usuarios que han estado activos en los últimos 5 minutos
            const online = users.filter(user => {
                const lastActive = localStorage.getItem(`user_last_active_${user.id}`);
                return lastActive && parseInt(lastActive) > fiveMinutesAgo;
            });

            setOnlineUsers(online);

            // Actualizar última actividad del usuario actual
            if (session) {
                localStorage.setItem(`user_last_active_${session.id}`, now.toString());
            }
        } catch (error) {
            console.error('Error updating online users:', error);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !session) return;

        const message = {
            id: Date.now(),
            userId: session.id,
            username: session.username,
            text: newMessage.trim(),
            timestamp: new Date().toISOString()
        };

        const updatedMessages = [...messages, message];
        setMessages(updatedMessages);
        localStorage.setItem('globalChatMessages', JSON.stringify(updatedMessages));
        setNewMessage('');

        // Mostrar animación de moneda ocasionalmente
        if (Math.random() > 0.7) {
            setShowCoinAnimation(true);
            setTimeout(() => setShowCoinAnimation(false), 2000);
        }

        updateOnlineUsers();
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            {/* Animación de moneda flotante */}
            <AnimatePresence>
                {showCoinAnimation && (
                    <motion.div
                        initial={{ y: -100, x: 'calc(100vw - 100px)', opacity: 0, rotate: 0 }}
                        animate={{ 
                            y: [0, -50, 100],
                            opacity: [0, 1, 1, 0],
                            rotate: [0, 360, 720],
                            x: ['calc(100vw - 100px)', 'calc(100vw - 150px)', 'calc(100vw - 100px)']
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        className="fixed top-20 z-[9999] pointer-events-none"
                    >
                        <div className="relative">
                            <Coins className="h-12 w-12 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
                            <motion.div
                                animate={{ scale: [1, 1.5, 1] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                                className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Botón flotante */}
            <AnimatePresence>
                {!isChatOpen && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="fixed bottom-6 right-6 z-50"
                    >
                        <Button
                            onClick={() => setIsChatOpen(true)}
                            className="h-14 w-14 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-[0_0_30px_rgba(34,211,238,0.6)] relative"
                        >
                            <MessageCircle className="h-6 w-6" />
                            {onlineUsers.length > 0 && (
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute -top-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold"
                                >
                                    {onlineUsers.length}
                                </motion.div>
                            )}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Panel del chat */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ x: 400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 400, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-screen w-full sm:w-96 bg-gradient-to-br from-slate-950/98 via-blue-950/95 to-slate-950/98 backdrop-blur-xl border-l border-cyan-500/30 shadow-[-10px_0_50px_rgba(34,211,238,0.2)] z-50 flex flex-col"
                    >
                        {/* Animación de carga con moneda de oro */}
                        <AnimatePresence>
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center"
                                >
                                    <div className="relative">
                                        {/* Brillo de fondo */}
                                        <motion.div
                                            animate={{ 
                                                scale: [1, 1.3, 1],
                                                opacity: [0.3, 0.6, 0.3]
                                            }}
                                            transition={{ 
                                                duration: 1.5, 
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                            className="absolute inset-0 bg-yellow-400/40 rounded-full blur-3xl"
                                            style={{ width: '150px', height: '150px', top: '-35px', left: '-35px' }}
                                        />
                                        
                                        {/* Moneda principal */}
                                        <motion.div
                                            animate={{ 
                                                rotateY: [0, 360],
                                                scale: [1, 1.1, 1]
                                            }}
                                            transition={{ 
                                                rotateY: { duration: 1.5, repeat: Infinity, ease: "linear" },
                                                scale: { duration: 0.75, repeat: Infinity, ease: "easeInOut" }
                                            }}
                                            className="relative"
                                            style={{ transformStyle: 'preserve-3d' }}
                                        >
                                            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 flex items-center justify-center shadow-[0_0_40px_rgba(250,204,21,0.8)] border-4 border-yellow-200">
                                                <Coins className="h-10 w-10 text-yellow-900" />
                                                
                                                {/* Brillo interior */}
                                                <motion.div
                                                    animate={{ 
                                                        opacity: [0.3, 0.7, 0.3],
                                                        scale: [0.8, 1.2, 0.8]
                                                    }}
                                                    transition={{ 
                                                        duration: 1, 
                                                        repeat: Infinity,
                                                        ease: "easeInOut"
                                                    }}
                                                    className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/40 to-transparent"
                                                />
                                            </div>
                                        </motion.div>
                                        
                                        {/* Partículas flotantes */}
                                        {[...Array(6)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                animate={{
                                                    y: [-20, -40, -20],
                                                    x: [
                                                        Math.cos(i * 60 * Math.PI / 180) * 50,
                                                        Math.cos(i * 60 * Math.PI / 180) * 70,
                                                        Math.cos(i * 60 * Math.PI / 180) * 50
                                                    ],
                                                    opacity: [0, 1, 0],
                                                    scale: [0, 1, 0]
                                                }}
                                                transition={{
                                                    duration: 1.5,
                                                    repeat: Infinity,
                                                    delay: i * 0.2,
                                                    ease: "easeInOut"
                                                }}
                                                className="absolute top-10 left-10 w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.8)]"
                                                style={{
                                                    x: Math.cos(i * 60 * Math.PI / 180) * 50,
                                                    y: Math.sin(i * 60 * Math.PI / 180) * 50
                                                }}
                                            />
                                        ))}
                                        
                                        {/* Texto de carga */}
                                        <motion.p
                                            animate={{ opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                            className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-yellow-400 font-bold text-sm whitespace-nowrap"
                                        >
                                            Cargando chat...
                                        </motion.p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {/* Header */}
                        <div className="p-4 border-b border-cyan-500/30 bg-gradient-to-r from-blue-900/40 to-cyan-900/40">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <MessageCircle className="h-5 w-5 text-cyan-400" />
                                    <h2 className="text-lg font-black text-white">Chat Global</h2>
                                </div>
                                <Button
                                    onClick={() => setIsChatOpen(false)}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                            
                            {/* Online Users */}
                            <div className="flex items-center gap-2 text-sm">
                                <Users className="h-4 w-4 text-green-400" />
                                <span className="text-green-400 font-semibold">{onlineUsers.length} usuarios online</span>
                            </div>
                            
                            {onlineUsers.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {onlineUsers.slice(0, 10).map(user => (
                                        <span
                                            key={user.id}
                                            className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30"
                                        >
                                            {user.username}
                                        </span>
                                    ))}
                                    {onlineUsers.length > 10 && (
                                        <span className="text-xs px-2 py-0.5 text-cyan-400">
                                            +{onlineUsers.length - 10} más
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto">
                                <div className="space-y-3">
                                    {messages.length === 0 ? (
                                        <div className="text-center py-8">
                                            <MessageCircle className="h-12 w-12 text-blue-400/30 mx-auto mb-3" />
                                            <p className="text-blue-300/60 text-sm">
                                                No hay mensajes aún.<br />¡Sé el primero en escribir!
                                            </p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => {
                                            const isCurrentUser = session && msg.userId === session.id;
                                            return (
                                                <motion.div
                                                    key={msg.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className={`max-w-[80%] ${isCurrentUser ? 'bg-gradient-to-r from-cyan-600 to-blue-600' : 'bg-blue-950/60'} rounded-lg p-3 border ${isCurrentUser ? 'border-cyan-500/40' : 'border-blue-500/30'}`}>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-xs font-bold ${isCurrentUser ? 'text-cyan-100' : 'text-cyan-400'}`}>
                                                                {msg.username}
                                                            </span>
                                                            <span className="text-[10px] text-white/50">
                                                                {formatTime(msg.timestamp)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-white break-words">{msg.text}</p>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Input - Siempre fijo en la parte inferior */}
                        <div className="p-4 border-t border-cyan-500/30 bg-gradient-to-r from-blue-900/40 to-cyan-900/40 shrink-0">
                            {session ? (
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <Input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Escribe un mensaje..."
                                        className="flex-1 bg-blue-950/50 border-cyan-500/30 text-white placeholder:text-blue-300/50 focus:border-cyan-400"
                                        maxLength={200}
                                    />
                                    <Button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            ) : (
                                <div className="text-center py-2">
                                    <p className="text-blue-300/70 text-sm">
                                        Inicia sesión para chatear
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default GlobalChat;
