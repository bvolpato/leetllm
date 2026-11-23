import { prefBound } from '../arithmetic.mjs';
import { cell, constructionText, focusTarget, heading, rectangle } from '../defaults.mjs';
export function drawAiFeedback(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = prefBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const cue = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared cue ai-feedback/' + id);
    return cue
      ? cue.phase === 'before'
        ? 0
        : cue.phase === 'after'
          ? 1
          : prefBound(cue.progress)
      : currentBeat < beat
        ? 0
        : currentBeat > beat
          ? 1
          : prefBound((progress - 0.12) / 0.76);
  };
  const resultComplete = (id, beat = currentBeat) => cueProgress(id, beat) >= 1 - 1e-8;
  const construction = () => {
    const revised = currentBeat > 0 || resultComplete('pa-ai-revision', 0),
      reward = currentBeat > 0 || resultComplete('pa-ai-reward', 0);
    heading(ctx, api, 'Constitutional-AI procedure · authored P7 reconstruction');
    constructionText(
      ctx,
      api,
      'Principle: cite P7 and escalate privileged changes',
      170,
      390,
      34,
      themeColors.blue,
    );
    cell(
      ctx,
      api,
      revised ? 'Revised: reviewer ticket + P7' : 'Original: grant access tonight',
      170,
      470,
      1420,
      105,
      revised ? themeColors.green : themeColors.pink,
      35,
    );
    constructionText(
      ctx,
      api,
      'Critique: direct grant violates the supplied principle',
      170,
      660,
      30,
      themeColors.yellow,
    );
    if (currentBeat === 0 && revised)
      constructionText(
        ctx,
        api,
        'Revised examples → supervised token targets',
        170,
        785,
        32,
        themeColors.green,
      );
    if (currentBeat === 0 && reward)
      constructionText(
        ctx,
        api,
        'AI harmlessness comparisons + human helpfulness → reward model / RL',
        170,
        915,
        30,
        themeColors.cyan,
      );
    if (currentBeat === 1) {
      rectangle(ctx, api, 170, 735, 1580, 220, themeColors.blue);
      constructionText(
        ctx,
        api,
        'An AI judge can also compare two replies directly.',
        210,
        820,
        29,
        themeColors.blue,
      );
      constructionText(
        ctx,
        api,
        'Can the judge recognize an invented policy exception?',
        210,
        900,
        29,
        themeColors.muted,
      );
    }
    if (currentBeat === 2) {
      rectangle(ctx, api, 170, 735, 1580, 220, themeColors.yellow);
      constructionText(
        ctx,
        api,
        'Independent human holdout: new P7 requests and adversarial exceptions',
        210,
        820,
        29,
        themeColors.yellow,
      );
      constructionText(
        ctx,
        api,
        'Does the assistant cite P-7 and send the request to a reviewer?',
        210,
        900,
        31,
        themeColors.green,
      );
    }
    return;
  };
  focusTarget(ctx, api, 'ai-feedback-construction', construction);
}
export default {
  id: 'ai-feedback',
  draw: drawAiFeedback,
  cues: ['ai-feedback-b0', 'pa-ai-revision', 'pa-ai-reward', 'ai-feedback-b1', 'ai-feedback-b2'],
};
