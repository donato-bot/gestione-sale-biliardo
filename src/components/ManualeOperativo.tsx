"use client";

import React from 'react';

export default function ManualeOperativo({ salaId }: { salaId: string }) {
  return (
    <div className="p-6 bg-black min-h-screen text-white font-sans pb-20">
      <h2 className="text-3xl font-black text-yellow-400 italic uppercase text-center mb-8">Manuale Operativo</h2>

      <div className="max-w-5xl mx-auto space-y-8">

        {/* Introduzione */}
        <div className="bg-[#11131a] border border-yellow-500/30 p-8 rounded-2xl shadow-lg">
          <h3 className="text-xl font-black text-yellow-400 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">
            1. Introduzione al Sistema
          </h3>
          <p className="text-gray-300 leading-relaxed text-sm">
            Benvenuto nel Manuale Operativo de <strong>Il Campione</strong>. Questa sezione contiene le direttive ufficiali per l'utilizzo dei moduli della Torre di Controllo, garantendo una gestione fluida e professionale della sala biliardi. Si prega lo staff di attenersi scrupolosamente alle procedure indicate.
          </p>
        </div>

        {/* Modulo Prenotazioni */}
        <div className="bg-[#11131a] border border-emerald-500/30 p-8 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
          
          <h3 className="text-xl font-black text-emerald-400 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2 flex items-center gap-3 ml-4">
            <span>📅</span> 2. Procedura: Gestione Prenotazioni
          </h3>

          <div className="space-y-6 text-sm text-gray-300 ml-4">
            <p className="text-base">
              Il modulo Prenotazioni è il cuore organizzativo della sala. Funziona con un sistema a <strong>doppio binario convergente</strong>: riceve simultaneamente sia gli inserimenti manuali effettuati dallo staff, sia le richieste autonome inviate dai soci tramite smartphone. Tutte le richieste convergono nel Tabellone Centrale.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              
              {/* Box Staff */}
              <div className="bg-black p-6 rounded-xl border border-gray-800 shadow-inner">
                <h4 className="font-black text-emerald-500 uppercase mb-4 tracking-wider border-b border-gray-900 pb-2">
                  A. Ricezione Manuale (Staff)
                </h4>
                <ul className="list-disc pl-5 space-y-3">
                  <li>Utilizzare il form "Ricezione Manuale" quando il cliente contatta la sala direttamente (telefono, WhatsApp, social network, o fisicamente in sala).</li>
                  <li><strong>Selettore Canale:</strong> È obbligatorio selezionare la corretta origine della richiesta dal menù a tendina. Questo apporrà un badge colorato nel tabellone, utile per le statistiche di marketing della sala.</li>
                  <li><strong>Note:</strong> Sfruttare questo campo per anticipare le esigenze del giocatore (es. <em>"Set bilie Aramith Pro"</em>, <em>"Stecca personale in armadietto"</em>, <em>"Compleanno"</em>).</li>
                </ul>
              </div>

              {/* Box Clienti */}
              <div className="bg-black p-6 rounded-xl border border-gray-800 shadow-inner">
                <h4 className="font-black text-emerald-500 uppercase mb-4 tracking-wider border-b border-gray-900 pb-2">
                  B. App Esterna (Soci)
                </h4>
                <ul className="list-disc pl-5 space-y-3">
                  <li>Il sistema genera un link univoco per la sala. Cliccare su <strong>"📋 COPIA LINK PRENOTAZIONE"</strong> in cima al modulo.</li>
                  <li>Inoltrare il link sui gruppi WhatsApp dei soci o inserirlo nei profili social della sala.</li>
                  <li>I clienti vedranno un'interfaccia dedicata dove potranno leggere gli ultimi <strong>Avvisi della Direzione</strong> (inseriti in Bacheca) e inviare la richiesta del tavolo.</li>
                  <li>Le richieste esterne compariranno istantaneamente nel Tabellone Generale con il badge <em>"Socio dal Link"</em>.</li>
                </ul>
              </div>

            </div>

            {/* Gestione e Stampa */}
            <div className="bg-black p-6 rounded-xl border border-gray-800 shadow-inner mt-6">
              <h4 className="font-black text-emerald-500 uppercase mb-4 tracking-wider border-b border-gray-900 pb-2">
                C. Gestione Tabellone e Stampa
              </h4>
              <ul className="list-disc pl-5 space-y-3">
                <li>Il tabellone centrale ordina i tavoli in modo <strong>strettamente cronologico</strong>, dal più imminente al più lontano.</li>
                <li><strong>Annullamento:</strong> Per liberare un tavolo a seguito di una disdetta, cliccare sulla "X" rossa in alto a destra della scheda. Confermare l'avviso di sistema. L'azione elimina definitivamente il record.</li>
                <li><strong>Stampa Operativa:</strong> All'inizio di un turno ad alta affluenza, cliccare su <strong>"🖨️ Stampa Elenco"</strong>. Il sistema genererà una distinta cartacea su sfondo bianco con la scaletta dei tavoli, da tenere a disposizione sul banco bar o in direzione.</li>
              </ul>
            </div>

            {/* Alert Importante */}
            <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-5 mt-6 flex items-start gap-4">
              <div className="text-3xl">⚠️</div>
              <div>
                <h4 className="text-red-400 font-black uppercase tracking-widest text-sm mb-1">Regola Anti-Overbooking</h4>
                <p className="text-red-200/70 text-xs leading-relaxed">
                  Lo staff è tenuto a consultare sempre visivamente il Tabellone Centrale prima di confermare una nuova prenotazione telefonica, al fine di evitare doppie assegnazioni sullo stesso biliardo nel medesimo orario.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Moduli Futuri */}
        <div className="bg-[#11131a] border border-gray-800 p-8 rounded-2xl shadow-lg opacity-40">
          <h3 className="text-xl font-black text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">
            3. Modulo Cassa (In Lavorazione)
          </h3>
          <p className="text-gray-400 text-sm italic">Le procedure di quadratura e chiusura cassa serale verranno inserite in questa sezione a breve.</p>
        </div>

      </div>
    </div>
  );
}