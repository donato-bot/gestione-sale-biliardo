"use client";

import { useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      alert("Errore di accesso: " + error.message);
      setLoading(false);
      return;
    }

    // AUTOMATISMO CORRETTO: Se sei tu, vai dritto a /admin
    if (email.trim().toLowerCase() === "donatorzz1946@gmail.com") {
      router.push("/admin");
    } else {
      // Altrimenti il manager normale va alla sua dashboard fittizia o specifica
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white font-sans p-4">
      <div className="bg-[#11131a] border border-gray-800 p-8 rounded-[2rem] w-full max-w-md shadow-2xl">
        <h1 className="text-2xl font-black uppercase tracking-widest text-cyan-500 mb-6 text-center">Il Campione</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black border border-gray-800 p-4 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black border border-gray-800 p-4 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-500" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 text-white font-black uppercase tracking-widest py-4 rounded-xl text-xs transition-all mt-2">
            {loading ? "ACCESSO IN CORSO..." : "ACCEDI"}
          </button>
        </form>
      </div>
    </div>
  );
}