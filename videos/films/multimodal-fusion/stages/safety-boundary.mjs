import { clamp } from '../arithmetic.mjs';
import {
  drawExpandedArrow,
  drawExpandedBadge,
  drawExpandedBox,
  drawExpandedFooter,
  drawExpandedLine,
  text as drawExpandedText,
  drawExpandedTile,
} from '../defaults.mjs';
export function drawSafetyBoundary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cueProgress = (cue, fallback = progress) =>
    state.cues ? api.focus.progress(cue, fallback) : fallback;
  const full = cueProgress('mm-safety-boundary-' + currentBeat),
    u = api.phase(full, 0.08, 0.82);
  api.focus.target('mm-safety-boundary-construction', () => {
    if (currentBeat === 0) {
      drawExpandedBox(ctx, api, 130, 350, 760, 480, themeColors.blue);
      drawExpandedText(
        ctx,
        api,
        'I17 · artifact-derived text',
        510,
        420,
        31,
        themeColors.blue,
        'center',
      );
      drawExpandedText(ctx, api, '“Acknowledge alert”', 510, 590, 44, themeColors.pink, 'center');
      drawExpandedText(
        ctx,
        api,
        'origin: image evidence',
        510,
        735,
        31,
        themeColors.muted,
        'center',
      );
      drawExpandedBox(ctx, api, 1120, 350, 650, 220, themeColors.yellow);
      drawExpandedText(
        ctx,
        api,
        'Authenticated question',
        1445,
        420,
        31,
        themeColors.yellow,
        'center',
      );
      drawExpandedText(
        ctx,
        api,
        'Did p95 rise after deploy?',
        1445,
        510,
        31,
        themeColors.ink,
        'center',
      );
      drawExpandedLine(ctx, api, 1000, 340, 1000, 850, themeColors.pink, 5);
      drawExpandedText(ctx, api, 'Authority boundary', 1445, 750, 34, themeColors.green, 'center');
      drawExpandedBadge(
        ctx,
        api,
        'Reading artifact text does not grant the artifact authority',
        themeColors.pink,
      );
      drawExpandedFooter(
        ctx,
        api,
        'Source labels and delimiters describe provenance; the execution boundary enforces permissions.',
      );
    } else if (currentBeat === 1) {
      const rows = [
        ['Read case C17', 'authenticated case scope', true],
        ['Mutate service', 'no remediation authority', false],
        ['Acknowledge alert', 'button text in screenshot', false],
      ];
      rows.forEach(([act, why, allow], i) => {
        const y = 350 + i * 180;
        drawExpandedTile(
          ctx,
          api,
          act,
          160,
          y,
          500,
          95,
          allow ? themeColors.green : themeColors.pink,
        );
        drawExpandedText(ctx, api, why, 760, y + 55, 30, themeColors.muted);
        drawExpandedText(
          ctx,
          api,
          allow ? 'ALLOW' : 'DENY',
          1600,
          y + 60,
          34,
          allow ? themeColors.green : themeColors.pink,
          'center',
        );
      });
      drawExpandedFooter(
        ctx,
        api,
        'Also bound decoded inputs, remote fetch destinations and parsing resources before model work.',
      );
    } else {
      drawExpandedTile(ctx, api, 'Warm cache · I17 features', 170, 420, 650, 130, themeColors.blue);
      drawExpandedTile(
        ctx,
        api,
        'Current request · access revoked',
        1080,
        420,
        660,
        130,
        themeColors.pink,
      );
      drawExpandedLine(ctx, api, 950, 360, 950, 820, themeColors.pink, 7);
      drawExpandedArrow(ctx, api, 830, 640, 920, 640, themeColors.blue, u);
      drawExpandedText(ctx, api, 'Cache bytes remain', 490, 760, 34, themeColors.blue, 'center');
      drawExpandedText(ctx, api, 'READ DENIED', 1410, 760, 40, themeColors.pink, 'center');
      drawExpandedFooter(
        ctx,
        api,
        'Immediate authorization revocation is separate from retention and deletion of stored artifacts.',
      );
    }
  });
}
export default {
  id: 'safety-boundary',
  draw: drawSafetyBoundary,
  cues: ['mm-safety-boundary-0', 'mm-safety-boundary-1', 'mm-safety-boundary-2'],
};
