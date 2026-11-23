import { sampleModel } from '../construction.mjs';
import { text } from '../defaults.mjs';
export function drawTimeBudget(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('time-budget', state);
  {
    const allocation = api.focus.target('time-budget-s-talkbudget', () =>
      teaching.allocation({
        x: 405,
        y: 285,
        width: 1110,
        height: 500,
        capacity: modelState.talkMinutes,
        parts: modelState.talkBudget.map((part) => ({
          ...part,
          focusTarget: 'talk-' + part.id,
        })),
        fontSize: 25,
        unit: 'min',
        format: (value) => `${value}`,
        color: themeColors.muted,
        trackColor: '#17253d',
      }),
    );
    text(
      ctx,
      api,
      `Allocated  ${allocation.used} / ${modelState.talkMinutes} minutes`,
      960,
      845,
      35,
      themeColors.yellow,
      'center',
    );
    text(
      ctx,
      api,
      'Leave slack so a question can change the order',
      960,
      945,
      29,
      themeColors.ink,
      'center',
    );
  }
}
export default {
  id: 'time-budget',
  draw: drawTimeBudget,
  cues: [
    'talk-context',
    'talk-request-path',
    'talk-decision',
    'talk-evidence',
    'talk-limits',
    'talk-questions',
    'talk-short-version',
    'talk-buffer',
  ],
};
