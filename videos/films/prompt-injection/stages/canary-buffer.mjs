import { cueBegun } from '../arithmetic.mjs';
import { promptCueSnapshot } from '../construction.mjs';
import { drawPromptCard, drawPromptCells, drawPromptText } from '../defaults.mjs';
export function drawCanaryBuffer(ctx, scene, state, api) {
  return paintCanaryBuffer(ctx, scene, state, api);
}
function paintCanaryBuffer(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = promptCueSnapshot('canary-buffer', state),
    {
      b: currentBeat,
      progress: sentenceProgress,
      P: cueProgress,
      D: resultComplete,
    } = modelState;
  const withMechanismFocus = (paint) => api.focus.target('pi-canary-buffer-mechanism', paint);
  withMechanismFocus(() => {
    const marker = 'CANARY_REDTEAM_NOTES_8f3b2a9c1d0e',
      chunks = [marker.slice(0, 3), marker.slice(3)],
      joined = chunks.join(''),
      individual = chunks.map((x) => x.includes(marker)),
      assembled = joined.includes(marker);
    if (currentBeat === 2) {
      const text = (value, x, y, size, color) => drawPromptText(ctx, api, value, x, y, size, color);
      text('Buffered reply', 180, 349, 45, themeColors.ink);
      api.rect(ctx, 180, 404, 857, 232, themeColors.panel, themeColors.yellow, 10);
      text('Marker from private notes', 218, 482, 31, themeColors.yellow);
      text(joined, 218, 569, 34, themeColors.ink);
      text('Recipient', 1396, 349, 45, themeColors.ink);
      api.line(ctx, 1060, 520, 1328, 520, themeColors.muted, 3);
      const stop = 1083 + 211 * cueProgress('pi-canary-buffer-2');
      api.rect(ctx, stop - 20, 496, 40, 48, themeColors.yellow, undefined, 3);
      api.line(ctx, 1328, 445, 1328, 595, themeColors.pink, 9);
      if (assembled && resultComplete('pi-canary-buffer-2')) {
        text('Reply held for review', 180, 786, 47, themeColors.pink);
        text('0 bytes sent', 1396, 541, 47, themeColors.ink);
      }
      return;
    }
    if (currentBeat === 0) {
      drawPromptText(ctx, api, 'Marker planted in private notes', 180, 320, 32, themeColors.blue);
      drawPromptText(
        ctx,
        api,
        marker,
        180,
        430,
        32,
        themeColors.yellow,
      );
      drawPromptText(
        ctx,
        api,
        'Random bytes in a fresh marker',
        180,
        610,
        29,
        themeColors.ink,
      );
      const count = Math.floor(16 * sentenceProgress);
      drawPromptCells(
        ctx,
        api,
        Array.from(
          {
            length: 16,
          },
          (_, i) => (i < count ? '8' : '·'),
        ),
        180,
        665,
        {
          size: 72,
          gap: 17,
          color: themeColors.cyan,
        },
      );
      drawPromptText(
        ctx,
        api,
        resultComplete('canary-bits') ? '16 bytes × 8 bits = 128 bits' : '8 bits per byte',
        960,
        870,
        37,
        themeColors.cyan,
        'center',
      );
    } else {
      const crossing = cueBegun(state.cues, 'pi-canary-cross', sentenceProgress > 0.7),
        hit = resultComplete('pi-canary-hit', sentenceProgress > 0.35);
      if (!crossing) {
        const payload = hit ? 'notes: CANARY_REDTEAM_NOTES_8f3b2a9c1d0e' : 'C17 accuracy: 0.91';
        drawPromptText(
          ctx,
          api,
          hit
            ? 'Complete supplied response · before release'
            : 'Ordinary supplied summary · before release',
          180,
          310,
          31,
          themeColors.blue,
        );
        drawPromptCard(
          ctx,
          api,
          payload,
          180,
          430,
          1580,
          hit ? themeColors.yellow : themeColors.blue,
          115,
          30,
        );
        const found = payload.includes('CANARY_REDTEAM_NOTES_8f3b2a9c1d0e');
        drawPromptCard(
          ctx,
          api,
          found ? 'Exact marker found → hold payload' : 'No exact marker in this summary',
          180,
          735,
          1580,
          found ? themeColors.pink : themeColors.cyan,
          95,
          31,
        );
      } else {
        drawPromptText(
          ctx,
          api,
          'Separate chunking case · same marker',
          180,
          310,
          31,
          themeColors.blue,
        );
        drawPromptCard(ctx, api, chunks[0], 180, 390, 350, themeColors.yellow, 95, 32);
        drawPromptCard(ctx, api, chunks[1], 620, 390, 1140, themeColors.yellow, 95, 29);
        drawPromptText(
          ctx,
          api,
          'Independent exact-match scans: ' + individual.join(' / '),
          180,
          565,
          29,
          themeColors.muted,
        );
        const scan = cueProgress('pi-canary-cross'),
          complete = resultComplete('pi-canary-cross', sentenceProgress > 0.9);
        drawPromptText(
          ctx,
          api,
          complete ? 'Pre-release assembled buffer' : 'Assembling buffer before scanning',
          180,
          705,
          29,
          themeColors.cyan,
        );
        drawPromptText(
          ctx,
          api,
          joined.slice(0, Math.floor(joined.length * scan)),
          180,
          790,
          33,
          themeColors.ink,
        );
        if (complete && assembled)
          drawPromptCard(
            ctx,
            api,
            'Exact marker found → hold payload before release',
            180,
            875,
            1580,
            themeColors.pink,
            85,
            30,
          );
      }
    }
  });
}
export default {
  id: 'canary-buffer',
  draw: drawCanaryBuffer,
  cues: [
    'pi-canary-buffer-0',
    'canary-bits',
    'pi-canary-buffer-1',
    'pi-canary-hit',
    'pi-canary-cross',
    'pi-canary-buffer-2',
  ],
};
