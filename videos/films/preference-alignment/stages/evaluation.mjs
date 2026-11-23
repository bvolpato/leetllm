import { wordCount } from '../arithmetic.mjs';
import { CONTROLLED_CASES, SHORTCUT_PAIRS } from '../fixtures.mjs';
import { heard, progress } from '../clock.mjs';

function shorterChoice(x, y) {
  return wordCount(x) <= wordCount(y) ? 0 : 1;
}

export function drawEvaluation(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat === 0) {
    api.focus.target('audit-training', () => {
      api.text(ctx, 'Always pick the shorter reply.', 120, 305, 52, C.ink);
      const cols = [130, 670, 1050, 1500];
      ['Stored vote', 'Chosen words', 'Other words', 'Rule picks'].forEach((v, i) =>
        api.text(ctx, v, cols[i], 445, 33, C.muted),
      );
      const shown = 1 + Math.ceil(2 * progress(state, 'length-counts', 0));
      const rows = SHORTCUT_PAIRS.slice(0, shown);
      rows.forEach((r, i) => {
        const y = 563 + i * 122;
        [
          r.id,
          wordCount(r.chosen),
          wordCount(r.other),
          shorterChoice(r.chosen, r.other) === 0 ? 'Chosen' : 'Other',
        ].forEach((v, k) => api.text(ctx, String(v), cols[k], y, 46, k === 3 ? C.green : C.ink));
      });
      const matches = rows.filter((r) => shorterChoice(r.chosen, r.other) === 0).length;
      api.text(
        ctx,
        matches + ' matches to ' + rows.length + ' stored votes',
        130,
        965,
        39,
        C.yellow,
      );
    });
    return;
  }
  const next = state.beat > 2 || (state.beat === 2 && progress(state, 'audit-next', 2) > 0);
  const row = CONTROLLED_CASES[next ? 1 : 0];
  const done = next ? heard(state, 'audit-second', 3) : heard(state, 'audit-first', 2);
  const answers = row.preferred === 0 ? [row.good, row.bad] : [row.bad, row.good];
  const rule = shorterChoice(...answers);
  const words = answers.map((s) => s.split(' '));
  api.text(ctx, row.request, 120, 285, 52, C.ink);
  api.text(ctx, 'Word-count rule    ·    If lengths tie, pick X', 120, 380, 33, C.yellow);
  api.focus.target('audit-answers', () => {
    const positions = [220];
    for (let j = 0; j < words[0].length - 1; j++) {
      const a = Math.max(words[0][j].length, words[1][j].length);
      positions.push(positions[j] + Math.max(93, a * 24 + 28));
    }
    words.forEach((line, i) => {
      const y = 550 + i * 147;
      api.text(ctx, i ? 'Y' : 'X', 130, y, 49, C.blue);
      line.forEach((w, j) =>
        api.text(ctx, w, positions[j], y, 39, w !== words[1 - i][j] ? C.yellow : C.ink),
      );
      api.text(ctx, wordCount(answers[i]) + ' words', 1760, y, 33, C.muted, 'right');
    });
    const preference = row.preferred ? 'Y' : 'X';
    const result = done
      ? 'Reviewer picks ' +
        preference +
        '     ·     ' +
        (next ? '2 + 3 = 5' : 'Left leads to the café')
      : next
        ? 'Which reply earns the vote?'
        : 'Which first turn leads to the café?';
    api.text(ctx, result, 130, 825, 44, done ? C.green : C.ink);
  });
  api.focus.target('audit-score', () => {
    if (done) {
      const first = CONTROLLED_CASES[0];
      const firstPick = shorterChoice(first.bad, first.good);
      const matches =
        Number(firstPick === first.preferred) + (next ? Number(rule === row.preferred) : 0);
      api.text(
        ctx,
        'Tie rule picks X    ·    ' +
          matches +
          ' matches to ' +
          (next ? '2 new votes' : '1 new vote'),
        130,
        970,
        34,
        C.ink,
      );
    }
  });
}

export default {
  id: 'evaluation',
  draw: drawEvaluation,
  cues: [
    'length-rule',
    'length-counts',
    'audit-route',
    'audit-first',
    'audit-next',
    'audit-second',
    'audit-score',
  ],
};
