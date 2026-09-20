 "use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import ChessBoard from "../components/ChessBoard";
import ChessClock from "../components/ChessClock";
import MoveHistory from "../components/MoveHistory";
import { Modal } from "../components/Modal";
import { themes, pieceSets } from "../lib/themes";
import { Settings, SavedGame } from "../lib/types";
import { defaultSettings, loadCurrent, loadHistory, loadPieces, loadSettings, loadTheme, saveCurrent, saveHistory, savePieces, saveSettings, saveTheme, addHistory, clearCurrent, formatTime } from "../lib/storage";
import { soundCapture, soundCheck, soundEnd, soundMove, soundPromotion, soundCastle } from "../lib/sounds";
const controls = ["1+0","2+1","3+0","3+2","5+0","5+3","10+0","10+5","15+10","30+0"];


function parseTC(tc:string){const [m,i]=tc.split("+").map(Number); return {base:m*60, inc:i};}

export default function Home() {
  const [view,setView]=useState<"home"|"play"|"themes"|"pieces"|"settings"|"history"|"replay">("home");
  const [chess,setChess]=useState(()=>new Chess());
  const [selected,setSelected]=useState<string|null>(null);
  const [legal,setLegal]=useState<string[]>([]);
  const [lastMove,setLastMove]=useState<{from:string,to:string}|null>(null);
  const [orientation,setOrientation]=useState<"w"|"b">("w");
  const [themeId,setThemeId]=useState("royal-gold");
  const [pieceId,setPieceId]=useState("royal-gold");
  const [settings,setSettings]=useState<Settings>(defaultSettings);
  const [tc,setTc]=useState("10+0");
  const [whiteClock,setWhiteClock]=useState(600);
  const [blackClock,setBlackClock]=useState(600);
  const [moves,setMoves]=useState<string[]>([]);
  const [captured,setCaptured]=useState<{w:string[],b:string[]}>({w:[],b:[]});
  const [result,setResult]=useState<{title:string;detail:string}|null>(null);
  const [promotion,setPromotion]=useState<{from:string;to:string}|null>(null);
  const [history,setHistory]=useState<SavedGame[]>([]);
  const [replay,setReplay]=useState<SavedGame|null>(null);
  const [replayIndex,setReplayIndex]=useState(0);
  const [hydrated,setHydrated]=useState(false);
  const lastTick=useRef<number|null>(null);

  const theme=useMemo(()=>themes.find(t=>t.id===themeId)!,[themeId]);
  const pieces=useMemo(()=>pieceSets.find(p=>p.id===pieceId)!,[pieceId]);

  useEffect(()=>{
    const s=loadSettings(); setSettings(s); setTc(s.defaultTime);
    setThemeId(loadTheme()); setPieceId(loadPieces()); setHistory(loadHistory());
    const current=loadCurrent();
    if(current?.fen){
      try {
        const c=new Chess(current.fen); setChess(c); setMoves(current.moves||[]);
        setLastMove(current.lastMove||null); setWhiteClock(current.whiteClock??parseTC(current.tc||s.defaultTime).base); setBlackClock(current.blackClock??parseTC(current.tc||s.defaultTime).base);
        setTc(current.tc||s.defaultTime); setCaptured(current.captured||{w:[],b:[]}); setView("play");
      } catch {}
    }
    setHydrated(true);
  },[]);

  useEffect(()=>{
    if(!hydrated || view!=="play" || result) return;
    const id=setInterval(()=>{
      if(lastTick.current===null) lastTick.current=Date.now();
      const now=Date.now(); const delta=(now-lastTick.current)/1000; lastTick.current=now;
      if(chess.turn()==="w") setWhiteClock(v=>Math.max(0,v-delta)); else setBlackClock(v=>Math.max(0,v-delta));
    },200);
    return ()=>clearInterval(id);
  },[hydrated,view,result,chess]);

  useEffect(()=>{
    if(!hydrated || result) return;
    if(whiteClock<=0){finish("TIME OUT","Black wins on time");}
    if(blackClock<=0){finish("TIME OUT","White wins on time");}
  },[whiteClock,blackClock]);

  useEffect(()=>{
    if(!hydrated || !settings.autoSave || view!=="play" || result) return;
    saveCurrent({fen:chess.fen(),moves,lastMove,whiteClock,blackClock,tc,captured});
  },[hydrated,settings.autoSave,chess,moves,lastMove,whiteClock,blackClock,tc,captured,result,view]);

  function finish(title:string,detail:string){
    setResult({title,detail});
    clearCurrent();
    if(settings.masterSound && settings.gameEndSound) soundEnd();
  }

  function startNew(time=tc){
    const c=new Chess(); const {base}=parseTC(time);
    setChess(c); setMoves([]); setSelected(null); setLegal([]); setLastMove(null); setCaptured({w:[],b:[]});
    setWhiteClock(base); setBlackClock(base); setTc(time); setResult(null); setPromotion(null); lastTick.current=Date.now(); clearCurrent(); setView("play");
  }

  function makeMove(from:string,to:string,promo?:string){
    try {
      const moving = chess.get(from as any);
      const beforeTurn=chess.turn();
      const isCapture=chess.get(to as any) || (moving?.type==="p" && from[0]!==to[0]);
      const isCastle=moving?.type==="k" && Math.abs(from.charCodeAt(0)-to.charCodeAt(0))===2;
      const c=new Chess(chess.fen());
      const mv=c.move({from,to,promotion:promo as any});
      const nextMoves=[...moves,mv.san];
      const {inc}=parseTC(tc);
      if(beforeTurn==="w") setWhiteClock(v=>v+inc); else setBlackClock(v=>v+inc);
      setChess(c); setMoves(nextMoves); setLastMove({from,to}); setSelected(null); setLegal([]);
      if(isCapture) setCaptured(calcCaptured(c));
      if(settings.masterSound){ if(mv.san.includes("#")||c.isCheckmate()) soundCheck(); else if(mv.san.includes("+")||c.isCheck()) soundCheck(); else if(isCastle) soundCastle(); else if(promo) soundPromotion(); else if(isCapture && settings.captureSound) soundCapture(); else if(settings.moveSound) soundMove(); }
      if(c.isCheckmate()) finish("CHECKMATE", `${beforeTurn==="w"?"White":"Black"} wins`);
      else if(c.isStalemate()) finish("STALEMATE","Draw by stalemate");
      else if(c.isDraw()) finish("DRAW","Draw");
    } catch {}
  }

  function calcCaptured(c:Chess){
    const start={p:8,n:2,b:2,r:2,q:1,k:1} as any;
    const current:any={w:{p:0,n:0,b:0,r:0,q:0,k:0},b:{p:0,n:0,b:0,r:0,q:0,k:0}};
    c.board().flat().forEach(p=>{if(p) current[p.color][p.type]++;});
    const order=["q","r","b","n","p"];
    const w:string[]=[], b:string[]=[];
    for(const t of order){for(let i=0;i<start[t]-current.w[t];i++) w.push(t);}
    for(const t of order){for(let i=0;i<start[t]-current.b[t];i++) b.push(t);}
    return {w,b};
  }

  function squareClick(square:string){
    if(result || promotion) return;
    const piece=chess.get(square as any);
    if(selected){
      if(square===selected){setSelected(null);setLegal([]);return;}
      if(legal.includes(square)){
        const p=chess.get(selected as any);
        if(p?.type==="p" && (square[1]==="8"||square[1]==="1")) { setPromotion({from:selected,to:square}); return; }
        makeMove(selected,square);
        return;
      }
    }
    if(piece && piece.color===chess.turn()){
      setSelected(square);
      setLegal(chess.moves({square:square as any,verbose:true}).map((m:any)=>m.to));
    } else { setSelected(null); setLegal([]); }
  }

  function undo(){
    if(moves.length===0 || result) return;
    const remaining=moves.slice(0,-1);
    const c=new Chess();
    for(const san of remaining){ try{c.move(san)}catch{} }
    setChess(c);
    setMoves(remaining);
    setLastMove(remaining.length ? (() => {
      const replay=new Chess();
      let lm:{from:string,to:string}|null=null;
      for(const san of remaining){ const m:any=replay.move(san); lm={from:m.from,to:m.to}; }
      return lm;
    })() : null);
    setSelected(null); setLegal([]);
    setCaptured(calcCaptured(c)); setResult(null); clearCurrent(); lastTick.current=Date.now();
  }

  function resign(){ finish("RESIGNATION", `${chess.turn()==="w"?"Black":"White"} wins`); }
  function offerDraw(){ finish("DRAW","Game drawn by agreement"); }

  function saveFinished(){
    if(!result) return;
    const game:SavedGame={id:crypto.randomUUID(),date:new Date().toISOString(),result:result.title,resultDetail:result.detail,moves,pgn:moves.join(" "),timeControl:tc,white:"Player 1",black:"Player 2"};
    addHistory(game); setHistory(loadHistory());
  }

  useEffect(()=>{ if(result) saveFinished(); },[result]);

  function setTheme(id:string){setThemeId(id);saveTheme(id);}
  function setPieces(id:string){setPieceId(id);savePieces(id);}
  function patchSettings(p:Partial<Settings>){const n={...settings,...p};setSettings(n);saveSettings(n);}

  const status = result ? result.title : chess.isCheckmate() ? "CHECKMATE" : chess.isCheck() ? "CHECK" : chess.turn()==="w" ? "WHITE TO MOVE" : "BLACK TO MOVE";

  return <main className="luxe-shell">
    <header className="sticky top-0 z-30 border-b border-white/5 bg-[#090a0c]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 lg:px-8">
        <button onClick={()=>setView("home")} className="text-left">
          <div className="text-xl font-black tracking-[.16em]">♛ <span className="gold-text">LUXE CHESS</span></div>
          <div className="mt-0.5 text-[10px] uppercase tracking-[.3em] text-zinc-500">Premium Offline Chess</div>
        </button>
        <div className="flex items-center gap-2">
          {view!=="home" && <button onClick={()=>setView("home")} className="rounded-xl px-3 py-2 text-sm text-zinc-300 hover:bg-white/5">Home</button>}
          <button onClick={()=>patchSettings({masterSound:!settings.masterSound})} className="rounded-xl border border-white/10 px-3 py-2 text-sm">{settings.masterSound?"🔊":"🔇"}</button>
        </div>
      </div>
    </header>

    {view==="home" && <section className="mx-auto flex min-h-[calc(100vh-82px)] max-w-6xl items-center justify-center px-5 py-12">
      <div className="w-full max-w-xl text-center">
        <div className="mb-8 text-7xl">♛</div>
        <h1 className="text-6xl font-black tracking-tight sm:text-8xl"><span className="gold-text">LUXE</span> CHESS</h1>
        <p className="mt-4 text-sm uppercase tracking-[.36em] text-zinc-500">Premium Offline Chess</p>
        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <button onClick={()=>startNew()} className="rounded-2xl bg-[#d7b46a] px-5 py-4 font-bold text-black shadow-[0_12px_35px_rgba(215,180,106,.18)]">Play Chess</button>
          <button onClick={()=>startNew()} className="glass rounded-2xl px-5 py-4 font-semibold">New Game</button>
          <button onClick={()=>loadCurrent()?.fen ? setView("play") : startNew()} className="glass rounded-2xl px-5 py-4 font-semibold">Continue Game</button>
          <button onClick={()=>setView("themes")} className="glass rounded-2xl px-5 py-4 font-semibold">Themes</button>
          <button onClick={()=>setView("pieces")} className="glass rounded-2xl px-5 py-4 font-semibold">Piece Collection</button>
          <button onClick={()=>setView("settings")} className="glass rounded-2xl px-5 py-4 font-semibold">Settings</button>
          <button onClick={()=>{setHistory(loadHistory());setView("history")}} className="glass rounded-2xl px-5 py-4 font-semibold sm:col-span-2">Game History</button>
        </div>
        <div className="mt-10 flex items-center justify-center gap-3 text-xs text-zinc-500"><span className="h-px w-12 bg-white/10"/><span>ONE DEVICE · TWO HUMAN PLAYERS · OFFLINE</span><span className="h-px w-12 bg-white/10"/></div>
      </div>
    </section>}

    {view==="play" && <section className="mx-auto grid max-w-[1500px] gap-6 px-3 py-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:px-8">
      <div className="flex flex-col items-center gap-4">
        <div className="flex w-full max-w-[760px] items-center justify-between px-1">
          <div><div className="text-xs uppercase tracking-[.25em] text-zinc-500">Local 2 Player</div><div className="mt-1 font-semibold">{status}</div></div>
          <div className="status-pill rounded-full px-3 py-1 text-xs">{tc.replace("+"," + ")}</div>
        </div>
        <ChessBoard chess={chess} orientation={orientation} selected={selected} legal={legal} lastMove={lastMove} theme={theme} pieces={pieces} settings={settings} onSquare={squareClick}/>
      </div>

      <aside className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <ChessClock name="Player 2" color="b" seconds={blackClock} active={chess.turn()==="b" && !result}/>
          <ChessClock name="Player 1" color="w" seconds={whiteClock} active={chess.turn()==="w" && !result}/>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Move History</h2><span className="text-xs text-zinc-500">{moves.length} ply</span></div>
          <MoveHistory moves={moves}/>
        </div>
        <div className="glass rounded-2xl p-4">
          <h2 className="mb-3 font-semibold">Captured</h2>
          <div className="grid grid-cols-2 gap-3 text-sm"><div><div className="mb-1 text-xs uppercase tracking-widest text-zinc-500">White captured</div><div className="min-h-7">{captured.w.join(" ")}</div></div><div><div className="mb-1 text-xs uppercase tracking-widest text-zinc-500">Black captured</div><div className="min-h-7">{captured.b.join(" ")}</div></div></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={undo} className="glass rounded-xl px-3 py-3 text-sm">Undo</button>
          <button onClick={()=>setOrientation(v=>v==="w"?"b":"w")} className="glass rounded-xl px-3 py-3 text-sm">Flip Board</button>
          <button onClick={resign} disabled={!!result} className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-3 text-sm text-red-200 disabled:opacity-40">Resign</button>
          <button onClick={offerDraw} disabled={!!result} className="rounded-xl border border-white/10 bg-white/[.03] px-3 py-3 text-sm disabled:opacity-40">Draw</button>
        </div>
        <button onClick={()=>startNew()} className="w-full rounded-xl bg-[#d7b46a] px-4 py-3 font-semibold text-black">New Game</button>
        <div className="glass rounded-2xl p-4">
          <div className="mb-3 text-xs uppercase tracking-[.2em] text-zinc-500">Time Control</div>
          <div className="grid grid-cols-5 gap-2">{controls.map(x=><button key={x} onClick={()=>startNew(x)} className={`rounded-lg border px-2 py-2 text-xs ${tc===x?"border-[#d7b46a]/60 bg-[#d7b46a]/10 text-[#efd99e]":"border-white/10 text-zinc-400"}`}>{x}</button>)}</div>
        </div>
      </aside>
    </section>}

    {view==="themes" && <Gallery title="Board Themes" items={themes} selected={themeId} onSelect={setTheme} render={(t:any)=><div className="h-28 rounded-xl p-2" style={{background:t.frame}}><div className="grid h-full grid-cols-4 overflow-hidden rounded-lg">{Array.from({length:16}).map((_,i)=><span key={i} style={{background:(i+Math.floor(i/4))%2===0?t.light:t.dark}}/>)}</div></div>}/>}
    {view==="pieces" && <Gallery title="Piece Collections" items={pieceSets} selected={pieceId} onSelect={setPieces} render={(p:any)=><div className="flex h-28 items-center justify-center gap-3 rounded-xl bg-black/20 text-4xl"><span style={{color:p.white,textShadow:p.shadow}}>♔♕♖</span><span style={{color:p.black,textShadow:p.shadow}}>♚♛♜</span></div>}/>}
    {view==="settings" && <SettingsView settings={settings} patch={patchSettings}/>}
    {view==="history" && <HistoryView games={history} onOpen={(g)=>{setReplay(g);setReplayIndex(0);setView("replay")}} onDelete={(id)=>{const n=history.filter(g=>g.id!==id);setHistory(n);saveHistory(n)}}/>}
    {view==="replay" && replay && <ReplayView game={replay} index={replayIndex} setIndex={setReplayIndex} onBack={()=>setView("history")} theme={theme} pieces={pieces} settings={settings}/>}

    {promotion && <Modal><div className="text-center"><div className="text-xs uppercase tracking-[.3em] text-zinc-500">Pawn Promotion</div><h2 className="mt-2 text-3xl font-bold gold-text">Choose your piece</h2><div className="mt-7 grid grid-cols-4 gap-3">{[["q","♕","Queen"],["r","♖","Rook"],["b","♗","Bishop"],["n","♘","Knight"]].map(([v,g,n])=><button key={v} onClick={()=>{makeMove(promotion.from,promotion.to,v);setPromotion(null)}} className="glass rounded-2xl p-4"><div className="text-5xl">{g}</div><div className="mt-2 text-sm">{n}</div></button>)}</div></div></Modal>}
    {result && <Modal onClose={()=>setResult(null)}><div className="text-center"><div className="text-xs uppercase tracking-[.35em] text-zinc-500">{result.title}</div><h2 className="mt-3 text-4xl font-black gold-text">{result.detail}</h2><div className="mt-8 grid gap-3 sm:grid-cols-2"><button onClick={()=>startNew()} className="rounded-xl bg-[#d7b46a] px-4 py-3 font-semibold text-black">New Game</button><button onClick={()=>startNew(tc)} className="glass rounded-xl px-4 py-3">Rematch</button><button onClick={()=>{setResult(null)}} className="glass rounded-xl px-4 py-3">View Moves</button><button onClick={()=>setResult(null)} className="glass rounded-xl px-4 py-3">Close</button></div></div></Modal>}
  </main>;
}

