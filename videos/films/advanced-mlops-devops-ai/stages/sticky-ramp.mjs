import { releaseSentenceProgress } from '../construction.mjs';
import {
  drawReleaseBox,
  drawReleaseFooter,
  drawReleaseHeading,
  drawReleaseText,
} from '../defaults.mjs';
import { createHash } from 'node:crypto';
export function drawStickyRamp(ctx, scene, state, api) {
  if (paintStickyRamp(ctx, scene, state, api)) return;
}
function paintStickyRamp(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (beat, i = 0) => releaseSentenceProgress(state, 'sticky-ramp', beat, i);
  api.focus.target('sticky-ramp-construction', () => paintReleaseContent());
  return true;
  function paintReleaseContent() {
    drawReleaseHeading(ctx, api, 'Persist the resolved release when a conversation is created');
    const threshold = currentBeat === 0 ? 10 : currentBeat === 1 ? 10 + 15 * cueProgress(1, 2) : 25,
      left = 250,
      top = 340,
      size = 47,
      gap = 7;
    for (let i = 0; i < 100; i++) {
      const x = left + (i % 10) * (size + gap),
        y = top + Math.floor(i / 10) * (size + gap);
      api.rect(
        ctx,
        x,
        y,
        size,
        size,
        i < threshold ? themeColors.panel : themeColors.bg,
        i < threshold ? themeColors.cyan : themeColors.muted,
        1,
        3,
      );
      if (i === 0 || i === 14)
        drawReleaseText(
          ctx,
          api,
          i,
          x + size / 2,
          y + 33,
          25,
          i === 0 ? themeColors.cyan : themeColors.yellow,
          'center',
        );
    }
    drawReleaseText(
      ctx,
      api,
      'hash bucket < ' + threshold.toFixed(0) + '%',
      520,
      940,
      34,
      themeColors.cyan,
      'center',
    );
    const ids = ['region:us-west:conversation-1', 'region:us-west:conversation-2'];
    ids.forEach((s, i) => {
      const bucket = parseInt(createHash('sha256').update(s).digest('hex').slice(0, 8), 16) % 100;
      drawReleaseText(
        ctx,
        api,
        'conversation-' + (i + 1) + ' → ' + bucket,
        1250,
        400 + i * 230,
        34,
        i ? themeColors.cyan : themeColors.yellow,
        'center',
      );
      drawReleaseBox(
        ctx,
        api,
        i ? 'persisted CANDIDATE' : 'persisted CONTROL',
        970,
        480 + i * 230,
        630,
        90,
        i ? themeColors.cyan : themeColors.green,
        31,
      );
    });
    if (currentBeat === 1 && cueProgress(1, 2) > 0)
      drawReleaseText(
        ctx,
        api,
        'Stateless bucket 14 would move; its stored release stays fixed',
        1200,
        885,
        28,
        themeColors.pink,
        'center',
      );
    if (currentBeat === 2)
      drawReleaseFooter(
        ctx,
        api,
        'Subject fraction ≠ request fraction ≠ token fraction ≠ spend fraction',
      );
  }
}
export default {
  id: 'sticky-ramp',
  draw: drawStickyRamp,
  cues: [
    'sticky-ramp-b1',
    'sticky-ramp-s0-0',
    'sticky-ramp-s0-1',
    'sticky-ramp-s0-2',
    'sticky-ramp-b2',
    'sticky-ramp-s1-0',
    'sticky-ramp-s1-1',
    'sticky-ramp-s1-2',
    'sticky-ramp-s1-3',
    'sticky-ramp-b3',
    'sticky-ramp-s2-0',
    'sticky-ramp-s2-1',
    'sticky-ramp-s2-2',
    'sticky-ramp-s2-3',
  ],
};
