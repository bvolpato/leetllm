import { gaBound, gaComplete } from '../arithmetic.mjs';
import { afterClause } from '../timing.mjs';
import {
  drawGpuUpgradeBox,
  drawGpuUpgradeFoot,
  drawGpuUpgradeHead,
  drawGpuUpgradeL,
  drawGpuUpgradeText,
} from '../defaults.mjs';
export function drawBurstRate(ctx, scene, state, api) {
  const { C: upgradeColors, components: upgradeComponents } = api,
    currentBeat = state.beat ?? 0,
    progress = gaBound(state.beatP ?? 0);
  const done = (name, fallback = progress > 0.7) => gaComplete(state, 'ga-' + name, fallback);
  api.focus.target('burst-rate-mechanism', () => {
    const { C: delegatedColors, components: delegatedComponents } = api,
      delegatedBeat = state.beat ?? 0,
      delegatedProgress = gaBound(state.beatP ?? 0);
    {
      drawGpuUpgradeHead(
        ctx,
        api,
        upgradeColors,
        delegatedBeat
          ? 'One warm replica, five slots; finite hundred-request burst'
          : 'Five matching slots × one completion per ten seconds',
      );
      if (delegatedBeat === 0) {
        for (let i = 0; i < 5; i++)
          drawGpuUpgradeBox(
            ctx,
            api,
            upgradeColors,
            upgradeComponents,
            'R' + (i + 1) + ' · 10 s',
            220 + i * 310,
            460,
            260,
            130,
            delegatedColors.cyan,
            29,
          );
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          '5 / 10 = 0.5 requests/s per replica',
          960,
          750,
          38,
          delegatedColors.green,
          'center',
        );
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          '20 replicas: 100 concurrent slots; 10 requests/s',
          960,
          895,
          34,
          delegatedColors.blue,
          'center',
        );
      } else {
        drawGpuUpgradeL(ctx, api, upgradeColors, 230, 600, 1690, 600, delegatedColors.muted);
        for (let i = 0; i < 20; i++) {
          const x = 230 + i * 65;
          drawGpuUpgradeL(ctx, api, upgradeColors, x, 570, x, 630, delegatedColors.cyan);
          if (i % 5 === 0)
            drawGpuUpgradeText(
              ctx,
              api,
              upgradeColors,
              String(i * 10),
              x,
              680,
              28,
              delegatedColors.ink,
              'center',
            );
        }
        if (done('last-admission'))
          drawGpuUpgradeText(
            ctx,
            api,
            upgradeColors,
            'last group starts 190 s',
            1465,
            915,
            34,
            delegatedColors.green,
            'center',
          );
        drawGpuUpgradeL(
          ctx,
          api,
          upgradeColors,
          230 + 207 * 6.5,
          400,
          230 + 207 * 6.5,
          850,
          delegatedColors.pink,
        );
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          'cold ready 207 s',
          1540,
          370,
          28,
          delegatedColors.pink,
          'center',
        );
      }
      drawGpuUpgradeFoot(
        ctx,
        api,
        upgradeColors,
        afterClause(state, 'continuing-arrivals', 1, 0.78)
          ? 'Ongoing traffic  ·  1 arrival/s  >  0.5 completions/s on one warm GPU'
          : 'Each start occupies one slot for ten seconds',
      );
    }
  });
}
export default {
  id: 'burst-rate',
  draw: drawBurstRate,
  cues: ['ga-burst-rate-b0', 'ga-burst-rate-b1', 'ga-last-admission', 'continuing-arrivals'],
};
