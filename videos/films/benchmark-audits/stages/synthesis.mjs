import { smooth } from '../arithmetic.mjs';
import { sampleModel } from '../model.mjs';
import { auditFocusApi, card, caseGrid, text, visualFocus } from '../defaults.mjs';
export function drawSynthesis(ctx, scene, state, api) {
  api = auditFocusApi(api, scene);
  const { C: themeColors, components: components, teaching: teaching } = api;
  const modelState = sampleModel('synthesis', state),
    currentBeat = modelState.step,
    progress = modelState.p;
  {
    const shape = caseGrid(ctx, api, 'A', 160, 400, 530, 360);
    const report = visualFocus(ctx, api, 'synthesis-object-evaluation-report-45', () =>
      card(ctx, api, 'Evaluation report', 1080, 315, 650, themeColors.cyan, 110, 38),
    );
    teaching.transfer({
      source: {
        shape,
        opacity: 1,
      },
      target: {
        shape: report,
        opacity: 1,
      },
      color: themeColors.cyan,
      progress: progress,
      particle: {
        radius: 9,
        fill: themeColors.yellow,
      },
    });
    const fields = [
      'Frozen task and harness',
      'Reviewed scoring failures',
      'Case and exposure identities',
      'Slice counts and uncertainty',
      'Latency, cost and output checks',
    ];
    fields.forEach((field, i) => {
      const reveal = currentBeat === 0 ? smooth(progress * 5 - i) : 1;
      components.fade(reveal, () =>
        text(ctx, api, field, 1100, 515 + i * 90, 31, i % 2 ? themeColors.muted : themeColors.ink),
      );
    });
    {
    }
  }
}
export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: ['synthesis-beat-1-focus-1', 'synthesis-beat-2-focus-1'],
};
