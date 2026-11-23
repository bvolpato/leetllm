import { EVENTS, RATE } from '../fixtures.mjs';
import { estimate } from '../arithmetic.mjs';
import { observationCue } from '../construction.mjs';
import {
  drawChapterText,
  drawHeading,
  drawRectangle,
  drawTable,
  withTarget,
} from '../defaults.mjs';
const request = EVENTS.find((event) => event.id === '206');

function drawCostEstimate(ctx, api, progress) {
  const { C } = api;
  const remainingDuplicate = request.cached - Math.round(request.cached * progress(0, 3));
  const uncached = request.input - request.cached;
  const chargedAsUncached = uncached + remainingDuplicate;
  const separateCache = progress(0, 2) > 0;
  const cost = estimate(request);
  const amount = (duplicate) => '$' + (cost + (duplicate * RATE.uncached) / 1e6).toFixed(6);
  const barX = 540,
    scale = 4.3;
  const rows = [
    ['Uncached input', chargedAsUncached, RATE.uncached, C.blue],
    ['Cache reads', request.cached, RATE.cached, C.cyan],
    ['Output', request.output, RATE.output, C.green],
  ];
  drawHeading(ctx, api, 'Request ' + request.id + '  /  local model  /  USD per million tokens');
  withTarget(ctx, api, 'disjoint-usage', () => {
    rows.forEach(([name, count, rate, color], i) => {
      const y = 366 + i * 136;
      drawChapterText(ctx, api, name, 140, y + 53, 40, C.ink);
      drawRectangle(ctx, api, barX, y, count * scale, 72, color, null);
      if (i === 0 && separateCache && remainingDuplicate > 0)
        drawRectangle(
          ctx,
          api,
          barX + uncached * scale,
          y,
          remainingDuplicate * scale,
          72,
          C.cyan,
          null,
        );
      drawChapterText(ctx, api, count + ' × $' + rate.toFixed(2), 1500, y + 50, 37, color);
    });
    drawChapterText(
      ctx,
      api,
      'Original estimate    ' + amount(request.cached),
      140,
      848,
      42,
      C.ink,
    );
    if (progress(0, 3) > 0) {
      const label = remainingDuplicate === 0 ? 'Corrected' : 'Repricing';
      drawChapterText(
        ctx,
        api,
        label + '    ' + amount(remainingDuplicate),
        984,
        848,
        42,
        C.yellow,
      );
    }
    if (progress(0, 5) > 0)
      drawChapterText(ctx, api, 'Rate card   ' + RATE.id, 140, 962, 30, C.muted);
  });
}

export function drawUsageContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    progress = (beat, n) => observationCue(state, 'usage-contract', beat, n),
    resultComplete = (beat, n) => progress(beat, n) === 1;
  {
    if (currentBeat === 0) {
      drawCostEstimate(ctx, api, progress);
    } else if (currentBeat === 1) {
      drawHeading(ctx, api, 'Reasoning tokens can be part of total output');
      withTarget(ctx, api, 'usage-validation', () => {
        drawRectangle(ctx, api, 140, 385, 1620, 110, themeColors.blue, null);
        drawChapterText(ctx, api, 'Total output', 170, 450, 32, themeColors.ink);
        if (progress(1, 2) > 0) {
          drawRectangle(ctx, api, 1280, 385, 480, 110, themeColors.cyan, null);
          drawChapterText(ctx, api, 'reasoning subset', 1300, 450, 28, themeColors.ink);
        }
        drawChapterText(
          ctx,
          api,
          'Check which output tokens the provider includes in its total.',
          140,
          580,
          30,
          themeColors.yellow,
        );
        if (progress(1, 4) > 0)
          drawTable(
            ctx,
            api,
            ['Counter / rate', 'Preserved outcome'],
            [
              ['cached 202 > total 201', 'reject usage measurement'],
              ['true / negative count', 'reject invalid type/value'],
              ['NaN / infinity rate', 'reject nonfinite rate'],
            ],
            140,
            660,
            [850, 770],
            80,
          );
      });
    } else {
      drawHeading(ctx, api, 'Five requests  /  one long cache hit');
      withTarget(ctx, api, 'cache-denominators', () => {
        const inputs = [1000, 10, 10, 10, 10],
          cache = [900, 0, 0, 0, 0];
        inputs.forEach((n, i) => {
          const y = 380 + i * 90;
          drawChapterText(ctx, api, 'R' + (i + 1), 140, y + 30, 26, themeColors.blue);
          drawRectangle(ctx, api, 240, y, n, 40, themeColors.blue, null);
          if (cache[i]) drawRectangle(ctx, api, 240, y, cache[i], 40, themeColors.cyan, null);
          drawChapterText(
            ctx,
            api,
            `input ${n} · cached ${cache[i]}`,
            1320,
            y + 30,
            27,
            themeColors.ink,
          );
        });
        if (resultComplete(2, 1))
          drawChapterText(
            ctx,
            api,
            'Cached-token fraction: 900 / 1040 = 86.54%',
            140,
            925,
            31,
            themeColors.cyan,
          );
        if (resultComplete(2, 3))
          drawChapterText(
            ctx,
            api,
            'Request hit criterion: cache > 0 → 1 / 5 = 20%',
            140,
            985,
            31,
            themeColors.yellow,
          );
      });
    }
  }
  return true;
}
export default {
  id: 'usage-contract',
  draw: drawUsageContract,
  cues: [
    'ob-usage-contract-1-1',
    'ob-usage-contract-1-2',
    'ob-usage-contract-1-3',
    'ob-usage-contract-1-4',
    'ob-usage-contract-1-5',
    'ob-usage-contract-2-1',
    'ob-usage-contract-2-2',
    'ob-usage-contract-2-3',
    'ob-usage-contract-2-4',
    'ob-usage-contract-2-5',
    'ob-usage-contract-3-1',
    'ob-usage-contract-3-2',
    'ob-usage-contract-3-3',
    'ob-usage-contract-3-4',
    'ob-usage-contract-3-5',
  ],
};
