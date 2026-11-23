import { anchors } from '../fixtures.mjs';
import { answer, cueVisible, footer, panel, policyLine, text, withFocus } from '../defaults.mjs';
export function drawRubric(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    policyLine(ctx, api, 'policy-rule');
    answer(ctx, api, 'compact', '', 130, 340, 780, 230);
    answer(ctx, api, 'stepwise', '', 130, 650, 780, 260);
    withFocus(ctx, api, 'rubric-levels', () => {
      text(
        ctx,
        api,
        'Both actions?    Correct order?    Easy to scan?',
        1040,
        310,
        29,
        themeColors.yellow,
      );
      if (cueVisible(ctx, api, 'score-levels'))
        anchors.forEach((a, i) =>
          panel(
            ctx,
            api,
            'rubric-levels',
            String(a.level) + ' · ' + a.description,
            a.example,
            1030,
            355 + i * 185,
            760,
            155,
            [themeColors.pink, themeColors.yellow, themeColors.green][i],
          ),
        );
      if (cueVisible(ctx, api, 'bound-case'))
        text(
          ctx,
          api,
          'DEP-27 + exact texts + rubric-v1 + judge settings',
          1030,
          980,
          28,
          themeColors.blue,
        );
    });
    footer(ctx, api, 'For this example, both replies passed a policy review.');
  }
}
export default {
  id: 'rubric',
  draw: drawRubric,
  cues: ['policy-actions', 'same-facts', 'score-levels', 'bound-case'],
};
