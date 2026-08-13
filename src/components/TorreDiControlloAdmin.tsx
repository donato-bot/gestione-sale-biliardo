// ==========================================
// FILE: src/components/TorreDiControlloAdmin.tsx
// OBIETTIVO: Torre di Controllo Super Admin (Supporto Quantità Tavoli e Accesso Lab Blindato)
// ==========================================
"use client";

import { useState, useEffect } from "react";
import { supabase } from "../app/lib/supabase";
import { useRouter } from "next/navigation";

const SUPER_ADMIN = "donatorzz1946@gmail.com";

interface AdminLog {
  id: string;
  manager_email: string;
  azione: string;
  dettagli: string;
  created_at: string;
}

export default function TorreDiControlloAdmin() {
  const [sale, setSale] = useState<any[]>([]);
  const [nomeSala, setNomeSala] = useState("");
  const [emailManager, setEmailManager] = useState("");
  const [passwordTemporanea, setPasswordTemporanea] = useState(""); 
  const [numeroBiliardi, setNumeroBiliardi] = useState(""); 
  const [loading, setLoading] = useState(false);
  
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AdminLog[]>([]);
  const [auditSalaName, setAuditSalaName] = useState("");
  const [loadingAudit, setLoadingAudit] = useState(false);

  const router = useRouter();

  useEffect(() => {
    verificaPrivilegi();
  }, []);

  const verificaPrivilegi = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;

      if (!session) {
        router.push("/login");
        return;
      }

      const emailCorrente = session.user.email?.toLowerCase() || null;
      setUserEmail(emailCorrente);
      
      if (emailCorrente === SUPER_ADMIN.toLowerCase()) {
        await caricaSale();
      }
    } catch (error) {
      console.error("Errore durante la verifica della sessione:", error);
      router.push("/login");
    } finally {
      setIsVerifying(false);
    }
  };

  async function caricaSale() {
    try {
      const { data, error } = await supabase.from("sale").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      if (data) setSale(data);
    } catch (error) {
      console.error("Errore caricamento sale:", error);
    }
  }

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeSala.trim() || !emailManager.trim() || !passwordTemporanea.trim() || !numeroBiliardi.trim()) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          nomeSala: nomeSala.trim(),
          emailManager: emailManager.trim().toLowerCase(),
          passwordTemporanea: passwordTemporanea.trim(),
          numeroBiliardi: numeroBiliardi
        }),
      });

      const textData = await response.text();
      const resData = textData ? JSON.parse(textData) : {};
      
      if (!response.ok) throw new Error(resData.error || "Errore onboarding");

      alert("🚀 Sala registrata e credenziali inviate con successo!");
      setNomeSala("");
      setEmailManager("");
      setPasswordTemporanea("");
      setNumeroBiliardi("");
      caricaSale();
    } catch (err: any) {
      alert("Errore: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleKillSwitch = async (id: string, statoAttuale: boolean) => {
    const nuovoStato = !statoAttuale;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/onboarding", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ id, is_active: nuovoStato }),
      });

      const textData = await response.text();
      const resData = textData ? JSON.parse(textData) : {};

      if (!response.ok) throw new Error(resData.error || "Errore switch");

      caricaSale();
    } catch (err: any) {
      alert("Errore modifica stato: " + err.message);
    }
  };

  const handleEliminaSala = async (id: string, managerEmail: string) => {
    if (!window.confirm(`⚠️ ATTENZIONE:\nStai per eliminare definitivamente la sala e il rispettivo utente manager (${managerEmail}).\nQuesta azione rimuoverà tutti i dati collegati. Procedere?`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch("/api/onboarding", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ id, manager_email: managerEmail }),
      });

      const errText = await response.text();
      
      if (!response.ok) {
        throw new Error(`Codice di Rete [${response.status}]\nDettagli Server: ${errText || "Nessun dettaglio aggiuntivo dal server."}`);
      }

      alert("🗑️ Sala e credenziali rimosse dal sistema.");
      caricaSale();
    } catch (err: any) {
      alert(`ERRORE DEL SERVER DURANTE L'ELIMINAZIONE:\n\n${err.message}\n\nPossibile Causa: Vincoli di Database. Vai su Supabase e assicurati che le relazioni delle tabelle collegate (soci, tornei, prenotazioni) siano impostate su "Cascade" in fase di eliminazione.`);
    }
  };

  const handleResetPassword = async () => {
    if(window.confirm("Vuoi ricevere un'email di sicurezza per impostare o modificare la tua password di Super Admin?")) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(SUPER_ADMIN, {
          redirectTo: window.location.origin + '/login',
        });
        if (error) throw error;
        alert(`Email di sicurezza inviata a ${SUPER_ADMIN}. Controlla la tua casella di posta.`);
      } catch (err: any) {
        alert("Errore invio email di reset: " + err.message);
      }
    }
  };

  const apriAudit = async (managerEmail: string, nomeSala: string) => {
    setAuditSalaName(nomeSala);
    setIsAuditOpen(true);
    setLoadingAudit(true);
    setAuditLogs([]);

    try {
      const { data, error } = await supabase
        .from("admin_logs")
        .select("*")
        .eq("manager_email", managerEmail)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (err: any) {
      console.error("Errore recupero log audit:", err.message);
    } finally {
      setLoadingAudit(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <p className="text-cyan-500 font-black animate-pulse tracking-widest uppercase">Verifica Credenziali...</p>
      </div>
    );
  }

  if (userEmail !== SUPER_ADMIN) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white font-black uppercase">
        🛑 Accesso Riservato Super Admin
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-8 md:p-12 font-sans relative">
      <div className="w-full max-w-[1400px] mx-auto space-y-12">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-cyan-900/60 pb-6 mb-10 gap-4">
          <h1 className="text-4xl font-black uppercase tracking-tight text-cyan-400 italic drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            TORRE DI CONTROLLO
          </h1>
          <div className="flex items-center gap-4">
            <button type="button" onClick={handleResetPassword} className="bg-[#11131a] hover:bg-cyan-950 border-2 border-cyan-800 text-cyan-400 font-black px-6 py-3 rounded-xl uppercase tracking-widest text-xs transition-all shadow-md active:scale-95">
              🔑 Cambia Password
            </button>
            <button type="button" onClick={() => supabase.auth.signOut().then(() => router.push("/login"))} className="bg-red-950 hover:bg-red-900 border-2 border-red-800 text-red-200 font-black px-8 py-3 rounded-xl uppercase tracking-widest text-xs transition-all shadow-[0_5px_15px_rgba(239,68,68,0.2)] active:scale-95">
              Esci
            </button>
          </div>
        </div>

        {/* FORM REGISTRAZIONE */}
        <div className="bg-[#1e2433] border-2 border-cyan-700/50 p-8 sm:p-10 rounded-[2rem] max-w-4xl shadow-[0_15px_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
          
          <h2 className="text-xl font-black uppercase tracking-widest mb-8 text-white flex items-center gap-3 drop-shadow-md">
            <span className="w-4 h-4 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]"></span>
            REGISTRAZIONE NUOVA SALA
          </h2>
          
          <form onSubmit={handleOnboarding} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[11px] text-cyan-300 font-black uppercase tracking-widest mb-2 drop-shadow-sm">Nome Sala</label>
                <input type="text" required placeholder="ES. ACCADEMIA BILIARDO" value={nomeSala} onChange={e => setNomeSala(e.target.value)} className="w-full bg-[#0b0e14] border-2 border-gray-700 p-4 rounded-xl text-white font-bold uppercase focus:outline-none focus:border-cyan-400 transition-colors shadow-inner placeholder-gray-600" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] text-cyan-300 font-black uppercase tracking-widest mb-2 drop-shadow-sm">Email Manager</label>
                <input type="email" required placeholder="manager@club.it" value={emailManager} onChange={e => setEmailManager(e.target.value)} className="w-full bg-[#0b0e14] border-2 border-gray-700 p-4 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-400 transition-colors shadow-inner placeholder-gray-600" />
              </div>
              <div className="md:col-span-3">
                <label className="block text-[11px] text-cyan-300 font-black uppercase tracking-widest mb-2 drop-shadow-sm">Password Fittizia</label>
                <input type="text" required placeholder="Password temporanea" value={passwordTemporanea} onChange={e => setPasswordTemporanea(e.target.value)} className="w-full bg-[#0b0e14] border-2 border-gray-700 p-4 rounded-xl text-cyan-100 font-mono focus:outline-none focus:border-cyan-400 transition-colors shadow-inner placeholder-gray-600" />
              </div>
              <div className="md:col-span-1">
                <label className="block text-[11px] text-cyan-300 font-black uppercase tracking-widest mb-2 drop-shadow-sm">N° Biliardi</label>
                <input type="number" min="1" required placeholder="Es. 8" value={numeroBiliardi} onChange={e => setNumeroBiliardi(e.target.value)} className="w-full bg-[#0b0e14] border-2 border-gray-700 p-4 rounded-xl text-white font-black text-center focus:outline-none focus:border-cyan-400 transition-colors shadow-inner placeholder-gray-600" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-400 text-black font-black uppercase tracking-widest py-5 rounded-2xl text-sm transition-all shadow-[0_10px_20px_rgba(6,182,212,0.3)] active:scale-[0.98]">
              {loading ? "ESECUZIONE IN CORSO..." : "ESEGUI ONBOARDING SALA"}
            </button>
          </form>
        </div>

        {/* GRIGLIA SALE */}
        <div className="bg-[#1e2433] border-2 border-gray-700 rounded-[2.5rem] shadow-[0_15px_50px_rgba(0,0,0,0.6)] overflow-hidden">
          
          <div className="bg-[#151926] p-6 border-b-2 border-gray-800">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-300">DATABASE SALE OPERATIVE</h2>
          </div>
          
          <div className="overflow-x-auto p-4 sm:p-6">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b-2 border-gray-700 text-[11px] text-cyan-300/80 font-black uppercase tracking-widest">
                  <th className="pb-4 pl-4">Nome Club</th>
                  <th className="pb-4">Email Manager</th>
                  <th className="pb-4 text-center">Tavoli</th>
                  <th className="pb-4 text-center">Stato Contratto</th>
                  <th className="pb-4 text-right pr-4">Pannello Strumenti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50 text-sm font-bold uppercase">
                {sale.map(sala => {
                  // CORREZIONE DEFINITIVA: Solo la Sala Demo Ufficiale ha il bottone d'accesso lab.
                  const isAreaTest = sala.name.trim().toUpperCase() === "SALA DEMO UFFICIALE";

                  return (
                    <tr key={sala.id} className="hover:bg-black/20 transition-colors group">
                      <td className="py-6 pl-4 text-white font-black tracking-wide text-lg drop-shadow-md">{sala.name}</td>
                      <td className="py-6 text-cyan-400 font-mono text-xs normal-case">{sala.manager_email}</td>
                      <td className="py-6 text-center text-gray-300 font-black">{sala.numero_biliardi || 0}</td>
                      <td className="py-6 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleKillSwitch(sala.id, sala.is_active !== false)}
                          className={`px-6 py-2.5 rounded-xl text-[11px] font-black border-2 transition-all shadow-lg ${
                            sala.is_active !== false 
                              ? "bg-emerald-900/50 text-emerald-400 border-emerald-500 hover:bg-emerald-800/80" 
                              : "bg-red-900/50 text-red-400 border-red-500 hover:bg-red-800/80"
                          }`}
                        >
                          {sala.is_active !== false ? "🟢 ATTIVO" : "🔴 SOSPESO"}
                        </button>
                      </td>
                      <td className="py-6 text-right pr-4 flex items-center justify-end gap-4 h-full">
                        
                        {isAreaTest && (
                          <button 
                            type="button" 
                            onClick={() => router.push(`/dashboard/${sala.id}`)}
                            className="bg-[#1a150b] hover:bg-amber-950 text-amber-400 border-2 border-amber-800 px-5 py-2.5 rounded-xl text-[11px] font-black tracking-widest transition-all shadow-md flex items-center gap-2"
                            title="Entra come Gestore nella Sala Demo"
                          >
                            <span className="text-sm">🧪</span> ACCESSO LAB
                          </button>
                        )}
                        
                        <button 
                          type="button" 
                          onClick={() => apriAudit(sala.manager_email, sala.name)}
                          className="bg-[#0b0e14] hover:bg-cyan-950 text-cyan-400 border-2 border-cyan-800 px-5 py-2.5 rounded-xl text-[11px] font-black tracking-widest transition-all shadow-md flex items-center gap-2"
                        >
                          <span className="text-sm">🔍</span> AUDIT LOGS
                        </button>
                        
                        <button 
                          type="button" 
                          onClick={() => handleEliminaSala(sala.id, sala.manager_email)} 
                          className="bg-[#0b0e14] hover:bg-red-950 text-red-400 border-2 border-red-800 px-5 py-2.5 rounded-xl text-[11px] font-black tracking-widest transition-all shadow-md flex items-center gap-2"
                        >
                          <span className="text-sm">✖</span> ELIMINA
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {sale.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-gray-500 font-black tracking-widest uppercase text-sm">Nessuna sala attiva nel sistema.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODALE AUDIT */}
      {isAuditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-[#05070a] border-2 border-emerald-500/40 rounded-[2rem] w-full max-w-3xl shadow-[0_0_80px_rgba(16,185,129,0.2)] flex flex-col overflow-hidden max-h-[85vh]">
            
            <div className="bg-[#0a120e] border-b-2 border-emerald-900/50 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-emerald-400 font-mono font-black uppercase tracking-widest flex items-center gap-3 text-xl drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                  <span className="animate-pulse">_></span> SYS.AUDIT.LOG
                </h3>
                <p className="text-emerald-700 font-mono text-[11px] mt-2 uppercase tracking-widest">
                  TARGET_TENANT: {auditSalaName}
                </p>
              </div>
              <button
                onClick={() => setIsAuditOpen(false)}
                className="text-emerald-600 hover:text-emerald-300 transition-colors text-3xl font-black p-2 bg-emerald-950/20 rounded-xl"
              >
                ✖
              </button>
            </div>

            <div className="p-8 overflow-y-auto font-mono text-sm space-y-4 h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#08140f] to-[#020202] custom-scrollbar">
              {loadingAudit ? (
                <div className="text-emerald-500 animate-pulse tracking-widest text-xs leading-loose">
                  >_ Inizializzazione connessione sicura...<br/>
                  >_ Accesso alla scatola nera del tenant...<br/>
                  >_ Estrazione registri operativi in corso...
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-emerald-700/60 tracking-widest text-xs">
                  >_ Nessun evento registrato nella scatola nera per questo tenant.
                </div>
              ) : (
                <div className="space-y-8">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="border-l-2 border-emerald-800/50 pl-5 py-1 relative">
                      <div className="absolute -left-[6px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]"></div>
                      <div className="text-emerald-600 text-[11px] tracking-widest mb-1.5 font-bold">
                        [{new Date(log.created_at).toLocaleString('it-IT')}]
                      </div>
                      <div className="text-emerald-300 font-black uppercase tracking-wider text-base mb-2 drop-shadow-md">
                        {log.azione || "AZIONE SCONOSCIUTA"}
                      </div>
                      {log.dettagli && (
                        <div className="text-emerald-100/90 text-xs leading-relaxed bg-[#030907] p-4 rounded-xl border border-emerald-900/60 shadow-inner">
                          {log.dettagli}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}