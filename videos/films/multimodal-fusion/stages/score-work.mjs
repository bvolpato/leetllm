import { clamp } from '../arithmetic.mjs';
import {
  drawExpandedBadge,
  drawExpandedBox,
  drawExpandedFooter,
  text as drawExpandedText,
} from '../defaults.mjs';
export function drawScoreWork(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cueProgress = (cue, fallback = progress) =>
    state.cues ? api.focus.progress(cue, fallback) : fallback;
  const full = cueProgress('mm-score-work-' + currentBeat),
    u = api.phase(full, 0.08, 0.82),
    done = (cue) => (state.cues ? cueProgress(cue, 0) >= 1 - 1e-8 : progress >= 0.95);
  api.focus.target('mm-score-work-construction', () => {
    const scale = 0.19,
      text = 2200 * scale,
      vis = 160 * scale,
      total = text + vis;
    drawExpandedText(
      ctx,
      api,
      'Same per-axis scale · matrix areas follow token dimensions',
      960,
      280,
      31,
      themeColors.muted,
      'center',
    );
    if (currentBeat === 0) {
      const x = 230,
        y = 380;
      drawExpandedBox(ctx, api, x, y, total, total, themeColors.blue);
      api.rect(ctx, x, y, text, text, themeColors.panel, themeColors.blue, 0);
      api.rect(ctx, x + text, y, vis, total, themeColors.pink, undefined, 0);
      api.rect(ctx, x, y + text, text, vis, themeColors.pink, undefined, 0);
      const scan = total * u;
      api.line(ctx, x, y + scan, x + total, y + scan, themeColors.yellow, 4);
      drawExpandedText(
        ctx,
        api,
        '2,360 key positions',
        x + total / 2,
        y - 28,
        28,
        themeColors.blue,
        'center',
      );
      drawExpandedText(ctx, api, '2,360 query positions', 1050, 430, 31, themeColors.blue);
      drawExpandedText(ctx, api, '2,200 text + 160 visual', 1050, 550, 31, themeColors.ink);
      if (done('mm-mixed-count'))
        drawExpandedText(ctx, api, '5,569,600 scores / head', 1050, 750, 37, themeColors.green);
    } else {
      const x = 170,
        y = 370;
      drawExpandedBox(ctx, api, x, y, text, text, themeColors.blue);
      drawExpandedText(
        ctx,
        api,
        'Text self-attention',
        x + text / 2,
        y - 24,
        29,
        themeColors.blue,
        'center',
      );
      const cx = 1020;
      drawExpandedBox(ctx, api, cx, y, vis, text, themeColors.pink);
      api.rect(ctx, cx, y, vis, text * u, themeColors.pink, undefined, 0);
      drawExpandedText(
        ctx,
        api,
        'Cross-attention',
        cx + 210,
        y - 24,
        29,
        themeColors.pink,
        'center',
      );
      drawExpandedText(ctx, api, '2,200 × 160', cx + 210, 510, 34, themeColors.pink, 'center');
      if (currentBeat > 1 || done('mm-cross-count'))
        drawExpandedText(ctx, api, '352,000 extra', cx + 310, 650, 34, themeColors.pink, 'center');
      if (currentBeat > 1 || done('mm-text-count'))
        drawExpandedText(ctx, api, '4,840,000', x + text / 2, 850, 34, themeColors.blue, 'center');
      if (currentBeat === 2)
        drawExpandedBadge(
          ctx,
          api,
          'Dense shape model · causal kernels and batching change execution',
        );
    }
    drawExpandedFooter(
      ctx,
      api,
      'Moving visual memory out of the prefix retains its projections, storage and configured reads.',
    );
  });
}
export default {
  id: 'score-work',
  draw: drawScoreWork,
  cues: [
    'mm-score-work-0',
    'mm-mixed-count',
    'mm-score-work-1',
    'mm-cross-count',
    'mm-text-count',
    'mm-score-work-2',
  ],
};
