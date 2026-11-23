import { spokenProgress } from '../construction.mjs';
import { CHOICE_SCORES } from '../fixtures.mjs';
import { moeChoice } from '../model.mjs';
import { rect, text } from '../defaults.mjs';

const choiceExample = moeChoice();
const buckets = choiceExample.buckets;
const bucketSize = buckets[0].length;
const tokens = CHOICE_SCORES[0].length;

export function drawExpertChoice(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const selection = [
    spokenProgress(api, state, 'fill-first', 0, 0.4, 0.8),
    spokenProgress(api, state, 'fill-second', 1, 0.08, 0.43),
    spokenProgress(api, state, 'fill-third', 1, 0.45, 0.8),
  ];
  const answered = spokenProgress(api, state, 'uncovered-four', 3, 0.03, 0.27) === 1;
  const colors = [C.blue, C.pink, C.yellow];
  const xFor = (t) => 395 + 217 * t;
  const cellWidth = 184;
  text(
    ctx,
    api,
    'Router probability for each token  ·  two places per expert',
    120,
    239,
    38,
    C.ink,
  );
  api.focus.target('choice-matrix', () => {
    for (let t = 0; t < tokens; t++)
      text(ctx, api, 't' + t, xFor(t) + cellWidth / 2, 343, 41, C.ink, 'center', 'mono');
    text(ctx, api, 'Places filled', 1640, 343, 32, C.ink, 'center');
    CHOICE_SCORES.forEach((row, e) => {
      const y = 386 + 135 * e;
      const occupied = Math.floor(bucketSize * selection[e]);
      const chosen = buckets[e].slice(0, occupied);
      text(ctx, api, 'E' + e, 184, y + 65, 43, colors[e], 'left', 'mono');
      row.forEach((p, t) => {
        const x = xFor(t);
        const selected = chosen.includes(t);
        rect(
          ctx,
          api,
          x,
          y,
          cellWidth,
          96,
          selected ? colors[e] : C.panel,
          selected ? colors[e] : C.muted,
          10,
        );
        text(
          ctx,
          api,
          p.toFixed(2),
          x + cellWidth / 2,
          y + 62,
          38,
          selected ? C.bg : C.ink,
          'center',
          'mono',
        );
      });
      text(ctx, api, occupied + ' / ' + bucketSize, 1640, y + 64, 41, colors[e], 'center', 'mono');
    });
  });
  if (answered) {
    text(ctx, api, 'Returns to token', 113, 857, 33, C.ink);
    choiceExample.coverage.forEach((count, t) =>
      text(
        ctx,
        api,
        count,
        xFor(t) + cellWidth / 2,
        857,
        52,
        count ? C.cyan : C.red,
        'center',
        'mono',
      ),
    );
  }
  if (beat === 2 || answered) {
    text(
      ctx,
      api,
      answered ? 't4 continues on the residual path' : 'Which token receives no expert return?',
      960,
      987,
      41,
      answered ? C.ink : C.yellow,
      'center',
    );
  }
}

export default {
  id: 'expert-choice',
  draw: drawExpertChoice,
  cues: ['fill-first', 'fill-second', 'fill-third', 'scan-columns', 'uncovered-four'],
};
