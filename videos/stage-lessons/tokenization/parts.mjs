// Shared cinematic palette, verified math invariants, and luminous visual primitives
// for the 22-scene Tokenization (BPE, WordPiece, SentencePiece & Unigram) stage film.
import {
  arrow,
  circle,
  curve3d,
  dot,
  group,
  line,
  line3d,
  parametricSurface,
  point3d,
  rect,
  seq,
  surface,
} from 'vizmatic/stage';
import {
  ADDED,
  ALPHABET,
  BEST,
  BOW,
  BYTES,
  BYTE_CHARS,
  BYTE_TEXT,
  CAMEL,
  CANDIDATES,
  CHUNKS,
  COMPOSED,
  CORPUS,
  DECOMPOSED,
  DIGITS,
  ENGLISH_CELLS,
  FINAL_VECTOR,
  FIRST_PASS,
  FIRST_VOCAB,
  GROUPS,
  HISTORY,
  IDS_A,
  IDS_B,
  LATTICE_PROBS,
  LEARNED_CUTS,
  LIGATURE,
  LOWERED,
  MASKED,
  NUMBER,
  NUMBER_B,
  ORDER_A,
  ORDER_B,
  P,
  PATHS,
  PIECES,
  PROXY_RATIO,
  PRUNE_KEPT,
  PRUNE_ROUNDS,
  PRUNE_WORDS,
  RAINY_POSITIONS,
  REQUEST_SOURCES,
  ROW_SCORES,
  RULES,
  SECOND_IDENTIFIER,
  SENTENCE,
  SNOW,
  SPANS,
  SPAN_PATTERN,
  SPAN_TEXT,
  TABLE,
  TH,
  TOY_CORPUS,
  TRAP_PASS,
  TRAP_VOCAB,
  WHOLE,
  WHOLE_VOCABULARY,
  WINDOW,
  WINDOW_CELLS,
  applyRules,
  bestPath,
  codePoint,
  dot as dotProd,
  dropOf,
  hex,
  logOf,
  lossOf,
  mebibytes,
  proxy,
  spanClass,
  togetherShare,
  toyProbability,
  trainMerges,
  without,
  wordpiece,
} from '../../films/tokenization/model.mjs';
import {
  COSMOS,
  aura,
  cinematic3d,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  metricReadout,
  orbitScene,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

export {
  ADDED,
  ALPHABET,
  BEST,
  BOW,
  BYTES,
  BYTE_CHARS,
  BYTE_TEXT,
  CAMEL,
  CANDIDATES,
  CHUNKS,
  COMPOSED,
  CORPUS,
  COSMOS,
  DECOMPOSED,
  DIGITS,
  ENGLISH_CELLS,
  FINAL_VECTOR,
  FIRST_PASS,
  FIRST_VOCAB,
  GROUPS,
  HISTORY,
  IDS_A,
  IDS_B,
  LATTICE_PROBS,
  LEARNED_CUTS,
  LIGATURE,
  LOWERED,
  MASKED,
  NUMBER,
  NUMBER_B,
  ORDER_A,
  ORDER_B,
  P,
  PATHS,
  PIECES,
  PROXY_RATIO,
  PRUNE_KEPT,
  PRUNE_ROUNDS,
  PRUNE_WORDS,
  RAINY_POSITIONS,
  REQUEST_SOURCES,
  ROW_SCORES,
  RULES,
  SECOND_IDENTIFIER,
  SENTENCE,
  SNOW,
  SPANS,
  SPAN_PATTERN,
  SPAN_TEXT,
  TABLE,
  TH,
  TOY_CORPUS,
  TRAP_PASS,
  TRAP_VOCAB,
  WHOLE,
  WHOLE_VOCABULARY,
  WINDOW,
  WINDOW_CELLS,
  applyRules,
  aura,
  bestPath,
  cinematic3d,
  codePoint,
  dotProd,
  dropOf,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  hex,
  logOf,
  lossOf,
  mebibytes,
  metricReadout,
  orbitScene,
  proxy,
  rule,
  spanClass,
  togetherShare,
  toyProbability,
  trainMerges,
  txt,
  wireframeSlab3d,
  without,
  wordpiece,
};

/** One semantic color per conceptual role across all 22 scenes. */
export const ROLE = Object.freeze({
  piece: COSMOS.cyan,
  token: COSMOS.blue,
  merge: COSMOS.gold,
  ok: COSMOS.emerald,
  warn: COSMOS.rose,
  path: COSMOS.violet,
  byte: COSMOS.amber,
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
  rule: COSMOS.rule,
  surface: COSMOS.surface,
  surfaceAlt: COSMOS.surfaceAlt,
});

export const PIECE_COLORS = Object.freeze([COSMOS.blue, COSMOS.cyan, COSMOS.violet, COSMOS.amber]);

/** Separate untied output weights used in lookup and close scenes. */
export const CLOSE_PIECES = Object.freeze(Object.keys(IDS_A));
export function remapTable(table) {
  const result = [...table];
  for (const piece of CLOSE_PIECES) {
    result[IDS_B[piece]] = table[IDS_A[piece]];
  }
  return result;
}
export const CLOSE_OUTPUT = TABLE.map(([a, b, c]) => [c, a, b]);
export const CLOSE_HIDDEN = Object.freeze([0, 0, 1]);
export function nextPieceFor(table, vocab) {
  const scores = table.map((w) => dotProd(CLOSE_HIDDEN, w));
  const id = scores.indexOf(Math.max(...scores));
  return { id, scores, piece: CLOSE_PIECES.find((p) => vocab[p] === id) };
}
export const CLOSE_ORIGINAL = nextPieceFor(CLOSE_OUTPUT, IDS_A);
export const CLOSE_PARTIAL = nextPieceFor(CLOSE_OUTPUT, IDS_B);
export const CLOSE_FIXED = nextPieceFor(remapTable(CLOSE_OUTPUT), IDS_B);
export const CLOSE_SLOTS = Object.freeze([IDS_B['·falls'], IDS_B['·soft']]);
export const CLOSE_OTHER_MAX = Math.max(
  ...CLOSE_PARTIAL.scores.filter((_, id) => !CLOSE_SLOTS.includes(id)),
);

/** Build-time mathematical invariant verification against films/tokenization/model.mjs. */
export function verifyTokenizationInvariants() {
  verifyInvariant(SENTENCE.length === 17, 'sentence length 17');
  verifyInvariant(MASKED === 153, 'masked 17x17 half-grid is 153');
  verifyInvariant(
    HISTORY.map((h) => h.positions).join(',') === '30,23,16,11',
    'BPE position decay 30 -> 23 -> 16 -> 11',
  );
  verifyInvariant(applyRules('rainly', RULES).join('|') === 'rain|l|y', 'rainly replay');
  verifyInvariant(ORDER_A.join('|') === 'ra|i|n', 'merge order A');
  verifyInvariant(ORDER_B.join('|') === 'r|ai|n', 'merge order B');
  verifyInvariant(WHOLE.length === 1 && CHUNKS.flat().length === 3, 'chunk split blocks merge');
  verifyInvariant(BYTE_CHARS.length === 3 && BYTES.length === 9, '3 chars -> 9 UTF-8 bytes');
  verifyApprox(TH.score, 90 / (900 * 300), 1e-9, 'WordPiece th proxy');
  verifyApprox(BOW.score, 42 / (50 * 44), 1e-9, 'WordPiece rainbow proxy');
  verifyInvariant(PROXY_RATIO > 50, 'rainbow proxy > 50x th proxy');
  verifyInvariant(FIRST_PASS.pieces.join('|') === 'rain|##bow', 'WordPiece first pass');
  verifyInvariant(TRAP_PASS.pieces.join('|') === '[UNK]', 'WordPiece greedy trap');
  verifyApprox(PATHS[0], 0.3, 1e-9, 'Unigram path 0');
  verifyApprox(PATHS[1], 0.015, 1e-9, 'Unigram path 1');
  verifyApprox(PATHS[2], 0.00009, 1e-9, 'Unigram path 2');
  verifyApprox(BEST[3], 0.015, 1e-9, 'Viterbi lowered winner');
  verifyInvariant(
    PRUNE_ROUNDS.map((r) => r.size).join(',') === '33,26,21',
    'Unigram prune rounds 41 -> 33 -> 26 -> 21',
  );
  verifyApprox(mebibytes(32_000), 500, 1e-6, '32k vocab MiB');
  verifyApprox(mebibytes(128_000), 2000, 1e-6, '128k vocab MiB');
  verifyApprox(mebibytes(1_000_000), 15625, 1e-6, '1M vocab MiB');
  verifyApprox(dropOf(3, 4), 0.25, 1e-9, '3 -> 4 chars/tok drop');
  verifyApprox(dropOf(3.17, 3.94), 0.1954, 0.001, 'Llama 2 -> 3 length drop');
  verifyApprox(1 - (3.17 / 3.94) ** 2, 0.3527, 0.001, 'Llama 2 -> 3 attention drop');
  verifyInvariant(DECOMPOSED.normalize('NFC') === COMPOSED, 'NFC unification');
  verifyInvariant(LIGATURE.normalize('NFKC') === SECOND_IDENTIFIER, 'NFKC ligature fold');
  verifyInvariant(DIGITS.length === 7 && GROUPS.length === 3, 'number rules');
  verifyInvariant(SNOW[0].positions === 38 && SNOW[1].positions === 29, 'your-turn BPE snow');
  verifyApprox(CLOSE_OTHER_MAX, 0.5, 1e-9, 'close other rows max 0.5');
  verifyInvariant(
    CLOSE_PARTIAL.id === 5 && CLOSE_PARTIAL.piece === '·soft',
    'close stale output emits soft',
  );
  verifyInvariant(
    CLOSE_FIXED.id === 1 && CLOSE_FIXED.piece === '·falls',
    'close swapped output emits falls',
  );
}

/** Clamp a play duration so an animation never runs past the scene's narration. */
export function safeDur(c, startTime, desired = 0.7, margin = 0.44) {
  const remaining = c.end - startTime - margin;
  return Math.max(0.12, Math.min(desired, remaining));
}

/** Schedule an animation at a declared cue (start or end) clamped safely inside the scene window. */
export function playCue(
  s,
  c,
  cueId,
  build,
  { after = false, offset = 0, dur = 0.65, margin = 0.44 } = {},
) {
  const info = c.cue(cueId);
  const startAt = (after ? info.end : info.start) + offset;
  const d = safeDur(c, startAt, dur, margin);
  if (after) {
    c.after(cueId, () => build(d), offset);
  } else {
    c.on(cueId, () => build(d), offset);
  }
  return d;
}

/** Drive a visible accent/energy wave across supporting narration cues so every cue animates on screen. */
export function bindCueBeat(s, c, accentVal, cueIds, { after = false } = {}) {
  cueIds.forEach((cueId, idx) => {
    const target = (idx + 1) * 0.35;
    playCue(s, c, cueId, (d) => s.play(accentVal.to(target, { duration: d })), {
      after,
      dur: 0.32,
    });
  });
}

/** Sequential fade-out then fade-in across two dynamic visibility Values (zero overlap). */
export function swapVis(outVal, inVal, d = 0.6) {
  const half = Math.max(0.12, d * 0.46);
  return seq(outVal.to(0, { duration: half }), inVal.to(1, { duration: Math.max(0.12, d - half) }));
}

/** Smooth quadratic Bezier polyline points between two 2D points with vertical lift. */
export function arcPts(p0, p1, lift = -100, steps = 28) {
  const mx = (p0[0] + p1[0]) / 2;
  const my = (p0[1] + p1[1]) / 2 + lift;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([
      u * u * p0[0] + 2 * u * t * mx + t * t * p1[0],
      u * u * p0[1] + 2 * u * t * my + t * t * p1[1],
    ]);
  }
  return pts;
}

