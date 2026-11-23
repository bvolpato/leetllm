import { forward } from '../arithmetic.mjs';
import { neuralFrame } from '../construction.mjs';
import { boardPoint, bulb, lampBoard, slideSwitch } from '../lamp-board.mjs';
import { alpha, focusTarget, line, text } from '../defaults.mjs';

const sequence = [
  [1, 0],
  [0, 0],
  [0, 1],
  [1, 1],
];
const switches = ['first-switch', 'other-switch', 'both-switches'];

export function drawPuzzle(ctx, scene, state, api) {
  const { C } = api;
  const f = neuralFrame(state);
  const moves = switches.map((id, i) => f.progress(id, i === 2 ? 1 : 0));
  const visited = moves.filter((p) => p === 1).length;
  const pair = sequence[visited];
  const next = sequence[visited + 1] ?? pair;
  const travel = moves[visited] ?? 0;
  const proving = f.beat === 3;
  const cut = proving ? 0 : f.progress('boundary-attempt', 1);

  focusTarget(ctx, api, 'lamp-cases', () => {
    lampBoard(ctx, api, sequence.slice(0, visited + 1), () => {
      if (cut > 0) {
        const shape = [
          [0, 0.5],
          [0, 1],
          [1, 1],
          [1, 0],
          [0.5, 0],
        ].map(boardPoint);
        alpha(ctx, api, cut, () => {
          api.path(ctx, shape, { closed: true, fill: '#483c22', width: 0 });
          const a = shape[0];
          const b = shape.at(-1);
          line(ctx, api, a.x, a.y, b.x, b.y, C.yellow, 6);
        });
      }
      if (!proving) return;
      for (const [from, to, color, cue] of [
        [[0, 1], [1, 0], C.yellow, 'join-lit'],
        [[0, 0], [1, 1], C.blue, 'join-dark'],
      ]) {
        const p = f.progress(cue, 3);
        if (p > 0) {
          const a = boardPoint(from);
          const b = boardPoint(to);
          line(ctx, api, a.x, a.y, a.x + (b.x - a.x) * p, a.y + (b.y - a.y) * p, color, 7);
        }
      }
      if (f.completed('join-dark', 3)) {
        const m = boardPoint([0.5, 0.5]);
        api.circle(ctx, m.x, m.y, 21, C.panel, C.ink, 4);
      }
    });
    if (!proving) {
      const p = boardPoint(pair);
      api.circle(ctx, p.x, p.y, 44, null, C.cyan, 3);
    }
  });

  focusTarget(ctx, api, 'lamp-bench', () => {
    if (proving) {
      text(ctx, api, 'Join the two lit settings', 1100, 430, 42, C.yellow);
      if (f.shown('join-dark', 3))
        text(ctx, api, 'Join the two dark settings', 1100, 560, 42, C.blue);
      if (f.completed('midpoint', 3))
        text(ctx, api, 'One midpoint, on both segments', 1100, 770, 38);
      return;
    }
    bulb(ctx, api, 1420, 410, forward(pair).y);
    for (const [i, name] of ['A', 'B'].entries()) {
      const position = pair[i] + (next[i] - pair[i]) * travel;
      slideSwitch(ctx, api, name, pair[i], position, 1245 + 350 * i, 715);
    }
    if (cut > 0) {
      text(ctx, api, 'Shaded side predicts light', 1420, 874, 35, C.yellow, 'center');
      const knows = f.completed('cut-verdict', 2);
      text(
        ctx,
        api,
        knows ? 'Cut predicts ON' : 'Cut predicts ?',
        1420,
        957,
        42,
        knows ? C.yellow : C.ink,
        'center',
      );
    }
  });
}

export default {
  id: 'puzzle',
  draw: drawPuzzle,
  cues: [...switches, 'boundary-attempt', 'cut-verdict', 'join-lit', 'join-dark', 'midpoint'],
};
