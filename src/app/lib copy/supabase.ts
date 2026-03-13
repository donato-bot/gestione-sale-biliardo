import { createClient } from '@supabase/supabase-js';

// Andiamo a prendere le chiavi direttamente dalla nostra cassaforte (.env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Creiamo un collegamento puro, senza usare i pacchetti problematici
export const supabase = createClient(supabaseUrl, supabaseAnonKey);