"use client";

export default function MenuHub({
  nomeSala,
  setActiveView,
  pendingPrenotazioniLength,
  isSalaSuspended,
  onLogout
}: any) {
  return (
    <div className="max-w-6xl mx-auto p-4 animate-in fade-in duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900 border-2 border-gray-800 p-8 rounded-[2.5rem] shadow-2xl mb-8 gap-6">
        <div>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Pannello multi-tenant</p>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tight">
            {nomeSala || "LA MIA SALA"}
          </h1>
        </div>
        <button
          onClick={onLogout}
          className="bg-red-950 text-red-500 hover:bg-red-600 hover:text-white border border-red-900/40 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95"
        >
          🚪 ESCI DAL GESTIONALE
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* PLANCIA */}
        <button onClick={() => setActiveView("plancia")} className="bg-gray-900 border-2 border-gray-800 p-8 rounded-[2.5rem] hover:border-green-500 text-left transition-all active:scale-95 shadow-xl group">
          <div className="text-4xl mb-4 bg-gray-950 w-16 h-16 rounded-2xl flex items-center justify-center border border-gray-800 group-hover:border-green-900">🎱</div>
          <h3 className="text-xl font-black text-white uppercase italic tracking-tight">PLANCIA BILIARDI</h3>
          <p className="text-gray-500 text-xs mt-2 uppercase font-bold tracking-wider">Avvio e chiusura tavoli (solo tempo)</p>
        </button>

        {/* NUOVO: SERVIZI AL BANCO */}
        <button onClick={() => setActiveView("servizi")} className="bg-gray-900 border-2 border-gray-800 p-8 rounded-[2.5rem] hover:border-orange-500 text-left transition-all active:scale-95 shadow-xl group">
          <div className="text-4xl mb-4 bg-gray-950 w-16 h-16 rounded-2xl flex items-center justify-center border border-gray-800 group-hover:border-orange-900">🛒</div>
          <h3 className="text-xl font-black text-white uppercase italic tracking-tight">SERVIZI AL BANCO</h3>
          <p className="text-gray-500 text-xs mt-2 uppercase font-bold tracking-wider">Incasso Bar, Biliardi e annotazione sospesi</p>
        </button>

        {/* MOVIMENTI CONTABILI */}
        <button onClick={() => setActiveView("report")} className="bg-gray-900 border-2 border-gray-800 p-8 rounded-[2.5rem] hover:border-blue-600 text-left transition-all active:scale-95 shadow-xl group">
          <div className="text-4xl mb-4 bg-gray-950 w-16 h-16 rounded-2xl flex items-center justify-center border border-gray-800 group-hover:border-blue-900">💰</div>
          <h3 className="text-xl font-black text-white uppercase italic tracking-tight">MOVIMENTI CONTABILI</h3>
          <p className="text-gray-500 text-xs mt-2 uppercase font-bold tracking-wider">Prima Nota, spese e storico cassa</p>
        </button>

        {/* PRENOTAZIONI */}
        <button onClick={() => setActiveView("prenotazioni")} className="bg-gray-900 border-2 border-gray-800 p-8 rounded-[2.5rem] hover:border-teal-500 text-left transition-all active:scale-95 shadow-xl group relative">
          <div className="text-4xl mb-4 bg-gray-950 w-16 h-16 rounded-2xl flex items-center justify-center border border-gray-800 group-hover:border-teal-900">📅</div>
          <h3 className="text-xl font-black text-white uppercase italic tracking-tight">PRENOTAZIONI</h3>
          <p className="text-gray-500 text-xs mt-2 uppercase font-bold tracking-wider">Registro appuntamenti</p>
          {pendingPrenotazioniLength > 0 && (<span className="absolute top-6 right-6 bg-teal-500 text-black font-black w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-[0_0_15px_#14b8a6]">{pendingPrenotazioniLength}</span>)}
        </button>

        {/* ANAGRAFICA SOCI */}
        <button onClick={() => setActiveView("soci")} className="bg-gray-900 border-2 border-gray-800 p-8 rounded-[2.5rem] hover:border-yellow-600 text-left transition-all active:scale-95 shadow-xl group">
          <div className="text-4xl mb-4 bg-gray-950 w-16 h-16 rounded-2xl flex items-center justify-center border border-gray-800 group-hover:border-yellow-900">👤</div>
          <h3 className="text-xl font-black text-white uppercase italic tracking-tight">ANAGRAFICA SOCI</h3>
          <p className="text-gray-500 text-xs mt-2 uppercase font-bold tracking-wider">Gestione tessere e crediti</p>
        </button>

        {/* MAGAZZINO */}
        <button onClick={() => setActiveView("magazzino")} className="bg-gray-900 border-2 border-gray-800 p-8 rounded-[2.5rem] hover:border-cyan-600 text-left transition-all active:scale-95 shadow-xl group">
          <div className="text-4xl mb-4 bg-gray-950 w-16 h-16 rounded-2xl flex items-center justify-center border border-gray-800 group-hover:border-cyan-900">📦</div>
          <h3 className="text-xl font-black text-white uppercase italic tracking-tight">MAGAZZINO BAR</h3>
          <p className="text-gray-500 text-xs mt-2 uppercase font-bold tracking-wider">Controllo stock prodotti</p>
        </button>

        {/* TORNEI */}
        <button onClick={() => setActiveView("tornei")} className="bg-gray-900 border-2 border-gray-800 p-8 rounded-[2.5rem] hover:border-pink-600 text-left transition-all active:scale-95 shadow-xl group">
          <div className="text-4xl mb-4 bg-gray-950 w-16 h-16 rounded-2xl flex items-center justify-center border border-gray-800 group-hover:border-pink-900">🏆</div>
          <h3 className="text-xl font-black text-white uppercase italic tracking-tight">TORNEI E GARE</h3>
          <p className="text-gray-500 text-xs mt-2 uppercase font-bold tracking-wider">Iscrizioni e tabelloni</p>
        </button>

        {/* BACHECA */}
        <button onClick={() => setActiveView("bacheca")} className="bg-gray-900 border-2 border-gray-800 p-8 rounded-[2.5rem] hover:border-purple-600 text-left transition-all active:scale-95 shadow-xl group">
          <div className="text-4xl mb-4 bg-gray-950 w-16 h-16 rounded-2xl flex items-center justify-center border border-gray-800 group-hover:border-purple-900">📢</div>
          <h3 className="text-xl font-black text-white uppercase italic tracking-tight">BACHECA CLUB</h3>
          <p className="text-gray-500 text-xs mt-2 uppercase font-bold tracking-wider">Avvisi per i clienti</p>
        </button>

        {/* STAFF E IMPOSTAZIONI */}
        <div className="flex gap-4">
          <button onClick={() => setActiveView("staff")} className="flex-1 bg-gray-900 border-2 border-gray-800 p-6 rounded-[2.5rem] hover:border-indigo-600 text-center transition-all active:scale-95 shadow-xl group">
            <div className="text-3xl mb-2">👥</div>
            <h3 className="text-sm font-black text-white uppercase italic">STAFF</h3>
          </button>
          <button onClick={() => setActiveView("impostazioni")} className="flex-1 bg-gray-900 border-2 border-gray-800 p-6 rounded-[2.5rem] hover:border-gray-500 text-center transition-all active:scale-95 shadow-xl group">
            <div className="text-3xl mb-2">⚙️</div>
            <h3 className="text-sm font-black text-white uppercase italic">SETUP</h3>
          </button>
        </div>

      </div>
    </div>
  );
}