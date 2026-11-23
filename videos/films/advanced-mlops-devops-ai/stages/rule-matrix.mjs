import { RELEASE_RULES, ReleaseMetricSample, releaseTelemetry } from '../telemetry.mjs';
import { releaseSentenceProgress } from '../construction.mjs';
import {
  drawReleaseBox,
  drawReleaseFooter,
  drawReleaseHeading,
  drawReleaseLine,
  drawReleaseText,
  releaseActionColor,
} from '../defaults.mjs';
export function drawRuleMatrix(ctx, scene, state, api) {
  if (paintRuleMatrix(ctx, scene, state, api)) return;
}
function paintRuleMatrix(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (beat, i = 0) => releaseSentenceProgress(state, 'rule-matrix', beat, i),
    resultComplete = (beat, i = 0) => cueProgress(beat, i) >= 1;
  api.focus.target('rule-matrix-construction', () => paintReleaseContent());
  return true;
  function paintReleaseContent() {
    drawReleaseHeading(
      ctx,
      api,
      'Supplied release-a91 aggregates · each metric keeps its own units and window',
    );
    const values = [910, 0.79, 0.001, 0.93],
      counts = [2000, 300, 2000, 1000];
    RELEASE_RULES.forEach((rule, i) => {
      const y = 365 + i * 145,
        ready = i < 2 ? cueProgress(0, i) > 0 : cueProgress(1, i - 2) > 0,
        visible = (currentBeat > 0 && i < 2) || currentBeat > 1 || ready;
      drawReleaseText(ctx, api, rule.id, 180, y + 35, 29, themeColors.blue);
      drawReleaseText(
        ctx,
        api,
        rule.window + ' · n=' + counts[i],
        480,
        y + 35,
        25,
        themeColors.muted,
        'center',
      );
      drawReleaseText(
        ctx,
        api,
        'Age 30 / ' + rule.age + ' s max',
        480,
        y + 80,
        24,
        themeColors.muted,
        'center',
      );
      const left = 710,
        width = 600,
        max = i === 0 ? 1000 : i === 2 ? 0.005 : 1,
        threshold = rule.max ?? rule.min;
      drawReleaseLine(ctx, api, left, y + 25, left + width, y + 25, themeColors.muted, 3);
      drawReleaseLine(
        ctx,
        api,
        left + (width * threshold) / max,
        y - 10,
        left + (width * threshold) / max,
        y + 65,
        themeColors.yellow,
        4,
      );
      drawReleaseText(
        ctx,
        api,
        (rule.max === undefined ? 'Min ' : 'Max ') + threshold,
        left + (width * threshold) / max,
        y + 99,
        25,
        themeColors.yellow,
        'center',
      );
      if (visible) {
        api.circle(
          ctx,
          left + (width * values[i]) / max,
          y + 25,
          12,
          i < 2 ? themeColors.pink : themeColors.green,
        );
        drawReleaseText(
          ctx,
          api,
          String(values[i]) + (i === 0 ? ' ms' : ''),
          1430,
          y + 35,
          30,
          themeColors.ink,
          'center',
        );
        const result = releaseTelemetry(
          rule,
          new ReleaseMetricSample({
            value: values[i],
            release: 'release-a91',
            window: rule.window,
            count: counts[i],
            age: 30,
          }),
        );
        drawReleaseBox(
          ctx,
          api,
          result.action.toUpperCase(),
          1530,
          y - 15,
          240,
          85,
          releaseActionColor(ctx, api, result.action),
          27,
        );
      } else drawReleaseText(ctx, api, 'pending', 1430, y + 35, 28, themeColors.muted, 'center');
    });
    if (currentBeat === 2 && resultComplete(2, 1))
      drawReleaseText(
        ctx,
        api,
        'ROLLBACK outranks REVIEW under this declared policy',
        960,
        1005,
        35,
        themeColors.pink,
        'center',
      );
    else
      drawReleaseFooter(
        ctx,
        api,
        'Validate identity, type, count and age before applying a threshold',
      );
  }
}
export default {
  id: 'rule-matrix',
  draw: drawRuleMatrix,
  cues: [
    'rule-matrix-b1',
    'rule-matrix-s0-0',
    'rule-matrix-s0-1',
    'rule-matrix-s0-2',
    'rule-matrix-b2',
    'rule-matrix-s1-0',
    'rule-matrix-s1-1',
    'rule-matrix-s1-2',
    'rule-matrix-b3',
    'rule-matrix-s2-0',
    'rule-matrix-s2-1',
    'rule-matrix-s2-2',
    'rule-matrix-s2-3',
    'rule-matrix-s2-4',
  ],
};
