import { bounded } from '../arithmetic.mjs';
import { SHARDS } from '../fixtures.mjs';
import { text } from '../defaults.mjs';
export function drawLifecycle(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api;
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const colors = {
    weights: themeColors.blue,
    gradients: themeColors.pink,
    optimizer: themeColors.yellow,
  };
  {
    const phases = [
      'At rest',
      'Gather forward',
      'Forward compute',
      'Release full copy',
      'Gather backward',
      'Backward compute',
      'Reduce-scatter',
      'Local update',
    ];
    const elapsed =
        bounded(
          currentBeat === 0
            ? (3 * progress) / 8
            : currentBeat === 1
              ? (3 + 2 * progress) / 8
              : (5 + 3 * progress) / 8,
        ) * 8,
      current = Math.min(7, Math.floor(elapsed)),
      phaseP = elapsed - current;
    const gathered =
      current === 1
        ? phaseP
        : current === 2
          ? 1
          : current === 3
            ? 1 - phaseP
            : current === 4
              ? phaseP
              : current === 5
                ? 1
                : current === 6
                  ? 1 - phaseP
                  : 0;
    const activation =
      current === 2 ? phaseP : current === 3 || current === 4 ? 1 : current === 5 ? 1 - phaseP : 0;
    phases.forEach((name, i) => {
      const x = 180 + i * 220;
      text(
        ctx,
        api,
        name,
        x,
        290,
        22,
        i === current ? themeColors.yellow : themeColors.muted,
        'center',
      );
    });
    api.focus.target('wrapped-unit-steps', () => {
      api.line(ctx, 175, 330, 1745, 330, themeColors.muted, 2);
      api.circle(ctx, 180 + current * 220, 330, 10, themeColors.yellow);
    });
    SHARDS.forEach((id, rank) => {
      const x = 260 + rank * 400;
      api.focus.target('local-optimizer', () =>
        components.card({
          label: 'R' + rank + ' owns ' + id,
          x,
          y: 375,
          width: 290,
          height: 60,
          fontSize: 25,
          fill: themeColors.panel,
          stroke: rank === 0 ? themeColors.blue : themeColors.muted,
          textColor: rank === 0 ? themeColors.blue : themeColors.muted,
        }),
      );
    });
    api.rect(ctx, 230, 485, 1450, 450, themeColors.panel, themeColors.blue, 9);
    text(ctx, api, 'Rank 0 · same wrapped unit', 310, 540, 34, themeColors.ink);
    text(ctx, api, 'Persistent', 210, 650, 26, themeColors.muted, 'right');
    api.focus.target('resident-parameter-shards', () => {
      api.rect(ctx, 565, 595, 150, 75, themeColors.blue, undefined, 5);
      text(
        ctx,
        api,
        current === 7 && phaseP > 0.5 ? 'A′' : 'A',
        640,
        646,
        34,
        themeColors.bg,
        'center',
      );
    });
    text(ctx, api, 'Compute copy', 210, 790, 26, themeColors.muted, 'right');
    if (gathered > 0) {
      SHARDS.forEach((id, i) => {
        const fromX = 260 + i * 400 + 70,
          toX = 565 + i * 250,
          fromY = 680,
          toY = 735,
          q = gathered;
        api.focus.target('resident-parameter-shards', () => {
          api.rect(
            ctx,
            fromX + (toX - fromX) * q,
            fromY + (toY - fromY) * q,
            150,
            75,
            [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.green][i],
            undefined,
            5,
          );
          text(
            ctx,
            api,
            id,
            fromX + (toX - fromX) * q + 75,
            fromY + (toY - fromY) * q + 51,
            34,
            themeColors.bg,
            'center',
          );
        });
      });
    } else text(ctx, api, 'released · owned A remains', 1030, 787, 32, themeColors.muted, 'center');
    api.focus.target('residency-meters', () => {
      text(ctx, api, 'Saved activations', 310, 890, 27, themeColors.yellow);
      api.rect(ctx, 680, 860, 350 * activation, 35, themeColors.yellow, undefined, 2);
    });
    if (current >= 5) {
      const full = current === 5 ? phaseP : current === 6 ? 1 : 0,
        scatter = current === 6 ? phaseP : current === 7 ? 1 : 0;
      SHARDS.forEach((id, i) => {
        if (i === 0 || scatter < 1) {
          const alpha = i === 0 ? 1 : 1 - scatter;
          components.fade(alpha, () => {
            api.focus.target('residency-meters', () =>
              api.rect(
                ctx,
                1130 + i * 110,
                860,
                95 * full + 95 * (i === 0 ? scatter : 0),
                38,
                themeColors.pink,
                undefined,
                2,
              ),
            );
            if (full > 0.5 || (i === 0 && scatter > 0.5))
              text(ctx, api, 'G' + id, 1177 + i * 110, 890, 23, themeColors.bg, 'center');
          });
        }
      });
    }
    text(
      ctx,
      api,
      current === 5
        ? 'Local full-unit gradients form before reduce-scatter'
        : current === 6
          ? 'Gradient sums travel to owners; only owned GA remains'
          : current === 7
            ? 'Optimizer A updates its local shard; all owners do the same'
            : current === 3
              ? 'Full compute copy releases; activations survive'
              : 'Identified shard copies move; persistent owners remain',
      960,
      1010,
      31,
      themeColors.yellow,
      'center',
    );
  }
}
export default {
  id: 'lifecycle',
  draw: drawLifecycle,
  cues: ['lifecycle-b1-1', 'lifecycle-b2-1', 'lifecycle-b2-2', 'lifecycle-b3-1', 'lifecycle-b3-2'],
};
