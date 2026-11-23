import { cueStep } from '../construction.mjs';
import { metropolisAcceptance } from '../arithmetic.mjs';

const low = 0.5,
  high = 0.6;
const weight = (p) => p ** 9 * (1 - p) ** 3;
const forwardRatio = weight(high) / weight(low);
const back = metropolisAcceptance(high, low);
const corrected = metropolisAcceptance(high, low, 0.5);
const reverseDraw = 0.4,
  asymmetricDraw = 0.25;
const afterReverse = reverseDraw <= back ? low : high;
const afterCorrection = asymmetricDraw <= corrected ? low : afterReverse;
const density = (p) => weight(p) / weight(0.75);
const plotX = (p) => 190 + p * 650;
const plotY = (p) => 696 - 282 * density(p);
const dialX = (u) => 1005 + 707 * u;

export function drawMetropolisDecision(ctx, scene, state, api) {
  const { C } = api;
  const target = cueStep(state, 'sp-metropolis-decision-0', 0, 0.18, 0.65);
  const outward = cueStep(state, 'sp-mh-accept', 1, 0.42, 0.76);
  const reverse = cueStep(state, 'sp-mh-reverse', 2, 0.12, 0.5);
  const probe = cueStep(state, 'mh-uniform', 2, 0.62, 0.79);
  const reject = cueStep(state, 'sp-metropolis-decision-1', 3, 0.08, 0.28);
  const factor = cueStep(state, 'sp-metropolis-decision-2', 4, 0.18, 0.51);
  const next = cueStep(state, 'mh-fresh-draw', 4, 0.59, 0.8);
  const last = cueStep(state, 'mh-record-last', 5, 0.05, 0.38);
  const acceptance = 1 - (1 - back) * reverse - (back - corrected) * factor;
  api.focus.target('sp-metropolis-decision-visual', () => {
    api.text(ctx, 'Posterior weight', 172, 298, 37, C.ink);
    api.line(ctx, plotX(0), 696, plotX(1), 696, C.muted, 3);
    const curve = [];
    for (let k = 0; k <= Math.floor(target * 150); k++)
      curve.push({ x: plotX(k / 150), y: plotY(k / 150) });
    if (curve.length > 1) api.path(ctx, curve, { color: C.blue, width: 5 });
    const current = low + (high - low) * outward;
    const proposal = reverse > 0 ? low : high;
    if (state.beat > 0) {
      api.line(ctx, plotX(proposal), 696, plotX(proposal), plotY(proposal), C.yellow, 3);
      api.circle(ctx, plotX(proposal), plotY(proposal), 15, C.bg, C.yellow, 3);
    }
    api.circle(ctx, plotX(current), plotY(current), 12, C.cyan);
    api.text(ctx, '0.50', plotX(low) - 9, 751, 30, C.ink, 'right');
    api.text(ctx, '0.60', plotX(high) + 9, 751, 30, C.ink);
    api.text(ctx, 'resolution probability', (plotX(0) + plotX(1)) / 2, 808, 30, C.muted, 'center');
    if (state.beat === 0) {
      const resolved = 8,
        escalated = 2;
      api.text(ctx, 'One dot per request', 1345, 295, 38, C.ink, 'center');
      for (let i = 0; i < resolved + escalated; i++)
        api.circle(ctx, 1057 + i * 64, 368, 18, i < resolved ? C.cyan : C.pink);
      api.text(ctx, resolved + ' resolved', 1140, 447, 37, C.cyan, 'center');
      api.text(ctx, escalated + ' escalated', 1550, 447, 37, C.pink, 'center');
      api.text(ctx, 'Prior   Beta(2, 2)', 1345, 544, 37, C.muted, 'center');
      if (target === 1) {
        api.text(
          ctx,
          'Posterior   Beta(' + (2 + resolved) + ', ' + (2 + escalated) + ')',
          1345,
          629,
          46,
          C.ink,
          'center',
        );
        api.math(ctx, 'w(p)=p^9(1-p)^3', 1345, 734, 49, C.ink, 'center');
      }
    }
    if (state.beat >= 1) {
      api.text(
        ctx,
        reverse === 0 ? 'Propose 0.50 → 0.60' : 'Propose 0.60 → 0.50',
        1005,
        298,
        37,
        C.ink,
      );
      const ratio = reverse === 0 ? forwardRatio : 1 / forwardRatio;
      api.text(ctx, 'target ratio   ' + ratio.toFixed(3), 1005, 384, 37, C.muted);
      if (factor > 0) api.text(ctx, '× 0.5', 1532, 384, 43, C.yellow);
      api.rect(ctx, dialX(0), 536, dialX(1) - dialX(0), 55, C.panel, C.muted, 2);
      if (outward > 0) {
        const end = dialX(acceptance * outward);
        api.rect(ctx, dialX(0), 536, end - dialX(0), 55, C.cyan, null, 2);
        if (outward === 1 && (reverse === 0 || reverse === 1) && (factor === 0 || factor === 1)) {
          api.text(
            ctx,
            'accept up to ' + acceptance.toFixed(3),
            end,
            489,
            34,
            C.cyan,
            end > 1490 ? 'right' : 'center',
          );
        }
      }
      api.text(ctx, '0', dialX(0), 643, 29, C.muted, 'center');
      api.text(ctx, '1', dialX(1), 643, 29, C.muted, 'center');
      const showProbe = state.beat < 4 ? probe > 0 : next > 0;
      if (showProbe) {
        const u = state.beat < 4 ? reverseDraw : asymmetricDraw;
        const x = dialX(u);
        api.line(ctx, x, 554, x, 661, C.yellow, 4);
        api.circle(ctx, x, 661, 11, C.yellow);
        api.text(ctx, 'draw ' + u.toFixed(2), x, 725, 39, C.yellow, 'center');
      }
    }
    api.text(ctx, 'Recorded states', 184, 943, 36, C.ink);
    const slots = [
      [low, true, true],
      [high, outward === 1, state.beat >= 1],
      [afterReverse, reject === 1, state.beat >= 2],
      [afterCorrection, last === 1, state.beat >= 4],
    ];
    slots.forEach(([value, recorded, inView], i) => {
      if (!inView) return;
      const x = 617 + 268 * i;
      if (i) api.line(ctx, x - 178, 929, x - 75, 929, C.muted, 3);
      api.rect(
        ctx,
        x - 72,
        875,
        144,
        108,
        C.panel,
        recorded ? (i >= 2 ? C.yellow : C.cyan) : C.muted,
        12,
      );
      api.text(
        ctx,
        recorded ? value.toFixed(2) : '?',
        x,
        944,
        43,
        recorded ? C.ink : C.muted,
        'center',
      );
    });
  });
}

export default {
  id: 'metropolis-decision',
  draw: drawMetropolisDecision,
  cues: [
    'sp-metropolis-decision-0',
    'sp-mh-accept',
    'sp-mh-reverse',
    'mh-uniform',
    'sp-metropolis-decision-1',
    'sp-metropolis-decision-2',
    'mh-fresh-draw',
    'mh-record-last',
  ],
};
