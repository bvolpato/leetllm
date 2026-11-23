import { HYDE_MEAN, HYDE_PROXIES } from '../fixtures.mjs';
import { spoken } from '../construction.mjs';

export function drawHydeVectors(ctx, scene, state, api) {
  const { C, focus } = api;
  const encoded = spoken(state, 0, 'hyde-encode');
  const mean = spoken(state, 1, 'hyde-average');
  const ready = spoken(state, 1, 'qx-mean-result') === 1;
  const label = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  label('Can we increase throughput for launch week?', 135, 268, 51);
  label('Two generated passages', 135, 384, 31, C.muted);
  const xs = [1020, 1330, 1640];
  xs.forEach((x, i) => label('Coordinate ' + (i + 1), x, 384, 30, C.muted, 'center'));
  const excerpts = ['“Request a temporary quota increase.”', '“Schedule offline jobs in batches.”'];
  HYDE_PROXIES.forEach((v, i) => {
    const y = 497 + i * 128;
    label(excerpts[i], 135, y, 37, i ? C.cyan : C.blue);
    focus.target('hyde-operands', () => {
      xs.forEach((x, j) =>
        label(
          encoded > (i ? 0.5 : 0) ? v[j].toFixed(1) : '·',
          x,
          y,
          53,
          i ? C.cyan : C.blue,
          'center',
        ),
      );
    });
  });
  api.line(ctx, 135, 682, 1785, 682, C.muted, 2);
  if (state.beat >= 1) {
    label('Mean of two passages', 135, 768, 36);
    focus.target('hyde-mean', () => {
      xs.forEach((x, j) => {
        if (mean > j / 3) {
          label(
            '(' + HYDE_PROXIES[0][j].toFixed(1) + ' + ' + HYDE_PROXIES[1][j].toFixed(1) + ') / 2',
            x,
            765,
            33,
            C.ink,
            'center',
          );
          label(
            ready ? HYDE_MEAN[j].toFixed(2) : '?',
            x,
            845,
            52,
            ready ? C.green : C.muted,
            'center',
          );
        }
      });
      const vector = '[' + HYDE_MEAN.map((v) => v.toFixed(2)).join(',') + ']';
      label(
        ready ? 'Corpus search vector    ' + vector : 'Current coordinate accumulation',
        960,
        969,
        39,
        ready ? C.green : C.muted,
        'center',
      );
    });
  } else {
    label('Invented encoder outputs', 135, 765, 32, C.muted);
  }
}

export default {
  id: 'hyde-vectors',
  draw: drawHydeVectors,
  cues: ['hyde-encode', 'hyde-average', 'qx-mean-result', 'hyde-compatible'],
};
