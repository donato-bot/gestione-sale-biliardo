// ==========================================
// FILE: src/app/dashboard/[sala]/page.tsx 
// OBIETTIVO: Dashboard Privata Unificata (Il Collante)
// ==========================================

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

// --- IMPORT DEI COMPONENTI (I MODULI) ---
import TavoliManager from "../../../components/TavoliManager";
import PrenotazioniManager from "../../../components/PrenotazioniManager"; 
import TorneiManager from "../../../components/TorneiManager";
import ContabilitaManager from "../../../components/ContabilitaManager";
import Tariffe from "../../../components/Tariffe";
import BachecaManager from "../../../components/BachecaManager"; // 👈 NUOVO MODULO IMPORTATO

// Nota: I moduli 'Soci', 'Magazzino' e 'Tariffe' sono rotte indipendenti per garantire massime prestazioni.

const SUPER_ADMIN = "donatorzz1946@gmail.com";

// Definiamo i tab rimasti come componenti interni (AGGIUNTA BACHECA)
type TabType = 'tavoli' | 'prenotazioni' | 'tornei' | 'contabilita' | 'tariffe' | 'bacheca'; 

export default function SalaDashboard() {
  const params = useParams();
  const salaId = (params?.sala as string)?.trim(); 
  const router = useRouter();

  const [sala, setSala] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('tavoli');
  const [debugLog, setDebugLog] = useState<string>("Caricamento in corso...");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const eseguiCaricamento = async () => {
      if (!salaId) {
        setDebugLog("In attesa dell'ID della sala...");
        return; 
      }

      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session) {
        if (isMounted) router.push("/login");
        return;
      }
      
      if (isMounted) setUserEmail(sessionData.session.user.email || null);

      try {
        const { data: salaData, error: salaError } = await supabase
          .from('sale')
          .select('*')
          .eq('id', salaId)
          .maybeSingle();

        if (salaError) {
          setDebugLog(`🚨 ERRORE DATABASE: ${salaError.message}`);
        } else if (!salaData) {
          setDebugLog(`⚠️ SALA NON TROVATA. L'ID ${salaId} non esiste o l'RLS lo blocca.`);
        } else {
          if (isMounted) setSala(salaData);
        }
      } catch (err: any) {
        setDebugLog(`💥 CRASH: ${err.message}`);
      } finally {
        if (isMounted) setIsReady(true);
      }
    };

    eseguiCaricamento();

    return () => { isMounted = false; };
  }, [salaId, router]);

  if (!isReady && !sala) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8">
        <div className="text-center">
          <span className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto block mb-4"></span>
          <p className="text-cyan-400 font-black uppercase tracking-widest text-sm">{debugLog}</p>
        </div>
      </div>
    );
  }

  const isSuperAdmin = userEmail === SUPER_ADMIN;
  const managerDataEmail = sala?.manager_email || userEmail || '';

  return (
    <div className="min-h-screen bg-emerald-50 p-4 sm:p-8 md:p-12 flex flex-col items-center transition-colors duration-500">
      <div className="w-full max-w-[1400px] bg-[#050505] rounded-[3rem] p-8 sm:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.3)] border-8 border-cyan-900/40 relative overflow-hidden text-white">
        
        {!sala && isReady && (
          <div className="mb-10 p-6 bg-red-950 border-l-4 border-red-500 rounded-lg">
            <h3 className="text-red-500 font-black uppercase mb-2">🚨 Attenzione:</h3>
            <p className="text-red-200 font-mono text-sm">{debugLog}</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b-2 border-gray-800 pb-8 mb-10 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
              <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">
                Club Attivo & Operativo — Isolamento Multi-Tenant OK
              </p>
            </div>
            <h2 className="text-4xl font-black uppercase italic tracking-tight">{sala?.name || "SALA NON CARICATA"}</h2>
          </div>

          {/* ZONA TASTI AMMINISTRATIVI */}
          <div className="flex flex-wrap items-center gap-4">
            {isSuperAdmin && (
              <button 
                type="button"
                onClick={() => router.push("/admin")}
                className="bg-amber-600 hover:bg-amber-500 text-black font-black px-6 py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95"
              >
                ⚡ Torre di Controllo
              </button>
            )}

            <button 
              type="button"
              onClick={() => router.push(`/dashboard/${salaId}/tariffe`)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md"
            >
              ⚙️ Impostazioni Tariffe
            </button>

            <button 
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
              }}
              className="bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/30 px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
            >
              🚪 Disconnetti
            </button>
          </div>
        </div>

        {/* BARRA DI NAVIGAZIONE PRINCIPALE */}
        <div className="flex gap-4 mb-8 border-b border-gray-800 pb-4 overflow-x-auto custom-scrollbar">
          
          <button 
            type="button"
            onClick={() => setActiveTab('tavoli')}
            className={`whitespace-nowrap px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === 'tavoli' 
                ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400' 
                : 'bg-black text-gray-400 border border-gray-800 hover:text-white'
            }`}
          >
            🎱 Plancia Tavoli
          </button>

          {/* 👇 TASTO BACHECA AGGIUNTO 👇 */}
          <button 
            type="button"
            onClick={() => setActiveTab('bacheca')}
            className={`whitespace-nowrap px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === 'bacheca' 
                ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] border border-indigo-400' 
                : 'bg-black text-gray-400 border border-gray-800 hover:text-white'
            }`}
          >
            📢 Bacheca Annunci
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('prenotazioni')}
            className={`whitespace-nowrap px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === 'prenotazioni' 
                ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400' 
                : 'bg-black text-gray-400 border border-gray-800 hover:text-white'
            }`}
          >
            📅 Prenotazioni
          </button>
          
          <button 
            type="button"
            onClick={() => router.push(`/dashboard/${salaId}/soci`)}
            className="whitespace-nowrap px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all bg-black text-gray-400 border border-gray-800 hover:text-white hover:border-cyan-500/50"
          >
            👥 Gestione Soci
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('tornei')}
            className={`whitespace-nowrap px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === 'tornei' 
                ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400' 
                : 'bg-black text-gray-400 border border-gray-800 hover:text-white'
            }`}
          >
            🏆 Modulo Tornei
          </button>

          <button 
            type="button"
            onClick={() => router.push(`/dashboard/${salaId}/magazzino`)}
            className="whitespace-nowrap px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all bg-black text-gray-400 border border-gray-800 hover:text-white hover:border-cyan-500/50"
          >
            📦 Magazzino
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('contabilita')}
            className={`whitespace-nowrap px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === 'contabilita' 
                ? 'bg-amber-600 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)] border border-amber-400' 
                : 'bg-black text-gray-400 border border-gray-800 hover:text-white'
            }`}
          >
            💰 Contabilità
          </button>

        </div>

        {/* CONTENUTO DINAMICO (I MODULI INTERNI) */}
        <div className="min-h-[500px]">
          {activeTab === 'tavoli' && sala && (
            <TavoliManager managerEmail={managerDataEmail} />
          )}

          {/* 👇 CARICAMENTO DEL COMPONENTE BACHECA 👇 */}
          {activeTab === 'bacheca' && sala && (
            <BachecaManager salaId={salaId} />
          )}

          {activeTab === 'prenotazioni' && sala && (
            <PrenotazioniManager managerEmail={managerDataEmail} salaId={salaId} />
          )}

          {activeTab === 'tornei' && sala && (
            <TorneiManager managerEmail={managerDataEmail} />
          )}

          {activeTab === 'contabilita' && sala && (
            <ContabilitaManager managerEmail={managerDataEmail} salaId={salaId} />
          )}
          
          {activeTab === 'tariffe' && sala && (
            <Tariffe salaId={salaId} />
          )}
        </div>

      </div>
    </div>
  );
}