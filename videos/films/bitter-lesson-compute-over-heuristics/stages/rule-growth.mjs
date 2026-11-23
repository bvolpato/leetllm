import { sampleModel } from '../construction.mjs';
import { ruleGrowthState } from '../model.mjs';
import { card, visualFocus } from '../defaults.mjs';
import assert from 'node:assert/strict';
export function drawRuleGrowth(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const modelState = sampleModel('rule-growth', state);
  {
    const progress = state.cues?.['rule-growth-add-rules']
      ? api.focus.progress('rule-growth-add-rules', modelState.step > 0 ? 1 : 0)
      : modelState.step > 0
        ? 1
        : 0;
    const { rules: visibleRules, score: learnedScore } = ruleGrowthState(
      modelState.step === 0 ? 0 : progress,
    );
    visualFocus(ctx, api, 'rule-growth-keywords', () =>
      visibleRules.forEach((rule, i) =>
        card(
          ctx,
          api,
          rule,
          185 + i * 225,
          305,
          210,
          60,
          i < 3 ? themeColors.blue : themeColors.yellow,
          20,
        ),
      ),
    );
    visualFocus(ctx, api, 'rulebook-object-yesterday-s-six-reports-16', () =>
      card(
        ctx,
        api,
        'Yesterday’s six reports',
        270,
        425,
        600,
        92,
        learnedScore === 6 ? themeColors.green : themeColors.blue,
        25,
      ),
    );
    card(
      ctx,
      api,
      'score · ' + learnedScore + ' / 6',
      1000,
      425,
      600,
      92,
      learnedScore === 6 ? themeColors.green : themeColors.cyan,
      26,
    );
    visualFocus(ctx, api, 'rule-growth-fresh', () =>
      modelState.freshCases.forEach((row, index) => {
        const y = 570 + index * 112;
        const reveal = modelState.step === 2;
        const ok = row.predicted === row.expected;
        card(ctx, api, row.text, 270, y, 880, 78, reveal ? themeColors.pink : themeColors.blue, 23);
        card(
          ctx,
          api,
          reveal ? row.predicted.replaceAll('_', ' ') + ' · expected ' + row.expected : 'held out',
          1200,
          y,
          400,
          78,
          reveal ? themeColors.pink : themeColors.muted,
          22,
        );
        if (reveal) assert.equal(ok, false);
      }),
    );
    if (modelState.step === 2)
      card(
        ctx,
        api,
        'Fresh wording · ' + modelState.freshExpanded + ' / 3 correct',
        500,
        925,
        920,
        72,
        themeColors.pink,
        25,
      );
  }
}
export default {
  id: 'rule-growth',
  draw: drawRuleGrowth,
  cues: [
    'rule-growth-beat-1-focus-1',
    'rule-growth-beat-1-focus-2',
    'rule-growth-add-rules',
    'rule-growth-beat-2-focus-2',
    'rule-growth-beat-3-focus-1',
  ],
};
