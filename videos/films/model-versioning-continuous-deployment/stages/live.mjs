import { CANDIDATE, liveGate, liveInventory } from '../model.mjs';
import { countStrip } from '../receipts.mjs';

const shadowDropRate = 0.001;
const thin = liveInventory('incomplete');
const pending = thin.find((row) => !row.reviewed);
const completedReview = thin.map((row) =>
  row === pending ? { ...row, reviewed: true, unsafe: true, useful: false } : row,
);
const complete = liveInventory('complete');
const before = liveGate(thin, shadowDropRate);
const after = liveGate(completedReview, shadowDropRate);
const full = liveGate(complete, shadowDropRate);

export function drawLive(ctx, scene, state, api) {
  const { C, focus } = api;
  const done = (id) => focus.cue(id)?.phase === 'after';
  const started = (id) => ['during', 'after'].includes(focus.cue(id)?.phase);
  const otherWindow = state.beat === 1;
  const reconsider = state.beat >= 2;
  const reviewed =
    reconsider && (done('unsafe-abort') || started('critical-abort') || state.beat >= 3);
  const window = otherWindow ? full : reviewed ? after : before;
  const verdictCue = otherWindow ? 'pass-window' : reconsider ? 'critical-abort' : 'hold-window';
  const write = (value, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, value, x, y, size, color, align);

  focus.target('window-receipt', () => {
    write('R52  /  candidate ' + CANDIDATE.slice(0, 12), 120, 250, 32, C.cyan);
    write('0–60 s window   ·   checked at 120 s', 1800, 250, 30, C.muted, 'right');
    write(
      otherWindow ? 'Independent 1,200-request sample' : 'The 600-request sample',
      120,
      357,
      50,
    );
    countStrip(ctx, api, {
      x: 135,
      y: 490,
      width: 880,
      label: 'Support reviews',
      reading: window.reviewed + ' / ' + window.requests + ' reviewed',
      value: window.reviewed,
      maximum: window.requests,
      color: C.cyan,
    });
    countStrip(ctx, api, {
      x: 135,
      y: 670,
      width: 880,
      label: 'Volume',
      reading: window.requests + ' / 1,000 required',
      value: window.requests,
      maximum: 1000,
      color: C.blue,
    });
    api.line(ctx, 1100, 400, 1100, 850, C.muted, 2);
    if (otherWindow) {
      write('0 unsupported serves', 1170, 462, 38, C.ink);
      if (started('experience-gate') || started('usefulness-gate') || started('pass-window')) {
        write('p95  ' + full.p95 + ' ms   ≤ 550 ms', 1170, 535, 33);
        write(
          'Errors  ' + full.errors + '/' + full.requests + ' = ' + ((100 * full.errors) / full.requests).toFixed(3) + '%   ≤ 1%',
          1170,
          601,
          32,
        );
        write('Shadow drops  ' + (100 * shadowDropRate).toFixed(1) + '%   ≤ 2%', 1170, 663, 32);
      }
      if (started('usefulness-gate') || started('pass-window')) {
        write(
          'Useful supported ' +
            full.useful +
            ' / ' +
            full.answerable +
            ' = ' +
            (100 * full.useful) / full.answerable +
            '%',
          1170,
          743,
          30,
        );
        write(
          'Rollback subset  ' +
            full.rollbackUseful +
            ' / ' +
            full.rollback +
            ' = ' +
            (100 * full.rollbackUseful) / full.rollback +
            '%',
          1170,
          807,
          30,
        );
      }
    } else {
      write('Review for request ' + (Number(pending.id.split('-')[1]) + 1), 1170, 480, 37, C.muted);
      write(
        reviewed ? 'Approval was served' : 'Awaiting support review',
        1170,
        571,
        39,
        reviewed ? C.ink : C.yellow,
      );
      if (reviewed) write('Approval record absent', 1170, 632, 35, C.pink);
      write(
        window.unsafe +
          (window.unsafe === 1 ? ' confirmed unsupported serve' : ' confirmed unsupported serves'),
        1170,
        750,
        35,
        reviewed ? C.pink : C.ink,
      );
    }
    const color =
      window.status === 'ABORT' ? C.pink : window.status === 'HOLD' ? C.yellow : C.green;
    const prompt =
      reconsider && reviewed
        ? 'Wait for 1,000, or stop candidate traffic?'
        : otherWindow
          ? 'May this canary take the next step?'
          : 'Can we widen with one review missing?';
    write(
      done(verdictCue) ? window.status + ' · ' + window.reason : prompt,
      960,
      969,
      43,
      done(verdictCue) ? color : C.ink,
      'center',
    );
  });
}
export default {
  id: 'live',
  draw: drawLive,
  cues: [
    'pending-outcome',
    'hold-window',
    'coverage-gate',
    'experience-gate',
    'usefulness-gate',
    'pass-window',
    'unsafe-abort',
    'critical-abort',
  ],
};
