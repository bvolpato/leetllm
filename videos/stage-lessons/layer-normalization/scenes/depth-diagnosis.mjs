// Scene 10: depth-diagnosis: "What should a depth measurement change?"
// 3-act swapVis diagnostic suite:
//   Act 1a (Beat 0 early): Xiong et al. initialization bounds O(d sqrt(ln d)) vs O(d sqrt(ln d / L)).
//   Act 1b (example-steps -> smaller-step): Illustrative SGD step lengths shrinking 10x under warmup.
//   Act 2 (Beat 1): Aligned (1+n) vs uncorrelated (sqrt(1+n)) stream growth curves (0..8 writes).
//   Act 3 (Beat 2): Held-out ablation bypass circuit testing late-block contribution directly.
import { arrow, line } from 'vizmatic/stage';
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
  arcPts,
  cinemaAtmosphere,
  coordPlane,
  fmt,
  lumBar,
  playBeat,
  playCue,
  scenePulse,
  swapVis,
} from '../parts.mjs';

export default function depthDiagnosis(s, c) {
  const title = heroTitle(['What should a depth', 'measurement change?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.write,
  });

  // Strictly mutually exclusive views transitioned sequentially via swapVis
  const act1aVis = s.value(1); // Xiong et al. bounds
  const act1bVis = s.value(0); // SGD warmup steps
  const act2Vis = s.value(0); // Aligned vs uncorrelated growth curves
  const act3Vis = s.value(0); // Held-out ablation bypass circuit

  const lrVal = s.value(0.01); // 0.01 -> 0.001 on smaller-step
  const alignedN = s.value(0); // 0 -> 8 on eight-writes
  const uncorrN = s.value(0); // 0 -> 8 on add-variance
  const bypassT = s.value(0); // 0 -> 1 on bypass-block
  const pulse = s.value(0);

  // ACT 1a: Xiong et al. initialization bounds (paired with MathJax equations)
  const act1aLayer = guardedDynamic(act1aVis, (alpha) => {
    const p = pulse.value;
    const nodes = [
      txt(
        'Last FFN second weight matrix at initialization  (Xiong et al.)',
        0,
        -220,
        34,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
      txt('Post-LN bound', -430, -90, 40, ROLE.alert, 'sans', 'center')
        .glow(7, ROLE.alert)
        .opacity(alpha),
      txt('Pre-LN bound', 430, -90, 40, ROLE.write, 'sans', 'center')
        .glow(7, ROLE.write)
        .opacity(alpha),
      // Luminous accent underlines (well below MathJax fraction)
      glowingTrail(
        [
          [-640, 190],
          [-220, 190],
        ],
        { color: ROLE.alert, width: 4, glow: 10, opacity: alpha },
      ),
      glowingTrail(
        [
          [220, 190],
          [640, 190],
        ],
        { color: ROLE.write, width: 4, glow: 10, opacity: alpha },
      ),
      glowDot(-640 + ((p * 2.5) % 1) * 420, 190, {
        radius: 6,
        color: ROLE.alert,
        glow: 12,
        opacity: alpha,
      }),
      glowDot(220 + ((p * 2.5) % 1) * 420, 190, {
        radius: 6,
        color: ROLE.write,
        glow: 12,
        opacity: alpha,
      }),
      txt('Large gradients near the output', -430, 252, 28, COSMOS.muted, 'sans', 'center').opacity(
        alpha,
      ),
      txt('Extra 1 / √L factor across depth', 430, 252, 28, ROLE.write, 'sans', 'center').opacity(
        alpha,
      ),
      txt(
        'd = width   ·   L = depth   ·   simplified initialization',
        0,
        375,
        28,
        COSMOS.dim,
        'mono',
        'center',
      ).opacity(alpha),
    ];
    return nodes;
  });

  const postBoundEq = glowTex('O\\!\\left(d\\sqrt{\\ln d}\\right)', {
    x: -430,
    y: 42,
    size: 62,
    color: ROLE.alert,
  });
  const preBoundEq = glowTex('O\\!\\left(d\\sqrt{\\frac{\\ln d}{L}}\\right)', {
    x: 430,
    y: 42,
    size: 62,
    color: ROLE.write,
  });

  // ACT 1b: Illustrative SGD update lengths shrinking 10x under warmup
  const act1bLayer = guardedDynamic(act1bVis, (alpha) => {
    const nodes = [];
    const lr = lrVal.value;
    const p = pulse.value;
    const barLeft = -220;
    const maxBarW = 840; // corresponds to update = 0.08

    nodes.push(
      txt(
        'Illustrative SGD update at initialization',
        -830,
        -230,
        34,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(alpha),
      txt(`Learning rate = ${fmt(lr, 4)}`, 830, -230, 38, ROLE.gold, 'mono', 'right')
        .glow(8, ROLE.gold)
        .opacity(alpha),
      txt('Layer', -830, -135, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt('‖grad‖', -430, -135, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('Update norm = lr × ‖grad‖', barLeft, -135, 26, COSMOS.muted, 'mono', 'left').opacity(
        alpha,
      ),
    );

    [
      { name: 'Lower layer', grad: 1, y: -30, col: ROLE.write },
      { name: 'Top layer', grad: 8, y: 155, col: ROLE.gold },
    ].forEach((row) => {
      const fullW = ((row.grad * 0.01) / 0.08) * maxBarW;
      const curW = Math.max(12, ((row.grad * lr) / 0.08) * maxBarW);
      nodes.push(
        txt(row.name, -830, row.y, 34, COSMOS.ink, 'sans', 'left').opacity(alpha),
        txt(String(row.grad), -430, row.y, 44, row.col, 'mono', 'center').opacity(alpha),
        // Ghost initial length bar
        lumBar(barLeft + fullW / 2, row.y, fullW, 60, {
          color: COSMOS.dim,
          fillOpacity: 0.1,
          strokeWidth: 1.8,
          glow: 2,
          opacity: 0.6 * alpha,
        }),
        // Active scaled bar
        lumBar(barLeft + curW / 2, row.y, curW, 60, {
          color: row.col,
          fillOpacity: 0.5,
          strokeWidth: 2.8,
          glow: 11,
          opacity: alpha,
        }),
        txt(fmt(row.grad * lr, 4), barLeft + maxBarW + 30, row.y, 34, row.col, 'mono', 'left')
          .glow(6, row.col)
          .opacity(alpha),
      );
    });

    const scanX = barLeft + ((p * 2.2) % 1) * maxBarW;
    nodes.push(
      glowDot(scanX, 275, { radius: 5, color: ROLE.gold, glow: 10, opacity: 0.75 * alpha }),
      txt(
        'Test warmup and measure actual optimizer updates across every layer',
        0,
        375,
        30,
        ROLE.norm,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  // ACT 2: Aligned writes (1 + n) vs Uncorrelated writes (sqrt(1 + n))
  const act2Layer = guardedDynamic(act2Vis, (alpha) => {
    const nodes = [];
    const nA = alignedN.value;
    const nU = uncorrN.value;
    const p = pulse.value;

    const plane = coordPlane({
      originX: -720,
      originY: 260,
      scaleX: 122,
      scaleY: 48,
      xMin: 0,
      xMax: 8,
      yMin: 0,
      yMax: 10,
      stepX: 2,
      stepY: 3,
      xTicks: [0, 2, 4, 6, 8],
      yTicks: [0, 3, 6, 9],
      xLabel: 'number of writes n',
      yLabel: 'stream scale',
      opacity: alpha,
    });
    nodes.push(plane.node);

    // Curve 1: Aligned writes (Norm = 1 + n)
    if (nA > 0.05) {
      const steps = 40;
      const pts = [];
      for (let i = 0; i <= steps; i++) {
        const k = (i / steps) * nA;
        pts.push(plane.toScreen(k, 1 + k));
      }
      const endPt = pts[pts.length - 1];
      nodes.push(
        glowingTrail(pts, { color: ROLE.alert, width: 5, glow: 12, opacity: alpha }),
        glowDot(endPt[0], endPt[1], {
          radius: 9 + Math.sin(p * Math.PI * 8) * 1.5,
          color: ROLE.alert,
          glow: 15,
          opacity: alpha,
        }),
      );
    }

    // Curve 2: Uncorrelated writes (SD = sqrt(1 + n))
    if (nU > 0.05) {
      const steps = 40;
      const pts = [];
      for (let i = 0; i <= steps; i++) {
        const k = (i / steps) * nU;
        pts.push(plane.toScreen(k, Math.sqrt(1 + k)));
      }
      const endPt = pts[pts.length - 1];
      nodes.push(
        glowingTrail(pts, { color: ROLE.write, width: 5, glow: 12, opacity: alpha }),
        glowDot(endPt[0], endPt[1], {
          radius: 9 + Math.sin(p * Math.PI * 8) * 1.5,
          color: ROLE.write,
          glow: 15,
          opacity: alpha,
        }),
      );
    }

    // Clean right-side legend readouts
    const rx = 560;
    nodes.push(
      txt('Aligned unit writes', rx, -175, 32, ROLE.alert, 'sans', 'center')
        .glow(6, ROLE.alert)
        .opacity(alpha),
      txt('Norm = 1 + n', rx, -118, 36, ROLE.alert, 'mono', 'center').opacity(alpha),
      txt('After 8 writes: 9.0', rx, -64, 28, COSMOS.muted, 'mono', 'center').opacity(
        nA > 6 ? alpha : 0.35 * alpha,
      ),
      txt('Uncorrelated writes', rx, 55, 32, ROLE.write, 'sans', 'center')
        .glow(6, ROLE.write)
        .opacity(alpha),
      txt('SD = √(1 + n)', rx, 112, 36, ROLE.write, 'mono', 'center').opacity(alpha),
      txt('After 8 writes: √9 = 3.0', rx, 166, 28, COSMOS.muted, 'mono', 'center').opacity(
        nU > 6 ? alpha : 0.35 * alpha,
      ),
      txt(
        'Measure write lengths and directions on your own model',
        0,
        395,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  // ACT 3: Held-out ablation bypass circuit
  const act3Layer = guardedDynamic(act3Vis, (alpha) => {
    const nodes = [];
    const bp = bypassT.value;
    const p = pulse.value;

    nodes.push(
      txt(
        'Same checkpoint and held-out examples',
        0,
        -230,
        36,
        COSMOS.ink,
        'sans',
        'center',
      ).opacity(alpha),
    );

    const rows = [
      { label: 'Baseline', y: -65, isTrial: false },
      { label: 'Ablation trial', y: 165, isTrial: true },
    ];

    rows.forEach((row) => {
      const y = row.y;
      const bypassed = row.isTrial && bp > 0.25;
      nodes.push(
        txt(row.label, -830, y, 34, bypassed ? ROLE.gold : COSMOS.ink, 'sans', 'left').opacity(
          alpha,
        ),
        glowingTrail(
          [
            [-540, y],
            [-210, y],
          ],
          { color: ROLE.stream, width: 4.5, glow: 9, opacity: alpha },
        ),
        arrow([190, y], [440, y], {
          stroke: bypassed ? ROLE.gold : ROLE.stream,
          width: 4.5,
          tip: 15,
        }).opacity(alpha),
        txt('Held-out loss', 650, y - 22, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt(
          row.isTrial ? 'compare' : 'baseline',
          650,
          y + 22,
          32,
          bypassed ? ROLE.gold : ROLE.write,
          'mono',
          'center',
        ).opacity(alpha),
      );

      // Late block module (dims smoothly when bypassed)
      const blockAlpha = row.isTrial ? (1 - bp * 0.72) * alpha : alpha;
      nodes.push(
        lumBar(-10, y, 340, 96, {
          color: ROLE.write,
          fillOpacity: 0.22,
          strokeWidth: 2.6,
          glow: bypassed ? 2 : 9,
          opacity: blockAlpha,
        }),
        txt('Late block', -10, y, 34, ROLE.write, 'sans', 'center').opacity(blockAlpha),
      );

      // Golden bypass arc routing around the late block
      if (row.isTrial && bp > 0.05) {
        const arc = arcPts([-210, y], [190, y], -125, 28);
        const count = Math.max(2, Math.round(arc.length * bp));
        nodes.push(
          glowingTrail(arc.slice(0, count), {
            color: ROLE.gold,
            width: 5,
            glow: 13,
            opacity: alpha,
          }),
          txt('bypass write', -10, y - 92, 30, ROLE.gold, 'mono', 'center')
            .glow(7, ROLE.gold)
            .opacity(bp * alpha),
        );
      }

      // Flowing signal photon
      const t = (p * 2.4 + (row.isTrial ? 0.5 : 0)) % 1;
      const px = -540 + t * 980;
      const py =
        bypassed && px > -210 && px < 190 ? y - Math.sin(((px + 210) / 400) * Math.PI) * 62 : y;
      nodes.push(
        glowDot(px, py, {
          radius: 7,
          color: bypassed ? ROLE.gold : ROLE.write,
          glow: 14,
          opacity: alpha,
        }),
      );
    });

    nodes.push(
      txt(
        'Compare held-out task loss directly before declaring a late block redundant',
        0,
        385,
        30,
        ROLE.norm,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  s.add(
    cinemaAtmosphere(ROLE.write, ROLE.gold),
    title,
    act1aLayer,
    postBoundEq,
    preBoundEq,
    act1bLayer,
    act2Layer,
    act3Layer,
  );
  scenePulse(s, c, pulse);

  // Beat 0 -> example-steps: hide MathJax bounds and swap to SGD step lengths
  c.hide('example-steps', [postBoundEq, preBoundEq]);
  playCue(s, c, 'example-steps', (d) => s.play(swapVis(act1aVis, act1bVis, d)), { dur: 0.55 });
  playCue(s, c, 'smaller-step', (d) => s.play(lrVal.to(0.001, { duration: d })), { dur: 0.85 });

  // Beat 1: swap to aligned vs uncorrelated growth curves
  playBeat(s, c, 1, (d) => s.play(swapVis(act1bVis, act2Vis, d)), { dur: 0.6 });
  playCue(s, c, 'eight-writes', (d) => s.play(alignedN.to(8, { duration: d })), { dur: 0.85 });
  playCue(s, c, 'add-variance', (d) => s.play(uncorrN.to(8, { duration: d })), { dur: 0.9 });

  // Beat 2: swap to held-out ablation bypass circuit
  playBeat(s, c, 2, (d) => s.play(swapVis(act2Vis, act3Vis, d)), { dur: 0.6 });
  playCue(s, c, 'bypass-block', (d) => s.play(bypassT.to(1, { duration: d })), { dur: 0.75 });
}
