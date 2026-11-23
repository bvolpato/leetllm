import { gaBound, gaProgress } from '../arithmetic.mjs';
import { Worker } from '../model.mjs';
import { drawGpuRetainedCard, drawGpuRetainedFocus, drawGpuRetainedText } from '../defaults.mjs';
export function drawDrain(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress2 = gaBound(state.beatP ?? 0),
    progress = (name) => gaProgress(state, name, progress2);
  const drain = true,
    w = new Worker();
  w.loaded = true;
  w.warmed = true;
  w.draining = true;
  const admitted = true;
  {
    w.draining = false;
    w.admit('R1');
    w.admit('R2');
    w.draining = true;
  }
  const release1 = currentBeat > 1 ? 1 : currentBeat === 1 ? progress('release-one') : 0,
    release2 = currentBeat === 2 ? progress('empty-active-set') : 0;
  if (release1 >= 1) w.release('R1');
  if (release2 >= 1) w.release('R2');
  drawGpuRetainedFocus(ctx, api, 'readiness-readout', () =>
    drawGpuRetainedText(
      ctx,
      api,
      themeColors,
      `Loaded ${w.loaded} · warmed ${w.warmed} · healthy ${w.healthy} · draining ${w.draining}`,
      960,
      280,
      30,
      themeColors.muted,
      'center',
    ),
  );
  api.rect(ctx, 315, 350, 1320, 560, themeColors.panel, themeColors.blue, 2);
  drawGpuRetainedFocus(ctx, api, 'readiness-readout-2', () =>
    drawGpuRetainedText(
      ctx,
      api,
      themeColors,
      'Local intake closed; retain active state',
      960,
      415,
      34,
      themeColors.yellow,
      'center',
    ),
  );
  for (let i = 0; i < 2; i++) {
    const name = 'R' + (i + 1),
      u = i ? release2 : release1,
      x = 460 + i * 700;
    api.rect(ctx, x, 500, 430, 140, themeColors.panel, themeColors.muted, 2);
    drawGpuRetainedText(
      ctx,
      api,
      themeColors,
      'physical request slot ' + (i + 1),
      x + 215,
      475,
      25,
      themeColors.muted,
      'center',
    );
    drawGpuRetainedFocus(ctx, api, 'drain-request-' + name.toLowerCase(), () => {
      const label = name + '\n' + (u >= 1 ? 'completed / released' : 'active state retained');
      drawGpuRetainedCard(
        ctx,
        api,
        themeColors,
        components,
        label,
        x + 25,
        520 + u * 230,
        380,
        100,
        u >= 1 ? themeColors.green : themeColors.cyan,
        28,
      );
    });
  }
  drawGpuRetainedFocus(ctx, api, 'readiness-request-r3', () =>
    drawGpuRetainedCard(
      ctx,
      api,
      themeColors,
      components,
      'R3\nHTTP 503',
      95,
      540,
      175,
      135,
      themeColors.pink,
      25,
    ),
  );
  drawGpuRetainedFocus(ctx, api, 'readiness-readout-5', () =>
    drawGpuRetainedText(
      ctx,
      api,
      themeColors,
      `Active owners: ${[...w.active].join(', ') || 'none'} · termination ${w.active.size ? 'waits' : 'safe'}`,
      960,
      980,
      31,
      themeColors.yellow,
      'center',
    ),
  );
}
export default {
  id: 'drain',
  draw: drawDrain,
  cues: [
    'closed-admission',
    'owned-requests',
    'release-one',
    'still-active',
    'empty-active-set',
    'safe-termination',
  ],
};
