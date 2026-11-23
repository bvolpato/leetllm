import { clamp } from '../arithmetic.mjs';
import { cacheWorkAt } from '../model.mjs';
import {
  drawExpandedArrow,
  drawExpandedBadge,
  drawExpandedBox,
  drawExpandedFooter,
  drawExpandedLine,
  text as drawExpandedText,
  drawExpandedTile,
} from '../defaults.mjs';
export function drawCacheLifetime(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cueProgress = (cue, fallback = progress) =>
    state.cues ? api.focus.progress(cue, fallback) : fallback;
  const full = cueProgress('mm-cache-lifetime-' + currentBeat),
    u = api.phase(full, 0.08, 0.82),
    done = (cue) => (state.cues ? cueProgress(cue, 0) >= 1 - 1e-8 : progress >= 0.95);
  api.focus.target('mm-cache-lifetime-construction', () => {
    if (currentBeat === 0) {
      const modes = ['none', 'features', 'projected', 'kv'],
        mi = Math.min(3, Math.floor(u * 4)),
        mode = modes[mi],
        work = cacheWorkAt(mode);
      drawExpandedText(
        ctx,
        api,
        'Artifact boundary: ' + mode,
        960,
        300,
        36,
        themeColors.yellow,
        'center',
      );
      work.forEach((o, i) => {
        const x = 145 + i * 330;
        drawExpandedBox(
          ctx,
          api,
          x,
          470,
          290,
          180,
          o.required ? themeColors.cyan : themeColors.muted,
          o.required ? themeColors.panel : themeColors.bg,
        );
        drawExpandedText(
          ctx,
          api,
          o.name,
          x + 145,
          550,
          25,
          o.required ? themeColors.cyan : themeColors.muted,
          'center',
        );
        drawExpandedText(
          ctx,
          api,
          o.required ? 'runs' : 'already produced',
          x + 145,
          610,
          25,
          o.required ? themeColors.ink : themeColors.muted,
          'center',
        );
        if (!o.required) {
          drawExpandedLine(ctx, api, x + 30, 700, x + 260, 700, themeColors.green, 5);
          drawExpandedText(ctx, api, 'reuse', x + 145, 760, 27, themeColors.green, 'center');
        }
      });
      drawExpandedFooter(
        ctx,
        api,
        'Cells indicate work presence, not elapsed milliseconds. The compatible hit is an explicit premise.',
      );
    } else if (currentBeat === 1) {
      const parts = [
          {
            n: 100,
            label: 'system',
            c: themeColors.yellow,
          },
          {
            n: 160,
            label: 'image',
            c: themeColors.blue,
          },
          {
            n: 2000,
            label: 'transcript',
            c: themeColors.green,
          },
          {
            n: 100,
            label: 'new question',
            c: themeColors.pink,
          },
        ],
        scale = 0.6;
      let x = 210;
      parts.forEach((o, i) => {
        api.rect(ctx, x, 470, o.n * scale, 130, o.c, undefined, 0);
        drawExpandedText(
          ctx,
          api,
          o.label,
          i === 0 ? 240 : i === 1 ? 350 : i === 2 ? 1010 : 1685,
          420,
          25,
          o.c,
          'center',
        );
        x += o.n * scale;
      });
      drawExpandedText(
        ctx,
        api,
        'Shared evidence prefix',
        890,
        700,
        35,
        themeColors.cyan,
        'center',
      );
      if (done('mm-prefix-count'))
        drawExpandedText(ctx, api, '2,260 tokens', 890, 795, 43, themeColors.green, 'center');
      drawExpandedText(ctx, api, 'new suffix', 1670, 700, 29, themeColors.pink, 'center');
      drawExpandedBadge(ctx, api, 'Changed context BEFORE the image changes its causal KV');
      drawExpandedFooter(
        ctx,
        api,
        'Compatible block reuse still leaves new-question prefill and answer decode.',
      );
    } else {
      const rows = [
        ['Parent prefix', 'h₀'],
        ['This block', 'token IDs'],
        ['Producer identity', 'model / adapter / modality'],
        ['Isolation identity', 'trust-group salt'],
      ];
      rows.forEach(([k, v], i) => {
        const y = 350 + i * 135;
        drawExpandedText(ctx, api, k, 170, y + 45, 30, themeColors.muted);
        drawExpandedTile(
          ctx,
          api,
          v,
          690,
          y,
          760,
          80,
          i === 0 ? themeColors.yellow : themeColors.cyan,
        );
        if (i < 3) drawExpandedLine(ctx, api, 1070, y + 80, 1070, y + 130, themeColors.cyan, 3);
      });
      drawExpandedText(ctx, api, 'block hash', 1640, 630, 36, themeColors.green, 'center');
      drawExpandedArrow(ctx, api, 1480, 650, 1560, 650, themeColors.green, u);
      drawExpandedFooter(
        ctx,
        api,
        'November 2026 vLLM design: complete blocks, preceding context and extra identities.',
      );
    }
  });
}
export default {
  id: 'cache-lifetime',
  draw: drawCacheLifetime,
  cues: ['mm-cache-lifetime-0', 'mm-cache-lifetime-1', 'mm-prefix-count', 'mm-cache-lifetime-2'],
};
