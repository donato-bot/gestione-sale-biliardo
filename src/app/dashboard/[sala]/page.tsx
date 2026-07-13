"use client";

import { useState, useEffect } from 'react';
import { supabase } from "@/app/lib/supabase";
import { useParams, useRouter } from 'next/navigation';

export default function TorneiPage() {
  const router = useRouter();
  const params = useParams();
  const salaId = params.sala as string;

  const [tornei, setTornei] = useState<any[]>([]);
  const [inCaricamento, setInCaricamento] = useState(true);
  const [mostraModal, setMostraModal] = useState(false);
  
  // STATO INIZIALE AGGIORNATO CON BILIARDI E DURATA
  const [formData, setFormData] = useState({
    titolo: '',
    data_inizio: '',
    specialita: 'Italiana/5 birilli',
    formato: 'eliminazione_diretta',
    max_partecipanti: 16,
    quota_iscrizione: 0,
    numero_biliardi: 4,
    durata_media: 60,
    con_handicap: false
  });

  useEffect(() => {
    caricaTornei();
  }, [salaId]);

  async function caricaTornei() {
    setInCaricamento(true);
    const { data } = await supabase.from('tornei').select('*').eq('sala_id', salaId).order('created_at', { ascending: false });
    setTornei(data || []);
    setInCaricamento(false);
  }

  const handleSalva = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('tornei').insert([{ sala_id: salaId, ...formData, stato: 'programmato' }]);

    if (error) alert("Errore salvataggio bando: " + error.message);
    else {
      setMostraModal(false);
      setFormData({ titolo: '', data_inizio: '', specialita: 'Italiana/5 birilli', formato: 'eliminazione_diretta', max_partecipanti: 16, quota_iscrizione: 0, numero_biliardi: 4, durata_media: 60, con_handicap: false });
      caricaTornei();
    }
  };

  const eliminaTorneo = async (idTorneo: string) => {
    if (!confirm("Sei sicuro di voler eliminare definitivamente questo Bando?")) return;
    const { error } = await supabase.from('tornei').delete().eq('id', idTorneo);
    if (error) alert("Errore: " + error.message); else caricaTornei();
  };

  return (
    <div className="min-h-screen bg-[#050505] p-8 text-white font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-12 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-4xl font-black italic uppercase text-white tracking-tight">Bandi e Tornei</h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">Pianifica gli eventi e gestisci le iscrizioni</p>
          </div>
          <button onClick={() => setMostraModal(true)} className="bg-cyan-600 hover:bg-cyan-500 text-black px-8 py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-cyan-900/50">+ Pubblica Nuovo Bando</button>
        </div>

        {inCaricamento ? (<div className="text-cyan-500 font-black animate-pulse uppercase tracking-widest text-center py-20">Analisi Archivi...</div>) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tornei.map((t) => (
              <div key={t.id} className="bg-[#0f1117] p-6 rounded-3xl border border-gray-800 shadow-xl flex flex-col justify-between group hover:border-cyan-900 transition-colors">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-black uppercase pr-4 leading-tight">{t.titolo}</h3>
                    <button onClick={() => eliminaTorneo(t.id)} className="text-[10px] text-red-500 hover:text-red-400 font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity mt-1 bg-red-950/30 px-2 py-1 rounded">Elimina</button>
                  </div>
                  <div className="space-y-2 mb-6">
                    <p className="text-cyan-500 text-[10px] font-black uppercase tracking-widest">{t.specialita}</p>
                    {t.data_inizio && <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">🗓 Inizio: {new Date(t.data_inizio).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}</p>}
                    <div className="flex gap-4 text-[10px] uppercase font-bold text-gray-400 pt-2 border-t border-gray-800 mt-2">
                      <span>Tavoli: <span className="text-white">{t.numero_biliardi || 4}</span></span>
                      <span>Quota: <span className="text-emerald-400">€ {t.quota_iscrizione || 0}</span></span>
                    </div>
                  </div>
                </div>
                <button onClick={() => router.push(`/dashboard/${salaId}/tornei/${t.id}`)} className="w-full bg-gray-900 border border-gray-700 hover:border-cyan-500 hover:bg-cyan-950/30 text-cyan-400 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all">Gestisci Bando →</button>
              </div>
            ))}
            {tornei.length === 0 && <div className="col-span-full text-center py-20 text-gray-600 font-black uppercase border-2 border-dashed border-gray-800 rounded-3xl">Nessun bando di torneo pubblicato.</div>}
          </div>
        )}
      </div>

      {mostraModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#11131a] p-8 rounded-3xl w-full max-w-2xl border border-gray-800 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black uppercase mb-8 border-b border-gray-800 pb-4 text-cyan-500">Pubblicazione Bando</h2>
            <form onSubmit={handleSalva} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2"><label className="block text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Titolo</label><input required className="w-full bg-black border border-gray-800 rounded-xl p-4 font-bold text-white focus:border-cyan-500 outline-none" value={formData.titolo} onChange={(e) => setFormData({...formData, titolo: e.target.value})} /></div>
                <div className="md:col-span-2"><label className="block text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Data Inizio</label><input type="datetime-local" required className="w-full bg-black border border-gray-800 rounded-xl p-4 font-bold text-white focus:border-cyan-500 outline-none" value={formData.data_inizio} onChange={(e) => setFormData({...formData, data_inizio: e.target.value})} /></div>
                
                {/* NUOVI CAMPI ALGORITMO */}
                <div><label className="block text-[10px] font-black uppercase text-emerald-500 mb-2 tracking-widest">N. Biliardi Dedicati</label><input type="number" required min="1" className="w-full bg-[#0f1117] border border-gray-800 rounded-xl p-4 font-bold text-emerald-400 focus:border-emerald-500 outline-none" value={formData.numero_biliardi} onChange={(e) => setFormData({...formData, numero_biliardi: parseInt(e.target.value) || 1})} /></div>
                <div><label className="block text-[10px] font-black uppercase text-emerald-500 mb-2 tracking-widest">Durata Media (Minuti)</label><input type="number" required min="10" className="w-full bg-[#0f1117] border border-gray-800 rounded-xl p-4 font-bold text-emerald-400 focus:border-emerald-500 outline-none" value={formData.durata_media} onChange={(e) => setFormData({...formData, durata_media: parseInt(e.target.value) || 60})} /></div>
                
                <div><label className="block text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Max Partecipanti</label><input type="number" required min="2" step="2" className="w-full bg-black border border-gray-800 rounded-xl p-4 font-bold text-white focus:border-cyan-500 outline-none" value={formData.max_partecipanti} onChange={(e) => setFormData({...formData, max_partecipanti: parseInt(e.target.value)})} /></div>
                <div><label className="block text-[10px] font-black uppercase text-cyan-500 mb-2 tracking-widest">Quota Iscrizione (€)</label><input type="number" required min="0" className="w-full bg-cyan-950/20 border border-cyan-900/50 rounded-xl p-4 font-bold text-cyan-400 focus:border-cyan-500 outline-none" value={formData.quota_iscrizione} onChange={(e) => setFormData({...formData, quota_iscrizione: parseInt(e.target.value) || 0})} /></div>
              </div>
              <div className="flex gap-4 mt-8 pt-6 border-t border-gray-800">
                <button type="button" onClick={() => setMostraModal(false)} className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-black uppercase text-xs tracking-widest">Annulla</button>
                <button type="submit" className="flex-1 py-4 bg-cyan-600 hover:bg-cyan-500 text-black rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-cyan-900/50">Pubblica Bando</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
