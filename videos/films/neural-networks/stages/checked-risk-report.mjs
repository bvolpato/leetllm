import { REQUESTS, REQUEST_IDS } from '../fixtures.mjs';
import { requestForward } from '../model.mjs';
import { neuralFrame } from '../construction.mjs';
import { dot, equation, focusTarget, line, text } from '../defaults.mjs';

export function drawCheckedRiskReport(ctx, scene, state, api) {
  const { C } = api;
  const f = neuralFrame(state);
  focusTarget(ctx, api, 'checked-risk-report-mechanism', () => {
    if (f.beat === 0) {
      const axis = (p) => 540 + ((p - 0.38) / 0.29) * 895;
      const threshold = 0.6 + 0.02 * f.progress('checked-risk-report-beat-1', 0);
      const ready = f.completed('route-policy-result', 0);
      const cutoff = axis(threshold);
      text(ctx, api, 'Request', 175, 293, 36, C.ink);
      text(ctx, api, 'Timeout score', 960, 293, 36, C.ink, 'center');
      text(ctx, api, 'Route', 1650, 293, 36, C.ink, 'center');
      for (const [i, x] of REQUESTS.entries()) {
        const p = requestForward(x).score;
        const y = 432 + 137 * i;
        text(ctx, api, REQUEST_IDS[i], 175, y + 10, 36, C.ink);
        line(ctx, api, 540, y, 1435, y, C.muted, 2);
        dot(ctx, api, axis(p), y, C.cyan, 14);
        text(ctx, api, p.toFixed(3), 470, y + 10, 33, C.cyan, 'right');
        if (ready)
          text(
            ctx,
            api,
            p >= threshold ? 'slow path' : 'fast path',
            1650,
            y + 10,
            37,
            p >= threshold ? C.yellow : C.ink,
            'center',
          );
      }
      if (f.shown('checked-risk-report-beat-0', 0)) {
        line(ctx, api, cutoff, 361, cutoff, 889, C.yellow, 5);
        text(ctx, api, 'Threshold ' + threshold.toFixed(3), cutoff, 972, 37, C.yellow, 'center');
      }
      return;
    }

    const complete = f.completed('calibration-bucket-result', 1);
    const progress = f.progress('calibration-bucket-result', 1);
    const total = 100;
    const timeouts = 93;
    const count = Math.floor(total * progress);
    text(ctx, api, '100 held-out requests with the same score', 960, 260, 39, C.ink, 'center');
    for (let i = 0; i < total; i++) {
      const x = 255 + (i % 10) * 51;
      const y = 353 + Math.floor(i / 10) * 51;
      const col = i >= count ? C.panel : i < timeouts ? C.blue : C.muted;
      api.rect(ctx, x, y, 36, 36, col, C.muted, 2);
    }
    text(ctx, api, 'Assigned score', 950, 447, 35, C.muted);
    text(ctx, api, '0.93', 1550, 447, 53, C.cyan, 'center');
    text(ctx, api, 'Observed frequency', 950, 595, 35, C.muted);
    if (complete) {
      equation(
        ctx,
        api,
        timeouts + '/' + total + '=' + (timeouts / total).toFixed(2),
        1550,
        575,
        46,
        C.blue,
      );
      text(ctx, api, '93 verified timeouts', 960, 760, 36, C.blue);
      text(ctx, api, '7 completed in time', 960, 832, 36, C.muted);
    } else text(ctx, api, 'Current verification: ' + count + ' / 100', 950, 765, 32, C.muted);
    if (f.beat === 2)
      text(
        ctx,
        api,
        'Check the other score ranges on held-out requests.',
        960,
        989,
        37,
        C.ink,
        'center',
      );
  });
}

export default {
  id: 'checked-risk-report',
  draw: drawCheckedRiskReport,
  cues: [
    'checked-risk-report-beat-0',
    'route-policy-result',
    'checked-risk-report-beat-1',
    'calibration-sample',
    'count-timeouts',
    'calibration-bucket-result',
    'checked-risk-report-beat-2',
  ],
};
