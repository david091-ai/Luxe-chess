let ctx: AudioContext | null = null;

const beep = (frequency: number, duration: number, type: OscillatorType = "sine") => {
  try {
    ctx ??= new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = frequency;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + duration + 0.02);
  } catch {}
};

export const soundMove = () => beep(520, .07);
export const soundCapture = () => { beep(310,.08,"triangle"); setTimeout(()=>beep(210,.07,"triangle"),45); };
export const soundCheck = () => { beep(740,.09); setTimeout(()=>beep(920,.11),75); };
export const soundCastle = () => beep(440,.12);
export const soundPromotion = () => { beep(660,.08); setTimeout(()=>beep(880,.12),70); };
export const soundEnd = () => { beep(520,.12); setTimeout(()=>beep(390,.14),100); setTimeout(()=>beep(260,.2),210); };