function Gallery({title,items,selected,onSelect,render}:any){
  return <section className="mx-auto max-w-6xl px-5 py-10"><div className="mb-8"><div className="text-xs uppercase tracking-[.3em] text-zinc-500">LUXE CHESS</div><h1 className="mt-2 text-4xl font-bold">{title}</h1></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{items.map((x:any)=><button key={x.id} onClick={()=>onSelect(x.id)} className={`glass rounded-2xl p-3 text-left transition hover:-translate-y-0.5 ${selected===x.id?"ring-1 ring-[#d7b46a]":""}`}>{render(x)}<div className="mt-3 flex items-center justify-between"><span className="font-semibold">{x.name}</span>{selected===x.id&&<span className="text-xs text-[#efd99e]">Selected</span>}</div></button>)}</div></section>
}

function SettingsView({settings,patch}:{settings:Settings;patch:(x:Partial<Settings>)=>void}){
  const rows:[keyof Settings,string][]=[["showCoordinates","Show coordinates"],["showLegalMoves","Show legal moves"],["showLastMove","Show last move"],["boardAnimation","Board animation"],["moveSound","Move sound"],["captureSound","Capture sound"],["checkSound","Check sound"],["gameEndSound","Game-end sound"],["masterSound","Master sound toggle"],["autoSave","Auto-save game"]];
  return <section className="mx-auto max-w-3xl px-5 py-10"><div className="mb-8"><div className="text-xs uppercase tracking-[.3em] text-zinc-500">LUXE CHESS</div><h1 className="mt-2 text-4xl font-bold">Settings</h1></div><div className="glass divide-y divide-white/5 rounded-3xl">{rows.map(([key,label])=><button key={key} onClick={()=>patch({[key]:!settings[key]} as any)} className="flex w-full items-center justify-between px-5 py-4 text-left"><span>{label}</span><span className={`h-6 w-11 rounded-full p-1 transition ${settings[key]?"bg-[#d7b46a]":"bg-white/10"}`}><span className={`block h-4 w-4 rounded-full bg-black transition ${settings[key]?"translate-x-5":"translate-x-0"}`}/></span></button>)}<div className="flex items-center justify-between px-5 py-4"><span>Default time control</span><select value={settings.defaultTime} onChange={e=>patch({defaultTime:e.target.value})} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">{controls.map(x=><option key={x}>{x}</option>)}</select></div></div></section>
}

