import { clamp } from '../arithmetic.mjs';
import {
  drawExpandedBadge,
  drawExpandedChart,
  drawExpandedFooter,
  drawExpandedLine,
  text as drawExpandedText,
  drawExpandedTile,
} from '../defaults.mjs';
export function drawDiagnosisRelease(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cueProgress = (cue, fallback = progress) =>
    state.cues ? api.focus.progress(cue, fallback) : fallback;
  const full = cueProgress('mm-diagnosis-release-' + currentBeat),
    u = api.phase(full, 0.08, 0.82),
    done = (cue) => (state.cues ? cueProgress(cue, 0) >= 1 - 1e-8 : progress >= 0.95);
  api.focus.target('mm-diagnosis-release-construction', () => {
    if (currentBeat === 0) {
      const rows = [
        ['Helpfulness', 0.91, 0.85, themeColors.green],
        ['OCR', 0.72, 0.9, themeColors.pink],
        ['Region IoU', 0.68, 0.65, themeColors.cyan],
      ];
      rows.forEach(([name, value, limit, col], i) => {
        const y = 400 + i * 170;
        drawExpandedText(ctx, api, name, 180, y, 32, themeColors.ink);
        const width = 1000,
          amount = u * value;
        api.rect(ctx, 520, y - 50, width * amount, 70, col, undefined, 0);
        drawExpandedLine(
          ctx,
          api,
          520 + width * limit,
          y - 70,
          520 + width * limit,
          y + 40,
          themeColors.yellow,
          4,
        );
        drawExpandedText(
          ctx,
          api,
          '≥ ' + limit.toFixed(2),
          1680,
          y,
          30,
          themeColors.yellow,
          'center',
        );
        drawExpandedText(ctx, api, (value * u).toFixed(2), 430, y, 30, col, 'center');
      });
      drawExpandedBadge(
        ctx,
        api,
        done('mm-ocr-block') ? 'Hold the release   ·   OCR 0.72 < 0.90' : 'Compare each score with its threshold.',
        done('mm-ocr-block') ? themeColors.pink : themeColors.yellow,
      );
    } else if (currentBeat === 1) {
      const values = ['missing', 'NaN', 'true', '0.72'];
      values.forEach((s, i) => {
        const x = 170 + i * 420;
        drawExpandedTile(ctx, api, s, x, 400, 330, 95, themeColors.pink);
        drawExpandedText(ctx, api, 'required OCR', x + 165, 640, 30, themeColors.muted, 'center');
        drawExpandedText(ctx, api, 'BLOCK', x + 165, 780, 38, themeColors.pink, 'center');
      });
      drawExpandedFooter(
        ctx,
        api,
        'Enumerate required keys, then enforce ordinary numeric type, finite range and each metric’s own bar.',
      );
    } else {
      drawExpandedChart(ctx, api, 150, 350, 680, 450);
      drawExpandedText(
        ctx,
        api,
        'Frozen-case rerun required',
        1300,
        390,
        37,
        themeColors.yellow,
        'center',
      );
      drawExpandedText(ctx, api, 'Resolution / crop', 1300, 520, 32, themeColors.blue, 'center');
      drawExpandedText(
        ctx,
        api,
        'Connector / retained detail',
        1300,
        630,
        32,
        themeColors.cyan,
        'center',
      );
      drawExpandedText(
        ctx,
        api,
        'Semantic claim support',
        1300,
        740,
        32,
        themeColors.green,
        'center',
      );
      drawExpandedBadge(ctx, api, 'Compare the recovered label with the original.', themeColors.yellow);
      drawExpandedFooter(
        ctx,
        api,
        'Use the same labeled charts to measure the effect of the change.',
      );
    }
  });
}
export default {
  id: 'diagnosis-release',
  draw: drawDiagnosisRelease,
  cues: [
    'mm-diagnosis-release-0',
    'mm-ocr-block',
    'mm-diagnosis-release-1',
    'mm-diagnosis-release-2',
  ],
};
