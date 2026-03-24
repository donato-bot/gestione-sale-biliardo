"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js'; 
import { useRouter } from "next/navigation";
// NUOVE LIBRERIE IMPORTATE PER IL PDF 👇
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function TorreDiControllo() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sale, setSale] = useState<any[]>([]);
  
  // Stati Modale Nuova Sala
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nomeSala, setNomeSala] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  
  // Stati per la UX della form e per le credenziali
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [credenzialiGenerate, setCredenzialiGenerate] = useState<{email: string, pass: string} | null>(null);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      // Controllo di Sicurezza Assoluto: Solo tu puoi stare qui
      if (!session || session.user.email !== 'donatorzz1946@gmail.com') {
        router.push('/login');
        return;
      }
      
      setUserEmail(session.user.email);
      await caricaSale();
      setLoading(false);
    }
    init();
  }, [router]);

  async function caricaSale() {
    const { data, error } = await supabase
      .from('sale')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data) setSale(data);
    if (error) console.error("Errore nel caricamento sale:", error);
  }

  // Crea l'utente tramite API e poi salva la Sala
  const handleCreaSala = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setFormError(null);
    setCredenzialiGenerate(null);

    if (!nomeSala.trim() || !managerEmail.trim()) {
      setFormError("Compila tutti i campi per varare la sala.");
      return;
    }

    setIsSubmitting(true);

    try {
      const passwordProvvisoria = "Gestore-" + Math.random().toString(36).slice(-6) + "!";

      const resApi = await fetch('/api/crea-gestore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: managerEmail.trim(), password: passwordProvvisoria })
      });

      const apiData = await resApi.json();

      if (!resApi.ok) {
        throw new Error(apiData.error || "Errore nella creazione dell'account Gestore");
      }

      const { error: dbError } = await supabase
        .from('sale')
        .insert([
          { 
            name: nomeSala.trim(), 
            manager_email: managerEmail.trim(), 
            scadenza_contributo: '2026-12-31', 
            is_active: true 
          }
        ]);

      if (dbError) throw dbError;

      await caricaSale();
      setCredenzialiGenerate({ email: managerEmail.trim(), pass: passwordProvvisoria });
      setNomeSala("");
      setManagerEmail("");

    } catch (err: any) {
      setFormError("Errore: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const chiudiModale = () => {
    setIsModalOpen(false);
    setNomeSala("");
    setManagerEmail("");
    setFormError(null);
    setCredenzialiGenerate(null);
  };

  const eliminaSala = async (salaId: string, nomeSala: string) => {
    if (window.confirm(`⚠️ ATTENZIONE ⚠️\nVuoi davvero eliminare definitivamente la sala "${nomeSala}" e tutti i suoi dati?\n\nQuesta operazione è IRREVERSIBILE!`)) {
      const { error } = await supabase.from('sale').delete().eq('id', salaId);
      if (!error) {
        await caricaSale();
      } else {
        alert("Errore durante l'eliminazione: " + error.message);
      }
    }
  };

  const toggleStatoSala = async (salaId: string, statoAttuale: boolean) => {
    const nuovoStato = !statoAttuale;
    const { error } = await supabase.from('sale').update({ is_active: nuovoStato }).eq('id', salaId);
    
    if (!error) {
      await caricaSale();
    } else {
      alert("Errore durante l'aggiornamento dello stato: " + error.message);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // --- NUOVA FUNZIONE: GENERAZIONE PDF DELLA FLOTTA ---
  const scaricaPDF = () => {
    // 1. Inizializza il documento PDF (orientamento portrait)
    const doc = new jsPDF();
    
    // 2. Prepara le date per il titolo e il nome file
    const dataOggi = new Date().toLocaleDateString('it-IT');
    const oraOggi = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const nomeFile = `Report_Flotta_${dataOggi.replace(/\//g, '-')}.pdf`;

    // 3. Intestazione del Documento
    doc.setFontSize(22);
    doc.setTextColor(220, 38, 38); // Rosso intenso stile Torre di Controllo
    doc.text("TORRE DI CONTROLLO", 14, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50); // Grigio scuro
    doc.text("Report Ufficiale: Flotta Sale Biliardo", 14, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100); // Grigio chiaro
    doc.text(`Generato da: ${userEmail}`, 14, 38);
    doc.text(`Data e Ora di stampa: ${dataOggi} alle ${oraOggi}`, 14, 44);
    doc.text(`Totale Strutture Registrate: ${sale.length}`, 14, 50);

    // 4. Prepara i dati per la tabella
    const colonne = ["Stato", "Nome Sala", "Email Gestore", "ID Univoco Sala"];
    
    const righe = sale.map(s => [
      s.is_active ? 'ONLINE' : 'OFFLINE',
      s.name,
      s.manager_email,
      s.id
    ]);

    // 5. Disegna la Tabella Automatica
    autoTable(doc, {
      startY: 58, // Partenza sotto l'intestazione
      head: [colonne],
      body: righe,
      theme: 'grid', // Stile griglia
      headStyles: { fillColor: [153, 27, 27], textColor: 255, fontStyle: 'bold' }, // Intestazione rossa scura
      alternateRowStyles: { fillColor: [245, 245, 245] }, // Righe alternate grigie per leggibilità
      styles: { fontSize: 9, cellPadding: 3 }, // Font piccolo per far stare l'ID
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [0, 0, 0] }, // Colonna Stato
        3: { fontSize: 7, textColor: [100, 100, 100] } // Colonna ID più piccola e grigia
      },
      // Funzione per colorare dinamicamente la cella ONLINE/OFFLINE
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 0) {
          if (data.cell.raw === 'ONLINE') {
            data.cell.styles.textColor = [22, 163, 74]; // Verde
          } else {
            data.cell.styles.textColor = [220, 38, 38]; // Rosso
          }
        }
      }
    });

    // 6. Pie di pagina
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Pagina ${i} di ${pageCount} - Sistema Gestionale Multisala`, 
        doc.internal.pageSize.getWidth() / 2, 
        doc.internal.pageSize.getHeight() - 10, 
        { align: 'center' }
      );
    }

    // 7. Salva il file
    doc.save(nomeFile);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-red-500 font-black text-2xl uppercase tracking-widest animate-pulse">Accesso Rete Globale...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans tracking-tighter">
      
      {/* HEADER SUPER ADMIN */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 bg-red-950/30 p-8 rounded-[3rem] border-4 border-red-900 shadow-[0_0_50px_rgba(220,38,38,0.1)]">
        <div className="text-center md:text-left mb-6 md:mb-0">
          <h1 className="text-5xl font-black text-red-500 uppercase italic tracking-tighter mb-2">Torre di Controllo</h1>
          <p className="text-gray-400 font-mono text-sm uppercase tracking-widest">Autorizzazione Livello Massimo: <span className="text-white font-bold">{userEmail}</span></p>
        </div>
        <div className="flex gap-4 flex-wrap w-full md:w-auto justify-center md:justify-end">
          
          {/* TASTO PDF AGGIUNTO QUI */}
          <button onClick={scaricaPDF} className="bg-gray-800 border-2 border-gray-600 text-white font-black px-6 py-4 rounded-3xl hover:bg-gray-700 transition-all active:scale-95 uppercase tracking-widest shadow-lg flex items-center gap-2">
            <span>📥</span> REPORT FLOTTA
          </button>

          <button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none bg-red-600 hover:bg-red-500 text-white font-black px-8 py-4 rounded-3xl shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all active:scale-95 uppercase tracking-widest text-lg">
            + VARA NUOVA SALA
          </button>
          <button onClick={logout} className="bg-gray-900 border-2 border-red-900 text-red-500 font-black px-8 py-4 rounded-3xl hover:bg-red-950 hover:text-white transition-all active:scale-95 uppercase">
            Esci
          </button>
        </div>
      </div>

      {/* GRIGLIA DELLE SALE GESTITE */}
      <h2 className="text-2xl font-black text-gray-500 uppercase tracking-[0.2em] mb-8 ml-4">Flotta Attiva ({sale.length})</h2>
      
      {sale.length === 0 ? (
        <div className="text-center p-20 border-4 border-dashed border-gray-800 rounded-[3rem]">
          <p className="text-gray-500 font-black text-2xl uppercase">Nessuna sala attiva.</p>
          <p className="text-gray-600 mt-4 font-bold">Inizia varando la tua prima sala biliardo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sale.map((s) => (
            <div key={s.id} className={`p-8 md:p-10 rounded-[3rem] border-2 transition-colors relative flex flex-col justify-between ${s.is_active ? 'bg-gray-900 border-gray-800 hover:border-red-600 shadow-xl' : 'bg-gray-950 border-red-900/50 opacity-80'}`}>
              
              <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl text-xs font-black tracking-widest uppercase shadow-md ${s.is_active ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                {s.is_active ? 'ONLINE' : 'OFFLINE'}
              </div>
              
              <div className="flex-1">
                <h3 className={`text-4xl font-black italic mb-6 mt-4 break-words ${s.is_active ? 'text-white' : 'text-gray-500'}`}>{s.name}</h3>
                
                <div className="space-y-4 mb-8 bg-black/40 p-4 rounded-2xl border border-gray-800/50">
                  <div>
                    <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Gestore (Manager)</p>
                    <p className={`text-lg font-bold truncate ${s.is_active ? 'text-blue-400' : 'text-blue-900'}`}>{s.manager_email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Codice Sala (ID)</p>
                    <p className="text-xs font-mono text-gray-500 truncate mt-1">{s.id}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-auto pt-6 border-t border-gray-800">
                <button 
                  onClick={() => toggleStatoSala(s.id, s.is_active)}
                  className={`flex-[3] py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-md active:scale-95 ${s.is_active ? 'bg-orange-900/40 text-orange-500 hover:bg-orange-800 hover:text-white' : 'bg-green-900 text-green-400 hover:bg-green-700 hover:text-white'}`}
                >
                  {s.is_active ? 'Sospendi Sala' : 'Riattiva Sala'}
                </button>
                
                <button 
                  onClick={() => eliminaSala(s.id, s.name)}
                  className="flex-[1] bg-gray-950 border border-gray-800 text-red-500 hover:bg-red-600 hover:text-white rounded-2xl transition-colors flex items-center justify-center text-xl shadow-md active:scale-95"
                  title="Elimina Definitivamente"
                >
                  🗑️
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* MODALE NUOVA SALA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-gray-950 border-4 border-red-600 p-8 md:p-12 rounded-[3rem] w-full max-w-xl shadow-[0_0_100px_rgba(220,38,38,0.3)]">
            <h3 className="text-4xl font-black text-red-500 mb-8 uppercase italic tracking-tighter">Vara Nuova Sala</h3>
            
            {/* SE LA CREAZIONE È ANDATA A BUON FINE MOSTRA QUESTO: */}
            {credenzialiGenerate ? (
              <div className="animate-in zoom-in-95">
                <div className="bg-green-950/40 border border-green-800 p-6 rounded-3xl mb-8">
                  <p className="text-green-400 font-black uppercase text-xs tracking-widest mb-4">✅ Sala e Gestore Creati!</p>
                  <p className="text-gray-400 text-sm mb-4">Comunica queste credenziali di primo accesso al gestore della sala:</p>
                  
                  <div className="bg-black p-4 rounded-xl border border-gray-800 font-mono text-sm space-y-3">
                    <div>
                      <span className="text-gray-500 text-xs uppercase block mb-1">Email Gestore:</span> 
                      <span className="text-white text-lg">{credenzialiGenerate.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs uppercase block mb-1">Password Provvisoria:</span> 
                      <span className="text-red-400 font-bold text-xl">{credenzialiGenerate.pass}</span>
                    </div>
                  </div>
                </div>
                
                <button type="button" onClick={chiudiModale} className="w-full py-6 bg-green-900/50 text-green-400 font-black uppercase text-xl rounded-3xl hover:bg-green-800 transition-colors active:scale-95">
                  Ho copiato tutto, Chiudi
                </button>
              </div>
            ) : (
              /* ALTRIMENTI MOSTRA LA FORM NORMALE: */
              <form onSubmit={handleCreaSala}>
                {formError && (
                  <div className="mb-6 p-4 bg-red-950/50 border border-red-800 rounded-2xl text-red-400 text-sm font-bold animate-in slide-in-from-top-2">
                    ⚠️ {formError}
                  </div>
                )}

                <div className="space-y-6 mb-10">
                  <div>
                    <label className="text-gray-500 font-black uppercase text-xs tracking-widest ml-4 mb-2 block">Nome della Struttura</label>
                    <input 
                      type="text"
                      value={nomeSala} 
                      onChange={(e) => setNomeSala(e.target.value)} 
                      placeholder="Es. Biliardo Club Roma" 
                      className="w-full bg-black border-2 border-gray-800 p-6 rounded-3xl text-xl md:text-2xl text-white outline-none focus:border-red-500 transition-colors" 
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div>
                    <label className="text-gray-500 font-black uppercase text-xs tracking-widest ml-4 mb-2 block">Email del Gestore</label>
                    <input 
                      type="email"
                      value={managerEmail} 
                      onChange={(e) => setManagerEmail(e.target.value)} 
                      placeholder="manager@email.it" 
                      className="w-full bg-black border-2 border-gray-800 p-6 rounded-3xl text-xl md:text-2xl text-white outline-none focus:border-red-500 transition-colors" 
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button type="button" onClick={chiudiModale} disabled={isSubmitting} className="flex-1 py-6 text-gray-500 font-black uppercase text-lg hover:text-white hover:bg-gray-900 rounded-3xl transition-colors">
                    Annulla
                  </button>
                  <button type="submit" disabled={isSubmitting} className={`flex-[2] py-8 rounded-3xl font-black uppercase tracking-widest text-xl shadow-xl transition-all ${isSubmitting ? 'bg-red-900 text-red-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/40 active:scale-95'}`}>
                    {isSubmitting ? 'CREAZIONE...' : 'CREA E ATTIVA'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}