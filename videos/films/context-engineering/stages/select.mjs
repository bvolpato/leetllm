import { PACKET_CONTEXT_TARGETS, tools } from '../fixtures.mjs';
import { boundedContext, contextProgress } from '../arithmetic.mjs';
import { sampleModel, selectTools } from '../model.mjs';
import {
  drawPacketFocus,
  drawPacketFooter,
  drawPacketFrame,
  drawPacketText,
  movePacketRow,
} from '../defaults.mjs';
export function drawSelect(ctx, scene, state, api) {
  const modelState = sampleModel('select', state),
    currentBeat = modelState.step;
  if (paintSelect(ctx, scene, state, api)) return;
}
function paintSelect(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = boundedContext(state.beatP ?? 0),
    model = sampleModel('select', state);
  const cueProgress = (id, beat = currentBeat) => {
    const windows = {
      'ce-core-source-fields': [0.08, 0.3],
      'ce-core-lock-negative': [0.32, 0.62],
      'ce-core-drop-lock': [0.65, 0.95],
    };
    return contextProgress(state, id, beat, ...(windows[id] ?? [0.08, 0.88]));
  };
  const paintPacket = () => {
    drawPacketFrame(ctx, api, 'SCHEMAS FOR THIS PHASE');
    drawPacketText(ctx, api, 'Current phase: ' + model.phase, 150, 270, 34, themeColors.yellow);
    const investigate = selectTools('investigate'),
      proposal = selectTools('propose'),
      q =
        currentBeat === 0
          ? cueProgress('ce-core-read-tools', 0)
          : currentBeat === 1
            ? cueProgress('select-proposal', 1)
            : 1;
    tools.forEach((name, i) => {
      const y = 385 + i * 110,
        was = investigate.includes(name),
        now = proposal.includes(name);
      let position;
      if (currentBeat === 0) position = was ? q : 0;
      else if (currentBeat === 1)
        position = was ? 1 - boundedContext(q / 0.45) : now ? boundedContext((q - 0.5) / 0.5) : 0;
      else position = 0;
      movePacketRow(
        ctx,
        api,
        name,
        'stable tool identity',
        [150, y],
        [1100, y],
        position,
        position === 1 ? themeColors.green : was || now ? themeColors.blue : themeColors.muted,
        640,
      );
    });
    if (currentBeat === 2) {
      drawPacketText(
        ctx,
        api,
        'Unknown phase → no exposed schemas',
        1060,
        940,
        30,
        themeColors.pink,
      );
      drawPacketFooter(
        ctx,
        api,
        'The backend rechecks action/resource permission for every execution. Schema visibility grants no authority.',
      );
    } else {
      drawPacketText(
        ctx,
        api,
        q === 1 ? 'Exposed schemas:2' : 'Assembling this call’s schema set',
        1060,
        940,
        29,
        q === 1 ? themeColors.green : themeColors.yellow,
      );
      drawPacketFooter(
        ctx,
        api,
        'Original two-tool investigation policy; the complete article policy is constructed in the later phase chapter.',
      );
    }
  };
  let staged = paintPacket;
  for (const id of PACKET_CONTEXT_TARGETS['select'] ?? []) {
    const next = staged;
    staged = () => drawPacketFocus(ctx, api, id, next);
  }
  drawPacketFocus(ctx, api, 'ce-core-select', staged);
  return true;
}
export default {
  id: 'select',
  draw: drawSelect,
  cues: [
    'select-beat-1-focus-1',
    'ce-core-read-tools',
    'select-proposal',
    'select-beat-2-focus-1',
    'select-beat-3-focus-1',
  ],
};
