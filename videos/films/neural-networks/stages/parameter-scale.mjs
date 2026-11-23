import { denseParameterCount } from '../arithmetic.mjs';
import { neuralFrame } from '../construction.mjs';
import { dot, equation, focusTarget, line, outline, text } from '../defaults.mjs';

export function drawParameterScale(ctx, scene, state, api) {
  const { C } = api;
  const f = neuralFrame(state);
  focusTarget(ctx, api, 'parameter-scale-mechanism', () => {
    if (f.beat === 0) {
      const columns = [[475, 760], [475, 760], [616]];
      const xs = [360, 960, 1560];
      const count = denseParameterCount(columns.map((rows) => rows.length));
      for (let layer = 1; layer < columns.length; layer++) {
        for (const y of columns[layer]) {
          for (const prev of columns[layer - 1])
            line(ctx, api, xs[layer - 1], prev, xs[layer], y, C.cyan, 5);
          line(ctx, api, xs[layer], y - 95, xs[layer], y, C.pink, 4);
          dot(ctx, api, xs[layer], y - 95, C.pink, 11);
        }
      }
      columns.forEach((ys, i) =>
        ys.forEach((y) => api.circle(ctx, xs[i], y, 31, C.panel, C.ink, 4)),
      );
      text(ctx, api, 'connection weight', 640, 315, 36, C.cyan, 'center');
      text(ctx, api, 'bias per output unit', 1300, 315, 36, C.pink, 'center');
      if (f.completed('parameter-scale-beat-0', 0))
        text(ctx, api, '6 weights + 3 biases = ' + count, 960, 962, 46, C.ink, 'center');
      return;
    }
    if (f.beat === 1) {
      const widths = [784, 256, 128, 10];
      const counts = widths.slice(1).map((n, i) => denseParameterCount([widths[i], n]));
      const cues = ['nn-dense-first', 'nn-dense-second', 'nn-dense-third'];
      const colors = [C.cyan, C.blue, C.yellow];
      text(ctx, api, '28 × 28 pixels', 280, 285, 36, C.ink);
      text(ctx, api, 'Connections + biases', 940, 285, 36, C.muted, 'center');
      for (const [i, n] of counts.entries()) {
        const y = 446 + i * 167;
        const width = ((945 * n) / 210000) * f.progress(cues[i], 1);
        text(ctx, api, widths[i] + ' × ' + widths[i + 1] + ' + ' + widths[i + 1], 290, y, 35);
        line(ctx, api, 670, y - 12, 1615, y - 12, C.muted, 2);
        if (width > 0) api.rect(ctx, 670, y - 32, width, 40, colors[i], null, 0);
        if (f.completed(cues[i], 1)) text(ctx, api, String(n), 1770, y, 37, colors[i], 'right');
      }
      if (f.completed('dense-count-values', 1)) {
        equation(
          ctx,
          api,
          counts.join('+') + '=' + denseParameterCount(widths),
          960,
          960,
          49,
          C.ink,
        );
      }
      return;
    }

    text(ctx, api, 'One dense unit', 540, 307, 43, C.cyan, 'center');
    text(ctx, api, 'One shared filter', 1390, 307, 43, C.yellow, 'center');
    const left = 1176;
    for (let i = 0; i < 36; i++) {
      const dx = (i % 6) * 58;
      const y = 424 + Math.floor(i / 6) * 58;
      api.rect(ctx, 235 + dx, y, 34, 34, C.panel, C.muted, 1);
      line(ctx, api, 270 + dx, y + 17, 822, 584, C.muted, 1);
      api.rect(ctx, left + dx, y, 34, 34, C.panel, C.muted, 1);
    }
    api.circle(ctx, 870, 584, 45, C.panel, C.cyan, 3);
    const shift = 3 * 58 * f.progress('parameter-scale-beat-2', 2);
    outline(ctx, api, left - 10 + shift, 414, 170, 170, C.yellow, 5);
    text(ctx, api, 'A separate connection per pixel', 540, 895, 35, C.ink, 'center');
    text(ctx, api, 'Same weights at each position', 1390, 895, 35, C.ink, 'center');
  });
}

export default {
  id: 'parameter-scale',
  draw: drawParameterScale,
  cues: [
    'parameter-scale-beat-0',
    'parameter-scale-beat-1',
    'dense-count-values',
    'nn-dense-first',
    'nn-dense-second',
    'nn-dense-third',
    'parameter-scale-beat-2',
  ],
};
