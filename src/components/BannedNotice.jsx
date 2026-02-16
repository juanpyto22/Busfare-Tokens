import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { AlertTriangle } from 'lucide-react';

const BannedNotice = ({ userId }) => {
  const [ban, setBan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBan = async () => {
      try {
        const banData = await db.checkUserBan(userId);
        setBan(banData);
      } catch (error) {
        console.error('Error al verificar ban:', error);
      } finally {
        setLoading(false);
      }
    };

    checkBan();
    // Verificar cada 30 segundos si el ban sigue activo
    const interval = setInterval(checkBan, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  if (loading || !ban) return null;

  const banEndDate = new Date(ban.ban_end);
  const now = new Date();
  const daysRemaining = Math.ceil((banEndDate - now) / (1000 * 60 * 60 * 24));

  return (
    <div className="w-full bg-red-950 border-2 border-red-600 rounded-lg p-6 mb-6 shadow-lg">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <div className="flex-grow">
          <h2 className="text-xl font-bold text-red-200 mb-2">TU CUENTA HA SIDO BANEADA</h2>
          <div className="text-red-100 space-y-2">
            <p className="text-sm">
              <span className="font-semibold">Razón:</span> {ban.reason}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Fecha de ban:</span> {new Date(ban.ban_start).toLocaleDateString('es-ES')}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Se levanta el ban:</span> {banEndDate.toLocaleDateString('es-ES')} ({daysRemaining} días restantes)
            </p>
          </div>
          <p className="text-red-200 mt-4 text-sm italic">
            Durante este tiempo no podrás acceder a tu cuenta ni participar en actividades de la plataforma.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BannedNotice;
