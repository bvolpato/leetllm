// Scene 4: controlled-runs: "Where should a second unit of compute go?"
// Act 1 (Beats 0-1): Four glowing N x D compute rectangles on fixed held-out text; compares the
//   two equal-cost 2x runs (2B/10B at 2.60 vs 1B/20B at 2.55 -> 0.05 nat win for more tokens).
// Act 2 (Beat 2): Swaps cleanly to the log-compute Pareto power-law curve L(C) = 2 + C^(-0.05)
//   approaching the irreducible floor E = 2 with shrinking per-decade gains.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  ROLE,
  cinemaAtmosphere,
  fmt,
  lumBar,
  playCue,
  plotPlane,
  sampleCurve,
  scenePulse,
  swapVis,
} from '../parts.mjs';

const RUNS = [
  { id: 'Run 1', label: 'Baseline', n: 1, d: 10, mult: '1×', loss: 2.8, col: ROLE.tokens },
  { id: 'Run 2', label: '2× weights', n: 2, d: 10, mult: '2×', loss: 2.6, col: ROLE.params },
  { id: 'Run 3', label: '2× tokens', n: 1, d: 20, mult: '2×', loss: 2.55, col: ROLE.optimal },
  { id: 'Run 4', label: 'Double both', n: 2, d: 20, mult: '4×', loss: 2.35, col: ROLE.compute },
];

