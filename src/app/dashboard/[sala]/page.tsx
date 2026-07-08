"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";

export default function DashboardManagerPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
      } else {
        setUserEmail(session.user.email || null);
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b border-gray-800 pb-4">
          <h1 className="text-2xl font-black uppercase tracking-widest text-white">Dashboard Manager</h1>
          
          {/* TASTO SEGRETO CORRETTO: Reindirizza a /admin senza errori 404 */}
          {userEmail === "donatorzz1946@gmail.com" && (
            <button 
              onClick={() => router.push("/admin")} 
              className="bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-400 font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl transition-all animate-pulse"
            >
              Torre di Controllo 🚀
            </button>
          )}
        </div>
        <p className="text-gray-400 font-bold">Benvenuto nella plancia della tua sala. Seleziona una voce dal menu per iniziare.</p>
      </div>
    </div>
  );
}