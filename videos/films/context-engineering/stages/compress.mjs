import { PACKET_CONTEXT_TARGETS, allocations } from '../fixtures.mjs';
import { boundedContext, contextProgress, numberContext } from '../arithmetic.mjs';
import { sampleModel } from '../model.mjs';
import { drawPacketFocus, drawPacketFooter, drawPacketText } from '../defaults.mjs';
export function drawCompress(ctx, scene, state, api) {
  const modelState = sampleModel('compress', state),
    currentBeat = modelState.step;
  if (paintCompress(ctx, scene, state, api)) return;
}
function paintCompress(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = boundedContext(state.beatP ?? 0),
    model = sampleModel('compress', state);
  const cueProgress = (id, beat = currentBeat) => {
    const windows = {
      'ce-core-source-fields': [0.08, 0.3],
      'ce-core-lock-negative': [0.32, 0.62],
      'ce-core-drop-lock': [0.65, 0.95],
    };
    return contextProgress(state, id, beat, ...(windows[id] ?? [0.08, 0.88]));
  };
  const paintPacket = () => {
    drawPacketText(
      ctx,
      api,
      'Same six allocation owners · archive bulky material before excluding it',
      150,
      270,
      30,
      themeColors.muted,
    );
    const raw = model.raw,
      full = 1400,
      x = 180,
      y = 400,
      progress = currentBeat === 1 ? cueProgress('compress-beat-2-focus-2', 1) : 1,
      retained = currentBeat === 1 && progress < 1 ? raw : model.kept;
    let before = 0;
    allocations.forEach((item, i) => {
      const ww = (item.units / raw) * full,
        kept = model.items.some((r) => r.id === item.id),
        exit = kept ? 0 : currentBeat === 1 ? progress : 1,
        yy = y + (i === 3 ? 250 : 130) * exit;
      api.rect(
        ctx,
        x + (before / raw) * full,
        yy,
        ww,
        110,
        kept
          ? item.kind === 'findings'
            ? themeColors.green
            : themeColors.blue
          : themeColors.panel,
        kept ? themeColors.blue : themeColors.muted,
        1.5,
      );
      drawPacketText(
        ctx,
        api,
        item.id,
        150 + (i % 3) * 550,
        800 + Math.floor(i / 3) * 80,
        25,
        kept ? themeColors.ink : themeColors.muted,
      );
      drawPacketText(
        ctx,
        api,
        numberContext(item.units),
        150 + (i % 3) * 550,
        840 + Math.floor(i / 3) * 80,
        26,
        kept ? themeColors.cyan : themeColors.muted,
      );
      before += item.units;
    });
    drawPacketText(ctx, api, 'active allocation', 180, 365, 28, themeColors.cyan);
    drawPacketText(ctx, api, 'archive / excluded', 180, 695, 28, themeColors.muted);
    drawPacketFocus(ctx, api, 'compress-call-result-pair', () => {
      drawPacketText(
        ctx,
        api,
        'call-trace-17 → result.call_id=call-trace-17',
        180,
        960,
        27,
        themeColors.green,
        'left',
        'mono',
      );
    });
    drawPacketText(
      ctx,
      api,
      'Input ' + numberContext(retained) + ' · removed ' + numberContext(raw - retained),
      1060,
      960,
      29,
      themeColors.yellow,
    );
    drawPacketFooter(
      ctx,
      api,
      'Assigned token units. Retain checked findings, source references and valid call/result linkage.',
    );
  };
  let staged = paintPacket;
  for (const id of PACKET_CONTEXT_TARGETS['compress'] ?? []) {
    const next = staged;
    staged = () => drawPacketFocus(ctx, api, id, next);
  }
  drawPacketFocus(ctx, api, 'ce-core-compress', staged);
  return true;
}
export default {
  id: 'compress',
  draw: drawCompress,
  cues: [
    'compress-beat-1-focus-1',
    'compress-beat-2-focus-1',
    'compress-beat-2-focus-2',
    'compress-beat-3-focus-1',
  ],
};
