import { passthroughFixture, soupSelectionFixture } from '../fixtures.mjs';
import { after, progress, started } from '../decisions.mjs';

export function drawRecipeContract(ctx, scene, state, api) {
  const { C } = api;
  const label = (v, x, y, size, col, align = 'left') => api.text(ctx, v, x, y, size, col, align);
  if (state.beat < 2) {
    api.focus.target('vocabulary', () => {
      const union = started(state, 'token-union'),
        donor = after(state, 'token-donor');
      label('Source vocabulary rows', 170, 310, 42, C.ink);
      const rows = [
        ['Base', '417', 'return', C.blue],
        ['Code', '92', 'return', C.pink],
        ['Code', '417', '<fim_prefix>', C.pink],
      ];
      rows.forEach(([source, id, token, col], i) => {
        const y = 437 + 154 * i;
        label(source, 170, y, 35, col);
        label(id, 400, y, 43, col, 'center');
        api.text(ctx, token, 520, y, 37, col, 'left', 'mono');
      });
      if (union) {
        label('Union vocabulary', 1170, 310, 42, C.ink);
        label('return', 1190, 493, 49, C.cyan);
        api.text(ctx, '<fim_prefix>', 1190, 735, 46, C.cyan, 'left', 'mono');
        api.arrow(ctx, 830, 421, 1140, 460, C.blue, 4);
        api.arrow(ctx, 830, 576, 1140, 509, C.pink, 4);
        api.arrow(ctx, 830, 728, 1140, 726, C.pink, 4);
        if (donor) label('Code supplies the missing row', 1170, 831, 31, C.yellow);
        label(
          'Apply the mapping to both the input embeddings and the output head.',
          170,
          970,
          35,
          C.ink,
        );
      } else {
        label('Row 417', 1170, 512, 46, C.yellow);
        label('Two token meanings', 1170, 610, 39, C.ink);
        label('Toy row IDs', 170, 970, 32, C.muted);
      }
    });
    return;
  }
  if (state.beat === 2) {
    api.focus.target('selection', () => {
      const f = soupSelectionFixture(),
        candidates = ['A', 'B', 'C'];
      const triedB = started(state, 'try-b'),
        triedC = started(state, 'try-c');
      label('Two validation inputs   ·   target = 1 on each', 165, 307, 40, C.ink);
      f.models.forEach((v, i) => {
        const y = 445 + i * 144;
        const col =
          i === 0 || (i === 1 && triedB) || (i === 2 && triedC)
            ? [C.blue, C.pink, C.cyan][i]
            : C.muted;
        label(candidates[i], 185, y, 46, col);
        label(v.map((n) => n.toFixed(1)).join('       '), 310, y, 42, col);
      });
      label('Trial soup', 900, 425, 35, C.muted);
      label('A' + (triedB ? ' + B' : '') + (triedC ? ' + C' : ''), 900, 502, 50, C.ink);
      const s = triedC ? f.steps[1] : triedB ? f.steps[0] : null;
      const values = s?.predictions ?? f.models[0];
      label(
        'Predictions      ' + values.map((n) => n.toFixed(3)).join('     '),
        900,
        625,
        38,
        C.ink,
      );
      label('Mean squared error     ' + (s?.loss ?? f.seedLoss).toFixed(4), 900, 713, 38, C.ink);
      if (triedB)
        label(
          s.accepted ? 'Keep A + B' : 'Leave C out',
          900,
          805,
          39,
          s.accepted ? C.green : C.yellow,
        );
      if (started(state, 'held-out'))
        label('A + B on fresh cases     MSE ' + f.untouchedLoss.toFixed(3), 165, 969, 39, C.yellow);
    });
    return;
  }
  api.focus.target('splice', () => {
    const f = passthroughFixture(),
      copied = Math.floor(progress(state, 'splice') * 8);
    label('Assembled layer sequence   ·   width 2 throughout', 175, 306, 40, C.ink);
    const x = (i) => 323 + i * 193;
    f.layers.forEach((layer, i) => {
      const col = i < copied ? (layer.source === 'A' ? C.blue : C.pink) : C.muted;
      api.rect(ctx, x(i) - 70, 395, 140, 98, C.panel, col, 7);
      label(i < copied ? layer.source + i : '·', x(i), 458, 38, col, 'center');
      if (i < 7) api.arrow(ctx, x(i) + 79, 444, x(i + 1) - 80, 444, C.muted, 2);
    });
    const count = Math.floor(progress(state, 'probe') * 4);
    if (started(state, 'probe')) {
      label('Input [1, 0]', 150, 596, 35, C.ink);
      label('First channel after each copied layer', 150, 650, 30, C.muted);
      let v = 1;
      f.layers.slice(0, 4 + count).forEach((layer, i) => {
        v *= layer.gain[0];
        label(String(v), x(i), 738, 44, i < 4 ? C.blue : C.pink, 'center');
      });
      if (count === 4) label('Output [16, 0]     target [1, 0]', 1720, 826, 37, C.red, 'right');
    }
    if (started(state, 'probe-y'))
      label(
        'Input [0, 1]     →     output [0, 1]     target [0, 1]',
        1720,
        927,
        37,
        C.green,
        'right',
      );
  });
}
export default {
  id: 'recipe-contract',
  draw: drawRecipeContract,
  cues: [
    'row-lookup',
    'token-union',
    'token-donor',
    'try-b',
    'try-c',
    'held-out',
    'splice',
    'probe',
    'probe-y',
  ],
};
