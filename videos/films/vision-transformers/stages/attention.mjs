import { tokens } from '../fixtures.mjs';
import { cueMotion, visionMixture } from '../construction.mjs';
import { incidentScreen } from '../incident.mjs';
import { dotProduct } from 'vizmatic';

export function drawAttention(ctx, scene, state, api) {
  const { C } = api;
  const masked = cueMotion(state, 2, 'attention-mask', 0.05, 0.28) === 1;
  const showWeights = cueMotion(state, 0, 'attention-softmax', 0.5, 0.7) > 0;
  const colors = [C.red, C.yellow, C.blue];
  const names = ['Banner', 'Panel', 'Retry'];
  const cues = [
    ['attention-banner', 0, 0.12],
    ['attention-panel', 0.3, 0.39],
    ['attention-button', 0.54, 0.64],
  ];
  const progress =
    cues.reduce((sum, [id, start, end]) => sum + cueMotion(state, 1, id, start, end), 0) /
    cues.length;
  const { weights, accumulation } = visionMixture(masked ? 2 : Math.min(state.beat, 1), progress);
  api.focus.target('attention-image', () => {
    api.text(ctx, 'Query at the banner   [1, 0]', 105, 265, 39, C.ink);
    const x = 105,
      y = 315,
      s = 0.98;
    incidentScreen(ctx, api, x, y, s);
    const patchSize = 88 * s;
    [
      [420, 96],
      [312, 211],
      [559, 235],
    ].forEach(([col, row], i) => {
      api.rect(
        ctx,
        x + col * s,
        y + row * s,
        patchSize,
        patchSize,
        'transparent',
        masked && i ? C.muted : colors[i],
        0,
      );
    });
  });
  api.focus.target('attention-weights', () => {
    const cols = [863, 1190, 1450, 1712];
    ['Patch', 'Key = value', 'Score', 'Weight'].forEach((s, j) =>
      api.text(ctx, s, cols[j], 302, 32, C.muted, j ? 'center' : 'left'),
    );
    tokens.forEach((v, i) => {
      const y = 406 + i * 93;
      const col = masked && i ? C.muted : colors[i];
      api.text(ctx, names[i], cols[0], y, 41, col);
      api.text(ctx, '[' + v.join(', ') + ']', cols[1], y, 38, col, 'center', 'mono');
      const score = dotProduct(tokens[0], v) / Math.sqrt(v.length);
      api.text(ctx, masked && i ? '−∞' : score.toFixed(3), cols[2], y, 38, col, 'center', 'mono');
      api.text(
        ctx,
        showWeights ? weights[i].toFixed(3) : '?',
        cols[3],
        y,
        38,
        col,
        'center',
        'mono',
      );
    });
    api.text(
      ctx,
      masked ? 'Only the first raster position is visible.' : 'Score = (query · key) / √2',
      863,
      672,
      33,
      C.muted,
    );
  });
  api.focus.target('contextual-patch-sum', () => {
    const x = 480,
      length = 845;
    [0, 1].forEach((d) => {
      const y = 783 + d * 100;
      api.text(ctx, d === 0 ? 'First coordinate' : 'Second coordinate', 108, y + 42, 35, C.ink);
      api.rect(ctx, x, y, length, 54, C.panel, C.muted, 0);
      accumulation.terms.forEach((term, i) => {
        if (term.applied[d] > 0)
          api.rect(
            ctx,
            x + term.start[d] * length,
            y,
            term.applied[d] * length,
            54,
            colors[i],
            undefined,
            0,
          );
      });
      api.text(
        ctx,
        state.beat === 0 ? '?' : accumulation.sum[d].toFixed(3),
        1450,
        y + 45,
        46,
        C.ink,
        'left',
        'mono',
      );
    });
    if (state.beat === 0)
      api.text(
        ctx,
        'Can Retry contribute to the banner’s second coordinate?',
        960,
        1014,
        37,
        C.ink,
        'center',
      );
  });
}
export default {
  id: 'attention',
  draw: drawAttention,
  cues: [
    'attention-locations',
    'attention-softmax',
    'attention-banner',
    'attention-panel',
    'attention-button',
    'attention-mask',
  ],
};
