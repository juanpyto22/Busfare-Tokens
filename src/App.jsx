import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import GlobalChat from '@/components/GlobalChat';
import { ChatProvider, useChat } from '@/contexts/ChatContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Home from '@/pages/Home';
import Shop from '@/pages/Shop';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Matches from '@/pages/Matches';
import MatchDetail from '@/pages/MatchDetail';
import Teams from '@/pages/Teams';
import Leaderboard from '@/pages/Leaderboard';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import Statistics from '@/pages/Statistics';
import Transactions from '@/pages/Transactions';
import Withdrawals from '@/pages/Withdrawals';
import AdminPanel from '@/pages/AdminPanel';
import ModeratorPanel from '@/pages/ModeratorPanel';
import ForgotPassword from '@/pages/ForgotPassword';
import { Toaster } from '@/components/ui/toaster';

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return isMobile;
};

// Wrapper to conditionally render Navbar
const AppContent = () => {
    const location = useLocation();
    const { isChatOpen } = useChat();
    const isMobile = useIsMobile();
    const hideNavbar = ['/login', '/register'].includes(location.pathname);

    return (
        <>
            {!hideNavbar && <Navbar />}
            <div 
                className="transition-all duration-300 ease-in-out"
                style={{ 
                    marginRight: (isChatOpen && !isMobile) ? '384px' : '0',
                }}
            >
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/matches" element={<Matches />} />
                    <Route path="/match/:id" element={<MatchDetail />} />
                    <Route path="/teams" element={<Teams />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/statistics" element={<Statistics />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/withdrawals" element={<Withdrawals />} />
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="/moderator" element={<ModeratorPanel />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                </Routes>
            </div>
            <GlobalChat />
            <Toaster />
        </>
    );
};

function App() {
    return (
        <Router>
            <LanguageProvider>
                <ChatProvider>
                    <AppContent />
                </ChatProvider>
            </LanguageProvider>
        </Router>
    );
}

export default App;