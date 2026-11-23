import { collapseCaption, kl } from '../arithmetic.mjs';
import { lv, mu } from '../fixtures.mjs';
import { collapseDifference, collapseOutputs } from '../model.mjs';
import { box, cueProgress, equation, pixelGrid, text } from '../defaults.mjs';
export function drawCollapse(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress2, 0.12, 0.86),
    F = components.fade;
  const transfer = (
    source,
    target,
    progress,
    color = themeColors.green,
    particleRadius = 8,
    clearTip = false,
  ) => {
    if (!clearTip)
      return teaching.transfer({
        source: {
          shape: source,
          opacity: 1,
        },
        target: {
          shape: target,
          opacity: 1,
        },
        progress,
        color,
        width: 4,
        margin: 4,
        particle: {
          radius: 8,
          fill: color,
        },
      });
    const route = teaching.transfer({
      source: {
        shape: source,
        opacity: 1,
      },
      target: {
        shape: target,
        opacity: 1,
      },
      progress: 1,
      color,
      width: 4,
      margin: 4,
      particle: {
        radius: 8,
        fill: color,
      },
    });
    const amount = api.clamp(progress);
    if (amount > 0 && amount < 1) {
      const length = Math.hypot(route.to.x - route.from.x, route.to.y - route.from.y);
      const safeProgress = Math.max(0, 1 - (particleRadius + 14) / length);
      const particleProgress = Math.min(amount, safeProgress);
      const opacity = amount <= safeProgress ? 1 : api.clamp((1 - amount) / (1 - safeProgress));
      F(opacity, () =>
        components.particle({
          points: [route.from, route.to],
          progress: particleProgress,
          radius: particleRadius,
          fill: color,
        }),
      );
    }
    return route;
  };
  {
    const u = currentBeat === 0 ? cueProgress(ctx, api, 'decoder-ignore', phaseForBeat(0)) : 1,
      [a, z2] = collapseOutputs(u);
    api.focus.target('fixed-code-a-output', () => pixelGrid(ctx, api, a, 320, 490, 64));
    api.focus.target('fixed-code-b-output', () => pixelGrid(ctx, api, z2, 1280, 490, 64));
    const swap = currentBeat === 1 ? cueProgress(ctx, api, 'collapsed-swap', phaseForBeat(1)) : 0;
    api.focus.target('collapse-probes', () => {
      text(
        ctx,
        api,
        'probe ' + (swap === 1 ? 'B = [0.15, 0.90]' : 'A = [0.90, 0.15]'),
        480,
        315,
        32,
        themeColors.cyan,
        'center',
      );
      text(
        ctx,
        api,
        'probe ' + (swap === 1 ? 'A = [0.90, 0.15]' : 'B = [0.15, 0.90]'),
        1440,
        315,
        32,
        themeColors.pink,
        'center',
      );
      if (swap > 0 && swap < 1) {
        const left = box(ctx, api, 'A → B', 660, 275, 180, 75, themeColors.cyan, 29);
        const right = box(ctx, api, 'B → A', 1080, 275, 180, 75, themeColors.pink, 29);
        transfer(left, right, swap, themeColors.yellow, 5, true);
      }
    });
    api.arrow(ctx, 480, 355, 480, 465, themeColors.cyan, 4);
    api.arrow(ctx, 1440, 355, 1440, 465, themeColors.pink, 4);
    text(ctx, api, 'same decoder', 960, 435, 32, themeColors.ink, 'center');
    teaching.valueChange({
      x: 775,
      y: 485,
      width: 370,
      height: 150,
      from: 1,
      to: 1 - u,
      progress: 1,
      label: 'code sensitivity',
      format: (v) => v.toFixed(2),
      fontSize: 32,
      color: themeColors.yellow,
      showDelta: false,
      emphasis: u > 0 && u < 1 ? 1 : 0,
    });
    api.focus.target('decoder-coupling-rule', () =>
      equation(
        ctx,
        api,
        String.raw`D_g(z)=\bar x+g\,[D(z)-\bar x]`,
        960,
        825,
        38,
        themeColors.ink,
        'center',
      ),
    );
    text(
      ctx,
      api,
      collapseCaption(1, u),
      960,
      900,
      40,
      u >= 0.995 ? themeColors.yellow : themeColors.green,
      'center',
    );
    const currentKL = kl(
      mu.map((v) => v * (1 - u)),
      lv.map((v) => v * (1 - u)),
    );
    text(
      ctx,
      api,
      `toy KL ≈ ${currentKL.toFixed(4)}   max output difference = ${collapseDifference(u).toFixed(3)}`,
      960,
      980,
      30,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'collapse',
  draw: drawCollapse,
  cues: ['decoder-ignore', 'collapsed-swap'],
};
