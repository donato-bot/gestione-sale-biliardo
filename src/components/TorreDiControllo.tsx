"use client";

// ==========================================
// FILE: src/components/TorreDiControllo.tsx
// OBIETTIVO: Pannello Amministrativo (Blindato con Modulo Varo Automatico)
// ==========================================

import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";

const SUPER_ADMIN = "donatorzz1946@gmail.com";

export default function TorreDiControllo({ 
  salaId, 
  setActiveView 
}: { 
  salaId: string, 
  setActiveView?: (view: string) => void 
}) {
  const [logs, setLogs] = useState<any[]>([]);
  const [salaInfo, setSalaInfo] = useState<any>(null);
  
  // STATI DI VERIFICA IDENTITÀ
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  // STATI DELLA FORM ONBOARDING AUTOMATICO
  const [nomeNuovaSala, setNomeNuovaSala] = useState("");
  const [emailNuovoManager, setEmailNuovoManager] = useState("");
  const [pwdNuovoManager, setPwdNuovoManager] = useState("");
  const [loadingOnboarding, setLoadingOnboarding] = useState(false);

  const router = useRouter();

  useEffect(() => {
    verificaIdentitaAdmin();
  }, []);

  useEffect(() => {
    if (salaId && userEmail === SUPER_ADMIN) {
      fetchAdminData();
    }
  }, [salaId, userEmail]);

  const verificaIdentitaAdmin = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        router.push("/login");
        return;
      }
      setUserEmail(session.user.email || null);
    } catch (err) {
      console.error("Errore verifica sessione:", err);
    } finally {
      setIsVerifying(false);
    }
  };

  const fetchAdminData = async () => {
    const { data: salaData } = await supabase.from('sale').select('*').eq('id', salaId).single();
    if (salaData) setSalaInfo(salaData);

    const { data: logsData } = await supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(10);
    if (logsData) setLogs(logsData);
  };

  const handleVaroAutomatico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeNuovaSala.trim() || !emailNuovoManager.trim() || !pwdNuovoManager.trim()) return;

    setLoadingOnboarding(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch("/api/admin/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          nomeSala: nomeNuovaSala.trim(),
          emailManager: emailNuovoManager.trim().toLowerCase(),
          passwordTemporanea: pwdNuovoManager,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Errore sconosciuto durante l'onboarding");
      }

      alert(`🚀 Club varato con successo!\nUtente creato e credenziali inviate a ${emailNuovoManager}`);
      
      // Resetta i campi
      setNomeNuovaSala("");
      setEmailNuovoManager("");
      setPwdNuovoManager("");
      
      // Ricarica la scatola nera
      fetchAdminData();
    } catch (err: any) {
      alert("❌ Fallimento Onboarding: " + err.message);
    } finally {
      setLoadingOnboarding(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <p className="text-xl font-bold text-cyan-500 animate-pulse uppercase tracking-widest">
          Verifica Credenziali Amministratore...
        </p>
      </div>
    );
  }

  if (userEmail !== SUPER_ADMIN) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="bg-black border-2 border-red-900 rounded-[2.5rem] p-10 max-w-md w-full text-center shadow-[0_0_50px_rgba(220,38,38,0.3)]">
          <div className="text-red-600 text-6xl mb-6">🛑</div>
          <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-4">Accesso Negato</h2>
          <p className="text-gray-500 font-bold mb-8">
            L'account corrente (<span className="text-red-400 font-mono text-xs">{userEmail || "Anonimo"}</span>) non possiede i privilegi di Super Amministratore.
          </p>
          <button 
            type="button"
            onClick={() => router.push(`/dashboard/${salaId}`)} 
            className="w-full bg-red-950 hover:bg-red-900 border border-red-500/30 text-white font-black py-4 rounded-xl uppercase tracking-widest transition-all text-xs"
          >
            Torna alla Plancia di Sala
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50 p-4 sm:p-8 md:p-12 flex flex-col items-center transition-colors duration-500">
      <div className="w-full max-w-[1400px] bg-[#050505] rounded-[3rem] p-8 sm:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.3)] border-8 border-cyan-900/40 relative overflow-hidden">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-gray-800 pb-8 mb-10 gap-4">
          <div>
            <p className="text-[10px] text-cyan-500 font-black uppercase tracking-widest mb-1 flex items-center gap-2">
              <span className="w-1.5 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
              Pannello Multi-Tenant (Isolamento Super Admin Attivo)
            </p>
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tight">TORRE DI CONTROLLO</h2>
          </div>
          
          <button 
            type="button"
            onClick={() => { if (setActiveView) setActiveView('hub'); }} 
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all border-2 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] active:scale-95 text-center"
          >
            ← TORNA ALL'HUB
          </button>
        </div>

        {/* GRIGLIA FUNZIONALE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* COLONNA 1 & 2: FABBRICA DELLE SALE (ONBOARDING AUTOMATICO) */}
          <div className="lg:col-span-2 bg-[#0B0D14] border border-[#2A2E39] rounded-2xl p-8 shadow-2xl flex flex-col gap-6">
            <h3 className="text-xl text-white font-black uppercase tracking-widest border-b border-gray-700 pb-4 text-cyan-400">
              Varo Automatico Nuovi Club
            </h3>
            <form onSubmit={handleVaroAutomatico} className="space-y-5">
              <div>
                <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Nome della Sala / Circolo</label>
                <input 
                  type="text"
                  placeholder="Es. ACCADEMIA BILIARDO SALENTO"
                  value={nomeNuovaSala}
                  onChange={e => setNomeNuovaSala(e.target.value)}
                  required
                  disabled={loadingOnboarding}
                  className="w-full bg-black border border-gray-800 p-4 rounded-xl text-white font-bold uppercase placeholder-gray-700 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Email del Gestore / Manager (Chiave d'Isolamento)</label>
                <input 
                  type="email"
                  placeholder="Es. manager.salento@gmail.com"
                  value={emailNuovoManager}
                  onChange={e => setEmailNuovoManager(e.target.value)}
                  required
                  disabled={loadingOnboarding}
                  className="w-full bg-black border border-gray-800 p-4 rounded-xl text-white font-bold placeholder-gray-700 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Password Temporanea di Primo Accesso</label>
                <input 
                  type="text"
                  placeholder="Es. Campione2026!"
                  value={pwdNuovoManager}
                  onChange={e => setPwdNuovoManager(e.target.value)}
                  required
                  disabled={loadingOnboarding}
                  className="w-full bg-black border border-gray-800 p-4 rounded-xl text-white font-mono placeholder-gray-700 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loadingOnboarding}
                className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg text-xs"
              >
                {loadingOnboarding ? "Varo e Sincronizzazione in Corso..." : "🚀 ATTIVA NUOVA SALA E INVIA CREDENZIALI"}
              </button>
            </form>
          </div>

          {/* COLONNA 3: SCATOLA NERA DEI LOG GENERALE */}
          <div className="bg-[#0B0D14] border border-[#2A2E39] rounded-2xl p-8 shadow-2xl flex flex-col gap-6">
            <div className="flex justify-between items-end border-b border-gray-700 pb-4">
              <h3 className="text-xl text-white font-black uppercase tracking-widest">Scatola Nera</h3>
              <span className="text-xs text-red-500 font-black tracking-widest animate-pulse">● REC</span>
            </div>
            
            <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {logs.length > 0 ? logs.map((log, index) => (
                <div key={index} className="bg-black p-4 rounded-xl border border-gray-800 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-500 font-black text-xs uppercase tracking-widest">{log.azione || 'Attività'}</span>
                    <span className="text-gray-600 text-xs font-mono">{new Date(log.created_at).toLocaleString('it-IT')}</span>
                  </div>
                  <span className="text-gray-400 text-sm font-medium">{log.dettagli || 'Registrazione di sistema.'}</span>
                </div>
              )) : (
                <p className="text-gray-500 italic text-sm text-center py-10">Nessun evento recente.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}