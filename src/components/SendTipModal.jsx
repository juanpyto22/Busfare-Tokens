import React, { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Coins } from 'lucide-react';
import { db } from '@/lib/db';

export default function SendTipModal({ user, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [amount, setAmount] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Autocompletar usuarios
  const handleUsernameChange = async (e) => {
    const value = e.target.value;
    setUsername(value);
    setError('');
    setSuggestions([]);
    if (value.length >= 2) {
      try {
        const users = await db.searchUsersByUsername(value);
        setSuggestions(users.filter(u => u.id !== user.id));
      } catch {
        setSuggestions([]);
      }
    }
  };

  const handleSelectSuggestion = (u) => {
    setUsername(u.username);
    setSuggestions([]);
  };

  const handleSend = async () => {
    setError('');
    if (!username || !amount) {
      setError('Completa todos los campos');
      return;
    }
    if (isNaN(amount) || Number(amount) <= 0) {
      setError('Cantidad inválida');
      return;
    }
    if (Number(amount) > user.tokens) {
      setError('No tienes suficientes tokens');
      return;
    }
    setLoading(true);
    try {
      const toUser = await db.getUserByUsername(username);
      if (!toUser) {
        setError('Usuario no encontrado');
        setLoading(false);
        return;
      }
      await db.transferTokens(user.id, toUser.id, Number(amount));
      setOpen(false);
      setUsername('');
      setAmount('');
      if (onSuccess) onSuccess();
    } catch (e) {
      setError('Error al enviar tip');
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold flex items-center gap-2">
          <Coins className="h-5 w-5" /> Enviar Tip
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-950 border-blue-500/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-yellow-400 text-2xl">
            <Coins className="h-7 w-7" /> Enviar Tip
          </DialogTitle>
          <p className="text-blue-200 text-sm">Envía tokens a otro usuario registrado</p>
        </DialogHeader>
        <div className="mb-2">
          <label className="block text-blue-300 font-bold mb-1">Nombre de Usuario</label>
          <Input
            value={username}
            onChange={handleUsernameChange}
            placeholder="Ingresa el nombre de usuario"
            autoComplete="off"
            className="mb-1"
          />
          {suggestions.length > 0 && (
            <div className="bg-slate-800 border border-blue-500/30 rounded shadow max-h-32 overflow-y-auto">
              {suggestions.map(u => (
                <div
                  key={u.id}
                  className="px-3 py-2 cursor-pointer hover:bg-blue-900/40 text-blue-200"
                  onClick={() => handleSelectSuggestion(u)}
                >
                  {u.username}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mb-2">
          <label className="block text-blue-300 font-bold mb-1">Cantidad de Tokens</label>
          <Input
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Cantidad"
            type="number"
            min="1"
            max={user.tokens}
          />
          <div className="text-xs text-blue-400 mt-1">Disponible: {user.tokens} tokens</div>
        </div>
        {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
        <div className="flex gap-2 mt-4">
          <DialogClose asChild>
            <Button variant="outline" className="flex-1">Cancelar</Button>
          </DialogClose>
          <Button className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold" onClick={handleSend} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Tip'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
