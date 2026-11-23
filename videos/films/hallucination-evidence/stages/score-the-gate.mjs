import { baselineReview, candidateReview } from '../case-review.mjs';
import { incidentSheet, phraseProgress } from '../incident-sheet.mjs';

const names = ['Clean update', 'Added estimate', 'Wrong status', 'Unknown source'];
export function drawScoreTheGate(ctx, scene, state, api) {
  const { C, left, text, footer } = incidentSheet(ctx, api);
  const cue = (id, beat) => phraseProgress(state, api, id, beat);
  const drafted = cue('baseline-answers', 0);
  const routed = cue('candidate-answers', 1);
  const scored = cue('candidate-count', 2) === 1;
  const supported = baselineReview.rows
    .flatMap((row) => row.verdicts)
    .filter((v) => v === 'supported').length;
  const allClaims = baselineReview.rows.flatMap((row) => row.verdicts).length;
  ['Request', 'Draft claims', 'Send every draft', 'Evidence gate'].forEach((name, j) =>
    text(name, [left, 560, 960, 1390][j], 316, 38, C.muted),
  );
  api.line(ctx, left, 347, 1790, 347, C.muted, 2);
  baselineReview.rows.forEach((row, i) => {
    const y = 443 + i * 115;
    const checked = candidateReview.rows[i];
    text(names[i], left, y, 40);
    row.verdicts.forEach((v, j) =>
      api.circle(ctx, 586 + j * 58, y - 14, 18, v === 'supported' ? C.green : C.pink),
    );
    if (drafted * 4 >= i + 1)
      text(row.unsafe ? 'Unsafe answer' : 'Safe answer', 960, y, 37, row.unsafe ? C.pink : C.green);
    if (routed * 4 >= i + 1)
      text(
        checked.route === 'abstain' ? 'Withhold' : checked.route === 'serve' ? 'Send' : 'Shorten',
        1390,
        y,
        40,
        checked.served ? C.green : C.muted,
      );
  });
  text('Each dot is one factual claim. Green = supported.', left, 826, 30, C.muted);
  if (scored)
    footer(
      'Unsafe among sent: ' +
        candidateReview.unsafe +
        '/' +
        candidateReview.served +
        '       Answer coverage: ' +
        candidateReview.served +
        '/' +
        candidateReview.total,
      C.green,
    );
  else if (routed === 1) footer('How many answers belong in the unsafe-serve denominator?');
  else if (drafted === 1)
    footer(
      supported +
        '/' +
        allClaims +
        ' supported claims.   ' +
        baselineReview.unsafe +
        '/' +
        baselineReview.served +
        ' unsafe answers.',
    );
  else footer('Count claims inside a request. Count an unsafe answer once.');
}
export default {
  id: 'score-the-gate',
  draw: drawScoreTheGate,
  cues: ['baseline-answers', 'candidate-answers', 'candidate-count'],
};
