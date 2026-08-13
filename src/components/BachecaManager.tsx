// ==========================================
// FILE: src/components/BachecaManager.tsx
// OBIETTIVO: Gestione News e Annunci per i Soci (Design Premium)
// ==========================================
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../app/lib/supabase";

interface Reazione {
  tipo: string;
}

interface PostBacheca {
  id: string;
  sala_id: string;
  testo: string;
  created_at: string;
  reazioni_bacheca: Reazione[];
}

export default function BachecaManager(props: any) {
  // Gestione flessibile del salaId (tramite props o URL)
  const [salaId, setSalaId] = useState<string | null>(props.salaId || props.id || null);
  
  const [posts, setPosts] = useState<PostBacheca[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [nuovoTesto, setNuovoTesto] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  // Recupera il salaId dall'URL se non viene passato come prop
  useEffect(() => {
    if (!salaId && typeof window !== "undefined") {
      const pathArray = window.location.pathname.split("/");
      const urlId = pathArray[pathArray.length - 1];
      if (urlId && urlId.length > 10) setSalaId(urlId);
    }
  }, [salaId]);

  const caricaBacheca = useCallback(async () => {
    if (!salaId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bacheca")
        .select("*, reazioni_bacheca(tipo)")
        .eq("sala_id", salaId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setPosts(data);
    } catch (err: any) {
      console.error("Errore caricamento bacheca:", err.message);
    } finally {
      setLoading(false);
    }
  }, [salaId]);

  useEffect(() => {
    caricaBacheca();
  }, [caricaBacheca]);

  const handlePubblica = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuovoTesto.trim() || !salaId) return;

    setIsPublishing(true);
    try {
      const { error } = await supabase.from("bacheca").insert([{
        sala_id: salaId,
        testo: nuovoTesto.trim()
      }]);

      if (error) throw error;
      
      setNuovoTesto("");
      await caricaBacheca();
      alert("📢 Annuncio pubblicato con successo in App!");
      
    } catch (error: any) {
      alert("Errore durante la pubblicazione: " + error.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleEliminaPost = async (id: string) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo annuncio? Sparirà dall'App dei soci.")) return;
    
    try {
      const { error } = await supabase.from("bacheca").delete().eq("id", id);
      if (error) throw error;
      
      // Aggiorna la lista rimuovendo il post eliminato
      setPosts(posts.filter(p => p.id !== id));
    } catch (error: any) {
      alert("Errore eliminazione: " + error.message);
    }
  };

  const formattaDataOra = (dataIso: string) => {
    const date = new Date(dataIso);
    return date.toLocaleDateString('it-IT') + " alle " + date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  // Funzione per contare quante volte compare una specifica emoji nelle reazioni
  const contaReazioni = (reazioni: Reazione[], emoji: string) => {
    if (!reazioni) return 0;
    return reazioni.filter(r => r.tipo === emoji).length;
  };

  if (loading) return <div className="text-center p-10 text-indigo-500 font-black uppercase tracking-widest animate-pulse">Sincronizzazione Bacheca...</div>;

  return (
    <div className="space-y-8">
      
      {/* HEADER BACHECA */}
      <div className="bg-[#111827] border border-gray-700/70 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-4 border-l-4 border-l-indigo-500">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-widest text-white flex items-center gap-3">
            <span className="text-3xl">📢</span> Bacheca del Club
          </h2>
          <p className="text-gray-400 text-xs mt-1 uppercase font-bold tracking-widest">
            Comunica in tempo reale con tutti i soci tesserati.
          </p>
        </div>
        <div className="bg-[#0b0e14] border border-indigo-900/50 px-6 py-3 rounded-xl shadow-inner text-center">
          <span className="block text-2xl font-black text-indigo-400">{posts.length}</span>
          <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Annunci Attivi</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ZONA SCRITTURA (Form) */}
        <div className="lg:col-span-1">
          <div className="bg-[#111827] border border-gray-700/70 border-t-4 border-t-indigo-500 rounded-2xl shadow-2xl p-6 sticky top-6">
            <h3 className="text-lg font-black uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
              ✏️ Scrivi Annuncio
            </h3>
            
            <form onSubmit={handlePubblica} className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Testo del Messaggio *</label>
                <textarea 
                  required
                  rows={6}
                  placeholder="Es. Il torneo sociale inizierà il 15 Settembre! Iscrizioni aperte..."
                  value={nuovoTesto} 
                  onChange={(e) => setNuovoTesto(e.target.value)} 
                  className="w-full bg-[#1e293b] border-2 border-gray-700 p-4 rounded-xl text-white font-medium text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none custom-scrollbar shadow-inner"
                />
              </div>

              <div className="bg-indigo-900/20 border border-indigo-900/50 p-4 rounded-xl">
                <p className="text-[10px] text-indigo-300 uppercase font-black tracking-widest leading-relaxed">
                  ⚠️ Attenzione: Cliccando su "Pubblica", il messaggio sarà immediatamente visibile sull'App di tutti i soci registrati.
                </p>
              </div>

              <button 
                type="submit" 
                disabled={isPublishing || !nuovoTesto.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-black uppercase tracking-widest py-4 rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:shadow-none mt-2 active:scale-95"
              >
                {isPublishing ? "TRASMISSIONE IN CORSO..." : "🚀 PUBBLICA ORA"}
              </button>
            </form>
          </div>
        </div>

        {/* FEED DEI POST PUBBLICATI */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="bg-[#111827] border border-gray-700/70 border-dashed rounded-2xl p-16 text-center shadow-xl">
                <span className="text-5xl opacity-50 mb-4 block">📭</span>
                <p className="text-gray-400 font-black uppercase tracking-widest mb-2 text-sm">Nessun annuncio in bacheca.</p>
                <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">Rompi il ghiaccio scrivendo il primo messaggio!</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-[#111827] border border-gray-700/70 rounded-2xl shadow-xl overflow-hidden transition-all hover:border-indigo-500/30">
                  
                  {/* Testata Post */}
                  <div className="bg-[#0b0e14]/80 p-4 border-b border-gray-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center border border-indigo-400/50 shadow-md">
                        <span className="text-white text-xs font-black">Tu</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                          Inviato il {formattaDataOra(post.created_at)}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleEliminaPost(post.id)}
                      className="text-gray-600 hover:text-red-500 transition-colors bg-gray-900 hover:bg-red-900/20 px-3 py-1.5 rounded border border-gray-800 hover:border-red-900/50 text-[10px] font-black uppercase tracking-widest"
                      title="Rimuovi post"
                    >
                      ✖ Elimina
                    </button>
                  </div>
                  
                  {/* Corpo del Messaggio */}
                  <div className="p-6">
                    <p className="text-white text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                      {post.testo}
                    </p>
                  </div>
                  
                  {/* Piè di pagina: Contatore Reazioni */}
                  <div className="bg-[#1e293b]/50 p-4 border-t border-gray-800 flex items-center gap-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mr-2">Reazioni dei Soci:</p>
                    
                    <div className="flex gap-3">
                      <span className="bg-black/50 border border-gray-700 px-3 py-1.5 rounded-full text-xs font-bold text-gray-300 flex items-center gap-2">
                        👍 <span className="text-indigo-400">{contaReazioni(post.reazioni_bacheca, '👍')}</span>
                      </span>
                      <span className="bg-black/50 border border-gray-700 px-3 py-1.5 rounded-full text-xs font-bold text-gray-300 flex items-center gap-2">
                        ❤️ <span className="text-pink-400">{contaReazioni(post.reazioni_bacheca, '❤️')}</span>
                      </span>
                      <span className="bg-black/50 border border-gray-700 px-3 py-1.5 rounded-full text-xs font-bold text-gray-300 flex items-center gap-2">
                        🔥 <span className="text-amber-400">{contaReazioni(post.reazioni_bacheca, '🔥')}</span>
                      </span>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}