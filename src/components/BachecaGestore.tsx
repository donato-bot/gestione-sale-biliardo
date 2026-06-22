"use client";
import { useState, useEffect } from "react";
// Importazione centralizzata e corretta dal cuore del progetto
import { supabase } from "../app/lib/supabase";

export default function BachecaGestore({ salaId }: { salaId: string }) {
  const [titolo, setTitolo] = useState("");
  const [contenuto, setContenuto] = useState("");
  const [categoria, setCategoria] = useState("avviso");
  const [accettaIscrizioni, setAccettaIscrizioni] = useState(false);
  const [messaggi, setMessaggi] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMessaggi();
  }, [salaId]);

  const fetchMessaggi = async () => {
    const { data, error } = await supabase
      .from("bacheca")
      .select("*")
      .eq("sala_id", salaId)
      .order("created_at", { ascending: false });

    if (error) console.error("Errore fetch:", error);
    else setMessaggi(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.from("bacheca").insert([{
        sala_id: salaId,
        titolo,
        contenuto,
        categoria: categoria, 
        accetta_iscrizioni: categoria === "torneo" ? accettaIscrizioni : false
      }]);
      
      if (error) {
        alert("Errore salvataggio: " + error.message);
      } else {
        setTitolo(""); 
        setContenuto(""); 
        setCategoria("avviso");
        setAccettaIscrizioni(false);
        fetchMessaggi();
      }
    } catch (err: any) {
         alert("Errore imprevisto: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("bacheca").delete().eq("id", id);
    if (error) alert("Errore eliminazione: " + error.message);
    else fetchMessaggi();
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-1/2 bg-gray-900 p-6 rounded-2xl">
        <h2 className="text-[#ff9900] font-black mb-6 uppercase">Redazione Bacheca</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white" placeholder="Titolo" value={titolo} onChange={(e) => setTitolo(e.target.value)} required />
          <textarea className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white" placeholder="Contenuto..." value={contenuto} onChange={(e) => setContenuto(e.target.value)} required rows={4} />
          <select className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="avviso">📣 Avviso</option>
            <option value="torneo">🏆 Torneo</option>
            <option value="risultati">📊 Risultati</option>
          </select>
          {categoria === "torneo" && (
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={accettaIscrizioni} onChange={(e) => setAccettaIscrizioni(e.target.checked)} />
              <label className="text-white">Abilita iscrizioni</label>
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full bg-[#ff9900] text-black font-black p-3 rounded-xl uppercase">
            {loading ? "Pubblicazione..." : "Pubblica"}
          </button>
        </form>
      </div>

      <div className="w-full md:w-1/2 flex flex-col gap-4">
        {messaggi.map((msg) => (
          <div key={msg.id} className="bg-gray-900 p-4 rounded-xl flex justify-between items-center">
            <div>
              <h3 className="text-[#ff9900] font-bold">{msg.titolo}</h3>
              <p className="text-gray-400 text-xs">{msg.categoria}</p>
            </div>
            <button onClick={() => handleDelete(msg.id)} className="text-red-500 text-xs font-bold uppercase">Elimina</button>
          </div>
        ))}
      </div>
    </div>
  );
}