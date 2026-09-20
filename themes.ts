import { Theme, PieceSet } from "./types";

export const themes: Theme[] = [
  ["royal-gold","Royal Gold","#ead9ad","#6b4e2e","#d7b46a","#4d361c"],
  ["emerald","Emerald","#d7e5c7","#315c49","#72c09b","#1d382d"],
  ["sapphire","Sapphire","#d5e0ed","#315171","#8fbbe8","#20364d"],
  ["ruby","Ruby","#ead0d0","#713434","#e28a8a","#4a2020"],
  ["ice","Ice Glass","#e7f2f3","#6b8891","#bfeaf0","#31454b"],
  ["obsidian","Obsidian","#9c9c9c","#25262a","#d5d5d5","#141519"],
  ["midnight","Midnight","#c7cbd5","#202a42","#9caee8","#171e31"],
  ["marble","Marble","#ece7db","#888077","#d8c4a0","#514a43"],
  ["walnut","Walnut","#e1c49b","#70462e","#d8a96c","#4a2d1d"],
  ["classic","Classic Brown","#f0d9b5","#b58863","#caa65b","#5b3a23"],
  ["tournament","Tournament Green","#eeeed2","#769656","#d6c26e","#445b35"],
  ["neon","Neon Cyber","#d4f4ea","#183b40","#35f1d0","#0d2428"],
  ["ocean","Ocean","#d5e8eb","#326a78","#72d0df","#1f454f"],
  ["crimson","Crimson","#f0d3c8","#7b2830","#ef8e86","#4e1c21"],
  ["sandstone","Sandstone","#f1dfb9","#9b7955","#dfb978","#674e37"],
  ["platinum","Platinum","#e3e5e8","#65686e","#d5d8dd","#383a3f"]
].map(([id,name,light,dark,accent,frame]) => ({id,name,light,dark,accent,frame}));

export const pieceSets: PieceSet[] = [
  ["royal-gold","Royal Gold","#f7d98b","#191713","0 3px 5px #000"],
  ["platinum","Platinum","#f1f2f4","#151619","0 3px 6px #000"],
  ["obsidian","Obsidian","#d7d7d7","#08090a","0 3px 7px #000"],
  ["ruby","Ruby Crown","#f5c1b7","#3a1114","0 3px 7px #170507"],
  ["ice","Ice Glass","#f2ffff","#29434a","0 2px 8px #10262b"],
  ["ivory","Imperial Ivory","#fff4d6","#27201a","0 3px 6px #000"],
  ["velvet","Velvet Black","#ded9d1","#09090a","0 4px 7px #000"],
  ["marble","Marble King","#f4efe5","#50483e","0 3px 6px #27221d"],
  ["cyan","Neon Cyan","#8fffe9","#071c20","0 0 10px #35f1d0"],
  ["blood","Blood Moon","#ffd0c9","#2a0709","0 0 8px #a83232"],
  ["gold-minimal","Golden Minimal","#f4d58b","#1b1710","0 2px 4px #000"],
  ["silver-knight","Silver Knight","#e9ecf0","#15171a","0 2px 5px #000"],
  ["staunton","Classic Staunton","#f2e4c2","#201b16","0 3px 5px #000"],
  ["modern","Modern Minimal","#fafafa","#101010","0 3px 5px #000"],
  ["gothic","Gothic","#e8d7bf","#171116","0 4px 8px #000"],
  ["crystal","Crystal","#f4ffff","#244a55","0 0 9px rgba(180,255,255,.55)"]
].map(([id,name,white,black,shadow]) => ({id,name,white,black,shadow}));
