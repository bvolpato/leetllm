import { expectedYield } from '../arithmetic.mjs';
import { heard, movement } from '../construction.mjs';

const policies = [[0.9, 0.1], [0.5, 0.5], [0.1, 0.9]];
const rounds = 100;

export function drawPositionYield(ctx, scene, state, api) {
  const { C } = api;
  const first = movement(state, 0, 'yield-first', 0.22, 0.46);
  const both = heard(state, 1, 'yield-both', 0.12);
  const reversed = heard(state, 1, 'yield-reverse', 0.30);
  const middle = heard(state, 1, 'yield-middle', 0.91);
  const totals = heard(state, 1, 'yield-totals', 0.59);
  api.focus.target('yield-counts', () => {
    const label = (s, x, y, z = 34, color = C.ink) => api.text(ctx, s, x, y, z, color);
    const columns = [160, 540, 1020, 1550];
    ['Pass rates', 'First word kept', 'Both words kept', 'Emitted / round'].forEach((s, i) =>
      label(s, columns[i], 300, 31, C.muted));
    policies.forEach(([a, b], i) => {
      if (i === 1 && !middle || i === 2 && !reversed) return;
      const y = 444 + 170 * i;
      const count = Math.round(rounds * a);
      const countBoth = Math.round(count * b);
      label(Math.round(100 * a) + '% → ' + Math.round(100 * b) + '%', columns[0], y, 37);
      const meter = (x, top, bottom, visible, color) => {
        api.rect(ctx, x, y + 28, bottom * 3.4, 27, C.panel, C.muted, 1);
        if (visible > 0) {
          api.rect(ctx, x, y + 28, top * 3.4 * visible, 27, color, undefined, 1);
          label(top + ' of ' + bottom, x, y, 38, color);
        } else label('? of ' + bottom, x, y, 38, C.muted);
      };
      meter(columns[1], count, rounds, i === 0 ? first : 1, C.cyan);
      if (i !== 0 || heard(state, 0, 'yield-first', 0.46))
        meter(columns[2], countBoth, count, both ? 1 : 0, C.blue);
      if (totals) label(((rounds + count + countBoth) / rounds).toFixed(2), columns[3], y, 50, C.green);
    });
    let footer = '100 rounds, two guesses each';
    if (state.beat === 0 && first >= 1) footer = 'How many rounds keep both words?';
    if (totals) footer = 'Emitted tokens = 100 corrections or bonuses + first words kept + second words kept';
    if (heard(state, 2, 'yield-geometric', 0.57))
      footer = 'Depth 5, constant 80%     ·     1 + 0.8 + 0.64 + … + 0.8⁵ ≈ ' +
        expectedYield(0.8, 5).toFixed(2) + ' tokens per round';
    label(footer, 160, 994, 35, C.ink);
  });
}
export default {
  id: 'position-yield', draw: drawPositionYield,
  cues: ['yield-first', 'yield-reached', 'yield-both', 'yield-reverse', 'yield-totals',
    'yield-middle', 'yield-rate', 'yield-geometric'],
};
