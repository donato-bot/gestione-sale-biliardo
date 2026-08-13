// ==========================================
// FILE: src/components/SociManager.tsx
// OBIETTIVO: Modulo Anagrafica Soci Completo e Centralizzato
// ==========================================
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../app/lib/supabase";

interface Socio {
  id: string;
  nome: string;
  cognome: string;
  telefono: string;
  email: string;
  codice_fiscale: string;
  scadenza_tessera: string;
  app_inviata: boolean;
}

export default function SociManager({ managerEmail }: { managerEmail: string }) {
  const [soci, setSoci] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);

  const [mostraForm, setMostraForm] = useState(false);
  const [salvataggio, setSalvataggio] = useState(false);
  
  const [socioInModificaId, setSocioInModificaId] = useState<string | null>(null);
  
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [codiceFiscale, setCodiceFiscale] = useState("");
  const [scadenzaTessera, setScadenzaTessera] = useState("");

  const caricaSoci = useCallback(async () => {
    if (!managerEmail) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("soci")
        .select("*")
        .eq("manager_email", managerEmail)
        .order("cognome", { ascending: true });

      if (error) {
        alert("ERRORE DATABASE (Lettura Soci): " + error.message);
        throw error;
      }
      setSoci(data || []);
    } catch (err: any) {
      console.error("Errore caricamento soci:", err.message);
    } finally {
      setLoading(false);
    }
  }, [managerEmail]);

  useEffect(() => {
    caricaSoci();
  }, [caricaSoci]);

  const apriNuovoSocio = () => {
    setSocioInModificaId(null);
    setNome(""); setCognome(""); setTelefono(""); setEmail(""); setCodiceFiscale(""); setScadenzaTessera("");
    setMostraForm(true);
  };

  const apriModificaSocio = (socio: Socio) => {
    setSocioInModificaId(socio.id);
    setNome(socio.nome);
    setCognome(socio.cognome);
    setTelefono(socio.telefono || "");
    setEmail(socio.email || "");
    setCodiceFiscale(socio.codice_fiscale || "");
    setScadenzaTessera(socio.scadenza_tessera || "");
    setMostraForm(true);
  };

  const salvaSocio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !cognome.trim()) {
      alert("Nome e Cognome sono obbligatori.");
      return;
    }

    setSalvataggio(true);
    try {
      // Costruiamo il nome_completo per compatibilità con altre tabelle (es. Tornei)
      const nomeCompleto = `${nome.trim()} ${cognome.trim()}`.toUpperCase();

      const datiSocio = {
        manager_email: managerEmail,
        nome: nome.toUpperCase(),
        cognome: cognome.toUpperCase(),
        nome_completo: nomeCompleto,
        telefono,
        email: email.trim().toLowerCase(),
        codice_fiscale: codiceFiscale.toUpperCase(),
        scadenza_tessera: scadenzaTessera || null,
        app_inviata: false
      };

      if (socioInModificaId) {
        const { error } = await supabase.from("soci").update(datiSocio).eq("id", socioInModificaId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("soci").insert([datiSocio]);
        if (error) throw error;
      }

      setSocioInModificaId(null);
      setNome(""); setCognome(""); setTelefono(""); setEmail(""); setCodiceFiscale(""); setScadenzaTessera("");
      setMostraForm(false);
      await caricaSoci();
    } catch (err: any) {
      alert("ERRORE DATABASE (Salvataggio Socio): " + err.message);
    } finally {
      setSalvataggio(false);
    }
  };

  const eliminaSocio = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare definitivamente questo socio?")) return;
    
    try {
      const { error } = await supabase
        .from('soci')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await caricaSoci();
    } catch (err: any) {
      alert("Errore eliminazione: " + err.message);
    }
  };

  const isScaduta = (dataScadenza: string) => {
    if (!dataScadenza) return true;
    const oggi = new Date();
    const scadenza = new Date(dataScadenza);
    return scadenza < oggi;
  };

  return (
    <div className="space-y-6 text-white font-sans print:text-black">
      
      <header className="flex justify-between items-end border-b border-gray-800 pb-4 print:border-gray-300">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white italic print:text-black">
            👥 GESTIONE SOCI
          </h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 print:text-gray-600">
            Anagrafica e Tesseramenti
          </p>
        </div>
        
        <div className="flex gap-4 print:hidden">
          <button 
            onClick={() => window.print()}
            className="bg-[#11131a] border border-gray-700 hover:border-white text-gray-300 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
          >
            📄 Stampa Elenco
          </button>
          <button 
            onClick={apriNuovoSocio}
            className="bg-cyan-600 hover:bg-cyan-500 text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            + Aggiungi Nuovo Socio
          </button>
        </div>
      </header>

      <div className="bg-[#11131a] border border-gray-800/80 rounded-xl overflow-hidden shadow-2xl print:border-gray-300 print:shadow-none print:bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/50 border-b border-gray-800 text-[9px] text-gray-500 font-black uppercase tracking-widest print:bg-gray-100 print:border-gray-300 print:text-gray-800">
              <th className="p-4 w-[25%]">Socio</th>
              <th className="p-4 w-[20%]">Contatti</th>
              <th className="p-4 w-[20%]">Codice Fiscale</th>
              <th className="p-4 w-[15%]">Scadenza</th>
              <th className="p-4 w-[20%] text-right print:hidden">Stato / Azioni</th>
            </tr>
          </thead>
          <tbody className="text-sm font-bold text-white divide-y divide-gray-800/40 print:text-black print:divide-gray-300">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-cyan-500 font-black uppercase tracking-widest text-[10px] animate-pulse">Caricamento in corso...</td></tr>
            ) : soci.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-600 font-black uppercase tracking-widest text-[10px]">Nessun socio registrato.</td></tr>
            ) : (
              soci.map((socio) => {
                const scaduta = isScaduta(socio.scadenza_tessera);
                return (
                  <tr key={socio.id} className="hover:bg-gray-800/30 transition-colors group print:hover:bg-transparent">
                    <td className="p-4"><p className="text-base font-black uppercase text-gray-200 print:text-black">{socio.cognome} {socio.nome}</p></td>
                    <td className="p-4"><p className="text-[10px] text-gray-400 font-bold print:text-gray-700">{socio.telefono || "—"}</p><p className="text-[10px] text-gray-500">{socio.email || "—"}</p></td>
                    <td className="p-4 text-[10px] text-gray-400 font-mono uppercase print:text-gray-700">{socio.codice_fiscale || "—"}</td>
                    <td className="p-4 text-xs font-bold text-gray-300 print:text-black">{socio.scadenza_tessera ? new Date(socio.scadenza_tessera).toLocaleDateString("it-IT") : "Non impostata"}</td>
                    <td className="p-4 text-right flex flex-col items-end justify-center gap-2 print:hidden">
                      <div className="flex items-center gap-2 justify-end w-full">
                        <span className={`text-[8px] px-2.5 py-1 rounded border font-black uppercase tracking-widest ${scaduta ? "bg-red-950/30 text-red-500 border-red-500/20" : "bg-emerald-950/30 text-emerald-500 border-emerald-500/20"}`}>
                          {scaduta ? "🔴 Scaduta" : "🟢 Attiva"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                        <button onClick={() => apriModificaSocio(socio)} className="text-[9px] text-cyan-600 hover:text-cyan-400 uppercase font-black tracking-widest transition-colors">✏️ Modifica</button>
                        <button onClick={() => eliminaSocio(socio.id)} className="text-[9px] text-red-600 hover:text-red-400 uppercase font-black tracking-widest transition-colors">🗑️ Elimina</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="bg-black/80 border-t border-gray-800 p-4 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500 print:bg-white print:border-gray-300 print:text-gray-700">
          <span>Totale Tesserati: {soci.length}</span>
          <span className="text-emerald-400 print:text-gray-900">Attivi: {soci.filter(s => !isScaduta(s.scadenza_tessera)).length}</span>
        </div>
      </div>

      {mostraForm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:hidden">
          <div className="bg-[#0a0b0f] border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl relative">
            <button onClick={() => setMostraForm(false)} className="absolute top-6 right-6 text-gray-500 hover:text-red-500 font-black text-xl z-10">✖</button>
            <div className="p-8">
               <h2 className="text-xl font-black italic text-cyan-400 uppercase mb-6">{socioInModificaId ? "Modifica Dati Socio" : "Registrazione Nuovo Socio"}</h2>
               <form onSubmit={salvaSocio} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div><label className="block text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Nome *</label><input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white font-bold text-sm uppercase focus:outline-none focus:border-cyan-500" /></div>
                     <div><label className="block text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Cognome *</label><input type="text" required value={cognome} onChange={(e) => setCognome(e.target.value)} className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white font-bold text-sm uppercase focus:outline-none focus:border-cyan-500" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div><label className="block text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Telefono</label><input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-cyan-500" /></div>
                     <div><label className="block text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-cyan-500" /></div>
                  </div>
                  <div><label className="block text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Codice Fiscale</label><input type="text" value={codiceFiscale} onChange={(e) => setCodiceFiscale(e.target.value)} className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white font-bold text-sm uppercase focus:outline-none focus:border-cyan-500" /></div>
                  <div><label className="block text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Scadenza Tessera</label><input type="date" value={scadenzaTessera} onChange={(e) => setScadenzaTessera(e.target.value)} className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-cyan-500" /></div>
                  <button type="submit" disabled={salvataggio} className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 text-black font-black uppercase tracking-widest py-4 rounded-xl text-[10px] transition-all mt-6">
                    {salvataggio ? "SALVATAGGIO..." : (socioInModificaId ? "AGGIORNA DATI SOCIO" : "SALVA SCHEDA SOCIO")}
                  </button>
               </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}