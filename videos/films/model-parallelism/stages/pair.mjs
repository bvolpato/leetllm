import { B } from '../fixtures.mjs';
import { shards } from '../model.mjs';
import { sceneClock } from '../scene-clock.mjs';
import { smoothstep } from 'vizmatic';

const result = shards();
const slices = [result.left, result.right];
const partials = [result.first, result.second];
const centers = [920, 1460];
const rowY = [375, 625];

function dotTerms(rank, column) {
  return slices[rank]
    .map((value, i) => {
      const weight = B[rank * 2 + i][column];
      return `${value} × ${weight < 0 ? '(−' + Math.abs(weight) + ')' : weight}`;
    })
    .join(' + ');
}

export function drawPair(ctx, scene, state, api) {
  const clock = sceneClock(scene, state);
  const copying = state.beat >= 2;
  const copy = smoothstep(clock.progress('both-receive'));
  const sum = clock.progress('sum-contraction') > 0;
  const card = (label, cx, y, width, color, size = 42) =>
    api.components.card({
      label,
      x: cx - width / 2,
      y,
      width,
      height: 90,
      padding: 10,
      fontSize: size,
      fill: api.C.panel,
      stroke: color,
      textColor: color,
    });
  api.focus.target('projection', () => {
    centers.forEach((cx, j) => api.text(ctx, `Output ${j + 1}`, cx, 270, 46, api.C.ink, 'center'));
    slices.forEach((slice, rank) => {
      const color = rank ? api.C.cyan : api.C.blue,
        y = rowY[rank];
      api.text(ctx, `GPU ${rank}`, 165, y + 14, 43, color);
      api.text(
        ctx,
        copying ? 'Next layer’s input' : 'Local hidden features',
        165,
        y + 73,
        32,
        api.C.muted,
      );
      if (!copying) {
        api.text(ctx, '[' + slice.join(', ') + ']', 165, y + 132, 50, color);
        centers.forEach((cx, j) => {
          const operands = clock.progress('matching-rows') > (rank * 2 + j) / 4;
          const tracing =
            rank === 1 &&
            j === 1 &&
            clock.done('matching-rows') &&
            !clock.done('contracted-contributions');
          card(operands ? dotTerms(rank, j) : '·', cx, y, 488, tracing ? api.C.yellow : color, 40);
          const one = rank === 1 && j === 1 && clock.done('signed-one');
          const complete =
            j === 0 ? clock.done('other-column') : clock.done('contracted-contributions');
          if (one || complete) {
            api.text(ctx, String(partials[rank][j]), cx, y + 164, 63, color, 'center');
          }
        });
      }
    });
    if (copying) {
      centers.forEach((cx, j) => {
        const middle = (rowY[0] + rowY[1]) / 2;
        const upper = Math.min(1, copy * 2);
        card(
          String(result.total[j]),
          cx,
          middle + (rowY[0] - middle) * upper,
          180,
          api.C.yellow,
          52,
        );
        if (copy >= 0.5) {
          const lower = copy * 2 - 1;
          card(
            String(result.total[j]),
            cx,
            middle + (rowY[1] - middle) * lower,
            180,
            api.C.yellow,
            52,
          );
        }
      });
    }
    if (sum || copying) {
      api.math(
        ctx,
        `[${result.first}]+[${result.second}]=[${result.total}]`,
        960,
        948,
        54,
        api.C.yellow,
        'center',
      );
    } else if (clock.done('matching-rows') && !clock.done('contracted-contributions')) {
      const forward = result.right[0] * B[2][1],
        backward = result.right[1] * B[3][1];
      const accumulated =
        forward * clock.progress('positive-term') + backward * clock.progress('signed-one');
      const x = 780,
        y = 916,
        unit = 156;
      api.text(ctx, 'GPU 1  ·  output 2', 165, 900, 42, api.C.yellow);
      api.text(
        ctx,
        clock.done('signed-one') ? 'Contribution to output 2' : 'Where will the sum land?',
        165,
        960,
        37,
        api.C.ink,
      );
      api.line(ctx, x, y, x + forward * unit, y, api.C.muted, 3);
      for (let tick = 0; tick <= forward; tick++) {
        api.line(ctx, x + tick * unit, y + 4, x + tick * unit, y + 15, api.C.muted, 3);
        api.text(ctx, String(tick), x + tick * unit, y + 62, 34, api.C.ink, 'center');
      }
      api.circle(ctx, x + accumulated * unit, y - 21, 14, api.C.yellow);
    } else {
      const prompt = clock.done('contracted-contributions')
        ? 'Add down each output column'
        : 'Each row uses the hidden features on that GPU';
      api.text(ctx, prompt, 960, 948, 45, api.C.ink, 'center');
    }
  });
}
export default {
  id: 'pair',
  draw: drawPair,
  cues: [
    'complete-features',
    'matching-rows',
    'positive-term',
    'signed-one',
    'contracted-contributions',
    'other-column',
    'sum-contraction',
    'both-receive',
  ],
};
