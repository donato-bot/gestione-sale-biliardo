// ==========================================
// FILE: src/app/dashboard/[sala]/soci/page.tsx
// OBIETTIVO: Gestione Anagrafica Soci e Tesseramenti con Funzione di Eliminazione e Invio Link
// ==========================================
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

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

export default function SociPage() {
  const router = useRouter();
  const urlParams = useParams();
  const salaId = (urlParams?.sala || Object.values(urlParams)[0]) as string;

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
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("soci")
        .select("*")
        .eq("sala_id", salaId)
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
  }, [salaId]);

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
    if (!email.trim()) {
      alert("L'Email è obbligatoria per far accedere il socio all'App.");
      return;
    }

    setSalvataggio(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userEmail = sessionData.session?.user?.email;

      const datiSocio = {
        sala_id: salaId,
        manager_email: userEmail,
        nome: nome.trim().toUpperCase(),
        cognome: cognome.trim().toUpperCase(),
        nome_completo: `${nome.trim().toUpperCase()} ${cognome.trim().toUpperCase()}`,
        telefono,
        email: email.trim().toLowerCase(),
        codice_fiscale: codiceFiscale.toUpperCase(),
        scadenza_tessera: scadenzaTessera || null,
        // Inseriamo app_inviata solo se è un nuovo socio, altrimenti non lo tocchiamo
        ...(socioInModificaId ? {} : { app_inviata: false })
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

  // Funzione per eliminare un socio
  const eliminaSocio = async (id: string, nomeSocio: string, cognomeSocio: string) => {
    if (!confirm(`Sei assolutamente sicuro di voler eliminare definitivamente il socio ${cognomeSocio} ${nomeSocio}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("soci")
        .delete()
        .eq("id", id);

      if (error) {
        alert("ERRORE DATABASE (Eliminazione Socio): " + error.message);
        throw error;
      }
      
      // Aggiorna lo stato locale senza ricaricare tutto dal database
      setSoci(soci.filter(s => s.id !== id));
      
    } catch (err: any) {
      console.error("Errore eliminazione socio:", err.message);
    }
  };

  // Funzione Magica: Invia il link App via WhatsApp o copia negli appunti
  const inviaLinkApp = async (socio: Socio) => {
    if (!socio.email) {
      alert("Attenzione: Inserisci un'email per questo socio prima di inviargli l'accesso all'App.");
      return;
    }

    const appLink = `https://gestione-sale-biliardo.vercel.app/dashboard/${salaId}/socio`;
    const messaggio = `Ciao ${socio.nome}, benvenuto al Biliardo Royal! 🎱\n\nEcco il link per accedere alla tua plancia personale, prenotare i tavoli e controllare il tuo credito:\n${appLink}\n\nPer entrare utilizza la tua email: ${socio.email}`;

    // Segnamo nel database che gli abbiamo inviato l'app
    if (!socio.app_inviata) {
      await supabase.from("soci").update({ app_inviata: true }).eq("id", socio.id);
      setSoci(soci.map(s => s.id === socio.id ? { ...s, app_inviata: true } : s));
    }

    if (socio.telefono) {
      // Puliamo il numero da spazi e zeri iniziali per formattazione internazionale
      const numeroPulito = socio.telefono.replace(/\s+/g, '').replace(/^00/, '+');
      window.open(`https://wa.me/${numeroPulito}?text=${encodeURIComponent(messaggio)}`, '_blank');
    } else {
      navigator.clipboard.writeText(messaggio);
      alert(`Nessun numero di telefono salvato per questo socio.\n\nIl messaggio di benvenuto e il link magico sono stati copiati nei tuoi appunti, pronti per essere incollati in una Mail o Telegram!`);
    }
  };

  const isScaduta = (dataScadenza: string) => {
    if (!dataScadenza) return true;
    const oggi = new Date();
    const scadenza = new Date(dataScadenza);
    return scadenza < oggi;
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-white p-4 sm:p-8 font-sans print:bg-white print:text-black">
      <div className="w-full max-w-[1600px] mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex justify-between items-end border-b border-gray-800 pb-4 print:border-gray-300">
          <div>
            <button 
              onClick={() => router.push(`/dashboard/${salaId}`)}
              className="text-gray-500 hover:text-cyan-400 text-[10px] font-black uppercase tracking-widest transition-colors mb-2 flex items-center gap-2 print:hidden"
            >
              ← Torna alla Plancia
            </button>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white italic print:text-black">
              ANAGRAFICA SOCI
            </h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 print:text-gray-600">
              Gestione Tesseramenti e Clienti
            </p>
          </div>
          
          <div className="flex gap-4 print:hidden">
            <button 
              onClick={() => window.print()}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 text-gray-300 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
            >
              📄 Stampa PDF
            </button>
            <button 
              onClick={apriNuovoSocio}
              className="bg-cyan-600 hover:bg-cyan-500 text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-cyan-900/50"
            >
              + Aggiungi Nuovo Socio
            </button>
          </div>
        </header>

        {/* TABELLA SOCI (Stile Premium) */}
        <div className="bg-[#111827] border border-gray-700/70 border-t-4 border-t-cyan-500 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 print:border-gray-300 print:shadow-none print:bg-white print:border-t-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0b0e14]/50 border-b border-gray-700/50 text-[10px] text-gray-400 font-black uppercase tracking-widest print:bg-gray-100 print:border-gray-300 print:text-gray-800">
                  <th className="p-5 w-[25%]">Socio</th>
                  <th className="p-5 w-[20%]">Contatti</th>
                  <th className="p-5 w-[20%]">Codice Fiscale</th>
                  <th className="p-5 w-[15%]">Scadenza Tessera</th>
                  <th className="p-5 w-[20%] text-right print:hidden">Stato / Azioni</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold text-white divide-y divide-gray-700/50 print:text-black print:divide-gray-300">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-cyan-500 font-black uppercase tracking-widest text-[10px] animate-pulse">Caricamento in corso...</td></tr>
                ) : soci.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500 font-black uppercase tracking-widest text-[10px]">Nessun socio registrato.</td></tr>
                ) : (
                  soci.map((socio) => {
                    const scaduta = isScaduta(socio.scadenza_tessera);
                    return (
                      <tr key={socio.id} className="hover:bg-[#1e293b]/50 transition-colors group print:hover:bg-transparent">
                        <td className="p-5">
                          <p className="text-base font-black uppercase text-gray-200 print:text-black">{socio.cognome} {socio.nome}</p>
                        </td>
                        <td className="p-5">
                          <p className="text-[11px] text-gray-400 font-bold print:text-gray-700">{socio.telefono || "—"}</p>
                          <p className="text-[11px] text-gray-500">{socio.email || "—"}</p>
                        </td>
                        <td className="p-5 text-[11px] text-cyan-400 font-mono uppercase print:text-gray-700">{socio.codice_fiscale || "—"}</td>
                        <td className="p-5 text-xs font-bold text-gray-300 print:text-black">
                          {socio.scadenza_tessera ? new Date(socio.scadenza_tessera).toLocaleDateString("it-IT") : "Non impostata"}
                        </td>
                        <td className="p-5 text-right flex flex-col items-end justify-center gap-2 print:hidden">
                          <span className={`text-[9px] px-3 py-1 rounded border font-black uppercase tracking-widest inline-block ${scaduta ? "bg-red-900/40 text-red-400 border-red-700/50" : "bg-emerald-900/40 text-emerald-400 border-emerald-700/50"}`}>
                            {scaduta ? "🔴 Scaduta" : "🟢 Attiva"}
                          </span>
                          
                          {/* Pulsanti Azione */}
                          <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                            <button 
                              onClick={() => inviaLinkApp(socio)} 
                              title="Invia o copia il link di accesso"
                              className={`text-[10px] uppercase font-black tracking-widest transition-colors flex items-center gap-1 ${socio.app_inviata ? 'text-emerald-500 hover:text-emerald-400' : 'text-indigo-400 hover:text-indigo-300'}`}
                            >
                              {socio.app_inviata ? "📱 Ri-invia App" : "📨 Invia App"}
                            </button>
                            <button 
                              onClick={() => apriModificaSocio(socio)} 
                              className="text-[10px] text-cyan-500 hover:text-cyan-300 uppercase font-black tracking-widest transition-colors"
                            >
                              ✏️ Modifica
                            </button>
                            <button 
                              onClick={() => eliminaSocio(socio.id, socio.nome, socio.cognome)} 
                              className="text-[10px] text-red-500 hover:text-red-400 uppercase font-black tracking-widest transition-colors"
                            >
                              ❌ Elimina
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-[#0b0e14] border-t border-gray-700/70 p-5 flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-gray-500 print:bg-white print:border-gray-300 print:text-gray-700">
            <span>Totale Tesserati: {soci.length}</span>
            <span className="text-emerald-500 print:text-gray-900">Attivi: {soci.filter(s => !isScaduta(s.scadenza_tessera)).length}</span>
          </div>
        </div>
      </div>

      {/* FORM MODALE (Stile Premium) */}
      {mostraForm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:hidden">
          <div className="bg-[#111827] border border-gray-700/70 border-t-4 border-t-emerald-500 rounded-2xl w-full max-w-2xl shadow-2xl shadow-black relative">
            <button onClick={() => setMostraForm(false)} className="absolute top-6 right-6 text-gray-500 hover:text-red-500 font-black text-xl z-10 transition-colors">✖</button>
            <div className="p-8">
               <h2 className="text-xl font-black italic text-emerald-400 uppercase mb-8">{socioInModificaId ? "Modifica Dati Socio" : "Registrazione Nuovo Socio"}</h2>
               <form onSubmit={salvaSocio} className="space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                     <div>
                       <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Nome *</label>
                       <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="w-full bg-[#1e293b] border-2 border-gray-700 p-3 rounded-xl text-white font-bold text-sm uppercase focus:outline-none focus:border-emerald-500 transition-colors" />
                     </div>
                     <div>
                       <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Cognome *</label>
                       <input type="text" required value={cognome} onChange={(e) => setCognome(e.target.value)} className="w-full bg-[#1e293b] border-2 border-gray-700 p-3 rounded-xl text-white font-bold text-sm uppercase focus:outline-none focus:border-emerald-500 transition-colors" />
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                     <div>
                       <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Telefono</label>
                       <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full bg-[#1e293b] border-2 border-gray-700 p-3 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-emerald-500 transition-colors" />
                     </div>
                     <div>
                       <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Email *</label>
                       <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#1e293b] border-2 border-gray-700 p-3 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-emerald-500 transition-colors" />
                     </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Codice Fiscale</label>
                    <input type="text" value={codiceFiscale} onChange={(e) => setCodiceFiscale(e.target.value)} className="w-full bg-[#1e293b] border-2 border-gray-700 p-3 rounded-xl text-white font-bold text-sm uppercase focus:outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Scadenza Tessera</label>
                    <input type="date" value={scadenzaTessera} onChange={(e) => setScadenzaTessera(e.target.value)} className="w-full bg-[#1e293b] border-2 border-gray-700 p-3 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                  <button type="submit" disabled={salvataggio} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 text-black font-black uppercase tracking-widest py-4 rounded-xl text-xs transition-all mt-8 shadow-lg">
                    {salvataggio ? "SALVATAGGIO IN CORSO..." : (socioInModificaId ? "AGGIORNA DATI SOCIO" : "SALVA SCHEDA SOCIO")}
                  </button>
               </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}