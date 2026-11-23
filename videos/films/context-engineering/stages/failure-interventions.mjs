import { boundedContext, contextDone, contextProgress } from '../arithmetic.mjs';
import {
  drawCompleteFocus,
  drawCompleteFooter,
  drawCompleteHeading,
  drawCompleteLine,
  drawCompleteRecord,
  drawCompleteText,
} from '../defaults.mjs';
export function drawFailureInterventions(ctx, scene, state, api) {
  if (paintFailureInterventions(ctx, scene, state, api)) return;
}
function paintFailureInterventions(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = boundedContext(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat, start = 0.08, end = 0.88) =>
      contextProgress(state, id, beat, start, end),
    resultComplete = (id, beat = currentBeat, end = 0.88) => contextDone(state, id, beat, end);
  drawCompleteFocus(ctx, api, 'ce-failure-interventions-mechanism', () => {
    drawCompleteHeading(ctx, api, 'Same incident, four different observable defects');
    const labels = ['Poisoning', 'Distraction', 'Confusion', 'Clash'],
      texts = [
        'lock guess → repeated as fact',
        'same failed searches → repeated plan',
        '40 overlapping tools → admin call',
        'retrieved XML demand ↔ JSON policy',
      ];
    labels.forEach((name, i) => {
      const x = 150 + (i % 2) * 840,
        y = 390 + Math.floor(i / 2) * 270;
      drawCompleteRecord(
        ctx,
        api,
        name,
        texts[i],
        x,
        y,
        760,
        i === 0 ? themeColors.pink : i === 3 ? themeColors.yellow : themeColors.blue,
        105,
      );
      if (currentBeat === 1 && i === 0) {
        const removed = cueProgress('ce-remove-poison', 1);
        drawCompleteLine(
          ctx,
          api,
          x + 25,
          y + 152,
          x + 25 + 650 * removed,
          y + 152,
          themeColors.pink,
          4,
        );
        if (resultComplete('ce-keep-negative', 1))
          drawCompleteRecord(
            ctx,
            api,
            'checked negative',
            'lock absent for R17 at100',
            x,
            y + 175,
            760,
            themeColors.green,
            80,
          );
      }
      if (currentBeat >= 1 && i === 1) {
        const q = currentBeat > 1 ? 1 : cueProgress('ce-new-evidence', 1);
        drawCompleteText(
          ctx,
          api,
          q === 1 ? 'new trace span admitted' : 'repeated query archive stays outside',
          x + 20,
          y + 155,
          26,
          q === 1 ? themeColors.green : themeColors.muted,
        );
      }
      if (currentBeat === 2 && i === 2)
        drawCompleteText(
          ctx,
          api,
          'phase allowlist ∩ available tools',
          x + 20,
          y + 155,
          28,
          themeColors.green,
        );
      if (currentBeat === 2 && i === 3) {
        const q = cueProgress('ce-demote-format', 2);
        drawCompleteRecord(
          ctx,
          api,
          q === 1 ? 'SOURCE DATA' : 'instruction-like retrieved text',
          q === 1 ? 'policy authority unchanged' : 'not application policy',
          x,
          y + 150,
          760,
          q === 1 ? themeColors.green : themeColors.yellow,
          95,
        );
      }
    });
    drawCompleteFooter(
      ctx,
      api,
      'A diagnosis names an observed pattern. A matched intervention tests its effect.',
    );
  });
  return true;
}
export default {
  id: 'failure-interventions',
  draw: drawFailureInterventions,
  cues: [
    'ce-failure-interventions-1',
    'ce-failure-interventions-2',
    'ce-remove-poison',
    'ce-keep-negative',
    'ce-new-evidence',
    'ce-failure-interventions-3',
    'ce-demote-format',
  ],
};
