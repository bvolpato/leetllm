// Shared math imports, build-time invariants, semantic palette, and dark-cinema
// visual primitives for the convolution stage film (vizmatic@0.10.0+).
import {
  arrow,
  circle,
  curve3d,
  dot,
  dynamic,
  group,
  line,
  line3d,
  linear,
  point3d,
  rect,
  surface,
  text,
} from 'vizmatic/stage';
import {
  COSMOS,
  aura,
  cinematic3d,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  orbitScene,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';
import {
  ARTICLE_CROP,
  HORIZONTAL,
  IMAGE,
  KERNEL,
  OVERLAP_MAP,
  PADDED_ORDER,
  POOL_INCOMING,
  POOL_MAP,
  RIDGE,
} from '../../films/convolution/fixtures.mjs';
import {
  convolutionShape,
  correlate,
  parameterCount,
  poolSnapshot,
  residualSlice,
} from '../../films/convolution/arithmetic.mjs';
import {
  channelSnapshot,
  patchSnapshot,
  scanSnapshot,
  stridePaddingFrame,
} from '../../films/convolution/construction.mjs';
import {
  MAP,
  cropForward,
  fieldTrace,
  paddedUniform,
  patchProjection,
  signalParticipation,
} from '../../films/convolution/model.mjs';

export {
  ARTICLE_CROP,
  COSMOS,
  HORIZONTAL,
  IMAGE,
  KERNEL,
  MAP,
  OVERLAP_MAP,
  PADDED_ORDER,
  POOL_INCOMING,
  POOL_MAP,
  RIDGE,
  arrow,
  channelSnapshot,
  cinematic3d,
  convolutionShape,
  correlate,
  cropForward,
  curve3d,
  fieldTrace,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  line3d,
  orbitScene,
  paddedUniform,
  parameterCount,
  patchProjection,
  patchSnapshot,
  point3d,
  poolSnapshot,
  residualSlice,
  scanSnapshot,
  signalParticipation,
  stridePaddingFrame,
  surface,
  txt,
  wireframeSlab3d,
};

// One semantic color per role across all 26 scenes.
export const ROLE = Object.freeze({
  window: COSMOS.gold,
  kernel: COSMOS.cyan,
  neg: COSMOS.rose,
  pos: COSMOS.emerald,
  channel: COSMOS.violet,
  input: COSMOS.blue,
  warm: COSMOS.amber,
});

// Derived model constants used across multiple scenes.
export const UNIFORM_TWO_THIRDS = Object.freeze(
  Array.from({ length: 3 }, () => Object.freeze([2 / 3, 2 / 3, 2 / 3])),
);
export const EDGE_PATCH = Object.freeze(
  IMAGE.slice(0, 3).map((row) => Object.freeze(row.slice(1, 4))),
);
export const DENSE_224_PARAMS = 224 * 224 * 3 * 256 + 256;
export const CONV_16_PARAMS = parameterCount(3, 16, 3, 1, true);
export const PRIVATE_222_PARAMS = 222 * 222 * CONV_16_PARAMS;
export const GROUPED_4_6_PARAMS = parameterCount(4, 6, 3, 2, true);
export const GAP_FLATTEN_PARAMS = 6 * 3 * 3 * 2 + 2;
export const GAP_POOLED_PARAMS = 6 * 2 + 2;

export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const mix = (a, b, t) => a + (b - a) * clamp01(t);

// Strict non-overlapping crossfade: old reaches 0 at 0.42, new enters at 0.58.
export const fadeOut = (t) => clamp01(1 - t / 0.42);
export const fadeIn = (t) => clamp01((t - 0.58) / 0.42);

export function fmtVal(v, digits = 3) {
  if (typeof v === 'string') return v;
  if (Math.abs(v - 2 / 3) < 1e-10) return '2/3';
  if (Math.abs(v) < 1e-12) return '0';
  if (Number.isInteger(v)) return String(v);
  return Number(v.toFixed(digits)).toString();
}

export function fmtSigned(v, digits = 3) {
  if (Math.abs(v) < 1e-12) return '0';
  const s = fmtVal(Math.abs(v), digits);
  return v < 0 ? `-${s}` : `+${s}`;
}

export function verifyConvolutionInvariants() {
  // Core 5x5 vertical edge & 3x3 horizontal-difference kernel.
  verifyInvariant(
    JSON.stringify(MAP) ===
      JSON.stringify([
        [3, 3, 0],
        [3, 3, 0],
        [3, 3, 0],
      ]),
    'MAP must equal 3x3 [[3,3,0],...]',
  );
  verifyInvariant(
    JSON.stringify(correlate(IMAGE, HORIZONTAL)) ===
      JSON.stringify([
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]),
    'Horizontal kernel on vertical edge gives all zeros',
  );
  verifyInvariant(patchSnapshot(0, 1).subtotal === 3, 'First window sum is 3');
  verifyInvariant(patchSnapshot(2, 1).subtotal === 0, 'Third window (bright) sum is 0');
  verifyApprox(
    UNIFORM_TWO_THIRDS.flat().reduce((a, b) => a + b, 0),
    6,
    1e-12,
    'Uniform 2/3 patch total brightness',
  );
  verifyApprox(
    EDGE_PATCH.flat().reduce((a, b) => a + b, 0),
    6,
    1e-12,
    'Edge patch total brightness',
  );

  // Article 4x4 crop & ridge filter.
  const baseCrop = cropForward();
  verifyApprox(baseCrop.raw[0][0], 0.852, 1e-10, 'Crop top-left response');
  verifyApprox(baseCrop.raw[0][1], 0.789, 1e-10, 'Crop top-right response');
  verifyApprox(baseCrop.raw[1][0], 0.817, 1e-10, 'Crop bottom-left response');
  verifyApprox(baseCrop.raw[1][1], 0.874, 1e-10, 'Crop bottom-right response');
  const editedFilter = RIDGE.map((r) => [...r]);
  editedFilter[0][0] = 0;
  verifyApprox(correlate(ARTICLE_CROP, editedFilter)[0][0], 0.882, 1e-10, 'Weight edit 0.882');

  // Parameter sharing & grouped connectivity.
  verifyInvariant(DENSE_224_PARAMS === 38535424, 'Dense 224x224x3->256 parameter count');
  verifyInvariant(CONV_16_PARAMS === 448, 'Shared 16x3x3x3 + 16 conv parameter count');
  verifyInvariant(PRIVATE_222_PARAMS === 22079232, 'Private 222x222 filter banks parameter count');
  verifyInvariant(GROUPED_4_6_PARAMS === 114, 'Grouped 4->6 (groups=2, 3x3, bias) params');
  verifyInvariant(GAP_FLATTEN_PARAMS === 110, 'Flatten 6x3x3->2 head params');
  verifyInvariant(GAP_POOLED_PARAMS === 14, 'GAP 6->2 head params');

  // Stride-2 1D translation phase failure.
  verifyInvariant(
    JSON.stringify(correlate([[0, 1, 1, 1, 1, 1]], [[-1, 1]], 2)) === '[[1,0,0]]',
    '1D stride-2 before shift',
  );
  verifyInvariant(
    JSON.stringify(correlate([[0, 0, 1, 1, 1, 1]], [[-1, 1]], 2)) === '[[0,0,0]]',
    '1D stride-2 after 1px shift drops peak',
  );

  // Stride, padding, and dilation output shapes.
  verifyInvariant(
    JSON.stringify(stridePaddingFrame(0, 1).result) === '[[3,0],[3,0]]',
    'Stride-2 5x5 -> 2x2',
  );
  verifyInvariant(stridePaddingFrame(1, 1).sum === 2, 'Top-padded border window sum is 2');
  verifyInvariant(
    convolutionShape(28, 3, { stride: 1, padding: 0, dilation: 2 }) === 24,
    'Dilated 28 input K=3 D=2 S=1 -> 24 starts',
  );

  // Multi-channel sums.
  verifyInvariant(channelSnapshot(0).total === 6, 'Filter 1 channel sum is 6');
  verifyInvariant(channelSnapshot(1).total === 0, 'Filter 2 reversed channel sum is 0');

  // Receptive field & jump trace.
  const trace = fieldTrace();
  verifyInvariant(
    trace.map((t) => t.field).join(',') === '3,5,6,10',
    'Receptive fields 3, 5, 6, 10',
  );
  verifyInvariant(trace.map((t) => t.jump).join(',') === '1,1,2,2', 'Jumps 1, 1, 2, 2');
  verifyInvariant(trace.map((t) => t.size).join(',') === '222,220,110,108', 'Map sizes');

  // Pooling forward & backward (non-overlapping & overlapping).
  const maxPool = poolSnapshot(POOL_MAP, { incoming: POOL_INCOMING, mode: 'max' });
  verifyApprox(maxPool.values[0][0], 0.91, 1e-12, 'Max pool top-left');
  verifyApprox(maxPool.gradient[1][2], -1, 1e-12, 'Max pool negative route (1,2)');
  const ovMax = poolSnapshot(OVERLAP_MAP, { stride: 1, incoming: POOL_INCOMING, mode: 'max' });
  const ovAvg = poolSnapshot(OVERLAP_MAP, { stride: 1, incoming: POOL_INCOMING, mode: 'average' });
  const ovBug = poolSnapshot(OVERLAP_MAP, {
    stride: 1,
    incoming: POOL_INCOMING,
    mode: 'max',
    overwrite: true,
  });
  verifyApprox(ovMax.gradient[1][1], 4.5, 1e-12, 'Overlapping max pool accumulated gradient');
  verifyApprox(ovAvg.gradient[1][1], 1.125, 1e-12, 'Overlapping avg pool accumulated gradient');
  verifyApprox(ovBug.gradient[1][1], 3.0, 1e-12, 'Overwrite bug finishes at 3');
  verifyInvariant(
    ovMax.owners.every((o) => o.flat === 4),
    'All four overlapping owners point to flat index 4',
  );

  // Border participation & zero-padding artifact.
  verifyInvariant(signalParticipation(5, 0, 0, 0).count === 1, 'Corner 5x5 valid count = 1');
  verifyInvariant(signalParticipation(5, 2, 2, 0).count === 9, 'Center 5x5 valid count = 9');
  verifyInvariant(signalParticipation(5, 0, 0, 1).count === 4, 'Corner 5x5 padded count = 4');
  verifyInvariant(signalParticipation(4, 1, 1, 0).count === 4, 'Center 4x4 valid count = 4');
  verifyApprox(paddedUniform('zero').maxAbs, 1.8, 1e-10, 'Zero padding false edge 1.8');
  verifyApprox(paddedUniform('reflect').maxAbs, 0.0, 1e-10, 'Reflect padding maxAbs 0');

  // Residual gradient slice.
  verifyApprox(residualSlice(0.2, 3, 1).total, 3.6, 1e-12, 'Residual total 3.6');
  verifyApprox(residualSlice(-1, 3, 1).total, 0, 1e-12, 'Residual slope -1 cancels to 0');
  verifyApprox(residualSlice(0.2, 3, 0).total, 0, 1e-12, 'Inactive ReLU gate zeroes total');

  // ViT patch projection equivalence.
  const pp = patchProjection();
  verifyInvariant(pp.patches.length === 4 && pp.tokens[0].length === 3, '4 patches x 3 features');

  // Earned CNN transfer edits (0.01 -> winner switches to [0,0]; 0.02 -> [1,1] keeps lead).
  const edit01 = cropForward(0.01);
  verifyApprox(edit01.raw[0][0], 0.876, 1e-10, 'Edit 0.01 top-left response 0.876');
  verifyInvariant(
    edit01.pool.owners[0].input[0] === 0 && edit01.pool.owners[0].input[1] === 0,
    'Edit 0.01 switches winner to (0,0)',
  );
  verifyApprox(edit01.logits[0], 1.0264, 1e-10, 'Edit 0.01 logit 0');
  verifyApprox(edit01.logits[1], -0.6884, 1e-10, 'Edit 0.01 logit 1');

  const edit02 = cropForward(0.02);
  verifyApprox(edit02.raw[0][0], 0.87, 1e-10, 'Edit 0.02 top-left response 0.870');
  verifyInvariant(
    edit02.pool.owners[0].input[0] === 1 && edit02.pool.owners[0].input[1] === 1,
    'Edit 0.02 keeps winner (1,1)',
  );
  verifyApprox(edit02.logits[0], 1.0236, 1e-10, 'Edit 0.02 logit 0');
  verifyApprox(edit02.logits[1], -0.6866, 1e-10, 'Edit 0.02 logit 1');
}

export function markDecor(node) {
  if (!node) return node;
  if (!node.data) node.data = {};
  node.data.decoration = true;
  if (Array.isArray(node.children)) {
    for (const child of node.children) markDecor(child);
  }
  return node;
}

export function safeDur(clockObj, startTime, desired = 0.65, margin = 0.34) {
  const avail = clockObj.end - startTime - margin;
  return Math.max(0.08, Math.min(desired, avail));
}

export function cueTo(s, c, cueId, val, target, opts = {}) {
  const { dur = 0.65, after = false, ease } = opts;
  const info = c.cue(cueId);
  const t0 = after ? info.end : info.start;
  const duration = safeDur(c, t0, dur);
  const playOpts = ease ? { duration, ease } : { duration };
  if (after) {
    c.after(cueId, () => s.play(val.to(target, playOpts)));
  } else {
    c.on(cueId, () => s.play(val.to(target, playOpts)));
  }
  return info;
}

export function beatTo(s, c, beatIdx, val, target, opts = {}) {
  const { dur = 0.65, ease } = opts;
  const b = c.beats?.[beatIdx];
  if (!b) return;
  const duration = safeDur(c, b.start, dur);
  const playOpts = ease ? { duration, ease } : { duration };
  c.onBeat(beatIdx, () => s.play(val.to(target, playOpts)));
}

export function livingDrift(s, c, val, target = 1, { startOffset = 0.05, endMargin = 0.45 } = {}) {
  const span = c.end - c.start;
  const duration = Math.max(0.3, span - startOffset - endMargin);
  c.at(startOffset, () => s.play(val.to(target, { duration, ease: linear })));
  return duration;
}

export function cinemaGrid({ accent = COSMOS.cyan, seed = 1 } = {}) {
  const nodes = [];
  for (let x = -840; x <= 840; x += 240) {
    nodes.push(line([x, -540], [x, 540], { stroke: '#121a30', width: 1 }).opacity(0.14));
  }
  for (let y = -420; y <= 420; y += 210) {
    nodes.push(line([-960, y], [960, y], { stroke: '#121a30', width: 1 }).opacity(0.14));
  }
  for (let i = 0; i < 16; i += 1) {
    const h1 = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453;
    const h2 = Math.sin((i + 1) * 93.9898 + seed * 19.13) * 24634.6345;
    const px = ((h1 - Math.floor(h1)) * 2 - 1) * 900;
    const py = ((h2 - Math.floor(h2)) * 2 - 1) * 490;
    const r = 1.4 + ((i + seed) % 3) * 0.7;
    nodes.push(
      circle(r, { fill: i % 3 === 0 ? accent : '#8da2cf' })
        .at(px, py)
        .opacity(0.18),
    );
  }
  return markDecor(group(...nodes).zIndex(-60));
}

export function decorAura(x, y, radius, innerHex, outerHex = '#07091000') {
  return markDecor(aura(x, y, radius, innerHex, outerHex));
}

export function rule(x0, y0, x1, y1, color = '#2a3759', width = 2) {
  return line([x0, y0], [x1, y1], { stroke: color, width });
}

export function scaleTrack(x, y, w, h, { stroke = '#2c3d64', fill = '#0d1427', radius = 10 } = {}) {
  return rect(w, h, { fill, stroke, width: 2.2, radius }).at(x + w / 2, y);
}

export function glowBar(x, y, w, h, color, { glow = 8, radius = 8, opacity = 1 } = {}) {
  const safeW = Math.max(4, w);
  const bar = rect(safeW, h, { fill: color, radius }).at(x + safeW / 2, y);
  if (glow > 0) bar.glow(glow, color);
  return bar.opacity(opacity);
}

export function glowDot(x, y, { radius = 10, color = COSMOS.cyan, glow = 10, opacity = 1 } = {}) {
  const node = dot(radius, color).at(x, y);
  if (glow > 0) node.glow(glow, color);
  return node.opacity(opacity);
}

export function numCell(val, x, y, opts = {}) {
  const {
    w = 96,
    h = 68,
    fill = '#10182b',
    stroke = '#2b3b60',
    textColor = COSMOS.ink,
    size = 30,
    glow = 0,
    opacity = 1,
    radius = 10,
  } = opts;
  const box = rect(w, h, { fill, stroke, width: 2.4, radius }).at(x, y);
  if (glow > 0) box.glow(glow, stroke);
  const label = text(String(val), {
    font: 'mono',
    size: Math.max(26, size),
    color: textColor,
    align: 'center',
  }).at(x, y + 1);
  return group(box, label).opacity(opacity);
}

// Compute center [x, y] of cell (r, c) inside a matrix centered at (cx, cy).
export function cellPos(cx, cy, rows, cols, r, c, cellSize, gap = 8) {
  const pitch = cellSize + gap;
  const x0 = cx - ((cols - 1) * pitch) / 2;
  const y0 = cy - ((rows - 1) * pitch) / 2;
  return [x0 + c * pitch, y0 + r * pitch];
}

// Render a 2D pixel / kernel / feature / gradient grid centered at (cx, cy).
// Supports fractional smooth highlights, padded rings, custom cell styling, and >= 26px digits.
export function matrixGrid(
  values,
  cx,
  cy,
  {
    cellSize = 84,
    gap = 8,
    kind = 'image',
    fontSize = 30,
    digits = 3,
    showValues = true,
    padded = false,
    paddingOpacity = 1,
    revealCount = Infinity,
    visibleMask = null,
    highlightCells = null,
    cellColorFn = null,
    formatter = null,
    opacity = 1,
  } = {},
) {
  const rows = values.length;
  const cols = values[0].length;
  const nodes = [];
  const safeFont = Math.max(26, fontSize);

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const idx = r * cols + c;
      const [px, py] = cellPos(cx, cy, rows, cols, r, c, cellSize, gap);
      const raw = values[r][c];
      const isBorder = padded && (r === 0 || c === 0 || r === rows - 1 || c === cols - 1);
      const isVisible = visibleMask ? visibleMask(r, c, idx) : idx < revealCount;
      const isHi = highlightCells ? highlightCells.some(([hr, hc]) => hr === r && hc === c) : false;

      let fill = '#10182b';
      let stroke = '#2c3d64';
      let ink = COSMOS.ink;
      let cellGlow = 0;

      if (kind === 'image') {
        if (isBorder) {
          fill = '#0c2334';
          stroke = COSMOS.cyan;
          ink = COSMOS.cyan;
        } else if (typeof raw === 'number') {
          const v = clamp01(raw);
          const shade = Math.round(18 + v * 204);
          fill = `rgb(${shade}, ${Math.round(shade * 0.99)}, ${Math.round(shade * 0.96)})`;
          stroke = v > 0.65 ? '#e6eefc' : '#354873';
          ink = v > 0.52 ? '#070910' : COSMOS.ink;
        }
      } else if (kind === 'kernel') {
        if (typeof raw === 'number') {
          if (raw < 0) {
            fill = '#2d1122';
            stroke = ROLE.neg;
            ink = ROLE.neg;
          } else if (raw > 0) {
            fill = '#0d2934';
            stroke = ROLE.kernel;
            ink = ROLE.kernel;
          } else {
            fill = '#12182a';
            stroke = '#38486e';
            ink = COSMOS.dim;
          }
        }
      } else if (kind === 'feature') {
        if (typeof raw === 'number' && isVisible) {
          if (raw > 0) {
            fill = '#0d2b24';
            stroke = ROLE.pos;
            ink = ROLE.pos;
          } else if (raw < 0) {
            fill = '#2c1122';
            stroke = ROLE.neg;
            ink = ROLE.neg;
          } else {
            fill = '#121a2d';
            stroke = '#394b74';
            ink = COSMOS.muted;
          }
        } else {
          fill = '#0d1324';
          stroke = '#2b395c';
          ink = COSMOS.dim;
        }
      } else if (kind === 'gradient') {
        if (typeof raw === 'number' && isVisible) {
          if (raw > 0) {
            fill = '#0e2d24';
            stroke = ROLE.pos;
            ink = ROLE.pos;
          } else if (raw < 0) {
            fill = '#331226';
            stroke = ROLE.neg;
            ink = ROLE.neg;
          } else {
            fill = '#101728';
            stroke = '#283657';
            ink = COSMOS.dim;
          }
        }
      }

      if (isHi) {
        stroke = ROLE.window;
        cellGlow = 9;
      }

      if (cellColorFn) {
        const custom = cellColorFn(raw, r, c, { fill, stroke, ink, glow: cellGlow });
        if (custom) {
          if (custom.fill !== undefined) fill = custom.fill;
          if (custom.stroke !== undefined) stroke = custom.stroke;
          if (custom.ink !== undefined) ink = custom.ink;
          if (custom.glow !== undefined) cellGlow = custom.glow;
        }
      }

      const cellOp = opacity * (isBorder ? paddingOpacity : 1);
      if (cellOp <= 0.02) continue;

      const box = rect(cellSize, cellSize, {
        fill,
        stroke,
        width: isHi ? 3.4 : 2.1,
        radius: Math.max(6, Math.round(cellSize * 0.11)),
      }).at(px, py);
      if (cellGlow > 0) box.glow(cellGlow, stroke);
      nodes.push(box.opacity(cellOp));

      if (showValues && (isVisible || raw === '?')) {
        const labelStr = formatter
          ? formatter(raw, r, c, isVisible)
          : isVisible
            ? fmtVal(raw, digits)
            : '?';
        if (labelStr !== '') {
          nodes.push(
            text(labelStr, {
              font: 'mono',
              size: safeFont,
              color: isVisible ? ink : COSMOS.dim,
              align: 'center',
            })
              .at(px, py + 1)
              .opacity(cellOp),
          );
        }
      }
    }
  }
  return group(...nodes);
}

// Glowing sliding window outline over a matrixGrid centered at (cx, cy).
// Supports fractional (r0, c0) for silky smooth sliding animation!
export function windowBox(
  cx,
  cy,
  rows,
  cols,
  r0,
  c0,
  winRows,
  winCols,
  {
    cellSize = 84,
    gap = 8,
    color = ROLE.window,
    width = 4.6,
    glow = 12,
    pad = 6,
    opacity = 1,
    fill = null,
  } = {},
) {
  const pitch = cellSize + gap;
  const x0 = cx - ((cols - 1) * pitch) / 2;
  const y0 = cy - ((rows - 1) * pitch) / 2;
  const w = (winCols - 1) * pitch + cellSize + pad * 2;
  const h = (winRows - 1) * pitch + cellSize + pad * 2;
  const wx = x0 + (c0 + (winCols - 1) / 2) * pitch;
  const wy = y0 + (r0 + (winRows - 1) / 2) * pitch;
  const box = rect(w, h, {
    fill: fill ?? `${color}12`,
    stroke: color,
    width,
    radius: 12,
  }).at(wx, wy);
  if (glow > 0) box.glow(glow, color);
  return box.opacity(opacity);
}
