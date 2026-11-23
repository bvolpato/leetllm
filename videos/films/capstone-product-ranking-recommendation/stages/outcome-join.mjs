import {
  arrow,
  box,
  cueProgress,
  cueVisible,
  footer,
  line,
  rankingText,
  tile,
} from '../defaults.mjs';
export function drawOutcomeJoin(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  api.focus.target('outcome-join-mechanism', () => {
    const { C } = api,
      b = state.beat ?? 0;
    {
      rankingText(ctx, api, 'REQ-501 · served12:00:05 · P5/P6/P4', 150, 270, 33);
      ['P5', 'P6', 'P4'].forEach((id, i) =>
        tile(ctx, api, id, null, 170 + i * 550, 365, C.blue, 470),
      );
      if (b === 0) {
        if (cueVisible(ctx, api, 'outcome-events')) {
          box(ctx, api, 'EVT-900 · click P5 · 12:00:08', 190, 590, 1520, 85, C.yellow, 32);
          box(ctx, api, 'EVT-901 · purchase P5 · 12:04:18', 190, 780, 1520, 85, C.green, 32);
        }
        if (cueVisible(ctx, api, 'outcome-join')) {
          const progress = cueProgress(ctx, api, 'outcome-join');
          arrow(ctx, api, 405, 452, 405, 565, C.yellow, progress);
          const route = [
              [170, 402],
              [130, 402],
              [130, 822],
              [165, 822],
            ],
            lengths = route
              .slice(1)
              .map((q, i) => Math.hypot(q[0] - route[i][0], q[1] - route[i][1]));
          let remaining = progress * lengths.reduce((a, v) => a + v, 0);
          route.slice(1).forEach((q, i) => {
            const start = route[i],
              fraction = Math.min(1, remaining / lengths[i]);
            if (fraction > 0) {
              const end = [
                start[0] + (q[0] - start[0]) * fraction,
                start[1] + (q[1] - start[1]) * fraction,
              ];
              if (i === lengths.length - 1)
                arrow(ctx, api, start[0], start[1], q[0], q[1], C.green, fraction);
              else line(ctx, api, start[0], start[1], end[0], end[1], C.green, 3);
            }
            remaining = Math.max(0, remaining - lengths[i]);
          });
        }
        if (cueVisible(ctx, api, 'outcome-join'))
          footer(ctx, api, 'Both events join request+product; neither changes the saved order.');
      } else if (b === 1) {
        box(ctx, api, 'New event · product P9', 180, 590, 700, 90, C.yellow, 30);
        if (cueVisible(ctx, api, 'outcome-unexposed'))
          box(ctx, api, 'Not in retained slate → reject join', 1050, 590, 700, 90, C.pink, 29);
        box(ctx, api, 'New P5 event ·12:00:04', 180, 795, 700, 90, C.yellow, 30);
        if (cueVisible(ctx, api, 'outcome-time'))
          box(ctx, api, 'Before served12:00:05 → reject time', 1050, 795, 700, 90, C.pink, 29);
        footer(
          ctx,
          api,
          'After serving is necessary under this contract; timing alone does not establish attribution.',
        );
      } else {
        box(ctx, api, 'Stored EVT-900 · click P5', 180, 575, 700, 85, C.blue, 30);
        if (cueVisible(ctx, api, 'outcome-replay'))
          box(ctx, api, 'Identical replay → no new effect', 1040, 575, 710, 85, C.green, 30);
        box(ctx, api, 'Same EVT-900 · changed product P6', 180, 790, 700, 85, C.yellow, 28);
        if (cueVisible(ctx, api, 'outcome-conflict'))
          box(ctx, api, 'Changed payload → conflict handling', 1040, 790, 710, 85, C.pink, 29);
        footer(
          ctx,
          api,
          'Required production contract; the local article does not implement a durable stream deduplicator.',
        );
      }
    }
  });
}
export default {
  id: 'outcome-join',
  draw: drawOutcomeJoin,
  cues: [
    'outcome-events',
    'outcome-join',
    'outcome-unexposed',
    'outcome-time',
    'outcome-replay',
    'outcome-conflict',
  ],
};
