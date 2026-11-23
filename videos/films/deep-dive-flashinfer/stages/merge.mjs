import { bracket, clauseEnded } from '../cache-picture.mjs';
import { splitExample } from '../model.mjs';

export function drawMerge(ctx, scene, state, api) {
  const { C } = api;
  const changed = clauseEnded(state, 'merge-change', 2, 0.42);
  const settled = changed
    ? clauseEnded(state, 'merge-equal', 3, 0.25)
    : clauseEnded(state, 'merge-share', 1, 0.48);
  const { mass, totals, result } = splitExample(changed ? Math.log(3) : 0);
  const colors = [C.blue, C.cyan];
  const x = (i) => 310 + i * 211 + (i >= 4 ? 90 : 0);
  const height = 80;
  api.focus.target('merge-weights', () => {
    for (const [group, [from, to]] of [
      [0, 3],
      [4, 5],
    ].entries()) {
      const mid = (x(from) + x(to)) / 2;
      const name = group === 0 ? 'A  /  page 3  /  value [1, 0]' : 'B  /  page 14  /  value [0, 1]';
      api.text(ctx, name, mid, 264, 37, colors[group], 'center');
    }
    api.text(ctx, 'Weight', 110, 464, 33, C.muted);
    mass.forEach((m, i) => {
      const color = colors[Number(i >= 4)];
      api.rect(ctx, x(i) - 60, 584 - height * m, 120, height * m, color, undefined, 4);
      api.text(ctx, m.toFixed(0), x(i), 563 - height * m, 36, color, 'center');
      api.text(ctx, `k${i}`, x(i), 636, 34, C.ink, 'center');
    });
    bracket(ctx, api, x(0) - 68, x(3) + 68, 672, C.blue);
    bracket(ctx, api, x(4) - 68, x(5) + 68, 672, C.cyan);
    api.text(
      ctx,
      changed
        ? 'Score of k5 = ln(3)    ·    other scores = 0'
        : 'All six scores = 0    ·    weight = exp(score)',
      960,
      749,
      36,
      C.ink,
      'center',
    );
    if (settled) {
      const left = 305,
        width = 1300,
        split = width * result.weights[0];
      api.rect(ctx, left, 804, split, 56, C.blue, undefined, 0);
      api.rect(ctx, left + split, 804, width - split, 56, C.cyan, undefined, 0);
      const total = totals[0] + totals[1];
      api.text(
        ctx,
        `A   ${Math.round(totals[0])}/${Math.round(total)}`,
        left + split / 2,
        846,
        34,
        C.bg,
        'center',
      );
      api.text(
        ctx,
        `B   ${Math.round(totals[1])}/${Math.round(total)}`,
        left + split + (width - split) / 2,
        846,
        34,
        C.bg,
        'center',
      );
      api.text(
        ctx,
        `Output  [${result.output.map((v) => v.toFixed(3)).join(', ')}]`,
        960,
        960,
        47,
        C.ink,
        'center',
      );
    } else {
      api.text(
        ctx,
        changed ? 'Where does the weight divide now?' : 'Which worker gets more weight?',
        960,
        903,
        47,
        C.yellow,
        'center',
      );
    }
  });
}
export default {
  id: 'merge',
  draw: drawMerge,
  cues: ['merge-split', 'merge-share', 'merge-change', 'merge-equal'],
};
