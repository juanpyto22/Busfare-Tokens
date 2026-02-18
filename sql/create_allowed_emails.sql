-- SQL: create_allowed_emails.sql
-- Run this in your Supabase SQL editor to create the table used to whitelist allowed registration emails

-- Ensure uuid extension is available (uses uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS allowed_emails (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Example insert (uncomment to run)
-- INSERT INTO allowed_emails (email) VALUES ('juan@example.com'), ('maria@example.com');
