import { freshQuantizationBudget } from '../arithmetic.mjs';
import { detailProgress, extraProgress, spokenProgress, spokenResult } from '../construction.mjs';
import { routingTrial } from '../routing-example.mjs';
import {
  drawDetailLine,
  drawDetailRectangle,
  drawDetailText,
  drawEarnedNumber,
  formatValue,
} from '../defaults.mjs';

function drawReleaseDecision(ctx, api, state) {
  const { C } = api;
  const restore = spokenProgress(state, 'restore-required-cache', 3, 0.01, 0.25);
  const cache = 3.875 + 0.125 * restore;
  const a = freshQuantizationBudget();
  const b = freshQuantizationBudget(cache);
  const min = routingTrial.minimumCorrect;
  const result = spokenResult(state, 'service-decision', 4, 0.01, 0.2);
  const showTaskGap = spokenResult(state, 'delivery-shortfall', 4, 0.12, 0.32);
  const showMemoryGap = spokenResult(state, 'memory-shortfall', 4, 0.34, 0.52);
  const budgetX = (gb) => 430 + (gb - 7.75) * 1400;
  api.focus.target('release-budget', () => {
    api.text(ctx, 'Device allocation', 365, 314, 46, C.ink);
    api.text(
      ctx,
      'A cache  4 GB      B cache  ' + Number(cache.toFixed(3)) + ' GB',
      365,
      380,
      32,
      C.muted,
    );
    for (const [gb, label] of [
      [7.75, '7.75'],
      [8, '8 GB limit'],
      [8.25, '8.25'],
    ]) {
      const x = budgetX(gb);
      for (const y of [545, 702]) {
        api.line(ctx, x, y - 34, x, y + 22, gb === 8 ? C.yellow : C.muted, gb === 8 ? 4 : 2);
      }
      api.text(ctx, label, x, 455, 31, gb === 8 ? C.yellow : C.muted, 'center');
    }
    for (const [i, total, color] of [
      [0, a.totalA, C.cyan],
      [1, b.totalB, C.pink],
    ]) {
      const y = 545 + 157 * i;
      const x = budgetX(total);
      api.text(ctx, i ? 'File B' : 'File A', 130, y + 14, 45, color);
      api.line(ctx, budgetX(7.75), y, budgetX(8.25), y, C.muted, 2);
      api.circle(ctx, x, y, 14, color);
      api.text(ctx, Number(total.toFixed(4)) + ' GB', x, y + 60, 34, color, 'center', 'mono');
    }
    if (showMemoryGap) {
      const limit = budgetX(b.capacity);
      const allocation = budgetX(b.totalB);
      api.line(ctx, limit, 667, allocation, 667, C.yellow, 4);
      api.line(ctx, allocation, 667, allocation, 690, C.yellow, 3);
      api.text(ctx, (b.totalB - b.capacity) * 1000 + ' MB over', (limit + allocation) / 2, 643, 34, C.yellow, 'center');
    }
  });
  api.focus.target('release-tasks', () => {
    api.text(ctx, 'Correct destinations', 1220, 314, 46, C.ink);
    api.text(ctx, 'Minimum  ' + min + ' / ' + routingTrial.requests, 1220, 380, 35, C.muted);
    api.text(
      ctx,
      routingTrial.fileA.correct + ' / ' + routingTrial.requests,
      1220,
      565,
      56,
      C.cyan,
      'left',
      'mono',
    );
    api.text(ctx, 'Untested', 1220, 718, 49, C.muted);
    if (showTaskGap)
      api.text(ctx, (min - routingTrial.fileA.correct) + ' deliveries short', 1220, 625, 35, C.yellow);
  });
  api.focus.target('release-verdict', () => {
    const meetsA = a.totalA <= a.capacity && routingTrial.fileA.correct >= min;
    const bOver = b.totalB > b.capacity;
    const verdict = result && !meetsA && bOver;
    api.text(
      ctx,
      verdict ? 'Hold both files' : 'Which file meets both requirements?',
      960,
      905,
      56,
      verdict ? C.ink : C.yellow,
      'center',
    );
  });
}

