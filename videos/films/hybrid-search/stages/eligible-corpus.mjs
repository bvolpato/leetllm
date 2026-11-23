import { card, footer, particleGap } from '../defaults.mjs';
export function drawEligibleCorpus(ctx, scene, state, api) {
  const { C: themeColors, components: components, phase } = api;
  const beat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const q = phase(progress, 0.06, 0.85),
    reveal = (step) => (beat > step ? 1 : beat < step ? 0 : q);
  const route = (a, b, color = themeColors.cyan, amount = q) => {
    const r = api.connect(ctx, a, b, {
      color,
      fromGap: particleGap(ctx, api, a, b),
      toGap: particleGap(ctx, api, b, a),
      width: 3,
    });
    components.particle({
      points: [r.from, r.to],
      progress: amount,
      radius: 8,
      fill: color,
    });
  };
  {
    const names = [
      'Garden current',
      'Cooking current',
      'Travel current',
      'Garden archived',
      'Restricted book',
    ];
    const records = names.map((name, i) =>
      api.focus.target('source-records', () =>
        card(ctx, api, name, 145, 270 + i * 122, 360, i < 3 ? themeColors.blue : themeColors.muted),
      ),
    );
    const gate = api.focus.target('access-gate', () =>
      card(ctx, api, 'Access + freshness', 700, 505, 380, themeColors.yellow, 110),
    );
    ['Garden', 'Cooking', 'Travel'].forEach((name, i) => {
      const a = records[i];
      if (reveal(0) > i * 0.22) {
        route(a, gate, themeColors.blue, phase(q, i * 0.2, i * 0.2 + 0.45));
        const out = api.focus.target('eligible-records', () =>
          card(ctx, api, name, 1400, 320 + i * 180, 300, themeColors.green),
        );
        route(gate, out, themeColors.green, q);
      }
    });
    footer(ctx, api, 'Both application lanes receive only permitted, current records');
  }
}
export default {
  id: 'eligible-corpus',
  draw: drawEligibleCorpus,
  cues: ['admit-records', 'shared-corpus', 'recheck-access'],
};
