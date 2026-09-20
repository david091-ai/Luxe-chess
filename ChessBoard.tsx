import { Chess } from "chess.js";
import { PieceSet, Settings, Theme } from "../lib/types";

const glyphs: Record<string,string> = {
  wk:"♔", wq:"♕", wr:"♖", wb:"♗", wn:"♘", wp:"♙",
  bk:"♚", bq:"♛", br:"♜", bb:"♝", bn:"♞", bp:"♟"
};

type Props = {
  chess: Chess;
  orientation: "w"|"b";
  selected: string | null;
  legal: string[];
  lastMove: {from:string,to:string}|null;
  theme: Theme;
  pieces: PieceSet;
  settings: Settings;
  onSquare: (square: string) => void;
};

export default function ChessBoard({ chess, orientation, selected, legal, lastMove, theme, pieces, settings, onSquare }: Props) {
  const ranks = orientation === "w" ? [8,7,6,5,4,3,2,1] : [1,2,3,4,5,6,7,8];
  const files = orientation === "w" ? ["a","b","c","d","e","f","g","h"] : ["h","g","f","e","d","c","b","a"];
  const board = chess.board();
  const pieceMap = new Map(board.flatMap((row,r)=>row.map((p,f)=>p ? [`${files[f]}${ranks[r]}`,p] as const : null).filter(Boolean) as [string,any][]));
  const isCheck = chess.isCheck();
  const checked = isCheck ? chess.board().flatMap((row,r)=>row.map((p,f)=>p?.type==="k" && p.color===chess.turn() ? `${files[f]}${ranks[r]}` : null)).find(Boolean) : null;

  return (
    <div className="board-wrap" style={{background:`linear-gradient(145deg, ${theme.frame}, ${theme.accent} 35%, ${theme.frame} 65%, #111)`}}>
      <div className="board">
        {ranks.flatMap((rank) => files.map((file) => {
          const square = `${file}${rank}`;
          const piece = pieceMap.get(square);
          const fileIndex = files.indexOf(file);
          const rankIndex = ranks.indexOf(rank);
          const light = (fileIndex + rankIndex) % 2 === 0;
          const isSelected = selected === square;
          const isLegal = legal.includes(square);
          const isLast = settings.showLastMove && !!lastMove && (lastMove.from===square || lastMove.to===square);
          const isChecked = checked === square;
          const color = piece ? piece.color : null;
          return (
            <button key={square} className="square" onClick={()=>onSquare(square)}
              style={{
                background: isChecked ? "radial-gradient(circle, rgba(210,48,48,.88), rgba(110,24,24,.72))" : isLast ? `linear-gradient(rgba(215,180,106,.38),rgba(215,180,106,.38)), ${light?theme.light:theme.dark}` : light ? theme.light : theme.dark,
                color: light ? "#46351e" : "#f5e8c7",
                boxShadow: isSelected ? `inset 0 0 0 4px ${theme.accent}` : "none"
              }}>
              {settings.showCoordinates && (fileIndex===0) && <span className="coord rank">{rank}</span>}
              {settings.showCoordinates && (rankIndex===7) && <span className="coord file">{file}</span>}
              {piece && <span className="piece" style={{color: color==="w" ? pieces.white : pieces.black, textShadow: pieces.shadow}}>{glyphs[color + piece.type]}</span>}
              {settings.showLegalMoves && isLegal && !piece && <span style={{width:"22%",height:"22%",borderRadius:"50%",background:"rgba(30,30,25,.28)"}}/>}
              {settings.showLegalMoves && isLegal && piece && <span style={{position:"absolute",inset:"8%",borderRadius:"50%",border:`4px solid rgba(175,40,38,.7)`}}/>}
            </button>
          );
        }))}
      </div>
    </div>
  );
}
