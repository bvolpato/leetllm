import { CREDENTIAL_ROWS } from '../fixtures.mjs';
import { vectorCosine } from '../vector-search.mjs';
import { picture } from '../picture.mjs';

const q = [1, 0.8, 0];
const exactGuide = [...CREDENTIAL_ROWS].sort(
  (a, b) => vectorCosine(q, b.v) - vectorCosine(q, a.v),
)[0].id;
const useful = CREDENTIAL_ROWS.filter((d) => d.relevant).map((d) => d.id);
const returns = 'd1';
const exact = ['key_rotation', 'quota_page', 'display_name', 'duplicate_secret'];
const firstList = ['generic_api', 'quota_page', 'display_name', 'generic_api'];

export function drawAnnComparison(ctx, scene, state, api) {
  const { C, label, box, rule, started, after, target } = picture(ctx, state, api);
  if (state.beat < 2) {
    target('ann-reference', () => {
      label('Rotation query   ·   top one', 145, 295, 49, C.ink, 'left', 'serif');
      label('Approximate result', 155, 482, 38);
      if (started('ann-pair')) {
        box(515, 409, 195, 92, C.panel, C.cyan);
        label(returns, 612, 475, 54, C.cyan, 'center');
      }
      [
        ['Exact neighbor', [exactGuide]],
        ['Judged useful', useful],
      ].forEach(([name, ids], i) => {
        const y = 678 + i * 135;
        label(name, 155, y, 40);
        ids.forEach((id, j) => {
          box(515 + j * 225, y - 65, 195, 92, C.panel, C.muted);
          label(id, 612 + j * 225, y, 53, C.ink, 'center');
        });
        if (after('ann-result')) {
          const n = Number(ids.includes(returns));
          label(
            n + ' / ' + ids.length + (i ? ' useful passages' : ' exact neighbors'),
            1110,
            y,
            44,
            i ? C.green : C.yellow,
          );
        }
      });
    });
    target('ann-foot', () =>
      label(
        after('ann-result')
          ? 'Both fractions use the same returned ID.'
          : 'What fraction did each comparison recover?',
        150,
        992,
        41,
        C.yellow,
      ),
    );
    return;
  }
  const shown = after('ann-tuned') ? exact : firstList;
  target('ann-array', () => {
    label('Four fixed queries  ·  same eligible corpus', 145, 270, 42);
    label('Query', 145, 389, 34, C.muted);
    label('Exact neighbor', 460, 389, 36, C.muted);
    label(shown === exact ? 'Second supplied list' : 'First supplied list', 1120, 389, 36, C.cyan);
    exact.forEach((id, i) => {
      const y = 495 + 107 * i;
      rule(140, y - 68, 1750, y - 68, C.panel, 3);
      label('q' + (i + 1), 145, y, 38);
      label(id, 460, y, 37, C.ink, 'left', 'mono');
      label(shown[i], 1120, y, 37, id === shown[i] ? C.green : C.pink, 'left', 'mono');
    });
  });
  target('ann-foot', () => {
    const n = shown.filter((d, i) => d === exact[i]).length;
    const resultReady = shown === exact ? after('ann-all') : after('ann-fast-rate');
    const text = resultReady
      ? 'Mean ANN recall@1    ' + n + ' / ' + exact.length + '  =  ' + n / exact.length
      : 'Compare IDs within each query.';
    label(text, 145, 966, 45, C.yellow);
    if (started('ann-freeze'))
      label('Use measured request times on held-out queries.', 145, 1030, 31, C.ink);
  });
}
export default {
  id: 'ann-comparison',
  draw: drawAnnComparison,
  cues: [
    'ann-pair',
    'ann-ask',
    'ann-result',
    'ann-fast',
    'ann-fast-rate',
    'ann-tuned',
    'ann-all',
    'ann-freeze',
  ],
};