export function drawFreshQuantization(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0;
  if (beat >= 3) return drawReleaseDecision(ctx, api, state);
  const progress = detailProgress(state, 'fresh-quantization', beat);
  const body = () => {
    const input = beat === 2 ? extraProgress(state, 'fresh-cache-input', progress) : 0,
      consequence = beat === 2 ? extraProgress(state, 'fresh-cache-boundary', progress) : 0;
    const cache = beat === 2 ? 4 - 0.125 * consequence : 4,
      f = freshQuantizationBudget(cache),
      left = 460,
      scale = 1300 / 8.5;
    drawDetailText(
      ctx,
      api,
      'Parcel service   ·   6 billion weights   ·   8 GB of device memory',
      960,
      285,
      34,
      themeColors.ink,
      'center',
    );
    drawDetailText(
      ctx,
      api,
      'Other allocations  0.75 GB     ·     Cache at the required workload  4 GB     ·     Decimal GB',
      960,
      350,
      31,
      themeColors.muted,
      'center',
    );
    for (const [i, label, color] of [
      [0, 'A codes', themeColors.cyan],
      [1, 'B blocks', themeColors.pink],
      [2, 'scales', themeColors.yellow],
      [3, 'other', themeColors.blue],
      [4, 'cache', themeColors.muted],
    ]) {
      const x = 400 + i * 300;
      drawDetailRectangle(ctx, api, x - 70, 395, 28, 20, color);
      drawDetailText(ctx, api, label, x - 25, 414, 26, color);
    }
    for (const [i, label, weights, metadata, total, color] of [
      [0, 'A · group64', f.codes, f.scales, freshQuantizationBudget().totalA, themeColors.cyan],
      [1, 'B · Q4_K blocks', f.blockWeights, 0, f.totalB, themeColors.pink],
    ]) {
      const y = 470 + i * 230;
      drawDetailText(ctx, api, label, left - 30, y + 30, 31, color, 'right', 'mono');
      let x = left;
      drawDetailText(
        ctx,
        api,
        i === 0 ? '4-bit codes + 2-byte scale / 64 weights' : 'complete blocks · 4.5 bits / weight',
        left,
        y - 20,
        26,
        color,
      );
      const earned = beat > 1 || spokenResult(state, i ? 'fresh-b-total' : 'fresh-a-total', 1,
        i ? 0.7 : 0.34, i ? 0.88 : 0.53);
      const rowCache = i === 0 ? 4 : cache;
      const reserved = [[f.other, themeColors.blue], [rowCache, themeColors.muted]];
      const weightPieces = earned
        ? [[weights, color], [metadata, themeColors.yellow]]
        : [[f.capacity - f.other - rowCache, themeColors.panel]];
      for (const [amount, fill] of [...reserved, ...weightPieces]) {
        drawDetailRectangle(ctx, api, x, y, amount * scale, 80, fill);
        x += amount * scale;
      }
      const cost = (cue, value, start, end) =>
        earned || spokenResult(state, cue, 1, start, end) ? String(value) : '?';
      const weightTerms = i === 0
        ? cost('a-code-bytes', f.codes, 0, 0.10) + ' + ' + cost('a-scale-bytes', f.scales, 0.2, 0.32)
        : cost('b-block-bytes', f.blockWeights, 0.53, 0.7);
      const cacheTerm = i === 1 && consequence > 0 && consequence < 1 ? '…' : String(rowCache);
      drawDetailText(ctx, api, f.other + ' + ' + cacheTerm + ' + ' + weightTerms + '  =', left, y + 150,
        36, themeColors.ink, 'left', 'mono');
      const boundary = left + 8 * scale;
      drawDetailLine(ctx, api, boundary, y - 20, boundary, y + 110, themeColors.yellow, 4);
      drawEarnedNumber(
        ctx,
        api,
        formatValue(ctx, api, total) + ' GB',
        1470,
        y + 150,
        earned && (i === 0 || beat !== 2 || consequence === 0 || consequence === 1),
        color,
        42,
      );
    }
    if (beat === 0)
      drawDetailText(
        ctx,
        api,
        'Which file fits beside the required cache?',
        960,
        955,
        35,
        themeColors.yellow,
        'center',
      );
    else if (beat === 2)
      drawDetailText(
        ctx,
        api,
        consequence === 1
          ? 'B cache: 3.875 GB · exact boundary leaves no operating headroom'
          : input === 1
            ? 'Proposed B cache: 3.875 GB · ' +
              (consequence > 0
                ? 'applying the new allocation'
                : 'recompute the complete allocation')
            : 'Reducing B cache · new supplied amount pending',
        960,
        955,
        30,
        themeColors.yellow,
        'center',
      );
    else
      drawDetailText(
        ctx,
        api,
        'Equal “four-bit” labels can hide different allocated bytes',
        960,
        955,
        32,
        themeColors.ink,
        'center',
      );
  };
  let focused = body;
  for (let i = scene.beats.length - 1; i >= 0; i--) {
    const inner = focused;
    focused = () => api.focus.target(`${'fresh-quantization'}-state-${i}`, inner);
  }
  focused();
}
export default {
  id: 'fresh-quantization',
  draw: drawFreshQuantization,
  cues: [
    'fresh-quantization-build-0',
    'fresh-quantization-build-1',
    'a-code-bytes',
    'a-scale-bytes',
    'b-block-bytes',
    'fresh-a-total',
    'fresh-b-total',
    'fresh-quantization-build-2',
    'fresh-cache-input',
    'fresh-cache-boundary',
    'restore-required-cache',
    'apply-task-minimum',
    'service-decision',
    'delivery-shortfall',
    'memory-shortfall',
  ],
};
