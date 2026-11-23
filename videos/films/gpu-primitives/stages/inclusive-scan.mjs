import { SCAN } from '../fixtures.mjs';
import { text } from '../defaults.mjs';
import { after, cue, number } from '../score-trace.mjs';

const center = (lane) => 515 + 338 * lane;
const top = (round) => 309 + 188 * round;

export function drawInclusiveScan(ctx, scene, state, api) {
  const { C } = api;
  const first = cue(state, 'scan-first-stride', 1, 0.13, 0.43);
  const second = cue(state, 'scan-second-stride', 2, 0.18, 0.37);
  const peer = after(state, 'scan-peer', 2, 0.14);
  const last = after(state, 'scan-last-answer', 2, 0.53);
  const third = after(state, 'scan-third-answer', 2, 0.64);
  const selected = state.beat > 0 && first === 1;
  api.focus.target('scan-registers', () => {
    for (let lane = 0; lane < 4; lane++)
      text(ctx, api, 'lane ' + lane, center(lane), 268, 35, C.ink);
    for (let round = 0; round < 3; round++) {
      const y = top(round);
      const started = round === 0 || (round === 1 ? first > 0 : second > 0);
      if (!started) continue;
      text(ctx, api, ['Input', 'Stride 1', 'Stride 2'][round], 146, y + 60, 36, C.muted, 'left');
      for (let lane = 0; lane < 4; lane++) {
        const finalReady = lane < 2 || (lane === 2 ? third : last);
        const ready = round === 0 || (round === 1 ? lane === 0 || first === 1 : finalReady);
        const width = 2 ** round;
        const color =
          (round === 1 && selected && ((peer && lane === 1) || lane === 3)) ||
          (round === 2 && lane === 3)
            ? C.yellow
            : round === 2
              ? C.green
              : C.blue;
        const x = center(lane);
        api.rect(ctx, x - 114, y, 228, 96, C.panel, color, 10);
        text(ctx, api, ready ? number(SCAN.levels[round][lane]) : '?', x, y + 53, 45, color);
        for (let j = 0; j < 4; j++) {
          const included = ready && j <= lane && j > lane - width;
          api.rect(
            ctx,
            x - 84 + j * 43,
            y + 70,
            38,
            10,
            included ? color : '#40444e',
            undefined,
            2,
          );
        }
      }
    }
    const arrow = (r, source, dest, p) => {
      const x1 = center(source),
        x2 = center(dest),
        y1 = top(r) + 104,
        y2 = top(r + 1) - 9;
      if (p > 0) api.arrow(ctx, x1, y1, x1 + (x2 - x1) * p, y1 + (y2 - y1) * p, C.yellow, 4);
    };
    if (first > 0) arrow(0, 2, 3, first);
    if (second > 0) {
      arrow(1, 1, 3, second);
      arrow(1, 3, 3, second);
    }
    let note = 'Each lit mark stands for one of the four plays.';
    if (state.beat === 1)
      note = selected
        ? 'Lane 3 has the last two plays.   Who has the first two?'
        : 'Each lane reads the previous row.';
    if (state.beat === 2)
      note = !peer
        ? 'Who has the first two plays?'
        : 'Lane 3 combines the two disjoint pairs     2 + 5 = ' + (last ? '7' : '?');
    text(ctx, api, note, 960, 922, 42, C.ink);
    if (third)
      text(ctx, api, '3 additions + 2 additions   ·   2 parallel rounds', 960, 996, 30, C.muted);
  });
}
export default {
  id: 'inclusive-scan',
  draw: drawInclusiveScan,
  cues: [
    'scan-input',
    'scan-first-stride',
    'scan-ask',
    'scan-peer',
    'scan-second-stride',
    'scan-last-answer',
    'scan-third-answer',
  ],
};
