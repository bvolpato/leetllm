import { WINDOW_CAPACITY, WINDOW_TURNS, WINDOW_SUMMARY } from '../fixtures.mjs';
import { cue } from '../case-file.mjs';

export function drawSlidingWindow(ctx, scene, state, api) {
  const { C } = api;
  const shift = cue(api, 'fourth-message') + cue(api, 'fifth-message');
  const first = Math.floor(shift);
  const moving = shift - first;
  const long = cue(api, 'long-message') >= 1;
  api.focus.target('window', () => {
    api.text(ctx, 'Historical summary', 113, 319, 47, C.ink, 'left', 'serif');
    api.line(ctx, 113, 352, 696, 352, C.muted, 2);
    if (shift >= 1) {
      api.text(ctx, 'From message 1', 115, 456, 32, C.muted);
      api.text(ctx, WINDOW_SUMMARY.split('=')[0] + '=', 115, 542, 39, C.yellow, 'left', 'mono');
      api.text(ctx, WINDOW_SUMMARY.split('=')[1], 115, 610, 40, C.yellow, 'left', 'mono');
    } else {
      api.text(ctx, 'Empty', 115, 483, 44, C.muted);
    }
    api.text(ctx, 'Raw window', 790, 317, 47, C.ink, 'left', 'serif');
    api.text(ctx, WINDOW_CAPACITY + ' messages', 1784, 317, 37, C.cyan, 'right');
    api.line(ctx, 790, 352, 1789, 352, C.muted, 2);
    for (const [index, turn] of WINDOW_TURNS.entries()) {
      const slot = index - first;
      if (slot < 0 || slot > WINDOW_CAPACITY) continue;
      const departing = slot === 0 && moving > 0;
      const arriving = slot === WINDOW_CAPACITY;
      const alpha = departing
        ? 1 - api.phase(moving, 0, 0.25)
        : arriving
          ? api.phase(moving, 0.75, 1)
          : 1;
      if (alpha <= 0) continue;
      const pos = departing
        ? 0
        : arriving
          ? WINDOW_CAPACITY - 1
          : slot - api.phase(moving, 0.25, 0.75);
      const y = 405 + pos * 156;
      ctx.save();
      ctx.globalAlpha *= alpha;
      api.rect(ctx, 790, y, 1000, 117, C.panel, null, 4);
      api.text(ctx, String(index + 1), 825, y + 75, 42, C.cyan, 'left', 'mono');
      if (long && index === 4) {
        api.text(ctx, 'Tool output', 905, y + 73, 38, C.ink);
        api.rect(ctx, 1208, y + 9, 558, 99, C.bg, null, 3);
        api.text(ctx, 'replay event=78291', 1232, y + 47, 29, C.cyan, 'left', 'mono');
        api.text(ctx, '… more log lines …', 1232, y + 89, 29, C.muted, 'left', 'mono');
      } else {
        api.text(
          ctx,
          turn.text,
          905,
          y + 75,
          37,
          index === 0 ? C.yellow : C.ink,
          'left',
          index === 0 ? 'mono' : 'sans',
        );
      }
      ctx.restore();
    }
    if (state.beat >= 2)
      api.text(
        ctx,
        cue(api, 'count-tokens') >= 1
          ? 'Count tokens in the summary and all three messages.'
          : long
            ? 'Still three messages. Will they fit?'
            : 'Three raw messages + one bounded summary',
        960,
        950,
        38,
        C.cyan,
        'center',
      );
  });
}
export default {
  id: 'sliding-window',
  draw: drawSlidingWindow,
  cues: ['fourth-message', 'fifth-message', 'long-message', 'count-tokens'],
};
