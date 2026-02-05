import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validar que las variables estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ SUPABASE NO CONFIGURADO: Faltan variables de entorno')
  console.error('Asegúrate de tener en tu archivo .env:')
  console.error('VITE_SUPABASE_URL=https://tu-proyecto.supabase.co')
  console.error('VITE_SUPABASE_ANON_KEY=tu-anon-key')
}

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper para verificar si hay sesión activa
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error obteniendo sesión:', error)
    return null
  }
  return session
}

// Helper para sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error cerrando sesión:', error)
    throw error
  }
}
