import { phase } from '../arithmetic.mjs';
import { sampleOriginalModel } from '../construction.mjs';
import { legacyCard, legacyMath, legacyText } from '../defaults.mjs';
function drawLegacyCostPrivacy(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleOriginalModel('cost-privacy', state);
  {
    if (modelState.step === 2) {
      legacyText(
        ctx,
        api,
        'An allowlist creates the operational record',
        960,
        300,
        32,
        themeColors.ink,
        'center',
      );
      const source = legacyCard(
        ctx,
        api,
        'Private request context',
        170,
        390,
        560,
        90,
        themeColors.pink,
        28,
      );
      legacyText(ctx, api, 'Customer question (excerpt):', 195, 550, 25, themeColors.muted);
      legacyText(ctx, api, 'Can I rotate the stale key for', 195, 605, 25, themeColors.ink);
      legacyText(ctx, api, 'account 10234?', 195, 650, 25, themeColors.ink);
      legacyText(ctx, api, 'API credential: server secret', 195, 730, 25, themeColors.pink);
      legacyText(ctx, api, 'Raw text + account ID + secret', 195, 835, 24, themeColors.pink);
      legacyText(ctx, api, 'excluded from the log', 195, 880, 26, themeColors.pink);
      const target = api.focus.target('scrubbed-api-record', () =>
        legacyCard(ctx, api, 'Redacted telemetry', 880, 390, 860, 90, themeColors.green, 28),
      );
      const reveal = phase(modelState.p, 0.04, 0.8);
      teaching.transfer({
        source: {
          shape: source,
          opacity: 1,
        },
        target: {
          shape: target,
          opacity: 1,
        },
        color: themeColors.green,
        gap: 20,
        progress: reveal,
        particle: {
          radius: 8,
          fill: themeColors.green,
        },
      });
      const rows = [
        ['model', modelState.log.model],
        ['prompt version', modelState.log.promptVersion],
        ['latency', `${modelState.log.latencyMs} ms`],
        [
          'reported tokens',
          `${modelState.log.inputTokens} in / ${modelState.log.outputTokens} out`,
        ],
        ['estimated cost', `$${modelState.log.estimatedCost.toFixed(5)}`],
        ['outcome', modelState.log.status],
        ['question HMAC', modelState.log.questionFingerprint.slice(0, 16) + '…'],
        ['missing usage', 'unknown until reconciliation'],
      ];
      const count = Math.ceil(rows.length * reveal);
      rows.slice(0, count).forEach((row, i) => {
        const y = 540 + i * 52;
        legacyText(ctx, api, row[0], 895, y, 24, themeColors.muted);
        legacyText(
          ctx,
          api,
          row[1],
          1200,
          y,
          24,
          i === 6 ? themeColors.yellow : themeColors.ink,
          'left',
          'mono',
        );
      });
      void 0;
      return;
    }
    legacyText(
      ctx,
      api,
      'Attribute cost and trace useful outcomes without retaining raw prompts',
      960,
      305,
      31,
      themeColors.ink,
      'center',
    );
    legacyMath(
      ctx,
      api,
      String.raw`250\times\frac{\$2}{1{,}000{,}000}` +
        (modelState.inputProgress === 1 ? String.raw`=\$0.00050` : ''),
      960,
      430,
      41,
      themeColors.blue,
    );
    if (modelState.step > 0 || modelState.elapsed >= 3.7)
      legacyMath(
        ctx,
        api,
        String.raw`80\times\frac{\$6}{1{,}000{,}000}` +
          (modelState.outputProgress === 1 ? String.raw`=\$0.00048` : ''),
        960,
        555,
        41,
        themeColors.pink,
      );
    const inputWidth = (1340 * modelState.currentInput) / modelState.totalCost,
      outputWidth = (1340 * modelState.currentOutput) / modelState.totalCost;
    api.rect(ctx, 290, 650, 1340, 55, themeColors.panel, themeColors.muted, 6);
    if (inputWidth > 0)
      api.rect(ctx, 290, 650, inputWidth, 55, themeColors.blue, themeColors.blue, 0);
    if (outputWidth > 0)
      api.rect(ctx, 290 + inputWidth, 650, outputWidth, 55, themeColors.pink, themeColors.pink, 0);
    legacyText(
      ctx,
      api,
      'Input $' + modelState.currentInput.toFixed(5),
      290,
      755,
      28,
      themeColors.blue,
    );
    legacyText(
      ctx,
      api,
      'Output $' + modelState.currentOutput.toFixed(5),
      1130,
      755,
      28,
      themeColors.pink,
    );
    const cost = modelState.currentInput + modelState.currentOutput;
    teaching.changeCue(
      {
        x: 520,
        y: 787,
        width: 880,
        height: 73,
        from: 0,
        to: cost,
        progress: 1,
        color: themeColors.yellow,
        emphasis: modelState.step === 0 ? 0.3 : 0,
      },
      () =>
        api.focus.target('request-cost-calculation', () =>
          legacyText(
            ctx,
            api,
            'Per call · $' + cost.toFixed(5),
            960,
            835,
            37,
            themeColors.yellow,
            'center',
          ),
        ),
    );
    if (modelState.dailyVisible)
      legacyMath(
        ctx,
        api,
        String.raw`\$0.00098\times200{,}000=\$196\;\text{per day}`,
        960,
        920,
        37,
        themeColors.cyan,
      );
    if (modelState.daysVisible) {
      const label = modelState.monthlyVisible
        ? String.raw`\$196\times30=\$5{,}880`
        : String.raw`\$196\times30=\;?`;
      api.focus.target('monthly-api-cost', () =>
        legacyMath(
          ctx,
          api,
          label,
          960,
          1010,
          40,
          modelState.monthlyVisible ? themeColors.green : themeColors.yellow,
        ),
      );
      if (modelState.monthlyVisible)
        teaching.changeCue({
          x: 560,
          y: 962,
          width: 800,
          height: 77,
          from: 0,
          to: modelState.monthlyCost,
          progress: 1,
          color: themeColors.green,
          emphasis: Math.max(0, 1 - (modelState.elapsed - 4.85) / 0.6),
        });
    }
  }
}
export function drawCostPrivacy(ctx, scene, state, api) {
  if (!state.cues) {
    drawLegacyCostPrivacy(ctx, scene, state, api);
    return;
  }
  const currentBeat = state.beat,
    u = api.focus.progress('ap-cost-privacy-' + currentBeat),
    done = u >= 0.999999;
  drawLegacyCostPrivacy(ctx, scene, state, api);
}
export default {
  id: 'cost-privacy',
  draw: drawCostPrivacy,
  cues: [
    'request-cost-calculation-b1-1',
    'ap-cost-privacy-0',
    'monthly-api-cost-b2-1',
    'ap-cost-privacy-1',
    'scrubbed-api-record-b3-1',
    'ap-cost-privacy-2',
  ],
};
