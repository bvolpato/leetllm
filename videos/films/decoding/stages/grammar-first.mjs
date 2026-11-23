import { coreText } from '../defaults.mjs';
import { decodeSupport, decodeNormalize } from '../arithmetic.mjs';
import { heard } from '../spoken.mjs';

const row = [0.6, 0.3, 0.1];
const nucleus = decodeSupport(row, 'p', 0.8);
const allowed = 2;
const legalRow = decodeNormalize(row.map((p, i) => (i === allowed ? p : 0)));
const repaired = decodeSupport(legalRow, 'p', 0.8);

export function drawGrammarFirst(ctx, scene, state, api) {
  const b = state.beat ?? 0;
  const { C } = api;
  const cut = heard(state, 'dec-grammar-truncation', 0, 0.55);
  const empty = heard(state, 'dec-grammar-empty', 0, 0.78);
  const restarted = heard(state, 'dec-grammar-first-2', 1, 0.31);
  const solved = heard(state, 'dec-grammar-only', 1, 0.54);
  const allMasked = b === 2 && heard(state, 'dec-grammar-first-3', 2, 0.25);
  const cutoffFirst = b === 0 || !restarted;
  const stage = cutoffFirst
    ? empty
      ? 'empty'
      : cut
        ? 'cut'
        : 'raw'
    : allMasked
      ? 'empty'
      : solved
        ? 'repaired'
        : 'legal';
  const values = {
    raw: row,
    empty: [0, 0, 0],
    cut: nucleus.values,
    repaired: repaired.values,
    legal: row.map((v, i) => (i === allowed ? v : 0)),
  }[stage];
  api.focus.target('dec-grammar-first-mechanism', () => {
    coreText(
      ctx,
      api,
      allMasked ? 'Grammar permits no token' : 'Grammar permits only ID 2',
      160,
      281,
      45,
      C.ink,
      'left',
    );
    coreText(
      ctx,
      api,
      cutoffFirst ? 'Cutoff first' : 'Grammar first',
      1740,
      281,
      39,
      C.cyan,
      'right',
    );
    coreText(ctx, api, 'Original mass', 630, 380, 30, C.muted);
    coreText(
      ctx,
      api,
      stage === 'legal' ? 'Eligible weights' : 'Eligible now',
      1330,
      380,
      30,
      C.muted,
    );
    for (let i = 0; i < row.length; i++) {
      const y = 460 + i * 155;
      const permitted = i === allowed && !allMasked;
      coreText(ctx, api, 'ID ' + i, 150, y + 25, 40, permitted ? C.yellow : C.ink, 'left');
      api.rect(ctx, 400, y - 5, row[i] * 500, 43, C.blue, undefined, 2);
      coreText(ctx, api, row[i].toFixed(2), 825, y + 28, 34, C.ink, 'right');
      const color = stage === 'repaired' ? C.green : C.cyan;
      if (values[i] > 0) {
        api.rect(ctx, 1050, y - 5, values[i] * 485, 43, color, undefined, 2);
        coreText(ctx, api, values[i].toFixed(3), 1715, y + 28, 37, color, 'right');
      } else {
        coreText(ctx, api, 'excluded', 1715, y + 28, 34, C.muted, 'right');
      }
    }
    if (cutoffFirst && empty) {
      coreText(ctx, api, 'top-p 0.8 → grammar intersection · empty support', 960, 902, 34, C.muted);
      coreText(ctx, api, 'No eligible token: reject', 960, 987, 45, C.pink);
    } else if (allMasked) {
      coreText(
        ctx,
        api,
        'T = 0   →   reject                 T = 1   →   reject',
        960,
        956,
        43,
        C.pink,
      );
    } else {
      const note =
        b === 0
          ? cut
            ? 'Top-p kept IDs 0 and 1. The grammar permits ID 2.'
            : 'Start with the full row. Top-p threshold 0.80.'
          : solved
            ? 'ID 2 has all the eligible mass.'
            : 'Apply the grammar to the original row.';
      coreText(ctx, api, note, 960, 960, 40, C.ink);
    }
  });
}
export default {
  id: 'grammar-first',
  draw: drawGrammarFirst,
  cues: [
    'dec-grammar-first-1',
    'dec-grammar-truncation',
    'dec-grammar-empty',
    'dec-grammar-first-2',
    'dec-grammar-only',
    'dec-grammar-first-3',
  ],
};