export default function controlledRuns(s, c) {
  const title = heroTitle(['Where should a second', 'unit of compute go?'], {
    x: -850,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.optimal,
  });

  const act1Vis = s.value(1);
  const act2Vis = s.value(0);

  const run1Glow = s.value(0);
  const run2Vis = s.value(0);
  const run3Vis = s.value(0);
  const run4Vis = s.value(0);
  const showLoss = s.value(0);
  const curveSweep = s.value(0);
  const pulse = s.value(0);

  // Act 1: 4 controlled runs
  const act1Layer = guardedDynamic(act1Vis, (alpha) => {
    const nodes = [];
    const vis = [1, run2Vis.value, run3Vis.value, run4Vis.value];
    const lv = showLoss.value;
    const baseY = 145;
    const unitW = 92;
    const unitH = 11.5;

    nodes.push(
      txt(
        'Same held-out text  ·  same tokenizer  ·  loss in nats per token',
        -840,
        -252,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),
    );

    RUNS.forEach((run, i) => {
      const a = Math.max(0.28, vis[i]) * alpha;
      const isRevealed = vis[i] > 0.05;
      const cx = -630 + i * 420;
      const rw = run.n * unitW;
      const rh = run.d * unitH;
      const isWinner = i === 2 && lv > 0.5;

      nodes.push(
        txt(
          `${run.id}  ·  ${run.mult}`,
          cx,
          -165,
          30,
          isRevealed ? run.col : COSMOS.dim,
          'mono',
          'center',
        )
          .glow(isWinner ? 10 : isRevealed ? 4 : 0, run.col)
          .opacity(a),
        txt(run.label, cx, -120, 26, COSMOS.muted, 'sans', 'center').opacity(a),
        // Glowing area block anchored on shared baseline (dim ghost before reveal keeps frame balanced)
        lumBar(cx, baseY - rh / 2, rw, rh, {
          color: isRevealed ? run.col : COSMOS.dim,
          fillOpacity: isRevealed ? (isWinner ? 0.5 : 0.32) : 0.08,
          strokeWidth: isRevealed ? (isWinner ? 3.2 : 2.2) : 1.5,
          glow: isRevealed ? (isWinner ? 14 : 7) : 0,
          radius: 6,
          opacity: a,
        }),
        txt(
          `N=${run.n}B  D=${run.d}B`,
          cx,
          baseY + 46,
          28,
          isRevealed ? COSMOS.ink : COSMOS.dim,
          'mono',
          'center',
        ).opacity(a),
      );

      if (lv > 0.05 && isRevealed) {
        nodes.push(
          txt(
            `${fmt(run.loss, 2)} nats`,
            cx,
            baseY + 104,
            34,
            isWinner ? ROLE.optimal : ROLE.compute,
            'mono',
            'center',
          )
            .glow(isWinner ? 10 : 5, isWinner ? ROLE.optimal : ROLE.compute)
            .opacity(lv * a),
        );
      } else {
        nodes.push(txt('Loss ?', cx, baseY + 104, 30, COSMOS.dim, 'mono', 'center').opacity(a));
      }
    });

    if (lv > 0.5) {
      nodes.push(
        txt(
          'Same 2× compute:  2.60 − 2.55 = 0.05 nats favoring more tokens',
          0,
          365,
          32,
          ROLE.optimal,
          'mono',
          'center',
        )
          .glow(7, ROLE.optimal)
          .opacity((lv - 0.5) * 2 * alpha),
      );
    }

    return nodes;
  });

  // Act 2: Log-compute power law with floor E = 2
  const act2Layer = guardedDynamic(act2Vis, (alpha) => {
    const nodes = [];
    const sw = Math.max(0.05, curveSweep.value);
    const maxDecade = sw * 6;

    const plane = plotPlane({
      left: -730,
      right: 680,
      top: -210,
      bottom: 240,
      xDomain: [0, 6],
      yDomain: [1.9, 3.08],
      xTicks: [0, 1, 2, 3, 4, 5, 6].map((e) => ({ v: e, label: `10^${e}` })),
      yTicks: [2.0, 2.25, 2.5, 2.75, 3.0].map((v) => ({ v, label: fmt(v, 2) })),
      xLabel: 'Compute C (10× per step)',
      yLabel: 'Loss (nats)',
      opacity: alpha,
    });
    nodes.push(plane.node);

    // Irreducible floor line E = 2
    const floorY = plane.toY(2.0);
    nodes.push(
      line([plane.bounds.left, floorY], [plane.bounds.right, floorY], {
        stroke: ROLE.amber,
        width: 2.6,
      }).opacity(0.85 * alpha),
      txt('Floor E = 2.00', plane.bounds.right + 18, floorY, 26, ROLE.amber, 'mono', 'left')
        .glow(5, ROLE.amber)
        .opacity(alpha),
    );

    // Glowing power-law curve L(C) = 2 + 10^(-0.05 * log10 C)
    const pts = sampleCurve(plane, (x) => 2 + 10 ** (-0.05 * x), 0, maxDecade, 90);
    nodes.push(
      glowingTrail(pts, {
        gradientColors: [ROLE.params, ROLE.tokens, ROLE.optimal],
        width: 4.8,
        glow: 12,
        opacity: alpha,
      }),
    );

    // Decade markers showing diminishing absolute loss drops
    for (let k = 0; k <= 6; k++) {
      if (k <= maxDecade + 0.05) {
        const lv = 2 + 10 ** (-0.05 * k);
        const [sx, sy] = plane.toScreen(k, lv);
        nodes.push(glowDot(sx, sy, { radius: 8, color: ROLE.compute, glow: 12, opacity: alpha }));
        if (k === 0 || k === 3 || k === 6) {
          nodes.push(
            txt(
              fmt(lv, 2),
              k === 0 ? sx + 22 : sx,
              k === 0 ? sy - 26 : sy - 46,
              26,
              ROLE.compute,
              'mono',
              k === 0 ? 'left' : 'center',
            ).opacity(alpha),
          );
        }
      }
    }

    nodes.push(
      txt(
        'Subtract floor E before taking log(L − E)  ·  each 10× buys a smaller absolute drop',
        0,
        390,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  const lawEq = glowTex('L(C) = 2 + C^{-0.05}', {
    x: 510,
    y: -365,
    size: 42,
    color: ROLE.tokens,
  });

  s.add(cinemaAtmosphere(ROLE.optimal, ROLE.compute), title, act1Layer, act2Layer);
  scenePulse(s, c, pulse);

  // Beat 0: reveal the 4 runs in sync with narration
  playCue(
    s,
    c,
    'sl-controlled-runs-0',
    (d) => s.play(run1Glow.to(1, { duration: Math.min(0.5, d) })),
    {
      dur: 0.5,
    },
  );
  playCue(s, c, 'runs-double-n', (d) => s.play(run2Vis.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'runs-double-d', (d) => s.play(run3Vis.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'runs-double-both', (d) => s.play(run4Vis.to(1, { duration: d })), { dur: 0.55 });

  // Beat 1: reveal losses & 0.05 nat gap
  playCue(s, c, 'sl-controlled-runs-1', (d) => s.play(showLoss.to(1, { duration: d })), {
    dur: 0.7,
  });

  // Beat 2: swap to power-law floor curve
  c.show('sl-controlled-runs-2', lawEq);
  playCue(
    s,
    c,
    'sl-controlled-runs-2',
    (d) => s.play(swapVis(act1Vis, act2Vis, Math.min(0.65, d)), curveSweep.to(1, { duration: d })),
    { dur: 1.8 },
  );
}
