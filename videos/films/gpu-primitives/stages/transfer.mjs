import { exclusive } from '../arithmetic.mjs';
import { ARTICLE_INPUT } from '../fixtures.mjs';
import { text } from '../defaults.mjs';
import { after, cue, number, signed } from '../score-trace.mjs';

const zeroFirstBlock = ARTICLE_INPUT.map((v, i) => (i === 3 ? -6 : v));

export function drawTransfer(ctx, scene, state, api) {
  const { C } = api;
  const changed = after(state, 'test-edit', 1, 0.25);
  const fail = after(state, 'test-fail', 2, 0.32);
  const twelve = after(state, 'test-twelve', 2, 0.05);
  const fixed = after(state, 'test-repair', 2, 0.55);
  const pass = after(state, 'test-fixed', 2, 0.69);
  const firstPass = after(state, 'test-pass', 0, 0.71);
  const row = changed ? ARTICLE_INPUT : zeroFirstBlock;
  const expected = exclusive(row);
  const actual = fixed ? expected : [...exclusive(row.slice(0, 4)), ...exclusive(row.slice(4))];
  const showValues = cue(state, 'test-compare', 0, 0.18, 0.41) > 0;
  const showReference = showValues && (!changed || twelve);
  const checked = changed ? (fixed ? pass : fail) : firstPass;
  const matches = actual.every((v, i) => v === expected[i]);
  api.focus.target('check-board', () => {
    const col = (i) => 510 + 162 * i;
    text(ctx, api, 'Block A', (col(0) + col(3)) / 2, 282, 34, C.blue);
    text(ctx, api, 'Block B', (col(4) + col(7)) / 2, 282, 34, C.cyan);
    api.line(ctx, (col(3) + col(4)) / 2, 307, (col(3) + col(4)) / 2, 751, C.muted, 2);
    const rows = [
      ['Play', 396, row.map(signed)],
      [fixed ? 'After offset' : 'Local output', 563, actual.map(number)],
      ['Reference', 721, expected.map(number)],
    ];
    for (const [r, [name, y, values]] of rows.entries()) {
      text(ctx, api, name, 139, y, 38, C.ink, 'left');
      values.forEach((v, i) => {
        const unseen =
          (r === 1 && !showValues) || (r === 2 && !showReference && (i >= 4 || !showValues));
        const color =
          r === 0
            ? i === 3
              ? C.yellow
              : C.blue
            : checked && i >= 4 && !matches
              ? C.pink
              : r === 2
                ? C.cyan
                : C.ink;
        api.rect(ctx, col(i) - 65, y - 61, 130, 85, C.panel, color, 9);
        text(ctx, api, unseen ? '·' : v, col(i), y, 42, color);
      });
    }
    if (changed && !fail)
      text(
        ctx,
        api,
        'Reference score before −9     ' + (twelve ? '12' : '?'),
        960,
        826,
        38,
        C.yellow,
      );
    api.text(ctx, 'actual == reference_scan(row)', 775, 923, 45, C.ink, 'center', 'mono');
    text(
      ctx,
      api,
      checked ? (matches ? 'True' : 'False') : '?',
      1360,
      926,
      62,
      checked ? (matches ? C.green : C.pink) : C.yellow,
    );
  });
}
export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: [
    'test-compare',
    'test-pass',
    'test-edit',
    'test-question',
    'test-twelve',
    'test-fail',
    'test-repair',
    'test-fixed',
  ],
};
