import { INPUT, SHUFFLE } from '../fixtures.mjs';
import { drawExtendedBox as box, text } from '../defaults.mjs';
import { after, cue, number } from '../score-trace.mjs';

export function drawWarpCommunication(ctx, scene, state, api) {
  const { C } = api;
  const replay = state.beat > 0;
  const progress = ['warp-neighbor', 'warp-next', 'warp-last'].map((id, i) =>
    cue(state, id, 0, 0.18 + i * 0.25, 0.37 + i * 0.25),
  );
  const round = progress[2] > 0 ? 2 : progress[1] > 0 ? 1 : 0;
  const p = replay ? cue(state, 'warp-replay', 1, 0.15, 0.5) : progress[round];
  const receiver = replay ? 6 : 0;
  const peer = replay ? 7 : 2 ** round;
  const exited = after(state, 'warp-exit', 1, 0.7);
  const undefinedRead = after(state, 'warp-undefined', 2, 0.2);
  const previous = replay ? INPUT : SHUFFLE[round];
  const sourceX = 330 + 182 * peer,
    destX = 330 + 182 * receiver;
  api.focus.target('warp-registers', () => {
    text(ctx, api, 'Register exchange in an eight-lane tile', 960, 294, 40, C.ink);
    previous.forEach((v, i) => {
      const x = 330 + 182 * i;
      const col = i === receiver ? C.cyan : i === peer ? (exited ? C.pink : C.yellow) : C.muted;
      text(ctx, api, 'lane ' + i, x, 406, 32, col);
      box(ctx, api, i === peer && exited ? 'exited' : number(v), x - 74, 435, 148, 90, col, 36);
    });
    if (!exited) {
      api.line(ctx, sourceX, 542, sourceX, 604, C.yellow, 4);
      api.line(ctx, sourceX, 604, destX, 604, C.yellow, 4);
      api.arrow(ctx, destX, 604, destX, 653, C.yellow, 4);
      if (p > 0 && p < 1) api.circle(ctx, sourceX + p * (destX - sourceX), 604, 11, C.yellow);
    }
    const sum = previous[receiver] + previous[peer];
    const result = exited
      ? undefinedRead
        ? 'undefined'
        : '?'
      : number(previous[receiver]) +
        ' + (' +
        number(previous[peer]) +
        ') = ' +
        (p >= 1 ? number(sum) : '?');
    text(ctx, api, 'Lane ' + receiver + ' receives', 960, 754, 35, C.muted);
    text(
      ctx,
      api,
      exited ? result : number(previous[peer]),
      960,
      833,
      69,
      exited ? C.pink : C.yellow,
    );
    text(
      ctx,
      api,
      exited
        ? undefinedRead
          ? 'Lane 7 has no participating source register.'
          : 'What result does lane 6 get?'
        : 'Lane ' + receiver + ' update     ' + result,
      960,
      948,
      38,
      C.ink,
    );
  });
}
export default {
  id: 'warp-communication',
  draw: drawWarpCommunication,
  cues: ['warp-neighbor', 'warp-next', 'warp-last', 'warp-replay', 'warp-exit', 'warp-undefined'],
};
