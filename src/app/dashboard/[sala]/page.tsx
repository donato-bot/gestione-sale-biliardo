"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../app/lib/supabase";

// Importazione di TUTTI i moduli esistenti
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

  if (sezioneAttiva === "hub") {
    return (
      /* SFONDO CHIARO: Grigio Perla ad alto contrasto con testo scuro */
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-slate-100 to-slate-300 text-slate-900 p-4 sm:p-8 flex flex-col justify-between">
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

  return (
    <div className="min-h-screen bg-[#05070a] text-white font-sans selection:bg-cyan-500/30 flex justify-center p-4 sm:p-8">
      {/* Contenitore Operativo Full-Screen, senza barra superiore */}
      <div className="bg-[#0b0d14] w-full max-w-[1800px] min-h-[800px] rounded-[2rem] border border-gray-800/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in duration-300 p-6 sm:p-10">
        
        {sezioneAttiva === "plancia" && <Plancia salaId={params.sala} userRole="gestore" setActiveView={setSezioneAttiva} />}
        {sezioneAttiva === "bacheca" && <BachecaGestore salaId={params.sala} setActiveView={setSezioneAttiva} />}
        {sezioneAttiva === "soci" && <Soci salaId={params.sala} setActiveView={setSezioneAttiva} />}
        {sezioneAttiva === "magazzino" && <Magazzino salaId={params.sala} setActiveView={setSezioneAttiva} />}
        {sezioneAttiva === "report" && <Cassa salaId={params.sala} setActiveView={setSezioneAttiva} />}
        {sezioneAttiva === "prenotazioni" && <Prenotazioni salaId={params.sala} setActiveView={setSezioneAttiva} />}
        {sezioneAttiva === "tornei" && <Tornei salaId={params.sala} setActiveView={setSezioneAttiva} />}
        {sezioneAttiva === "staff" && <Staff salaId={params.sala} setActiveView={setSezioneAttiva} />}
        {sezioneAttiva === "impostazioni" && <Impostazioni salaId={params.sala} setActiveView={setSezioneAttiva} />}
        {sezioneAttiva === "servizi" && <Servizi salaId={params.sala} setActiveView={setSezioneAttiva} />}
        {sezioneAttiva === "manuale" && <ManualeOperativo salaId={params.sala} setActiveView={setSezioneAttiva} />}

      </div>
    </div>
  );
}