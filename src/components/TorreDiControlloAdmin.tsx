"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";

const SUPER_ADMIN = "donatorzz1946@gmail.com";

export default function TorreDiControlloAdmin() {
  const [sale, setSale] = useState<any[]>([]);
  const [nomeSala, setNomeSala] = useState("");
  const [emailManager, setEmailManager] = useState("");
  const [passwordTemporanea, setPasswordTemporanea] = useState(""); 
  const [loading, setLoading] = useState(false);
  
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  const router = useRouter();

  useEffect(() => {
    verificaPrivilegi();
  }, []);

  const verificaPrivilegi = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setUserEmail(session.user.email || null);
    setIsVerifying(false);
    if (session.user.email === SUPER_ADMIN) {
      caricaSale();
    }
  };

  async function caricaSale() {
    const { data } = await supabase.from("sale").select("*").order("created_at", { ascending: false });
    if (data) setSale(data);
  }

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeSala.trim() || !emailManager.trim() || !passwordTemporanea.trim()) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/admin/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          nomeSala: nomeSala.trim(),
          emailManager: emailManager.trim().toLowerCase(),
          passwordTemporanea: passwordTemporanea.trim(),
        }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Errore onboarding");

      alert("🚀 Sala registrata e credenziali inviate con successo!");
      setNomeSala("");
      setEmailManager("");
      setPasswordTemporanea("");
      caricaSale();
    } catch (err: any) {
      alert("Errore: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminaSala = async (id: string, managerEmail: string) => {
    if (!window.confirm(`⚠️ ATTENZIONE:\nStai per eliminare definitivamente la sala e il rispettivo utente manager (${managerEmail}).\nQuesta azione rimuoverà tutti i dati collegati. Procedere?`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/admin/onboarding", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ id, manager_email: managerEmail }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Errore eliminazione");

      alert("🗑️ Sala e credenziali rimosse dal sistema.");
      caricaSale();
    } catch (err: any) {
      alert("Errore durante l'eliminazione: " + err.message);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-cyan-500 font-black animate-pulse tracking-widest uppercase">Verifica Credenziali...</p>
      </div>
    );
  }

  if (userEmail !== SUPER_ADMIN) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white font-black uppercase">
        🛑 Accesso Riservato Super Admin
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-8 md:p-12 font-sans">
      <div className="w-full max-w-[1400px] mx-auto space-y-10">
        
        {/* HEADER */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-6">
          <h1 className="text-4xl font-black uppercase tracking-tight text-cyan-400 italic">TORRE DI CONTROLLO</h1>
          <button type="button" onClick={() => supabase.auth.signOut().then(() => router.push("/login"))} className="bg-red-950/40 hover:bg-red-900 border border-red-500/30 text-white font-black px-6 py-2.5 rounded-xl uppercase tracking-widest text-xs transition-all">
            Esci
          </button>
        </div>

        {/* FORM REGISTRAZIONE */}
        <div className="bg-[#11131a] border border-gray-800/80 p-8 rounded-[2.5rem] max-w-4xl shadow-2xl">
          <h2 className="text-xl font-black uppercase tracking-widest mb-6 text-white">REGISTRAZIONE SALA</h2>
          <form onSubmit={handleOnboarding} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Nome Sala</label>
                <input type="text" required placeholder="Nome" value={nomeSala} onChange={e => setNomeSala(e.target.value)} className="w-full bg-black border border-gray-800 p-4 rounded-xl text-white font-bold uppercase focus:outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Email Manager</label>
                <input type="email" required placeholder="Email" value={emailManager} onChange={e => setEmailManager(e.target.value)} className="w-full bg-black border border-gray-800 p-4 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Password Fittizia</label>
                <input type="text" required placeholder="Password temporanea" value={passwordTemporanea} onChange={e => setPasswordTemporanea(e.target.value)} className="w-full bg-black border border-gray-800 p-4 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 text-white font-black uppercase tracking-widest py-4 rounded-xl text-xs transition-all shadow-lg">
              {loading ? "ESECUZIONE IN CORSO..." : "ESEGUI ONBOARDING"}
            </button>
          </form>
        </div>

        {/* GRIGLIA SALE */}
        <div className="bg-[#11131a] border border-gray-800 rounded-3xl p-6 shadow-xl overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-800 text-[10px] text-gray-500 font-black uppercase tracking-widest">
                <th className="pb-4 pl-4">Nome</th>
                <th className="pb-4">Manager</th>
                <th className="pb-4">Note Amministrative</th>
                <th className="pb-4 text-right pr-4">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40 text-sm font-bold uppercase">
              {sale.map(sala => (
                <tr key={sala.id} className="hover:bg-black/20 transition-colors">
                  <td className="py-4 pl-4 text-white font-black tracking-wide">{sala.name}</td>
                  <td className="py-4 text-gray-400 font-mono text-xs normal-case">{sala.manager_email}</td>
                  <td className="py-4 text-yellow-600/80 italic text-xs">Nessuna nota</td>
                  <td className="py-4 text-right pr-4 space-x-3 flex items-center justify-end gap-2">
                    {/* Link di emergenza protetta per SuperAdmin */}
                    <a 
                      href={`/dashboard/${sala.id}`}
                      className="text-xs font-bold uppercase text-gray-500 hover:text-white transition-colors mr-2"
                    >
                      Accesso Direttore (SuperAdmin)
                    </a>
                    <span className="text-gray-800">|</span>
                    <button type="button" className="text-cyan-500 hover:text-cyan-400 text-xs font-black tracking-widest">
                      AUDIT/NOTE
                    </button>
                    <span className="text-gray-800">|</span>
                    <button type="button" onClick={() => handleEliminaSala(sala.id, sala.manager_email)} className="text-red-500 hover:text-red-400 text-xs font-black tracking-widest">
                      ELIMINA
                    </button>
                  </td>
                </tr>
              ))}
              {sale.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-600 font-black tracking-widest">Nessuna sala attiva nel sistema.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}