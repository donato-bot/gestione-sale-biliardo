"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Registra l'errore esatto nel terminale del browser
    console.error("ERRORE INTERCETTATO:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 font-sans">
      <div className="bg-red-950/30 border-4 border-red-900 p-8 rounded-[3rem] shadow-[0_0_50px_rgba(220,38,38,0.3)] max-w-2xl w-full">
        <h2 className="text-3xl font-black text-red-500 uppercase italic tracking-tighter mb-4">
          ⚠️ Cortocircuito Intercettato
        </h2>
        <p className="text-gray-400 font-mono text-sm uppercase tracking-widest mb-6">
          Il loop infinito è stato bloccato. Di seguito il referto tecnico:
        </p>
        
        <div className="bg-black border border-red-800 p-6 rounded-2xl mb-8 overflow-auto">
          <code className="text-red-400 font-bold text-lg">
            {error.message}
          </code>
        </div>

        <button
          onClick={() => reset()}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-black px-8 py-4 rounded-3xl transition-all active:scale-95 uppercase tracking-widest"
        >
          Riavvia Componente
        </button>
      </div>
    </div>
  );
}
