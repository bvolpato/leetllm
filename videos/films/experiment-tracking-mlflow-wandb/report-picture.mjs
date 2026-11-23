import { lexicalTokens } from '../../lib/captions.mjs';
import { validateVisualCues } from '../../lib/narration-cues.mjs';
import { CASES } from './fixtures.mjs';
import { clamp } from './arithmetic.mjs';

const untimed = new WeakMap();

// Storyboard stills without recorded words use the same phrase spans as the narration.
export function cueClock(scene, state) {
  return (id) => {
    if (state.cues) return state.cues[id].progress;
    if (!untimed.has(scene)) {
      untimed.set(scene, new Map(validateVisualCues(scene).map((cue) => [cue.id, cue])));
    }
    const cue = untimed.get(scene).get(id);
    if (state.beat !== cue.beat) return state.beat > cue.beat ? 1 : 0;
    const words = lexicalTokens(scene.beats[cue.beat].say).length;
    return clamp(((state.beatP ?? 0) * words - cue.first) / (cue.last - cue.first + 1));
  };
}

export const caseNames = ['Deploy approval', 'Freeze status', 'Rollback steps', 'Missing approval'];

export function caseLabel(ctx, api, row, x, y) {
  api.text(ctx, caseNames[CASES.indexOf(row)], x, y, 39, api.C.ink);
  api.text(ctx, row.caseId, x, y + 39, 26, api.C.muted, 'left', 'mono');
}

export function routeMark(ctx, api, value, center, y, expected) {
  const { C } = api;
  const error = value && expected && expected !== value;
  if (error) api.rect(ctx, center - 132, y - 50, 264, 77, C.panel, C.pink, 10);
  api.text(
    ctx,
    value || '·',
    center,
    y + 5,
    39,
    error ? C.pink : value ? C.ink : C.muted,
    'center',
  );
}

// Keep each case and run in the same column when the experiment acquires another execution.
export function routeLedger(ctx, api, reports) {
  const { C } = api;
  api.text(ctx, 'Frozen case', 120, 295, 32, C.muted);
  api.text(ctx, 'Expected', 620, 295, 32, C.muted, 'center');
  const centers = [942, 1262, 1590];
  const names = ['Original', 'First repair', 'Revision'];
  reports.forEach((report, i) => {
    if (!report) return;
    api.text(ctx, 'Run ' + (i + 1), centers[i], 242, 28, C.muted, 'center');
    api.text(ctx, names[i], centers[i], 295, 40, C.ink, 'center');
  });
  api.line(ctx, 118, 329, 1776, 329, C.muted, 2);
  CASES.forEach((row, i) => {
    const y = 393 + i * 112;
    api.focus.target('case-' + i, () => {
      caseLabel(ctx, api, row, 120, y);
      api.text(ctx, row.expected, 620, y + 8, 36, C.cyan, 'center');
      reports.forEach((report, j) => {
        if (!report) return;
        const prediction = report.rows.find((r) => r.caseId === row.caseId);
        routeMark(ctx, api, prediction?.predicted, centers[j], y, row.expected);
      });
    });
  });
  api.line(ctx, 118, 819, 1776, 819, C.muted, 2);
  api.focus.target('matches', () => {
    api.text(ctx, 'Exact routes / cases checked', 120, 887, 34, C.muted);
    reports.forEach((report, j) => {
      if (report)
        api.text(
          ctx,
          report.count ? report.exact + ' / ' + report.count : 'Pending',
          centers[j],
          889,
          38,
          C.ink,
          'center',
        );
    });
  });
}
