import { THRESHOLD, matchedPairs } from '../fixtures.mjs';
import { toyRoutingScore } from '../arithmetic.mjs';
import { auditBoard, isAuto, wordingColor, wordingLabel, wordings } from '../audit-board.mjs';

export function drawInterventions(ctx, scene, state, api) {
  const { C, text, line, dot, rect, focus, progress, started, after } = auditBoard(
    ctx,
    scene,
    state,
    api,
  );
  const p4 = matchedPairs.find((r) => r.id === 'p4');
  if (state.beat === 0) {
    focus('trace', () => {
      text('p4   /   Compare the two traces', 113, 281, 43);
      const xs = [550, 888, 1235, 1600];
      ['Receipt', 'Policy', 'Judge score', 'Router'].forEach((s, i) =>
        text(s, xs[i], 405, 35, C.muted, 'center'),
      );
      wordings.forEach((key, j) => {
        const y = 531 + j * 194,
          color = wordingColor(C, key);
        text(wordingLabel(key), 116, y, 34, color);
        const entries = [
          'Verified',
          '30 days',
          p4[key].toFixed(2),
          isAuto(p4[key]) ? 'Auto' : 'Review',
        ];
        entries.forEach((s, i) => {
          if (i > 1 && !started('trace')) return;
          text(s, xs[i], y, i === 2 ? 52 : 38, i < 2 ? C.ink : color, 'center');
        });
      });
      text(
        'Inspect the retrieved text, rubric, raw score and routing decision.',
        960,
        970,
        37,
        C.yellow,
        'center',
      );
    });
  } else if (state.beat < 3 || !started('fulfillment')) {
    focus('scorer', () => {
      const penalty = 0.11 * progress('deduct') * (1 - progress('no-deduction'));
      const x = (score) => 515 + (score - 0.6) * 5750;
      text('Toy judge     ·     base score 0.78', 112, 269, 46);
      text('Cutoff 0.70', x(THRESHOLD), 361, 34, C.yellow, 'center');
      line(x(THRESHOLD), 390, x(THRESHOLD), 843, C.yellow, 4);
      wordings.forEach((key, i) => {
        const y = 482 + i * 259,
          color = wordingColor(C, key),
          score = toyRoutingScore(Boolean(i), penalty),
          scoreX = x(score);
        text(wordingLabel(key), 115, y + 8, 38, color);
        if (i) text('Style deduction ' + penalty.toFixed(2), 115, y + 66, 31, C.muted);
        line(x(0.6), y, x(0.81), y, '#454a54', 3);
        dot(scoreX, y, 15, color);
        if (key === 'conversational') rect(scoreX - 57, y - 82, 114, 54, C.bg);
        text(score.toFixed(2), scoreX, y - 38, 45, color, 'center');
        const inMotion =
          i &&
          ((progress('deduct') > 0 && progress('deduct') < 1) ||
            (started('no-deduction') && !after('same-score')));
        if (!inMotion)
          text(
            isAuto(score) ? 'Automatic service' : 'Human review',
            scoreX,
            y + 78,
            34,
            color,
            'center',
          );
      });
      text(
        'Held-out test for the real judge   ·   Score receipt facts and defect eligibility',
        960,
        978,
        35,
        C.muted,
        'center',
      );
    });
  } else {
    focus('fulfillment', () => {
      text('p4    /    Automatic service', 115, 272, 40, C.blue);
      text('Before issuing a replacement', 115, 397, 56);
      ['Receipt ownership', 'Defect eligibility', 'Current policy', 'Fulfillment details'].forEach(
        (s, i) => {
          text(s, 183, 506 + 95 * i, 40);
          line(775, 491 + 95 * i, 944, 491 + 95 * i, C.muted);
          text('Verify against trusted records', 1020, 506 + 95 * i, 35, C.green);
        },
      );
      text('Send missing facts to clarification or review.', 960, 990, 39, C.muted, 'center');
    });
  }
}
export default { id: 'interventions', draw: drawInterventions };
