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
      --- SCHEDA AMMINISTRATIVA: ${sala.name} ---
      Manager: ${sala.manager_email}
      Data Creazione: ${dataCreazione.toLocaleDateString()}
      Fine Mese Gratuito: ${finePeriodoGratuito.toLocaleDateString()}
      Stato Pagamenti: ${statoPagamenti}
      Stato Servizio: ${sala.is_active ? "ATTIVO" : "SOSPESO"}
    `);
  };

  return (
    <div className="min-h-screen bg-[#050505] p-10 text-white">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-black text-cyan-500 italic">TORRE DI CONTROLLO AMMINISTRATIVA</h1>
        <button 
          onClick={() => setMostraAiuto(!mostraAiuto)}
          className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-sm"
        >
          {mostraAiuto ? "Chiudi Aiuto" : "ℹ️ Manuale Operativo"}
        </button>
      </div>

      {mostraAiuto && (
        <div className="bg-[#1A1D24] p-8 rounded-3xl border-2 border-cyan-500 mb-10 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-cyan-400 font-black mb-4 uppercase text-lg">Manuale del Super Admin</h3>
          <ul className="space-y-3 text-sm text-gray-300">
            <li><strong>1. Varo Nuova Sala:</strong> Crea automaticamente utente, database e log di sicurezza.</li>
            <li><strong>2. Sospensione:</strong> Usa il tasto 'Sospendi' per revocare l'accesso immediato alla sala.</li>
            <li><strong>3. Audit Contabile:</strong> Monitora la scadenza del mese gratuito e la posizione del gestore.</li>
          </ul>
        </div>
      )}

      <div className="bg-[#11131a] p-8 rounded-3xl border border-gray-800 mb-10 max-w-2xl">
        <h2 className="text-xl font-black mb-6 uppercase tracking-widest">Varo Nuova Sala</h2>
        <div className="grid grid-cols-2 gap-4">
          <input placeholder="Nome Sala" className="bg-black p-4 rounded-xl border border-gray-800" onChange={e => setNome(e.target.value)} value={nome} />
          <input placeholder="Email Manager" className="bg-black p-4 rounded-xl border border-gray-800" onChange={e => setEmail(e.target.value)} value={email} />
        </div>
        <button onClick={creaSala} disabled={loading} className="w-full mt-4 bg-cyan-600 p-4 rounded-xl font-black uppercase tracking-widest">
          {loading ? "Varo in corso..." : "Esegui Onboarding Automatico"}
        </button>
      </div>

      <div className="bg-[#11131a] rounded-3xl border border-gray-800 p-8">
        <h2 className="text-xl font-black mb-6 uppercase tracking-widest">Sale Attive</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-500 text-xs uppercase tracking-widest border-b border-gray-800">
              <th className="pb-4">Nome Sala</th>
              <th className="pb-4">Manager</th>
              <th className="pb-4">Stato</th>
              <th className="pb-4 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {sale.map((sala) => (
              <tr key={sala.id} className="border-b border-gray-800/50 hover:bg-gray-900/30">
                <td className="py-4 font-bold">{sala.name}</td>
                <td className="py-4 text-gray-400">{sala.manager_email}</td>
                <td className="py-4">
                  <span className={`px-2 py-1 rounded text-xs font-black ${sala.is_active ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                    {sala.is_active ? 'ATTIVA' : 'SOSPESA'}
                  </span>
                </td>
                <td className="py-4 flex gap-4 justify-end">
                  <button onClick={() => toggleStatoSala(sala.id, sala.is_active)} className="text-xs font-bold uppercase text-cyan-400 hover:text-cyan-300">
                    {sala.is_active ? 'Sospendi' : 'Attiva'}
                  </button>
                  <button onClick={() => aprireAuditContabile(sala)} className="text-xs font-bold uppercase text-yellow-500 hover:text-yellow-300">
                    Audit Contabile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}