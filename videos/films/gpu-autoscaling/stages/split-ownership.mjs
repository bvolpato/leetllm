import { gaBound, gaComplete, gaProgress } from '../arithmetic.mjs';
import {
  drawGpuUpgradeArrow,
  drawGpuUpgradeBox,
  drawGpuUpgradeFoot,
  drawGpuUpgradeHead,
  drawGpuUpgradeL,
  drawGpuUpgradeText,
} from '../defaults.mjs';
export function drawSplitOwnership(ctx, scene, state, api) {
  const { C: upgradeColors, components: upgradeComponents } = api,
    currentBeat = state.beat ?? 0,
    progress = gaBound(state.beatP ?? 0);
  const q = (name, fallback = progress) => gaProgress(state, 'ga-' + name, fallback),
    done = (name, fallback = progress > 0.7) => gaComplete(state, 'ga-' + name, fallback);
  api.focus.target('split-ownership-mechanism', () => {
    const { C: delegatedColors, components: delegatedComponents } = api,
      delegatedBeat = state.beat ?? 0,
      delegatedProgress = gaBound(state.beatP ?? 0);
    {
      drawGpuUpgradeHead(
        ctx,
        api,
        upgradeColors,
        'R21 keeps its state while phase-specific workers change',
      );
      if (!delegatedBeat) {
        const pts = [
            ['decode pressure', 800, 90],
            ['short chat', 820, 44],
            ['policy surge', 2450, 93],
          ],
          x = (v) => 300 + v * 0.5,
          y = (v) => 900 - v * 5;
        drawGpuUpgradeL(ctx, api, upgradeColors, 250, 950, 1650, 950);
        drawGpuUpgradeL(ctx, api, upgradeColors, 250, 950, 250, 350);
        drawGpuUpgradeL(
          ctx,
          api,
          upgradeColors,
          x(1500),
          350,
          x(1500),
          950,
          delegatedColors.yellow,
        );
        drawGpuUpgradeL(ctx, api, upgradeColors, 250, y(60), 1650, y(60), delegatedColors.yellow);
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          'TTFT ms',
          1450,
          330,
          27,
          delegatedColors.muted,
        );
        drawGpuUpgradeText(ctx, api, upgradeColors, 'TPOT ms', 200, 320, 27, delegatedColors.muted);
        for (const [name, ttft, tpot] of pts) {
          const col = done('joint-service-gate')
            ? ttft <= 1500 && tpot <= 60
              ? delegatedColors.green
              : delegatedColors.pink
            : delegatedColors.blue;
          api.circle(ctx, x(ttft), y(tpot), 9, col);
          drawGpuUpgradeText(
            ctx,
            api,
            upgradeColors,
            name + ' ' + ttft + '/' + tpot,
            x(ttft),
            y(tpot) - 35,
            27,
            col,
            'center',
          );
        }
      } else {
        const cancelled = done('transfer-cancel', delegatedBeat > 1),
          move = q('transfer-ready', delegatedBeat > 1 ? 1 : delegatedProgress),
          ready = move >= 1 && !cancelled;
        drawGpuUpgradeBox(
          ctx,
          api,
          upgradeColors,
          upgradeComponents,
          cancelled ? 'prefill R21 released' : 'prefill owns R21',
          180,
          380,
          500,
          100,
          cancelled ? delegatedColors.muted : delegatedColors.blue,
        );
        drawGpuUpgradeBox(
          ctx,
          api,
          upgradeColors,
          upgradeComponents,
          cancelled ? 'decode R21 released' : ready ? 'decode owns R21' : 'decode awaits R21',
          1240,
          380,
          500,
          100,
          cancelled ? delegatedColors.muted : delegatedColors.cyan,
        );
        drawGpuUpgradeArrow(ctx, api, upgradeColors, 810, 675, 1170, 675, delegatedColors.cyan);
        if (!cancelled)
          for (let i = 0; i < 4; i++) {
            const x = 230 + 1010 * move + i * 130;
            drawGpuUpgradeBox(
              ctx,
              api,
              upgradeColors,
              upgradeComponents,
              'K' + i,
              x,
              620,
              100,
              75,
              delegatedColors.blue,
              25,
            );
            drawGpuUpgradeBox(
              ctx,
              api,
              upgradeColors,
              upgradeComponents,
              'V' + i,
              x,
              730,
              100,
              75,
              delegatedColors.pink,
              25,
            );
          }
        drawGpuUpgradeBox(
          ctx,
          api,
          upgradeColors,
          upgradeComponents,
          'R21 · tensor identity + receiving metadata',
          520,
          865,
          1170,
          75,
          delegatedColors.yellow,
          28,
        );
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          cancelled
            ? 'Cancellation stops use and releases both owners'
            : ready
              ? 'Compatible received state → consume'
              : 'Transfer in progress; decode waits',
          960,
          555,
          29,
          cancelled ? delegatedColors.pink : ready ? delegatedColors.green : delegatedColors.yellow,
          'center',
        );
      }
      drawGpuUpgradeFoot(
        ctx,
        api,
        upgradeColors,
        'Schematic tensor chunks; exposed handoff, backpressure and both owners’ cancellation belong to the comparison',
      );
    }
  });
}
export default {
  id: 'split-ownership',
  draw: drawSplitOwnership,
  cues: [
    'ga-split-ownership-b0',
    'ga-joint-service-gate',
    'ga-split-ownership-b1',
    'ga-transfer-ready',
    'ga-transfer-cancel',
    'ga-split-ownership-b2',
  ],
};
