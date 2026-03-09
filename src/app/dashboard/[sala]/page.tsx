"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useParams } from "next/navigation";

export default function DashboardSala() {
  const params = useParams();
  const salaSlug = params?.sala as string; // Prende il nome dalla cartella [sala]
  
  const [iscritti, setIscritti] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchIscritti() {
      if (!salaSlug) return;
      
      // RECUPERA SOLO GLI ISCRITTI DI QUESTA SALA SPECIFICA
      const { data, error } = await supabase
        .from("iscrizioni")
        .select("*")
        .eq("sala_slug", salaSlug) 
        .order("created_at", { ascending: false });

      if (!error) {
        setIscritti(data || []);
      }
      setLoading(false);
    }

    fetchIscritti();
    
    // Sistema di aggiornamento in tempo reale (Realtime)
    const channel = supabase
      .channel("schema-db-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "iscrizioni" }, 
      (payload) => {
        if (payload.new.sala_slug === salaSlug) {
          setIscritti((prev) => [payload.new, ...prev]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [salaSlug]);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-blue-500 mb-6 uppercase">
        Tabellone Iscritti: <span className="text-white">{salaSlug}</span>
      </h1>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-gray-800 text-blue-400 uppercase text-sm">
            <tr>
              <th className="p-4">Giocatore</th>
              <th className="p-4">Data/Ora</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4">Caricamento radar...</td></tr>
            ) : iscritti.length > 0 ? (
              iscritti.map((i) => (
                <tr key={i.id} className="border-t border-gray-800 hover:bg-gray-850">
                  <td className="p-4 font-bold">{i.nome_giocatore}</td>
                  <td className="p-4 text-gray-500">
                    {new Date(i.created_at).toLocaleString("it-IT")}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td className="p-4 text-gray-500 italic">Nessun iscritto al momento.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}