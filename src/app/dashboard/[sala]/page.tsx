"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useParams } from "next/navigation";

export default function DashboardSala() {
  const params = useParams();
  const salaSlug = params?.sala as string; 
  
  const [iscritti, setIscritti] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Modali
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [isStartModalOpen, setIsStartModalOpen] = useState(false); 
  const [isBarModalOpen, setIsBarModalOpen] = useState(false);
  
  // Sensori
  const [tableName, setTableName] = useState("");
  const [tablePrice, setTablePrice] = useState("");
  const [activeTableId, setActiveTableId] = useState<number | null>(null);
  const [players, setPlayers] = useState(["", "", "", ""]);
  const [barAmount, setBarAmount] = useState("");
  
  const [now, setNow] = useState(Date.now());
  
  const [tavoli, setTavoli] = useState<any[]>([
    { id: 1, nome: "Tavolo 1 (Demo)", prezzo: "12.00", stato: "LIBERO", startTime: null, giocatori: [], barTotal: 0 }
  ]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // RADAR NUCLEARE: Peschiamo assolutamente TUTTO dalla tabella soci
  useEffect(() => {
    async function fetchInitialData() {
      // Chi c'è al comando?
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserEmail(session.user.email ?? null);
      }

      // Nessun filtro, prendiamo tutti i soci visto che gli scudi RLS sono abbassati
      const { data, error } = await supabase
        .from("soci")
        .select("*")
        .order("data_iscrizione", { ascending: false });

      if (!error) setIscritti(data || []);
      setLoading(false);
    }
    fetchInitialData();
  }, []);

  const handleSaveTable = () => {
    if (!tableName || !tablePrice) return; 
    const nuovoTavolo = {
      id: Math.random(), 
      nome: tableName,
      prezzo: parseFloat(tablePrice).toFixed(2), 
      stato: "LIBERO",
      startTime: null,
      giocatori: [],
      barTotal: 0
    };
    setTavoli([...tavoli, nuovoTavolo]); 
    setIsModalOpen(false); 
    setTableName(""); 
    setTablePrice(""); 
  };

  const apriModaleInizio = (id: number) => {
    setActiveTableId(id);
    setPlayers(["", "", "", ""]); 
    setIsStartModalOpen(true);
  };

  const confermaInizioPartita = () => {
    if (activeTableId === null) return;
    const giocatoriAttivi = players.filter(p => p.trim() !== "");

    setTavoli(tavoli.map(t => {
      if (t.id === activeTableId) {
        return { 
          ...t, 
          stato: "IN GIOCO",
          startTime: Date.now(),
          giocatori: giocatoriAttivi,
          barTotal: 0
        };
      }
      return t;
    }));
    setIsStartModalOpen(false);
    setActiveTableId(null);
  };

  const apriModaleBar = (id: number) => {
    setActiveTableId(id);
    setBarAmount(""); 
    setIsBarModalOpen(true);
  };

  const confermaBar = () => {
    if (activeTableId === null || !barAmount) return;
    const importoAggiuntivo = parseFloat(barAmount.replace(',', '.')); 
    
    if (!isNaN(importoAggiuntivo)) {
      setTavoli(tavoli.map(t => {
        if (t.id === activeTableId) {
          return { ...t, barTotal: t.barTotal + importoAggiuntivo };
        }
        return t;
      }));
    }
    setIsBarModalOpen(false);
    setActiveTableId(null);
  };

  const fermaPartita = (id: number) => {
    setTavoli(tavoli.map(t => {
      if (t.id === id) {
        return { ...t, stato: "LIBERO", startTime: null, giocatori: [], barTotal: 0 };
      }
      return t;
    }));
  };

  const formattaTempo = (startTime: number | null) => {
    if (!startTime) return "00:00:00";
    const secondiTrascorsi = Math.floor((now - startTime) / 1000);
    const ore = Math.floor(secondiTrascorsi / 3600).toString().padStart(2, '0');
    const minuti = Math.floor((secondiTrascorsi % 3600) / 60).toString().padStart(2, '0');
    const secondi = (secondiTrascorsi % 60).toString().padStart(2, '0');
    return `${ore}:${minuti}:${secondi}`;
  };

  const calcolaImporto = (startTime: number | null, prezzoOrario: string) => {
    if (!startTime) return "0.00";
    const oreTrascorse = (now - startTime) / 1000 / 3600;
    return (oreTrascorse * parseFloat(prezzoOrario)).toFixed(2);
  };

  const handlePlayerChange = (index: number, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      
      {userEmail === 'donatorzz1946@gmail.com' && (
        <div className="mb-8 p-4 bg-red-950 border border-red-600 rounded-lg flex justify-between items-center shadow-[0_0_15px_rgba(220,38,38,0.5)]">
          <span className="text-red-400 font-bold uppercase tracking-widest text-sm">⚠️ Modalità Supervisore Attiva</span>
          <a href="/admin/dashboard" className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-md font-bold transition-all shadow-md">
            Torre di Controllo
          </a>
        </div>
      )}

      <div className="mb-12">
        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
          <h2 className="text-3xl font-bold text-green-500 uppercase tracking-wider">
            🎱 Flotta Tavoli
          </h2>
          <button onClick={() => setIsModalOpen(true)} className="bg-green-700 hover:bg-green-600 text-white px-5 py-2 rounded-md font-bold transition-all shadow-md flex items-center gap-2">
            <span>+</span> Aggiungi Tavolo
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tavoli.map((tavolo) => (
            <div key={tavolo.id} className={`bg-gray-900 border border-gray-700 p-6 rounded-xl shadow-lg border-l-4 relative overflow-hidden flex flex-col justify-between transition-colors duration-300 ${tavolo.stato === "LIBERO" ? "border-l-green-500" : "border-l-red-500"}`}>
              
              <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-xl text-xs font-bold tracking-widest uppercase ${tavolo.stato === "LIBERO" ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400 animate-pulse"}`}>
                {tavolo.stato}
              </div>
              
              <div className="mb-4">
                <h3 className="text-2xl font-black text-white mb-1 tracking-tight">{tavolo.nome}</h3>
                <p className="text-gray-500 text-xs font-mono">Tariffa: {tavolo.prezzo} €/ora</p>
                
                {tavolo.stato === "IN GIOCO" && tavolo.giocatori.length > 0 && (
                  <div className="mt-3 bg-gray-950 p-3 rounded-lg border border-gray-800">
                    <span className="text-xs text-gray-500 uppercase font-bold block mb-1">In Gioco:</span>
                    <p className="text-sm text-blue-300 font-bold">{tavolo.giocatori.join(" ⚔️ ")}</p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-2 border-t border-gray-800 pt-4 pb-6 font-mono">
                <div className="flex flex-col">
                  <span className="text-gray-500 text-[10px] uppercase font-bold mb-1">Tempo</span>
                  <span className={`font-bold text-lg tracking-widest ${tavolo.stato === "LIBERO" ? "text-gray-700" : "text-white"}`}>
                    {formattaTempo(tavolo.startTime)}
                  </span>
                </div>
                <div className="flex flex-col text-center">
                  <span className="text-gray-500 text-[10px] uppercase font-bold mb-1">Biliardo (€)</span>
                  <span className={`font-bold text-lg ${tavolo.stato === "LIBERO" ? "text-gray-700" : "text-yellow-400"}`}>
                    {calcolaImporto(tavolo.startTime, tavolo.prezzo)}
                  </span>
                </div>
                <div className="flex flex-col text-right border-l border-gray-800 pl-2">
                  <span className="text-orange-400/70 text-[10px] uppercase font-bold mb-1">Bar (€)</span>
                  <span className={`font-bold text-lg ${tavolo.stato === "LIBERO" || tavolo.barTotal === 0 ? "text-gray-700" : "text-orange-400"}`}>
                    {tavolo.barTotal > 0 ? tavolo.barTotal.toFixed(2) : "0.00"}
                  </span>
                </div>
              </div>

              {tavolo.stato === 'LIBERO' ? (
                <button onClick={() => apriModaleInizio(tavolo.id)} className="w-full py-3 bg-green-700 hover:bg-green-600 text-white rounded-md font-bold transition-all shadow-md flex justify-center items-center gap-2">
                  ▶ INIZIA PARTITA
                </button>
              ) : (
                <div className="flex gap-3">
                  <button onClick={() => apriModaleBar(tavolo.id)} className="w-1/3 py-3 bg-orange-700 hover:bg-orange-600 text-white rounded-md font-bold transition-all shadow-md flex justify-center items-center text-xl">
                    🍺
                  </button>
                  <button onClick={() => fermaPartita(tavolo.id)} className="w-2/3 py-3 bg-red-700 hover:bg-red-600 text-white rounded-md font-bold transition-all shadow-md flex justify-center items-center gap-2">
                    ⏹ FERMA
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <h1 className="text-3xl font-bold text-blue-500 mb-6 uppercase border-b border-gray-800 pb-4 tracking-tighter mt-12">
        Tabellone Iscritti: <span className="text-white">{salaSlug ? decodeURIComponent(salaSlug) : ""}</span>
      </h1>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-gray-800 text-blue-400 uppercase text-xs tracking-widest font-bold">
            <tr>
              <th className="p-4">Socio</th>
              <th className="p-4">Codice Tessera</th>
              <th className="p-4">Data Iscrizione</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr><td className="p-4 text-gray-500 font-mono">Caricamento radar...</td></tr>
            ) : iscritti.length > 0 ? (
              iscritti.map((i) => (
                <tr key={i.id} className="hover:bg-gray-850 transition-colors">
                  <td className="p-4 font-bold">{i.nome} {i.cognome}</td>
                  <td className="p-4 text-gray-400 font-mono">{i.codice_tessera || "N/A"}</td>
                  <td className="p-4 text-gray-500 font-mono">
                    {new Date(i.data_iscrizione).toLocaleString("it-IT")}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td className="p-4 text-gray-500 italic">Nessun iscritto al momento.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-2xl shadow-2xl w-full max-w-md relative">
            <h3 className="text-2xl font-bold text-green-500 mb-6 uppercase tracking-wider border-b border-gray-800 pb-4">Nuovo Tavolo</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-gray-400 text-sm font-bold mb-2 uppercase tracking-wide">Nome Tavolo</label>
                <input type="text" value={tableName} onChange={(e) => setTableName(e.target.value)} placeholder="es. Biliardo 2" className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm font-bold mb-2 uppercase tracking-wide">Tariffa Oraria (€)</label>
                <input type="number" value={tablePrice} onChange={(e) => setTablePrice(e.target.value)} placeholder="es. 10.50" className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-green-500" />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-8 font-bold uppercase text-xs">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800">Annulla</button>
              <button onClick={handleSaveTable} className="bg-green-700 hover:bg-green-600 text-white px-6 py-2 rounded-md">Crea Tavolo</button>
            </div>
          </div>
        </div>
      )}

      {isStartModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-900 border border-blue-900 p-8 rounded-2xl shadow-2xl w-full max-w-md relative">
            <h3 className="text-2xl font-bold text-blue-500 mb-2 uppercase tracking-wider">Identificazione</h3>
            <p className="text-gray-400 text-sm mb-6 border-b border-gray-800 pb-4">Inserisci i nomi dei giocatori (opzionale)</p>
            <div className="space-y-3">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-gray-600 font-black text-xl">{index + 1}.</span>
                  <input type="text" value={players[index]} onChange={(e) => handlePlayerChange(index, e.target.value)} placeholder={`Giocatore ${index + 1}`} className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-4 mt-8 font-bold uppercase text-xs">
              <button onClick={() => setIsStartModalOpen(false)} className="px-5 py-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800">Annulla</button>
              <button onClick={confermaInizioPartita} className="bg-blue-700 hover:bg-blue-600 text-white px-6 py-2 rounded-md flex items-center gap-2">▶ Avvia Timer</button>
            </div>
          </div>
        </div>
      )}

      {isBarModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-900 border border-orange-800 p-8 rounded-2xl shadow-2xl w-full max-w-md relative">
            <h3 className="text-2xl font-bold text-orange-500 mb-2 uppercase tracking-wider">🍺 Consumazioni Bar</h3>
            <p className="text-gray-400 text-sm mb-6 border-b border-gray-800 pb-4">Aggiungi un importo al conto del tavolo</p>

            <div className="space-y-5">
              <div>
                <label className="block text-gray-400 text-sm font-bold mb-2 uppercase tracking-wide">Importo (€)</label>
                <input
                  type="number"
                  step="0.10"
                  value={barAmount}
                  onChange={(e) => setBarAmount(e.target.value)}
                  placeholder="es. 4.50"
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg p-3 text-xl focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8 font-bold uppercase text-xs">
              <button onClick={() => setIsBarModalOpen(false)} className="px-5 py-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800">Annulla</button>
              <button onClick={confermaBar} className="bg-orange-700 hover:bg-orange-600 text-white px-6 py-2 rounded-md">Aggiungi al Conto</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}