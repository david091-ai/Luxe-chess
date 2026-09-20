export type Color = "w" | "b";
export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

export type Theme = {
  id: string;
  name: string;
  light: string;
  dark: string;
  accent: string;
  frame: string;
};

export type PieceSet = {
  id: string;
  name: string;
  white: string;
  black: string;
  shadow: string;
};

export type Settings = {
  showCoordinates: boolean;
  showLegalMoves: boolean;
  showLastMove: boolean;
  boardAnimation: boolean;
  moveSound: boolean;
  captureSound: boolean;
  checkSound: boolean;
  gameEndSound: boolean;
  masterSound: boolean;
  defaultTime: string;
  autoSave: boolean;
};

export type SavedGame = {
  id: string;
  date: string;
  result: string;
  resultDetail: string;
  moves: string[];
  pgn: string;
  timeControl: string;
  white: string;
  black: string;
};
