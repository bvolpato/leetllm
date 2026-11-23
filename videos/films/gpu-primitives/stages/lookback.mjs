import { drawExtendedBox as box, text } from '../defaults.mjs';
import { after, cue } from '../score-trace.mjs';

const records = [7, 4, 3, 2];
const readers = [3, 2, 1, 0];
const running = readers.map((_, i) =>
  readers.slice(0, i + 1).reduce((sum, j) => records[j] + sum, 0),
);
const center = (i) => 390 + 380 * i;

export function drawLookback(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat < 2) {
    const cues = ['lookback-five', 'lookback-nine', 'lookback-sixteen'];
    const steps = cues.filter((id, i) => after(state, id, 1, 0.23 + i * 0.24)).length;
    const hop =
      steps < 3 ? cue(state, cues[steps], 1, 0.03 + steps * 0.24, 0.23 + steps * 0.24) : 0;
    const offset = after(state, 'lookback-offset', 1, 0.87);
    api.focus.target('lookback-board', () => {
      records.forEach((v, i) => {
        const x = center(i),
          selected = i >= 3 - steps;
        const col = i === 0 ? C.green : i === 3 ? C.yellow : C.cyan;
        text(ctx, api, 'Tile ' + i, x, 364, 35, C.ink);
        box(
          ctx,
          api,
          (i === 0 ? 'P' : i === 3 ? 'Own' : 'A') + '    ' + v,
          x - 134,
          409,
          268,
          109,
          col,
          44,
        );
        if (selected) api.line(ctx, x - 129, 551, x + 129, 551, C.yellow, 7);
      });
      const head = center(3 - steps);
      if (steps > 0) api.line(ctx, head, 645, center(3), 645, C.yellow, 4);
      if (hop > 0) api.line(ctx, head, 645, head - 380 * hop, 645, C.yellow, 4);
      api.circle(ctx, head - 380 * hop, 645, 12, C.yellow);
      const terms = records.slice(3 - steps).join(' + ');
      text(
        ctx,
        api,
        steps ? terms + ' = ' + running[steps] : 'Start with tile 3’s own ' + records[3],
        960,
        793,
        56,
        C.ink,
      );
      text(
        ctx,
        api,
        offset
          ? 'Tile 3 starts at ' + (running[3] - records[3]) + '     ·     ends at ' + running[3]
          : steps === 3
            ? 'P covers everything through tile 0. Stop here.'
            : 'A covers one tile.   P covers the prefix through its tile.',
        960,
        929,
        37,
        offset ? C.green : C.muted,
      );
    });
    return;
  }
  if (state.beat === 2) {
    const waiting = after(state, 'lookback-wait', 2, 0.23);
    const written = after(state, 'lookback-write', 2, 0.36);
    const published = after(state, 'lookback-publish', 2, 0.53);
    const acquired = after(state, 'lookback-acquire', 2, 0.73);
    api.focus.target('publication-board', () => {
      const item = (x, title, v, col) => {
        text(ctx, api, title, x, 399, 36, C.ink);
        box(ctx, api, v, x - 184, 463, 368, 125, col, 49);
      };
      item(410, 'Payload', written ? '7' : '·', C.blue);
      item(960, 'Published status', published ? 'P' : 'X', published ? C.green : C.muted);
      item(1510, 'Reader', acquired ? '7' : waiting ? 'wait' : '?', acquired ? C.green : C.muted);
      if (published) api.arrow(ctx, 632, 525, 728, 525, C.cyan, 4);
      if (acquired) api.arrow(ctx, 1182, 525, 1278, 525, C.green, 4);
      text(
        ctx,
        api,
        acquired
          ? 'Acquire the published status, then consume its payload.'
          : published
            ? 'The writer has released P.'
            : written
              ? 'The payload exists. Its status is still X.'
              : waiting
                ? 'The reader waits for the writer.'
                : 'The reader finds X.',
        960,
        816,
        43,
        C.ink,
      );
    });
    return;
  }
  api.focus.target('traffic-board', () => {
    const read = 4,
      write = 8;
    for (let i = 0; i < read + write; i++)
      api.rect(ctx, 260 + i * 116, 444, 103, 118, i < read ? C.blue : C.cyan, undefined, 5);
    text(ctx, api, '1 input   ·   4 bytes', 486, 655, 37, C.blue);
    text(ctx, api, '1 output   ·   8 bytes', 1182, 655, 37, C.cyan);
    text(ctx, api, read + write + ' useful bytes per item', 960, 812, 57, C.ink);
    if (cue(state, 'lookback-work', 3, 0.65, 0.8) > 0)
      text(ctx, api, 'Metadata and repeated look-back reads add traffic.', 960, 928, 35, C.muted);
  });
}
export default {
  id: 'lookback',
  draw: drawLookback,
  cues: [
    'lookback-records',
    'lookback-prefix',
    'lookback-five',
    'lookback-nine',
    'lookback-sixteen',
    'lookback-offset',
    'lookback-wait',
    'lookback-write',
    'lookback-publish',
    'lookback-acquire',
    'lookback-traffic',
    'lookback-work',
  ],
};
