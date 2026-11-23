import { mix } from '../arithmetic.mjs';
import { sampleModel } from '../construction.mjs';
import { sceneClock } from '../worksheet.mjs';

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const { progress, after } = sceneClock(state);
  const model = sampleModel('intro', state, scene);
  const { values, weights, epsilon, mean, scale, stage } = model;
  const { normalizedProgress: scaleP, weightProgress: weightP } = model;
  const normalized = values.map(x => x * scale);
  const scaling = values.map(x => x * mix(1, scale, scaleP));
  const weighting = normalized.map((x, i) => x * mix(1, weights[i], weightP));
  const across = progress('kg-intro-across', 0, 0.87, 0.93);
  const up = progress('kg-intro-input', 0, 0.93, 0.99);
  const point = ([x, y]) => [233 + x * 148, 883 - y * 148];
  const origin = point([0, 0]);
  const label = (s, x, y, size, color, align = 'left') => api.text(ctx, s, x, y, size, color, align);
  if (state.beat === 0 && progress('kg-intro-row', 0, 0.67, 0.77) === 0) {
    api.focus.target('intro-work', () => {
      const originalWidth = 4096;
      const newWidth = 1009;
      const trim = progress('kg-intro-shorten', 0, 0.34, 0.55);
      const width = mix(originalWidth, newWidth, trim);
      const failed = after('kg-intro-check', 0, 0.55, 0.66);
      label('Reported H100 speedup', 140, 346, 45, C.ink);
      label('1.4×', 122, 602, 220, C.yellow);
      label('at width 4,096', 144, 705, 44, C.muted);
      label('Two input rows', 850, 346, 52, C.ink);
      const tileWidth = 30;
      for (let row = 0; row < 2; row++) {
        for (let tile = 0; tile < originalWidth / 128; tile++) {
          const x = 850 + tile * tileWidth;
          const y = 430 + row * 112;
          api.rect(ctx, x, y, tileWidth - 3, 80, C.panel, undefined, 2);
          const fill = Math.max(0, Math.min(1, width / 128 - tile));
          if (fill > 0) api.rect(ctx, x, y, (tileWidth - 3) * fill, 80, C.blue, undefined, 2);
        }
      }
      const widthText = trim === 0 ? '4,096' : trim < 1 ? '4,096 → 1,009' : '1,009';
      label(widthText + ' features per row', 850, 714, 48, C.blue);
      if (failed) label('Output differs from reference', 850, 856, 48, C.pink);
    });
    return;
  }
  api.focus.target('intro-plot', () => {
    for (let i = 0; i <= 4; i++) {
      const [x, y] = point([i, i]);
      api.line(ctx, x, origin[1], x, 255, C.panel, 2);
      api.line(ctx, origin[0], y, 900, y, C.panel, 2);
      label(String(i), x, 928, 29, C.muted, 'center');
      if (i) label(String(i), 199, y + 10, 29, C.muted, 'right');
    }
    api.line(ctx, ...origin, 900, origin[1], C.muted, 3);
    api.line(ctx, ...origin, origin[0], 255, C.muted, 3);
    label('Feature 2', 225, 218, 32, C.ink);
    label('Feature 1', 898, 986, 32, C.ink, 'right');
    if (across > 0) {
      const tip = point([values[0] * across, values[1] * up]);
      api.line(ctx, ...origin, ...tip, C.blue, 5);
      api.circle(ctx, ...tip, 12, C.blue);
    }
    if (scaleP > 0) {
      const moving = point(scaling);
      api.line(ctx, ...origin, ...moving, C.cyan, 7);
      api.circle(ctx, ...moving, 13, C.cyan);
    }
    if (weightP > 0) {
      const tip = point(weighting);
      api.line(ctx, ...point(normalized), ...tip, C.green, 6);
      api.circle(ctx, ...tip, 13, C.green);
    }
  });
  api.focus.target('intro-work', () => {
    const x = 1050;
    const columns = [1324, 1585];
    function row(name, coords, y, color, digits) {
      label(name, x, y - 20, 37, color);
      coords.forEach((value, i) => {
        label(value.toFixed(digits), columns[i], y - 20, 41, color);
        api.rect(ctx, columns[i], y, value * 52, 12, color, undefined, 0);
      });
    }
    columns.forEach((left, i) => label('Feature ' + (i + 1), left, 298, 31, C.muted));
    row('Caller input', values, 418, C.blue, 0);
    if (state.beat === 0) return;

    const during = id => state.cues?.['kg-intro-' + id]?.phase === 'during';
    const squares = values.map(v => v * v).join('+');
    const radicand = (mean + epsilon).toFixed(5);
    const math = (tex, y) => api.math(ctx, tex, x, y, 42, C.ink);
    if (scaleP === 0) {
      if (stage >= 2 || during('mean')) {
        const result = stage >= 2 ? '=' + mean : '';
        math(String.raw`\operatorname{mean}(x^2)=(${squares})/${values.length}` + result, 505);
      } else if (stage >= 1 || during('square')) {
        const result = model.squareCount === values.length && !during('square') ? '=' + squares : '';
        math(values.map(v => v + '^2').join('+') + result, 505);
      }
      if (stage >= 3 || during('epsilon')) {
        const result = stage >= 3 ? '=' + radicand : '';
        math(`${mean}+${epsilon}` + result, 615);
      }
    }
    if (stage >= 4 || during('scale')) {
      const result = stage >= 4 ? String.raw`\approx${scale.toFixed(6)}` : '';
      math(String.raw`r=1/\sqrt{${radicand}}` + result, scaleP > 0 ? 505 : 725);
    }
    if (scaleP > 0) {
      row(scaleP < 1 ? 'Scaling' : 'Scaled row', scaling, 598, C.cyan, 4);
      if (scaleP < 1)
        label('Target: (' + normalized.map(v => v.toFixed(4)).join(', ') + ')', x, 682, 37, C.cyan);
    }
    const showWeights = after('kg-intro-predict', 1, 0.76, 0.87) || weightP > 0;
    if (showWeights) {
      label('Weight', x, 691, 35, C.yellow);
      weights.forEach((w, i) => label('× ' + w, columns[i], 691, 38, C.yellow));
    }
    if (weightP > 0) row(weightP < 1 ? 'Weighting' : 'Fresh output', weighting, 778, C.green, 4);
    else if (showWeights && state.beat === 1)
      label('Which way will the point move?', x, 940, 39, C.yellow);
  });
}

export default {
  id: 'intro', draw: drawIntro,
  cues: ['kg-intro-speed', 'kg-intro-shorten', 'kg-intro-check', 'kg-intro-row', 'kg-intro-across', 'kg-intro-input', 'kg-intro-square', 'kg-intro-mean', 'kg-intro-epsilon',
    'kg-intro-scale', 'kg-intro-normalize', 'kg-intro-predict', 'kg-intro-weight'],
};
