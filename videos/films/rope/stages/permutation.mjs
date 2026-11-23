import { contentOutputs, contentWeights } from '../model.mjs';
export function drawPermutation(ctx, scene, state, api) {
  return api.focus.target('permutation-construction', () =>
    paintPermutation(ctx, scene, state, api),
  );
}
function paintPermutation(ctx, scene, state, api) {
  const { C: themeColors, text, math, rect, clamp, ease, lerp, phase } = api;
  const { beat, beatP } = state;
  const progress = ease(clamp(beatP));
  const drawText = (value, x, y, size = 36, color = themeColors.ink, align = 'left', font) =>
    text(ctx, value, x, y, size, color, align, font);
  const drawEquation = (value, x, y, size = 42, color = themeColors.ink, align = 'left') =>
    math(ctx, value, x, y, size, color, align);
  const showLayer = (amount, paint) => api.components.fade(clamp(amount), paint);
  const stage = (index, start = 0.08, end = 0.8) =>
    beat > index ? 1 : beat < index ? 0 : phase(beatP, start, end);
  const drawTile = (value, x, y, width, height, color = themeColors.cyan, size = 36) => {
    return api.components.card({
      label: value,
      x: x - width / 2,
      y: y - height / 2,
      width,
      height,
      fill: themeColors.panel,
      stroke: color,
      radius: 18,
      padding: 14,
      id: `tile-${value}`,
      fontSize: size,
      textColor: color,
      baselineOffset: size * 0.34,
    });
  };
  {
    const shuffle = stage(1, 0.07, 0.84),
      xs = [300, 960, 1620],
      targets = [2, 1, 0];
    const colors = [themeColors.cyan, themeColors.muted, themeColors.yellow];
    const names = ['dogs', 'chase', 'cats'];
    drawText(
      'Unmasked attention, fixed content vectors',
      960,
      245,
      32,
      themeColors.muted,
      'center',
    );
    names.forEach((name, i) => {
      const x = lerp(xs[i], xs[targets[i]], shuffle);
      const offset = (i === 0 ? -1 : i === 2 ? 1 : 0) * 120 * Math.sin(shuffle * Math.PI);
      api.focus.target('permuted-token-' + i, () =>
        drawTile(name, x, 425 + offset, 290, 78, colors[i], 36),
      );
      const output = contentOutputs[i].map((number) => number.toFixed(3)).join(', ');
      api.focus.target('permuted-output-' + i, () =>
        drawTile(`[${output}]`, x, 760 + offset, 330, 82, colors[i], 31),
      );
    });
    const order = shuffle < 0.5 ? [0, 1, 2] : [2, 1, 0];
    const matrixOpacity = beat === 1 ? 1 - phase(beatP, 0.01, 0.16) + phase(beatP, 0.88, 0.98) : 1;
    showLayer(matrixOpacity, () => {
      for (let row = 0; row < 3; row++)
        for (let column = 0; column < 3; column++) {
          const weight = contentWeights[order[row]][order[column]];
          const x = 855 + column * 72,
            y = 480 + row * 72;
          api.focus.target('content-weight-' + row + '-' + column, () =>
            rect(ctx, x, y, 62, 62, `rgba(99,222,236,${0.18 + weight * 0.9})`, undefined, 8),
          );
        }
    });
    drawEquation(
      String.raw`\operatorname{Attention}(PX)=P\operatorname{Attention}(X)`,
      960,
      975,
      38,
      themeColors.ink,
      'center',
    );
  }
}
export default {
  id: 'permutation',
  draw: drawPermutation,
  cues: [
    'permutation-permuted-output-0-b1-1',
    'rp-permutation-0-0',
    'rp-permutation-0-1',
    'rp-permutation-0-2',
    'permutation-permuted-token-0-b2-1',
    'rp-permutation-1-0',
    'rp-permutation-1-1',
    'rp-permutation-1-2',
    'rp-permutation-1-3',
    'permutation-content-weight-0-2-b3-1',
    'rp-permutation-2-0',
    'rp-permutation-2-1',
    'rp-permutation-2-2',
  ],
};
