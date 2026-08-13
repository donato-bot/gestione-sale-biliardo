-- ==========================================
-- SCRIPT: db_scripts/seed_soci.sql
-- OBIETTIVO: Popolamento sicuro e idempotente dei soci di test
-- ==========================================

-- 1. Assicuriamoci che la tabella esista e sia corretta
CREATE TABLE IF NOT EXISTS soci (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_email TEXT NOT NULL,
  nome_completo TEXT NOT NULL,
  telefono TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Eliminiamo SOLO i dati di test precedenti (riconoscibili dal prefisso del telefono '333%')
-- In questo modo non rischiamo di cancellare soci reali inseriti manualmente
DELETE FROM soci WHERE telefono LIKE '333%'; 

-- 3. Inserimento massivo dei 16 giocatori di test associati alla master email
INSERT INTO soci (manager_email, nome_completo, telefono) VALUES
('donatorzz1946@gmail.com', 'ALDO BIANCHI', '3331111111'),
('donatorzz1946@gmail.com', 'BEATRICE NERI', '3332222222'),
('donatorzz1946@gmail.com', 'CARLO VERDI', '3333333333'),
('donatorzz1946@gmail.com', 'DIANA GIALLI', '3334444444'),
('donatorzz1946@gmail.com', 'ENRICO BLU', '3335555555'),
('donatorzz1946@gmail.com', 'FEDERICA ROSA', '3336666666'),
('donatorzz1946@gmail.com', 'GIACOMO MARRONE', '3337777777'),
('donatorzz1946@gmail.com', 'ILARIA VIOLA', '3338888888'),
('donatorzz1946@gmail.com', 'LORENZO GRIGI', '3339999999'),
('donatorzz1946@gmail.com', 'MARTINA AZZURRA', '3330000000'),
('donatorzz1946@gmail.com', 'NICOLA ARANCIO', '3331234567'),
('donatorzz1946@gmail.com', 'OLIVIA LILLA', '3337654321'),
('donatorzz1946@gmail.com', 'PAOLO ROSSI', '3339876543'),
('donatorzz1946@gmail.com', 'QUINTINO BIANCHI', '3334567890'),
('donatorzz1946@gmail.com', 'ROBERTA NERI', '3336549870'),
('donatorzz1946@gmail.com', 'STEFANO VERDI', '3331472583');