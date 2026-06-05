"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from "next/navigation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function TorreDiControllo() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sale, setSale] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nomeSala, setNomeSala] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [credenzialiGenerate, setCredenzialiGenerate] = useState<{email: string, pass: string} | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session || data.session.user.email !== 'donatorzz1946@gmail.com') {
          window.location.href = '/login';
          return;
        }
        setUserEmail(data.session.user.email);
        await caricaSale();
      } catch (err) {
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function caricaSale() {
    const { data } = await supabase.from('sale').select('*');
    if (data) setSale(data);
  }

  const handleCreaSala = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const passwordProvvisoria = "Gestore-" + Math.random().toString(36).slice(-6) + "!";
      
      const resApi = await fetch('/api/crea-gestore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: managerEmail.trim(), password: passwordProvvisoria })
      });

      if (!resApi.ok) throw new Error("Errore creazione utente");

      await supabase.from('sale').insert([{ 
        name: nomeSala.trim(), 
        manager_email: managerEmail.trim(), 
        scadenza_contributo: '2026-12-31', 
        is_active: true 
      }]);

      await caricaSale();
      setCredenzialiGenerate({ email: managerEmail.trim(), pass: passwordProvvisoria });
      setNomeSala(""); setManagerEmail("");
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const eliminaSala = async (salaId: string, nomeSala: string) => {
    if (window.confirm(`Eliminare definitivamente la sala "${nomeSala}"?`)) {
      await supabase.from('sale').delete().eq('id', salaId);
      await caricaSale();
    }
  };

  const toggleStatoSala = async (salaId: string, statoAttuale: boolean) => {
    await supabase.from('sale').update({ is_active: !statoAttuale }).eq('id', salaId);
    await caricaSale();
  };

  const scaricaPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    doc.text("Report Flotta Sale", 14, 20);
    autoTable(doc, { 
      head: [['Nome Sala', 'Email Gestore', 'Stato']], 
      body: sale.map(s => [s.name, s.manager_email, s.is_active ? 'ONLINE' : 'OFFLINE']) 
    });
    doc.save("Report_Flotta.pdf");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (loading) return <div className="min-h-screen bg-black text-white p-10">Sincronizzazione...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <div className="flex flex-col xl:flex-row justify-between items-center mb-10 gap-6 border-b border-gray-800 pb-8">
        <h1 className="text-5xl font-black text-red-500 italic tracking-tighter">TORRE DI CONTROLLO</h1>
        
        <div className="flex flex-wrap gap-4 items-center">
          <button onClick={scaricaPDF} className="bg-gray-800 hover:bg-gray-700 px-6 py-4 rounded-xl font-bold transition-all flex items-center gap-2">
            📥 PDF
          </button>
          
          <button onClick={() => setIsModalOpen(true)} className="bg-red-600 hover:bg-red-500 px-8 py-4 rounded-xl font-black transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)]">
            + VARA NUOVA SALA
          </button>
          
          {/* SEPARATORE VISIVO */}
          <div className="w-px h-12 bg-gray-700 mx-2 hidden md:block"></div> 
          
          {/* NUOVO TASTO ESCI ISOLATO E MARCATO */}
          <button onClick={handleLogout} className="bg-black border-2 border-red-600 text-red-500 hover:bg-red-900/30 px-8 py-4 rounded-xl font-black uppercase transition-all flex items-center gap-2">
            🚪 ESCI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sale.map((s) => (
          <div key={s.id} className="border-2 border-gray-800 p-6 rounded-3xl bg-gray-950 shadow-xl relative overflow-hidden">
            <h2 className="text-2xl font-black mb-2 text-white">{s.name}</h2>
            <p className="text-gray-500 font-mono text-sm mb-6">{s.manager_email}</p>
            <div className="flex gap-3">
              <button onClick={() => toggleStatoSala(s.id, s.is_active)} className={`${s.is_active ? 'bg-gray-800 hover:bg-gray-700' : 'bg-green-900 hover:bg-green-800'} px-6 py-3 rounded-xl text-sm font-bold transition-all`}>
                {s.is_active ? 'Sospendi' : 'Riattiva'}
              </button>
              <button onClick={() => eliminaSala(s.id, s.name)} className="bg-red-950/50 border border-red-900 text-red-400 hover:bg-red-900 hover:text-white px-6 py-3 rounded-xl text-sm font-bold transition-all">
                Elimina
              </button>
            </div>
            
            {/* SPIA LUMINOSA STATO SALA */}
            <div className={`absolute top-6 right-6 w-4 h-4 rounded-full ${s.is_active ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-red-600'}`}></div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-950 p-10 rounded-[2rem] border-2 border-red-800 w-full max-w-md shadow-2xl">
            <h2 className="text-3xl font-black mb-8 italic uppercase tracking-tighter">Vara Nuova Sala</h2>
            {credenzialiGenerate ? (
              <div className="text-green-400 mb-6 p-6 bg-green-950/30 rounded-2xl border border-green-800">
                <p className="font-black text-sm uppercase tracking-widest text-green-600 mb-4">Credenziali generate:</p>
                <p className="font-mono text-lg mb-2">{credenzialiGenerate.email}</p>
                <p className="font-mono text-xl text-white bg-black p-3 rounded-xl border border-green-900">{credenzialiGenerate.pass}</p>
              </div>
            ) : (
              <form onSubmit={handleCreaSala}>
                {formError && <p className="text-red-500 mb-6 font-bold bg-red-950/50 p-4 rounded-xl border border-red-900">⚠️ {formError}</p>}
                
                <label className="text-gray-500 font-black uppercase text-xs tracking-widest ml-4 mb-2 block">Nome Sala</label>
                <input className="w-full bg-black p-4 mb-6 rounded-2xl border border-gray-700 outline-none focus:border-red-500 text-lg transition-colors" value={nomeSala} onChange={(e) => setNomeSala(e.target.value)} required />
                
                <label className="text-gray-500 font-black uppercase text-xs tracking-widest ml-4 mb-2 block">Email Gestore</label>
                <input className="w-full bg-black p-4 mb-8 rounded-2xl border border-gray-700 outline-none focus:border-red-500 text-lg transition-colors" type="email" value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} required />
                
                <button className={`w-full p-5 rounded-2xl font-black text-lg uppercase transition-all ${isSubmitting ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)]'}`} disabled={isSubmitting}>
                  {isSubmitting ? 'Costruzione...' : 'Vara Ora'}
                </button>
              </form>
            )}
            <button className="mt-6 w-full text-gray-600 hover:text-white transition-colors uppercase text-sm font-black tracking-widest" onClick={() => { setIsModalOpen(false); setCredenzialiGenerate(null); }}>Annulla e Chiudi</button>
          </div>
        </div>
      )}
    </div>
  );
}