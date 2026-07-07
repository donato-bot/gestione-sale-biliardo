"use client";

// ==========================================
// FILE: src/app/dashboard/[sala]/soci/page.tsx
// OBIETTIVO: Anagrafica Soci - Allineato con le colonne nome e cognome obbligatorie
// ==========================================

import { useState, useEffect } from 'react';
import { supabase } from "@/app/lib/supabase";
import { useParams, useRouter } from 'next/navigation';

interface Socio {
  id: string;
  sala_id: string;
  nome: string;
  cognome: string;
  telefono: string | null;
  email: string | null;
  app_inviata: boolean | null;
}

export default function AnagraficaSoci() {
  const [soci, setSoci] = useState<Socio[]>([]);
  const [inCaricamento, setInCaricamento] = useState(true);

  // Stati per il modulo di inserimento separati per Nome e Cognome
  const [nuovoNome, setNuovoNome] = useState("");
  const [nuovoCognome, setNuovoCognome] = useState("");
  const [nuovoTelefono, setNuovoTelefono] = useState("");
  const [nuovaEmail, setNuovaEmail] = useState("");
  const [inInvia, setInInvia] = useState(false);

  const params = useParams();
  const router = useRouter();
  const salaId = params.sala as string;

  useEffect(() => {
    caricaSoci();
  }, [salaId]);

  // Funzione di LETTURA dei soci
  const caricaSoci = async () => {
    try {
      const { data, error } = await supabase
        .from('soci')
        .select('*')
        .eq('sala_id', salaId)
        .order('cognome', { ascending: true }); // Ordiniamo per cognome

      if (error) throw error;
      if (data) setSoci(data);
    } catch (error) {
      console.error('Errore nel caricamento dei soci:', error);
    } finally {
      setInCaricamento(false);
    }
  };

  // Funzione di SCRITTURA per aggiungere un nuovo socio
  const aggiungiSocio = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Controllo rigoroso sui campi obbligatori di Supabase
    if (nuovoNome.trim() === "" || nuovoCognome.trim() === "") {
      alert("Attenzione: Nome e Cognome sono campi obbligatori.");
      return;
    }

    setInInvia(true);

    try {
      const { data, error } = await supabase
        .from('soci')
        .insert([{
          sala_id: salaId,
          nome: nuovoNome.trim(),
          cognome: nuovoCognome.trim(),
          telefono: nuovoTelefono.trim() === "" ? null : nuovoTelefono.trim(),
          email: nuovaEmail.trim() === "" ? null : nuovaEmail.trim(),
          app_inviata: false
        }])
        .select();

      if (error) {
        console.error('Dettaglio Errore Supabase:', error);
        throw error;
      }

      if (data) {
        // Aggiungiamo alla lista e riordiniamo
        const nuovaLista = [...soci, data[0]].sort((a, b) => a.cognome.localeCompare(b.cognome));
        setSoci(nuovaLista);
        
        // Reset dei campi
        setNuovoNome("");
        setNuovoCognome("");
        setNuovoTelefono("");
        setNuovaEmail("");
        alert("Socio registrato con successo!");
      }
    } catch (error) {
      alert('Errore di connessione: impossibile salvare il socio. Controlla la console per i dettagli.');
    } finally {
      setInInvia(false);
    }
  };

  if (inCaricamento) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <p className="text-xl font-bold text-emerald-500 animate-pulse">Caricamento Anagrafica...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] p-6 relative">
      <header className="mb-8 border-b border-gray-800 pb-4 flex justify-between items-end">
        <div>
          <button 
            onClick={() => router.push(`/dashboard/${salaId}`)}
            className="text-gray-500 hover:text-white uppercase text-xs font-bold mb-4 flex items-center gap-2 transition-colors"
          >
            ← Torna alla Plancia Operativa
          </button>
          <h1 className="text-3xl font-black text-white uppercase tracking-widest flex items-center gap-3">
            <span className="text-emerald-500">👥</span> Anagrafica Soci
          </h1>
          <p className="text-gray-400 font-bold mt-2">Registro e Tesseramento Membri</p>
        </div>
        
        <div className="text-right bg-gray-900/50 p-4 rounded-xl border border-gray-800">
          <p className="text-gray-500 text-xs font-bold uppercase mb-1">Totale Iscritti</p>
          <p className="text-3xl font-black text-emerald-500">{soci.length}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl">
        {/* COLONNA INSERIMENTO NUOVO SOCIO */}
        <div className="bg-[#11131a] p-6 rounded-3xl border border-gray-800 h-fit shadow-xl">
          <h2 className="text-xl font-black text-white uppercase mb-4 pb-2 border-b border-gray-800">
            Nuova Tessera
          </h2>
          <form onSubmit={aggiungiSocio} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Nome *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Es. Mario"
                  value={nuovoNome}
                  onChange={(e) => setNuovoNome(e.target.value)}
                  className="w-full bg-black text-white font-bold p-3 rounded-lg border border-gray-700 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Cognome *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Es. Rossi"
                  value={nuovoCognome}
                  onChange={(e) => setNuovoCognome(e.target.value)}
                  className="w-full bg-black text-white font-bold p-3 rounded-lg border border-gray-700 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Telefono</label>
              <input 
                type="text" 
                placeholder="Es. 3331234567"
                value={nuovoTelefono}
                onChange={(e) => setNuovoTelefono(e.target.value)}
                className="w-full bg-black text-white font-bold p-3 rounded-lg border border-gray-700 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Email</label>
              <input 
                type="email" 
                placeholder="Es. mario@email.com"
                value={nuovaEmail}
                onChange={(e) => setNuovaEmail(e.target.value)}
                className="w-full bg-black text-white font-bold p-3 rounded-lg border border-gray-700 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <button 
              type="submit"
              disabled={inInvia}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 text-white font-black py-4 rounded-xl uppercase tracking-wider transition-all shadow-lg mt-2"
            >
              {inInvia ? "Salvataggio..." : "🪪 Rilascia Tessera"}
            </button>
          </form>
        </div>

        {/* COLONNA ELENCO SOCI ISCRITTI */}
        <div className="lg:col-span-2 bg-[#11131a] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
          {soci.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 font-bold text-lg uppercase tracking-widest">Nessun socio registrato</p>
              <p className="text-gray-600 mt-2">Compila il modulo a sinistra per inserire il primo iscritto.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-800">
                  <th className="p-4 text-gray-500 text-xs font-black uppercase tracking-wider">Cognome e Nome</th>
                  <th className="p-4 text-gray-500 text-xs font-black uppercase tracking-wider">Telefono</th>
                  <th className="p-4 text-gray-500 text-xs font-black uppercase tracking-wider">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {soci.map((socio) => (
                  <tr key={socio.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-white font-bold uppercase tracking-wide">
                      {socio.cognome} {socio.nome}
                    </td>
                    <td className="p-4 text-gray-400 font-mono text-sm">{socio.telefono || "-"}</td>
                    <td className="p-4 text-gray-400 text-sm">{socio.email || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}