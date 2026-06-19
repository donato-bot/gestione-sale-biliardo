export default function Impostazioni({
  tariffaStandard,
  setTariffaStandard,
  tariffaSoci,
  setTariffaSoci,
  isSalaSuspended,
  richiedePin,
  salvaTariffe,
  supportActive,
  toggleSupport
}: {
  tariffaStandard: number;
  setTariffaStandard: (val: number) => void;
  tariffaSoci: number;
  setTariffaSoci: (val: number) => void;
  isSalaSuspended: boolean;
  richiedePin: (cb: (sid: string) => void, desc: string) => void;
  salvaTariffe: (sid: string) => void;
  supportActive: boolean;
  toggleSupport: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto bg-gray-900 p-10 rounded-[3rem] border-4 border-gray-800 animate-in slide-in-from-bottom-8 shadow-2xl">
      <h3 className="text-3xl font-black text-white uppercase italic mb-8 border-b border-gray-800 pb-4">Configurazione Tariffe</h3>
      <div className="space-y-8 mb-12">
        <div><label className="block text-gray-500 font-black text-xs uppercase mb-4 text-left">Standard (€/h)</label><input type="number" value={tariffaStandard} onChange={(e) => setTariffaStandard(parseFloat(e.target.value) || 0)} className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-4xl text-white font-black" disabled={isSalaSuspended} /></div>
        <div><label className="block text-yellow-500 font-black text-xs uppercase mb-4 text-left">Soci (€/h)</label><input type="number" value={tariffaSoci} onChange={(e) => setTariffaSoci(parseFloat(e.target.value) || 0)} className="w-full bg-black border border-yellow-900 p-6 rounded-2xl text-4xl text-white font-black" disabled={isSalaSuspended} /></div>
      </div>
      {!isSalaSuspended && (
        <button onClick={() => richiedePin((sid) => salvaTariffe(sid), "Aggiornamento Tariffe")} className="w-full py-8 bg-green-600 text-black font-black uppercase text-xl rounded-3xl shadow-xl active:scale-95 transition-all">SALVA TARIFFE</button>
      )}
      {isSalaSuspended && (
        <p className="text-red-500 font-black uppercase text-xs">Modifica Tariffe disabilitata in Sola Lettura</p>
      )}

      {/* BLOCCO PRIVACY E SUPPORTO */}
      <div className="mt-12 pt-8 border-t border-gray-800">
        <h3 className="text-xl font-black text-pink-500 uppercase italic mb-6">Sicurezza e Privacy</h3>
        <div className="bg-black p-6 rounded-[2rem] border border-pink-900/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="font-bold text-white uppercase tracking-widest text-sm">Accesso Tecnico Remoto</p>
            <p className="text-xs text-gray-500 mt-1">Consenti al Super Admin di accedere per assistenza.</p>
          </div>
          <button 
            disabled={isSalaSuspended}
            onClick={toggleSupport}
            className={`px-8 py-4 rounded-2xl font-black text-sm uppercase transition-all ${isSalaSuspended ? 'bg-gray-800 text-gray-500' : supportActive ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}
          >
            {supportActive ? "DISATTIVA" : "ATTIVA"}
          </button>
        </div>
      </div>
    </div>
  );
}