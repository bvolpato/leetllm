import { cueMotion, visionCueStarted } from '../construction.mjs';
import { labeledId, nativeStrip, pixelStrip, proposedId, resizedStrip } from '../incident.mjs';

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const t = state.t ?? 0;
  const zoom = 1 - Math.pow(1 - api.clamp(t / 1.3), 2);
  const coarseUnit = 39 + 27 * zoom;
  const unit = 22;
  const x = 228;
  const open = cueMotion(state, 1, 'intro-magnify', 0, 0.2);
  const matched = state.beat === 2 && visionCueStarted(state.cues, 'intro-match', true);

  ctx.save();
  try {
    if (t < 0.35) ctx.globalAlpha = 1;
    api.focus.target('incident-screen', () => {
      api.rect(ctx, 104, 211, 1712, 373, '#273344', C.border, 1);
      api.rect(ctx, 104, 211, 1712, 99, '#432c38', undefined, 0);
      api.rect(ctx, 104, 211, 9, 99, C.red, undefined, 0);
      api.text(ctx, 'Deploy failed', 155, 277, 50, C.red);
      api.text(ctx, 'Full screenshot resized to 224 px', 1756, 274, 35, C.ink, 'right');
      // Keep the disputed glyph centered as the three sampled rows grow.
      const center = x + 32.5 * unit;
      pixelStrip(
        ctx,
        api,
        resizedStrip,
        center - (32.5 / 3) * coarseUnit,
        447 - 1.5 * coarseUnit,
        coarseUnit,
      );
      const halfGlyph = (2.5 / 3) * coarseUnit;
      const underGlyph = 447 + 1.5 * coarseUnit + 14;
      api.line(ctx, center - halfGlyph, underGlyph, center + halfGlyph, underGlyph, C.yellow, 5);
      if (state.beat === 0) api.text(ctx, 'f or 8?', center, 663, 58, C.yellow, 'center', 'mono');
      api.rect(ctx, 1428, 370, 306, 149, '#244e7a', C.blue, 2);
      api.text(ctx, 'Retry', 1581, 464, 61, C.ink, 'center');

      if (open > 0) {
        api.text(ctx, 'Native crop from the original', x, 645, 35, C.ink);
        pixelStrip(ctx, api, nativeStrip, x, 667, unit * open);
        if (open === 1) api.line(ctx, x + 30 * unit, 880, x + 35 * unit, 880, C.yellow, 5);
      }
    });
    api.focus.target('id-readings', () => {
      const y = 820 + 185 * open;
      for (const [i, reading] of [labeledId, proposedId].entries()) {
        const color = matched && i === 0 ? C.green : C.ink;
        api.text(ctx, reading, i ? 1370 : 560, y, 75, color, 'center', 'mono');
      }
    });
  } finally {
    ctx.restore();
  }
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-locate', 'intro-magnify', 'intro-match'],
};
