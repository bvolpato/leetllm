// Scene 14: stable-eligibility: "Stability preserves the distribution within its numeric limits"
// View 1 (Beat 0): Naive exp(1000) overflow flash vs max-shifted [0, -1] + MathJax stable softmax,
//   revealing 0.731 / 0.269 strictly AFTER dec-stable-probabilities.
// View 2 (Beats 1-2): Luminous 4-lane eligibility router separating finite logits, -Infinity mask,
//   NaN/+Infinity rejection, all-masked rejection, and exact T = 0 argmax vs T > 0 softmax.
import { COSMOS, glowTex, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  ROLE,
  cinemaAtmosphere,
  decodeSoftmax,
  fmt,
  glowVector,
  lumBar,
  playCue,
  swapVis,
} from '../parts.mjs';

export default function stableEligibility(s, c) {
  const title = heroTitle(['Numerical stability', '& eligibility checks'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.active,
  });

  const vStable = s.value(1);
  const vRouter = s.value(0);

  const shiftAnim = s.value(0);
  const showProbs = s.value(0);
  const laneMode = s.value(0); // 0 = Beat 1 eligibility checks, 1 = Beat 2 T=0 vs T>0 contract
  const laneSweep = s.value(1);

  const stableProbs = decodeSoftmax([1000, 999]);

  // VIEW 1: Overflow vs Max-Shift
  const stableLayer = guardedDynamic(vStable, (alpha) => {
    const nodes = [];
    const sh = shiftAnim.value;
    const ready = showProbs.value > 0.4;

    // Left: Naive overflow path
    nodes.push(
      txt('Naive exp(z)', -480, -225, 32, ROLE.pruned, 'mono', 'center').opacity(alpha),
      lumBar(-480, -110, 480, 82, {
        color: ROLE.base,
        fillOpacity: 0.22,
        strokeWidth: 2.2,
        glow: 7,
        radius: 12,
        opacity: alpha,
      }),
      txt('[ 1000 ,  999 ]', -480, -110, 34, COSMOS.ink, 'mono', 'center').opacity(alpha),
      glowVector([-480, -55], [-480, 25], {
        color: ROLE.pruned,
        width: 4,
        glow: 9,
        opacity: alpha,
      }),
      lumBar(-480, 110, 480, 92, {
        color: ROLE.pruned,
        fillOpacity: 0.28,
        strokeWidth: 2.8,
        glow: 12,
        radius: 12,
        opacity: alpha,
      }),
      txt('exp(1000) -> Inf -> NaN', -480, 110, 32, ROLE.pruned, 'mono', 'center')
        .glow(8, ROLE.pruned)
        .opacity(alpha),
    );

    // Right: Max-shifted stable path
    nodes.push(
      txt('Subtract m = max(z) = 1000', 370, -225, 32, ROLE.valid, 'mono', 'center').opacity(alpha),
      lumBar(370, -110, 520, 82, {
        color: ROLE.active,
        fillOpacity: 0.24,
        strokeWidth: 2.4,
        glow: 9,
        radius: 12,
        opacity: alpha,
      }),
      txt(
        sh > 0.35 ? '[ 0 ,  -1 ]' : '[ 1000 - 1000 ,  999 - 1000 ]',
        370,
        -110,
        34,
        ROLE.active,
        'mono',
        'center',
      ).opacity(alpha),
      glowVector([370, -55], [370, 25], { color: ROLE.valid, width: 4, glow: 9, opacity: alpha }),
      lumBar(370, 110, 520, 92, {
        color: ready ? ROLE.winner : COSMOS.dim,
        fillOpacity: ready ? 0.28 : 0.1,
        strokeWidth: ready ? 2.8 : 1.8,
        glow: ready ? 11 : 3,
        radius: 12,
        opacity: alpha,
      }),
      txt(
        ready
          ? `[ ${fmt(stableProbs[0], 3)} ,  ${fmt(stableProbs[1], 3)} ]`
          : 'exp([0, -1]) / Z = ?',
        370,
        110,
        36,
        ready ? ROLE.winner : COSMOS.muted,
        'mono',
        'center',
      )
        .glow(ready ? 8 : 0, ROLE.winner)
        .opacity(alpha),
    );

    nodes.push(
      txt(
        'Shifting by max(z) keeps every exponent <= 0 with identical ratios.',
        0,
        375,
        30,
        COSMOS.muted,
        'serif',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  // VIEW 2: 4-lane eligibility and T = 0 / T > 0 router
  const routerLayer = guardedDynamic(vRouter, (alpha) => {
    const nodes = [];
    const isContract = laneMode.value > 0.5;
    const activeCount = Math.round(Math.max(1, Math.min(4, laneSweep.value)));

    const lanes = isContract
      ? [
          { input: 'Hard masks (-∞)', out: 'Define eligible IDs first', col: ROLE.active },
          {
            input: 'Temperature T = 0',
            out: 'Deterministic argmax (eligible only)',
            col: ROLE.winner,
          },
          { input: 'Temperature T > 0', out: 'Stable softmax + categorical draw', col: ROLE.valid },
          { input: 'All tokens masked', out: 'Explicit error (even at T = 0)', col: ROLE.pruned },
        ]
      : [
          { input: 'Finite logits', out: 'Eligible for softmax', col: ROLE.valid },
          { input: '-Infinity entry', out: 'Forbidden -> weight 0', col: ROLE.active },
          { input: 'NaN or +Infinity', out: 'Reject invalid logits', col: ROLE.pruned },
          { input: 'All -Infinity row', out: 'Reject empty pool', col: ROLE.pruned },
        ];

    nodes.push(
      txt(
        isContract ? 'Temperature & eligibility contract' : 'Checked sampler input validation',
        0,
        -290,
        32,
        isContract ? ROLE.winner : ROLE.active,
        'mono',
        'center',
      ).opacity(alpha),
    );

    lanes.forEach((ln, i) => {
      const y = -165 + i * 135;
      const lit = i < activeCount;
      const la = (lit ? 1 : 0.28) * alpha;
      nodes.push(
        lumBar(-435, y, 470, 82, {
          color: ROLE.base,
          fillOpacity: 0.2,
          strokeWidth: 2.2,
          glow: 7,
          radius: 12,
          opacity: la,
        }),
        txt(ln.input, -435, y, 30, COSMOS.ink, 'mono', 'center').opacity(la),
        glowVector([-185, y], [15, y], { color: ln.col, width: 4, glow: 9, opacity: la }),
        lumBar(415, y, 710, 82, {
          color: ln.col,
          fillOpacity: 0.22,
          strokeWidth: 2.4,
          glow: 9,
          radius: 12,
          opacity: la,
        }),
        txt(ln.out, 415, y, 30, ln.col, 'mono', 'center').opacity(la),
      );
    });

    nodes.push(
      txt(
        isContract
          ? 'Check whether an API routes T = 0 to greedy or requires T > 0.'
          : 'Tiny positive T can still underflow weak alternatives near ties.',
        0,
        395,
        28,
        COSMOS.muted,
        'serif',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  const stableEq = glowTex('p_i = \\frac{\\exp((z_i - m)/T)}{\\sum_j \\exp((z_j - m)/T)}', {
    x: 420,
    y: -380,
    size: 36,
    color: ROLE.winner,
  });

  s.add(cinemaAtmosphere(ROLE.active, ROLE.pruned), title, stableEq, stableLayer, routerLayer);

  playCue(s, c, 'dec-stable-eligibility-1', (d) => s.play(shiftAnim.to(1, { duration: d })), {
    dur: 0.75,
  });
  playCue(s, c, 'dec-stable-probabilities', (d) => s.play(showProbs.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });

  c.hide(1, stableEq);
  c.onBeat(1, () => s.play(swapVis(vStable, vRouter, 0.55)));
  playCue(s, c, 'dec-stable-eligibility-2', (d) => s.play(laneSweep.to(4, { duration: d })), {
    dur: 1.2,
  });

  playCue(
    s,
    c,
    'dec-stable-eligibility-3',
    (d) => s.play(laneMode.to(1, { duration: Math.min(0.3, d) }), laneSweep.to(4, { duration: d })),
    { dur: 0.9 },
  );
}
