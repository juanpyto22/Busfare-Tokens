import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Coins, RefreshCw } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';

const GlobalChat = () => {
    const { isChatOpen, setIsChatOpen } = useChat();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [onlineCount, setOnlineCount] = useState(0);
    const [showCoinAnimation, setShowCoinAnimation] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef(null);
    const channelRef = useRef(null);
    const pollIntervalRef = useRef(null);
    const sessionRef = useRef(db.getSession());

    const session = sessionRef.current;

    // ========== LOAD MESSAGES (directly from Supabase) ==========
    const loadMessages = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .select(`*, user:user_id(id, username, role, level)`)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false })
                .limit(150);

            if (error) throw error;

            const msgs = (data || []).reverse();
            setMessages(msgs);

            // Cache locally for offline access
            try {
                localStorage.setItem('globalChatMessages_cache', JSON.stringify(msgs.slice(-50)));
            } catch (e) { /* quota exceeded */ }
            return true;
        } catch (error) {
            console.error('Error loading chat from Supabase:', error);
            // Fallback: localStorage cache
            try {
                const cached = JSON.parse(localStorage.getItem('globalChatMessages_cache') || '[]');
                if (cached.length > 0) setMessages(cached);
            } catch (e) { /* ignore */ }
            return false;
        }
    }, []);

    // ========== SEND MESSAGE (directly to Supabase) ==========
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !session || isSending) return;

        const messageText = newMessage.trim();
        setNewMessage('');
        setIsSending(true);

        // Optimistic message shown immediately
        const optimisticMsg = {
            id: `temp_${Date.now()}`,
            user_id: session.id,
            message: messageText,
            created_at: new Date().toISOString(),
            is_deleted: false,
            user: { id: session.id, username: session.username, role: session.role || 'user', level: session.level || 1 },
            _optimistic: true
        };
        setMessages(prev => [...prev, optimisticMsg]);

        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .insert({ user_id: session.id, message: messageText })
                .select(`*, user:user_id(id, username, role, level)`)
                .single();

            if (error) throw error;

            // Replace optimistic message with real one
            setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? data : m));

            if (Math.random() > 0.7) {
                setShowCoinAnimation(true);
                setTimeout(() => setShowCoinAnimation(false), 2000);
            }
        } catch (error) {
            console.error('Error sending to Supabase:', error);
            // Keep optimistic message marked as local
            setMessages(prev => prev.map(m =>
                m.id === optimisticMsg.id ? { ...m, id: Date.now(), _optimistic: false, _local: true } : m
            ));
        }
        setIsSending(false);
    };

    // ========== REAL-TIME + POLLING ==========
    useEffect(() => {
        setIsLoading(true);
        loadMessages().finally(() => setTimeout(() => setIsLoading(false), 600));

        // Real-time subscription
        const channel = supabase
            .channel('global_chat_realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, async (payload) => {
                try {
                    const { data } = await supabase
                        .from('chat_messages')
                        .select(`*, user:user_id(id, username, role, level)`)
                        .eq('id', payload.new.id)
                        .single();
                    if (data && !data.is_deleted) {
                        setMessages(prev => {
                            if (prev.some(m => m.id === data.id)) return prev;
                            // Remove matching optimistic message
                            const filtered = prev.filter(m =>
                                !(m._optimistic && m.user_id === data.user_id && m.message === data.message)
                            );
                            return [...filtered, data];
                        });
                    }
                } catch (err) {
                    console.error('Error fetching real-time message:', err);
                }
            })
            .subscribe();

        channelRef.current = channel;

        // Polling fallback every 10s
        pollIntervalRef.current = setInterval(() => loadMessages(), 10000);

        if (session) {
            localStorage.setItem(`user_last_active_${session.id}`, Date.now().toString());
        }

        return () => {
            if (channelRef.current) supabase.removeChannel(channelRef.current);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, [loadMessages]);

    // Reload when chat opens
    useEffect(() => {
        if (isChatOpen) {
            loadMessages();
            if (session) localStorage.setItem(`user_last_active_${session.id}`, Date.now().toString());
        }
    }, [isChatOpen, loadMessages]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current && isChatOpen) {
            requestAnimationFrame(() => {
                if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            });
        }
    }, [messages, isChatOpen]);

    // Online count
    useEffect(() => {
        const updateOnline = () => {
            const now = Date.now();
            const fiveMin = 5 * 60 * 1000;
            let count = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('user_last_active_')) {
                    if (now - parseInt(localStorage.getItem(key) || '0') < fiveMin) count++;
                }
            }
            setOnlineCount(Math.max(count, 1));
        };
        updateOnline();
        const interval = setInterval(updateOnline, 15000);
        return () => clearInterval(interval);
    }, []);

    // ========== HELPERS ==========
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        }
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return 'Ayer ' + date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) + ' ' +
               date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };

    const getRoleBadge = (role) => {
        if (role === 'admin') return <span className="text-[9px] bg-red-500/30 text-red-300 px-1.5 py-0.5 rounded-full border border-red-500/40 font-bold">ADMIN</span>;
        if (role === 'moderator') return <span className="text-[9px] bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded-full border border-purple-500/40 font-bold">MOD</span>;
        if (role === 'vip') return <span className="text-[9px] bg-yellow-500/30 text-yellow-300 px-1.5 py-0.5 rounded-full border border-yellow-500/40 font-bold">VIP</span>;
        return null;
    };

    return (
        <>
            {/* Coin animation */}
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
                        <Coins className="h-12 w-12 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating button */}
            <AnimatePresence>
                {!isChatOpen && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
                    >
                        <Button
                            onClick={() => setIsChatOpen(true)}
                            className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-[0_0_30px_rgba(34,211,238,0.6)] relative"
                        >
                            <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute -top-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold"
                            >
                                {onlineCount}
                            </motion.div>
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat panel */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ x: 400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 400, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-[100dvh] w-full sm:w-96 bg-gradient-to-br from-slate-950/98 via-blue-950/95 to-slate-950/98 backdrop-blur-xl border-l border-cyan-500/30 shadow-[-10px_0_50px_rgba(34,211,238,0.2)] z-50 flex flex-col"
                    >
                        {/* Loading overlay */}
                        <AnimatePresence>
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center"
                                >
                                    <div className="flex flex-col items-center">
                                        <motion.div
                                            animate={{ rotateY: [0, 360], scale: [1, 1.1, 1] }}
                                            transition={{
                                                rotateY: { duration: 1.5, repeat: Infinity, ease: "linear" },
                                                scale: { duration: 0.75, repeat: Infinity, ease: "easeInOut" }
                                            }}
                                            style={{ transformStyle: 'preserve-3d' }}
                                        >
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 flex items-center justify-center shadow-[0_0_40px_rgba(250,204,21,0.8)] border-4 border-yellow-200">
                                                <Coins className="h-8 w-8 text-yellow-900" />
                                            </div>
                                        </motion.div>
                                        <motion.p
                                            animate={{ opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                            className="mt-4 text-yellow-400 font-bold text-sm"
                                        >
                                            Cargando chat...
                                        </motion.p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Header */}
                        <div className="p-4 border-b border-cyan-500/30 bg-gradient-to-r from-blue-900/40 to-cyan-900/40 shrink-0">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <MessageCircle className="h-5 w-5 text-cyan-400" />
                                    <h2 className="text-lg font-black text-white">Chat Global</h2>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        onClick={() => loadMessages()}
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-blue-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                                        title="Recargar mensajes"
                                    >
                                        <RefreshCw className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        onClick={() => setIsChatOpen(false)}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-green-400 font-semibold">{onlineCount} online</span>
                                <span className="text-blue-400/50 text-xs">• {messages.length} mensajes</span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500/20 scrollbar-track-transparent">
                                <div className="space-y-3">
                                    {messages.length === 0 && !isLoading ? (
                                        <div className="text-center py-12">
                                            <MessageCircle className="h-14 w-14 text-blue-400/20 mx-auto mb-4" />
                                            <p className="text-blue-300/50 text-sm font-medium">No hay mensajes aún</p>
                                            <p className="text-blue-300/30 text-xs mt-1">¡Sé el primero en escribir!</p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => {
                                            const msgUserId = msg.user_id || msg.userId;
                                            const msgUsername = msg.user?.username || msg.username || 'Anónimo';
                                            const msgText = msg.message || msg.text || '';
                                            const msgTime = msg.created_at || msg.timestamp;
                                            const msgRole = msg.user?.role || 'user';
                                            const isCurrentUser = session && msgUserId === session.id;

                                            return (
                                                <motion.div
                                                    key={msg.id}
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: msg._optimistic ? 0.7 : 1, y: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 ${
                                                        isCurrentUser
                                                            ? 'bg-gradient-to-r from-cyan-600/90 to-blue-600/90 border border-cyan-500/40'
                                                            : 'bg-blue-950/60 border border-blue-500/20'
                                                    }`}>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-xs font-bold ${
                                                                isCurrentUser ? 'text-cyan-100'
                                                                : msgRole === 'admin' ? 'text-red-400'
                                                                : msgRole === 'moderator' ? 'text-purple-400'
                                                                : 'text-cyan-400'
                                                            }`}>
                                                                {msgUsername}
                                                            </span>
                                                            {getRoleBadge(msgRole)}
                                                            <span className="text-[10px] text-white/40 ml-auto">
                                                                {formatTime(msgTime)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-white/95 break-words leading-relaxed">{msgText}</p>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Input */}
                        <div className="p-3 sm:p-4 border-t border-cyan-500/30 bg-gradient-to-r from-blue-900/40 to-cyan-900/40 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                            {session ? (
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <Input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Escribe un mensaje..."
                                        className="flex-1 bg-blue-950/50 border-cyan-500/30 text-white placeholder:text-blue-300/40 focus:border-cyan-400 text-sm h-10"
                                        maxLength={500}
                                        autoComplete="off"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={!newMessage.trim() || isSending}
                                        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 px-4 h-10"
                                    >
                                        {isSending ? (
                                            <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </Button>
                                </form>
                            ) : (
                                <div className="text-center py-3 bg-blue-950/30 rounded-lg border border-blue-500/20">
                                    <p className="text-blue-300/60 text-sm">Inicia sesión para enviar mensajes</p>
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
