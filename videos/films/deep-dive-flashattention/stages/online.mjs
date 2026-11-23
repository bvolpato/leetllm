import { afterCue, cueMotion, sampleModel } from '../construction.mjs';
import { scores, values } from '../fixtures.mjs';

export function drawOnline(ctx, scene, state, api) {
  const { C, focus } = api;
  const s = sampleModel('online', state);
  const label = (v, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, v, x, y, size, color, align);
  const hasB = cueMotion(state, 1, 'online-arrival') > 0;
  const factored = afterCue(state, 2, 'online-factor');
  focus.target('online-keys', () => {
    const x = (k) => 470 + k * 304;
    label('Key', 145, 265, 30, C.muted);
    label('Score', 145, 335, 35);
    label('Value', 145, 406, 35);
    for (let k = 0; k < scores.length; k++) {
      const visible = k < 2 || hasB;
      const col = k < 2 ? C.blue : C.cyan;
      label(k, x(k), 265, 31, visible ? col : C.muted, 'center');
      label(visible ? scores[k] : '·', x(k), 341, 50, visible ? col : C.muted, 'center');
      label(
        visible ? '[' + values[k].join(', ') + ']' : '·',
        x(k),
        406,
        36,
        visible ? C.ink : C.muted,
        'center',
      );
    }
    api.line(ctx, 920, 246, 920, 420, C.muted, 2);
    const weight = factored
      ? `Weight at score 2:  exp(2 - 3) ≈ ${Math.exp(-1).toFixed(3)}`
      : hasB
        ? 'Weight at score 2 with maximum 3  =  ?'
        : 'Weight at score 2:  exp(2 - 2) = 1';
    label(weight, 960, 505, 41, C.yellow, 'center');
  });
  const names = ['Weight sum', 'Value sum · x', 'Value sum · y'];
  const original = [s.a.l, ...s.a.u];
  const retained = [s.oldL, ...s.oldU];
  if (s.b === 0) {
    const secondKey = cueMotion(state, 0, 'online-first');
    const firstKey = cueMotion(state, 0, 'online-other') * Math.exp(scores[0] - s.a.m);
    retained[0] = firstKey + secondKey;
    retained[1] = firstKey * values[0][0] + secondKey * values[1][0];
    retained[2] = firstKey * values[0][1] + secondKey * values[1][1];
  }
  const incoming = [s.tileB.l, ...s.tileB.u];
  const multipliers = [455, 96, 96];
  focus.target('online-bars', () => {
    names.forEach((name, i) => {
      const y = 561 + i * 108;
      const px = multipliers[i];
      const oldWidth = retained[i] * px;
      const added = incoming[i] * s.mergeProgress;
      label(name, 145, y + 39, 34);
      if (s.b > 0) api.rect(ctx, 454, y, original[i] * px, 48, 'transparent', C.muted, 1);
      if (oldWidth > 0) api.rect(ctx, 454, y, oldWidth, 48, C.blue, undefined, 0);
      if (added > 0) api.rect(ctx, 454 + oldWidth, y, added * px, 48, C.cyan, undefined, 0);
      label((retained[i] + added).toFixed(4), 1710, y + 43, 44, C.ink, 'right');
    });
  });
  focus.target('online-output', () => {
    if (s.b === 3) {
      const pair = s.z.output.map((v) => v.toFixed(3)).join(', ');
      label(
        afterCue(state, 3, 'online-result')
          ? 'Tiled output   [' + pair + ']'
          : 'Tiled output   [ ? , ? ]',
        145,
        959,
        42,
        C.green,
      );
      if (afterCue(state, 3, 'online-check')) {
        const weights = scores.map((v) => Math.exp(v - Math.max(...scores)));
        const mass = weights.reduce((a, b) => a + b);
        const dense = s.z.u.map(
          (_, d) => weights.reduce((total, w, k) => total + w * values[k][d], 0) / mass,
        );
        label(
          'Dense output   [' + dense.map((v) => v.toFixed(3)).join(', ') + ']',
          1030,
          959,
          42,
          C.ink,
        );
      }
    } else {
      label(
        s.b === 1
          ? 'The second tile raises the maximum from 2 to 3.'
          : s.b === 2
            ? 'Outline = first tile on its old scale'
            : 'Blue = contributions from keys 0 and 1',
        145,
        959,
        34,
        C.muted,
      );
    }
  });
}

export default {
  id: 'online',
  draw: drawOnline,
  cues: [
    'online-first',
    'online-other',
    'online-totals',
    'online-arrival',
    'online-factor',
    'online-rescale-old',
    'online-merge-summary',
    'online-result',
    'online-check',
  ],
};
