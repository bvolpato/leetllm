import { sampleModel } from '../construction.mjs';
import { card, mechanismFocus, mechanismText, text, visualFocus } from '../defaults.mjs';
function drawGoAndEnsembleScope(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    extra = currentBeat === 3;
  if (!extra) return false;
  const { C: themeColors } = api;
  mechanismFocus(
    ctx,
    api,
    extra ? 'historical-pattern-completion' : 'historical-pattern-mechanism',
    () => {
      mechanismText(
        ctx,
        api,
        'Go: learned policy/value estimates guide search',
        960,
        275,
        38,
        themeColors.cyan,
        'center',
      );
      const x0 = 260,
        y0 = 365,
        step = 65;
      for (let i = 0; i < 7; i++) {
        api.line(ctx, x0, y0 + i * step, x0 + 6 * step, y0 + i * step, themeColors.muted, 2);
        api.line(ctx, x0 + i * step, y0, x0 + i * step, y0 + 6 * step, themeColors.muted, 2);
      }
      [
        [2, 2, themeColors.ink],
        [3, 2, themeColors.blue],
        [3, 3, themeColors.ink],
        [4, 3, themeColors.blue],
      ].forEach(([x, y, col]) => api.circle(ctx, x0 + x * step, y0 + y * step, 22, col));
      mechanismText(
        ctx,
        api,
        'Rules + designed network',
        1270,
        385,
        33,
        themeColors.yellow,
        'center',
      );
      mechanismText(
        ctx,
        api,
        'policy prior / value estimate',
        1270,
        525,
        31,
        themeColors.blue,
        'center',
      );
      api.arrow(ctx, 1270, 575, 1270, 675, themeColors.blue, 4);
      mechanismText(ctx, api, 'Self-play + search', 1270, 760, 40, themeColors.green, 'center');
      mechanismText(
        ctx,
        api,
        'AlexNet winner: seven-network ensemble',
        960,
        930,
        34,
        themeColors.pink,
        'center',
      );
      mechanismText(
        ctx,
        api,
        'Five–six days on two GTX 580s describes the base network only',
        960,
        1020,
        30,
        themeColors.muted,
        'center',
      );
    },
  );
  return true;
}
export function drawHistoricalPattern(ctx, scene, state, api) {
  if (drawGoAndEnsembleScope(ctx, scene, state, api)) return;
  const { C: themeColors, teaching: teaching } = api;
  const modelState = sampleModel('historical-pattern', state);
  {
    text(
      ctx,
      api,
      'Three fields · a recurring shift in how capability improves',
      960,
      295,
      27,
      themeColors.muted,
      'center',
    );
    visualFocus(ctx, api, 'historical-pattern-simulation-7', () =>
      modelState.rows.forEach((row, index) => {
        const y = 370 + index * 188;
        const active = modelState.step === 2 || (modelState.step === 1 && index === 0);
        const domain = card(
          ctx,
          api,
          row.domain,
          130,
          y,
          220,
          94,
          active ? themeColors.yellow : themeColors.blue,
          25,
        );
        const earlier = card(ctx, api, row.earlier, 420, y, 550, 94, themeColors.blue, 24);
        const later = card(
          ctx,
          api,
          row.later,
          1130,
          y,
          650,
          94,
          active ? themeColors.green : themeColors.cyan,
          24,
        );
        if (index === 0)
          text(
            ctx,
            api,
            'designed network + board encoding',
            1455,
            y + 145,
            24,
            themeColors.green,
            'center',
          );
        teaching.transfer({
          source: {
            shape: earlier,
            opacity: 1,
          },
          target: {
            shape: later,
            opacity: 1,
          },
          color: active ? themeColors.yellow : themeColors.muted,
          gap: 22,
          progress: active ? api.phase(state.beatP ?? 0, 0.08, 0.8) : 0.2,
          particle: {
            radius: 7,
            fill: themeColors.yellow,
          },
        });
        if (active)
          api.connect(ctx, domain, earlier, {
            color: themeColors.yellow,
            gap: 18,
          });
      }),
    );
    text(
      ctx,
      api,
      modelState.step === 2
        ? 'General methods can use more data, search, and computation'
        : 'Methods and hardware both contribute to the result',
      960,
      1000,
      25,
      themeColors.ink,
      'center',
    );
  }
}
export default {
  id: 'historical-pattern',
  draw: drawHistoricalPattern,
  cues: [
    'historical-pattern-beat-1-focus-1',
    'historical-pattern-beat-2-focus-1',
    'historical-pattern-beat-3-focus-1',
    'historical-pattern-core-completion',
  ],
};
