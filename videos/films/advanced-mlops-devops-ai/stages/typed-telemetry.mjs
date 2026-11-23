import { RELEASE_RULES, ReleaseMetricSample, releaseTelemetry } from '../telemetry.mjs';
import { releaseSentenceProgress } from '../construction.mjs';
import {
  drawReleaseBox,
  drawReleaseFooter,
  drawReleaseHeading,
  drawReleaseText,
} from '../defaults.mjs';
export function drawTypedTelemetry(ctx, scene, state, api) {
  if (paintTypedTelemetry(ctx, scene, state, api)) return;
}
function paintTypedTelemetry(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (beat, i = 0) => releaseSentenceProgress(state, 'typed-telemetry', beat, i);
  api.focus.target('typed-telemetry-construction', () => paintReleaseContent());
  return true;
  function paintReleaseContent() {
    drawReleaseHeading(ctx, api, 'Validate a MetricSample before reading its threshold result');
    const base = new ReleaseMetricSample({
      value: 790,
      release: 'release-a91',
      window: '5m',
      count: 2000,
      age: 30,
    });
    const mutations = [
      [
        'NaN age',
        {
          ...base,
          age: NaN,
        },
      ],
      [
        'NaN count',
        {
          ...base,
          count: NaN,
        },
      ],
      [
        'fractional count',
        {
          ...base,
          count: 2000.5,
        },
      ],
      [
        'Boolean value',
        {
          ...base,
          value: false,
        },
      ],
      [
        'huge value',
        {
          ...base,
          value: Infinity,
        },
      ],
      [
        'wrong record',
        {
          ...base,
        },
      ],
    ].map(([label, value]) => [
      label,
      label === 'wrong record' ? value : new ReleaseMetricSample(value),
    ]);
    const ix = currentBeat === 2 ? Math.min(5, Math.floor(cueProgress(2, 0) * 6)) : 0,
      sample = currentBeat === 2 ? mutations[ix][1] : base,
      fields = ['value', 'release', 'window', 'count', 'age'],
      badField = ['age', 'count', 'count', 'value', 'value', null][ix];
    drawReleaseBox(
      ctx,
      api,
      currentBeat === 2 ? mutations[ix][0] : 'MetricSample',
      200,
      340,
      650,
      85,
      currentBeat === 2 ? themeColors.pink : themeColors.blue,
      32,
    );
    fields.forEach((key, i) => {
      drawReleaseText(ctx, api, key, 220, 510 + i * 80, 29, themeColors.muted);
      drawReleaseText(
        ctx,
        api,
        Object.hasOwn(sample, key) ? String(sample[key]) : 'missing',
        600,
        510 + i * 80,
        31,
        key === badField && currentBeat === 2 ? themeColors.pink : themeColors.blue,
        'center',
      );
    });
    const gates =
      currentBeat === 0
        ? ['expected record type', 'finite real value', 'Boolean excluded']
        : currentBeat === 1
          ? ['release + window', 'integer count ≥ 100', 'integer age ≥ 0', 'domain + freshness']
          : ['invalid record', 'unavailable policy', 'no healthy declaration'];
    gates.forEach((text, i) => {
      if (cueProgress(currentBeat, Math.min(i, 2)) > 0 || currentBeat === 2)
        drawReleaseBox(
          ctx,
          api,
          text,
          1050,
          370 + i * 155,
          690,
          110,
          currentBeat === 2
            ? themeColors.pink
            : i === gates.length - 1
              ? themeColors.green
              : themeColors.cyan,
          31,
        );
    });
    if (currentBeat === 2) {
      const result = releaseTelemetry(RELEASE_RULES[0], sample);
      drawReleaseText(
        ctx,
        api,
        result.action.toUpperCase(),
        1400,
        950,
        43,
        themeColors.pink,
        'center',
      );
    }
    drawReleaseFooter(ctx, api, 'Check the release, window and values on the record you received');
  }
}
export default {
  id: 'typed-telemetry',
  draw: drawTypedTelemetry,
  cues: [
    'typed-telemetry-b1',
    'typed-telemetry-s0-0',
    'typed-telemetry-s0-1',
    'typed-telemetry-s0-2',
    'typed-telemetry-s0-3',
    'typed-telemetry-b2',
    'typed-telemetry-s1-0',
    'typed-telemetry-s1-1',
    'typed-telemetry-s1-2',
    'typed-telemetry-s1-3',
    'typed-telemetry-b3',
    'typed-telemetry-s2-0',
    'typed-telemetry-s2-1',
    'typed-telemetry-s2-2',
    'typed-telemetry-s2-3',
  ],
};
