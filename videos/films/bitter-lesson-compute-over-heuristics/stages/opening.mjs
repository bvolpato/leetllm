import { mechanismBox, mechanismFocus, mechanismText } from '../defaults.mjs';
export function drawOpening(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0));
  const { C: themeColors } = api;
  mechanismFocus(ctx, api, 'opening-mechanism', () => {
    mechanismFocus(ctx, api, 'opening-object-s-issue-1', () => {
      mechanismText(
        ctx,
        api,
        'Issue I-17: “tokens arrive slowly”',
        960,
        285,
        39,
        themeColors.blue,
        'center',
      );
    });
    mechanismFocus(ctx, api, 'opening-object-condition-contains-timeout-2', () => {
      mechanismText(
        ctx,
        api,
        'Exact condition: contains “timeout”?',
        960,
        420,
        39,
        themeColors.yellow,
        'center',
      );
      api.line(ctx, 960, 465, 960, 530, themeColors.yellow, 4);
      mechanismText(ctx, api, 'FALSE', 960, 590, 46, themeColors.pink, 'center');
    });
    mechanismFocus(ctx, api, 'opening-object-cpu-s-cpu-3', () => {
      const n = currentBeat === 0 ? 1 : 8;
      mechanismText(
        ctx,
        api,
        n + ' CPU lanes · same unchanged predicate',
        960,
        735,
        34,
        themeColors.cyan,
        'center',
      );
      for (let i = 0; i < n; i++) {
        const x = 300 + i * 170;
        mechanismBox(ctx, api, x, 790, 125, 95, themeColors.cyan);
        mechanismText(ctx, api, 'false', x + 62, 850, 27, themeColors.pink, 'center');
      }
    });
    mechanismText(
      ctx,
      api,
      'Latency queue still receives no routing evidence',
      960,
      1000,
      32,
      themeColors.pink,
      'center',
    );
  });
  return;
}
export default {
  id: 'opening',
  draw: drawOpening,
  cues: [
    'opening-beat-1-focus-1',
    'opening-beat-1-focus-2',
    'opening-beat-2-focus-1',
    'opening-beat-2-focus-2',
    'opening-beat-3-focus-1',
  ],
};
