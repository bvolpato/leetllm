import { supportScore } from '../arithmetic.mjs';
import { CRITIQUE_BRANCHES, CRITIQUE_WEIGHTS } from '../fixtures.mjs';
import { spoken } from '../construction.mjs';

export function drawSelfRagBranches(ctx, scene, state, api) {
  const { C, focus } = api;
  const label = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const winner = spoken(state, 3, 'qx-branch-winner') === 1;
  label('Source E1', 135, 250, 31, C.cyan);
  label('“Temporary quota increases require approval.”', 442, 254, 46, winner ? C.green : C.ink);
  api.line(ctx, 135, 305, 1785, 305, C.muted, 2);

  if (state.beat < 2) {
    const shares = [47, 2, 1];
    const [full, partial] = shares;
    const total = shares.reduce((a, b) => a + b, 0);
    const colors = [C.cyan, C.yellow, C.pink, C.muted];
    const denominator = spoken(state, 1, 'support-denominator');
    const halfCredit = spoken(state, 1, 'support-half-credit');
    const zeroCredit = spoken(state, 1, 'support-zero');
    const normalized = spoken(state, 1, 'reflection-normalize') === 1;
    label('A   “Request approval for a temporary increase.”', 135, 419, 44);
    focus.target('reflection-family-model', () => {
      label(
        denominator === 1
          ? 'Shading shows the credit each support piece earns'
          : 'Next-token probability in 100 equal pieces',
        135,
        518,
        34,
        C.muted,
      );
      ['Full support', 'Partial support', 'No support', 'Other tokens'].forEach((name, i) => {
        const x = 135 + 425 * i;
        api.rect(ctx, x, 562, 16, 29, colors[i], undefined, 1);
        label((shares[i] ?? 100 - total) + '  ' + name, x + 30, 587, 34);
      });
      const xAt = (i) => 135 + 16 * i + 5 * Math.floor(i / 10);
      for (let i = 0; i < 100; i++) {
        const group = i < full ? 0 : i < full + partial ? 1 : i < total ? 2 : 3;
        const x = xAt(i);
        const credit = [1, 1 - 0.5 * halfCredit, 1 - zeroCredit, 1 - denominator][group];
        api.rect(ctx, x, 634, 13, 72, C.panel, colors[group], 0);
        if (credit > 0)
          api.rect(ctx, x, 706 - 72 * credit, 13, 72 * credit, colors[group], undefined, 0);
      }
      if (denominator > 0) {
        const end = api.lerp(xAt(0), xAt(total - 1) + 13, denominator);
        api.path(
          ctx,
          [
            { x: xAt(0), y: 720 },
            { x: xAt(0), y: 738 },
            { x: end, y: 738 },
            { x: end, y: 720 },
          ],
          { color: C.cyan, width: 3 },
        );
        if (denominator === 1)
          label(total + ' support pieces', (xAt(0) + end) / 2, 799, 37, C.cyan, 'center');
      }
    });
    focus.target('reflection-normalized-score', () => {
      if (state.beat === 1) {
        const earned = full + 0.5 * partial;
        const numerator = halfCredit === 1 ? full + '+0.5\\times' + partial : '?';
        api.math(
          ctx,
          normalized
            ? 's_{sup}=' + earned + '/' + total + '=' + supportScore(shares).toFixed(2)
            : 's_{sup}=\\frac{' + numerator + '}{' + (denominator === 1 ? total : '?') + '}',
          960,
          939,
          55,
          C.yellow,
          'center',
        );
      }
    });
    return;
  }

  const xs = [813, 1113, 1413];
  const multiply = spoken(state, 3, 'branch-multiply');
  const family = ['Relevance', 'Support', 'Utility'];
  const claims = [
    'Request approval for\na temporary increase.',
    'All launch traffic\nis unlimited.',
  ];
  const tones = [C.blue, C.cyan, C.yellow];
  label('Candidate sentence', 135, 417, 30, C.muted);
  family.forEach((name, j) => {
    label(name, xs[j], 402, 33, tones[j], 'center');
    label('weight ' + CRITIQUE_WEIGHTS[j].toFixed(1), xs[j], 455, 28, C.muted, 'center');
  });
  label('Weighted total', 1700, 418, 30, C.muted, 'center');
  CRITIQUE_BRANCHES.forEach((row, i) => {
    const y = 576 + i * 205;
    const shown = spoken(state, 3, i ? 'qx-weighted-b' : 'qx-weighted-a') === 1;
    label(row.id, 132, y, 54, winner && i === 0 ? C.green : C.ink);
    label(claims[i], 215, y - 6, 35);
    focus.target('reflection-contributions', () =>
      row.contributions.forEach((part, j) => {
        label(row.scores[j].toFixed(2), xs[j], y, 46, tones[j], 'center');
        label(
          multiply === 1 ? 'adds ' + part.toFixed(3) : '× ' + CRITIQUE_WEIGHTS[j].toFixed(1),
          xs[j],
          y + 53,
          29,
          C.muted,
          'center',
        );
        if (multiply > 0)
          api.rect(ctx, xs[j] - 96, y + 71, 320 * part * multiply, 13, tones[j], undefined, 0);
      }),
    );
    focus.target('reflection-branch-total', () =>
      label(
        shown ? row.total.toFixed(3) : '?',
        1700,
        y + 17,
        55,
        winner && i === 0 ? C.green : C.ink,
        'center',
      ),
    );
    api.line(ctx, 135, y + 103, 1780, y + 103, C.panel, 3);
  });
  focus.target('branch-decision', () =>
    label(
      winner
        ? 'A wins   ·   check “requires approval” in E1.'
        : 'Equal generation likelihood. Which sentence survives?',
      960,
      984,
      38,
      winner ? C.green : C.yellow,
      'center',
    ),
  );
}
export default {
  id: 'self-rag-branches',
  draw: drawSelfRagBranches,
  cues: [
    'reflection-normalization',
    'support-denominator',
    'support-half-credit',
    'support-zero',
    'reflection-normalize',
    'reflection-weighted',
    'branch-multiply',
    'qx-weighted-a',
    'qx-weighted-b',
    'qx-branch-winner',
    'reflection-limits',
  ],
};
