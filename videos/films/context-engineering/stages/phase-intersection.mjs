import { tools } from '../fixtures.mjs';
import { boundedContext, contextDone } from '../arithmetic.mjs';
import { completeToolIntersection } from '../model.mjs';
import {
  drawCompleteFocus,
  drawCompleteFooter,
  drawCompleteHeading,
  drawCompleteLine,
  drawCompleteRecord,
  drawCompleteRectangle,
  drawCompleteText,
} from '../defaults.mjs';
export function drawPhaseIntersection(ctx, scene, state, api) {
  if (paintPhaseIntersection(ctx, scene, state, api)) return;
}
function paintPhaseIntersection(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = boundedContext(state.beatP ?? 0);
  const resultComplete = (id, beat = currentBeat, end = 0.88) => contextDone(state, id, beat, end);
  drawCompleteFocus(ctx, api, 'ce-phase-intersection-mechanism', () => {
    const show3 = resultComplete('ce-three-tools', 0),
      show2 = resultComplete('ce-two-tools', 1),
      empty = resultComplete('ce-no-tools', 1),
      unavailable = resultComplete('ce-unavailable', 1);
    const phase = currentBeat === 0 ? 'investigate' : empty ? 'unknown' : 'propose',
      available = unavailable ? tools.filter((t) => t !== 'trace_lookup') : tools,
      selected = completeToolIntersection(phase, available);
    drawCompleteHeading(ctx, api, 'Complete article policy · identity intersection');
    drawCompleteText(ctx, api, 'available catalog', 150, 365, 28, themeColors.muted);
    drawCompleteText(ctx, api, 'phase: ' + phase, 1020, 365, 31, themeColors.yellow);
    tools.forEach((name, i) => {
      const allowed = selected.includes(name),
        y = 420 + i * 110;
      drawCompleteRectangle(
        ctx,
        api,
        150,
        y,
        720,
        80,
        themeColors.panel,
        available.includes(name) ? themeColors.blue : themeColors.muted,
        1.5,
      );
      drawCompleteText(
        ctx,
        api,
        name,
        175,
        y + 50,
        29,
        available.includes(name) ? themeColors.blue : themeColors.muted,
        'left',
        'mono',
      );
      if ((currentBeat > 0 || show3) && allowed) {
        drawCompleteRectangle(ctx, api, 1060, y, 650, 80, themeColors.panel, themeColors.green, 2);
        drawCompleteText(ctx, api, name, 1080, y + 50, 29, themeColors.green, 'left', 'mono');
        drawCompleteLine(ctx, api, 890, y + 40, 1040, y + 40, themeColors.green, 3);
      }
    });
    const revealed = currentBeat === 0 ? show3 : show2 || empty || unavailable;
    drawCompleteText(
      ctx,
      api,
      revealed ? `exposed schemas: ${selected.length}` : 'exposed schemas: ?',
      1060,
      1000,
      32,
      revealed ? themeColors.green : themeColors.yellow,
    );
    if (currentBeat === 2)
      drawCompleteRecord(
        ctx,
        api,
        'EXECUTION CHECK',
        'identity + current action/resource permission',
        1030,
        640,
        720,
        themeColors.yellow,
        130,
      );
    drawCompleteFooter(
      ctx,
      api,
      'Original select chapter used a smaller two-tool investigation policy; this is the article program.',
    );
  });
  return true;
}
export default {
  id: 'phase-intersection',
  draw: drawPhaseIntersection,
  cues: [
    'ce-phase-intersection-1',
    'ce-three-tools',
    'ce-phase-intersection-2',
    'ce-two-tools',
    'ce-no-tools',
    'ce-unavailable',
    'ce-phase-intersection-3',
  ],
};
