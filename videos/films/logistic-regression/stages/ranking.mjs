import { pairEvidence, validationScores } from '../fixtures.mjs';
import { T, mark } from '../defaults.mjs';

const positives = validationScores.filter((r) => r.label);
const negatives = validationScores.filter((r) => !r.label);
const sorted = [...validationScores].sort((a, b) => b.p - a.p);
const examples = ['V4', 'V6'].map((id) =>
  pairEvidence.find((pair) => pair.positive.id === 'V3' && pair.negative.id === id),
);
const comparisons = [...examples, ...pairEvidence.filter((pair) => !examples.includes(pair))];

export function drawRanking(ctx, scene, state, api) {
  const { C } = api;
  const cue = (id) => api.focus.progress(id, 0);
  const scan = cue('auc-pairs');
  const count =
    Number(cue('auc-loss') === 1) +
    Number(cue('auc-win') === 1) +
    Math.floor(scan * (comparisons.length - examples.length));
  const seen = comparisons.slice(0, count);
  const wins = seen.reduce((sum, pair) => sum + pair.win, 0);
  const pair =
    scan === 1
      ? null
      : comparisons[
          scan > 0 ? Math.min(count, comparisons.length - 1) : cue('auc-switch') > 0 ? 1 : 0
        ];
  mark(api, 'auc-scores', () => {
    T(ctx, api, 'Held-out score', 495, 278, 36);
    sorted.forEach((row, i) => {
      const y = 340 + 68 * i;
      const selected = row === pair?.positive || row === pair?.negative;
      const ink = row.label ? C.pink : C.blue;
      if (selected) api.rect(ctx, 132, y - 14, 704, 61, C.panel, ink, 8);
      T(ctx, api, row.id, 210, y + 28, 32, ink);
      api.rect(ctx, 282, y + 3, 330 * row.p, 22, ink);
      T(ctx, api, row.p.toFixed(3), 721, y + 29, 34, selected ? C.ink : C.muted);
    });
  });
  mark(api, 'auc-pair-ledger', () => {
    T(ctx, api, 'Routine request', 1460, 248, 35, C.blue);
    T(ctx, api, 'Required', 959, 320, 29, C.pink);
    negatives.forEach((r, j) => T(ctx, api, r.id, 1132 + 198 * j, 320, 33, C.blue));
    positives.forEach((r, i) => {
      const y = 351 + 127 * i;
      T(ctx, api, r.id, 960, y + 65, 34, C.pink);
      negatives.forEach((n, j) => {
        const item = pairEvidence[i * negatives.length + j];
        const settled = seen.includes(item);
        const x = 1050 + 198 * j;
        const active = item === pair;
        const fill = settled ? (item.win === 1 ? C.green : C.red) : C.panel;
        api.rect(ctx, x, y, 164, 99, fill, active ? C.yellow : C.muted, 7);
        T(
          ctx,
          api,
          settled ? String(item.win) : active ? '?' : '·',
          x + 82,
          y + 66,
          47,
          settled ? C.bg : active ? C.yellow : C.muted,
        );
      });
    });
  });
  mark(api, 'auc-result', () => {
    let caption;
    if (cue('auc-result') === 1) {
      caption =
        'ROC AUC  =  ' + wins + ' / ' + seen.length + '  =  ' + (wins / seen.length).toFixed(4);
    } else if (scan > 0) {
      caption = wins + ' wins in ' + count + ' comparisons';
    } else {
      const focus = pair ?? comparisons[0];
      const sign = focus.win ? ' > ' : ' < ';
      caption = seen.includes(focus)
        ? focus.positive.p.toFixed(3) +
          sign +
          focus.negative.p.toFixed(3) +
          '     ' +
          (focus.win ? '1 win' : '0 wins')
        : 'Does ' + focus.positive.id + ' score above ' + focus.negative.id + '?';
    }
    T(ctx, api, caption, 960, 981, 48, C.yellow);
  });
}

export default {
  id: 'ranking',
  draw: drawRanking,
  cues: ['auc-first', 'auc-loss', 'auc-switch', 'auc-win', 'auc-pairs', 'auc-result'],
};
