import { completed, opProgress } from '../construction.mjs';
import {
  drawConstructionArrow,
  drawConstructionBox,
  drawConstructionEquation,
  drawConstructionFocus,
  drawConstructionFooter,
  drawConstructionGrid,
  drawConstructionRows,
  drawConstructionText,
  drawConstructionTitle,
} from '../defaults.mjs';
export function drawProductLanes(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = opProgress(state, 'product-lanes'),
    done = (name) => completed(state, name);
  {
    drawConstructionTitle(
      ctx,
      api,
      currentBeat === 0
        ? 'One tenant request owns its route and deadline'
        : currentBeat === 1
          ? 'Count predictions before sizing the workers'
          : 'Capacity planning does not measure tail latency',
    );
    if (currentBeat === 0) {
      drawConstructionGrid(
        ctx,
        api,
        [
          ['Request', 'Tenant + key', 'Prompt / negative', 'Dimensions'],
          ['Route', 'Variants / steps', 'Seed / versions', 'Deadline'],
        ],
        180,
        385,
        1560,
        190,
        themeColors.blue,
        27,
      );
      const labels = ['Admit', 'Queue + reserve', 'Generate', 'Check', 'Release'];
      labels.forEach((v, i) => {
        drawConstructionBox(
          ctx,
          api,
          v,
          170 + i * 345,
          760,
          300,
          i <= Math.floor(progress * 5) ? themeColors.cyan : themeColors.muted,
          100,
          27,
        );
        if (i < 4) drawConstructionArrow(ctx, api, 485 + i * 345, 810, 505 + i * 345, 810);
      });
      drawConstructionFooter(
        ctx,
        api,
        'Preview p95 < 2 s · quality complete/review/failed ≤ 30 s · separate human deadline',
      );
    } else if (currentBeat === 1) {
      drawConstructionGrid(
        ctx,
        api,
        [
          ['Route', 'Jobs/s', 'Variants', 'Steps', 'Predictions/step'],
          ['Preview', '20', '4', '6', '1'],
          ['Quality', '2', '4', '50', '2'],
        ],
        180,
        390,
        1560,
        270,
        themeColors.blue,
        28,
      );
      drawConstructionFocus(ctx, api, 'df-product-preview', () =>
        drawConstructionBox(
          ctx,
          api,
          done('preview-count') ? 'Preview: 480 predictions/s' : 'Preview work ?',
          180,
          790,
          700,
          done('preview-count') ? themeColors.cyan : themeColors.yellow,
          110,
          33,
        ),
      );
      drawConstructionFocus(ctx, api, 'df-product-quality', () =>
        drawConstructionBox(
          ctx,
          api,
          done('quality-count') ? 'Quality: 800 predictions/s' : 'Quality work ?',
          1040,
          790,
          700,
          done('quality-count') ? themeColors.pink : themeColors.yellow,
          110,
          33,
        ),
      );
    } else {
      drawConstructionRows(
        ctx,
        api,
        [
          ['Matched worker service', '120 predictions/s'],
          ['Planning ceiling', '0.75 × 120 = 90 predictions/s'],
        ],
        375,
        155,
      );
      drawConstructionFocus(ctx, api, 'df-product-workers', () => {
        drawConstructionEquation(
          ctx,
          api,
          done('preview-workers')
            ? String.raw`\lceil480/90\rceil=6`
            : String.raw`\lceil480/90\rceil=?`,
          960,
          790,
          55,
        );
        drawConstructionText(
          ctx,
          api,
          'Queue limits + real reservations + compatible batches',
          960,
          935,
          31,
          themeColors.cyan,
          'center',
        );
      });
    }
    return;
  }
}
export default {
  id: 'product-lanes',
  draw: drawProductLanes,
  cues: [
    'df-product-lanes-0',
    'df-product-lanes-1',
    'df-preview-count',
    'df-quality-count',
    'df-product-lanes-2',
    'df-preview-workers',
  ],
};
