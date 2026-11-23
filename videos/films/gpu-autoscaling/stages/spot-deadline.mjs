import { gaBound, gaComplete } from '../arithmetic.mjs';
import {
  drawGpuUpgradeFoot,
  drawGpuUpgradeHead,
  drawGpuUpgradeL,
  drawGpuUpgradeText,
} from '../defaults.mjs';
export function drawSpotDeadline(ctx, scene, state, api) {
  const { C: upgradeColors, components: upgradeComponents } = api,
    currentBeat = state.beat ?? 0,
    progress = gaBound(state.beatP ?? 0);
  const done = (name, fallback = progress > 0.7) => gaComplete(state, 'ga-' + name, fallback);
  api.focus.target('spot-deadline-mechanism', () => {
    const { C: delegatedColors, components: delegatedComponents } = api,
      delegatedBeat = state.beat ?? 0,
      delegatedProgress = gaBound(state.beatP ?? 0);
    {
      const short = delegatedBeat === 2,
        budget = short ? 10 : 100,
        visible = done(short ? 'short-warning' : 'drain-budget', delegatedBeat === 1);
      drawGpuUpgradeHead(ctx, api, upgradeColors, 'Earliest shutdown deadline − cleanup reserve');
      drawGpuUpgradeText(
        ctx,
        api,
        upgradeColors,
        short ? '30 s warning − 20 s cleanup' : '120 s warning − 20 s cleanup',
        960,
        385,
        35,
        delegatedColors.yellow,
        'center',
      );
      for (const [estimate, i] of [12, 84, 170].map((v, i) => [v, i])) {
        const y = 500 + i * 135;
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          'R' + (i + 1),
          200,
          y + 35,
          31,
          delegatedColors.blue,
        );
        api.rect(ctx, 400, y, estimate * 6, 55, delegatedColors.panel, delegatedColors.muted, 1);
        if (visible)
          api.rect(
            ctx,
            400,
            y,
            estimate * 6,
            55,
            estimate <= budget ? delegatedColors.cyan : delegatedColors.pink,
          );
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          estimate + ' s estimate',
          1500,
          y + 35,
          29,
          delegatedColors.ink,
        );
      }
      if (visible) {
        drawGpuUpgradeL(
          ctx,
          api,
          upgradeColors,
          400 + budget * 6,
          465,
          400 + budget * 6,
          900,
          delegatedColors.yellow,
          4,
        );
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          budget + ' s usable',
          960,
          960,
          34,
          delegatedColors.yellow,
          'center',
        );
      }
      drawGpuUpgradeFoot(
        ctx,
        api,
        upgradeColors,
        'Unstreamed work may retry within its original budget; partial streams need explicit interruption/resumption',
      );
    }
  });
}
export default {
  id: 'spot-deadline',
  draw: drawSpotDeadline,
  cues: [
    'ga-spot-deadline-b0',
    'ga-drain-budget',
    'ga-spot-deadline-b1',
    'ga-spot-deadline-b2',
    'ga-short-warning',
  ],
};
