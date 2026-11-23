import { choose, growthCeiling } from '../arithmetic.mjs';
import { box, cueEnded, cueProgress, equation, line, text } from '../defaults.mjs';
export function drawGrowthFunction(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cue = (id) => state.cues?.[id],
    begun = (id) => Boolean(cue(id) && cue(id).phase !== 'before');
  const main = () => {
    if (currentBeat >= 2) {
      const { C } = api;
      const join = cueProgress(state, 'ghost-inputs');
      text(ctx, api, 'Right thresholds on a line', 960, 296, 43, C.ink, 'center');
      text(ctx, api, 'Three observed inputs', 110, 448, 32, C.blue);
      text(ctx, api, 'Three independent ghost inputs', 110, 637, 32, C.yellow);
      const x = (i) => 655 + i * 194;
      line(ctx, api, x(-0.5), 448, x(5.5), 448, C.muted, 3);
      for (let i = 0; i < 6; i++) {
        if (i % 2 && join === 0) continue;
        api.circle(ctx, x(i), 448 + (i % 2 ? (1 - join) * 182 : 0), 23, i % 2 ? C.yellow : C.blue);
      }
      if (cueEnded(state, 'ghost-cuts')) {
        for (let i = 0; i <= 6; i++) line(ctx, api, x(i - 0.5), 400, x(i - 0.5), 488, C.cyan, 4);
        text(ctx, api, 'Six distinct inputs, seven possible cuts', 1170, 590, 38, C.cyan, 'center');
      }
      equation(
        ctx,
        api,
        String.raw`O\!\left(\sqrt{\frac{d\log(en/d)+\log(1/\delta)}{n}}\right)`,
        960,
        833,
        54,
        C.ink,
      );
      text(
        ctx,
        api,
        'VC estimation rate for a fixed class and i.i.d. cases   ·   n ≥ d ≥ 1',
        960,
        983,
        36,
        C.muted,
        'center',
      );
      return;
    }
    const nNow =
      currentBeat === 0
        ? 3
        : currentBeat > 1
          ? 50
          : begun('growth-fifty-inputs')
            ? 50
            : begun('growth-ten-inputs')
              ? 10
              : begun('growth-four-inputs')
                ? 4
                : 3;
    const ready =
      currentBeat !== 1 ||
      nNow === 3 ||
      cueEnded(
        state,
        nNow === 4
          ? 'growth-four-result'
          : nNow === 10
            ? 'growth-ten-result'
            : 'growth-fifty-result',
      );
    const ceiling = growthCeiling(nNow, 3),
      all = 2 ** nNow;
    text(ctx, api, `n = ${nNow} inputs · VC dimension 3`, 960, 295, 44, themeColors.cyan, 'center');
    const shownSlots = Math.min(64, all);
    for (let i = 0; i < shownSlots; i++) {
      const x = 180 + (i % 16) * 57,
        y = 380 + Math.floor(i / 16) * 70,
        color = ready && i < ceiling ? themeColors.blue : themeColors.muted;
      box(ctx, api, x, y, 42, 49, color);
      text(ctx, api, String(i + 1), x + 21, y + 33, 20, color, 'center');
    }
    text(
      ctx,
      api,
      all > 64
        ? 'First 64 possible-pattern slots shown'
        : 'One slot per possible binary assignment',
      600,
      700,
      24,
      themeColors.muted,
      'center',
    );
    text(ctx, api, 'Attainable-pattern ceiling', 600, 750, 33, themeColors.blue, 'center');
    if (ready)
      text(ctx, api, ceiling.toLocaleString('en-US'), 600, 845, 85, themeColors.blue, 'center');
    else text(ctx, api, 'Count pending', 600, 845, 36, themeColors.muted, 'center');
    text(ctx, api, 'All binary assignments', 1430, 450, 33, themeColors.pink, 'center');
    equation(ctx, api, String.raw`2^{${nNow}}`, 1430, 560, 90, themeColors.pink);
    if (ready)
      text(
        ctx,
        api,
        all.toLocaleString('en-US'),
        1430,
        680,
        nNow === 50 ? 40 : 46,
        themeColors.pink,
        'center',
      );
    else text(ctx, api, 'Assignment count pending', 1430, 680, 31, themeColors.muted, 'center');
    equation(
      ctx,
      api,
      String.raw`\Pi_{\mathcal H}(n)\leq\sum_{i=0}^{d}\binom ni`,
      960,
      965,
      51,
      themeColors.yellow,
    );
    text(
      ctx,
      api,
      'Sauer sum   ' + [0, 1, 2, 3].map((k) => choose(nNow, k).toLocaleString('en-US')).join(' + '),
      960,
      1030,
      30,
      themeColors.muted,
      'center',
    );
  };
  // The cue target is the actual spatial construction for this scene.
  if (api.focus) api.focus.target(`${'growth-function'}-construction`, main);
  else main();
}
export default {
  id: 'growth-function',
  draw: drawGrowthFunction,
  cues: [
    'growth-function-voice-1',
    'growth-function-voice-2',
    'growth-four-inputs',
    'growth-four-result',
    'growth-ten-inputs',
    'growth-ten-result',
    'growth-fifty-inputs',
    'growth-fifty-result',
    'growth-function-voice-3',
    'ghost-inputs',
    'ghost-cuts',
  ],
};
