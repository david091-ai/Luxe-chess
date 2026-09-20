import { formatTime } from "../lib/storage";

export default function ChessClock({ name, color, seconds, active, onClick }: {name:string;color:"w"|"b";seconds:number;active:boolean;onClick?:()=>void}) {
  return <button onClick={onClick} className={`glass rounded-2xl p-4 text-left transition ${active ? "ring-1 ring-[#d7b46a]/70" : "opacity-75"}`}>
    <div className="flex items-center justify-between gap-4">
      <div><div className="text-xs uppercase tracking-[.22em] text-zinc-400">{color==="w"?"White":"Black"}</div><div className="mt-1 font-semibold">{name}</div></div>
      <div className={`font-mono text-3xl font-semibold tracking-tight ${seconds<=10 ? "text-red-300" : ""}`}>{formatTime(seconds)}</div>
    </div>
  </button>;
}
