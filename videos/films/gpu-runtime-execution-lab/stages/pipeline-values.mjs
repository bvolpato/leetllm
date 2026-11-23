import { pipeline, schedule, sum } from '../arithmetic.mjs';
import { cueClock } from '../clock.mjs';
import { runtimeText } from '../defaults.mjs';

export function drawPipelineValues(ctx, scene, state, api) {
  const { C } = api;
  const p = cueClock(scene, state);
  const txt = (...args) => runtimeText(ctx, api, ...args);
  if (state.beat === 0) {
    const data = pipeline([1, 2, 3, 4]);
    const others = Math.floor(p('value-rest') * 3);
    const count = Math.floor(p('value-total') * 4);
    const revealedNeighbors = [0, 2, 3].slice(0, others);
    api.focus.target('value-columns', () => {
      ['Input x', 'Double, add 1', 'Square'].forEach((label, row) =>
        txt(label, 150, 335 + row * 185, 35, C.muted),
      );
      for (let i = 0; i < 4; i++) {
        const x = 560 + 335 * i;
        const chosen = i === 1;
        const numbers = [
          data.input[i],
          (chosen ? p('value-five') === 1 : revealedNeighbors.includes(i)) ? data.affine[i] : null,
          (chosen ? p('value-square') === 1 : revealedNeighbors.includes(i))
            ? data.squares[i]
            : null,
        ];
        numbers.forEach((n, row) => {
          const y = 265 + row * 185;
          const color = chosen && others < 3 ? C.yellow : row === 2 && i < count ? C.green : C.blue;
          api.rect(ctx, x, y, 200, 105, C.panel, n == null ? C.muted : color, 12);
          if (n != null)
            txt(n, x + 100, y + 73, 58, row === 2 && i < count ? C.green : C.ink, 'center');
          if (row < 2 && numbers[row + 1] != null)
            api.arrow(ctx, x + 100, y + 116, x + 100, y + 170, color, 3);
        });
      }
    });
    api.focus.target('value-total', () => {
      const terms = data.squares.slice(0, count);
      txt(
        terms.length
          ? terms.join('  +  ') + '   =   ' + sum(terms)
          : 'Sum of the four contributions',
        960,
        929,
        48,
        count === 4 ? C.green : C.muted,
        'center',
      );
    });
    return;
  }
  const affine = schedule(true).affine;
  api.focus.target('start-gates', () => {
    const left = 750,
      unit = 170;
    for (const [i, [label, tick]] of [
      ['Transform issued', 1],
      ['Compute stream free', 0],
      ['Copy complete', 3],
    ].entries()) {
      const y = 329 + i * 140;
      txt(label, 155, y + 13, 38, C.ink);
      api.line(ctx, left, y, left + 4 * unit, y, C.muted, 3);
      api.circle(ctx, left + tick * unit, y, 15, i === 2 ? C.cyan : C.blue);
      txt('tick ' + tick, 1540, y + 15, 39, i === 2 ? C.cyan : C.blue);
    }
    txt(
      p('value-start') >= 1
        ? 'Latest ready time   =   tick ' + affine.start
        : 'Earliest transform start   ·   tick ?',
      960,
      813,
      45,
      C.yellow,
      'center',
    );
  });
  api.focus.target('start-result', () => {
    txt(
      p('value-end') >= 1
        ? 'Start 3   +   duration 4   =   finish ' + affine.end
        : 'Transform duration   ·   4 ticks',
      960,
      940,
      40,
      p('value-end') >= 1 ? C.green : C.muted,
      'center',
    );
  });
}
export default {
  id: 'pipeline-values',
  draw: drawPipelineValues,
  cues: [
    'value-two',
    'value-five',
    'value-square',
    'value-rest',
    'value-total',
    'value-gates',
    'value-gate-question',
    'value-start',
    'value-end',
  ],
};
