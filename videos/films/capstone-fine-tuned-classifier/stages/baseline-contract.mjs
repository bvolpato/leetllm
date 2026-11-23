import { sceneClock } from '../desk.mjs';

const cases = [
  ['Explicit freeze', 'Production API key disabled and the incident freeze blocks restore.', 1],
  ['Indirect freeze', 'The production API key was disabled during the incident freeze.', 1],
  ['Rotation guide', 'Where is the key rotation guide?', 0],
  ['Policy question', 'Where can I read the access policy?', 0],
];
const terms = ['key disabled', "can't sign in", 'admin override'];
const predicted = cases.map(([, text]) =>
  Number(terms.some((term) => text.toLowerCase().includes(term))),
);
const fitted = [1, 1, 0, 0];

export function drawBaselineContract(ctx, scene, state, api) {
  const clock = sceneClock(scene, state);
  const { C } = api;
  const inserted = clock.progress('baseline-phrase');
  api.focus.target('phrase-match', () => {
    api.text(ctx, 'Find the exact phrase    “key disabled”', 160, 259, 42, C.ink);
    for (const i of [0, 1]) {
      const y = 368 + i * 105;
      api.text(ctx, i ? 'Second ticket' : 'First ticket', 160, y, 33, C.muted);
      if (i && !inserted) {
        api.text(ctx, '…', 660, y, 50, C.muted);
        continue;
      }
      api.text(ctx, 'key', 660, y, 50, C.ink);
      api.text(ctx, 'disabled', i ? 907 : 760, y, 50, C.ink);
      if (i) api.text(ctx, 'was', 766, y - 26 * (1 - api.ease(inserted)), 50, C.yellow);
      api.line(ctx, 660, y + 18, i ? 1092 : 945, y + 18, C.muted, 2);
      if (clock.after('baseline-rule-result')) {
        api.text(
          ctx,
          predicted[i] ? 'Match' : 'No match',
          1360,
          y,
          42,
          predicted[i] ? C.cyan : C.pink,
        );
      }
    }
  });
  api.focus.target('baseline-table', () => {
    const columns = [170, 785, 1150, 1540];
    ['Held-out ticket', 'Reviewed label', 'Phrase rule', 'Fitted TF-IDF'].forEach((label, i) =>
      api.text(ctx, label, columns[i], 610, 30, C.muted),
    );
    cases.forEach(([name, , gold], i) => {
      const y = 682 + i * 66;
      api.text(ctx, name, columns[0], y, 34, C.ink);
      api.text(ctx, gold ? 'Human' : 'Guarded', columns[1], y, 34, C.ink);
      if (clock.after('baseline-rule-result'))
        api.text(
          ctx,
          predicted[i] ? 'Human' : 'Guarded',
          columns[2],
          y,
          34,
          predicted[i] === gold ? C.ink : C.pink,
        );
      if (clock.after('baseline-fitted-result'))
        api.text(ctx, fitted[i] ? 'Human' : 'Guarded', columns[3], y, 34, C.cyan);
    });
    if (clock.progress('baseline-fit') > 0)
      api.text(ctx, 'Features fitted on six training tickets', 170, 990, 34, C.muted);
  });
  if (state.beat === 0)
    api.text(ctx, 'Will the second ticket reach a person?', 960, 990, 39, C.ink, 'center');
}

export default {
  id: 'baseline-contract',
  draw: drawBaselineContract,
  cues: ['baseline-phrase', 'baseline-rule-result', 'baseline-fit', 'baseline-fitted-result'],
};