/** Compact luminous token pill for a single short token piece or ID (never a prose card). */
export function tokenPill(
  label,
  x,
  y,
  {
    w = 156,
    h = 68,
    color = ROLE.piece,
    fill = '#10182d',
    size = 34,
    font = 'mono',
    glow = 8,
    opacity = 1,
    strokeWidth = 2.6,
    dash,
  } = {},
) {
  const frame = rect(w, h, {
    fill,
    stroke: color,
    width: strokeWidth,
    radius: 12,
    dash,
  })
    .at(x, y)
    .opacity(opacity);
  if (glow > 0) frame.glow(glow, color);
  const lbl = txt(label, x, y, size, COSMOS.ink, font, 'center').opacity(opacity);
  return group(frame, lbl);
}

/** Luminous horizontal bar growing rightward from x0 with glowing tip photon. */
export function lumBar(
  x0,
  y,
  width,
  height,
  color,
  { opacity = 0.92, glow = 10, maxTrackW = 0 } = {},
) {
  const items = [];
  if (maxTrackW > 0) {
    items.push(
      rect(maxTrackW, height, { fill: '#12192e', stroke: '#253358', width: 1.5, radius: 6 })
        .at(x0 + maxTrackW * 0.5, y)
        .opacity(0.65 * opacity),
    );
  }
  const w = Math.max(4, width);
  const bar = rect(w, height, { fill: color, stroke: null, radius: 6 })
    .at(x0 + w * 0.5, y)
    .opacity(opacity);
  if (glow > 0) bar.glow(glow, color).set('blend', 'screen');
  items.push(bar);
  if (w > 12) {
    items.push(
      glowDot(x0 + w, y, {
        radius: Math.min(7, height * 0.28),
        color,
        glow: glow + 2,
        opacity,
      }),
    );
  }
  return group(...items);
}

