import { center, lower, pixels } from '../fixtures.mjs';
import { bottleneckFrame, recon, z } from '../model.mjs';
import { box, cueProgress, outline, pixelGrid, text } from '../defaults.mjs';
export function drawBottleneck(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress2, 0.12, 0.86),
    F = components.fade;
  const vector = (values) => '[' + values.map((value) => Number(value.toFixed(4))).join(', ') + ']';
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
    const frame = bottleneckFrame(currentBeat, progress2, state.cues);
    let cells;
    api.focus.target('selected-encoder-pixels', () => {
      cells = pixelGrid(ctx, api, frame.values, 180, 350, 90, center);
      center.forEach((i) =>
        text(
          ctx,
          api,
          frame.values[i].toFixed(2),
          cells[i].x + 42,
          cells[i].y + 48,
          25,
          themeColors.bg,
          'center',
        ),
      );
    });
    api.focus.target('lower-encoder-pixels', () =>
      lower.forEach((i) => {
        outline(ctx, api, cells[i], themeColors.cyan);
        text(
          ctx,
          api,
          frame.values[i].toFixed(2),
          cells[i].x + 42,
          cells[i].y + 48,
          25,
          themeColors.ink,
          'center',
        );
      }),
    );
    text(ctx, api, 'hand-built regional encoder', 405, 285, 32, themeColors.muted, 'center');
    if (currentBeat < 2) {
      const first = api.focus.target('encoder-average', () =>
        box(
          ctx,
          api,
          [
            currentBeat === 0
              ? `center: ${frame.centerCount} / 4 contributions · sum ${frame.centerSum.toFixed(2)}`
              : `center dial z₁ = ${z[0]}`,
            ...(currentBeat === 0
              ? [frame.centerReady ? `z₁ = ${frame.centerSum.toFixed(2)} / 4 = ${z[0]}` : 'z₁ = ?']
              : []),
          ],
          820,
          350,
          currentBeat === 0 ? 860 : 440,
          currentBeat === 0 ? 200 : 110,
          themeColors.yellow,
          33,
        ),
      );
      const second = api.focus.target('regional-code', () =>
        box(
          ctx,
          api,
          [
            `lower sum = ${frame.lowerSum.toFixed(2)} · ${frame.lowerCount} / 2 pixels`,
            frame.lowerReady
              ? `z₂ = ${frame.lowerSum.toFixed(2)} / 2 = ${z[1].toFixed(3)}`
              : 'z₂ = ?',
          ],
          820,
          600,
          currentBeat === 0 ? 860 : 440,
          170,
          themeColors.cyan,
          currentBeat === 0 ? 33 : 26,
        ),
      );
      const amount =
        currentBeat === 0
          ? cueProgress(ctx, api, 'center-add', phaseForBeat(0))
          : cueProgress(ctx, api, 'lower-add', phaseForBeat(1));
      const indices = currentBeat === 0 ? center : lower;
      const index = Math.min(indices.length - 1, Math.floor(amount * indices.length));
      if (amount > 0 && amount < 1) {
        outline(ctx, api, cells[indices[index]]);
        const destination = currentBeat === 0 ? first : second;
        const contribution = box(
          ctx,
          api,
          pixels[indices[index]].toFixed(2),
          665,
          destination.y + 45,
          105,
          80,
          currentBeat === 0 ? themeColors.yellow : themeColors.cyan,
          28,
        );
        transfer(
          contribution,
          destination,
          (amount * indices.length) % 1,
          currentBeat === 0 ? themeColors.yellow : themeColors.cyan,
          4,
          true,
        );
      }
      if (currentBeat === 1)
        api.focus.target('decoded-picture', () => {
          const reveal = cueProgress(ctx, api, 'badge-decode', phaseForBeat(1));
          F(reveal, () => pixelGrid(ctx, api, recon, 1370, 350, 78));
          text(ctx, api, 'supplied decoder output', 1565, 840, 28, themeColors.green, 'center');
        });
    } else {
      api.focus.target('encoder-average', () =>
        box(ctx, api, ['original code', vector(z)], 820, 350, 440, 150, themeColors.cyan, 33),
      );
      api.focus.target('regional-code', () =>
        text(ctx, api, 'same averaging weights', 1040, 560, 28, themeColors.muted, 'center'),
      );
      api.focus.target('candidate-code', () =>
        box(
          ctx,
          api,
          ['candidate code', frame.candidateReady ? vector(frame.candidateCode) : '[ ?, ? ]'],
          820,
          610,
          440,
          150,
          frame.candidateReady ? themeColors.green : themeColors.yellow,
          33,
        ),
      );
      if (currentBeat === 3)
        api.focus.target('decoded-picture', () => {
          const ready = cueProgress(ctx, api, 'same-reconstruction', phaseForBeat(3));
          F(ready, () => pixelGrid(ctx, api, recon, 1370, 350, 78));
          if (ready === 1)
            text(
              ctx,
              api,
              'equal code → equal reconstruction',
              1100,
              930,
              33,
              themeColors.green,
              'center',
            );
        });
      else box(ctx, api, 'Same or different?', 1370, 430, 390, 180, themeColors.green, 32);
    }
  }
}
export default {
  id: 'bottleneck',
  draw: drawBottleneck,
  cues: [
    'center-add',
    'center-mean',
    'lower-add',
    'badge-decode',
    'pixel-exchange',
    'candidate-code',
    'equal-code',
    'same-reconstruction',
  ],
};
