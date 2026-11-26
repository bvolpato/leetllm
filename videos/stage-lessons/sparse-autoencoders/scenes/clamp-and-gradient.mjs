// Scene 10: clamp-and-gradient - "What does the encoder read after the edit?"
// Prediction scene:
// Part 1: Glowing 2D plane with slanted dashed encoder iso-contour lines (z = 2, 3, 4 for x1 + 2x2).
//         Dot starts at [1, 0.5] (z = 2), asks for c = 3, strictly withholds answer (4 and sum 2.5)
//         until clamp-reencode & clamp-sum-result complete!
// Part 2: Gradient test at [1, 0.1] (y = z d + e, score = [3, 100] . y = 13.00):
//         Live residual cancels nudge (slope 0); frozen/detached residual carries dot (slope 3).
import { dotProduct } from 'vizmatic';
import { dynamic, indicate, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  cinemaPlane,
  glowTex,
  heroTitle,
  playCue,
  txt,
  vec,
} from '../parts.mjs';

const CLAMP = { reader: [1, 2], x: [1, 0.5], column: [0, 1], asked: 3, sum: [1, 1] };
const GRADIENT = { z: 1, column: [1, 0], x: [1, 0.1], readout: [3, 100] };

export default function clampAndGradient(s, c) {
  const encode = (v) => Math.max(0, dotProduct(CLAMP.reader, v));
  const cached = encode(CLAMP.x); // 2
  const edited = vec.add(CLAMP.x, vec.scale(CLAMP.column, CLAMP.asked - cached)); // [1, 1.5]

  const atmo = cinemaAtmosphere(ROLE.other, ROLE.residual);
  const title = heroTitle(['What does the encoder', 'read after the edit?'], {
    x: -855,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.other,
  });

  const b = cinemaPlane(s, {
    cx: -365,
    cy: 95,
    width: 960,
    height: 700,
    x: [-1.3, 2.9],
    y: [-1.4, 1.8],
  });

  const rx = 515;

  // --- PART 1: Clamp vs re-encoding ---
  const share = s.value(0);
  const atPt = () =>
    vec.add(CLAMP.x, vec.scale(CLAMP.column, (CLAMP.asked - cached) * share.value));
  const startRing = b.ringOf(CLAMP.x, ROLE.dim, 15, 3);
  const dotNow = b.dotOf(atPt, ROLE.activation, 10, 14);
  const editArrow = b.arrowOf(CLAMP.x, atPt, ROLE.other, { width: 7.5 });
  const colArrow = b.arrowOf([0, 0], CLAMP.column, ROLE.other, { width: 6 });

  const clampEq = glowTex("x' = x + (c - z_f)\\,d_f", {
    x: rx,
    y: -290,
    size: 46,
    color: COSMOS.ink,
    glow: 6,
  });
  clampEq.part('(c - z_f)\\,d_f').forEach((g) => g.color(ROLE.other));

  const keepsEq = glowTex("x = z_f\\,d_f + e \\;\\Rightarrow\\; x' = c\\,d_f + e", {
    x: rx,
    y: -195,
    size: 34,
    color: COSMOS.muted,
    glow: 0,
  });
  keepsEq.parts('e').forEach((gs) => gs.forEach((g) => g.color(ROLE.residual)));

  s.add(atmo, title, b.node, startRing, dotNow);
  c.show('clamp-and-gradient-b0', clampEq);
  c.show('clamp-add', colArrow);
  c.show('clamp-error', keepsEq);

  // Dashed encoder iso-contour lines (x1 + 2x2 = 2, 3, 4)
  const makeLevel = (val) => {
    const leftX = Math.max(-1.25, val - 1.75 * CLAMP.reader[1]);
    const p0 = [2.85, (val - 2.85) / CLAMP.reader[1]];
    const p1 = [leftX, (val - leftX) / CLAMP.reader[1]];
    return line(b.P(p0), b.P(p1), { stroke: '#6074a6', width: 3, dash: [11, 9] }).opacity(0.85);
  };
  const levels = [2, 3, 4].map(makeLevel);
  const levelTags = [
    [2, 0.55, [-18, 44]],
    [3, 2.2, [18, -42]],
    [4, 2.0, [18, -58]],
  ].map(([val, lx, lift]) =>
    b.tagOf([lx, (val - lx) / CLAMP.reader[1]], `z = ${val}`, COSMOS.muted, lift, { size: 28 }),
  );
  const notDualLbl = txt(
    'Dashed lines: encoder readback levels',
    rx,
    -65,
    28,
    COSMOS.muted,
    'sans',
    'center',
  );
  c.show('clamp-notdual', [...levels, notDualLbl]);
  playCue(s, c, 'clamp-notdual', (d) => s.play(b.ticksAlpha.to(0, { duration: d })), { dur: 0.25 });

  const readerEq = glowTex('z = \\max(0,\\ x_1 + 2\\,x_2)', {
    x: rx,
    y: -290,
    size: 42,
    color: COSMOS.ink,
    glow: 5,
  });
  const decEq = glowTex('d_f = [\\,0,\\ 1\\,]', {
    x: rx,
    y: -200,
    size: 42,
    color: ROLE.other,
    glow: 6,
  });

  const hereTag = b.tagOf(CLAMP.x, '[1, 0.5]', ROLE.activation, [-22, 48], {
    anchor: 'right',
    size: 28,
  });
  const thereTag = b.tagOf(edited, '[1, 1.5]', ROLE.activation, [24, -36], {
    anchor: 'left',
    size: 28,
  });

  const factCached = txt(`Cached z = ${cached}`, rx, -85, 36, COSMOS.ink, 'mono', 'center');
  const factAsked = txt(`Target c = ${CLAMP.asked}`, rx, -20, 36, ROLE.mark, 'mono', 'center').glow(
    6,
    ROLE.mark,
  );
  const factReenc = txt(
    `Re-encoded z = ${encode(edited)}`,
    rx,
    50,
    40,
    ROLE.wrong,
    'mono',
    'center',
  ).glow(8, ROLE.wrong);

  const qPrompt = txt('Encoder readback = ?', rx, 200, 42, ROLE.mark, 'serif', 'center').glow(
    8,
    ROLE.mark,
  );
  const sumTxt = txt('Sum readout: 1.5 → 2.5', rx, 195, 34, ROLE.mark, 'mono', 'center');
  const preciseTxt = txt(
    'Saved decomposition set exactly; re-encoding differs',
    rx,
    275,
    26,
    COSMOS.muted,
    'sans',
    'center',
  );

  c.swap('clamp-and-gradient-b1', [clampEq, keepsEq, notDualLbl], [readerEq, ...levelTags]);
  c.show('clamp-at', [hereTag, factCached], { after: true });
  c.show('clamp-decoder', decEq);
  playCue(
    s,
    c,
    'clamp-decoder',
    (d) => s.play(indicate(colArrow, { color: ROLE.mark, scale: 1.08, duration: d })),
    { dur: 0.7 },
  );
  c.show('clamp-ask', factAsked);
  c.show('clamp-question', qPrompt);

  // Move dot cleanly across z=3 to z=4, withholding answers strictly via { after: true }
  c.hide('clamp-move', qPrompt);
  c.show('clamp-move', editArrow, { lead: 0 });
  const crossEnd = c.cue('clamp-cross').end;
  c.on('clamp-move', () =>
    s.play(share.to(0.5, { duration: Math.max(0.2, crossEnd - c.cue('clamp-move').start) })),
  );
  c.after('clamp-cross', () =>
    s.play(share.to(1, { duration: Math.max(0.2, c.cue('clamp-reencode').end - crossEnd) })),
  );
  c.show('clamp-reencode', [thereTag, factReenc], { after: true });
  playCue(
    s,
    c,
    'clamp-reencode',
    (d) => s.play(indicate(levelTags[2], { color: ROLE.wrong, scale: 1.25, duration: d })),
    { after: true, dur: 0.7 },
  );
  c.show('clamp-sum-result', sumTxt, { after: true });
  c.show('clamp-precise', preciseTxt);

  // --- PART 2: Gradient test (live residual cancels vs frozen residual passes slope = 3) ---
  const latent = s.value(GRADIENT.z);
  const held = s.value(0);
  const tailPt = () => vec.scale(GRADIENT.column, latent.value);
  const outPt = () =>
    vec.add(GRADIENT.x, vec.scale(GRADIENT.column, (latent.value - GRADIENT.z) * held.value));
  const scoreNow = () => dotProduct(GRADIENT.readout, outPt());

  const featArrow = b.arrowOf([0, 0], tailPt, ROLE.first, { width: 7.5 });
  const resSeg = b.segmentOf(tailPt, outPt, ROLE.residual, { width: 8.5, glow: 10 });
  const outDot = b.dotOf(outPt, ROLE.activation, 10, 14);
  const firstRing = b.ringOf(GRADIENT.x, ROLE.dim, 15, 3);

  const fwdEq = glowTex('y = z\\,d + e', { x: rx, y: -290, size: 50, color: COSMOS.ink, glow: 6 });
  fwdEq.part('z\\,d').forEach((g) => g.color(ROLE.first));
  fwdEq.part('e').forEach((g) => g.color(ROLE.residual));

  const setupTxt = txt(
    'z = 1   d = [1, 0]   x = [1, 0.1]',
    rx,
    -205,
    30,
    COSMOS.muted,
    'mono',
    'center',
  );
  const scoreCap = txt('score = [3, 100] · y', rx, -85, 30, COSMOS.muted, 'mono', 'center');
  const scoreBig = dynamic(() =>
    txt(scoreNow().toFixed(2), rx, 5, 86, ROLE.mark, 'mono', 'center').glow(10, ROLE.mark),
  );

  const liveLbl = txt('Live residual', rx - 115, 165, 34, ROLE.residual, 'sans', 'center');
  const liveSlope = txt('slope = 0', rx + 130, 165, 36, ROLE.wrong, 'mono', 'center').glow(
    7,
    ROLE.wrong,
  );
  const heldLbl = txt('Frozen residual', rx - 115, 250, 34, ROLE.residual, 'sans', 'center');
  const heldSlope = txt('slope = 3', rx + 130, 250, 36, ROLE.mark, 'mono', 'center').glow(
    7,
    ROLE.mark,
  );

  const undoNote = txt(
    'Recomputing e after an edit undoes the edit',
    rx,
    -205,
    26,
    ROLE.wrong,
    'sans',
    'center',
  );
  const multiNote = txt(
    'Multiple hooks: keep specified pass-through paths',
    rx,
    -205,
    26,
    ROLE.other,
    'sans',
    'center',
  );

  c.swap(
    'clamp-and-gradient-b2',
    [
      startRing,
      dotNow,
      colArrow,
      editArrow,
      ...levels,
      ...levelTags,
      hereTag,
      thereTag,
      readerEq,
      decEq,
      factCached,
      factAsked,
      factReenc,
      sumTxt,
      preciseTxt,
    ],
    [firstRing, featArrow, resSeg, outDot, fwdEq],
  );
  playCue(s, c, 'clamp-and-gradient-b2', (d) => s.play(b.ticksAlpha.to(1, { duration: d })), {
    dur: 0.3,
  });
  c.show('grad-setup', setupTxt);
  c.show('grad-thirteen', [scoreCap, scoreBig], { after: true });

  const wiggle = () => {
    s.play(latent.to(1.45, { duration: 0.85 }));
    s.play(latent.to(0.55, { duration: 1.2 }));
    s.play(latent.to(GRADIENT.z, { duration: 0.85 }));
  };

  c.show('grad-live-wiggle', liveLbl);
  c.on('grad-live-wiggle', wiggle, 0.35);
  c.show('gradient-live', liveSlope);

  c.show('grad-stop', heldLbl);
  c.on('grad-stop', () => s.play(held.to(1, { duration: 0.01 })));
  c.on('grad-stop', wiggle, 0.45);
  c.show('gradient-stopped', heldSlope, { after: true });
  c.swap('grad-undo', setupTxt, undoNote);
  c.swap('grad-multi', undoNote, multiNote);
}
