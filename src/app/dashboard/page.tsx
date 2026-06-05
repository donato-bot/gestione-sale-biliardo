"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Componente Timer
const TempoTrascorso = ({ startTime }: { startTime: string | null }) => {
  const [minuti, setMinuti] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    
    const calcolaDifferenza = () => {
      const diff = new Date().getTime() - new Date(startTime).getTime();
      setMinuti(Math.floor(diff / 60000));
    };

    calcolaDifferenza(); 
    const interval = setInterval(calcolaDifferenza, 1000);
    
    return () => clearInterval(interval);
  }, [startTime]);

  return startTime ? (
    <div className="mt-4 font-mono text-3xl text-yellow-400 font-black tracking-widest bg-black p-2 rounded-lg border border-yellow-900 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
      {minuti} min
    </div>
  ) : null;
};

export default function DashboardSala() {
  const [sala, setSala] = useState<any>(null);
  const [tavoli, setTavoli] = useState<any[]>([]);
  const [numTavoliDaCreare, setNumTavoliDaCreare] = useState("");
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Stati per la finestra di modifica
  const [tavoloInModifica, setTavoloInModifica] = useState<any>(null);
  const [editNome, setEditNome] = useState("");
  const [editTariffa, setEditTariffa] = useState("");
  const [editStato, setEditStato] = useState("");

  // Stato per lo scontrino di fine partita
  const [scontrino, setScontrino] = useState<any>(null);

  // Stati per il Registro Incassi
  const [isRegistroOpen, setIsRegistroOpen] = useState(false);
  const [ricevute, setRicevute] = useState<any[]>([]);
  const [totaleIncassi, setTotaleIncassi] = useState(0);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }
      
      setUserEmail(user.email || null);

      const { data: salaData } = await supabase.from('sale').select('*').eq('manager_email', user.email).maybeSingle();
      
      if (salaData) {
        setSala(salaData);
        await caricaTavoli(salaData.id);
      } else if (user.email === 'donatorzz1946@gmail.com') {
        setSala({ name: "SALA CAMPIONE (NESSUN ID)", id: null });
      }
      setLoading(false);
    }
    init();
  }, []);

  async function caricaTavoli(salaId: string) {
    if (!salaId) return;
    const { data } = await supabase.from('tavoli').select('*').eq('sala_id', salaId).order('numero_tavolo');
    if (data) setTavoli(data);
  }

  // VARO IN BLOCCO
  const varaSala = async () => {
    if (!sala || !sala.id) {
       alert("Attenzione: Sei loggato come Super Admin. Usa l'email di un Gestore per creare i tavoli.");
       return;
    }

    const n = parseInt(numTavoliDaCreare);
    if (isNaN(n) || n <= 0) return;

    const nuoviTavoli = Array.from({ length: n }, (_, i) => ({
      sala_id: sala.id,
      numero_tavolo: i + 1,
      nome_tavolo: `Tavolo ${i + 1}`,
      stato: 'libero',
      tariffa_oraria: 10.00
    }));

    const { error } = await supabase.from('tavoli').insert(nuoviTavoli);
    if (error) {
       alert("Errore dal database: " + error.message);
       return;
    }

    await caricaTavoli(sala.id);
    setNumTavoliDaCreare(""); 
  };

  const toggleStatoTavolo = async (tavolo: any) => {
    if (tavolo.stato === 'manutenzione') {
      alert("Il tavolo è in manutenzione. Modifica lo stato dal pannello di configurazione prima di avviarlo.");
      return;
    }

    if (tavolo.stato === 'occupato') {
      // LOGICA DI CHECKOUT (SCONTRINO)
      const now = new Date();
      const start = new Date(tavolo.start_time);
      const diffMs = now.getTime() - start.getTime();
      const minutiGiocati = Math.floor(diffMs / 60000);
      
      const tariffaAlMinuto = tavolo.tariffa_oraria / 60;
      const totale = (tariffaAlMinuto * minutiGiocati).toFixed(2);

      setScontrino({
        ...tavolo,
        minutiGiocati,
        totale
      });
      return; 
    }
    
    // Avvio partita
    await supabase
      .from('tavoli')
      .update({ 
        stato: 'occupato',
        start_time: new Date().toISOString() 
      })
      .eq('id', tavolo.id);
      
    await caricaTavoli(sala.id);
  };

  const confermaIncasso = async () => {
    if (!scontrino) return;
    
    // REGISTRAZIONE NELLA SCATOLA NERA
    const { error: erroreRicevuta } = await supabase.from('ricevute').insert([{
      sala_id: scontrino.sala_id,
      tavolo_nome: scontrino.nome_tavolo,
      inizio_partita: scontrino.start_time,
      minuti_giocati: scontrino.minutiGiocati,
      importo_incassato: parseFloat(scontrino.totale)
    }]);

    if (erroreRicevuta) {
      alert("Attenzione: Impossibile salvare l'incasso nel database. Verifica la connessione.");
      return; 
    }

    // RIPRISTINO TAVOLO
    await supabase
      .from('tavoli')
      .update({ 
        stato: 'libero',
        start_time: null 
      })
      .eq('id', scontrino.id);
      
    setScontrino(null);
    await caricaTavoli(sala.id);
  };

  // LOGICA MODIFICA TAVOLO
  const apriModifica = (tavolo: any) => {
    setTavoloInModifica(tavolo);
    setEditNome(tavolo.nome_tavolo || "");
    setEditTariffa(tavolo.tariffa_oraria?.toString() || "10.00");
    setEditStato(tavolo.stato || "libero");
  };

  const salvaModifiche = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tavoloInModifica) return;

    const { error } = await supabase
      .from('tavoli')
      .update({
        nome_tavolo: editNome,
        tariffa_oraria: parseFloat(editTariffa),
        stato: editStato
      })
      .eq('id', tavoloInModifica.id);

    if (error) {
      alert("Errore salvataggio: " + error.message);
      return;
    }

    setTavoloInModifica(null);
    await caricaTavoli(sala.id);
  };

  // LOGICA REGISTRO INCASSI
  const apriRegistro = async () => {
    if (!sala || !sala.id) return;
    
    const { data } = await supabase
      .from('ricevute')
      .select('*')
      .eq('sala_id', sala.id)
      .order('fine_partita', { ascending: false });

    if (data) {
      setRicevute(data);
      const totale = data.reduce((acc, curr) => acc + Number(curr.importo_incassato), 0);
      setTotaleIncassi(totale);
    }
    setIsRegistroOpen(true);
  };

  if (loading) return <div className="p-10 text-emerald-500 font-bold bg-black min-h-screen flex items-center justify-center text-2xl uppercase tracking-widest">Sincronizzazione Sensori...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-800 pb-6 gap-4">
        <h1 className="text-4xl font-black text-emerald-400 uppercase italic tracking-tighter">DIREZIONE GARA: {sala?.name}</h1>
        
        <div className="flex flex-wrap gap-4 items-center">
          
          {/* TASTO SEGRETO PER IL SUPER ADMIN */}
          {userEmail === 'donatorzz1946@gmail.com' && (
            <button onClick={() => window.location.href = '/admin/dashboard'} className="bg-red-950 border-2 border-red-800 text-red-400 hover:bg-red-900 px-6 py-3 rounded-xl font-black uppercase transition-all shadow-[0_0_15px_rgba(220,38,38,0.5)]">
              🚀 Torre di Controllo
            </button>
          )}

          <button onClick={apriRegistro} className="bg-blue-950 border-2 border-blue-800 text-blue-400 hover:bg-blue-900 px-6 py-3 rounded-xl font-black uppercase transition-all shadow-[0_0_15px_rgba(30,58,138,0.5)]">
            📊 INCASSI
          </button>
          <button onClick={() => { supabase.auth.signOut(); window.location.href = '/login'; }} className="bg-black border-2 border-emerald-900 text-emerald-500 hover:bg-emerald-900/40 px-8 py-3 rounded-xl font-black uppercase transition-all shadow-[0_0_15px_rgba(4,120,87,0.3)]">
            🚪 Uscita
          </button>
        </div>
      </div>
      
      {/* PANNELLO DI VARO RAPIDO */}
      {tavoli.length === 0 && sala?.id && (
        <div className="bg-gray-900 p-8 rounded-[2rem] border-2 border-emerald-800 mb-10 shadow-2xl">
          <h2 className="text-2xl font-black mb-6 uppercase text-emerald-400">Inizializzazione Sala</h2>
          <div className="flex flex-wrap gap-4">
            <input 
              type="number" 
              placeholder="Numero totale dei tavoli" 
              className="bg-black p-4 rounded-xl border border-gray-600 w-72 text-xl font-bold outline-none focus:border-emerald-500 transition-colors"
              value={numTavoliDaCreare}
              onChange={(e) => setNumTavoliDaCreare(e.target.value)}
            />
            <button onClick={varaSala} className="bg-emerald-700 hover:bg-emerald-600 px-10 py-4 rounded-xl font-black uppercase transition-all shadow-[0_0_20px_rgba(4,120,87,0.4)]">
              GENERA CAMPI DI GIOCO
            </button>
          </div>
        </div>
      )}

      {/* LISTA TAVOLI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {tavoli.map(t => (
          <div key={t.id} className={`bg-gray-950 p-6 rounded-[2rem] border-[3px] text-center shadow-2xl relative overflow-hidden transition-all duration-300 ${t.stato === 'occupato' ? 'border-red-600 bg-red-950/10' : t.stato === 'manutenzione' ? 'border-yellow-600 opacity-70' : 'border-emerald-900 hover:border-emerald-700'}`}>
            
            <div className="flex justify-between items-center mb-6">
              <span className="bg-black border border-gray-800 px-3 py-1 rounded-lg text-xs font-mono text-gray-400">ID: {t.numero_tavolo}</span>
              <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-lg ${t.stato === 'occupato' ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.8)]' : t.stato === 'manutenzione' ? 'bg-yellow-600 text-black' : 'bg-emerald-900/50 text-emerald-400'}`}>
                {t.stato}
              </span>
            </div>

            <h3 className="font-black text-3xl mb-1 text-white tracking-tight">{t.nome_tavolo}</h3>
            <p className="text-gray-500 font-bold mb-4 font-mono">Tariffa: € {t.tariffa_oraria}/h</p>
            
            <TempoTrascorso startTime={t.start_time} />
            
            <button 
              onClick={() => toggleStatoTavolo(t)}
              disabled={t.stato === 'manutenzione'}
              className={`w-full mt-6 py-5 rounded-2xl font-black uppercase text-2xl transition-all shadow-lg ${
                t.stato === 'libero' 
                  ? 'bg-emerald-700 hover:bg-emerald-600 text-white' 
                  : t.stato === 'occupato' 
                  ? 'bg-red-700 hover:bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              {t.stato === 'libero' ? '▶ START' : t.stato === 'occupato' ? '■ STOP' : 'BLOCCATO'}
            </button>

            <button 
              onClick={() => apriModifica(t)}
              className="mt-4 w-full bg-black border border-gray-700 hover:border-emerald-500 text-gray-400 hover:text-emerald-400 py-3 rounded-xl font-bold text-sm uppercase transition-all"
            >
              🔧 CONFIGURA
            </button>
          </div>
        ))}
      </div>

      {/* MODALE SCONTRINO / CHECKOUT */}
      {scontrino && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 backdrop-blur-md p-4">
          <div className="bg-gray-900 p-10 rounded-[3rem] border-[4px] border-red-700 w-full max-w-lg shadow-[0_0_50px_rgba(220,38,38,0.3)] text-center">
            <h2 className="text-4xl font-black mb-2 text-white uppercase italic tracking-tighter">CHIUSURA TAVOLO</h2>
            <p className="text-red-400 font-bold text-xl mb-8">{scontrino.nome_tavolo}</p>
            
            <div className="bg-black rounded-3xl p-8 mb-8 border border-gray-800">
              <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-4">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-sm">Tempo Giocato</span>
                <span className="text-3xl font-mono text-yellow-400 font-black">{scontrino.minutiGiocati} <span className="text-lg">min</span></span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-sm">Totale da Incassare</span>
                <span className="text-5xl font-mono text-emerald-400 font-black">€ {scontrino.totale}</span>
              </div>
            </div>
            
            <button onClick={confermaIncasso} className="w-full bg-red-700 hover:bg-red-600 p-6 rounded-2xl font-black text-2xl uppercase transition-all shadow-[0_0_20px_rgba(220,38,38,0.5)] text-white mb-4">
              ✅ Incassa e Libera
            </button>
            <button className="w-full text-gray-500 hover:text-white transition-colors uppercase text-sm font-black tracking-widest py-4" onClick={() => setScontrino(null)}>
              Annulla e lascia scorrere il tempo
            </button>
          </div>
        </div>
      )}

      {/* MODALE DI CONFIGURAZIONE TAVOLO */}
      {tavoloInModifica && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-gray-900 p-10 rounded-[3rem] border-2 border-emerald-800 w-full max-w-md shadow-2xl">
            <h2 className="text-3xl font-black mb-8 text-emerald-400 uppercase italic tracking-tighter">Configura {tavoloInModifica.nome_tavolo}</h2>
            
            <form onSubmit={salvaModifiche}>
              <label className="text-gray-500 font-black uppercase text-xs tracking-widest ml-4 mb-2 block">Nome Identificativo</label>
              <input 
                className="w-full bg-black p-5 mb-6 rounded-2xl border border-gray-700 outline-none focus:border-emerald-500 text-xl font-bold text-white transition-all" 
                value={editNome} 
                onChange={(e) => setEditNome(e.target.value)} 
                required 
              />
              
              <label className="text-gray-500 font-black uppercase text-xs tracking-widest ml-4 mb-2 block">Tariffa Oraria (€)</label>
              <input 
                type="number" step="0.50"
                className="w-full bg-black p-5 mb-6 rounded-2xl border border-gray-700 outline-none focus:border-emerald-500 text-xl font-mono text-white transition-all" 
                value={editTariffa} 
                onChange={(e) => setEditTariffa(e.target.value)} 
                required 
              />
              
              <label className="text-gray-500 font-black uppercase text-xs tracking-widest ml-4 mb-2 block">Stato Tavolo</label>
              <select 
                className="w-full bg-black p-5 mb-10 rounded-2xl border border-gray-700 outline-none focus:border-emerald-500 text-lg text-white uppercase font-black transition-all"
                value={editStato}
                onChange={(e) => setEditStato(e.target.value)}
              >
                <option value="libero">🟢 Libero (Operativo)</option>
                <option value="manutenzione">🟡 In Manutenzione (Bloccato)</option>
              </select>
              
              <button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-600 p-5 rounded-2xl font-black text-xl uppercase transition-all shadow-[0_0_20px_rgba(4,120,87,0.4)] text-white">
                Salva Modifiche
              </button>
            </form>
            
            <button className="mt-6 w-full text-gray-500 hover:text-white transition-colors uppercase text-sm font-black tracking-widest py-3" onClick={() => setTavoloInModifica(null)}>
              Annulla e Chiudi
            </button>
          </div>
        </div>
      )}

      {/* MODALE REGISTRO INCASSI */}
      {isRegistroOpen && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 backdrop-blur-md p-4">
          <div className="bg-gray-950 p-8 rounded-[2rem] border-2 border-blue-900 w-full max-w-3xl shadow-[0_0_40px_rgba(30,58,138,0.3)] max-h-[90vh] flex flex-col">
            <h2 className="text-3xl font-black mb-6 text-blue-400 uppercase tracking-tighter">Registro di Cassa</h2>
            
            <div className="bg-blue-950/20 p-6 rounded-2xl border border-blue-900 mb-6 flex justify-between items-center">
              <span className="text-blue-300 font-bold uppercase tracking-widest text-sm">Incasso Totale</span>
              <span className="text-4xl font-mono text-emerald-400 font-black">€ {totaleIncassi.toFixed(2)}</span>
            </div>

            <div className="overflow-y-auto pr-2 custom-scrollbar flex-grow">
              {ricevute.length === 0 ? (
                <p className="text-center text-gray-500 font-bold py-10 uppercase">Nessun incasso registrato.</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-widest">
                      <th className="pb-3 pt-2">Data/Ora</th>
                      <th className="pb-3 pt-2">Tavolo</th>
                      <th className="pb-3 pt-2">Minuti</th>
                      <th className="pb-3 pt-2 text-right">Importo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ricevute.map(r => (
                      <tr key={r.id} className="border-b border-gray-900/50 hover:bg-gray-900/30 transition-colors">
                        <td className="py-4 text-sm font-mono text-gray-400">{new Date(r.fine_partita).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })}</td>
                        <td className="py-4 font-bold text-gray-300">{r.tavolo_nome}</td>
                        <td className="py-4 text-yellow-400/80 font-mono text-sm">{r.minuti_giocati} m</td>
                        <td className="py-4 text-right font-black text-emerald-500 font-mono">€ {Number(r.importo_incassato).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <button className="mt-8 w-full bg-gray-900 hover:bg-gray-800 border border-gray-700 py-4 rounded-xl font-black text-gray-400 hover:text-white uppercase tracking-widest transition-all" onClick={() => setIsRegistroOpen(false)}>
              Chiudi Registro
            </button>
          </div>
        </div>
      )}

    </div>
  );
}