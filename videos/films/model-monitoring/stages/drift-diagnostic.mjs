import { current, psi, psiTerms, reference } from '../fixtures.mjs';
import { chip, cueProgress, cueVisible, fade, footer, line, panel, text } from '../defaults.mjs';
function drawMonitoring(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const done = (key) => state.cues?.[`m-${'drift-diagnostic'}-${key}`]?.phase === 'after';
  {
    const base = 735,
      scale = 650,
      labels = ['0–4 h', '4–12 h', '12–24 h', '24 h+'];
    const q = cueVisible(ctx, api, 'drift-diagnostic', 'compare')
      ? 1
      : cueProgress(ctx, api, 'drift-diagnostic', 'current');
    labels.forEach((v, i) => {
      const x = 260 + i * 390;
      line(ctx, api, x - 40, base, x + 260, base, themeColors.muted, 2);
      api.rect(ctx, x, base - reference[i] * scale, 80, reference[i] * scale, themeColors.blue);
      text(
        ctx,
        api,
        `${reference[i] * 100}%`,
        x + 40,
        base - reference[i] * scale - 25,
        28,
        themeColors.blue,
      );
      fade(ctx, api, q, () => {
        api.rect(ctx, x + 105, base - current[i] * scale, 80, current[i] * scale, themeColors.cyan);
        text(
          ctx,
          api,
          `${current[i] * 100}%`,
          x + 145,
          base - current[i] * scale - 25,
          28,
          themeColors.cyan,
        );
      });
      text(ctx, api, v, x + 90, 805, 29, themeColors.muted);
      if (cueVisible(ctx, api, 'drift-diagnostic', 'largest') && i === 3) {
        panel(
          ctx,
          api,
          x - 20,
          base - current[i] * scale - 65,
          230,
          current[i] * scale + 90,
          themeColors.yellow,
          'transparent',
        );
        text(ctx, api, psiTerms[i].toFixed(3), x + 95, 875, 30, themeColors.yellow);
      }
    });
    text(ctx, api, 'Reference: 100 requests', 460, 285, 30, themeColors.blue);
    text(ctx, api, 'Current: 100 requests', 945, 285, 30, themeColors.cyan);
    if (done('total'))
      chip(ctx, api, `PSI = ${psi.toFixed(3)}`, 1260, 235, 410, themeColors.yellow, 84, 34);
    footer(
      ctx,
      api,
      cueVisible(ctx, api, 'drift-diagnostic', 'policy')
        ? 'Above the local 0.20 inspection cutoff; decision quality still awaits outcomes.'
        : 'Compare the same fixed heartbeat-age bins.',
      cueVisible(ctx, api, 'drift-diagnostic', 'policy') ? themeColors.yellow : themeColors.muted,
    );
  }
}
export function drawDriftDiagnostic(ctx, scene, state, api) {
  return api.focus?.target
    ? api.focus.target('drift-diagnostic-mechanism', () => drawMonitoring(ctx, scene, state, api))
    : drawMonitoring(ctx, scene, state, api);
}
export default {
  id: 'drift-diagnostic',
  draw: drawDriftDiagnostic,
  cues: [
    'drift-diagnostic-beat-1-focus-1',
    'm-drift-diagnostic-current',
    'drift-diagnostic-beat-2-focus-1',
    'drift-diagnostic-beat-2-focus-2',
    'drift-diagnostic-beat-2-focus-3',
    'm-drift-diagnostic-compare',
    'm-drift-diagnostic-total',
    'm-drift-diagnostic-largest',
    'drift-diagnostic-beat-3-focus-1',
    'm-drift-diagnostic-policy',
  ],
};
