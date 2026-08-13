// ==========================================
// FILE: src/app/admin/dashboard/page.tsx
// OBIETTIVO: Torre di Controllo (/admin/dashboard) con Accesso Rapido e Disconnessione
// ==========================================
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

interface Sala {
  id: string;
  name: string;
  manager_email: string;
  numero_biliardi: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  
  const [sale, setSale] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);

  const [nomeSala, setNomeSala] = useState("");
  const [emailManager, setEmailManager] = useState("");
  const [passwordTmp, setPasswordTmp] = useState("");
  const [numBiliardi, setNumBiliardi] = useState("8");

  useEffect(() => {
    caricaSale();
  }, []);

  const caricaSale = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sale")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setSale(data);
    } catch (error: any) {
      console.error("Errore caricamento sale:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreaSala = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeSala.trim() || !emailManager.trim()) {
      alert("Compila tutti i campi obbligatori.");
      return;
    }

    try {
      const { error } = await supabase.from("sale").insert([
        {
          name: nomeSala.trim().toUpperCase(),
          manager_email: emailManager.trim().toLowerCase(),
          numero_biliardi: parseInt(numBiliardi) || 8,
          is_active: true,
        },
      ]);

      if (error) throw error;

      alert("✅ Sala creata con successo!");
      setNomeSala("");
      setEmailManager("");
      setPasswordTmp("");
      setNumBiliardi("8");
      await caricaSale();
    } catch (error: any) {
      alert("Errore creazione sala: " + error.message);
    }
  };

  const handleEliminaSala = async (id: string, name: string) => {
    if (!window.confirm(`Sei sicuro di voler eliminare la sala "${name}"?`)) return;

    try {
      const { error } = await supabase.from("sale").delete().eq("id", id);
      if (error) throw error;
      setSale(sale.filter((s) => s.id !== id));
    } catch (error: any) {
      alert("Errore eliminazione: " + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace("/"); // Ti riporta fuori dalla Torre di Controllo in modo sicuro
    } catch (error) {
      console.error("Errore durante la disconnessione:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-white p-8 space-y-10">
      
      {/* HEADER BOX */}
      <div className="flex justify-between items-center bg-[#111827] border border-gray-700/70 border-t-4 border-t-amber-500 p-6 rounded-2xl shadow-2xl shadow-black/60">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-amber-500">👑 Torre di Controllo</h1>
          <p className="text-gray-400 text-xs uppercase tracking-widest mt-1">Pannello di supervisione globale e monitoraggio sale.</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-900/30 hover:bg-red-900/60 text-red-400 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors border border-red-900/50 shadow-lg"
        >
          ⏻ Disconnetti
        </button>
      </div>

      {/* FORM ONBOARDING BOX */}
      <div className="bg-[#111827] border border-gray-700/70 border-t-4 border-t-cyan-500 p-6 rounded-2xl space-y-6 shadow-2xl shadow-black/60">
        <h2 className="text-lg font-black uppercase tracking-widest text-cyan-400">Registrazione Nuova Sala</h2>
        <form onSubmit={handleCreaSala} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Nome Sala</label>
            <input
              type="text"
              placeholder="ES. ACCADEMIA BILIARDO"
              value={nomeSala}
              onChange={(e) => setNomeSala(e.target.value)}
              className="w-full bg-[#1e293b] border-2 border-gray-700 text-white px-4 py-3 rounded-xl text-xs font-bold uppercase focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Email Manager</label>
            <input
              type="email"
              placeholder="manager@club.it"
              value={emailManager}
              onChange={(e) => setEmailManager(e.target.value)}
              className="w-full bg-[#1e293b] border-2 border-gray-700 text-white px-4 py-3 rounded-xl text-xs font-bold focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Password Temporanea</label>
            <input
              type="text"
              placeholder="Password provvisoria"
              value={passwordTmp}
              onChange={(e) => setPasswordTmp(e.target.value)}
              className="w-full bg-[#1e293b] border-2 border-gray-700 text-white px-4 py-3 rounded-xl text-xs font-bold focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">N° Biliardi</label>
            <input
              type="number"
              value={numBiliardi}
              onChange={(e) => setNumBiliardi(e.target.value)}
              className="w-full bg-[#1e293b] border-2 border-gray-700 text-white px-4 py-3 rounded-xl text-xs font-bold focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <div className="md:col-span-4 flex justify-end mt-2">
            <button
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-500 text-black px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg"
            >
              + Esegui Onboarding Sala
            </button>
          </div>
        </form>
      </div>

      {/* TABELLA SALE OPERATIVE BOX */}
      <div className="bg-[#111827] border border-gray-700/70 border-t-4 border-t-emerald-500 p-6 rounded-2xl space-y-6 shadow-2xl shadow-black/60">
        <h2 className="text-lg font-black uppercase tracking-widest text-white">Database Sale Operative</h2>
        {loading ? (
          <div className="text-cyan-500 font-bold animate-pulse text-center py-6 uppercase tracking-widest">Caricamento sale...</div>
        ) : sale.length === 0 ? (
          <p className="text-gray-400 text-xs uppercase tracking-widest text-center py-6">Nessuna sala registrata nel sistema.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700/50 text-[10px] text-gray-400 uppercase tracking-widest">
                  <th className="p-4">Nome Club</th>
                  <th className="p-4">Email Manager</th>
                  <th className="p-4">Tavoli</th>
                  <th className="p-4">Stato Contratto</th>
                  <th className="p-4 text-right">Pannello Strumenti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50 text-xs font-bold">
                {sale.map((sala) => (
                  <tr key={sala.id} className="hover:bg-[#1e293b]/50 transition-colors">
                    <td className="p-4 text-white uppercase tracking-wider">{sala.name}</td>
                    <td className="p-4 text-cyan-400 font-mono text-[11px]">{sala.manager_email}</td>
                    <td className="p-4 text-gray-300">{sala.numero_biliardi} Biliardi</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[9px] uppercase font-black tracking-widest ${sala.is_active ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/50' : 'bg-red-900/40 text-red-400 border border-red-700/50'}`}>
                        {sala.is_active ? 'Attivo' : 'Sospeso'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <a
                        href={`/dashboard/${sala.id}`}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors inline-block shadow"
                      >
                        ▶ Accedi
                      </a>
                      <button
                        onClick={() => alert(`Audit Logs per ${sala.name}`)}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors border border-gray-600"
                      >
                        Audit Logs
                      </button>
                      <button
                        onClick={() => handleEliminaSala(sala.id, sala.name)}
                        className="bg-red-900/30 hover:bg-red-900/50 border border-red-900/50 text-red-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                      >
                        Elimina
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}