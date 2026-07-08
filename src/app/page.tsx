"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-cyan-500 font-black animate-pulse tracking-widest uppercase text-xs">
        Caricamento...
      </p>
    </div>
  );
}