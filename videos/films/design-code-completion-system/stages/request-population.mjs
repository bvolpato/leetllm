import { completionFooter, completionHeading, completionText } from '../defaults.mjs';
export function drawRequestPopulation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0));
  const drawMechanism = () => {
    completionHeading(
      ctx,
      api,
      currentBeat
        ? 'Every qualifying edit retains its observed outcome'
        : 'One explicitly supplied teaching clock',
    );
    const x = (ms) => 260 + ms * 4;
    api.line(ctx, 260, 600, x(350), 600, themeColors.muted, 3);
    [
      [0, 'qualifying edit'],
      [150, 'submit'],
      [280, 'first token'],
      [333, 'fresh usable span'],
    ].forEach(([ms, label], i) => {
      api.circle(ctx, x(ms), 600, 9, i === 0 ? themeColors.yellow : themeColors.cyan);
      completionText(ctx, api, ms + ' ms', x(ms), 540, 29, themeColors.ink, 'center');
      completionText(ctx, api, label, x(ms), i % 2 ? 730 : 820, 27, themeColors.muted, 'center');
    });
    completionText(
      ctx,
      api,
      'Client TTFT = 280 − 150 = 130 ms',
      960,
      360,
      35,
      themeColors.cyan,
      'center',
    );
    completionFooter(
      ctx,
      api,
      currentBeat
        ? 'Shown, timeout, cancelled, stale and error outcomes keep the original qualifying population visible'
        : 'Edit-to-paint 333 ms already contains request-to-first-token time',
    );
  };
  api.focus.target('cc-request-population-mechanism', drawMechanism);
  return;
}
export default {
  id: 'request-population',
  draw: drawRequestPopulation,
  cues: ['cc-request-population-0', 'cc-request-population-1'],
};
