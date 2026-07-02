"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function TorreDiControlloAdmin() {
  const [sale, setSale] = useState<any[]>([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostraAiuto, setMostraAiuto] = useState(false);

  useEffect(() => { 
    caricaSale(); 
  }, []);

  const caricaSale = async () => {
    const { data } = await supabase.from('sale').select('*');
    if (data) setSale(data);
  };

  const creaSala = async () => {
    setLoading(true);
    const { error } = await supabase.rpc('crea_nuova_sala', {
      p_nome_sala: nome,
      p_manager_email: email,
      p_manager_password: "PasswordTemporanea123!"
    });

    if (error) {
      alert("Errore nel varo: " + error.message);
    } else {
      alert("Sala varata con successo!");
      setNome(""); 
      setEmail("");
      caricaSale();
    }
    setLoading(false);
  };

  const toggleStatoSala = async (id: string, statoAttuale: boolean) => {
    await supabase.from('sale').update({ is_active: !statoAttuale }).eq('id', id);
    await supabase.from('admin_logs').insert({
      admin_email: 'donatorzz1946@gmail.com',
      azione: !statoAttuale ? 'ATTIVAZIONE_SALA' : 'SOSPENSIONE_SALA',
      sala_id: id,
      dettagli: `Stato cambiato in: ${!statoAttuale ? 'ATTIVA' : 'SOSPESA'}`
    });
    caricaSale();
  };

  const aprireAuditContabile = (sala: any) => {
    const oggi = new Date();
    const dataCreazione = new Date(sala.created_at);
    const finePeriodoGratuito = new Date(dataCreazione);
    finePeriodoGratuito.setMonth(finePeriodoGratuito.getMonth() + 1);

    const statoPagamenti = oggi > finePeriodoGratuito ? "DA FATTURARE (Periodo gratuito terminato)" : "IN PROVA GRATUITA";

    alert(`
      --- SCHEDA AMMINISTRATIVA: ${sala.nome} ---
      Manager: ${sala.manager_email}
      Data Creazione: ${dataCreazione.toLocaleDateString()}
      Fine Mese Gratuito: ${finePeriodoGratuito.toLocaleDateString()}
      Stato Pagamenti: ${statoPagamenti}
      Stato Servizio: ${sala.is_active ? "ATTIVO" : "SOSPESO"}
    `);
  };

  return (
    <div className="min-h-screen bg-[#050505] p-10 text-white font-sans">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-black text-[#00ADC6] italic uppercase tracking-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
          TORRE DI CONTROLLO AMMINISTRATIVA
        </h1>
        <button 
          onClick={() => setMostraAiuto(!mostraAiuto)}
          className="bg-[#1A1D24] hover:bg-[#2A2E39] border border-[#2A2E39] px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-colors shadow-lg"
        >
          {mostraAiuto ? "Chiudi Aiuto" : "ℹ️ Manuale Operativo"}
        </button>
      </div>

      {mostraAiuto && (
        <div className="bg-[#0B0D14] p-8 rounded-3xl border-2 border-[#00ADC6] shadow-[0_0_30px_rgba(0,173,198,0.15)] mb-10 animate-in fade-in slide-in-from-top-4 space-y-6">
          <h3 className="text-[#00ADC6] font-black uppercase text-xl tracking-widest border-b border-[#1E222B] pb-4">
            Manuale Operativo
          </h3>
          
          <div className="space-y-6 text-sm text-gray-300">
            <div>
              <h4 className="text-white font-black uppercase tracking-widest mb-2 text-base">1. Varo Nuova Sala (Onboarding Automatico)</h4>
              <p className="leading-relaxed pl-4 border-l-2 border-gray-700">
                Questa sezione permette di inizializzare un nuovo club nel sistema. Inserendo il "Nome Sala" e l'"Email Manager", il sistema crea simultaneamente l'utente (tramite Auth), genera la sala nel database e predispone l'ambiente isolato. Il processo è completamente automatizzato e invia le credenziali di accesso al nuovo manager in totale autonomia.
              </p>
            </div>

            <div>
              <h4 className="text-white font-black uppercase tracking-widest mb-2 text-base">2. Gestione Sale Attive (Kill Switch e Monitoraggio)</h4>
              <p className="leading-relaxed pl-4 border-l-2 border-gray-700 mb-2">
                La tabella offre una panoramica di tutte le sale registrate sulla piattaforma.
              </p>
              <ul className="pl-8 space-y-2 list-disc text-gray-400">
                <li><strong className="text-gray-200">Stato Sala:</strong> Tramite i tasti rapidi (SOSPENDI / ATTIVA), l'amministratore può revocare o ripristinare istantaneamente l'accesso di un manager alla propria applicazione.</li>
                <li><strong className="text-gray-200">Audit Contabile:</strong> Questa funzione permette all'amministratore di verificare lo stato dei contributi e delle scadenze amministrative della singola sala, senza entrare nel merito della loro contabilità interna.</li>
              </ul>
            </div>

            <div>
              <h4 className="text-[#FFCC00] font-black uppercase tracking-widest mb-2 text-base">3. Protocollo di Isolamento Assoluto</h4>
              <p className="leading-relaxed pl-4 border-l-2 border-[#FFCC00]/50 text-gray-300">
                Nel pieno rispetto della privacy e dell'architettura multi-tenant, questa Torre di Controllo è limitata alla gestione delle utenze. L'amministratore di sistema non ha i permessi per visualizzare, alterare o gestire i dati interni delle singole sale (es. prenotazioni soci, incassi bar, tabelloni tornei). I dati di ogni club sono inaccessibili dall'esterno.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#0B0D14] p-8 rounded-3xl border border-[#1E222B] mb-10 max-w-3xl shadow-xl">
        <h2 className="text-xl font-black mb-6 uppercase tracking-widest text-white">Varo Nuova Sala</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input placeholder="Nome Sala" className="bg-[#1A1D24] p-4 rounded-xl border border-[#2A2E39] focus:outline-none focus:border-[#00ADC6] transition-colors" onChange={e => setNome(e.target.value)} value={nome} />
          <input placeholder="Email Manager" className="bg-[#1A1D24] p-4 rounded-xl border border-[#2A2E39] focus:outline-none focus:border-[#00ADC6] transition-colors" onChange={e => setEmail(e.target.value)} value={email} />
        </div>
        <button onClick={creaSala} disabled={loading} className="w-full mt-6 bg-[#00ADC6] hover:bg-[#008A9E] p-4 rounded-xl font-black uppercase tracking-widest transition-colors shadow-lg disabled:opacity-50 text-black">
          {loading ? "Varo in corso..." : "Esegui Onboarding Automatico"}
        </button>
      </div>

      <div className="bg-[#0B0D14] rounded-3xl border border-[#1E222B] p-8 shadow-xl">
        <h2 className="text-xl font-black mb-6 uppercase tracking-widest text-white">Sale Attive</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-500 text-[10px] uppercase tracking-widest border-b border-[#2A2E39]">
                <th className="pb-4 px-2">Nome Sala</th>
                <th className="pb-4 px-2">Manager</th>
                <th className="pb-4 px-2 text-center">Stato</th>
                <th className="pb-4 px-2 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {sale.map((sala) => (
                <tr key={sala.id} className="border-b border-[#1E222B] hover:bg-[#11141A] transition-colors">
                  <td className="py-5 px-2 font-black text-white uppercase tracking-wider">{sala.nome}</td>
                  <td className="py-5 px-2 text-gray-400 text-sm font-bold">{sala.manager_email}</td>
                  <td className="py-5 px-2 text-center">
                    <span className={`px-3 py-1.5 rounded-md text-[10px] font-black tracking-widest uppercase ${sala.is_active ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30' : 'bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/30'}`}>
                      {sala.is_active ? 'ATTIVA' : 'SOSPESA'}
                    </span>
                  </td>
                  <td className="py-5 px-2 flex gap-4 justify-end items-center">
                    <button onClick={() => toggleStatoSala(sala.id, sala.is_active)} className="text-[10px] font-black uppercase tracking-widest text-[#00ADC6] hover:text-white transition-colors">
                      {sala.is_active ? 'Sospendi' : 'Attiva'}
                    </button>
                    <button onClick={() => aprireAuditContabile(sala)} className="text-[10px] font-black uppercase tracking-widest text-[#FFCC00] hover:text-white transition-colors">
                      Audit Contabile
                    </button>
                  </td>
                </tr>
              ))}
              {sale.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-gray-500 font-bold text-sm uppercase tracking-widest">
                    Nessuna sala attiva
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}