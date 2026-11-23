import { chapterGrid, spokenProgress } from '../defaults.mjs';
import { checkpointRow, trackedColumn } from '../fixtures.mjs';
import { momentumReceipt } from '../model.mjs';
import { drawWeightScale } from '../weight-scale.mjs';

const w = checkpointRow[trackedColumn],
  velocity = 0.8,
  nextInput = 2,
  oldInput = 1,
  target = 2;
const full = momentumReceipt(w, velocity, nextInput, target);
const reset = momentumReceipt(w, 0, nextInput, target);
const stale = momentumReceipt(w, velocity, oldInput, target);
const tolerance = 0.001;

export function drawEarnedReturn(ctx, scene, state, api) {
  const { C } = api;
  const { beat } = state;
  const cue = (id, b, start, end) => spokenProgress(state, api, id, b, start, end);
  const exampleSelected = cue('end-saved-example', 0, 0.33, 0.42) > 0;
  const probeReady = cue('end-probe-result', 0, 0.43, 0.49) >= 1;
  const ruleReady = cue('end-gradient-rule', 0, 0.51, 0.69) > 0;
  const historyReady = cue('end-history', 0, 0.76, 0.88) > 0;
  const rewind = cue('mg-fresh-old-input', 2, 0.32, 0.53);
  const advance = cue('mg-fresh-cursor-repair', 3, 0.48, 0.57);
  const repaired = advance >= 1;
  const cursor = 1 - rewind + advance;
  const x = rewind < 1 || repaired ? nextInput : oldInput;
  const staleCase = beat >= 2;
  const a = cue('mg-fresh-full', 1, 0.24, 0.41);
  const b = cue('mg-fresh-reset', 1, 0.57, 0.76);
  const toStale = cue('mg-fresh-stale-result', 3, 0.3, 0.48);
  const rerun = cue('end-rerun', 3, 0.58, 0.72);
  const candidate = !staleCase ? reset : repaired ? full : stale;
  const movement = !staleCase ? b : repaired ? rerun : toStale;

  api.text(ctx, 'Column 6    ·    new tensor rank 1    ·    local index 2', 118, 244, 34, C.yellow);
  api.text(ctx, '2 TP × 2 CP × 4 DP × 2 PP = 32 ranks', 1795, 244, 32, C.muted, 'right');
  api.focus.target('stream', () => {
    chapterGrid(
      ctx,
      api,
      [
        ['Previous example', 'Saved next example'],
        ['x = 1', 'x = 2'],
      ],
      115,
      310,
      730,
      148,
      C.blue,
      32,
    );
    if (exampleSelected) {
      const px = 115 + 365 * (cursor + 0.5);
      api.line(ctx, px - 76, 472, px + 76, 472, C.yellow, 6);
      api.text(ctx, 'Restart reads here', px, 515, 30, C.yellow, 'center');
    }
  });
  chapterGrid(
    ctx,
    api,
    [
      ['Weight', 'Saved velocity', 'Restart input', 'Target'],
      [w, historyReady ? velocity : '·', exampleSelected ? x : '·', exampleSelected ? target : '·'],
    ],
    900,
    310,
    905,
    148,
    C.blue,
    29,
  );
  if (beat === 0) {
    const ask = cue('end-predict', 0, 0.9, 0.99) > 0;
    const probe = probeReady ? '1.5 × 2 = ' + full.prediction : '1.5 × x = ?';
    api.focus.target('probe-output', () =>
      api.text(
        ctx,
        ask ? 'Forward = 3. Where will the two weights land?' : probe,
        1353,
        515,
        34,
        C.yellow,
        'center',
      ),
    );
  } else if (beat === 2) {
    api.text(
      ctx,
      rewind === 1 ? 'Will the restart move left or right of 1.5?' : 'Both runs start again at 1.5',
      1353,
      515,
      34,
      C.yellow,
      'center',
    );
  } else {
    const error = Math.abs(candidate.nextWeight - full.nextWeight);
    const finished = movement >= 1;
    const passes = error <= tolerance;
    const test = finished
      ? 'Weight gap   ' +
        error.toFixed(2) +
        (passes ? ' ≤ ' : ' > ') +
        tolerance +
        (passes ? '    PASS' : '    FAIL')
      : 'Allowed weight gap   ≤ ' + tolerance;
    api.text(ctx, test, 1353, 515, 35, finished ? (passes ? C.green : C.pink) : C.muted, 'center');
  }

  api.focus.target('step-rule', () => {
    if (!ruleReady) return;
    let gradient = 'g = (w × x - target) × x';
    if (beat === 1 && cue('mg-fresh-gradient', 1, 0.06, 0.18) >= 1) {
      gradient =
        'g = (' + full.prediction + ' - ' + target + ') × ' + nextInput + ' = ' + full.gradient;
    } else if (beat === 3 && toStale >= 1) {
      const r = repaired ? full : stale;
      gradient = 'g = (' + r.prediction + ' - ' + target + ') × ' + r.input + ' = ' + r.gradient;
    }
    api.text(ctx, gradient, 125, 603, 37, C.ink);
    api.text(ctx, 'v′ = 0.5 × v + g', 1084, 603, 37, C.ink, 'center');
    api.text(ctx, 'w′ = w - 0.1 × v′', 1610, 603, 37, C.ink, 'center');
  });

  const referenceProgress = staleCase ? (beat === 3 ? 1 : 0) : a;
  drawWeightScale(ctx, api, {
    min: 1.2,
    step: 0.05,
    ticks: 8,
    saved: w,
    lanes: [
      {
        label: 'Uninterrupted',
        color: C.cyan,
        next: full.nextWeight,
        progress: referenceProgress,
        detail: historyReady
          ? 'old v = 0.8' + (referenceProgress === 1 ? '     new v = 2.4' : '')
          : '',
        showValue: staleCase ? toStale >= 1 || repaired : a >= 1,
      },
      {
        label: 'Restart',
        color: C.pink,
        next: candidate.nextWeight,
        progress: movement,
        detail: historyReady
          ? 'old v = ' +
            candidate.velocity +
            (movement === 1 ? '     new v = ' + Number(candidate.nextVelocity.toFixed(1)) : '')
          : '',
      },
    ],
  });
}

export default {
  id: 'earned-return',
  draw: drawEarnedReturn,
  cues: [
    'end-saved-example',
    'end-probe-result',
    'end-gradient-rule',
    'end-history',
    'end-predict',
    'mg-fresh-gradient',
    'mg-fresh-full',
    'mg-fresh-reset',
    'mg-fresh-old-input',
    'end-direction',
    'mg-fresh-stale-result',
    'mg-fresh-cursor-repair',
    'end-rerun',
  ],
};
