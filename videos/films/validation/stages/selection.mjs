import { confusion, f1 } from '../arithmetic.mjs';
import { test, validation } from '../fixtures.mjs';
import { phraseProgress } from '../defaults.mjs';

export function drawSelection(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const thresholds = [0.3, 0.5, 0.7];
  const winner = thresholds.reduce((best, t) =>
    f1(confusion(validation, t)) > f1(confusion(validation, best)) ? t : best,
  );
  const july = beat < 4;
  const data = july ? validation : test;
  const target = july && beat < 3 ? thresholds[beat] : winner;
  const previous = beat > 0 && beat <= 3 ? thresholds[beat - 1] : target;
  const threshold =
    Math.round(100 * api.lerp(previous, target, api.phase(state.beatP ?? 0, 0, 0.18))) / 100;
  const open = july || beat >= 5;

  api.text(
    ctx,
    july ? 'July · choose on validation' : 'August · score the frozen rule',
    128,
    252,
    39,
    C.ink,
  );
  api.text(ctx, 'Review at or above ' + threshold.toFixed(2), 130, 328, 38, C.yellow);
  const pointX = (p) => 386 + p * 720;
  for (const [i, row] of data.entries()) {
    const y = 435 + i * 83;
    api.text(ctx, 'r' + i, 156, y + 13, 33, C.muted);
    api.text(ctx, row.p.toFixed(2), 289, y + 13, 35, C.ink, 'center');
    api.line(ctx, pointX(0), y, pointX(1), y, C.muted, 2);
    api.circle(ctx, pointX(row.p), y, 15, row.p >= threshold ? C.yellow : C.blue);
    const label = !open ? '?' : row.y ? 'Needed' : 'Routine';
    api.text(ctx, label, 1252, y + 13, 31, open ? C.ink : C.muted, 'center');
  }
  const cut = pointX(threshold);
  api.line(ctx, cut, 398, cut, 880, C.yellow, 4);
  api.text(ctx, threshold.toFixed(2), cut, 935, 34, C.yellow, 'center');
  api.text(ctx, 'Audit', 1252, 371, 30, C.muted, 'center');

  if (july) {
    api.text(ctx, 'Threshold', 1442, 357, 30, C.muted);
    api.text(ctx, 'F1', 1720, 357, 30, C.muted, 'right');
    const count = Math.min(beat + 1, 3);
    const results = ['july-low', 'july-middle', 'july-high'];
    for (const [i, t] of thresholds.slice(0, count).entries()) {
      const y = 457 + i * 112;
      if (beat === 3 && t === winner) api.rect(ctx, 1410, y - 54, 363, 78, C.panel, C.yellow, 9);
      api.text(ctx, t.toFixed(2), 1470, y, 36, C.muted);
      const scored = phraseProgress(state, api, results[i], i, 0.76, 0.9) >= 1;
      api.focus.target(results[i] + '-score', () =>
        api.text(
          ctx,
          scored ? f1(confusion(data, t)).toFixed(2) : '?',
          1720,
          y,
          43,
          C.ink,
          'right',
        ),
      );
    }
    const c = confusion(data, threshold);
    api.text(
      ctx,
      'Caught ' + c.tp + '    False alarms ' + c.fp + '    Missed ' + c.fn,
      960,
      1017,
      35,
      C.ink,
      'center',
    );
  } else {
    const c = confusion(test, winner);
    api.text(ctx, 'August F1', 1590, 438, 37, C.muted, 'center');
    api.text(
      ctx,
      open ? f1(c).toFixed(2) : '?',
      1590,
      566,
      82,
      open ? C.yellow : C.muted,
      'center',
    );
    if (open) {
      api.text(ctx, 'Caught ' + c.tp, 1460, 690, 33, C.ink);
      api.text(ctx, 'False alarms ' + c.fp, 1460, 753, 33, C.ink);
      api.text(ctx, 'Missed ' + c.fn, 1460, 816, 33, C.ink);
    }
    api.text(
      ctx,
      'July selected ' + winner.toFixed(2) + ' · August keeps it fixed',
      960,
      1017,
      35,
      C.ink,
      'center',
    );
  }
}

export default {
  id: 'selection',
  draw: drawSelection,
  cues: ['july-low', 'july-middle', 'july-high'],
};
