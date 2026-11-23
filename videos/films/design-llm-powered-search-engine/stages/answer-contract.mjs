import { SEARCH_TEXT } from '../fixtures.mjs';
import { clamp, motion } from '../arithmetic.mjs';
import { chapterFooter, chapterRect, chapterSource, chapterText } from '../defaults.mjs';
export function drawAnswerContract(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index = 0) => {
    const q = state.cues?.['se-answer-contract-' + name];
    if (state.cues && !q)
      throw Error('Undeclared or absent current-scene cue se-answer-contract-' + name);
    return q
      ? {
          progress: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
          done: q.phase === 'after',
        }
      : {
          progress: currentBeat < index ? 0 : currentBeat > index ? 1 : motion(progress),
          done: currentBeat > index || (currentBeat === index && progress > 0.76),
        };
  };
  const prog = (name, index) => cue(name, index).progress,
    done = (name, index) => cue(name, index).done;
  api.focus.target('se-answer-contract-mechanism', () => {
    chapterSource(
      ctx,
      api,
      'policy@2',
      SEARCH_TEXT.policy,
      150,
      285,
      760,
      themeColors.blue,
      'workspace-a · current',
    );
    chapterSource(
      ctx,
      api,
      'exception@1',
      SEARCH_TEXT.exception,
      1010,
      285,
      760,
      themeColors.green,
      'workspace-a · conditional exception',
    );
    const lose = currentBeat === 0 ? prog('condition', 0) : 0;
    chapterText(ctx, api, 'Draft reply to Alice', 150, 555, 32, themeColors.ink);
    chapterRect(ctx, api, 150, 595, 1620, 180, themeColors.panel, themeColors.cyan);
    chapterText(
      ctx,
      api,
      'General deadline: start within 30 days of the notice.',
      190,
      654,
      35,
      themeColors.blue,
    );
    chapterText(
      ctx,
      api,
      'Service accounts may start within 60 days',
      190,
      725,
      35,
      themeColors.ink,
    );
    if (lose < 1)
      components.fade(1 - lose, () =>
        chapterText(ctx, api, 'only with security approval.', 935, 725, 35, themeColors.green),
      );
    if (lose > 0)
      chapterText(ctx, api, 'Which words did the draft lose?', 815, 845, 28, themeColors.pink);
    if (currentBeat === 1) {
      const terms = [
        'query → similarity',
        'chunk → original span',
        'reranker → candidate comparison',
      ];
      terms.forEach((x, i) =>
        chapterText(
          ctx,
          api,
          x,
          200 + i * 540,
          850,
          26,
          [themeColors.cyan, themeColors.blue, themeColors.yellow][i],
        ),
      );
    }
    if (currentBeat === 2) {
      chapterText(
        ctx,
        api,
        done('conflict', 2)
          ? 'Conflict without a source precedence rule → disclose uncertainty'
          : 'Check current applicability and every required condition',
        200,
        850,
        31,
        themeColors.yellow,
      );
    }
    chapterFooter(
      ctx,
      api,
      currentBeat === 0
        ? 'Alice has told the search engine she has a service account. Her approval status is unknown.'
        : currentBeat === 1
          ? 'Similarity locates material; the service checks identity and authority.'
          : 'Missing current evidence → incomplete answer or permitted links.',
    );
  });
}
export default {
  id: 'answer-contract',
  draw: drawAnswerContract,
  cues: [
    'se-answer-contract-0',
    'se-answer-contract-condition',
    'se-answer-contract-1',
    'se-answer-contract-2',
    'se-answer-contract-conflict',
  ],
};
