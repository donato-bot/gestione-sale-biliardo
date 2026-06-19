export default function PonteDiComando({
  onGoToHub,
  onOpenConfig,
  onOpenHelp
}: {
  onGoToHub: () => void;
  onOpenConfig: () => void;
  onOpenHelp: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-700 sticky top-0 z-[100] print:hidden">
      <button 
        onClick={onGoToHub} 
        className="px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-white font-black text-sm uppercase"
      >
        ← MENU
      </button>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={onOpenConfig} 
          className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 font-black text-xs uppercase text-white shadow-lg"
        >
          ⚙️ CONFIGURA
        </button>
        <button 
          onClick={onOpenHelp} 
          className="w-10 h-10 flex items-center justify-center bg-cyan-600 rounded-full hover:bg-cyan-500 shadow-lg text-white font-black"
        >
          ?
        </button>
      </div>
    </div>
  );
}