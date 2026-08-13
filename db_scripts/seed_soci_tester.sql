
1. La procedura SQL "Idempotente" (La Fondamenta)
Invece di lanciare pezzi di codice a caso, useremo uno script che fa tutto da solo: controlla se la tabella esiste, la crea se manca, pulisce i vecchi dati di test e inserisce i nuovi.

Crea un file di testo sul tuo PC chiamato seed_soci_tester.sql e tienilo lì. Questo è il tuo "pulsante di emergenza" per pulire e popolare la tabella soci:

SQL (inizio)

-- PROCEDURA DI SEEDING SICURA (Eseguibile ogni volta)
--Questo è il tuo "pulsante di emergenza" per pulire e popolare la tabella soci:

-- 1. Assicuriamoci che la tabella sia corretta
CREATE TABLE IF NOT EXISTS soci (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_email TEXT NOT NULL,
  nome_completo TEXT NOT NULL,
  telefono TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Eliminiamo SOLO i dati di test precedenti (riconoscibili dal prefisso del telefono o email)
-- Questo evita di cancellare soci reali che avevi inserito manualmente
DELETE FROM soci WHERE telefono LIKE '333%'; 

-- 3. Inserimento massivo protetto
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

fine SQL

-- L'Evoluzione del Frontend (Logica "Smart")
--Dobbiamo rendere il bottone "🧪 TESTER" più intelligente. 
--Invece di far generare i dati "a casaccio" alla funzione, facciamo in modo 
--che verifichi lo stato della tabella prima di muovere un dito.
--Modifica la funzione generaGiocatoriTest dentro il tuo src/components/TorneiManager.tsx 
--in questo modo:

--TypeScript

const generaGiocatoriTest = async () => {
    // Prima verifichiamo se esistono già dei "tester"
    const { data: esistenti } = await supabase
      .from('soci')
      .select('id')
      .eq('manager_email', managerEmail)
      .like('telefono', '333%'); // I nostri tester iniziano tutti per 333

    if (esistenti && esistenti.length > 0) {
      if (!confirm("Hai già dei giocatori di test inseriti. Vuoi cancellarli e rigenerarli da capo?")) {
        return;
      }
      // Cancelliamo i vecchi tester prima di rigenerare
      await supabase.from('soci').delete().eq('manager_email', managerEmail).like('telefono', '333%');
    }

    // ... (qui prosegui con la logica di inserimento che avevi)
    alert("✓ Database Tester pronto!");
    fetchSoci();
};