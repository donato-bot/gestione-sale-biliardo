import { useState, useEffect } from "react";

export default function SocioModal({ isOpen, onClose, onSave, socioDaModificare }: any) {
  const [formData, setFormData] = useState({
    nome: "",
    cognome: "",
    telefono: "",
    email: "",
    data_nascita: "",
    indirizzo: ""
  });

  useEffect(() => {
    if (socioDaModificare) {
      setFormData({
        nome: socioDaModificare.nome || "",
        cognome: socioDaModificare.cognome || "",
        telefono: socioDaModificare.telefono || "",
        email: socioDaModificare.email || "",
        data_nascita: socioDaModificare.data_nascita || "",
        indirizzo: socioDaModificare.indirizzo || ""
      });
    } else {
      setFormData({ 
        nome: "", 
        cognome: "", 
        telefono: "", 
        email: "", 
        data_nascita: "", 
        indirizzo: "" 
      });
    }
  }, [socioDaModificare, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-gray-950 border-2 border-blue-600 p-8 rounded-3xl w-full max-w-lg shadow-2xl">
        <h2 className="text-2xl font-black text-white uppercase mb-6 italic">
          {socioDaModificare ? "MODIFICA SOCIO" : "NUOVO SOCIO"}
        </h2>
        
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Nome" 
            value={formData.nome} 
            onChange={(e) => setFormData({...formData, nome: e.target.value})} 
            className="w-full bg-gray-900 p-4 rounded-xl text-white border border-gray-700" 
          />
          <input 
            type="text" 
            placeholder="Cognome" 
            value={formData.cognome} 
            onChange={(e) => setFormData({...formData, cognome: e.target.value})} 
            className="w-full bg-gray-900 p-4 rounded-xl text-white border border-gray-700" 
          />
          <input 
            type="tel" 
            placeholder="Telefono" 
            value={formData.telefono} 
            onChange={(e) => setFormData({...formData, telefono: e.target.value})} 
            className="w-full bg-gray-900 p-4 rounded-xl text-white border border-gray-700" 
          />
          <input 
            type="email" 
            placeholder="Email" 
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            className="w-full bg-gray-900 p-4 rounded-xl text-white border border-gray-700" 
          />
          <input 
            type="date" 
            value={formData.data_nascita} 
            onChange={(e) => setFormData({...formData, data_nascita: e.target.value})} 
            className="w-full bg-gray-900 p-4 rounded-xl text-white border border-gray-700" 
          />
          <input 
            type="text" 
            placeholder="Indirizzo" 
            value={formData.indirizzo} 
            onChange={(e) => setFormData({...formData, indirizzo: e.target.value})} 
            className="w-full bg-gray-900 p-4 rounded-xl text-white border border-gray-700" 
          />
        </div>

        <div className="flex gap-4 mt-8">
          <button 
            onClick={onClose} 
            className="flex-1 py-4 bg-gray-800 text-white font-bold uppercase rounded-xl hover:bg-gray-700"
          >
            Annulla
          </button>
          <button 
            onClick={() => onSave(formData)} 
            className="flex-1 py-4 bg-blue-600 text-white font-black rounded-xl uppercase hover:bg-blue-500"
          >
            Salva Socio
          </button>
        </div>
      </div>
    </div>
  );
}