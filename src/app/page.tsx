"use client";

import { useEffect } from "react";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    async function verificaSessioneAttiva() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session || !session.user?.email) {
        // Se non c'è sessione, spedisce alla porta d'ingresso unica
        router.push("/login");
        return;
      }

      const userEmail = session.user.email.toLowerCase();

      // APPLICAZIONE DEI DUE CONTROLLI ESCLUSIVI SULLA SESSIONE ESISTENTE
      if (userEmail === "donatorzz1946@gmail.com") {
        router.push("/admin");
      } else {
        try {
          const { data: salaData } = await supabase
            .from("sale")
            .select("id")
            .eq("manager_email", userEmail)
            .single();

          if (salaData) {
            router.push(`/dashboard/${salaData.id}`);
          } else {
            router.push("/login");
          }
        } catch (err) {
          router.push("/login");
        }
      }
    }

    verificaSessioneAttiva();
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-gray-600 text-xs font-black uppercase tracking-widest animate-pulse">
        Verifica Canale di Ingresso...
      </p>
    </div>
  );
}