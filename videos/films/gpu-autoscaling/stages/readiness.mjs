import { gaBound, gaComplete } from '../arithmetic.mjs';
import { Worker } from '../model.mjs';
import { drawGpuRetainedCard, drawGpuRetainedFocus, drawGpuRetainedText } from '../defaults.mjs';
export function drawReadiness(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress2 = gaBound(state.beatP ?? 0),
    complete = (name) => gaComplete(state, name, progress2 > 0.6);
  const drain = false,
    w = new Worker();
  w.loaded = currentBeat > 0;
  w.warmed = currentBeat > 1;
  w.draining = false;
  const admitted = currentBeat === 2 && complete('admit-two');
  if (admitted) {
    w.draining = false;
    w.admit('R1');
    w.admit('R2');
    w.draining = false;
  }
  const release1 = 0,
    release2 = 0;
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
      w.ready() ? 'Engine ready for intended work' : 'Readiness incomplete; no new traffic',
      960,
      415,
      34,
      w.ready() ? themeColors.green : themeColors.yellow,
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
    drawGpuRetainedFocus(ctx, api, 'readiness-request-' + name.toLowerCase(), () => {
      const label =
        name +
        '\n' +
        (admitted ? 'HTTP 200 / active' : w.ready() ? 'queued / not submitted' : 'HTTP 503');
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
        u >= 1 ? themeColors.green : admitted ? themeColors.cyan : themeColors.yellow,
        28,
      );
    });
  }
  const third = !w.ready()
    ? 'R3\nHTTP 503'
    : complete('overload-third')
      ? 'R3\nHTTP 429'
      : 'R3\nwaiting';
  drawGpuRetainedFocus(ctx, api, 'readiness-request-r3', () =>
    drawGpuRetainedCard(
      ctx,
      api,
      themeColors,
      components,
      third,
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
      admitted
        ? 'Two slots owned; full capacity remains healthy'
        : 'Readiness and admission have separate predicates',
      960,
      980,
      31,
      themeColors.yellow,
      'center',
    ),
  );
}
export default {
  id: 'readiness',
  draw: drawReadiness,
  cues: [
    'weights-missing',
    'not-ready',
    'warmup-pending',
    'engine-readiness',
    'admit-two',
    'overload-third',
  ],
};
