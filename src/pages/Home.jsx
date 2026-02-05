import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Shield, Gift, ChevronRight, Swords, Trophy } from 'lucide-react';
import { Helmet } from 'react-helmet';
import Lightning from '@/components/Lightning';

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        viewport={{ once: true }}
        className="bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-sm p-8 rounded-2xl border border-blue-500/20 hover:border-blue-400/60 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:scale-105"
    >
        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center mb-5 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] transition-all duration-300">
            <Icon className="h-7 w-7 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3 text-glow">{title}</h3>
        <p className="text-blue-200/80 leading-relaxed">{description}</p>
    </motion.div>
);

const Home = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050911] via-[#0a1628] to-[#050911] relative overflow-hidden">
            <Helmet>
                <title>BusFare-tokens | Competitivo Fortnite</title>
                <meta name="description" content="Compite en torneos 1v1, 2v2 de Fortnite y gana dinero real. La mejor plataforma de apuestas competitivas." />
            </Helmet>

            {/* 3D Model Showcase Section - "Fast as lightning" */}
            <section className="relative py-24 overflow-hidden border-y border-blue-500/20">
                <div className="absolute inset-0 bg-gradient-to-b from-[#050911] via-[#0a0e1a] to-[#050911]" />
                
                {/* Animated background elements */}
                <div className="absolute top-1/4 left-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
                
                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Left side - Text */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="space-y-6"
                        >
                            <h2 className="text-6xl md:text-7xl font-black text-white leading-tight">
                                DOMINA LA <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">COMPETENCIA</span>
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">GANA DINERO REAL</span>
                            </h2>
                            <p className="text-xl text-blue-200/90 leading-relaxed">
                                Únete a matches 1v1, 2v2 o Boxfights. Apuesta tus tokens y demuestra quién es el mejor.
                            </p>
                            <div className="flex gap-4 pt-4">
                                <Link to="/matches">
                                    <Button variant="neonBlue" size="lg" className="h-12 px-6">
                                        <Swords className="h-5 w-5 mr-2" /> Buscar Match
                                    </Button>
                                </Link>
                                <Link to="/register">
                                    <Button variant="outline" size="lg" className="h-12 px-6 border-blue-500/50 text-blue-200 hover:bg-blue-950/50 hover:text-white hover:border-blue-400 transition-all duration-300">
                                        Crear Cuenta Gratis
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>

                        {/* Right side - Visual Showcase */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="relative w-full h-[500px] rounded-2xl overflow-hidden border border-blue-500/20 bg-gradient-to-br from-slate-900/50 to-blue-950/30 backdrop-blur-sm shadow-[0_0_50px_rgba(59,130,246,0.3)]">
                                {/* Lightning effect inside */}
                                <div className="absolute inset-0">
                                    <Lightning hue={190} xOffset={0} speed={0.8} intensity={1.2} size={1} />
                                </div>
                                
                                {/* Central content - FN Neon Text */}
                                <div className="relative w-full h-full flex items-center justify-center">
                                    {/* FN text is now rendered in the Lightning component */}
                                </div>
                                
                                {/* Decorative corner accents */}
                                <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-cyan-400/60" />
                                <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-cyan-400/60" />
                                <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-cyan-400/60" />
                                <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-cyan-400/60" />
                            </div>
                            
                            {/* Glow effect behind model */}
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-3xl -z-10" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="border-y border-blue-500/20 bg-gradient-to-r from-blue-950/30 via-slate-900/30 to-blue-950/30 backdrop-blur-sm py-12">
                <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { label: "Usuarios Activos", value: "10K+" },
                        { label: "Matches Jugados", value: "500K+" },
                        { label: "Premios Pagados", value: "$1M+" },
                        { label: "Seguridad", value: "100%" },
                    ].map((stat, i) => (
                        <motion.div 
                            key={i} 
                            className="text-center"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                        >
                            <div className="text-4xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2 text-glow">{stat.value}</div>
                            <div className="text-sm font-semibold text-blue-300/80 uppercase tracking-wider">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 relative">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSg1OSwxMzAsMjQ2LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-4 text-glow">¿Por qué competir en BusFare-tokens?</h2>
                        <p className="text-blue-300/90 text-lg">Diseñado por gamers, para gamers competitivos.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard 
                            icon={Swords}
                            title="Matchmaking Justo"
                            description="Encuentra rivales de tu nivel en modos Boxfight, Zone Wars y Realistics."
                            delay={0.1}
                        />
                        <FeatureCard 
                            icon={Trophy}
                            title="Rankings Mensuales"
                            description="Sube en la leaderboard y gana premios exclusivos por ser el mejor jugador del mes."
                            delay={0.2}
                        />
                        <FeatureCard 
                            icon={Gift}
                            title="Pagos Instantáneos"
                            description="Retira tus ganancias o compra más tokens al instante con nuestro sistema seguro."
                            delay={0.3}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;