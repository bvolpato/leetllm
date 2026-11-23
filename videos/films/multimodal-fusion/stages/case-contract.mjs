import { clamp } from '../arithmetic.mjs';
import {
  drawExpandedArrow,
  drawExpandedBadge,
  drawExpandedBox,
  drawExpandedChart,
  drawExpandedFooter,
  drawExpandedLine,
  text as drawExpandedText,
  drawExpandedTile,
} from '../defaults.mjs';
export function drawCaseContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cueProgress = (cue, fallback = progress) =>
    state.cues ? api.focus.progress(cue, fallback) : fallback;
  const full = cueProgress('mm-case-contract-' + currentBeat),
    u = api.phase(full, 0.08, 0.82);
  api.focus.target('mm-case-contract-construction', () => {
    if (currentBeat === 0) {
      drawExpandedChart(ctx, api, 120, 340, 700, 420);
      drawExpandedText(ctx, api, 'Case C17', 940, 327, 38, themeColors.ink);
      drawExpandedText(ctx, api, '14:02   Deployment record', 940, 467, 40, themeColors.yellow);
      drawExpandedText(ctx, api, '14:22   Bridge transcript T17', 940, 594, 40, themeColors.green);
      drawExpandedText(ctx, api, '“That started before the rollback.”', 940, 661, 36, themeColors.ink);
      drawExpandedText(ctx, api, 'Optional source recording A17', 940, 748, 28, themeColors.muted);
      drawExpandedBadge(ctx, api, 'Did p95 latency rise after the 14:02 deploy?');
    } else if (currentBeat === 1) {
      const rows = [
        ['Authenticated tenant', 'Ops'],
        ['Case identity', 'C17'],
        ['Immutable inputs', 'I17 / T17 / A17'],
        ['Stage identity', 'C17 + producer version'],
      ];
      rows.forEach(([k, v], i) => {
        const y = 330 + i * 125;
        drawExpandedText(ctx, api, k, 160, y + 45, 29, themeColors.muted);
        drawExpandedBox(ctx, api, 610, y, 570, 80, i === 0 ? themeColors.yellow : themeColors.cyan);
        drawExpandedText(ctx, api, v, 640, y + 49, 30, themeColors.ink);
        if (i <= Math.floor(u * 4))
          drawExpandedArrow(ctx, api, 1230, y + 40, 1400, y + 40, themeColors.green);
      });
      drawExpandedText(ctx, api, 'Question receipt', 1580, 350, 30, themeColors.green, 'center');
      ['grounded', 'partial', 'abstained', 'review'].forEach((s, i) =>
        drawExpandedText(
          ctx,
          api,
          s,
          1580,
          450 + i * 95,
          29,
          [themeColors.green, themeColors.yellow, themeColors.pink, themeColors.cyan][i],
          'center',
        ),
      );
      drawExpandedFooter(
        ctx,
        api,
        'Returned spans, regions and component versions stay attached to C17.',
      );
    } else {
      const stages = [
          ['Queue', 180],
          ['Read evidence', 490],
          ['Generate', 870],
          ['Validate', 1240],
        ],
        widths = [240, 310, 300, 330];
      stages.forEach(([name, x], i) => {
        const a = api.phase(u, i * 0.18, i * 0.18 + 0.35);
        drawExpandedBox(ctx, api, x, 480, widths[i], 120, themeColors.cyan);
        drawExpandedText(ctx, api, name, x + widths[i] / 2, 450, 29, themeColors.ink, 'center');
        api.rect(ctx, x + 8, 488, (widths[i] - 16) * a, 104, themeColors.blue, undefined, 0);
      });
      drawExpandedText(ctx, api, 'accepted question', 180, 690, 29, themeColors.yellow);
      drawExpandedText(ctx, api, 'validated answer', 1570, 690, 29, themeColors.green, 'right');
      drawExpandedLine(ctx, api, 180, 750, 1570, 750, themeColors.yellow, 4);
      drawExpandedBadge(ctx, api, 'Target: p95 < 3 seconds at 20 questions / second');
      drawExpandedFooter(
        ctx,
        api,
        'Illustrative product target · service times and queue headroom still need measurement.',
      );
    }
  });
}
export default {
  id: 'case-contract',
  draw: drawCaseContract,
  cues: ['mm-case-contract-0', 'mm-case-contract-1', 'mm-case-contract-2'],
};
