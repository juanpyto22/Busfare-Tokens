-- =============================================
-- CREAR ADMIN - Método alternativo
-- =============================================
-- IMPORTANTE: Primero debes registrar el usuario desde la web
-- Luego ejecuta esta query para convertirlo en admin
-- =============================================

-- Opción 1: Si ya te registraste, pon tu email aquí
UPDATE public.users 
SET role = 'admin',
    tokens = 99999,
    level = 99,
    reputation = 100,
    trust_score = 100,
    email_verified = true
WHERE email = 'TU_EMAIL_AQUI@gmail.com';

-- Opción 2: Ver todos los usuarios registrados para saber cuál convertir
SELECT id, email, username, role, tokens, created_at 
FROM public.users 
ORDER BY created_at DESC;
