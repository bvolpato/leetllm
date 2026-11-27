// Scene 07: One large gradient in the window (3 cinematic acts).
// Act 1 (Beats 0-2): GradScaler overflow spike, atomic skip, backoff 256 -> 64, Adam poisoning counterfactual.
// Act 2 (Beat 3): Infinite forward loss (w^2 + Inf) with finite backward derivative (2w = 4).
// Act 3 (Beat 4): Two independent optimizers (A steps 1.0 -> 0.9, B skips) + one shared scale backoff 256 -> 128.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  CTRL_BACKOFF,
  CTRL_RETRIED,
  CTRL_SPIKE,
  FP16_MAX,
  aura,
  fade,
  glowDot,
  glowTex,
  glowingArc,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function controller(s, c) {
  // Act 1 values
  const showAct1 = s.value(1);
  const spikeFlight = s.value(0);
  const ceilingPulse = s.value(0);
  const overflowCast = s.value(0);
  const showSkip = s.value(0);
  const showPreserved = s.value(0);
  const showBackoff = s.value(0);
  const showPoison = s.value(0);

  // Act 2 values
  const showAct2 = s.value(0);
  const act2Square = s.value(0);
  const act2Loss = s.value(0);
  const act2Grad = s.value(0);
  const act2Scaler = s.value(0);

  // Act 3 values
  const showAct3 = s.value(0);
  const optADone = s.value(0);
  const optBDone = s.value(0);
  const sharedDone = s.value(0);

  const bgAura = aura(0, -10, 680, '#ff6b8b1e', '#5ce1e614');

  const title1 = heroTitle(['GradScaler', 'Overflow & Backoff'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: COSMOS.rose,
    eyebrow: 'DYNAMIC LOSS SCALING CONTROLLER',
  });
  const title2 = heroTitle(['Infinite Loss,', 'Finite Gradient'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: COSMOS.gold,
    eyebrow: 'VALIDATE LOSS SEPARATELY',
  }).opacity(0);
  const title3 = heroTitle(['Two Optimizers,', 'One Shared Scale'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: COSMOS.cyan,
    eyebrow: 'INDEPENDENT STEP ATOMICITY',
  }).opacity(0);

  const derivTex = glowTex(String.raw`\frac{d}{dw}(w^2 + \infty) = 2w = 4`, {
    x: 420,
    y: -365,
    size: 38,
    color: COSMOS.emerald,
    glow: 6,
  }).opacity(0);

  // Act 1: Overflow spike + atomic skip + backoff + Adam counterfactual
  const act1Live = guardedDynamic(showAct1, (a) => {
    const sf = spikeFlight.value;
    const cp = ceilingPulse.value;
    const ov = overflowCast.value;
    const sk = showSkip.value;
    const pr = showPreserved.value;
    const bo = showBackoff.value;
    const po = showPoison.value;

    const rLeft = -760;
    const rRight = 760;
    const xVal = (v) => rLeft + (v / 80000) * (rRight - rLeft);
    const xCap = xVal(FP16_MAX);
    const xGrad = xVal(CTRL_SPIKE.gradient);
    const xScaled = xVal(CTRL_SPIKE.scaled);
    const xRetry = xVal(CTRL_RETRIED);

    const ySpike = -125;
    const yRetry = 45;

    const curSpikeX = xGrad + (xScaled - xGrad) * sf;
    const nodes = [
      // Top-right telemetry
      txt(
        `Gradient: ${CTRL_SPIKE.gradient}  ·  Window scale: ×${CTRL_SPIKE.scale}`,
        820,
        -370,
        30,
        COSMOS.gold,
        'mono',
        'right',
      ).opacity(a),

      // Overflow barrier wall at 65,504
      line([xCap, -225], [xCap, bo > 0.2 ? 120 : -55], {
        stroke: COSMOS.rose,
        width: 4.5,
        dash: [8, 6],
      })
        .glow(7 + 6 * cp, COSMOS.rose)
        .opacity(a),
      txt('FP16 MAX · 65,504', xCap, -255, 26, COSMOS.rose, 'mono').glow(6, COSMOS.rose).opacity(a),

      // Spike rail (scale 256)
      line([rLeft, ySpike], [rRight, ySpike], { stroke: '#2c3d61', width: 4 }).opacity(a),
      txt('×256', rLeft - 24, ySpike, 28, COSMOS.gold, 'mono', 'right').opacity(a),
    ];

    if (sf > 0.01) {
      nodes.push(
        glowingTrail(
          [
            [xGrad, ySpike],
            [curSpikeX, ySpike],
          ],
          { color: curSpikeX > xCap ? COSMOS.rose : COSMOS.gold, width: 6, glow: 11, opacity: a },
        ),
      );
    }
    nodes.push(
      glowDot(curSpikeX, ySpike, {
        radius: 12,
        color: curSpikeX > xCap ? COSMOS.rose : COSMOS.gold,
        glow: 14,
        opacity: a,
      }),
    );

    if (sf > 0.92) {
      nodes.push(
        txt('76,800', xScaled, ySpike - 52, 32, COSMOS.gold, 'mono')
          .glow(6, COSMOS.gold)
          .opacity(a),
      );
    }
    if (ov > 0.05) {
      nodes.push(
        txt('FP16 STORE → ∞  (OVERFLOW)', xCap - 35, ySpike + 52, 30, COSMOS.rose, 'mono', 'right')
          .glow(7, COSMOS.rose)
          .opacity(ov * a),
      );
    }

    // Backoff rail (scale 64 -> 19,200)
    if (bo > 0.02) {
      const curRetryX = xGrad + (xRetry - xGrad) * bo;
      nodes.push(
        line([rLeft, yRetry], [rRight, yRetry], { stroke: '#2c3d61', width: 4 }).opacity(bo * a),
        txt(
          `×${CTRL_BACKOFF.nextScale}`,
          rLeft - 24,
          yRetry,
          28,
          COSMOS.emerald,
          'mono',
          'right',
        ).opacity(bo * a),
        glowingTrail(
          [
            [xGrad, yRetry],
            [curRetryX, yRetry],
          ],
          { color: COSMOS.emerald, width: 6, glow: 10, opacity: bo * a },
        ),
        glowDot(curRetryX, yRetry, {
          radius: 11,
          color: COSMOS.emerald,
          glow: 14,
          opacity: bo * a,
        }),
        txt(
          `Next window: 300 × ${CTRL_BACKOFF.nextScale} = ${CTRL_RETRIED.toLocaleString('en-US')} (safe!)`,
          curRetryX + 32,
          yRetry - 42,
          28,
          COSMOS.emerald,
          'mono',
          'left',
        )
          .glow(6, COSMOS.emerald)
          .opacity(bo * a),
      );
    }

    // Lower optimizer state banner + 3 glowing state orbs (always visible so lower canvas stays rich & shows atomic preservation)
    const statusText =
      po > 0.4
        ? 'IF ADAM READ ∞: BOTH MOMENTS BECOME ∞'
        : sk > 0.4
          ? 'OPTIMIZER STEP SKIPPED ATOMICALLY'
          : 'OPTIMIZER STATE BEFORE STEP';
    const statusColor = po > 0.4 ? COSMOS.rose : sk > 0.4 ? COSMOS.cyan : COSMOS.muted;
    nodes.push(
      line([-760, 130], [760, 130], { stroke: '#26304a', width: 2 }).opacity(a),
      txt(statusText, 0, 182, 32, statusColor, 'mono')
        .glow(po > 0.4 || sk > 0.4 ? 7 : 0, statusColor)
        .opacity(a),
    );

    const states = [
      ['WEIGHT w', '1.00', COSMOS.cyan, false],
      [
        'ADAM MOMENT m',
        po > 0.4 ? '∞ (corrupted)' : '0.20',
        po > 0.4 ? COSMOS.rose : COSMOS.cyan,
        po > 0.4,
      ],
      [
        'ADAM VARIANCE v',
        po > 0.4 ? '∞ (corrupted)' : '0.04',
        po > 0.4 ? COSMOS.rose : COSMOS.cyan,
        po > 0.4,
      ],
    ];
    states.forEach(([label, val, col, bad], idx) => {
      const sx = -540 + idx * 540;
      nodes.push(
        glowDot(sx, 272, { radius: 14, color: col, glow: bad ? 16 : 10, opacity: a }),
        txt(label, sx, 328, 26, COSMOS.muted, 'mono').opacity(a),
        txt(val, sx, 388, 42, col, 'mono')
          .glow(bad ? 9 : 5, col)
          .opacity(a),
      );
    });

    return group(...nodes);
  });

  // Act 2: Infinite loss + finite derivative DAG (Beat 3)
  const act2Live = guardedDynamic(showAct2, (a) => {
    const sq = act2Square.value;
    const ls = act2Loss.value;
    const gr = act2Grad.value;
    const sc = act2Scaler.value;

    const nodes = [
      // Forward top lane: w=2 -> w^2=4 + Inf -> Loss=Inf
      glowDot(-680, -110, { radius: 22, color: COSMOS.blue, glow: 14, opacity: a }),
      txt('Weight w = 2', -680, -172, 30, COSMOS.blue, 'mono').opacity(a),

      glowingTrail(
        [
          [-640, -110],
          [-220, -110],
        ],
        { color: sq > 0.2 ? COSMOS.cyan : COSMOS.dim, width: 4.5, glow: 8, opacity: a },
      ),
      glowDot(-180, -110, {
        radius: 22,
        color: sq > 0.2 ? COSMOS.cyan : COSMOS.dim,
        glow: 14,
        opacity: a,
      }),
      txt(
        sq > 0.2 ? 'w² = 4' : 'square',
        -180,
        -172,
        32,
        sq > 0.2 ? COSMOS.cyan : COSMOS.muted,
        'mono',
      ).opacity(a),

      // Constant Inf node
      glowDot(560, -110, { radius: 22, color: COSMOS.rose, glow: 14, opacity: a }),
      txt('Constant +∞', 560, -172, 30, COSMOS.rose, 'mono').opacity(a),

      // Both merge into Loss = Inf
      glowingArc([-150, -85], [160, 75], 50, {
        color: ls > 0.2 ? COSMOS.rose : COSMOS.dim,
        width: 4,
        glow: 9,
        opacity: a,
      }),
      glowingArc([530, -85], [220, 75], 50, {
        color: ls > 0.2 ? COSMOS.rose : COSMOS.dim,
        width: 4,
        glow: 9,
        opacity: a,
      }),
      glowDot(190, 95, {
        radius: 26,
        color: ls > 0.2 ? COSMOS.rose : COSMOS.dim,
        glow: 16,
        opacity: a,
      }),
      txt(
        ls > 0.2 ? 'Loss = 4 + ∞ = ∞' : 'Forward sum',
        190,
        162,
        36,
        ls > 0.2 ? COSMOS.rose : COSMOS.muted,
        'mono',
      )
        .glow(ls > 0.2 ? 8 : 0, COSMOS.rose)
        .opacity(a),

      // Backward emerald arc from Loss back to w = 2 (bypassing constant Inf!)
      glowingArc([155, 110], [-660, -78], 185, {
        color: gr > 0.2 ? COSMOS.emerald : COSMOS.dim,
        width: 5,
        glow: 11,
        opacity: (0.3 + 0.7 * gr) * a,
      }),
      txt(
        gr > 0.2 ? 'Backward grad = 2w = 4 (FINITE!)' : 'Backward derivative',
        -290,
        295,
        34,
        gr > 0.2 ? COSMOS.emerald : COSMOS.muted,
        'mono',
      )
        .glow(gr > 0.2 ? 7 : 0, COSMOS.emerald)
        .opacity(a),
      txt('d(∞)/dw = 0', 675, 15, 26, COSMOS.muted, 'mono').opacity(gr * a),

      // Warning banner
      txt(
        'GradScaler checks .grad only  ·  check torch.isfinite(loss) separately!',
        0,
        420,
        30,
        COSMOS.gold,
        'sans',
      )
        .glow(6, COSMOS.gold)
        .opacity(sc * a),
    ];
    return group(...nodes);
  });

  // Act 3: Two independent optimizers + one shared scale update (Beat 4)
  const act3Live = guardedDynamic(showAct3, (a) => {
    const oa = optADone.value;
    const ob = optBDone.value;
    const sh = sharedDone.value;

    const yA = -140;
    const yB = 75;
    const yHub = 290;

    const nodes = [
      // Optimizer A lane
      txt('OPTIMIZER A', -790, yA - 22, 30, COSMOS.blue, 'mono', 'left').opacity(a),
      txt('w = 1.0  ·  g = 1  ·  η = 0.1', -790, yA + 22, 26, COSMOS.muted, 'mono', 'left').opacity(
        a,
      ),
      glowingTrail(
        [
          [-310, yA],
          [220, yA],
        ],
        { color: oa > 0.2 ? COSMOS.emerald : COSMOS.dim, width: 5, glow: 10, opacity: a },
      ),
      glowDot(250, yA, {
        radius: 20,
        color: oa > 0.2 ? COSMOS.emerald : COSMOS.dim,
        glow: 14,
        opacity: a,
      }),
      txt(
        oa > 0.2 ? 'STEP → w = 0.9' : 'waiting...',
        310,
        yA,
        34,
        oa > 0.2 ? COSMOS.emerald : COSMOS.dim,
        'mono',
        'left',
      )
        .glow(oa > 0.2 ? 7 : 0, COSMOS.emerald)
        .opacity(a),

      // Optimizer B lane
      txt('OPTIMIZER B', -790, yB - 22, 30, COSMOS.blue, 'mono', 'left').opacity(a),
      txt('w = 1.0  ·  g = ∞', -790, yB + 22, 26, COSMOS.rose, 'mono', 'left').opacity(a),
      glowingTrail(
        [
          [-310, yB],
          [220, yB],
        ],
        { color: ob > 0.2 ? COSMOS.rose : COSMOS.dim, width: 5, glow: 10, opacity: a },
      ),
      glowDot(250, yB, {
        radius: 20,
        color: ob > 0.2 ? COSMOS.rose : COSMOS.dim,
        glow: 14,
        opacity: a,
      }),
      txt(
        ob > 0.2 ? 'SKIP → w stays 1.0' : 'waiting...',
        310,
        yB,
        34,
        ob > 0.2 ? COSMOS.rose : COSMOS.dim,
        'mono',
        'left',
      )
        .glow(ob > 0.2 ? 7 : 0, COSMOS.rose)
        .opacity(a),

      // Converging arcs to Shared Scale Hub
      glowingArc([250, yA + 24], [0, yHub - 32], 25, {
        color: sh > 0.2 ? COSMOS.gold : COSMOS.dim,
        width: 3.5,
        glow: 8,
        opacity: (0.3 + 0.7 * sh) * a,
      }),
      glowingArc([250, yB + 24], [0, yHub - 32], 20, {
        color: sh > 0.2 ? COSMOS.gold : COSMOS.dim,
        width: 3.5,
        glow: 8,
        opacity: (0.3 + 0.7 * sh) * a,
      }),
      glowDot(0, yHub, {
        radius: 24,
        color: sh > 0.2 ? COSMOS.gold : COSMOS.dim,
        glow: 16,
        opacity: a,
      }),
      txt(
        sh > 0.2 ? 'SHARED SCALER UPDATE: 256 → 128' : 'SHARED SCALE = 256',
        0,
        yHub + 68,
        34,
        sh > 0.2 ? COSMOS.gold : COSMOS.muted,
        'mono',
      )
        .glow(sh > 0.2 ? 8 : 0, COSMOS.gold)
        .opacity(a),
      txt(
        'For joint atomicity across optimizers, check finiteness together before stepping',
        0,
        435,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    ];
    return group(...nodes);
  });

  s.add(bgAura, title1, title2, title3, derivTex, act1Live, act2Live, act3Live);

  // Act 1 cues
  c.on('scale-spike', () => s.play(spikeFlight.to(1, { duration: 1.1 })));
  c.on('controller-b1-1', () => s.play(ceilingPulse.to(1, { duration: 0.4 })));
  c.after('controller-b1-2', () =>
    s.play(overflowCast.to(1, { duration: remainDuration(c, 'controller-b1-2', 0.4, 0.35, true) })),
  );
  c.on('controller-b2-1', () => s.play(showSkip.to(1, { duration: 0.4 })));
  c.on('controller-b2-2', () => s.play(showPreserved.to(1, { duration: 0.45 })));
  c.on('backoff-scale', () => s.play(showBackoff.to(1, { duration: 0.7 })));
  c.on('controller-b3-1', () => s.play(showPoison.to(1, { duration: 0.5 })));

  // Act 2 transition & cues
  c.on('controller-extension-4', () => {
    s.play(
      par(
        showAct1.to(0, { duration: 0.2 }),
        fade(title1, 0, { duration: 0.2 }),
        delay(showAct2.to(1, { duration: 0.25 }), 0.22),
        delay(fade(title2, 1, { duration: 0.25 }), 0.22),
      ),
    );
  });
  c.on('finite-square', () => s.play(act2Square.to(1, { duration: 0.45 })));
  c.on('finite-loss', () => s.play(act2Loss.to(1, { duration: 0.45 })));
  c.on('finite-gradient', () => {
    s.play(act2Grad.to(1, { duration: 0.55 }));
    s.play(fade(derivTex, 1, { duration: 0.55 }));
  });
  c.on('finite-scaler', () => s.play(act2Scaler.to(1, { duration: 0.45 })));

  // Act 3 transition & cues
  c.on('controller-extension-5', () => {
    s.play(
      par(
        showAct2.to(0, { duration: 0.2 }),
        fade(title2, 0, { duration: 0.2 }),
        fade(derivTex, 0, { duration: 0.2 }),
        delay(showAct3.to(1, { duration: 0.25 }), 0.22),
        delay(fade(title3, 1, { duration: 0.25 }), 0.22),
      ),
    );
  });
  c.on('optimizer-a', () => s.play(optADone.to(1, { duration: 0.5 })));
  c.on('optimizer-b', () => s.play(optBDone.to(1, { duration: 0.5 })));
  c.on('optimizer-shared-scale', () =>
    s.play(sharedDone.to(1, { duration: remainDuration(c, 'optimizer-shared-scale', 0.5) })),
  );
}
