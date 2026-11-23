import { SERVING_COHORT } from '../fixtures.mjs';
import { cueProgress } from '../construction.mjs';
import { text } from '../defaults.mjs';

export function drawWorkloadFreeze(ctx, scene, state, api) {
  const { C, focus } = api;
  const beat = state.beat ?? 0;
  const p = cueProgress(
    state.cues,
    'workload-lengths',
    beat > 0 ? 1 : api.phase(state.beatP ?? 0, 0.2, 0.8),
  );
  const longest = Math.max(...SERVING_COHORT.map((r) => r.prompt));
  const cols = [145, 350, 615, 1080, 1330, 1570];
  const headers = ['Request', 'Due (ms)', 'Prompt tokens', 'Output cap', 'Prefix', 'Class'];
  for (const [i, h] of headers.entries()) text(ctx, api, h, cols[i], 292, 31, C.muted, 'left');
  SERVING_COHORT.forEach((r, i) => {
    const pair = i === 2 || i === 3;
    const y = 377 + i * 80;
    const color = beat === 1 && pair ? C.yellow : C.cyan;
    focus.target(pair ? 'workload-pair' : 'workload-rows', () => {
      text(ctx, api, r.id, cols[0], y, 35, color, 'left');
      text(ctx, api, String(r.scheduled), cols[1], y, 34, C.ink, 'left');
      const length = (r.prompt / longest) * 265 * p;
      if (length > 0) api.line(ctx, cols[2], y - 10, cols[2] + length, y - 10, color, 12);
      text(ctx, api, r.prompt.toLocaleString('en-US'), 1000, y, 32, C.ink, 'right');
      text(ctx, api, String(r.cap), cols[3], y, 32, C.ink, 'left');
      text(ctx, api, r.prefix, cols[4], y, 31, C.ink, 'left');
      text(ctx, api, r.priority, cols[5], y, 30, C.ink, 'left');
    });
  });
  text(ctx, api, 'Output cap in tokens. Each answer can stop earlier.', 145, 855, 29, C.muted, 'left');
  const interval = SERVING_COHORT[3].scheduled - SERVING_COHORT[2].scheduled;
  if (beat === 1)
    text(ctx, api, 'r04 is due ' + interval + ' ms after r03', 145, 961, 38, C.yellow, 'left');
  if (beat === 2)
    text(
      ctx,
      api,
      'For replay, keep the prompt and its context with the row.',
      145,
      961,
      36,
      C.ink,
      'left',
    );
  if (beat === 3)
    text(
      ctx,
      api,
      'Scorer download   ·   scheduled times, request IDs and classes',
      145,
      961,
      34,
      C.ink,
      'left',
    );
}
export default {
  id: 'workload-freeze',
  draw: drawWorkloadFreeze,
  cues: ['workload-lengths', 'workload-neighbors', 'workload-cap', 'workload-file'],
};
