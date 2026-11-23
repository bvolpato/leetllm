import { prEvent } from '../construction.mjs';
import { requestPath, zeroScoreFixture } from '../model.mjs';
import { card, centeredText, extensionFooter, meter } from '../defaults.mjs';
export function drawLexicalCounterexample(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => prEvent(state, name, beat),
    done = (name, beat) => ev(name, beat) === 1;
  api.focus.target('lexical-counterexample-mechanism', () => {
    const z = zeroScoreFixture(),
      normal = requestPath();
    centeredText(
      ctx,
      api,
      currentBeat === 0 ? 'Worked lexical query' : 'New query: ' + z.query,
      960,
      285,
      31,
      themeColors.yellow,
    );
    const hits = currentBeat === 0 ? normal.hits : z.hits;
    hits.forEach((h, i) => {
      const y = 420 + i * 240;
      card(ctx, api, h.record.id, 130, y, 550, 95, themeColors.cyan);
      meter(
        ctx,
        api,
        850,
        y + 40,
        750,
        h.score,
        8,
        themeColors.cyan,
        'Distinct shared terms: ' + h.score,
      );
    });
    if (currentBeat === 0)
      centeredText(
        ctx,
        api,
        done('scores', 0)
          ? '7 and 2 · both clear minTerms = 2'
          : 'Scores are counts, not relevance probabilities',
        960,
        960,
        32,
        themeColors.muted,
      );
    else if (currentBeat === 1) {
      if (done('zero', 1))
        centeredText(
          ctx,
          api,
          'score 0 ties → alphabetical IDs still returned',
          960,
          900,
          32,
          themeColors.pink,
        );
      if (done('false-answer', 1))
        centeredText(
          ctx,
          api,
          'Numerical fixture still says eligible · retrieval evidence failed',
          960,
          970,
          31,
          themeColors.pink,
        );
    } else {
      api.line(ctx, 1037.5, 485, 1037.5, 555, themeColors.yellow, 4);
      api.line(ctx, 1037.5, 725, 1037.5, 795, themeColors.yellow, 4);
      centeredText(
        ctx,
        api,
        'Calibrate a gate and paraphrase recall together',
        960,
        930,
        33,
        themeColors.yellow,
      );
    }
    extensionFooter(
      ctx,
      api,
      'Actual deterministic lexical fixtures; no measured semantic retriever or score probability',
    );
  });
}
export default {
  id: 'lexical-counterexample',
  draw: drawLexicalCounterexample,
  cues: ['pr-scores', 'pr-zero', 'pr-false-answer', 'pr-gate'],
};
