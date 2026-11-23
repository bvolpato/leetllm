import { drawCalendar } from '../manual.mjs';
import { drawRouteBoard } from '../route-board.mjs';
import { freshRoutes, restoreSource, restoreSummary } from '../fixtures.mjs';

const restoreDates = { start: '2026-10-29', end: '2026-11-19', jobs: ['2026-11-12'] };

export function drawFreshException(ctx, scene, state, api) {
  const { C, focus } = api;
  const beat = state.beat;
  if (beat <= 3) {
    const movement = focus.progress(
      'lower-cap',
      beat > 2 ? 1 : beat === 2 ? api.phase(state.beatP, 0.1, 0.45) : 0,
    );
    const costCap = (30 - Math.round(10 * movement)) / 100;
    const first =
      beat === 1 && focus.progress('fresh-route', api.phase(state.beatP, 0.03, 0.4)) >= 1;
    const last = beat === 3 && focus.progress('fresh-hold', api.phase(state.beatP, 0, 0.35)) >= 1;
    drawRouteBoard(ctx, api, {
      rows: freshRoutes,
      cap: costCap,
      inspected: Array(3).fill(first || last),
      question:
        beat <= 1 ? 'Which eligible route costs least?' : 'Which route, if any, can still run?',
      reveal: first || last,
      moving: movement > 0 && movement < 1,
    });
    return;
  }
  const corrected =
    beat > 5 ||
    focus.progress('fresh-fact-correct', beat === 5 ? api.phase(state.beatP, 0.32, 0.6) : 0) >= 1;
  const candidate = corrected ? restoreSource : restoreSummary;
  const matched = Object.keys(restoreSource).filter(
    (key) => candidate[key] === restoreSource[key],
  ).length;
  const final = beat >= 6;
  focus.target('restore-fields', () => {
    if (final) {
      api.rect(ctx, 328, 225, 1264, 282, C.panel, C.blue, 10);
      api.text(ctx, 'Backup restore   /   manual R3, page 2', 381, 299, 39, C.blue);
      api.line(ctx, 381, 334, 1539, 334, C.muted, 2);
      api.text(ctx, restoreSource.condition + ' required', 381, 435, 45, C.ink);
      api.text(ctx, 'Expires ' + restoreSource.expiry, 1539, 435, 45, C.ink, 'right');
      return;
    }
    api.text(ctx, 'Backup restore', 135, 270, 33, C.muted);
    api.text(ctx, 'Logging condition', 660, 270, 33, C.muted);
    api.text(ctx, 'Expiry', 1320, 270, 33, C.muted);
    const rows = [
      ['Manual R3  /  p2', restoreSource],
      ['Desk summary', candidate],
    ];
    rows.forEach(([label, row], i) => {
      const y = 365 + i * 100;
      api.text(ctx, label, 135, y, 39, C.blue);
      api.text(ctx, row.condition, 660, y, 40, C.ink);
      api.text(ctx, row.expiry, 1320, y, 43, i && corrected ? C.green : C.ink);
    });
    api.line(ctx, 135, 505, 1780, 505, C.muted, 2);
  });
  const extraRun =
    beat === 7 ||
    focus.progress('extra-restore', beat === 6 ? api.phase(state.beatP, 0.1, 0.45) : 0) > 0;
  const endCheck =
    beat === 7 && focus.progress('restore-outcome', api.phase(state.beatP, 0, 0.4)) >= 1;
  focus.target('restore-calendar', () =>
    drawCalendar(
      ctx,
      api,
      extraRun ? { ...restoreDates, jobs: [...restoreDates.jobs, '2026-11-16'] } : restoreDates,
      {
        expiry: candidate.expiry,
        y: 738,
        showResult: final ? endCheck : corrected,
        markerLabel: final ? 'Expiry' : 'Summary expiry',
      },
    ),
  );
  const scored =
    beat === 5 && focus.progress('fresh-fact-half', api.phase(state.beatP, 0, 0.2)) >= 1;
  focus.target('restore-answer', () =>
    api.text(
      ctx,
      final
        ? endCheck
          ? 'November 16 falls outside the documented exception.'
          : extraRun
            ? 'With approval logging on, does November 16 qualify?'
            : 'November 12 qualifies with approval logging on.'
        : scored
          ? 'Exact recall = ' + matched + ' / 2'
          : 'What fraction of the two required fields match exactly?',
      960,
      965,
      39,
      endCheck ? C.pink : scored ? C.yellow : C.ink,
      'center',
    ),
  );
}
export default {
  id: 'fresh-exception',
  draw: drawFreshException,
  cues: [
    'fresh-fact-half',
    'fresh-fact-correct',
    'fresh-route',
    'lower-cap',
    'fresh-hold',
    'extra-restore',
    'restore-outcome',
  ],
};
