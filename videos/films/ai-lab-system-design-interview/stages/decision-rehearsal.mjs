import { namedSystemCue, spokenResult } from '../construction.mjs';
import { card, text } from '../defaults.mjs';

const intervals = [
  [0, 4, 'User and goal'],
  [4, 9, 'Requirements'],
  [9, 14, 'Bottleneck'],
  [14, 20, 'API and data'],
  [20, 28, 'Request path'],
  [28, 35, 'Failures and support'],
  [35, 40, 'Rollout'],
  [40, 45, 'Trade-offs'],
];
export function drawDecisionRehearsal(ctx, scene, state, api) {
  const { C, focus } = api;
  if (state.beat === 0)
    return focus.target('rehearsal-routes', () => {
      const changed = spokenResult(state, 'rehearsal-change', 0, 0.46);
      const split = spokenResult(state, 'rehearsal-split', 0, 0.6);
      text(ctx, api, 'Wait budget by route', 160, 291, 40, C.ink);
      text(ctx, api, 'A   250 ms', 1110, 291, 39, C.yellow);
      text(ctx, api, 'B   ' + (changed ? 100 : 250) + ' ms', 1480, 291, 39, C.yellow);
      const fork = split ? 631 : 1120;
      const gateX = split ? 810 : 585;
      api.line(ctx, 449, 560, fork, 560, C.blue, 4);
      api.line(ctx, fork, 418, fork, 712, C.blue, 4);
      for (const y of [418, 712]) api.line(ctx, fork, y, 1390, y, C.blue, 4);
      card(ctx, api, 'Gateway', 160, 510, 289, C.blue, 100, 40);
      if (!split) card(ctx, api, 'Shared queue', gateX, 510, 378, C.cyan, 100, 39);
      for (const [i, y] of [418, 712].entries()) {
        if (split)
          card(
            ctx,
            api,
            i ? 'Queue · 100 ms' : 'Queue · 250 ms',
            gateX,
            y - 48,
            375,
            C.cyan,
            96,
            36,
          );
        card(ctx, api, 'Adapter ' + (i ? 'B' : 'A'), 1390, y - 48, 370, C.blue, 96, 38);
      }
      text(
        ctx,
        api,
        split
          ? 'Separate waits let each route enforce its own limit.'
          : changed
            ? 'Can one waiting line protect both routes?'
            : 'One queue enforces the common limit.',
        160,
        912,
        44,
        C.ink,
      );
    });
  if (state.beat === 1)
    return focus.target('rehearsal-clock', () => {
      const elapsed =
        14 * namedSystemCue(state, 'rehearsal-size', 1, 0.18) +
        14 * namedSystemCue(state, 'rehearsal-path', 1, 0.45) +
        17 * namedSystemCue(state, 'rehearsal-close', 1, 0.69);
      text(ctx, api, 'Practice clock', 160, 300, 43, C.ink);
      text(ctx, api, '45 min', 1760, 300, 44, C.muted, 'right');
      const x = (minute) => 160 + (minute / 45) * 1600;
      intervals.forEach(([start, end, label], i) => {
        const width = x(end) - x(start) - 6;
        api.rect(ctx, x(start), 535, width, 62, C.panel, C.muted, 2);
        const fraction = Math.max(0, Math.min(1, (elapsed - start) / (end - start)));
        if (fraction > 0) api.rect(ctx, x(start), 535, width * fraction, 62, C.blue, undefined, 2);
        const center = (x(start) + x(end)) / 2;
        text(ctx, api, start + '–' + end, center, 509, 29, C.muted, 'center');
        text(ctx, api, label, center, 657 + (i % 2) * 47, 28, C.ink, 'center');
      });
      text(
        ctx,
        api,
        elapsed < 14
          ? 'What promise could fail?'
          : elapsed < 28
            ? 'Which request proves the path?'
            : 'What would make you change the design?',
        160,
        884,
        49,
        C.ink,
      );
    });
  return focus.target('rehearsal-receipt', () => {
    text(ctx, api, 'Support lookup   /   R-105', 160, 319, 56, C.ink);
    const fields = [
      ['Caller', 'Authorized · quota available'],
      ['Admission owner', 'Shared gateway queue'],
      ['Estimated wait', '400 ms against a 250 ms limit'],
      ['Client response', '503 · shared overload'],
    ];
    fields.forEach(([key, value], i) => {
      const y = 460 + i * 115;
      text(ctx, api, key, 160, y, 35, C.muted);
      text(ctx, api, value, 754, y, 43, i === 2 ? C.yellow : C.ink);
      api.line(ctx, 160, y + 32, 1760, y + 32, C.muted, 1);
    });
  });
}
export default {
  id: 'decision-rehearsal',
  draw: drawDecisionRehearsal,
  cues: [
    'rehearsal-common',
    'rehearsal-change',
    'rehearsal-split',
    'rehearsal-size',
    'rehearsal-path',
    'rehearsal-close',
    'rehearsal-lookup',
    'rehearsal-metric',
  ],
};
