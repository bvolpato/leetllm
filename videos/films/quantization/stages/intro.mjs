import { introLayer } from '../arithmetic.mjs';
import { spokenProgress, spokenResult } from '../construction.mjs';

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const layer = introLayer(1.5);
  const snap = spokenProgress(state, 'compact-code', 1, 0, 0.12);
  const bits = spokenResult(state, 'stored-bits', 1, 0.4, 0.65);
  const low = layer.code / 10;
  const high = (layer.code + 1) / 10;
  const x = (weight) => 405 + (1170 * (weight - low)) / (high - low);
  const baseline = 483;

  api.line(ctx, 160, baseline, 1770, baseline, C.muted, 5);
  for (const mark of [low, high]) {
    api.line(ctx, x(mark), baseline - 32, x(mark), baseline + 35, C.ink, 6);
    api.text(ctx, mark.toFixed(2), x(mark), baseline + 125, 74, C.ink, 'center', 'mono');
  }
  api.focus.target('weight-marker', () => {
    const origin = x(layer.sourceWeight);
    api.text(ctx, layer.sourceWeight.toFixed(2), origin, 360, 138, C.blue, 'center', 'mono');
    api.line(ctx, origin, 385, origin, baseline - 18, C.blue, 5);
    api.circle(ctx, origin, baseline, 18, C.blue);
    if (snap > 0) {
      const cursor = api.lerp(origin, x(layer.weight), snap);
      api.line(ctx, cursor, baseline, origin, baseline, C.cyan, 9);
      api.circle(ctx, cursor, baseline, 21, C.cyan);
      api.circle(ctx, origin, baseline, 12, C.blue);
    }
  });

  if (beat < 2) {
    api.focus.target('stored-code', () => {
      if (!bits) {
        api.text(ctx, 'Grid spacing   0.1', 960, 825, 54, C.muted, 'center');
        return;
      }
      const word = layer.code.toString(2).padStart(4, '0');
      api.text(ctx, 'Stored code', 500, 832, 48, C.ink, 'right');
      [...word].forEach((digit, index) => {
        const left = 560 + index * 100;
        api.rect(ctx, left, 754, 86, 112, digit === '1' ? C.cyan : C.panel, C.cyan, 9);
        api.text(ctx, digit, left + 43, 836, 64, digit === '1' ? C.bg : C.ink, 'center', 'mono');
      });
      api.text(
        ctx,
        layer.code + ' × 0.1 = ' + low.toFixed(2),
        1045,
        832,
        61,
        C.cyan,
        'left',
        'mono',
      );
    });
    return;
  }

  const multiply = spokenProgress(state, 'changed-computation', 2, 0.32, 0.7);
  const earned = spokenResult(state, 'changed-computation', 2, 0.32, 0.7);
  api.focus.target('product-step', () => {
    const outputX = (value) => 575 + ((value - 1.04) / 0.065) * 1100;
    const original = outputX(layer.source);
    const current = api.lerp(original, outputX(layer.reconstructed), multiply);
    api.text(ctx, 'Layer output', 150, 727, 48, C.ink);
    api.text(ctx, 'Input  × ' + layer.input, 150, 794, 38, C.muted);
    api.line(ctx, 575, 766, 1675, 766, C.muted, 3);
    api.text(
      ctx,
      layer.sourceWeight + ' × ' + layer.input,
      original,
      711,
      38,
      C.blue,
      'center',
      'mono',
    );
    api.line(ctx, current, 766, original, 766, C.cyan, 6);
    api.circle(ctx, original, 766, 14, C.blue);
    if (multiply > 0) api.circle(ctx, current, 766, 16, C.cyan);
    if (earned) {
      api.math(
        ctx,
        layer.source.toFixed(3) + '\\longrightarrow' + layer.reconstructed.toFixed(3),
        1090,
        934,
        72,
        C.cyan,
        'center',
      );
    } else {
      api.text(
        ctx,
        low.toFixed(2) + ' × ' + layer.input + ' = ?',
        1090,
        934,
        51,
        C.ink,
        'center',
        'mono',
      );
    }
  });
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['original-weight', 'compact-code', 'stored-bits', 'changed-computation'],
};
