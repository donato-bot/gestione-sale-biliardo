"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useParams, useRouter } from "next/navigation";

// Inizializza Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DashboardSala() {
  const params = useParams();
  const router = useRouter();

  // Stati Generali
  const [loading, setLoading] = useState(true);
  const [sala, setSala] = useState<any>(null);
  const [soci, setSoci] = useState<any[]>([]);
  const [nomeSala, setNomeSala] = useState("");

  // Stati per Modale Nuovo Socio
  const [isAddSocioOpen, setIsAddSocioOpen] = useState(false);
  const [nuovoNome, setNuovoNome] = useState("");
  const [nuovoCognome, setNuovoCognome] = useState("");
  const [nuovoTelefono, setNuovoTelefono] = useState("");
  const [nuovoCredito, setNuovoCredito] = useState("0");

  // Stati per Cambio Password
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      // Verifica se l'utente è loggato
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      if (params?.sala) {
        // Carica info della Sala
        const { data: dataSala } = await supabase
          .from('sale')
          .select('*')
          .eq('id', params.sala)
          .single();

        if (dataSala) {
          setSala(dataSala);
          setNomeSala(dataSala.name);
        }

        // Carica la lista dei Soci
        await fetchSoci();
      }
      setLoading(false);
    }
    loadData();
  }, [params?.sala, router]);

  async function fetchSoci() {
    const { data } = await supabase
      .from('soci')
      .select('*')
      .eq('sala_id', params?.sala)
      .order('created_at', { ascending: false });
    if (data) setSoci(data);
  }

  // --- FUNZIONE WHATSAPP CORRETTA ---
  const inviaLinkWhatsApp = (socio: any) => {
    // Usiamo l'ID reale del socio per far funzionare l'App VIP
    const idReale = socio.id;
    const url = `${window.location.origin}/vip/${params.sala}/${idReale}`;

    const messaggioTesto = `Ciao ${socio.nome}, ecco la tua Tessera Digitale VIP per ${nomeSala}. Clicca qui per vedere il tuo credito e prenotare: ${url}`;
    const messaggioCodificato = encodeURIComponent(messaggioTesto);

    if (socio.telefono && socio.telefono.trim() !== "") {
      const numeroPulito = socio.telefono.replace(/\D/g, '');
      const prefisso = numeroPulito.startsWith('39') ? '' : '39';
      const waUrl = `https://wa.me/${prefisso}${numeroPulito}?text=${messaggioCodificato}`;
      window.open(waUrl, '_blank');
    } else {
      navigator.clipboard.writeText(url);
      alert(`⚠️ Nessun numero di telefono salvato per ${socio.nome}.\n\n✅ Link copiato negli appunti! Apri tu WhatsApp e incollalo.`);
    }
  };

  // --- CREA NUOVO SOCIO ---
  const handleCreaSocio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuovoNome || !nuovoCognome) return;

    const { error } = await supabase
      .from('soci')
      .insert([{
        sala_id: params?.sala,
        nome: nuovoNome,
        cognome: nuovoCognome,
        telefono: nuovoTelefono,
        credito: parseFloat(nuovoCredito) || 0
      }]);

    if (!error) {
      setIsAddSocioOpen(false);
      setNuovoNome("");
      setNuovoCognome("");
      setNuovoTelefono("");
      setNuovoCredito("0");
      await fetchSoci();
    } else {
      alert("Errore inserimento socio: " + error.message);
    }
  };

  // --- ELIMINA SOCIO ---
  const eliminaSocio = async (id: string, nomeCompleto: string) => {
    if(window.confirm(`Vuoi davvero eliminare definitivamente il socio ${nomeCompleto}?`)) {
      await supabase.from('soci').delete().eq('id', id);
      await fetchSoci();
    }
  }

  // --- CAMBIO PASSWORD DEL GESTORE ---
  const handleCambioPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("Le due password non coincidono. Riprova.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("La password deve essere di almeno 6 caratteri.");
      return;
    }

    setIsChangingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setPasswordError("Errore durante il cambio password: " + error.message);
    } else {
      setPasswordSuccess(true);
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setNewPassword("");
        setConfirmPassword("");
        setPasswordSuccess(false);
      }, 3000); // Chiude la modale dopo 3 secondi
    }
    setIsChangingPassword(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-purple-500 font-bold animate-pulse">CARICAMENTO PLANCIA...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 font-sans">
      
      {/* Header Plancia Gestore */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 bg-gray-900 border border-gray-800 p-8 rounded-[2rem] shadow-xl">
        <div>
          <p className="text-purple-500 font-bold uppercase tracking-widest text-[10px] mb-1">PLANCIA GESTORE</p>
          <h1 className="text-4xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">{nomeSala || "Sala"}</h1>
        </div>
        <div className="flex gap-4 mt-6 md:mt-0 flex-wrap justify-end">
          
          {/* NUOVO PULSANTE INDIETRO */}
          <button 
            onClick={() => router.push('/dashboard')} 
            className="bg-gray-800 border border-gray-700 text-gray-300 font-bold px-6 py-3 rounded-2xl hover:bg-gray-700 hover:text-white transition-all text-sm uppercase shadow-lg active:scale-95"
          >
            ⬅ Indietro
          </button>

          <button onClick={() => setIsPasswordModalOpen(true)} className="bg-blue-900 border border-blue-700 text-blue-400 font-bold px-6 py-3 rounded-2xl hover:bg-blue-800 hover:text-white transition-all text-sm uppercase shadow-lg active:scale-95">
            🔑 Cambia Password
          </button>
          <button onClick={logout} className="bg-black border border-gray-800 text-gray-400 font-bold px-6 py-3 rounded-2xl hover:text-white hover:border-gray-600 transition-all text-sm uppercase shadow-lg active:scale-95">
            Esci
          </button>
        </div>
      </div>

      {/* Sezione Soci */}
      <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-[2rem] p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-6">
          <h2 className="text-2xl font-black italic uppercase text-gray-400">Elenco Soci ({soci.length})</h2>
          <button onClick={() => setIsAddSocioOpen(true)} className="bg-purple-600 text-white font-black px-6 py-3 rounded-2xl hover:bg-purple-500 transition-all uppercase text-sm shadow-xl active:scale-95">
            + Nuovo Socio
          </button>
        </div>

        {soci.length === 0 ? (
          <p className="text-gray-600 text-center font-bold uppercase tracking-widest py-10">Nessun socio registrato in questa sala.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 uppercase text-xs tracking-widest">
                  <th className="p-4">Socio</th>
                  <th className="p-4">Telefono</th>
                  <th className="p-4">Credito</th>
                  <th className="p-4 text-center">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {soci.map((socio) => (
                  <tr key={socio.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="p-4 font-bold text-lg">{socio.cognome} {socio.nome}</td>
                    <td className="p-4 text-gray-400 font-mono text-sm">{socio.telefono || "Nessun numero"}</td>
                    <td className="p-4 font-black text-green-400">€ {parseFloat(socio.credito || 0).toFixed(2)}</td>
                    <td className="p-4 flex gap-2 justify-center">
                      <button onClick={() => inviaLinkWhatsApp(socio)} className="bg-green-900/50 border border-green-700 text-green-400 font-bold px-4 py-2 rounded-xl hover:bg-green-800 hover:text-white transition-colors text-xs uppercase shadow-md flex items-center gap-2 active:scale-95">
                        💬 Invia App
                      </button>
                      <button onClick={() => eliminaSocio(socio.id, `${socio.cognome} ${socio.nome}`)} className="bg-red-950/50 border border-red-900 text-red-500 font-bold px-4 py-2 rounded-xl hover:bg-red-900 hover:text-white transition-colors text-xs uppercase shadow-md active:scale-95">
                        Elimina
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALE NUOVO SOCIO */}
      {isAddSocioOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <form onSubmit={handleCreaSocio} className="bg-gray-950 border-4 border-purple-900 p-8 md:p-12 rounded-[3rem] w-full max-w-lg shadow-[0_0_100px_rgba(147,51,234,0.2)]">
            <h3 className="text-3xl font-black text-purple-500 mb-8 uppercase italic tracking-tighter">Aggiungi Socio</h3>
            <div className="space-y-6 mb-8">
              <div className="flex gap-4 flex-col md:flex-row">
                <div className="flex-1">
                  <label className="text-gray-500 font-black uppercase text-xs tracking-widest ml-4 mb-2 block">Nome</label>
                  <input required type="text" value={nuovoNome} onChange={(e) => setNuovoNome(e.target.value)} className="w-full bg-black border-2 border-gray-800 p-4 rounded-3xl text-white outline-none focus:border-purple-500 transition-colors" />
                </div>
                <div className="flex-1">
                  <label className="text-gray-500 font-black uppercase text-xs tracking-widest ml-4 mb-2 block">Cognome</label>
                  <input required type="text" value={nuovoCognome} onChange={(e) => setNuovoCognome(e.target.value)} className="w-full bg-black border-2 border-gray-800 p-4 rounded-3xl text-white outline-none focus:border-purple-500 transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-gray-500 font-black uppercase text-xs tracking-widest ml-4 mb-2 block">Telefono (Opzionale)</label>
                <input type="tel" value={nuovoTelefono} onChange={(e) => setNuovoTelefono(e.target.value)} placeholder="Es. 333 1234567" className="w-full bg-black border-2 border-gray-800 p-4 rounded-3xl text-white outline-none focus:border-purple-500 transition-colors" />
              </div>
              <div>
                <label className="text-gray-500 font-black uppercase text-xs tracking-widest ml-4 mb-2 block">Credito Iniziale (€)</label>
                <input type="number" step="0.01" value={nuovoCredito} onChange={(e) => setNuovoCredito(e.target.value)} className="w-full bg-black border-2 border-gray-800 p-4 rounded-3xl text-white outline-none focus:border-purple-500 transition-colors font-mono" />
              </div>
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => setIsAddSocioOpen(false)} className="flex-1 py-4 text-gray-500 font-black uppercase text-sm hover:text-white transition-colors rounded-3xl">Annulla</button>
              <button type="submit" className="flex-[2] py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-3xl font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all">Salva Socio</button>
            </div>
          </form>
        </div>
      )}

      {/* MODALE CAMBIO PASSWORD */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <form onSubmit={handleCambioPassword} className="bg-gray-950 border-4 border-blue-900 p-8 md:p-12 rounded-[3rem] w-full max-w-lg shadow-[0_0_100px_rgba(30,58,138,0.3)]">
            <h3 className="text-3xl font-black text-blue-500 mb-6 uppercase italic tracking-tighter">Cambia Password</h3>
            
            {passwordSuccess ? (
              <div className="bg-green-950/40 border border-green-800 p-6 rounded-3xl text-center">
                <div className="text-4xl mb-4">✅</div>
                <p className="text-green-400 font-black uppercase tracking-widest text-lg">Password Aggiornata!</p>
                <p className="text-gray-400 mt-2 text-sm">Usa la nuova password dal prossimo accesso.</p>
              </div>
            ) : (
              <>
                {passwordError && (
                  <div className="mb-6 p-4 bg-red-950/50 border border-red-800 rounded-2xl text-red-400 text-sm font-bold">
                    ⚠️ {passwordError}
                  </div>
                )}

                <div className="space-y-6 mb-8">
                  <div>
                    <label className="text-gray-500 font-black uppercase text-xs tracking-widest ml-4 mb-2 block">Nuova Password</label>
                    <input 
                      type="password"
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      placeholder="Minimo 6 caratteri" 
                      className="w-full bg-black border-2 border-gray-800 p-4 rounded-3xl text-xl text-white outline-none focus:border-blue-500 transition-colors" 
                      disabled={isChangingPassword}
                    />
                  </div>
                  
                  <div>
                    <label className="text-gray-500 font-black uppercase text-xs tracking-widest ml-4 mb-2 block">Conferma Nuova Password</label>
                    <input 
                      type="password"
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      placeholder="Ripeti la password" 
                      className="w-full bg-black border-2 border-gray-800 p-4 rounded-3xl text-xl text-white outline-none focus:border-blue-500 transition-colors" 
                      disabled={isChangingPassword}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button type="button" onClick={() => { setIsPasswordModalOpen(false); setPasswordError(null); }} disabled={isChangingPassword} className="flex-1 py-4 text-gray-500 font-black uppercase text-sm hover:text-white rounded-3xl transition-colors">
                    Annulla
                  </button>
                  <button type="submit" disabled={isChangingPassword} className={`flex-[2] py-4 rounded-3xl font-black uppercase tracking-widest text-sm shadow-xl transition-all ${isChangingPassword ? 'bg-blue-900 text-blue-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'}`}>
                    {isChangingPassword ? 'AGGIORNAMENTO...' : 'SALVA PASSWORD'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

    </div>
  );
}