"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function TorreDiControlloAdmin() {
  const [sale, setSale] = useState<any[]>([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostraAiuto, setMostraAiuto] = useState(false);

  const isFormInvalid = !nome.trim() || !email.trim() || loading;

  useEffect(() => { caricaSale(); }, []);

  const caricaSale = async () => {
    const { data } = await supabase.from('sale').select('*');
    if (data) setSale(data.filter(s => s.name));
  };

  const creaSala = async () => {
    if (isFormInvalid) return;
    setLoading(true);
    await supabase.rpc('crea_nuova_sala', { p_nome_sala: nome, p_manager_email: email, p_manager_password: "PasswordTemporanea123!" });
    alert("Sala varata!"); setNome(""); setEmail(""); setLoading(false); caricaSale();
  };

  const aggiornaNoteSala = async (id: string, note: string) => {
    await supabase.from('sale').update({ note_amministrative: note }).eq('id', id);
    caricaSale();
  };

  const aprireAuditContabile = (sala: any) => {
    const noteAttuali = sala.note_amministrative || "";
    const nuoveNote = prompt(`--- SCHEDA AMMINISTRATIVA: ${sala.name} ---\nStato: ${sala.is_active ? "ATTIVO" : "SOSPESO"}\n\nAnnota contrattazione o stato attuale:`, noteAttuali);
    
    if (nuoveNote !== null) aggiornaNoteSala(sala.id, nuoveNote);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[#050505] p-10 text-white">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-black text-cyan-500 italic">TORRE DI CONTROLLO</h1>
        <div className="flex gap-4">
          <button onClick={() => setMostraAiuto(!mostraAiuto)} className="bg-gray-800 px-6 py-3 rounded-xl font-bold uppercase text-xs hover:bg-gray-700">ℹ️ Manuale</button>
          <button onClick={logout} className="bg-red-900/50 px-6 py-3 rounded-xl font-bold uppercase text-xs hover:bg-red-800">Esci</button>
        </div>
      </div>

      {mostraAiuto && (
        <div className="bg-[#1A1D24] p-8 rounded-3xl border-2 border-cyan-500 mb-10">
          <h3 className="text-cyan-400 font-black mb-4 uppercase">Manuale Operativo</h3>
          <p className="text-sm text-gray-300">Gestisci le sale, monitora i contratti tramite la funzione 'Audit' e usa le note per ogni aggiornamento necessario.</p>
        </div>
      )}

      <div className="bg-[#11131a] p-8 rounded-3xl border border-gray-800 mb-10 max-w-2xl">
        <h2 className="text-xl font-black mb-6 uppercase tracking-widest">Registrazione Sala</h2>
        <div className="grid grid-cols-2 gap-4">
          <input placeholder="Nome" className="bg-black p-4 rounded-xl border border-gray-800" onChange={e => setNome(e.target.value)} value={nome} />
          <input placeholder="Email" className="bg-black p-4 rounded-xl border border-gray-800" onChange={e => setEmail(e.target.value)} value={email} />
        </div>
        <button onClick={creaSala} disabled={isFormInvalid} className={`w-full mt-4 p-4 rounded-xl font-black uppercase ${isFormInvalid ? 'bg-gray-700' : 'bg-cyan-600'}`}>Esegui Onboarding</button>
      </div>

      <div className="bg-[#11131a] rounded-3xl border border-gray-800 p-8">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
              <th className="pb-4">Nome</th>
              <th className="pb-4">Manager</th>
              <th className="pb-4">Note Amministrative</th>
              <th className="pb-4 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {sale.map((sala) => (
              <tr key={sala.id} className="border-b border-gray-800/50">
                <td className="py-4 font-bold">{sala.name}</td>
                <td className="py-4 text-gray-400">{sala.manager_email}</td>
                <td className="py-4 text-xs text-yellow-400 italic">{sala.note_amministrative || "Nessuna nota"}</td>
                <td className="py-4 flex gap-4 justify-end">
                  <button onClick={() => aprireAuditContabile(sala)} className="text-yellow-500 uppercase font-bold text-xs">Audit/Note</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}