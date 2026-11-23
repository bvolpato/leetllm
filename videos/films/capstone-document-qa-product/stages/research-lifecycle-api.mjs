import { cueProgress, detailNote, detailTag, detailText, progressArrow } from '../defaults.mjs';
export function drawResearchLifecycleApi(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    resultComplete = (id) => cueProgress(ctx, api, id) === 1;
  api.focus.target('research-lifecycle-api-mechanism', () => {
    if (currentBeat === 0) {
      detailTag(ctx, api, 'Proposed product resource API', 960, 270, themeColors.blue, 1410);
      const rows = [
        ['POST /research-jobs', '202 · job ID + status URL', 'job-api'],
        ['GET /research-jobs/{id}', 'phase + budget + checkpoint', 'api-status'],
        ['POST /research-jobs/{id}/cancel', 'server cancellation receipt', 'api-cancel'],
        ['GET /research-jobs/{id}/report', 'verified report / explicit partial', 'api-report'],
      ];
      rows.forEach(([path, result, id], i) => {
        const y = 410 + i * 155;
        detailText(ctx, api, path, 570, y, 30, themeColors.blue);
        if (cueProgress(ctx, api, id)) {
          progressArrow(ctx, api, 1000, y - 10, 1100, y - 10, themeColors.cyan);
          detailText(
            ctx,
            api,
            result,
            1450,
            y,
            29,
            i === 3 ? themeColors.yellow : themeColors.cyan,
          );
        }
      });
      detailNote(
        ctx,
        api,
        'These resource endpoints are a design; they are not deployed by the mini-lab',
      );
    } else if (currentBeat === 1) {
      detailTag(
        ctx,
        api,
        'Google Deep Research · preview documented in October 2026',
        960,
        280,
        themeColors.blue,
        1640,
      );
      if (cueProgress(ctx, api, 'api-background')) {
        detailTag(
          ctx,
          api,
          'Interactions API · background execution',
          960,
          440,
          themeColors.cyan,
          1350,
        );
        detailText(ctx, api, 'polling or streaming', 960, 550, 33, themeColors.ink);
      }
      if (cueProgress(ctx, api, 'api-reconnect')) {
        detailTag(ctx, api, 'Disconnected stream', 450, 700, themeColors.pink, 600);
        detailTag(ctx, api, 'interaction ID + last event ID', 1390, 700, themeColors.yellow, 850);
        progressArrow(
          ctx,
          api,
          800,
          700,
          930,
          700,
          themeColors.yellow,
          cueProgress(ctx, api, 'api-reconnect'),
        );
      }
      if (resultComplete('provider-boundary'))
        detailText(
          ctx,
          api,
          'Reconnect interface does not prove internal exactly-once or lease behavior',
          960,
          915,
          30,
          themeColors.muted,
        );
      detailNote(
        ctx,
        api,
        'Store product-level evidence without private source contents or raw internal reasoning',
      );
    } else {
      detailText(
        ctx,
        api,
        'Inject failures into each boundary before completing reports',
        960,
        280,
        34,
        themeColors.blue,
      );
      const cases = [
        'Restart',
        'Cancel during call',
        'Stale owner',
        'Budget exhausted',
        'Source changed',
        'Citation mismatch',
        'Source conflict',
        'Private injection',
      ];
      cases.forEach((v, i) => {
        if (cueProgress(ctx, api, 'api-faults') > i / 8) {
          const x = 360 + (i % 4) * 400,
            y = 450 + Math.floor(i / 4) * 190;
          detailTag(
            ctx,
            api,
            v,
            x,
            y,
            [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.pink][i % 4],
            350,
          );
        }
      });
      if (resultComplete('research-tests'))
        detailText(
          ctx,
          api,
          'Valid citation + unsupported claim remains a failure',
          960,
          840,
          35,
          themeColors.pink,
        );
      if (resultComplete('api-verifier'))
        detailText(
          ctx,
          api,
          'Separate approved review or evaluated verifier → completion gate',
          960,
          945,
          32,
          themeColors.yellow,
        );
    }
  });
  return;
}
export default {
  id: 'research-lifecycle-api',
  draw: drawResearchLifecycleApi,
  cues: [
    'job-api',
    'api-status',
    'api-cancel',
    'api-report',
    'provider-boundary',
    'api-background',
    'api-reconnect',
    'research-tests',
    'api-faults',
    'api-verifier',
  ],
};
