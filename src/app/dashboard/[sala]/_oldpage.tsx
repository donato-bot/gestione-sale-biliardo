"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

// Importazione di TUTTI i moduli esistenti nella tua cartella components
import MenuHub from "../../../components/MenuHub";
import Plancia from "../../../components/Plancia";
import BachecaGestore from "../../../components/BachecaGestore";
import Soci from "../../../components/Soci";
import Magazzino from "../../../components/Magazzino";
import Cassa from "../../../components/Cassa";
import Prenotazioni from "../../../components/Prenotazioni";
import Tornei from "../../../components/Tornei";
import Staff from "../../../components/Staff";
import Impostazioni from "../../../components/Impostazioni";
import Servizi from "../../../components/Servizi";
import ManualeOperativo from "../../../components/ManualeOperativo";

export default function DashboardGestore({ params }: { params: { sala: string } }) {
  const [sezioneAttiva, setSezioneAttiva] = useState<string>("hub");
  const [nomeSala, setNomeSala] = useState<string>("");
  const router = useRouter();

  // Recupera il nome della sala dal database
  useEffect(() => {
    const fetchNomeSala = async () => {
      const { data, error } = await supabase
        .from("sale")
        .select("name")
        .eq("id", params.sala)
        .single();

      if (data && !error) {
        setNomeSala(data.name);
      }
    };
    if (params.sala) fetchNomeSala();
  }, [params.sala]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // ==========================================
  // VISTA 1: LA TORRE DI CONTROLLO (LA GRIGLIA)
  // ==========================================
  if (sezioneAttiva === "hub") {
    return (
      <div className="min-h-screen bg-black text-white p-4 sm:p-8 flex flex-col justify-between">
        
        {/* Pulsante rapido superiore per accedere al Manuale d'Uso direttamente dall'Hub */}
        <div className="max-w-6xl mx-auto w-full flex justify-end mb-2">
          <button 
            onClick={() => setSezioneAttiva("manuale")}
            className="bg-cyan-950 text-cyan-400 hover:bg-cyan-900 border border-cyan-800/60 px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg"
          >
            📖 MANUALE D'USO
          </button>
        </div>

        <MenuHub 
          nomeSala={nomeSala} 
          setActiveView={setSezioneAttiva} 
          pendingPrenotazioniLength={0} 
          isSalaSuspended={false} 
          onLogout={handleLogout} 
        />
      </div>
    );
  }

  // ==========================================
  // VISTA 2: AMBIENTE DI LAVORO DEI SINGOLI MODULI
  // ==========================================
  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* Barra superiore rigida di navigazione */}
      <div className="flex items-center justify-between p-4 border-b-4 border-black bg-white shadow-md relative z-10">
        <button 
          onClick={() => setSezioneAttiva("hub")}
          className="border-4 border-black font-black px-6 py-3 uppercase hover:bg-black hover:text-white transition-all text-sm rounded-xl"
        >
          ← Torna alla Torre di Controllo
        </button>
        <h1 className="text-2xl font-black uppercase tracking-widest text-center flex-1">
          {nomeSala} — {sezioneAttiva.toUpperCase()}
        </h1>
        <div className="w-[200px] hidden sm:block"></div>
      </div>

      {/* Contenitore ad alta intensità visiva per i moduli */}
      <div className="p-4 sm:p-8 bg-gray-100 min-h-[calc(100vh-100px)]">
        <div className="bg-[#0a0c10] min-h-[600px] rounded-[2.5rem] border-4 border-gray-800 text-white overflow-hidden shadow-2xl animate-in fade-in duration-300">
          
          {/* Smistamento dinamico delle stanze operative basato sul click dell'Hub */}
          {sezioneAttiva === "plancia" && (
            <Plancia salaId={params.sala} userRole="gestore" />
          )}

          {sezioneAttiva === "bacheca" && (
            <BachecaGestore salaId={params.sala} />
          )}

          {sezioneAttiva === "soci" && (
            <Soci salaId={params.sala} />
          )}

          {sezioneAttiva === "magazzino" && (
            <Magazzino salaId={params.sala} />
          )}

          {sezioneAttiva === "report" && (
            <Cassa salaId={params.sala} />
          )}

          {sezioneAttiva === "prenotazioni" && (
            <Prenotazioni salaId={params.sala} />
          )}

          {sezioneAttiva === "tornei" && (
            <Tornei salaId={params.sala} />
          )}

          {sezioneAttiva === "staff" && (
            <Staff salaId={params.sala} />
          )}

          {sezioneAttiva === "impostazioni" && (
            <Impostazioni salaId={params.sala} />
          )}

          {sezioneAttiva === "servizi" && (
            <Servizi salaId={params.sala} />
          )}

          {sezioneAttiva === "manuale" && (
            <ManualeOperativo salaId={params.sala} />
          )}

        </div>
      </div>
    </div>
  );
}