import { arrow, drawText, mark, pill } from '../defaults.mjs';
export function drawDiagnoseReplay(ctx, scene, state, api) {
  return api.focus.target('diagnose-replay-geometry', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const cueVisible = (id) => (state.cues ? api.focus.visible(id) : (state.beatP ?? 0) > 0.32);
    {
      const repaired = currentBeat > 0 && cueVisible('diagnose-render'),
        cold = currentBeat > 0 && cueVisible('diagnose-cold'),
        bypass = currentBeat > 0 && cueVisible('diagnose-bypass');
      drawText(ctx, api, 'Policy source changes; follow the actual decision input', 150, 270, 32);
      const labels = [
        'Source v8: 30 days',
        repaired ? 'Rendered: 30 days' : 'Rendered: 90 days',
        cold ? 'Verified cold: 0 reads' : 'Prefix state lookup',
        bypass ? 'Answer-cache bypass' : 'Answer says: 90 days',
      ];
      labels.forEach((value, i) => {
        const x = 150 + i * 440;
        pill(
          ctx,
          api,
          value,
          x,
          415,
          370,
          (i === 1 && !repaired) || (i === 3 && !bypass) ? themeColors.pink : themeColors.blue,
          25,
        );
        if (i < 3) arrow(ctx, api, x + 380, 448, x + 425, 448, themeColors.muted);
      });
      if (currentBeat === 0) {
        mark(ctx, api, 'diagnose-input', () => {
          if (cueVisible('diagnose-input'))
            drawText(
              ctx,
              api,
              'First observed failure: stale rendered input',
              960,
              720,
              36,
              themeColors.pink,
              'center',
            );
        });
        mark(ctx, api, 'diagnose-change', () => {
          if (cueVisible('diagnose-change'))
            drawText(
              ctx,
              api,
              'A real token change invalidates its old dependent prefix path',
              960,
              865,
              30,
              themeColors.yellow,
              'center',
            );
        });
      } else if (currentBeat === 1) {
        mark(ctx, api, 'diagnose-cold', () => {
          if (cold)
            drawText(
              ctx,
              api,
              'Fresh input + cold stale answer → investigate the answer path',
              960,
              735,
              31,
              themeColors.yellow,
              'center',
            );
        });
        mark(ctx, api, 'diagnose-bypass', () => {
          if (bypass) {
            pill(ctx, api, 'Generation result: inspect', 665, 830, 590, themeColors.cyan);
            drawText(
              ctx,
              api,
              'Input + model revision fixed',
              960,
              965,
              29,
              themeColors.muted,
              'center',
            );
          }
        });
      } else {
        mark(ctx, api, 'diagnose-miss', () => {
          const conditions = [
            'boundary',
            'prior write',
            'minimum / window',
            'TTL / scope',
            'worker / eviction',
          ];
          conditions.forEach((label, i) =>
            pill(ctx, api, label, 160 + i * 350, 735, 300, themeColors.yellow, 25),
          );
        });
        mark(ctx, api, 'diagnose-eviction', () => {
          if (cueVisible('diagnose-eviction'))
            drawText(
              ctx,
              api,
              'Eligible entry evicted → recompute the same correct input',
              960,
              935,
              32,
              themeColors.green,
              'center',
            );
        });
      }
    }
  });
}
export default {
  id: 'diagnose-replay',
  draw: drawDiagnoseReplay,
  cues: [
    'diagnose-input',
    'diagnose-change',
    'diagnose-render',
    'diagnose-cold',
    'diagnose-bypass',
    'diagnose-miss',
    'diagnose-eviction',
  ],
};
