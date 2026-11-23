import { sampleOriginalModel } from '../construction.mjs';
import { validationCases } from '../model.mjs';
import { legacyCard, legacyText, refinedCard, refinedText } from '../defaults.mjs';
function drawLegacyCandidateValidation(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleOriginalModel('candidate-validation', state);
  {
    legacyText(
      ctx,
      api,
      'Same trusted age and threshold · three model candidates',
      960,
      305,
      31,
      themeColors.ink,
      'center',
    );
    const rows = [
      ['Key age', '45 days'],
      ['Policy threshold', '30 days'],
      ['Candidate decision', modelState.value.decision.replaceAll('_', ' ')],
      ['Candidate threshold', String(modelState.value.minimum_key_age_days)],
      ['Evidence ID', modelState.value.source_line_ids.join(', ')],
    ];
    api.focus.target('candidate-field-comparison', () =>
      teaching.grid({
        x: 290,
        y: 380,
        width: 1340,
        height: 375,
        rows: 5,
        columns: 2,
        labels: rows,
        fontSize: 27,
        textColor: themeColors.ink,
        fill: themeColors.panel,
        stroke: themeColors.cyan,
      }),
    );
    const color = modelState.result.status === 'accepted' ? themeColors.green : themeColors.pink;
    api.focus.target('candidate-verdict', () =>
      legacyCard(ctx, api, modelState.label, 360, 820, 1200, 80, color, 26),
    );
    legacyCard(
      ctx,
      api,
      'Result · ' + modelState.result.status.replaceAll('_', ' '),
      510,
      930,
      900,
      75,
      color,
      25,
    );
    void 0;
  }
}
export function drawCandidateValidation(ctx, scene, state, api) {
  if (!state.cues) {
    drawLegacyCandidateValidation(ctx, scene, state, api);
    return;
  }
  const { C: themeColors } = api,
    currentBeat = state.beat,
    u = api.focus.progress('ap-candidate-validation-' + currentBeat),
    done = u >= 0.999999;
  {
    const candidate = validationCases()[currentBeat],
      fields = [
        ['decision', candidate.value.decision.replaceAll('_', ' '), 'eligible'],
        ['minimum age', String(candidate.value.minimum_key_age_days), '30'],
        ['evidence', candidate.value.source_line_ids.join(', '), 'P-7'],
      ];
    refinedText(
      ctx,
      api,
      'Persistent trusted facts: stale · age 45 · threshold 30',
      960,
      330,
      31,
      themeColors.blue,
      'center',
    );
    fields.forEach(([name, value, truth], i) => {
      const y = 420 + i * 150;
      refinedCard(ctx, api, name, 220, y, 400, 95, themeColors.blue, 28);
      refinedCard(
        ctx,
        api,
        value,
        730,
        y,
        520,
        95,
        value === truth ? themeColors.cyan : themeColors.pink,
        30,
      );
      refinedCard(ctx, api, truth, 1370, y, 330, 95, themeColors.green, 30);
    });
    const currentY = 465 + Math.min(2, Math.floor(u * 3)) * 150;
    api.line(ctx, 1280, currentY, 1340, currentY, themeColors.yellow, 5);
    api.focus.target('candidate-field-comparison', () =>
      refinedText(ctx, api, 'candidate → trusted', 960, 390, 26, themeColors.muted, 'center'),
    );
    api.focus.target('candidate-verdict', () =>
      refinedCard(
        ctx,
        api,
        done ? candidate.result.status.replaceAll('_', ' ') : 'compare retained fields',
        440,
        940,
        1040,
        75,
        done
          ? candidate.result.status === 'accepted'
            ? themeColors.green
            : themeColors.pink
          : themeColors.yellow,
        30,
      ),
    );
  }
}
export default {
  id: 'candidate-validation',
  draw: drawCandidateValidation,
  cues: [
    'candidate-field-comparison-b1-1',
    'ap-candidate-validation-0',
    'candidate-field-comparison-b2-1',
    'ap-candidate-validation-1',
    'candidate-verdict-b3-1',
    'ap-candidate-validation-2',
  ],
};
