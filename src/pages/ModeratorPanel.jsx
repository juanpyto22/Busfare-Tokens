import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scale, AlertTriangle, CheckCircle, XCircle, FileText, Eye } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ModeratorPanel = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [currentUser, setCurrentUser] = useState(null);
    const [disputedMatches, setDisputedMatches] = useState([]);
    const [reports, setReports] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showMatchDialog, setShowMatchDialog] = useState(false);
    const [showReportDialog, setShowReportDialog] = useState(false);

    useEffect(() => {
        const session = db.getSession();
        if (!session) {
            navigate('/login');
            return;
        }
        if (session.role !== 'admin' && session.role !== 'moderator') {
            toast({
                title: "Acceso Denegado",
                description: "No tienes permisos de moderador",
                variant: "destructive"
            });
            navigate('/dashboard');
            return;
        }
        setCurrentUser(session);
        loadData();
    }, [navigate]);

    const loadData = () => {
        setDisputedMatches(db.getDisputedMatches());
        setReports(db.getAllReports().filter(r => !r.reviewed));
    };

    const handleResolveDispute = (matchId, winnerId) => {
        const notes = prompt('Notas de resolución (opcional):');
        const result = db.resolveDispute(matchId, winnerId, currentUser.id, notes || '');
        
        if (result.success) {
            toast({
                title: "✅ Disputa Resuelta",
                description: "El match ha sido completado y el premio distribuido",
                className: "bg-green-950 border-green-800 text-white"
            });
            setShowMatchDialog(false);
            loadData();
        } else {
            toast({
                title: "Error",
                description: result.error,
                variant: "destructive"
            });
        }
    };

    const handleReviewReport = (reportId, action) => {
        const notes = prompt('Notas de revisión (opcional):');
        const result = db.reviewReport(reportId, action, currentUser.id, notes || '');
        
        if (result.success) {
            toast({
                title: action === 'approved' ? "Reporte Aprobado" : "Reporte Rechazado",
                description: "El reporte ha sido procesado",
                className: action === 'approved' ? "bg-green-950 border-green-800 text-white" : "bg-blue-950 border-blue-800 text-white"
            });
            setShowReportDialog(false);
            loadData();
        }
    };

    if (!currentUser) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050911] via-[#0a1628] to-[#050911] pt-10 pb-20 relative">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-pink-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            
            <Helmet>
                <title>Panel de Moderación | BusFare-tokens</title>
            </Helmet>

            <div className="container mx-auto px-4 relative z-10">
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-white mb-2 text-glow flex items-center gap-3">
                        <Scale className="h-10 w-10 text-purple-400" />
                        Panel de Moderación
                    </h1>
                    <p className="text-blue-200/80">Resolución de disputas y reportes</p>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <Card className="bg-gradient-to-br from-red-950/40 to-slate-900/40 backdrop-blur-sm border-red-500/20">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-red-200/70 text-sm">Matches en Disputa</p>
                                    <p className="text-4xl font-black text-white">{disputedMatches.length}</p>
                                </div>
                                <AlertTriangle className="h-12 w-12 text-red-400 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-yellow-950/40 to-slate-900/40 backdrop-blur-sm border-yellow-500/20">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-yellow-200/70 text-sm">Reportes Pendientes</p>
                                    <p className="text-4xl font-black text-white">{reports.length}</p>
                                </div>
                                <FileText className="h-12 w-12 text-yellow-400 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Matches Disputados */}
                <Card className="bg-gradient-to-br from-red-950/40 to-slate-900/40 backdrop-blur-sm border-red-500/20 mb-8">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                            Matches en Disputa - Requieren Arbitraje
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {disputedMatches.length === 0 ? (
                            <div className="text-center py-12 text-blue-300/70">
                                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No hay disputas pendientes</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {disputedMatches.map((match) => (
                                    <div
                                        key={match.id}
                                        className="p-4 rounded-lg border bg-red-950/30 border-red-500/30 hover:scale-105 transition-all"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                                                        EN DISPUTA
                                                    </span>
                                                    <p className="text-white font-bold">
                                                        {match.type} {match.mode}
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-blue-200/60">Jugadores:</p>
                                                        {match.players.map((p, i) => (
                                                            <p key={i} className="text-white">{p.name}</p>
                                                        ))}
                                                    </div>
                                                    <div>
                                                        <p className="text-blue-200/60">Resultados reportados:</p>
                                                        {match.results && Object.entries(match.results).map(([userId, result], i) => {
                                                            const player = match.players.find(p => p.id === userId);
                                                            return (
                                                                <p key={i} className="text-yellow-300">
                                                                    {player?.name}: Ganador {result.winnerId}
                                                                </p>
                                                            );
                                                        })}
                                                    </div>
                                                    <div>
                                                        <p className="text-blue-200/60">Premio:</p>
                                                        <p className="text-green-400 font-bold">{match.prize} 🪙</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-blue-200/60">Región:</p>
                                                        <p className="text-cyan-400">{match.region}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => {
                                                        setSelectedMatch(match);
                                                        setShowMatchDialog(true);
                                                    }}
                                                    className="bg-purple-600 hover:bg-purple-700"
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Revisar y Resolver
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Reportes de Jugadores */}
                <Card className="bg-gradient-to-br from-yellow-950/40 to-slate-900/40 backdrop-blur-sm border-yellow-500/20">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <FileText className="h-5 w-5 text-yellow-400" />
                            Reportes de Jugadores Pendientes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {reports.length === 0 ? (
                            <div className="text-center py-12 text-blue-300/70">
                                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No hay reportes pendientes</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {reports.map((report) => (
                                    <div
                                        key={report.id}
                                        className="p-4 rounded-lg border bg-yellow-950/30 border-yellow-500/30 hover:scale-105 transition-all"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                                                        PENDIENTE
                                                    </span>
                                                    <p className="text-white font-bold">
                                                        Reporte #{report.id}
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-blue-200/60">Reportado por:</p>
                                                        <p className="text-white">{report.reporterName || 'Usuario'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-blue-200/60">Usuario reportado:</p>
                                                        <p className="text-red-400">{report.reportedName || 'ID: ' + report.reportedId}</p>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <p className="text-blue-200/60">Razón:</p>
                                                        <p className="text-yellow-300">{report.reason}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-blue-200/60">Fecha:</p>
                                                        <p className="text-blue-300 text-xs">
                                                            {new Date(report.timestamp).toLocaleString('es-ES')}
                                                        </p>
                                                    </div>
                                                    {report.matchId && (
                                                        <div>
                                                            <p className="text-blue-200/60">Match ID:</p>
                                                            <p className="text-cyan-400">{report.matchId}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleReviewReport(report.id, 'approved')}
                                                    className="bg-green-600 hover:bg-green-700"
                                                    size="sm"
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Aprobar
                                                </Button>
                                                <Button
                                                    onClick={() => handleReviewReport(report.id, 'rejected')}
                                                    className="bg-red-600 hover:bg-red-700"
                                                    size="sm"
                                                >
                                                    <XCircle className="h-4 w-4 mr-1" />
                                                    Rechazar
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Dialog de Match Disputado */}
            <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
                <DialogContent className="bg-slate-950 border-red-500/30 text-white max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Scale className="h-5 w-5 text-purple-400" />
                            Resolver Disputa - Match #{selectedMatch?.id}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedMatch && (
                        <div className="space-y-4">
                            <div className="p-4 bg-red-950/30 rounded-lg border border-red-500/30">
                                <p className="text-red-300 text-sm mb-2">
                                    Los jugadores reportaron ganadores diferentes. Revisa la evidencia y selecciona al ganador real.
                                </p>
                            </div>
                            
                            <div className="space-y-3">
                                <h3 className="text-white font-bold">Selecciona al Ganador:</h3>
                                {selectedMatch.players.map((player) => (
                                    <Button
                                        key={player.id}
                                        onClick={() => handleResolveDispute(selectedMatch.id, player.id)}
                                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-14"
                                    >
                                        <CheckCircle className="mr-2 h-5 w-5" />
                                        {player.name} es el Ganador
                                    </Button>
                                ))}
                            </div>

                            <div className="p-4 bg-blue-950/30 rounded-lg border border-blue-500/30">
                                <p className="text-blue-200 text-sm">
                                    <strong>Premio:</strong> {selectedMatch.prize} tokens<br />
                                    <strong>Tipo:</strong> {selectedMatch.type} {selectedMatch.mode}<br />
                                    <strong>Región:</strong> {selectedMatch.region}
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ModeratorPanel;
