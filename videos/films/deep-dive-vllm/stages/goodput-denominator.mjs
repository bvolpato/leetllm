import { vvProgress, vvState } from '../construction.mjs';
import { chapterText, rect } from '../defaults.mjs';
export function drawGoodputDenominator(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = vvState('goodput-denominator', state),
    { b: currentBeat, p: progress } = modelState,
    cueProgress = (name, beat = currentBeat) =>
      vvProgress(state, 'vv-goodput-denominator-' + name, beat),
    resultComplete = (name, beat = currentBeat) => cueProgress(name, beat) === 1;
  let title = '',
    limit = 'Illustrative source contract · no serving engine or GPU execution';
  const head = (x) => (title = x),
    foot = (x) => (limit = x);
  api.focus.target('vllm-goodput-denominator-mechanism', () => {
    head(
      currentBeat === 0
        ? 'One common100-second offer population'
        : currentBeat === 1
          ? 'Count useful completions before dividing by time'
          : 'Use all offers if multiplying by offered arrival rate',
    );
    const rows = [
        ['A', 1000, 600, 550, themeColors.blue],
        ['B', 800, 780, 752, themeColors.green],
      ],
      scale = 1.3;
    for (const [name, offered, complete, pass, color] of rows) {
      const y = name === 'A' ? 420 : 720,
        ready = currentBeat > 0 || resultComplete(name === 'A' ? 'counts-a' : 'counts-b', 0);
      chapterText(ctx, api, name, 140, y + 50, 40, color);
      rect(ctx, api, 230, y, offered * scale, 95, themeColors.muted);
      if (ready) {
        rect(ctx, api, 230, y, pass * scale, 95, themeColors.green);
        rect(ctx, api, 230 + pass * scale, y, (complete - pass) * scale, 95, themeColors.yellow);
        chapterText(
          ctx,
          api,
          pass +
            ' within limits /' +
            (complete - pass) +
            ' late /' +
            (offered - complete) +
            ' unfinished',
          230,
          y + 155,
          28,
          color,
        );
      }
      if (currentBeat === 1 && resultComplete('rates', 1))
        chapterText(
          ctx,
          api,
          pass + '/100s =' + (pass / 100).toFixed(2) + '/s',
          1600,
          y + 220,
          33,
          themeColors.green,
          'center',
        );
    }
    if (currentBeat === 1 && resultComplete('inflated', 1))
      chapterText(
        ctx,
        api,
        'Wrong A:(550/600) ×10/s ≈9.17/s',
        960,
        1010,
        32,
        themeColors.pink,
        'center',
      );
    if (currentBeat === 2)
      chapterText(
        ctx,
        api,
        '(passes /all offers) ×(all offers /window) =passes /window',
        960,
        1010,
        30,
        themeColors.cyan,
        'center',
      );
    foot('Absolute counts share 1.3 px/request; fixed TTFT <300 ms and per-request p99 ITL <50 ms');
  });
  chapterText(ctx, api, title, 960, 275, 35, themeColors.yellow, 'center');
  chapterText(ctx, api, limit, 960, 1060, 23, themeColors.muted, 'center');
}
export default {
  id: 'goodput-denominator',
  draw: drawGoodputDenominator,
  cues: [
    'vv-goodput-denominator-op-0',
    'vv-goodput-denominator-counts-a',
    'vv-goodput-denominator-counts-b',
    'vv-goodput-denominator-op-1',
    'vv-goodput-denominator-rates',
    'vv-goodput-denominator-inflated',
    'vv-goodput-denominator-op-2',
  ],
};
