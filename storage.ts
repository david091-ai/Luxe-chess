import { SavedGame, Settings } from "./types";

const SETTINGS = "luxe-chess-settings";
const THEME = "luxe-chess-theme";
const PIECES = "luxe-chess-pieces";
const CURRENT = "luxe-chess-current";
const HISTORY = "luxe-chess-history";

export const defaultSettings: Settings = {
  showCoordinates: true,
  showLegalMoves: true,
  showLastMove: true,
  boardAnimation: true,
  moveSound: true,
  captureSound: true,
  checkSound: true,
  gameEndSound: true,
  masterSound: true,
  defaultTime: "10+0",
  autoSave: true,
};

const read = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch { return fallback; }
};

const write = (key: string, value: unknown) => {
  if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(value));
};

export const loadSettings = () => ({ ...defaultSettings, ...read<Partial<Settings>>(SETTINGS, {}) });
export const saveSettings = (v: Settings) => write(SETTINGS, v);
export const loadTheme = () => read<string>(THEME, "royal-gold");
export const saveTheme = (v: string) => write(THEME, v);
export const loadPieces = () => read<string>(PIECES, "royal-gold");
export const savePieces = (v: string) => write(PIECES, v);

export const loadCurrent = () => read<any>(CURRENT, null);
export const saveCurrent = (v: any) => write(CURRENT, v);
export const clearCurrent = () => typeof window !== "undefined" && localStorage.removeItem(CURRENT);

export const loadHistory = () => read<SavedGame[]>(HISTORY, []);
export const saveHistory = (games: SavedGame[]) => write(HISTORY, games);
export const addHistory = (game: SavedGame) => {
  const games = loadHistory();
  saveHistory([game, ...games].slice(0, 100));
};

export const formatTime = (seconds: number) => {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60).toString().padStart(2,"0")}:${(s % 60).toString().padStart(2,"0")}`;
};
