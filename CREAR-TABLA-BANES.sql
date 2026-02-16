-- =============================================
-- CREAR SISTEMA DE BANES
-- =============================================

-- Crear tabla de banes si no existe
CREATE TABLE IF NOT EXISTS public.user_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  ban_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ban_end TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_user_bans_user_id ON public.user_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bans_is_active ON public.user_bans(is_active);

-- Agregar visible RLS si es necesario
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

SELECT '✅ Tabla user_bans creada correctamente' as status;
