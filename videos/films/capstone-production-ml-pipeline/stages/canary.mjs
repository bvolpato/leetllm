import { canary, matureQuality } from '../arithmetic.mjs';
import { pendingWindow } from '../fixtures.mjs';
import { sampleModel } from '../construction.mjs';
import { legacyCard, text } from '../defaults.mjs';
export function drawCanary(ctx, scene, state, api) {
  if (skipCanaryUpgrade(ctx, scene, state, api)) return;
  const { C: themeColors, components: components, teaching: teaching } = api,
    modelState = sampleModel('canary', state);
  {
    const decision =
      modelState.b === 1 && !modelState.canaryEvidence.controllerCalled
        ? null
        : canary(modelState.windows);
    if (modelState.b === 0) {
      text(
        ctx,
        api,
        'Illustrative exposure · 4 of 20 requests receive candidate v1',
        960,
        275,
        34,
        themeColors.yellow,
        'center',
      );
      const progress = api.focus.progress(
        'canary-exposure',
        Math.max(0, Math.min(1, ((state.beatP ?? 0) - 0.04) / 0.4)),
      );
      if (progress >= 1) {
        components.panel({
          x: 1110,
          y: 355,
          width: 670,
          height: 210,
          fill: themeColors.panel,
          stroke: themeColors.cyan,
        });
        components.panel({
          x: 1110,
          y: 675,
          width: 670,
          height: 260,
          fill: themeColors.panel,
          stroke: themeColors.blue,
        });
      }
      text(ctx, api, 'CANDIDATE v1 · observed cohort', 1445, 330, 28, themeColors.cyan, 'center');
      if (progress >= 1)
        text(
          ctx,
          api,
          'RETAINED v0 · remaining traffic',
          1445,
          650,
          28,
          themeColors.blue,
          'center',
        );
      for (let i = 0; i < 20; i++) {
        const candidate = i < 4,
          j = candidate ? i : i - 4;
        const targetX = 1145 + (j % 4) * 158;
        const targetY = candidate ? 430 : 710 + Math.floor(j / 4) * 50;
        const mix = api.phase(progress, 0, 1);
        const x = api.lerp(155 + (i % 4) * 145, targetX, mix);
        const y = api.lerp(365 + Math.floor(i / 4) * 105, targetY, mix);
        api.focus.target(candidate ? 'candidate-cohort' : 'retained-cohort', () =>
          components.card({
            label: 'online-' + (i + 1),
            x,
            y,
            width: 135,
            height: api.lerp(58, candidate ? 58 : 38, mix),
            fill: themeColors.panel,
            stroke: candidate ? themeColors.cyan : themeColors.blue,
            textColor: candidate ? themeColors.cyan : themeColors.blue,
            padding: 7,
            fontSize: 20,
          }),
        );
      }
      if (progress >= 1) {
        api.focus.target('fast-health', () =>
          legacyCard(
            ctx,
            api,
            `Day ${pendingWindow.day} · p95 ${pendingWindow.ms} ms · error ${pendingWindow.error}`,
            155,
            400,
            630,
            themeColors.green,
            100,
          ),
        );
        api.focus.target('pending-labels', () =>
          legacyCard(
            ctx,
            api,
            `Outcome labels ${modelState.canaryEvidence.labelCount} / ${modelState.canaryEvidence.expected} · pending`,
            155,
            585,
            630,
            themeColors.yellow,
            100,
          ),
        );
        api.focus.target('pending-decision', () =>
          legacyCard(
            ctx,
            api,
            `${decision} · delayed quality pending`,
            155,
            785,
            630,
            themeColors.yellow,
            100,
          ),
        );
      }
      text(
        ctx,
        api,
        'online-1…4 keep their identities when delayed labels arrive',
        960,
        990,
        29,
        themeColors.cyan,
        'center',
      );
      return;
    }
    if (modelState.b < 2) {
      const evidence = modelState.canaryEvidence;
      modelState.windows.forEach((window, index) => {
        api.focus.target('ordered-health', () =>
          legacyCard(
            ctx,
            api,
            `Day ${window.day} · p95 ${window.ms} ms · error ${window.error}`,
            170 + index * 820,
            285,
            730,
            themeColors.blue,
            90,
          ),
        );
      });
      text(
        ctx,
        api,
        'Outcome receipts · supplied cost units',
        690,
        425,
        29,
        themeColors.muted,
        'center',
      );
      api.focus.target('outcome-rows', () =>
        teaching.grid({
          x: 170,
          y: 455,
          width: 1040,
          height: 350,
          rows: 5,
          columns: 4,
          labels: [
            ['Request', 'Outcome', 'Candidate', 'Baseline'],
            ...evidence.rows.map((row) => [
              row.id,
              row.label === null ? 'pending' : row.label ? 'LATE' : 'ON TIME',
              row.candidateCost ?? '—',
              row.baselineCost ?? '—',
            ]),
          ],
          fontSize: 27,
          padding: 12,
          fill: themeColors.panel,
          stroke: themeColors.muted,
          textColor: themeColors.ink,
        }),
      );
      components.panel(
        {
          x: 1270,
          y: 425,
          width: 470,
          height: 385,
          fill: themeColors.panel,
          stroke: themeColors.muted,
          padding: 20,
        },
        () => {
          text(ctx, api, 'Outcome labels', 1505, 475, 27, themeColors.muted, 'center');
          api.focus.target('label-count', () =>
            text(
              ctx,
              api,
              `${evidence.labelCount} / ${evidence.expected}`,
              1505,
              530,
              43,
              evidence.labelCount === evidence.expected ? themeColors.green : themeColors.yellow,
              'center',
            ),
          );
          api.focus.target('received-costs', () =>
            text(
              ctx,
              api,
              `Received costs: ${evidence.costCount} / ${evidence.expected}`,
              1505,
              595,
              28,
              themeColors.muted,
              'center',
            ),
          );
          api.focus.target('cost-sums', () =>
            text(
              ctx,
              api,
              evidence.costCount
                ? `Sums: ${evidence.candidateTotal} / ${evidence.baselineTotal}`
                : 'Cost sums: pending',
              1505,
              660,
              31,
              themeColors.cyan,
              'center',
            ),
          );
          const quality = matureQuality(evidence.window);
          if (quality && api.focus.progress('pipe-result-canary-quality-delta', 0) === 1)
            api.focus.target('quality-delta', () =>
              api.math(
                ctx,
                String.raw`\frac{${quality.candidateCost}}{${quality.baselineCost}}-1=${(quality.delta * 100).toFixed(0)}\%`,
                1505,
                750,
                38,
                themeColors.green,
                'center',
              ),
            );
          else
            text(ctx, api, 'Complete delta: pending', 1505, 745, 27, themeColors.yellow, 'center');
        },
      );
      const called =
        evidence.controllerCalled && api.focus.progress('pipe-result-canary-ready', 0) === 1;
      api.focus.target('ready-decision', () =>
        text(
          ctx,
          api,
          called ? decision : 'Controller call pending',
          960,
          905,
          called ? 60 : 38,
          called
            ? decision === 'READY'
              ? themeColors.green
              : themeColors.yellow
            : themeColors.muted,
          'center',
        ),
      );
      return;
    }
    text(
      ctx,
      api,
      'Supplied monitoring windows · local controller',
      960,
      275,
      35,
      themeColors.ink,
      'center',
    );
    modelState.windows.forEach((w, i) => {
      const x = 240 + i * 760,
        quality = matureQuality(w);
      api.focus.target('history-windows', () =>
        legacyCard(
          ctx,
          api,
          'Window ' + (i + 1) + ' · day ' + w.day,
          x,
          380,
          620,
          themeColors.blue,
        ),
      );
      api.focus.target('history-health', () =>
        text(
          ctx,
          api,
          'p95 ' + w.ms + ' ms · error ' + w.error,
          x + 310,
          580,
          31,
          themeColors.cyan,
          'center',
        ),
      );
      api.focus.target('history-labels', () =>
        text(
          ctx,
          api,
          quality === null
            ? 'Outcome labels: pending'
            : 'Mature labels: ' + quality.count + ' / ' + quality.count,
          x + 310,
          665,
          31,
          quality === null ? themeColors.yellow : themeColors.green,
          'center',
        ),
      );
      api.focus.target(i === 0 ? 'earlier-cost' : 'later-cost', () =>
        text(
          ctx,
          api,
          quality === null
            ? 'Late-warning cost: unavailable'
            : 'Late-warning cost: ' +
                quality.candidateCost +
                ' / ' +
                quality.baselineCost +
                ' − 1 = ' +
                (quality.delta > 0 ? '+' : '') +
                (quality.delta * 100).toFixed(0) +
                '%',
          x + 310,
          750,
          28,
          quality === null
            ? themeColors.muted
            : quality.delta > 0
              ? themeColors.pink
              : themeColors.green,
          'center',
        ),
      );
    });
    api.focus.target('abort-decision', () =>
      text(
        ctx,
        api,
        api.focus.progress('pipe-result-earlier-regression-abort', 0) === 1
          ? decision
          : 'Controller result pending',
        960,
        870,
        66,
        api.focus.progress('pipe-result-earlier-regression-abort', 0) === 1
          ? decision === 'READY'
            ? themeColors.green
            : decision === 'ABORT'
              ? themeColors.pink
              : themeColors.yellow
          : themeColors.muted,
        'center',
      ),
    );
  }
}
function skipCanaryUpgrade(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress2 = state.beatP ?? 0;
  return false;
}
export default {
  id: 'canary',
  draw: drawCanary,
  cues: [
    'canary-exposure',
    'canary-b1-2',
    'canary-b1-3',
    'canary-b2-1',
    'canary-b2-2',
    'canary-b2-3',
    'canary-b2-4',
    'canary-labels-rise',
    'canary-costs-rise',
    'pipe-result-canary-quality-delta',
    'pipe-result-canary-ready',
    'canary-b3-1',
    'canary-b3-2',
    'canary-b3-3',
    'pipe-result-earlier-regression-abort',
  ],
};
