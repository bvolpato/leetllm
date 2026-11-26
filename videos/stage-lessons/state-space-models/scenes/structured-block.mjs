// Scene 07: structured-block: HiPPO rising vs falling ramps (same mean, opposite slopes) -> S4 complexity -> Mamba-1 dual-lane block.
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  swapVis,
  txt,
  valuePill,
} from '../parts.mjs';

export default function structuredBlock(s, c) {
  const view1Vis = s.value(1);
  const view2Vis = s.value(0);
  const revealTrends = s.value(0); // strictly withheld until AFTER `trend-signs`!
  const showS4Work = s.value(0);
  const showFft = s.value(0);
  const blockStage = s.value(1); // 1=project, 2=conv+silu, 3=select+ssm, 4=gate multiply + out

  const bgAura = aura(0, 0, 740, '#1c286028', '#103c3618');
  const title = heroTitle(['HiPPO Coordinates,', 'S4 & Mamba Block'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.hybrid,
  });

  // View 1: Rising (1 -> 3) vs Falling (3 -> 1) ramps over t in [-1, +1]
  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const tr = revealTrends.value;
    const s4 = showS4Work.value;
    const fft = showFft.value;
    const nodes = [
      txt('HISTORY 1: RISES 1 → 3', -680, -210, 28, ROLE.carry, 'mono', 'left').opacity(alpha),
      txt('HISTORY 2: FALLS 3 → 1', 120, -210, 28, ROLE.write, 'mono', 'left').opacity(alpha),
      // Mean line y = -45 for both ramps (avg height = 2.0)
      glowingTrail(
        [
          [-680, -45],
          [-160, -45],
        ],
        { color: ROLE.delta, width: 2.5, glow: 5, core: false, opacity: 0.7 * alpha },
      ),
      glowingTrail(
        [
          [120, -45],
          [640, -45],
        ],
        { color: ROLE.delta, width: 2.5, glow: 5, core: false, opacity: 0.7 * alpha },
      ),
      // Rising ramp (-680, 65) -> (-160, -155)
      glowingTrail(
        [
          [-680, 65],
          [-160, -155],
        ],
        { color: ROLE.carry, width: 5.5, glow: 12, opacity: alpha },
      ),
      // Falling ramp (120, -155) -> (640, 65)
      glowingTrail(
        [
          [120, -155],
          [640, 65],
        ],
        { color: ROLE.write, width: 5.5, glow: 12, opacity: alpha },
      ),
      txt('mean = 2.0', -420, 115, 28, ROLE.delta, 'mono', 'center').opacity(alpha),
      txt('mean = 2.0', 380, 115, 28, ROLE.delta, 'mono', 'center').opacity(alpha),
    ];

    if (tr < 0.2) {
      nodes.push(
        txt(
          'Time runs −1 to +1: what sign goes on each trend?',
          0,
          220,
          36,
          ROLE.delta,
          'serif',
          'center',
        )
          .glow(8, ROLE.delta)
          .opacity((1 - tr * 5) * alpha),
      );
    } else {
      nodes.push(
        txt('slope = +1', -420, 180, 34, ROLE.carry, 'mono', 'center')
          .glow(8, ROLE.carry)
          .opacity(tr * alpha),
        txt('slope = −1', 380, 180, 34, ROLE.write, 'mono', 'center')
          .glow(8, ROLE.write)
          .opacity(tr * alpha),
        txt(
          'HiPPO orthogonal polynomials give coordinates distinct jobs',
          -855,
          265,
          28,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(tr * alpha),
      );
    }

    if (s4 > 0.05) {
      nodes.push(
        txt(
          'S4 diagonal + low-rank: O(L · N) work vs dense O(L · N²)',
          -855,
          330,
          28,
          ROLE.read,
          'mono',
          'left',
        ).opacity(s4 * alpha),
      );
    }
    if (fft > 0.05) {
      nodes.push(
        txt(
          'Fixed coefficients + zero start → FFT applies prepared kernel in O(L log L)',
          -855,
          392,
          26,
          ROLE.state,
          'mono',
          'left',
        ).opacity(fft * alpha),
      );
    }
    return group(...nodes);
  });

  // View 2: Mamba-1 dual-lane block architecture (living flow graph, zero bullet cards!)
  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const st = Math.round(blockStage.value);
    const mainY = -110;
    const gateY = 135;
    const nodes = [
      txt(
        'MAMBA-1 SELECTIVE BLOCK ARCHITECTURE',
        -855,
        -240,
        28,
        ROLE.read,
        'mono',
        'left',
      ).opacity(alpha),
      valuePill('Input x', -770, 10, { w: 170, h: 76, color: ROLE.delta, opacity: alpha }),
      // Split into Main Lane (top) and Gate Lane (bottom)
      glowingTrail(
        [
          [-680, 10],
          [-560, mainY],
        ],
        { color: ROLE.carry, width: 3.5, opacity: alpha },
      ),
      glowingTrail(
        [
          [-680, 10],
          [-560, gateY],
        ],
        { color: ROLE.hybrid, width: 3.5, opacity: alpha },
      ),
      valuePill('Main Proj', -460, mainY, {
        w: 195,
        h: 74,
        color: ROLE.carry,
        size: 28,
        opacity: alpha,
      }),
      valuePill('Gate z', -460, gateY, {
        w: 195,
        h: 74,
        color: ROLE.hybrid,
        size: 28,
        opacity: alpha,
      }),
    ];

    const a2 = (st >= 2 ? 1 : 0.26) * alpha;
    const a3 = (st >= 3 ? 1 : 0.26) * alpha;
    const a4 = (st >= 4 ? 1 : 0.26) * alpha;

    nodes.push(
      glowingTrail(
        [
          [-360, mainY],
          [-265, mainY],
        ],
        { color: ROLE.carry, width: 3.5, opacity: a2 },
      ),
      valuePill('Conv1D + SiLU', -145, mainY, {
        w: 235,
        h: 74,
        color: ROLE.read,
        size: 28,
        opacity: a2,
      }),
      glowingTrail(
        [
          [-25, mainY],
          [70, mainY],
        ],
        { color: ROLE.state, width: 4, opacity: a3 },
      ),
      valuePill('Selective SSM', 210, mainY, {
        w: 265,
        h: 78,
        color: ROLE.state,
        size: 28,
        glow: st >= 3 ? 12 : 0,
        opacity: a3,
      }),
      txt(
        'sets B(x), C(x), Δ = softplus(·)  ·  A, D learned',
        210,
        mainY - 72,
        26,
        ROLE.delta,
        'mono',
        'center',
      ).opacity(a3),
      glowingTrail(
        [
          [-360, gateY],
          [105, gateY],
        ],
        { color: ROLE.hybrid, width: 3.5, opacity: a4 },
      ),
      valuePill('SiLU(z)', 210, gateY, {
        w: 195,
        h: 74,
        color: ROLE.hybrid,
        size: 28,
        opacity: a4,
      }),
      glowingTrail(
        [
          [345, mainY],
          [465, 10],
        ],
        { color: ROLE.state, width: 4, opacity: a4 },
      ),
      glowingTrail(
        [
          [312, gateY],
          [465, 10],
        ],
        { color: ROLE.hybrid, width: 4, opacity: a4 },
      ),
      valuePill('× Gate', 540, 10, {
        w: 140,
        h: 76,
        color: ROLE.delta,
        size: 28,
        glow: st >= 4 ? 12 : 0,
        opacity: a4,
      }),
      glowingTrail(
        [
          [615, 10],
          [672, 10],
        ],
        { color: ROLE.state, width: 4, opacity: a4 },
      ),
      valuePill('Out Proj', 765, 10, { w: 175, h: 76, color: ROLE.state, size: 28, opacity: a4 }),
      txt(
        'SiLU(z) = z · σ(z) can be negative or > 1; verify fused kernel against reference',
        -855,
        325,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(a4),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, view1, view2);
  // Strictly withhold trend signs until AFTER `trend-signs`!
  playCue(s, c, 'trend-signs', (d) => s.play(revealTrends.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'ssm-structured-work', (d) => s.play(showS4Work.to(1, { duration: d })), {
    dur: 0.45,
  });
  playCue(s, c, 'ssm-fft-application', (d) => s.play(showFft.to(1, { duration: d })), {
    dur: 0.45,
  });

  playCue(s, c, 'structured-block-b2', (d) => s.play(swapVis(view1Vis, view2Vis, d)), { dur: 0.6 });
  playCue(s, c, 'ssm-block-convolution', (d) => s.play(blockStage.to(2, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'ssm-block-select', (d) => s.play(blockStage.to(3, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'structured-block-b3', (d) => s.play(blockStage.to(4, { duration: d })), {
    dur: 0.5,
  });
  bindCueBeat(s, c, s.value(0), [
    'draw-ramps',
    'average-height',
    'structured-block-extension-4',
    'structured-block-extension-5',
    'ssm-block-project',
    'ssm-block-activation',
    'ssm-block-recurrence',
    'ssm-block-gate',
    'ssm-block-readout',
    'ssm-block-multiply',
    'ssm-block-output',
  ]);
}
