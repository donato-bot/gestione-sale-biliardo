"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Chiunque entra dall'indirizzo principale viene mandato al Login
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-cyan-500 font-black animate-pulse tracking-widest uppercase text-xs">
        Reindirizzamento all'area di accesso...
      </p>
    </div>
  );
}