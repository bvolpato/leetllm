import { vvProgress, vvState } from '../construction.mjs';
import { chapterCard, chapterText } from '../defaults.mjs';
export function drawEventMetrics(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = vvState('event-metrics', state),
    { b: currentBeat, p: progress } = modelState,
    cueProgress = (name, beat = currentBeat) => vvProgress(state, 'vv-event-metrics-' + name, beat),
    resultComplete = (name, beat = currentBeat) => cueProgress(name, beat) === 1;
  let title = '',
    limit = 'Illustrative source contract · no serving engine or GPU execution';
  const head = (x) => (title = x),
    foot = (x) => (limit = x);
  api.focus.target('vllm-event-metrics-mechanism', () => {
    head(
      currentBeat === 0
        ? 'Engine events can bundle token identities'
        : currentBeat === 1
          ? 'Keep event gaps and request-mean spacing distinct'
          : 'An omitted within-event timestamp stays unknown',
    );
    const ready = currentBeat > 1 || (currentBeat === 1 && resultComplete('events', 1)),
      x = (t) => 260 + t * 55;
    api.line(ctx, 230, 600, 1680, 600, themeColors.muted, 3);
    [0, 12, 24].forEach((v) => {
      api.line(ctx, x(v), 580, x(v), 620, themeColors.muted, 3);
      chapterText(ctx, api, v + 'ms', x(v), 700, 29, themeColors.muted, 'center');
    });
    if (ready || currentBeat === 0) {
      chapterCard(ctx, api, 'T0 +T1', x(0) - 110, 395, 220, themeColors.blue, 110, 30);
      chapterCard(ctx, api, 'T2', x(12) - 95, 395, 190, themeColors.cyan, 110, 30);
      chapterCard(ctx, api, 'T3', x(24) - 95, 395, 190, themeColors.cyan, 110, 30);
    }
    if (currentBeat > 1 || (currentBeat === 1 && resultComplete('event-gaps', 1))) {
      chapterText(ctx, api, 'gap12ms', x(6), 800, 32, themeColors.yellow, 'center');
      chapterText(ctx, api, 'gap12ms', x(18), 800, 32, themeColors.yellow, 'center');
    }
    if (currentBeat === 1 && resultComplete('tpot', 1))
      chapterText(
        ctx,
        api,
        '(24−0)/(4−1) =8ms mean TPOT',
        960,
        955,
        39,
        themeColors.green,
        'center',
      );
    if (currentBeat === 2) {
      chapterText(
        ctx,
        api,
        'T0→T1 gap: unknown · token-level p99 not reconstructed',
        960,
        955,
        31,
        themeColors.pink,
        'center',
      );
      api.line(ctx, x(0) - 60, 535, x(0) + 60, 535, themeColors.pink, 5);
    }
    foot(
      'Constructed engine-core event timestamps; HTTP transport chunk arrivals are a different clock',
    );
  });
  chapterText(ctx, api, title, 960, 275, 35, themeColors.yellow, 'center');
  chapterText(ctx, api, limit, 960, 1060, 23, themeColors.muted, 'center');
}
export default {
  id: 'event-metrics',
  draw: drawEventMetrics,
  cues: [
    'vv-event-metrics-op-0',
    'vv-event-metrics-op-1',
    'vv-event-metrics-events',
    'vv-event-metrics-event-gaps',
    'vv-event-metrics-tpot',
    'vv-event-metrics-op-2',
  ],
};
