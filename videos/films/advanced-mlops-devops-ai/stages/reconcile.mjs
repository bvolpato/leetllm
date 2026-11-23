import { cueClock } from '../cue-clock.mjs';
import { temporalReleaseJoin } from '../features.mjs';

const releases = {
  B: { id: 'last-known-good', transform: 'L2', view: 'releases@4', corpus: 'corpus B' },
  C: { id: 'release-a91', transform: 'raw', view: 'releases@5', corpus: 'corpus C' },
};

// Times are minutes after 09:00 in this supplied trace.
const feature = { event: 40, available: 55 };
const request = 60;
const allowedAge = 60;
const estimate = 13;
const actual = 12;
const tolerance = 2;

function drawRestoredTrace(ctx, api, p) {
  const { C, focus } = api;
  const text = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  text(
    'Example us-west trace   /   ' +
      releases.B.id +
      '   /   ' +
      releases.B.view +
      '   /   ' +
      releases.B.transform,
    150,
    262,
    37,
    C.green,
  );
  focus.target('trace-clock', () => {
    text('Feature lookback: one hour', 150, 377, 38);
    const x = (minute) => 250 + minute * 22;
    api.line(ctx, x(0), 492, x(request), 492, C.blue, 5);
    for (const [minute, label, condition] of [
      [0, '09:00', true],
      [feature.event, '09:40 event', p('inspect-clocks') === 1],
      [feature.available, '09:55 available', p('inspect-arrival') === 1],
      [request, '10:00 request', true],
    ]) {
      if (!condition) continue;
      api.circle(ctx, x(minute), 492, 9, minute === request ? C.yellow : C.blue);
      text(
        label,
        x(minute),
        minute === feature.available ? 449 : 552,
        34,
        minute === request ? C.yellow : C.ink,
        'center',
      );
    }
    if (p('verify-clocks') === 1 && temporalReleaseJoin([feature], request, allowedAge))
      text(
        'Event age  ' +
          (request - feature.event) +
          ' min     ·     available  ' +
          (request - feature.available) +
          ' min before request',
        960,
        644,
        36,
        C.green,
        'center',
      );
  });
  focus.target('trace-estimate', () => {
    api.line(ctx, 150, 695, 1760, 695, C.muted, 2);
    text('Deployment duration', 150, 775, 36, C.muted);
    if (p('inspect-estimate') > 0) text('Estimated  ' + estimate + ' h', 150, 868, 45);
    if (p('inspect-result') > 0) text('Actual  ' + actual + ' h', 733, 868, 45);
    text('Tolerance  ±' + tolerance + ' h', 1325, 868, 44, C.yellow);
    const error = Math.abs(estimate - actual);
    const message =
      p('verify-estimate') === 1
        ? 'Absolute error  ' + error + ' h    ≤    ' + tolerance + ' h'
        : p('check-restored') > 0
          ? 'Does this request pass both recovery checks?'
          : '';
    text(message, 960, 988, 39, p('verify-estimate') === 1 ? C.green : C.ink, 'center');
  });
}

export function drawReconcile(ctx, scene, state, api) {
  const p = cueClock(scene, state);
  if (state.beat >= 4) return drawRestoredTrace(ctx, api, p);
  const { C, focus } = api;
  const text = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const split = p('fork-restore') > 0;
  const cases = [
    {
      y: 460,
      git: 'C',
      declared: p('git-before') > 0,
      sync: p('top-sync'),
      observed: p('top-request') === 1,
    },
    {
      y: 750,
      git: 'B',
      declared: p('git-after') > 0,
      sync: p('bottom-sync'),
      observed: p('bottom-request') === 1,
    },
  ];
  text('After emergency restore', 125, 285, 32, C.muted);
  text('Manifest in Git', 580, 285, 32, C.muted);
  text('Successful sync', 1005, 285, 32, C.muted);
  text('New us-west trace', 1420, 285, 32, C.muted);
  focus.target('sync-paths', () => {
    text('Served B', 130, 580, 60, C.green);
    text('healthy baseline', 130, 642, 29, C.muted);
    for (const [i, branch] of cases.entries()) {
      const { y, git, declared, sync } = branch;
      if (!split) continue;
      const fork = [
        { x: 390, y: 564 },
        { x: 440, y: 564 },
        { x: 520, y },
        { x: 545, y },
      ];
      api.trace(ctx, fork, p('fork-restore'), C.blue, 4);
      const expected = releases[git],
        color = i === 0 ? C.pink : C.green;
      text(
        declared ? (i === 0 ? 'Keep C' : 'Restore B') : 'Git  ?',
        580,
        y + 10,
        48,
        declared ? color : C.muted,
      );
      if (declared)
        text(expected.corpus + '   /   ' + expected.transform, 580, y + 65, 30, C.muted);
      api.line(ctx, 890, y, 1255, y, C.muted, 2);
      if (sync > 0) {
        const to = 890 + 365 * sync;
        api.line(ctx, 890, y, to, y, color, 6);
        api.circle(ctx, to, y, 10, color);
      }
      if (sync === 1) text('route  ' + git, 1060, y - 32, 36, color, 'center');
    }
  });
  focus.target('sync-proof', () => {
    for (const branch of cases) {
      if (!split) continue;
      const { y, git, observed } = branch;
      const release = releases[git];
      text(
        observed ? release.id : '?',
        1420,
        y + 12,
        observed ? 38 : 58,
        observed ? C.ink : C.yellow,
      );
      if (observed)
        text(
          release.view + '   /   ' + release.transform,
          1420,
          y + 68,
          32,
          git === 'B' ? C.green : C.pink,
        );
    }
    api.line(ctx, 150, 874, 1770, 874, C.muted, 2);
    const label =
      p('next-request') > 0 && cases[0].sync === 0
        ? 'Which release answers the first request after each sync?'
        : 'Same initial route and sync policy on both branches';
    text(label, 960, 974, 39, C.ink, 'center');
  });
}
export default {
  id: 'reconcile',
  draw: drawReconcile,
  cues: [
    'fork-restore',
    'git-before',
    'git-after',
    'next-request',
    'top-sync',
    'top-request',
    'bottom-sync',
    'bottom-request',
    'inspect-clocks',
    'inspect-arrival',
    'inspect-estimate',
    'inspect-result',
    'check-restored',
    'verify-clocks',
    'verify-estimate',
  ],
};