/** Build a 3D orbiting quadratic attention grid comparing character vs subword sequence lengths. */
export function buildAttentionGrid3d(gridSizeVal, maskVal, { x = 320, y = 40 } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.06,
    distance: 15.2,
    unit: 112,
    focus: [0, 0, 0.3],
  }).at(x, y);

  const surf = parametricSurface(
    (u, v) => {
      const n = gridSizeVal.value; // 3 .. 17
      const m = maskVal.value; // 0 .. 1 causal mask
      const scale = n / 17;
      const sx = (u - 0.5) * 5.2 * scale;
      const sy = (v - 0.5) * 5.2 * scale;
      const maskedOut = m > 0.2 && u > v + 0.04;
      const baseH = maskedOut
        ? 0.08
        : 0.28 + 1.55 * scale * (0.65 + 0.35 * Math.sin(u * 9 + v * 7));
      const z = maskedOut ? 0.08 : baseH * (1 - 0.3 * m * (u > v ? 1 : 0));
      return [sx, sy, z];
    },
    [0, 1],
    [0, 1],
    {
      resolution: [16, 16],
      colors: ['#151e38', '#2a3a70', '#5ce1e6', '#ffd166', '#ff6b8b'],
      opacity: 0.86,
      mesh: '#7ce8ff',
      meshOpacity: 0.18,
      meshWidth: 0.7,
      animate: true,
    },
  );

  view.add(surf);
  return view;
}

