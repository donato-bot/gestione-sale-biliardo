"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Registra l'errore reale nella console per poterlo leggere
    console.error("ERRORE INTERCETTATO:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10 font-sans">
      <div className="border-2 border-red-600 bg-[#11131a] p-8 rounded-2xl max-w-xl text-center shadow-2xl">
        <h2 className="text-2xl font-black text-red-500 uppercase tracking-widest mb-4">
          Allarme di Sistema
        </h2>
        <p className="text-gray-300 mb-6 font-mono text-sm bg-black p-4 rounded border border-gray-800">
          {error.message}
        </p>
        <button
          onClick={() => reset()}
          className="bg-red-600 hover:bg-red-500 text-white font-black py-3 px-8 rounded-full uppercase tracking-widest transition-all"
        >
          Tenta Riavvio
        </button>
      </div>
    </div>
  );
}