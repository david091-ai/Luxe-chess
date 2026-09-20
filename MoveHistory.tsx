export default function MoveHistory({ moves }: { moves:string[] }) {
  const rows = [];
  for (let i=0;i<moves.length;i+=2) rows.push({n:i/2+1,w:moves[i],b:moves[i+1]});
  return <div className="scroll-thin max-h-72 overflow-auto pr-1">
    {rows.length===0 ? <div className="py-8 text-center text-sm text-zinc-500">Moves will appear here.</div> :
      rows.map(r=><div key={r.n} className="grid grid-cols-[36px_1fr_1fr] rounded-lg px-2 py-2 text-sm even:bg-white/[.025]"><span className="text-zinc-500">{r.n}.</span><span>{r.w}</span><span>{r.b||"—"}</span></div>)}
  </div>;
}