/** Build an orbiting 3D glowing embedding matrix slab where selected token rows light up. */
export function buildEmbedMatrix3d(activeRowVal, { x = 340, y = 20 } = {}) {
  const view = cinematic3d({
    theta: -0.75,
    phi: 1.02,
    distance: 14.5,
    unit: 110,
    focus: [0, 0, 0.2],
  }).at(x, y);

  const slab = parametricSurface(
    (u, v) => {
      const row = Math.round(v * 7);
      const active = Math.exp(-Math.pow(row - activeRowVal.value, 2) * 3.5);
      const col = Math.min(2, Math.floor(u * 3));
      const val = TABLE[row]?.[col] ?? 0;
      return [(u - 0.5) * 4.4, (v - 0.5) * 5.4, 0.25 + val * 0.75 + active * 0.9];
    },
    [0, 1],
    [0, 1],
    {
      resolution: [14, 16],
      colors: ['#121d3b', '#1e4e7c', '#5ce1e6', '#ffd166'],
      opacity: 0.86,
      mesh: '#7ce8ff',
      meshOpacity: 0.18,
      meshWidth: 0.7,
      animate: true,
    },
  );

  const cage = wireframeSlab3d(
    () => [0, (activeRowVal.value / 7 - 0.5) * 5.4, 0.8],
    2.25,
    0.38,
    0.55,
    { color: COSMOS.gold, width: 2.8, glow: 8 },
  );

  view.add(slab, ...cage);
  return view;
}

export { arrow, circle, curve3d, dot, group, line, line3d, point3d, rect, seq, surface };