function HistoryView({games,onOpen,onDelete}:{games:SavedGame[];onOpen:(g:SavedGame)=>void;onDelete:(id:string)=>void}){
  return <section className="mx-auto max-w-5xl px-5 py-10"><div className="mb-8"><div className="text-xs uppercase tracking-[.3em] text-zinc-500">LUXE CHESS</div><h1 className="mt-2 text-4xl font-bold">Game History</h1></div>{games.length===0?<div className="glass rounded-3xl p-12 text-center text-zinc-500">No finished games yet.</div>:<div className="space-y-3">{games.map(g=><div key={g.id} className="glass flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-semibold">{g.result} · {g.resultDetail}</div><div className="mt-1 text-xs text-zinc-500">{new Date(g.date).toLocaleString()} · {g.moves.length} ply · {g.timeControl}</div></div><div className="flex gap-2"><button onClick={()=>onOpen(g)} className="rounded-lg bg-[#d7b46a] px-3 py-2 text-sm text-black">Replay</button><button onClick={()=>onDelete(g.id)} className="rounded-lg border border-white/10 px-3 py-2 text-sm">Delete</button></div></div>)}</div>}</section>
}

function ReplayView({game,index,setIndex,onBack,theme,pieces,settings}:{game:SavedGame;index:number;setIndex:(n:number)=>void;onBack:()=>void;theme:any;pieces:any;settings:Settings}){
  const c=useMemo(()=>{const x=new Chess(); for(let i=0;i<index;i++) try{x.move(game.moves[i])}catch{} return x},[game,index]);
  return <section className="mx-auto grid max-w-[1200px] gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_330px]"><div className="flex justify-center"><ChessBoard chess={c} orientation="w" selected={null} legal={[]} lastMove={null} theme={theme} pieces={pieces} settings={settings} onSquare={()=>{}}/></div><aside className="glass rounded-2xl p-5"><div className="text-xs uppercase tracking-[.3em] text-zinc-500">Replay</div><h1 className="mt-2 text-2xl font-bold">{game.result}</h1><div className="mt-1 text-sm text-zinc-400">{game.resultDetail}</div><div className="mt-6 text-sm">{index} / {game.moves.length} plies</div><input className="mt-3 w-full" type="range" min="0" max={game.moves.length} value={index} onChange={e=>setIndex(Number(e.target.value))}/><div className="mt-5 grid grid-cols-4 gap-2"><button onClick={()=>setIndex(0)} className="glass rounded-lg p-2">⏮</button><button onClick={()=>setIndex(Math.max(0,index-1))} className="glass rounded-lg p-2">◀</button><button onClick={()=>setIndex(Math.min(game.moves.length,index+1))} className="glass rounded-lg p-2">▶</button><button onClick={()=>setIndex(game.moves.length)} className="glass rounded-lg p-2">⏭</button></div><button onClick={onBack} className="mt-4 w-full rounded-lg border border-white/10 p-3">Back to History</button></aside></section>
}

const controls = ["1+0","2+1","3+0","3+2","5+0","5+3","10+0","10+5","15+10","30+0"];
