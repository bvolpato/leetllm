import { alignedWriteState } from '../model.mjs';
import { text } from '../defaults.mjs';
import { landed, motion } from '../timing.mjs';

const early = alignedWriteState({ beat: 0, beatP: 0 });
const late = alignedWriteState({ beat: 1, beatP: 1 });

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  if (state.t < 0.35) ctx.globalAlpha = 1;

  const approach = Math.min(1, (state.t ?? 0.65) / 0.65);
  const firstLanding = 0.45 * approach + 0.55 * motion(state, 'first-write', 0, 0, 0.32);
  const waiting = motion(state, 'eighth-waiting', 1, 0.56, 0.74);
  const lastLanding = motion(state, 'eighth-share', 2, 0, 0.08);
  const left = 150, unit = 140, height = 116;

  text(ctx, api, 'Token’s first feature  ·  the other three stay at 0', left, 264, 39, C.ink);
  text(ctx, api, 'What share is new?', 1610, 264, 39, C.ink, 'center');

  function row(y, stream, label, dx, dy, showShare, streamTarget, tileTarget, shareTarget) {
    const width = stream.streamNorm * unit;
    const tileX = left + width + dx;
    const tileY = y - dy;
    text(ctx, api, label, left, y - 38, 38, C.muted);
    api.focus.target(streamTarget, () => {
      api.rect(ctx, left, y, width - 4, height, C.blue, undefined, 6);
      text(ctx, api, String(stream.streamNorm), left + width / 2, y + 82, 72, C.bg, 'center');
    });
    api.focus.target(tileTarget, () => {
      api.rect(ctx, tileX, tileY, unit - 4, height, C.cyan, undefined, 6);
      text(ctx, api, '+1', tileX + (unit - 4) / 2, tileY + 81, 65, C.bg, 'center');
    });
    api.focus.target(shareTarget, () => {
      const share = showShare ? `1 / ${stream.streamNorm + 1}` : '?';
      text(ctx, api, share, 1610, y + 90, 90, showShare ? C.cyan : C.muted, 'center');
    });
  }

  row(445, early, 'First write', 340 * (1 - firstLanding), 104 * (1 - firstLanding),
    landed(state, 'first-share', 0, 0.70, 0.83), 'initial-stream', 'first-write-tile', 'first-fraction');
  row(790, late, 'Eighth write', (62 - 32 * waiting) * (1 - lastLanding),
    (94 - 37 * waiting) * (1 - lastLanding), landed(state, 'eighth-share', 2, 0, 0.08),
    'late-stream', 'pending-write', 'last-fraction');
}

export default {
  id: 'intro', draw: drawIntro,
  cues: ['first-write', 'first-share', 'existing-stream', 'eighth-waiting', 'eighth-share'],
};
