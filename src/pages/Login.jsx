import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/db';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet';

const Login = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const user = await db.login(formData.email, formData.password);
            
            toast({ 
                title: "¡Bienvenido de nuevo!", 
                description: `Has iniciado sesión como ${user.username}`,
                className: "bg-green-600 text-white border-none"
            });
            navigate('/');
        } catch (err) {
            console.error('Error de login:', err);
            toast({ 
                title: "Error al iniciar sesión", 
                description: err.message || "Credenciales incorrectas. Verifica tu email y contraseña.", 
                variant: "destructive" 
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050911] via-[#0a1628] to-[#050911] flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            
            <Helmet>
                <title>Iniciar Sesión | BusFare-tokens</title>
            </Helmet>
            <Card className="w-full max-w-md relative z-10">
                <CardHeader>
                    <CardTitle className="text-3xl text-center font-black text-glow">Bienvenido</CardTitle>
                    <CardDescription className="text-center text-blue-200/80 text-base">
                        Ingresa a tu cuenta para gestionar tus tokens
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-blue-200 font-semibold">Correo Electrónico</Label>
                            <Input 
                                id="email" 
                                type="email" 
                                placeholder="tu@email.com" 
                                required 
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-blue-200 font-semibold">Contraseña</Label>
                            <Input 
                                id="password" 
                                type="password" 
                                required 
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                        
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button type="submit" className="w-full" disabled={isLoading} variant="neonBlue">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Iniciar Sesión"}
                        </Button>
                        <p>
  <a href="/forgot-password">¿Olvidaste tu contraseña?</a>
</p>
                        <div className="text-sm text-center text-blue-200/70">
                            ¿No tienes cuenta? <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-bold">Regístrate gratis</Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
        
    );
};

export default Login;