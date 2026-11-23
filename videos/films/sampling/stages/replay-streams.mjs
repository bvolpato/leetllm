import { clamp, cueStep } from '../construction.mjs';
import { samplingFilmData } from '../fixtures.mjs';

const [first, second] = samplingFilmData.replicaCounts;
const column = (i) => 659 + 262 * i;
const ringRadius = 48;
const linkInset = ringRadius + 10;

export function drawReplayStreams(ctx, scene, state, api) {
  const { C } = api;
  const original = cueStep(state, 'stream-original', 0, 0.11, 0.48);
  const shift = cueStep(state, 'sp-replay-streams-0', 0, 0.63, 0.86);
  const replay = cueStep(state, 'stream-restart', 1, 0.12, 0.54);
  const fourth = cueStep(state, 'stream-fourth', 2, 0.04, 0.27);
  const distinct = cueStep(state, 'sp-replay-streams-1', 3, 0.08, 0.47);
  api.focus.target('sp-replay-streams-visual', () => {
    api.text(ctx, 'Resolutions in each batch of 20', 237, 267, 37, C.ink);
    const rows = [
      ['A', first, original * 4, C.cyan],
      ['Restart A', first, replay * 3 + fourth, C.cyan],
      ['B', second, distinct * 4, C.blue],
    ];
    rows.forEach(([name, counts, drawn, color], row) => {
      if ((row === 1 && state.beat < 1) || (row === 2 && state.beat < 3)) return;
      const y = 425 + 191 * row;
      api.text(ctx, name, 235, y + 15, 44, color);
      counts.forEach((count, i) => {
        const p = clamp(drawn - i);
        const x = column(i);
        if (i > 0) api.line(ctx, column(i - 1) + linkInset, y, x - linkInset, y, C.muted, 3);
        api.circle(ctx, x, y, ringRadius, C.bg, p === 1 ? color : C.muted, 3);
        if (p === 1) {
          api.circle(ctx, x, y, 46, color);
          api.text(ctx, String(count), x, y + 16, 45, C.bg, 'center');
        } else if (p > 0) {
          const at = row === 1 ? 486 + (y - 486) * p : y;
          api.circle(ctx, x, at, 9 + 25 * p, color);
        } else if (row === 1 && i === 3 && replay === 1) {
          api.text(ctx, '?', x, y + 16, 44, C.ink, 'center');
        }
      });
    });
    if (state.beat === 0 && shift > 0) {
      const x = column(shift);
      api.line(ctx, x, 505, x, 549, C.yellow, 4);
      api.text(ctx, 'first logged batch', x, 605, 35, C.yellow, 'center');
    }
    if (distinct === 1)
      api.text(ctx, '3 runs     ·     2 stream histories', 960, 963, 42, C.ink, 'center');
  });
}

export default {
  id: 'replay-streams',
  draw: drawReplayStreams,
  cues: [
    'stream-original',
    'sp-replay-streams-0',
    'stream-restart',
    'stream-fourth',
    'sp-replay-streams-1',
  ],
};
