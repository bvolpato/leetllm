import { cueMotion, visionCueStarted } from '../construction.mjs';
import { incidentScreen, nativeStrip, pixelStrip, resizedStrip } from '../incident.mjs';

export function drawProcessorEvidence(ctx, scene, state, api) {
  const { C } = api;
  const reduced = cueMotion(state, 0, 'processor-resize', 0.3, 0.7);
  const crop = cueMotion(state, 1, 'processor-crop', 0.02, 0.3);
  api.focus.target('processor-source', () => {
    api.text(ctx, 'Source  ·  672 × 378 pixels', 100, 282, 37, C.ink);
    incidentScreen(ctx, api, 100, 351, 1.22, { crop: crop > 0, locate: true });
    if (crop > 0) api.text(ctx, '224 × 224 native crop', 915, 875, 32, C.yellow, 'right');
  });
  api.focus.target('sampled-id', () => {
    api.text(ctx, 'Full screenshot', 1065, 279, 40, C.ink);
    const pixelSize = 12 * (1 - (2 * reduced) / 3);
    // Keep the aperture on the same characters while the full frame shrinks.
    if (reduced < 1) pixelStrip(ctx, api, nativeStrip, 1065, 345, pixelSize);
    else pixelStrip(ctx, api, resizedStrip, 1065, 345, 12);
    api.text(
      ctx,
      reduced === 1 ? '224 px wide   ·   3 rows of text pixels' : '9 source rows',
      1065,
      523,
      33,
      C.cyan,
    );
    if (crop > 0) {
      api.text(ctx, 'Native crop around Retry', 1065, 656, 40, C.ink);
      pixelStrip(ctx, api, nativeStrip, 1065, 710, 12);
      api.text(ctx, '224 px wide   ·   9 rows of text pixels', 1065, 888, 33, C.yellow);
    }
  });
  if (state.beat >= 1) {
    let note = 'Both strips shown at the same magnification';
    if (state.beat === 2) {
      const started = (id, at) => visionCueStarted(state.cues, id, state.beatP >= at);
      if (started('processor-unreadable', 0.92))
        note = 'If both views are unreadable, leave the lookup open.';
      else if (started('processor-check-model', 0.69))
        note = 'Clear input, wrong letter  →  check the encoder, bridge and decoder';
      else if (started('processor-check-resize', 0.54))
        note = 'Only the native crop reads correctly  →  check the resize';
    }
    api.text(ctx, note, 960, 999, 32, C.muted, 'center');
  }
}
export default {
  id: 'processor-evidence',
  draw: drawProcessorEvidence,
  cues: [
    'processor-resize',
    'processor-crop',
    'processor-check',
    'processor-check-resize',
    'processor-check-model',
    'processor-unreadable',
  ],
};
