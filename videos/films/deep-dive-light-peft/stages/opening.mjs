import { beatCue } from '../model.mjs';
import { clamp01 } from '../arithmetic.mjs';
import { HEAD_SELECTION } from '../construction.mjs';

// Keep original feature and rank indices while the surviving cells move together.
function weightGrid(
  ctx,
  api,
  { x, y, cell, rows, cols, rowIds, colIds, rowCut, colCut, scan, color, unfold = 1 },
) {
  const place = (index, ids, cut) => {
    const slot = ids.indexOf(index);
    return slot < 0
      ? { offset: index, alpha: 1 - clamp01(cut * 2) }
      : { offset: api.lerp(index, slot, clamp01(cut * 2 - 1)), alpha: 1 };
  };
  for (let i = 0; i < rows; i++) {
    const row = place(i, rowIds, rowCut);
    const visible = i === 0 ? 1 : clamp01(unfold * (rows - 1) - i + 1);
    if (visible === 0) continue;
    for (let j = 0; j < cols; j++) {
      const col = place(j, colIds, colCut);
      if (row.alpha * col.alpha <= 0) continue;
      const counted = i * cols + j < Math.floor(scan * rows * cols);
      api.components.fade(visible * row.alpha * col.alpha, () => {
        api.rect(
          ctx,
          x + col.offset * cell,
          y + row.offset * cell,
          cell - 5,
          cell - 5,
          counted ? color : color + '42',
          color,
          3,
        );
      });
    }
  }
}

const features = Array.from({ length: 8 }, (_, i) => i);
const tokenFeatures = [2, -1, 3, 1, -2, 4, 2, 1];
const firstWeights = [1, 3, -2, 1, 2, -1, 1, 2];
const retained = HEAD_SELECTION.kept.flatMap((head) => [2 * head, 2 * head + 1]);
const cell = 52;
const top = 408;
const baseX = 330;
const aX = 986;
const bX = 1560;

function inputStrip(ctx, api, gridX, gridY, pitch, docking, activeColumn, detail) {
  const { C } = api;
  const x = gridX + 165 * (1 - docking);
  const scale = pitch / cell;
  const y = gridY - scale * (62 + 35 * (1 - docking));
  api.rect(ctx, x - 157 * scale, y - 6 * scale, 144 * scale, 60 * scale, C.yellow, undefined, 14);
  api.text(ctx, '“cat”', x - 85 * scale, y + 39 * scale, 43 * scale, C.bg, 'center');
  features.forEach((column) => {
    api.rect(
      ctx,
      x + column * pitch,
      y,
      pitch - 5,
      47 * scale,
      column === activeColumn ? C.yellow : C.yellow + '8c',
      C.yellow,
      4,
    );
    if (detail > 0)
      api.components.fade(detail, () =>
        api.text(
          ctx,
          String(tokenFeatures[column]).replace('-', '−'),
          x + (column + 0.5) * pitch - 2,
          y + 35 * scale,
          31 * scale,
          C.bg,
          'center',
        ),
      );
  });
}

function headLabels(ctx, api, x, cut) {
  for (let head = 0; head < 4; head++) {
    const slot = HEAD_SELECTION.kept.indexOf(head);
    const alpha = slot < 0 ? 1 - clamp01(cut * 2) : 1;
    const row = slot < 0 ? head : api.lerp(head, slot, clamp01(cut * 2 - 1));
    if (alpha > 0)
      api.components.fade(alpha, () =>
        api.text(ctx, 'H' + (head + 1), x, top + cell * (1 + 2 * row) + 10, 29, api.C.ink, 'right'),
      );
  }
}

