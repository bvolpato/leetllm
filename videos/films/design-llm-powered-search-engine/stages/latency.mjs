import { sampleModel } from '../model.mjs';
import { originalText } from '../defaults.mjs';
export function drawLatency(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('latency', state);
  {
    const lanes = [
        {
          id: 'plan',
          label: 'Plan',
        },
        {
          id: 'retrieve',
          label: 'Retrieve',
        },
        {
          id: 'evidence',
          label: 'Rerank / pack',
        },
        {
          id: 'model',
          label: 'Draft / claim',
        },
        {
          id: 'check',
          label: 'Verify',
        },
      ],
      intervals = [
        {
          id: 'plan',
          lane: 'plan',
          start: 0,
          end: 40,
          color: themeColors.blue,
        },
        {
          id: 'retrieve',
          lane: 'retrieve',
          start: 0,
          end: 260,
          label: 'raw query',
          color: themeColors.cyan,
        },
        {
          id: 'rerank',
          lane: 'evidence',
          start: 260,
          end: 350,
          label: 'rank',
          color: themeColors.blue,
        },
        {
          id: 'pack',
          lane: 'evidence',
          start: 350,
          end: 370,
          color: themeColors.yellow,
        },
        {
          id: 'draft',
          lane: 'model',
          start: 370,
          end: 800,
          label: 'first draft',
          color: themeColors.cyan,
        },
        {
          id: 'claim',
          lane: 'model',
          start: 800,
          end: 900,
          label: 'claim',
          color: themeColors.blue,
        },
        {
          id: 'verify',
          lane: 'check',
          start: 900,
          end: 980,
          label: 'check',
          color: themeColors.green,
        },
      ];
    const trace = api.focus.target('latency-timeline-latency', () =>
      teaching.timeline({
        x: 150,
        y: 285,
        width: 1610,
        height: 580,
        domain: [0, 1000],
        lanes,
        intervals,
        time: modelState.time,
        ticks: [0, 200, 400, 600, 800, 1000],
        fontSize: 25,
        labelWidth: 210,
        color: themeColors.muted,
        trackColor: themeColors.panel,
      }),
    );
    originalText(
      ctx,
      api,
      'Draft token: ' +
        (trace.intervals.draft.complete ? '800 ms' : 'pending') +
        ' · checked claim: ' +
        (trace.intervals.verify.complete ? '980 ms' : 'pending'),
      960,
      955,
      34,
      themeColors.yellow,
      'center',
    );
  }
}

// These local models mirror the article fixtures; no provider or retrieval service runs here.
export default {
  id: 'latency',
  draw: drawLatency,
  cues: [
    'latency-beat-1-focus-1',
    'latency-beat-1-focus-2',
    'latency-beat-2-focus-1',
    'latency-beat-2-focus-2',
  ],
};
