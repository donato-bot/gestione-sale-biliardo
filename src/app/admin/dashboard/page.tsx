"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function TorreDiControlloAdmin() {
  const [sale, setSale] = useState<any[]>([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostraAiuto, setMostraAiuto] = useState(false);

  useEffect(() => { caricaSale(); }, []);

  const caricaSale = async () => {
    // Il Super Admin vede solo l'anagrafica delle sale, non i dati operativi
    const { data } = await supabase.from('sale').select('id, name, manager_email, is_active, created_at');
    if (data) setSale(data);
  };

  const creaSala = async () => {
    setLoading(true);
    const { error } = await supabase.rpc('crea_nuova_sala', {
      p_nome_sala: nome,
      p_manager_email: email,
      p_manager_password: "PasswordTemporanea123!"
    });
    if (error) { alert("Errore nel varo: " + error.message); } 
    else { alert("Sala varata!"); setNome(""); setEmail(""); caricaSale(); }
    setLoading(false);
  };

  const toggleStatoSala = async (id: string, statoAttuale: boolean) => {
    await supabase.from('sale').update({ is_active: !statoAttuale }).eq('id', id);
    caricaSale();
  };

  const aprireAuditContabile = (sala: any) => {
    const oggi = new Date();
    const dataCreazione = new Date(sala.created_at);
    const finePeriodoGratuito = new Date(dataCreazione);
    finePeriodoGratuito.setMonth(finePeriodoGratuito.getMonth() + 1);

    const statoPagamenti = oggi > finePeriodoGratuito ? "DA FATTURARE" : "IN PROVA GRATUITA";

    alert(`--- SCHEDA AMMINISTRATIVA ---\nSala: ${sala.name}\nManager: ${sala.manager_email}\nStato Pagamenti: ${statoPagamenti}\nStato Servizio: ${sala.is_active ? "ATTIVO" : "SOSPESO"}`);
  };

  return (
    <div className="min-h-screen bg-[#050505] p-10 text-white">
      <h1 className="text-4xl font-black text-cyan-500 mb-10 italic">TORRE DI CONTROLLO AMMINISTRATIVA</h1>

      {/* Sezione Varo - Gestione Contratti */}
      <div className="bg-[#11131a] p-8 rounded-3xl border border-gray-800 mb-10 max-w-2xl">
        <h2 className="text-xl font-black mb-6 uppercase tracking-widest">Registrazione Nuova Sala</h2>
        <div className="grid grid-cols-2 gap-4">
          <input placeholder="Nome Sala" className="bg-black p-4 rounded-xl border border-gray-800" onChange={e => setNome(e.target.value)} value={nome} />
          <input placeholder="Email Manager" className="bg-black p-4 rounded-xl border border-gray-800" onChange={e => setEmail(e.target.value)} value={email} />
        </div>
        <button onClick={creaSala} disabled={loading} className="w-full mt-4 bg-cyan-600 p-4 rounded-xl font-black uppercase">
          {loading ? "Varo in corso..." : "Esegui Onboarding"}
        </button>
      </div>

      {/* Tabella di Controllo - Monitoraggio Contrattuale */}
      <div className="bg-[#11131a] rounded-3xl border border-gray-800 p-8">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
              <th className="pb-4">Nome Sala</th>
              <th className="pb-4">Manager</th>
              <th className="pb-4">Stato</th>
              <th className="pb-4 text-right">Azioni Amministrative</th>
            </tr>
          </thead>
          <tbody>
            {sale.map((sala) => (
              <tr key={sala.id} className="border-b border-gray-800/50">
                <td className="py-4 font-bold">{sala.name}</td>
                <td className="py-4 text-gray-400">{sala.manager_email}</td>
                <td className="py-4">
                  <span className={`px-2 py-1 rounded text-xs font-black ${sala.is_active ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                    {sala.is_active ? 'ATTIVA' : 'SOSPESA'}
                  </span>
                </td>
                <td className="py-4 flex gap-4 justify-end">
                  <button onClick={() => toggleStatoSala(sala.id, sala.is_active)} className="text-cyan-400 uppercase font-bold text-xs">
                    {sala.is_active ? 'Sospendi' : 'Attiva'}
                  </button>
                  <button onClick={() => aprireAuditContabile(sala)} className="text-yellow-500 uppercase font-bold text-xs">
                    Audit
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