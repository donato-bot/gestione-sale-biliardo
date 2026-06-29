"use client";

export default function MenuHub({
  nomeSala,
  setActiveView,
  pendingPrenotazioniLength,
  isSalaSuspended,
  onLogout
}: any) {
  return (
    /* SFONDO PASTELLO ESTERNO */
    <div className="min-h-screen bg-[#E6F0EB] py-10 px-4 sm:px-6 lg:px-8 font-sans animate-in fade-in duration-300 flex flex-col items-center justify-start">
      
      <div className="w-full max-w-6xl">
        
        {/* HEADER TOP (SALA DEMO DINAMICA) */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-[#0B0D14] border border-[#1E222B] p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] mb-10 gap-6">
          <div className="w-full md:w-auto text-center md:text-left">
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Pannello Multi-Tenant</p>
            <h1 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tight">
              {nomeSala || "SALA DEMO DINAMICA"}
            </h1>
          </div>
          
          {/* Gruppo Pulsanti Superiori */}
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <button
              onClick={() => setActiveView("manuale")}
              className="bg-indigo-950/40 text-indigo-400 hover:bg-indigo-900 hover:text-white border border-indigo-900/30 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 active:scale-95 flex items-center justify-center"
            >
              📖 MANUALE D'USO
            </button>
            
            <button
              onClick={onLogout}
              className="bg-red-950/40 text-red-500 hover:bg-red-900 hover:text-white border border-red-900/30 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 active:scale-95 flex items-center justify-center"
            >
              🚪 ESCI DAL GESTIONALE
            </button>
          </div>
        </div>

        {/* GRIGLIA MODULI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* PLANCIA */}
          <button onClick={() => setActiveView("plancia")} className="bg-[#0B0D14] hover:bg-[#151821] border border-[#1E222B] hover:border-green-500/50 p-8 rounded-[2.5rem] text-left transition-all duration-300 active:scale-95 shadow-[0_10px_30px_rgba(0,0,0,0.15)] group">
            <div className="text-4xl mb-5 bg-[#1A1D24] w-16 h-16 rounded-2xl flex items-center justify-center border border-[#2A2E39] group-hover:border-green-900 transition-colors">🎱</div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">PLANCIA BILIARDI</h3>
            <p className="text-gray-500 group-hover:text-gray-400 text-[10px] mt-2 uppercase font-bold tracking-widest transition-colors">Avvio e chiusura tavoli (solo tempo)</p>
          </button>

          {/* SERVIZI AL BANCO */}
          <button onClick={() => setActiveView("servizi")} className="bg-[#0B0D14] hover:bg-[#151821] border border-[#1E222B] hover:border-orange-500/50 p-8 rounded-[2.5rem] text-left transition-all duration-300 active:scale-95 shadow-[0_10px_30px_rgba(0,0,0,0.15)] group">
            <div className="text-4xl mb-5 bg-[#1A1D24] w-16 h-16 rounded-2xl flex items-center justify-center border border-[#2A2E39] group-hover:border-orange-900 transition-colors">🛒</div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">SERVIZI AL BANCO</h3>
            <p className="text-gray-500 group-hover:text-gray-400 text-[10px] mt-2 uppercase font-bold tracking-widest transition-colors">Incasso Bar, Biliardi e annotazione sospesi</p>
          </button>

          {/* MOVIMENTI CONTABILI */}
          <button onClick={() => setActiveView("report")} className="bg-[#0B0D14] hover:bg-[#151821] border border-[#1E222B] hover:border-[#00E5FF]/50 p-8 rounded-[2.5rem] text-left transition-all duration-300 active:scale-95 shadow-[0_10px_30px_rgba(0,0,0,0.15)] group">
            <div className="text-4xl mb-5 bg-[#1A1D24] w-16 h-16 rounded-2xl flex items-center justify-center border border-[#2A2E39] group-hover:border-[#00ADC6] transition-colors">💰</div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">MOVIMENTI CONTABILI</h3>
            <p className="text-gray-500 group-hover:text-gray-400 text-[10px] mt-2 uppercase font-bold tracking-widest transition-colors">Prima Nota, spese e storico cassa</p>
          </button>

          {/* PRENOTAZIONI */}
          <button onClick={() => setActiveView("prenotazioni")} className="bg-[#0B0D14] hover:bg-[#151821] border border-[#1E222B] hover:border-teal-500/50 p-8 rounded-[2.5rem] text-left transition-all duration-300 active:scale-95 shadow-[0_10px_30px_rgba(0,0,0,0.15)] group relative">
            <div className="text-4xl mb-5 bg-[#1A1D24] w-16 h-16 rounded-2xl flex items-center justify-center border border-[#2A2E39] group-hover:border-teal-900 transition-colors">📅</div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">PRENOTAZIONI</h3>
            <p className="text-gray-500 group-hover:text-gray-400 text-[10px] mt-2 uppercase font-bold tracking-widest transition-colors">Registro appuntamenti</p>
            {pendingPrenotazioniLength > 0 && (
              <span className="absolute top-8 right-8 bg-teal-500 text-black font-black w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-[0_0_15px_#14b8a6]">
                {pendingPrenotazioniLength}
              </span>
            )}
          </button>

          {/* ANAGRAFICA SOCI */}
          <button onClick={() => setActiveView("soci")} className="bg-[#0B0D14] hover:bg-[#151821] border border-[#1E222B] hover:border-yellow-600/50 p-8 rounded-[2.5rem] text-left transition-all duration-300 active:scale-95 shadow-[0_10px_30px_rgba(0,0,0,0.15)] group">
            <div className="text-4xl mb-5 bg-[#1A1D24] w-16 h-16 rounded-2xl flex items-center justify-center border border-[#2A2E39] group-hover:border-yellow-900 transition-colors">👤</div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">ANAGRAFICA SOCI</h3>
            <p className="text-gray-500 group-hover:text-gray-400 text-[10px] mt-2 uppercase font-bold tracking-widest transition-colors">Gestione tessere e crediti</p>
          </button>

          {/* MAGAZZINO */}
          <button onClick={() => setActiveView("magazzino")} className="bg-[#0B0D14] hover:bg-[#151821] border border-[#1E222B] hover:border-cyan-600/50 p-8 rounded-[2.5rem] text-left transition-all duration-300 active:scale-95 shadow-[0_10px_30px_rgba(0,0,0,0.15)] group">
            <div className="text-4xl mb-5 bg-[#1A1D24] w-16 h-16 rounded-2xl flex items-center justify-center border border-[#2A2E39] group-hover:border-cyan-900 transition-colors">📦</div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">MAGAZZINO BAR</h3>
            <p className="text-gray-500 group-hover:text-gray-400 text-[10px] mt-2 uppercase font-bold tracking-widest transition-colors">Controllo stock prodotti</p>
          </button>

          {/* TORNEI */}
          <button onClick={() => setActiveView("tornei")} className="bg-[#0B0D14] hover:bg-[#151821] border border-[#1E222B] hover:border-pink-600/50 p-8 rounded-[2.5rem] text-left transition-all duration-300 active:scale-95 shadow-[0_10px_30px_rgba(0,0,0,0.15)] group">
            <div className="text-4xl mb-5 bg-[#1A1D24] w-16 h-16 rounded-2xl flex items-center justify-center border border-[#2A2E39] group-hover:border-pink-900 transition-colors">🏆</div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">TORNEI E GARE</h3>
            <p className="text-gray-500 group-hover:text-gray-400 text-[10px] mt-2 uppercase font-bold tracking-widest transition-colors">Iscrizioni e tabelloni</p>
          </button>

          {/* BACHECA */}
          <button onClick={() => setActiveView("bacheca")} className="bg-[#0B0D14] hover:bg-[#151821] border border-[#1E222B] hover:border-purple-600/50 p-8 rounded-[2.5rem] text-left transition-all duration-300 active:scale-95 shadow-[0_10px_30px_rgba(0,0,0,0.15)] group">
            <div className="text-4xl mb-5 bg-[#1A1D24] w-16 h-16 rounded-2xl flex items-center justify-center border border-[#2A2E39] group-hover:border-purple-900 transition-colors">📢</div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">BACHECA CLUB</h3>
            <p className="text-gray-500 group-hover:text-gray-400 text-[10px] mt-2 uppercase font-bold tracking-widest transition-colors">Avvisi per i clienti</p>
          </button>

          {/* STAFF E IMPOSTAZIONI (Split in 2 colonne) */}
          <div className="flex gap-4">
            <button onClick={() => setActiveView("staff")} className="flex-1 bg-[#0B0D14] hover:bg-[#151821] border border-[#1E222B] hover:border-indigo-600/50 p-6 rounded-[2.5rem] text-center transition-all duration-300 active:scale-95 shadow-[0_10px_30px_rgba(0,0,0,0.15)] group flex flex-col items-center justify-center">
              <div className="text-3xl mb-3">👥</div>
              <h3 className="text-sm font-black text-white uppercase italic tracking-wider">STAFF</h3>
            </button>
            <button onClick={() => setActiveView("impostazioni")} className="flex-1 bg-[#0B0D14] hover:bg-[#151821] border border-[#1E222B] hover:border-gray-500/50 p-6 rounded-[2.5rem] text-center transition-all duration-300 active:scale-95 shadow-[0_10px_30px_rgba(0,0,0,0.15)] group flex flex-col items-center justify-center">
              <div className="text-3xl mb-3">⚙️</div>
              <h3 className="text-sm font-black text-white uppercase italic tracking-wider">SETUP</h3>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}