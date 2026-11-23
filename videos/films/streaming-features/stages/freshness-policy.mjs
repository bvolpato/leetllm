import { formatClock, sourceFreshness } from '../arithmetic.mjs';
import { minuteScale, requestLine, spoken } from '../request-clock.mjs';

export function drawFreshnessPolicy(ctx, scene, state, api) {
  const clock = spoken(scene, state);
  const { C } = api;
  const now = 720;
  const x = minuteScale(625, now, 560, 1650);
  const cases = [
    { through: 712, cue: 'normal', label: 'Normal scoring' },
    { through: 690, cue: 'degraded', label: 'Validated fallback' },
    { through: 630, cue: 'abstain', label: 'Withhold estimate' },
  ];
  api.text(ctx, 'Three possible feeds at noon', 106, 230, 35, C.muted);
  api.focus.target('coverage-span', () => {
    requestLine(ctx, api, x, now, 328, 837);
    cases.forEach(({ through, cue, label }, i) => {
      if (i > 0 && !clock.started(i === 1 ? 'second' : 'third')) return;
      const result = sourceFreshness(through * 60, now * 60);
      const ready = clock.finished(cue);
      const y = 410 + 178 * i;
      api.text(ctx, `Covered through ${formatClock(through)}`, 108, y + 10, 34, C.blue);
      api.line(ctx, x(625), y, x(now), y, '#3b414a', 3);
      api.line(ctx, x(through), y, x(now), y, C.blue, 9);
      api.circle(ctx, x(through), y, 11, C.blue);
      if (ready)
        api.text(
          ctx,
          `${result.lagSeconds / 60} min   ·   ${label}`,
          x(now) - 24,
          y + 65,
          37,
          result.mode === 'abstain' ? C.pink : C.ink,
          'right',
        );
    });
  });
  api.text(ctx, 'Source lag (min)', 108, 958, 35, C.muted);
  api.text(ctx, '≤ 15   normal', 465, 958, 34, C.ink);
  api.text(ctx, '15 < lag ≤ 45   fallback', 912, 958, 34, C.ink);
  api.text(ctx, '> 45   abstain', 1450, 958, 34, C.ink);
}
export default {
  id: 'freshness-policy',
  draw: drawFreshnessPolicy,
  cues: ['normal', 'second', 'degraded', 'third', 'abstain'].map(
    (id) => 'sf-freshness-policy-' + id,
  ),
};
