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
    console.error("Errore intercettato dal fusibile:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black text-red-500 p-10 font-mono">
      <h1 className="text-4xl font-bold mb-6">⚠️ CORTOCIRCUITO RILEVATO</h1>
      <p className="mb-4 text-xl text-gray-300">Il loop infinito è stato bloccato. Ecco il referto esatto del guasto che la centralina cercava di nasconderci:</p>
      
      <div className="bg-gray-950 p-8 rounded-2xl border-2 border-red-800 text-white text-xl shadow-2xl">
        <code className="text-red-400 font-bold">{error.message}</code>
      </div>
      
      <p className="mt-8 text-gray-500 uppercase tracking-widest text-sm">
        Copia questo errore e comunicalo in officina.
      </p>
    </div>
  );
}