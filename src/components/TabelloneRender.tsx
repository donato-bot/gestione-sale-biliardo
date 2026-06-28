// components/TabelloneRender.tsx
export default function TabelloneRender({ partite, vistaCompatta = false }: { partite: any[], vistaCompatta?: boolean }) {
  const getNomeTurno = (numPartite: number) => {
    if (numPartite === 1) return "Finale";
    if (numPartite === 2) return "Semifinali";
    if (numPartite === 4) return "Quarti di Finale";
    if (numPartite === 8) return "Ottavi di Finale";
    if (numPartite === 16) return "Sedicesimi";
    return `Turno Preliminare`;
  };

  return (
    <div className="flex gap-12 min-w-max h-full min-h-[600px] items-stretch pb-4">
      {[...new Set(partite.map(p => p.turno))].sort((a, b) => a - b).map(turnoNum => {
        const partiteTurno = partite.filter(p => p.turno === turnoNum);
        return (
          <div key={turnoNum} className="flex flex-col shrink-0" style={{ width: vistaCompatta ? '230px' : '320px' }}>
            <h3 className="text-center font-black uppercase tracking-widest text-[#00E5FF] bg-[#1A1D24] py-3 rounded-lg border border-[#2A2E39] text-sm mb-8">
              {getNomeTurno(partiteTurno.length)}
            </h3>
            <div className="flex-1 flex flex-col justify-around gap-4">
              {partiteTurno.map((p) => (
                <div key={p.id} className={`bg-[#1A1D24] border ${p.stato === 'conclusa' ? 'border-[#00E676]/50' : 'border-[#2A2E39]'} rounded-xl p-4 shadow-lg`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Incontro #{p.partita_num}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center bg-[#0B0D14] p-2 rounded-lg border border-[#2A2E39]">
                      <span className={`font-bold truncate text-xs ${p.giocatore1_nome?.includes('BYE') || p.giocatore1_nome === 'In Attesa' ? 'text-gray-600' : 'text-white'}`}>{p.giocatore1_nome}</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#0B0D14] p-2 rounded-lg border border-[#2A2E39]">
                      <span className={`font-bold truncate text-xs ${p.giocatore2_nome?.includes('BYE') || p.giocatore2_nome === 'In Attesa' ? 'text-gray-600' : 'text-white'}`}>{p.giocatore2_nome}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}