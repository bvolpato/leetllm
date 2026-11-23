import { sampleSlimeChapter } from '../construction.mjs';
import {
  drawSlimeBrace,
  drawSlimeNote,
  drawSlimeRule,
  drawSlimeText,
  drawSlimeTile,
  drawSlimeTitle,
} from '../defaults.mjs';
export function drawBundleMap(ctx, scene, state, api) {
  return api.focus.target('sl-bundle-map-mechanism', () => paintBundleMap(ctx, scene, state, api));
}
function paintBundleMap(ctx, scene, state, api) {
  const modelState = sampleSlimeChapter('bundle-map', state),
    currentBeat = modelState.b;
  const { C: themeColors } = api;
  {
    drawSlimeTitle(ctx, api, 'Map logical ranks onto actual reserved slots');
    const mode = modelState.mode,
      x0 = 195,
      pitch = 154;
    drawSlimeText(
      ctx,
      api,
      mode === 0
        ? 'decoupled · actor then rollout'
        : mode === 1
          ? 'colocated · reused reservation'
          : 'external engines · actor reservation only',
      960,
      370,
      33,
      themeColors.yellow,
      'center',
    );
    for (let i = 0; i < 10; i++) {
      const actor = i < 4,
        reserved = i < modelState.count,
        color = !reserved ? themeColors.muted : actor ? themeColors.blue : themeColors.cyan;
      drawSlimeTile(ctx, api, i, x0 + i * pitch, 450, 134, color, 95, 36);
      if (reserved)
        drawSlimeText(
          ctx,
          api,
          actor ? `A${i}` : `R${i - (mode === 0 ? 4 : 0)}`,
          x0 + i * pitch + 67,
          600,
          28,
          color,
          'center',
        );
    }
    drawSlimeBrace(
      ctx,
      api,
      x0,
      x0 + 4 * pitch - 20,
      650,
      'actor: 2 nodes × 2 GPUs',
      themeColors.blue,
    );
    if (mode === 0)
      drawSlimeBrace(
        ctx,
        api,
        x0 + 4 * pitch,
        x0 + 10 * pitch - 20,
        650,
        '6 rollout GPUs',
        themeColors.cyan,
      );
    if (mode === 1)
      drawSlimeBrace(
        ctx,
        api,
        x0,
        x0 + 6 * pitch - 20,
        750,
        'actor / rollout reuse the larger range',
        themeColors.cyan,
      );
    if (mode === 2)
      drawSlimeTile(
        ctx,
        api,
        modelState.placeholder
          ? 'placeholder: reserve slots; create no engine'
          : 'external rollout: separately managed engines',
        580,
        755,
        1130,
        themeColors.yellow,
        85,
        30,
      );
    drawSlimeRule(
      ctx,
      api,
      modelState.countReady
        ? `${modelState.count} total reserved slots · rollout offset ${modelState.offset}`
        : 'Resolve the branch before totaling its reserved range',
      935,
      themeColors.cyan,
      34,
    );
    drawSlimeNote(
      ctx,
      api,
      'Reservation and rank placement do not establish simultaneous live-memory fit',
    );
    return;
  }
}
export default {
  id: 'bundle-map',
  draw: drawBundleMap,
  cues: [
    'sl-bundle-map-b0-operation',
    'sl-bundle-map-b0-s0',
    'sl-bundle-map-b0-s1',
    'sl-bundle-map-b0-s2',
    'sl-bundle-map-b1-operation',
    'sl-bundle-map-b1-s0',
    'sl-bundle-map-b1-s1',
    'sl-bundle-map-b1-s2',
    'sl-bundle-map-b1-s3',
    'sl-bundle-map-b2-operation',
    'sl-bundle-map-b2-s0',
    'sl-bundle-map-b2-s1',
    'sl-bundle-map-b2-s2',
    'sl-bundle-map-b2-s3',
  ],
};
