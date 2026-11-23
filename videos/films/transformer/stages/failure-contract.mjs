import { AXIS_BASELINES, MODEL, normalizationAxisCase } from '../model.mjs';
import { WORDS } from '../fixtures.mjs';
import { event } from '../arithmetic.mjs';
import {
  drawExtendedNote,
  drawExtendedRow,
  drawExtendedText,
  drawExtendedTitle,
  withTransformerExtendedFrame,
} from '../defaults.mjs';
export function paintFailureContract(
  ctx,
  scene,
  state,
  api,
  C,
  id,
  s,
  b,
  p,
  f,
  mix,
  known,
  colors,
) {
  if (b === 0) {
    drawExtendedTitle(
      ctx,
      api,
      C,
      'Repair feature coordinates before the residual addition',
      'The waiting residual has four features',
    );
    drawExtendedRow(ctx, api, C, f, MODEL.Y[2], 300, 410, 1300, C.blue);
    drawExtendedRow(
      ctx,
      api,
      C,
      f,
      known('project', 0) ? MODEL.F[2] : MODEL.H[2],
      300,
      630,
      1300,
      known('project', 0) ? C.green : C.pink,
    );
    drawExtendedText(
      ctx,
      api,
      C,
      known('project', 0)
        ? 'project 6 → 4, then add'
        : '6 hidden features cannot be added to 4 residual features',
      960,
      850,
      32,
      known('project', 0) ? C.green : C.pink,
      'center',
    );
    drawExtendedNote(
      ctx,
      api,
      C,
      'An arbitrary reshape changes ownership · it does not learn the needed projection',
    );
  } else if (b === 1) {
    drawExtendedTitle(
      ctx,
      api,
      C,
      'Use the first broken invariant to choose a repair',
      'Keep actual positions with the cached query',
    );
    const repaired = known('mask', 1);
    drawExtendedRow(
      ctx,
      api,
      C,
      f,
      ['absolute query 3', 'K₀', 'K₁', 'K₂', 'K₃'],
      250,
      430,
      1400,
      C.blue,
    );
    drawExtendedRow(
      ctx,
      api,
      C,
      f,
      repaired ? ['allow', 'allow', 'allow', 'allow'] : ['allow', 'deny', 'deny', 'deny'],
      550,
      650,
      1100,
      repaired ? C.green : C.pink,
    );
    drawExtendedText(
      ctx,
      api,
      C,
      repaired ? 'position alignment repaired' : 'valid shape · wrong readable history',
      960,
      850,
      33,
      repaired ? C.green : C.pink,
      'center',
    );
    drawExtendedNote(
      ctx,
      api,
      C,
      'All-masked NaN and probability-after-softmax scaling have different causes',
    );
  } else {
    const change = 4 * event(state, 3, 'change-last-feature', 0.08, 0.32);
    const reveal = known('compare-rows', 3);
    const left = 262,
      gap = 857,
      width = 615;
    for (const [k, baseline] of AXIS_BASELINES.entries()) {
      const acrossPositions = k === 1;
      const run = normalizationAxisCase(change, acrossPositions);
      const x = left + k * gap,
        dx = width / 4;
      const color = acrossPositions ? C.pink : C.blue;
      drawExtendedText(
        ctx,
        api,
        C,
        acrossPositions ? 'Across three positions' : 'Across four features',
        x + width / 2,
        304,
        39,
        color,
        'center',
      );
      for (const [i, row] of run.input.entries()) {
        const y = 402 + 87 * i;
        drawExtendedText(ctx, api, C, WORDS[i], x - 18, y + 47, 27, C.ink, 'right');
        row.forEach((v, j) => {
          const selected = acrossPositions ? j === 0 : i === 0;
          api.rect(
            ctx,
            x + j * dx,
            y,
            dx - 8,
            74,
            selected ? color : C.panel,
            selected ? undefined : C.muted,
            4,
          );
          drawExtendedText(
            ctx,
            api,
            C,
            f(v, 2),
            x + (j + 0.5) * dx - 4,
            y + 47,
            33,
            selected ? C.panel : C.ink,
            'center',
          );
        });
      }
      drawExtendedText(
        ctx,
        api,
        C,
        'Mean of highlighted entries   ' + f(run.mean),
        x + width / 2,
        738,
        31,
        color,
        'center',
      );
      const delta = Math.max(...run.model.Z[0].map((v, j) => Math.abs(v - baseline.model.Z[0][j])));
      drawExtendedText(
        ctx,
        api,
        C,
        'Largest change in “function” output',
        x + width / 2,
        827,
        30,
        C.muted,
        'center',
      );
      drawExtendedText(
        ctx,
        api,
        C,
        reveal ? f(delta) : '?',
        x + width / 2,
        902,
        45,
        reveal && delta > 0 ? C.pink : C.ink,
        'center',
      );
    }
    drawExtendedNote(
      ctx,
      api,
      C,
      'Both blocks have zero future attention weight   ·   fixed weights   ·   dropout off',
    );
  }
}
export function drawFailureContractStage(ctx, scene, state, api) {
  withTransformerExtendedFrame(ctx, scene, state, api, paintFailureContract);
}
export default {
  id: 'failure-contract',
  draw: drawFailureContractStage,
  cues: [
    'tr-failure-contract-voice-0',
    'tr-failure-contract-project',
    'tr-failure-contract-voice-1',
    'tr-failure-contract-mask',
    'change-last-feature',
    'tr-failure-contract-compare-rows',
  ],
};
