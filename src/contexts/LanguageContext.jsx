import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
    es: {
        // Navbar
        nav: {
            matches: 'Partidas',
            teams: 'Equipos',
            leaderboard: 'Clasificación',
            shop: 'Tienda',
            logIn: 'Iniciar Sesión',
            signUp: 'Registrarse',
            profile: 'Perfil',
            wallet: 'Cartera',
            settings: 'Configuración',
            logOut: 'Cerrar Sesión',
            notifications: 'Notificaciones',
            noNotifications: 'No hay notificaciones nuevas',
            clearAll: 'Borrar todas las notificaciones'
        },
        // Matches Page
        matches: {
            title: 'Partidas en Vivo',
            createMatch: 'Crear Partida',
            availableMatches: 'Partidas Disponibles',
            ongoingMatches: 'Partidas en Curso',
            regions: 'Regiones',
            platforms: 'Plataformas',
            gameModes: 'Modos de Juego',
            teamSize: 'Tamaño de Equipo',
            sort: 'Ordenar',
            clear: 'Limpiar',
            firstTo: 'Primero a',
            expiresIn: 'Expira en',
            entryFee: 'Entrada',
            prize: 'Premio',
            joinMatch: 'Unirse a Partida',
            // Create Match Dialog
            configureMatch: 'Configurar Nueva Partida',
            format: 'Formato',
            region: 'Región',
            mode: 'Modo',
            entryFeeLabel: 'Tarifa de Entrada (Tokens)',
            publishMatch: 'PUBLICAR PARTIDA',
            // Sort Options
            newestFirst: 'Más Recientes',
            oldestFirst: 'Más Antiguos',
            highestEntry: 'Entrada Más Alta',
            lowestEntry: 'Entrada Más Baja',
            highestPrize: 'Premio Más Alto'
        },
        // Shop Page
        shop: {
            title: 'TIENDA DE TOKENS',
            subtitle: 'Elige el paquete que mejor se adapte a tu estilo de juego.',
            vipSubscription: 'SUSCRIPCIÓN VIP',
            monthlySubscription: 'Suscripción mensual',
            perMonth: 'por mes',
            subscribeNow: 'Suscribirse Ahora',
            tokenPackages: 'Paquetes de Tokens',
            packagesSubtitle: 'Compra tokens para participar en partidas y más',
            customAmount: 'Cantidad Personalizada',
            customDescription: '¿Necesitas una cantidad específica? Elige tú mismo cuántos tokens comprar',
            minimum: 'Mínimo',
            noMaximum: 'Sin máximos',
            buyCustomAmount: 'Comprar Cantidad Personalizada',
            orChoosePackage: 'O elige un paquete predefinido',
            packagesWithBonus: 'Paquetes con bonus incluidos',
            tokens: 'Tokens',
            bonusFree: 'BONUS GRATIS',
            buyNow: 'Comprar Ahora',
            securePayment: 'Pago Seguro con Stripe',
            mostSold: 'Más Vendido'
        },
        // Common
        common: {
            loading: 'Cargando...',
            error: 'Error',
            success: 'Éxito',
            cancel: 'Cancelar',
            confirm: 'Confirmar',
            close: 'Cerrar'
        }
    },
    en: {
        // Navbar
        nav: {
            matches: 'Matches',
            teams: 'Teams',
            leaderboard: 'Leaderboard',
            shop: 'Shop',
            logIn: 'Log In',
            signUp: 'Sign Up',
            profile: 'Profile',
            wallet: 'Wallet',
            settings: 'Settings',
            logOut: 'Log out',
            notifications: 'Notifications',
            noNotifications: 'No new notifications',
            clearAll: 'Clear all notifications'
        },
        // Matches Page
        matches: {
            title: 'Live Matches',
            createMatch: 'Create Match',
            availableMatches: 'Available Matches',
            ongoingMatches: 'Ongoing Matches',
            regions: 'Regions',
            platforms: 'Platforms',
            gameModes: 'Game Modes',
            teamSize: 'Team Size',
            sort: 'Sort',
            clear: 'Clear',
            firstTo: 'First To',
            expiresIn: 'Expires In',
            entryFee: 'Entry Fee',
            prize: 'Prize',
            joinMatch: 'Join Match',
            // Create Match Dialog
            configureMatch: 'Configure New Match',
            format: 'Format',
            region: 'Region',
            mode: 'Mode',
            entryFeeLabel: 'Entry Fee (Tokens)',
            publishMatch: 'PUBLISH MATCH',
            // Sort Options
            newestFirst: 'Newest First',
            oldestFirst: 'Oldest First',
            highestEntry: 'Highest Entry',
            lowestEntry: 'Lowest Entry',
            highestPrize: 'Highest Prize'
        },
        // Shop Page
        shop: {
            title: 'TOKEN SHOP',
            subtitle: 'Choose the package that best suits your gaming style.',
            vipSubscription: 'VIP SUBSCRIPTION',
            monthlySubscription: 'Monthly subscription',
            perMonth: 'per month',
            subscribeNow: 'Subscribe Now',
            tokenPackages: 'Token Packages',
            packagesSubtitle: 'Buy tokens to participate in matches and more',
            customAmount: 'Custom Amount',
            customDescription: 'Need a specific amount? Choose how many tokens you want to buy',
            minimum: 'Minimum',
            noMaximum: 'No maximum',
            buyCustomAmount: 'Buy Custom Amount',
            orChoosePackage: 'Or choose a predefined package',
            packagesWithBonus: 'Packages with bonus included',
            tokens: 'Tokens',
            bonusFree: 'BONUS FREE',
            buyNow: 'Buy Now',
            securePayment: 'Secure Payment with Stripe',
            mostSold: 'Most Sold'
        },
        // Common
        common: {
            loading: 'Loading...',
            error: 'Error',
            success: 'Success',
            cancel: 'Cancel',
            confirm: 'Confirm',
            close: 'Close'
        }
    }
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('language') || 'es';
    });

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    const t = (key) => {
        const keys = key.split('.');
        let value = translations[language];
        
        for (const k of keys) {
            value = value?.[k];
        }
        
        return value || key;
    };

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'es' ? 'en' : 'es');
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