export function drawOpening(ctx, scene, state, api) {
  const { C } = api;
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const elapsed = state.t ?? 0;
  const docking = clamp01(elapsed / 0.8);
  const firstRow = clamp01((elapsed - 0.8) / 1.55);
  const unfold = beatCue(state, 0, 'open-pull-back', 0.18, 0.3);
  const gridX = api.lerp(530, baseX, unfold);
  const gridY = api.lerp(580, top, unfold);
  const pitch = api.lerp(108, cell, unfold);
  const detail = 1 - unfold;
  const center = gridX + 4 * pitch;
  const scan = beatCue(state, 0, 'open-token', 0.03, 0.3);
  const branch = beatCue(state, 0, 'open-branch', 0.43, 0.67);
  const rankCut = beatCue(state, 1, 'open-rank-cut', 0.02, 0.27);
  const rankTotal = beatCue(state, 1, 'open-rank-total', 0.28, 0.4);
  const replay = beatCue(state, 1, 'open-replay', 0.42, 0.62);
  const baseCut = beatCue(state, 2, 'open-base-cut', 0.35, 0.56);
  const cuttingRank = rankCut > 0 && rankCut < 1;
  const cuttingHead = baseCut > 0 && baseCut < 1;
  const rank = rankCut === 1 ? 1 : 2;
  const width = baseCut === 1 ? retained.length : features.length;
  const txt = (s, x, y, size, color = C.ink) => api.text(ctx, s, x, y, size, color, 'center');
  const firstPass = (firstRow + (features.length - 1) * scan) / features.length;
  const pass = replay > 0 && replay < 1 ? replay : state.beat === 0 ? firstPass : 1;
  const active = Math.floor(pass * features.length ** 2);
  const cursor = docking === 1 && pass < 1 && (scan > 0 || active < features.length);
  api.focus.target('open-base', () => {
    txt(
      unfold === 0 ? 'One row of frozen query weights' : 'Frozen query weights  W',
      center,
      269,
      47,
      C.blue,
    );
    inputStrip(
      ctx,
      api,
      gridX,
      gridY,
      pitch,
      docking,
      cursor ? active % features.length : -1,
      detail,
    );
    weightGrid(ctx, api, {
      x: gridX,
      y: gridY,
      cell: pitch,
      rows: 8,
      cols: 8,
      rowIds: retained,
      colIds: features,
      rowCut: baseCut,
      colCut: 0,
      scan: pass,
      color: C.blue,
      unfold: unfold * unfold,
    });
    if (state.beat === 2) headLabels(ctx, api, baseX - 20, baseCut);
    if (cursor) {
      const col = active % features.length;
      const row = Math.floor(active / features.length);
      api.rect(
        ctx,
        gridX + col * pitch,
        gridY + row * pitch,
        pitch - 5,
        pitch - 5,
        C.yellow,
        undefined,
        3,
      );
    }
    if (detail > 0)
      api.components.fade(detail, () => {
        firstWeights.forEach((weight, column) => {
          const ink = column < active || (docking === 1 && column === active) ? C.bg : C.ink;
          txt(
            String(weight).replace('-', '−'),
            gridX + (column + 0.5) * pitch - 2,
            gridY + 0.68 * pitch,
            0.54 * pitch,
            ink,
          );
        });
      });
    if (unfold === 1) txt(cuttingHead ? '8 × 8 → 6 × 8' : width + ' × 8', center, 887, 40, C.blue);
    const pairs = Math.floor((state.beat === 0 ? pass : 1) * features.length * width);
    const count = cuttingHead ? '64 → 48' : pairs;
    const label =
      docking < 1
        ? '8 features for one token'
        : unfold === 0 && active === features.length
          ? '8 pairs for one query output'
          : state.beat === 0 && pass < 1
            ? pairs + (pairs === 1 ? ' pair counted' : ' pairs counted')
            : count + ' pairs / token';
    txt(label, center, api.lerp(822, 975, unfold), 54);
  });

  if (unfold > 0.7)
    api.focus.target('open-adapter', () =>
      api.components.fade((unfold - 0.7) / 0.3, () => {
        txt('Unmerged LoRA adapter', 1330, 269, 47, C.cyan);
        txt('A', aX + 4 * cell, 380, 40, C.cyan);
        txt('B', bX + cell, 380, 40, C.cyan);
        const scanA = clamp01(2 * branch);
        const scanB = clamp01(2 * branch - 1);
        weightGrid(ctx, api, {
          x: aX,
          y: top,
          cell,
          rows: 2,
          cols: 8,
          rowIds: [0],
          colIds: features,
          rowCut: rankCut,
          colCut: 0,
          scan: scanA,
          color: C.cyan,
        });
        weightGrid(ctx, api, {
          x: bX,
          y: top,
          cell,
          rows: 8,
          cols: 2,
          rowIds: retained,
          colIds: [0],
          rowCut: baseCut,
          colCut: rankCut,
          scan: scanB,
          color: C.cyan,
        });
        if (state.beat === 2) headLabels(ctx, api, bX - 20, baseCut);
        txt(cuttingRank ? '2 × 8 → 1 × 8' : rank + ' × 8', aX + 4 * cell, 887, 40, C.cyan);
        const bShape = cuttingRank
          ? '8 × 2 → 8 × 1'
          : cuttingHead
            ? '8 × 1 → 6 × 1'
            : width + ' × ' + rank;
        txt(bShape, bX + cell, 887, 40, C.cyan);
        const pairs = Math.floor(scanA * rank * features.length) + Math.floor(scanB * rank * width);
        const count = cuttingHead ? '16 → 14' : pairs;
        const label =
          state.beat === 1 && rankCut > 0
            ? '32 → ' + (rankTotal === 1 ? pairs : '?') + ' pairs / token'
            : branch < 1
              ? pairs + (pairs === 1 ? ' pair counted' : ' pairs counted')
              : count + ' pairs / token';
        txt(label, 1330, 975, 54);
      }),
    );
}
export default {
  id: 'opening',
  draw: drawOpening,
  cues: [
    'open-pull-back',
    'open-token',
    'open-branch',
    'open-rank-cut',
    'open-rank-total',
    'open-replay',
    'open-base-cut',
  ],
};
