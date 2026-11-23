import { SHADOW_ROWS } from '../fixtures.mjs';
import { shadowReplay } from '../model.mjs';
import { cueProgress } from '../arithmetic.mjs';

export function drawShadowPopulation(ctx, scene, state, api) {
  const { C } = api;
  const txt = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const middle = cueProgress(state, 1, 'sc-shadow-four', 0.02, 0.23) > 0;
  const strict = cueProgress(state, 2, 'sc-shadow-one', 0.03, 0.24) > 0;
  const cutoff = strict ? 0.999 : middle ? 0.995 : 0.99;
  const r = shadowReplay(cutoff);
  const groups = [
    ['All requests', SHADOW_ROWS],
    ['Eligible', SHADOW_ROWS.filter((p) => p.eligible)],
    ['Proposed', r.proposals],
    ['Acceptable proposals', r.good],
  ];
  const xs = SHADOW_ROWS.map((_, i) => 610 + i * 145);
  api.focus.target('population', () => {
    txt('Retention paraphrases', (xs[0] + xs[3]) / 2, 262, 32, C.cyan, 'center');
    for (const [j, name] of ['Restore', 'Live', 'Write'].entries())
      txt(name, xs[j + 4], 262, 32, j ? C.muted : C.pink, 'center');
    groups.forEach(([label, cases], i) => {
      const y = 368 + i * 120;
      txt(label, 110, y + 12, 37);
      for (const [j, p] of SHADOW_ROWS.entries()) {
        const present = cases.includes(p);
        if (present) {
          const color = p.correct ? C.cyan : p.eligible ? C.pink : C.muted;
          api.circle(ctx, xs[j], y, 35, C.panel, color, 3);
          txt(p.id, xs[j], y + 11, 29, color, 'center');
        } else api.line(ctx, xs[j] - 10, y, xs[j] + 10, y, C.muted, 2);
      }
      txt(String(cases.length), 1700, y + 14, 50, C.ink, 'center');
    });
  });
  api.line(ctx, 110, 795, 1810, 795, C.panel, 3);
  api.focus.target('population-ratios', () => {
    txt('Cutoff  ≥ ' + cutoff.toFixed(3), 110, 873, 39, C.yellow);
    txt('All requests', 590, 858, 31, C.muted);
    txt(r.proposals.length + ' / ' + r.total + ' proposed', 590, 934, 46);
    txt('Eligible requests', 1180, 858, 31, C.muted);
    txt(r.proposals.length + ' / ' + r.eligible + ' proposed', 1180, 934, 46);
  });
}
export default {
  id: 'shadow-population',
  draw: drawShadowPopulation,
  cues: ['shadow-seven', 'sc-shadow-four', 'sc-shadow-one'],
};
