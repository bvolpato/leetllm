import { afterClause } from '../timing.mjs';

const events = [
  { at: 300, tokens: 1 },
  { at: 340, tokens: 3 },
];
const gap = events[1].at - events[0].at;
const tokens = events.reduce((n, event) => n + event.tokens, 0);

export function drawEventUnits(ctx, scene, state, api) {
  const { C } = api;
  const second = afterClause(state, 'second-packet', 0, 0.71);
  api.focus.target('output-events', () => {
    api.text(ctx, 'A second server trace', 155, 262, 37, C.ink);
    api.line(ctx, 310, 595, 1635, 595, C.muted, 3);
    for (const [i, event] of events.entries()) {
      if (i && !second) continue;
      const x = 430 + (event.at - events[0].at) * 24;
      api.circle(ctx, x, 595, 12, C.cyan);
      api.line(ctx, x, 493, x, 575, C.cyan, 3);
      api.text(ctx, 'Event ' + (i + 1), x, 366, 38, C.ink, 'center');
      const w = event.tokens * 74 + 25;
      api.rect(ctx, x - w / 2, 397, w, 91, C.panel, C.cyan, 8);
      for (let j = 0; j < event.tokens; j++)
        api.rect(ctx, x - w / 2 + 15 + j * 74, 416, 65, 52, C.cyan, undefined, 4);
      api.text(ctx, event.at + ' ms', x, 670, 37, C.ink, 'center');
    }
    if (afterClause(state, 'event-gap', 1, 0.2))
      api.text(ctx, gap + ' ms between events', 910, 550, 39, C.yellow, 'center');
  });
  api.focus.target('event-result', () => {
    const mean = afterClause(state, 'bundle-mean', 1, 0.63);
    const message = mean
      ? 'Request TPOT  =  ' +
        gap +
        ' ms / (' +
        tokens +
        ' − 1)  =  ' +
        (gap / (tokens - 1)).toFixed(1) +
        ' ms'
      : second
        ? 'Two timestamps  ·  four delivered tokens'
        : 'Each small block is one delivered token';
    api.text(ctx, message, 960, 870, 44, C.ink, 'center');
    if (mean)
      api.text(
        ctx,
        'Individual token times inside the second event are unknown',
        960,
        965,
        32,
        C.muted,
        'center',
      );
  });
}
export default {
  id: 'event-units',
  draw: drawEventUnits,
  cues: ['second-packet', 'event-gap', 'bundle-mean'],
};
