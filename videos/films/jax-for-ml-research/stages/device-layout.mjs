import { operationProgress, resultAfter } from '../../../lib/lesson-definition.mjs';
import { drawLeftText, drawText } from '../defaults.mjs';

const x = [1, 2, 3, 4];
const y = [5, 6, 7, 8];
const shards = [0, 2].map((start) => {
  const pairs = [start, start + 1].map((i) => [x[i], y[i]]);
  return {
    start,
    pairs,
    sum: pairs.reduce((sum, [a, b]) => sum + a * b, 0),
  };
});

export function drawDeviceLayout(ctx, scene, state, api) {
  const { C } = api;
  const combine = operationProgress(state, 'shard-combine');
  const ready = [resultAfter(state, 'shard-seventeen'), resultAfter(state, 'shard-fifty-three')];
  const colors = [C.blue, C.cyan];
  drawLeftText(
    ctx,
    api,
    "Mesh axis 'devices'   ·   Global shape [4]   ·   Local shape [2]",
    150,
    219,
    31,
    C.muted,
  );
  shards.forEach(({ start, pairs }, i) => {
    const left = 150 + i * 880;
    const color = colors[i];
    const multiply = operationProgress(state, i === 0 ? 'shard-first-pairs' : 'shard-second-pairs');
    api.focus.target(i === 0 ? 'shard-left' : 'shard-right', () => {
      drawLeftText(ctx, api, 'Device ' + i, left, 295, 53, color);
      drawLeftText(
        ctx,
        api,
        'Indices ' + start + ' and ' + (start + 1),
        left + 320,
        291,
        33,
        C.muted,
      );
      api.line(ctx, left, 329, left + 708, 329, color, 4);
      for (const [row, name] of ['x', 'y'].entries()) {
        const cy = 418 + row * 111;
        drawLeftText(ctx, api, name, left + 42, cy + 14, 44, C.muted);
        pairs.forEach((pair, j) => {
          const cx = left + 262 + j * 269;
          drawText(ctx, api, pair[row], cx, cy + 20, 67, C.ink);
          if (row === 0 && multiply > 0)
            api.line(ctx, cx, cy + 36, cx, cy + 36 + 27 * multiply, color, 4);
        });
      }
      if (multiply > 0) {
        drawText(
          ctx,
          api,
          pairs.map(([a, b]) => a + ' × ' + b).join('   +   '),
          left + 354,
          672,
          52,
          color,
        );
      }
    });
  });
  api.focus.target('shard-total', () => {
    shards.forEach(({ sum }, i) => {
      if (!ready[i]) return;
      const from = 504 + i * 880;
      const to = 680 + i * 280;
      const cx = from + (to - from) * combine;
      const cy = 790 + 55 * combine;
      api.circle(ctx, cx, cy, 63, C.panel, colors[i], 4);
      drawText(ctx, api, sum, cx, cy + 22, 62, colors[i]);
    });
    if (combine === 1) {
      drawText(ctx, api, '+', 820, 872, 66, C.ink);
      drawText(ctx, api, '=', 1098, 872, 66, C.ink);
      const total = resultAfter(state, 'shard-seventy') ? shards[0].sum + shards[1].sum : '?';
      drawText(ctx, api, total, 1240, 872, 71, C.yellow);
    }
    if (resultAfter(state, 'shard-map'))
      api.text(ctx, "lax.psum(partial, 'devices')", 960, 1000, 35, C.yellow, 'center', 'mono');
  });
}
export default {
  id: 'device-layout',
  draw: drawDeviceLayout,
  cues: [
    'shard-layout',
    'shard-first-pairs',
    'shard-seventeen',
    'shard-second-pairs',
    'shard-fifty-three',
    'shard-combine',
    'shard-seventy',
    'shard-map',
  ],
};
