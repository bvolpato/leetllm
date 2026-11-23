import { FORECAST_CUE_AT } from '../fixtures.mjs';
import { forecastCueProgress } from '../construction.mjs';
import { box, caption, extensionText, line } from '../defaults.mjs';
export function drawTelemetryIdentity(ctx, scene, state, api) {
  if (!Object.keys(FORECAST_CUE_AT).some((id) => id.startsWith('fc-telemetry-identity-'))) return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (suffix) =>
    forecastCueProgress(state, `fc-${'telemetry-identity'}-${suffix}`);
  const done = (suffix) => cueProgress(suffix) >= 1;
  api.focus.target('fc-telemetry-identity-mechanism', () => {
    const rows = [
        ['job-001', 'batch-100', 'started'],
        ['job-001', 'batch-100', 'started'],
        ['job-002', 'batch-101', 'started'],
      ],
      d = cueProgress('dedup');
    extensionText(
      ctx,
      api,
      cueProgress('changed') > 0
        ? 'Same event ID, different job'
        : 'Event ID   ·   Job ID   ·   Event type',
      550,
      325,
      32,
      themeColors.blue,
    );
    extensionText(ctx, api, 'Map keyed by event ID', 1390, 325, 32, themeColors.cyan);
    rows.forEach((r, i) =>
      box(
        ctx,
        api,
        (i === 1 && cueProgress('changed') > 0 ? ['job-001', 'batch-999', 'started'] : r).join(
          ' · ',
        ),
        180,
        400 + i * 125,
        710,
        i === 1
          ? cueProgress('changed') > 0
            ? themeColors.pink
            : themeColors.yellow
          : themeColors.blue,
        27,
      ),
    );
    if (d > 0) {
      for (let i = 0; i < 2; i++)
        if (d * 2 > i) {
          const r = rows[i === 0 ? 0 : 2];
          box(ctx, api, r.join(' · '), 1000, 400 + i * 250, 710, themeColors.green, 27);
        }
      line(ctx, api, 900, 435, 980, 435, themeColors.cyan, 3);
      line(ctx, api, 900, 685, 980, 685, themeColors.cyan, 3);
    }
    if (done('dedup'))
      extensionText(
        ctx,
        api,
        cueProgress('changed') > 0
          ? done('conflict')
            ? '2 accepted IDs · 1 quarantined conflict'
            : 'Changed payload: conflict comparison pending'
          : '3 raw → 2 unique · 1 duplicate',
        960,
        820,
        32,
        cueProgress('changed') > 0 ? themeColors.pink : themeColors.green,
      );
    if (done('conflict')) {
      box(ctx, api, 'Conflict → quarantine', 1000, 535, 710, themeColors.pink, 29);
    }
    caption(
      ctx,
      api,
      done('snapshot')
        ? 'Trace a spike back to unique starts before retraining.'
        : cueProgress('changed') > 0
          ? 'Compare both payloads before accepting the second row.'
          : 'Each distinct start contributes one job.',
    );
  });
  return;
}
export default {
  id: 'telemetry-identity',
  draw: drawTelemetryIdentity,
  cues: [
    'fc-telemetry-identity-rows',
    'fc-telemetry-identity-dedup',
    'fc-telemetry-identity-changed',
    'fc-telemetry-identity-conflict',
    'fc-telemetry-identity-snapshot',
  ],
};
