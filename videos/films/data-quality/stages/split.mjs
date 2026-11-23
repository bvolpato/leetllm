import { releasedArtifact, splitHash } from '../fixtures.mjs';
import {
  drawOriginalCard,
  drawOriginalEquation,
  drawOriginalText,
  drawOriginalVisualFocus,
} from '../defaults.mjs';
export function drawSplit(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  {
    if (currentBeat < 2) {
      drawOriginalText(
        ctx,
        api,
        'SHA-256 input: versioned seed + ":" + conversation key',
        960,
        280,
        33,
        themeColors.muted,
      );
      drawOriginalText(ctx, api, 'GROUP', 340, 360, 28, themeColors.muted);
      drawOriginalText(ctx, api, 'FIRST 8 HEX DIGITS', 890, 360, 28, themeColors.muted);
      drawOriginalText(ctx, api, 'BUCKET', 1300, 360, 28, themeColors.muted);
      drawOriginalText(ctx, api, 'PARTITION', 1635, 360, 28, themeColors.muted);
      drawOriginalVisualFocus(ctx, api, 'split-simulation-45', () =>
        releasedArtifact.rows.forEach((row, i) => {
          const y = 400 + i * 145,
            trace = splitHash(row.conversation),
            color = [themeColors.yellow, themeColors.cyan, themeColors.pink][i];
          const a = drawOriginalVisualFocus(
            ctx,
            api,
            'split-object-row-conversation-row-id-46',
            () =>
              drawOriginalCard(
                ctx,
                api,
                row.conversation + ' · ' + row.id,
                145,
                y,
                color,
                390,
                95,
                1,
                32,
              ),
          );
          const q = currentBeat === 1 ? api.focus.progress('split-hash-operation') : 0;
          const h = drawOriginalCard(
            ctx,
            api,
            q > 0.2 ? trace.prefix : '?',
            650,
            y,
            color,
            480,
            95,
            1,
            43,
          );
          const k = drawOriginalCard(
            ctx,
            api,
            q > 0.6 ? String(trace.bucket) : '?',
            1210,
            y,
            color,
            170,
            95,
            1,
            43,
          );
          const dest = drawOriginalCard(
            ctx,
            api,
            q === 1 ? row.split : '?',
            1460,
            y,
            color,
            345,
            95,
            1,
            35,
          );
          api.connect(ctx, a, h, {
            color,
            width: 3,
            fromGap: 12,
            toGap: 12,
          });
          api.connect(ctx, h, k, {
            color,
            width: 3,
            fromGap: 12,
            toGap: 12,
          });
          api.connect(ctx, k, dest, {
            color,
            width: 3,
            fromGap: 12,
            toGap: 12,
          });
        }),
      );
      if (currentBeat === 1 && api.focus.progress('split-hash-operation') > 0.6)
        drawOriginalEquation(
          ctx,
          api,
          String.raw`b=\operatorname{int}_{16}(h[0{:}8])\bmod100`,
          960,
          925,
          46,
          themeColors.yellow,
        );
      drawOriginalText(
        ctx,
        api,
        '0–69 train · 70–84 validation · 85–99 test',
        960,
        1000,
        30,
        themeColors.muted,
      );
    } else {
      const a = drawOriginalVisualFocus(ctx, api, 'split-object-conversation-a-52', () =>
          drawOriginalCard(ctx, api, 'conversation A', 180, 430, themeColors.blue, 520, 100),
        ),
        bb = drawOriginalCard(ctx, api, 'conversation B', 180, 650, themeColors.pink, 520, 100),
        group = drawOriginalVisualFocus(ctx, api, 'split-object-same-incident-group-54', () =>
          drawOriginalCard(ctx, api, 'same incident group', 1100, 540, themeColors.green, 620, 110),
        );
      api.connect(ctx, a, group, {
        color: themeColors.blue,
        width: 4,
        fromGap: 15,
        toGap: 15,
      });
      api.connect(ctx, bb, group, {
        color: themeColors.pink,
        width: 4,
        fromGap: 15,
        toGap: 15,
      });
      drawOriginalText(
        ctx,
        api,
        'Choose the group key from the held-out claim',
        960,
        305,
        43,
        themeColors.ink,
      );
      drawOriginalText(
        ctx,
        api,
        'A future-traffic question also needs a time cutoff.',
        960,
        880,
        34,
        themeColors.yellow,
      );
    }
  }
}

// The executable Python article is authoritative. This illustrated subset covers its
// ASCII ticket fixture plus the explicitly demonstrated compatibility/sharp-s forms.
export default {
  id: 'split',
  draw: drawSplit,
  cues: [
    'split-beat-1-focus-1',
    'split-beat-1-focus-2',
    'split-beat-2-focus-1',
    'split-hash-operation',
    'split-beat-3-focus-1',
    'split-beat-3-focus-2',
  ],
};
