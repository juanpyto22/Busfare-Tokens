# 🚀 SISTEMA DE DEPLOYMENT AUTOMÁTICO CONFIGURADO
# =====================================================

## ✅ LO QUE YA ESTÁ LISTO:
- ✅ Repositorio GitHub: https://github.com/juanpyto22/Busfare-Tokens
- ✅ Git configurado localmente
- ✅ Scripts de automatización creados
- ✅ Tokens iniciales cambiados a 1

## 🔧 CONECTAR VERCEL CON GITHUB (SOLO UNA VEZ):
1. Ve a: https://vercel.com/dashboard
2. Clic "New Project" 
3. Selecciona "Import Git Repository"
4. Busca "juanpyto22/Busfare-Tokens"
5. Configuración automática (Vite detectado)
6. Agrega 3 variables de entorno:
   - VITE_STRIPE_PUBLIC_KEY
   - VITE_SUPABASE_URL  
   - VITE_SUPABASE_ANON_KEY
7. Deploy

## 🤖 DESPUÉS, TODOS MIS CAMBIOS SERÁN AUTOMÁTICOS:

### Cada vez que haga un cambio:
```powershell
# 1. Hago los cambios en el código
# 2. Ejecuto automáticamente:
git add .
git commit -m "Descripción del cambio"
git push origin main
# 3. Vercel detecta el push y despliega automáticamente
# 4. Nueva versión live en 30-60 segundos
```

## 🎯 BENEFICIOS:
- ✅ Todos los cambios se guardan en GitHub
- ✅ Vercel despliega automáticamente cada push
- ✅ Historial completo de todas las versiones
- ✅ Rollback instantáneo si algo falla
- ✅ No más comandos `vercel --prod` manuales

## 📋 EJECUTAR EN SUPABASE (PENDIENTE):
Ejecuta este SQL en Supabase SQL Editor para aplicar tokens = 1:

```sql
-- Cambiar tokens iniciales a 1 token solamente
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, username, tokens)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), 1);
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;
SELECT 'Tokens iniciales cambiados a 1!' as status;
```

## 🚀 RESULTADO FINAL:
Una vez conectado Vercel → GitHub:
- Hago cambio en código → Auto-subida a GitHub → Auto-deploy → Live en 60s
- URL principal siempre actualizada: https://busfaretokens.vercel.app
- Código fuente: https://github.com/juanpyto22/Busfare-Tokens