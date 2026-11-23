import { dareMaskExample, independentDropOutcomes } from '../fixtures.mjs';
import { after, progress, signed, started } from '../decisions.mjs';

export function drawDropRescale(ctx, scene, state, api) {
  const { C } = api;
  const label = (v, x, y, size, col, align = 'left') => api.text(ctx, v, x, y, size, col, align);
  const example = dareMaskExample();
  if (state.beat === 0) {
    api.focus.target('dare-bars', () => {
      label('One draw   ·   keep probability ½', 195, 308, 43, C.ink);
      const cut = progress(state, 'mask'),
        scale = progress(state, 'rescale');
      example.delta.forEach((v, i) => {
        const x = 340 + i * 400,
          y = 662;
        const col = v < 0 ? C.pink : C.cyan;
        const value = example.mask[i] ? v * (1 + scale) : v * (1 - cut);
        const hi = y - value * 220;
        label('w' + (i + 1), x, 375, 37, C.muted, 'center');
        api.line(ctx, x - 112, y, x + 112, y, C.muted, 2);
        if (Math.abs(hi - y) > 0.1)
          api.rect(ctx, x - 41, Math.min(hi, y), 82, Math.abs(hi - y), col, undefined, 2);
        api.line(ctx, x - 59, y - v * 220, x + 59, y - v * 220, C.muted, 3);
        label(signed(value, 2), x, 853, 47, col, 'center');
        if (after(state, 'mask'))
          label(example.mask[i] ? 'keep' : 'drop', x, 932, 34, C.muted, 'center');
      });
    });
    return;
  }
  if (state.beat === 1) {
    api.focus.target('expectation', () => {
      const v = example.delta[1],
        survivor = v / example.keep;
      label('Repeat the draw at weight 2', 175, 308, 43, C.ink);
      label(signed(v, 1), 320, 605, 72, C.pink, 'center');
      label('original change', 320, 691, 34, C.muted, 'center');
      api.line(ctx, 502, 590, 770, 460, C.muted, 4);
      api.line(ctx, 502, 590, 770, 720, C.pink, 4);
      label('½ drop', 815, 478, 42, C.muted);
      label('0', 1165, 478, 56, C.ink);
      label('½ keep', 815, 740, 42, C.pink);
      label(signed(survivor, 1), 1165, 740, 56, C.pink);
      label(
        'Expected change    ½ × 0  +  ½ × (' +
          signed(survivor, 1) +
          ')  =  ' +
          (after(state, 'expected') ? signed(v, 1) : '?'),
        960,
        892,
        45,
        C.yellow,
        'center',
      );
      if (after(state, 'mask-variance')) {
        const variance = example.keep * (survivor - v) ** 2 + (1 - example.keep) * v ** 2;
        label(
          'Variance   ½ × (−0.4)² + ½ × 0.4² = ' + variance.toFixed(2),
          960,
          992,
          36,
          C.muted,
          'center',
        );
      }
    });
    return;
  }
  api.focus.target('dare-grid', () => {
    const f = independentDropOutcomes();
    const code = started(state, 'keep-code'),
      math = started(state, 'keep-math'),
      active = after(state, 'active-denominator');
    label('Two independent masks   ·   each keeps 1 in 10', 190, 287, 39, C.ink);
    f.cells.forEach((cell) => {
      const a = code && cell.keepA,
        b = math && cell.keepB;
      const col = a && b ? C.yellow : a ? C.blue : b ? C.pink : C.panel;
      api.rect(ctx, 275 + 56 * cell.column, 357 + 56 * cell.row, 50, 50, col, undefined, 3);
    });
    label('100 equally likely outcomes', 550, 983, 36, C.muted, 'center');
    if (code) label('Code survives   10', 1040, 430, 43, C.blue);
    if (math) {
      label('Math survives   10', 1040, 533, 43, C.pink);
      label('Both survive      1', 1040, 636, 43, C.yellow);
      label('Among active outcomes', 1040, 772, 35, C.muted);
      label(
        active
          ? f.both + ' / ' + f.active + '   ≈   ' + (100 * f.conditional).toFixed(1) + '%'
          : '1 / ?',
        1040,
        860,
        58,
        C.yellow,
      );
    }
  });
}
export default {
  id: 'drop-rescale',
  draw: drawDropRescale,
  cues: [
    'mask',
    'rescale',
    'outcomes',
    'expected',
    'mask-variance',
    'keep-code',
    'keep-math',
    'active-denominator',
  ],
};
