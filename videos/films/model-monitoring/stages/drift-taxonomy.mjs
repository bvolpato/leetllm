import { chip, cueProgress, cueVisible, dot, footer, line, panel, text } from '../defaults.mjs';
function drawMonitoring(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const done = (key) => state.cues?.[`m-${'drift-taxonomy'}-${key}`]?.phase === 'after';
  const lerp = (a, z, q) => a + (z - a) * q;
  {
    if (currentBeat < 2) {
      const byOutcome = currentBeat === 1;
      text(
        ctx,
        api,
        byOutcome ? 'P(X,Y) = P(Y) × P(X|Y)' : 'P(X,Y) = P(X) × P(Y|X)',
        960,
        338,
        57,
        themeColors.ink,
      );
      const entries = byOutcome
        ? [
            [
              'P(Y)',
              'What share of all jobs miss?',
              cueVisible(ctx, api, 'drift-taxonomy', 'label')
                ? themeColors.pink
                : themeColors.muted,
            ],
            ['P(X|Y)', 'What inputs do we see within each outcome group?', themeColors.blue],
          ]
        : [
            ['P(X)', 'How common are long queues?', themeColors.blue],
            [
              'P(Y|X)',
              'For the same inputs, how often do jobs miss?',
              cueVisible(ctx, api, 'drift-taxonomy', 'conditional')
                ? themeColors.yellow
                : themeColors.muted,
            ],
          ];
      entries.forEach(([term, question, color], i) => {
        const y = 460 + i * 142;
        chip(ctx, api, term, 250, y, 300, color, 76, 40);
        text(ctx, api, question, 642, y + 51, 40, themeColors.ink, 'left');
      });
      footer(
        ctx,
        api,
        byOutcome
          ? 'Pure label shift: the outcome mix changes. The inputs within each group keep their distribution.'
          : 'Group by the queue and heartbeat readings to compare jobs with matching inputs.',
      );
    } else {
      const mix = lerp(0.5, 0.8, cueProgress(ctx, api, 'drift-taxonomy', 'mix')),
        rates = [0.1, 0.4],
        shares = [mix, 1 - mix];
      shares.forEach((share, i) => {
        const x = 290 + i * 810,
          col = i ? themeColors.pink : themeColors.cyan;
        panel(ctx, api, x, 345, 650, 335, col);
        text(
          ctx,
          api,
          `pool ${i ? 'B' : 'A'} · miss rate ${rates[i].toFixed(1)}`,
          x + 325,
          405,
          32,
          col,
        );
        api.rect(ctx, x + 75, 500, 500 * share, 65, col);
        text(ctx, api, `traffic ${(share * 100).toFixed(0)}%`, x + 325, 625, 30, col);
      });
      if (done('result'))
        text(
          ctx,
          api,
          `${mix.toFixed(1)}×0.1 + ${(1 - mix).toFixed(1)}×0.4 = ${(mix * 0.1 + (1 - mix) * 0.4).toFixed(2)}`,
          960,
          780,
          42,
          themeColors.yellow,
        );
      if (currentBeat === 3) {
        const scores = [0.15, 0.32, 0.68, 0.78, 0.91],
          threshold = lerp(0.5, 0.8, cueProgress(ctx, api, 'drift-taxonomy', 'threshold'));
        line(ctx, api, 350, 850, 1570, 850, themeColors.muted);
        scores.forEach((v) =>
          dot(ctx, api, 350 + 1220 * v, 850, v >= threshold ? themeColors.pink : themeColors.cyan),
        );
        line(
          ctx,
          api,
          350 + 1220 * threshold,
          820,
          350 + 1220 * threshold,
          885,
          themeColors.yellow,
          5,
        );
        text(
          ctx,
          api,
          `τ ${threshold.toFixed(2)} · scores fixed`,
          960,
          300,
          30,
          themeColors.yellow,
        );
      }
      footer(
        ctx,
        api,
        currentBeat === 2
          ? 'The aggregate changes as the same two pool rates are reweighted.'
          : 'Inputs, raw scores, threshold decisions and outcomes require separate records.',
      );
    }
  }
}
export function drawDriftTaxonomy(ctx, scene, state, api) {
  return api.focus?.target
    ? api.focus.target('drift-taxonomy-mechanism', () => drawMonitoring(ctx, scene, state, api))
    : drawMonitoring(ctx, scene, state, api);
}
export default {
  id: 'drift-taxonomy',
  draw: drawDriftTaxonomy,
  cues: [
    'drift-taxonomy-beat-0',
    'm-drift-taxonomy-conditional',
    'drift-taxonomy-beat-1',
    'm-drift-taxonomy-label',
    'drift-taxonomy-beat-2',
    'm-drift-taxonomy-mix',
    'm-drift-taxonomy-result',
    'drift-taxonomy-beat-3',
    'm-drift-taxonomy-threshold',
  ],
};
