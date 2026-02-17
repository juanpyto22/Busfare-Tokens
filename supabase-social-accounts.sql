-- Agregar campos de redes sociales a la tabla users
-- Ejecuta este SQL en tu proyecto de Supabase después de ejecutar supabase-schema.sql

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS epic_games_name TEXT,
ADD COLUMN IF NOT EXISTS discord_username TEXT,
ADD COLUMN IF NOT EXISTS discord_id TEXT,
ADD COLUMN IF NOT EXISTS twitter_handle TEXT,
ADD COLUMN IF NOT EXISTS twitch_username TEXT,
ADD COLUMN IF NOT EXISTS tiktok_handle TEXT;
