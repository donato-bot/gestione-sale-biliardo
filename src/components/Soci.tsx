"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";

export default function Soci({ salaId }: { salaId: string }) {
  const [soci, setSoci] = useState<any[]>([]);
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Stati per la Modifica
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    fetchSoci();
  }, [salaId]);

  async function fetchSoci() {
    if (!salaId) return;
    const { data, error } = await supabase
      .from("soci")
      .select("*")
      .eq("sala_id", salaId)
      .order("cognome", { ascending: true });

    if (error) {
      console.error("Errore caricamento soci:", error.message);
    } else if (data) {
      setSoci(data);
    }
  }

  const handleAggiungiSocio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !cognome) return alert("Nome e Cognome sono obbligatori");
    setLoading(true);

    // Recupera la mail del manager dal database (se serve) o usa quella della sessione
    const { data: userAuth } = await supabase.auth.getUser();
    const managerEmail = userAuth.user?.email || "donato.sviluppo@libero.it"; // Fallback di sicurezza

    const { error } = await supabase.from("soci").insert([
      {
        sala_id: salaId,
        manager_email: managerEmail,
        nome: nome.trim().toUpperCase(),
        cognome: cognome.trim().toUpperCase(),
        telefono: telefono.trim(),
        email: email.trim().toLowerCase(),
        credito: 0.0,
      },
    ]);

    setLoading(false);
    if (error) {
      alert("ERRORE: " + error.message);
    } else {
      setNome("");
      setCognome("");
      setTelefono("");
      setEmail("");
      fetchSoci();
    }
  };

  // ==========================================
  // AZIONI CRUD: ELIMINA E MODIFICA
  // ==========================================
  
  const handleElimina = async (id: string, nomeCompleto: string) => {
    if (!window.confirm(`Sei sicuro di voler eliminare definitivamente il socio ${nomeCompleto}? Questa azione non può essere annullata.`)) {
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.from("soci").delete().eq("id", id);
    
    if (error) {
      alert("ERRORE DURANTE L'ELIMINAZIONE: " + error.message);
    } else {
      fetchSoci();
    }
    setLoading(false);
  };

  const apriModifica = (socio: any) => {
    setEditForm({
      id: socio.id,
      nome: socio.nome,
      cognome: socio.cognome,
      telefono: socio.telefono || "",
      email: socio.email || "",
      credito: socio.credito || 0
    });
    setShowEditModal(true);
  };

  const handleSalvaModifiche = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("soci")
      .update({
        nome: editForm.nome.trim().toUpperCase(),
        cognome: editForm.cognome.trim().toUpperCase(),
        telefono: editForm.telefono.trim(),
        email: editForm.email.trim().toLowerCase(),
        credito: parseFloat(editForm.credito)
      })
      .eq("id", editForm.id);

    setLoading(false);
    if (error) {
      alert("ERRORE DURANTE LA MODIFICA: " + error.message);
    } else {
      setShowEditModal(false);
      fetchSoci();
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] p-6 text-white font-sans">
      
      {/* MODALE DI MODIFICA SOCIO */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0B0D14] border border-[#2A2E39] p-8 rounded-[2rem] w-full max-w-md shadow-2xl">
            <h3 className="text-[#00E5FF] font-black uppercase tracking-widest text-lg mb-6 border-b border-[#2A2E39] pb-4">✏️ Modifica Anagrafica</h3>
            <form onSubmit={handleSalvaModifiche} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Nome</label>
                  <input className="w-full bg-[#1A1D24] text-white font-bold p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#00E5FF] uppercase" value={editForm.nome} onChange={(e) => setEditForm({...editForm, nome: e.target.value})} required />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Cognome</label>
                  <input className="w-full bg-[#1A1D24] text-white font-bold p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#00E5FF] uppercase" value={editForm.cognome} onChange={(e) => setEditForm({...editForm, cognome: e.target.value})} required />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Telefono</label>
                <input type="tel" className="w-full bg-[#1A1D24] text-white font-bold p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#00E5FF]" value={editForm.telefono} onChange={(e) => setEditForm({...editForm, telefono: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Email (Login AppWeb)</label>
                <input type="email" className="w-full bg-[#1A1D24] text-white font-bold p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#00E5FF] lowercase" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Credito (€)</label>
                <input type="number" step="0.01" className="w-full bg-[#1A1D24] text-[#00E676] font-black text-xl p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#00E5FF]" value={editForm.credito} onChange={(e) => setEditForm({...editForm, credito: e.target.value})} required />
              </div>

              <div className="flex gap-4 pt-4 mt-6 border-t border-[#2A2E39]">
                <button type="button" onClick={() => setShowEditModal(false)} className="w-1/3 bg-[#1A1D24] hover:bg-[#2A2E39] text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs">Annulla</button>
                <button type="submit" disabled={loading} className="w-2/3 bg-[#00E5FF] hover:bg-[#00ADC6] text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs active:scale-95">{loading ? "Salvataggio..." : "Salva Modifiche"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STRUTTURA PRINCIPALE (Senza il doppio pulsante Indietro) */}
      <div className="max-w-7xl mx-auto bg-[#0B0D14] rounded-[2rem] border border-[#1E222B] p-8 shadow-2xl">
        <div className="flex justify-between items-start mb-10 border-b border-[#1E222B] pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight flex items-center gap-3">
              <span className="text-[#8B5CF6]">👥</span> ANAGRAFICA SOCI
            </h1>
            <p className="text-gray-400 text-sm font-bold mt-2">Registro e Tesseramento Membri</p>
          </div>
          <div className="bg-[#1A1D24] border border-[#2A2E39] rounded-xl p-4 text-center min-w-[120px]">
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Totale Iscritti</p>
            <p className="text-3xl font-black text-[#00E676]">{soci.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLONNA SINISTRA: FORM INSERIMENTO */}
          <div className="lg:col-span-4 bg-[#1A1D24] border border-[#2A2E39] rounded-[2rem] p-6 h-fit sticky top-6">
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-white border-b border-gray-800 pb-4">Nuova Tessera</h3>
            
            <form onSubmit={handleAggiungiSocio} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Nome *</label>
                  <input type="text" className="w-full bg-black text-white font-bold p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#00E676] uppercase" placeholder="Es. Mario" value={nome} onChange={(e) => setNome(e.target.value)} required />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Cognome *</label>
                  <input type="text" className="w-full bg-black text-white font-bold p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#00E676] uppercase" placeholder="Es. Rossi" value={cognome} onChange={(e) => setCognome(e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Telefono</label>
                <input type="tel" className="w-full bg-black text-white font-bold p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#00E676]" placeholder="Es. 3331234567" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Email (Per Login App)</label>
                <input type="email" className="w-full bg-black text-white font-bold p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#00E676] lowercase" placeholder="Es. mario@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              
              <button type="submit" disabled={loading} className="w-full bg-[#00E676] hover:bg-[#00C853] text-black py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 mt-4 flex items-center justify-center gap-2">
                {loading ? "Elaborazione..." : "🪪 Rilascia Tessera"}
              </button>
            </form>
          </div>

          {/* COLONNA DESTRA: TABELLA ISCRITTI */}
          <div className="lg:col-span-8 bg-[#1A1D24] border border-[#2A2E39] rounded-[2rem] overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/50 border-b border-[#2A2E39]">
                    <th className="p-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Cognome e Nome</th>
                    <th className="p-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Telefono</th>
                    <th className="p-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Email</th>
                    <th className="p-4 text-[10px] text-gray-500 font-black uppercase tracking-widest text-center">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2E39]">
                  {soci.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">Nessun socio registrato</td>
                    </tr>
                  ) : (
                    soci.map((s) => (
                      <tr key={s.id} className="hover:bg-[#2A2E39]/30 transition-colors group">
                        <td className="p-4 font-black text-sm text-white uppercase">{s.cognome} {s.nome}</td>
                        <td className="p-4 text-xs text-gray-400 font-bold">{s.telefono || "-"}</td>
                        <td className="p-4 text-xs text-gray-400 font-bold lowercase">{s.email || "-"}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => apriModifica(s)} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors title='Modifica'" >
                              ✏️
                            </button>
                            <button onClick={() => handleElimina(s.id, `${s.cognome} ${s.nome}`)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors title='Elimina'" >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}