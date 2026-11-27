// Scene 25: How far does Adam move the weight? Step 1 bias correction (m->0.5, v->0.25, dir~1, w: 1->0.99) + saved LR 0.01 vs reset LR 0.02 (strict hold!).
import { delay, group, par } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  adamSaved,
  aura,
  glassCell,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function optimizerCounter(s, c) {
  const showMoments = s.value(1);
  const mStep = s.value(0); // 1=m, 2=v, 3=t=1, 4=m_hat=0.5, 5=v_hat=0.25, 6=dir~1, 7=w->0.99
  const showRates = s.value(0);
  const rateStep = s.value(0); // 1=pair setup (hold!), 2=saved 0.01 (-0.005), 3=reset 0.02 (-0.010)

  const bgAura = aura(0, 20, 620, '#ffd1661c', '#5ce1e618');
  const title = heroTitle(['How Far Does Adam', 'Move the Weight?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.trans,
    eyebrow: 'BIAS CORRECTION · LEARNING-RATE SCHEDULE',
  });

  const formula = glowTex(
    '\\hat{m}_t = \\frac{m_t}{1 - \\beta_1^t}, \\quad \\hat{v}_t = \\frac{v_t}{1 - \\beta_2^t}',
    { x: 420, y: -380, size: 38, color: COSMOS.gold },
  );

  const momentsView = guardedDynamic(showMoments, (a) => {
    const ms = mStep.value;

    const nodes = [
      txt(
        'STEP 1 WORKSHEET: w0 = 1.000   ·   g1 = +0.50   ·   lr = 0.01',
        0,
        -215,
        26,
        COSMOS.gold,
        'mono',
      ).opacity(a),

      // Raw moments row
      glassCell(-550, -90, 480, 152, ms >= 1 ? ROLE.orig : COSMOS.dim, {
        fill: '#0f1d36',
        glow: ms >= 1 ? 8 : 2,
        opacity: a,
      }),
      txt('1st MOMENT  (beta1 = 0.9)', -550, -132, 26, ROLE.orig, 'mono').opacity(a),
      txt(
        ms >= 1 ? `m1 = 0.1 × 0.5 = ${adamSaved.m.toFixed(2)}` : 'm0 = 0',
        -550,
        -72,
        28,
        COSMOS.ink,
        'mono',
      ).opacity(a),

      glassCell(0, -90, 480, 152, ms >= 2 ? ROLE.copy : COSMOS.dim, {
        fill: '#0e222e',
        glow: ms >= 2 ? 8 : 2,
        opacity: a,
      }),
      txt('2nd MOMENT  (beta2 = 0.999)', 0, -132, 26, ROLE.copy, 'mono').opacity(a),
      txt(
        ms >= 2 ? `v1 = 0.001 × 0.25 = ${adamSaved.v.toFixed(4)}` : 'v0 = 0',
        0,
        -72,
        26,
        COSMOS.ink,
        'mono',
      ).opacity(a),

      glassCell(550, -90, 440, 152, ms >= 3 ? ROLE.trans : COSMOS.dim, {
        fill: '#241c0f',
        glow: ms >= 3 ? 8 : 2,
        opacity: a,
      }),
      txt('UPDATE COUNTER', 550, -132, 26, ROLE.trans, 'mono').opacity(a),
      txt(
        ms >= 3 ? 'step = 1' : 'step = 0',
        550,
        -72,
        34,
        ms >= 3 ? COSMOS.gold : COSMOS.dim,
        'mono',
      ).opacity(a),

      // Bias-corrected row
      glassCell(-550, 118, 480, 152, ms >= 4 ? ROLE.good : COSMOS.dim, {
        fill: '#0d2624',
        glow: ms >= 4 ? 9 : 2,
        opacity: a,
      }),
      txt('CORRECTED m_hat', -550, 76, 26, ROLE.good, 'mono').opacity(a),
      txt(
        ms >= 4 ? '0.05 / 0.1 = 0.50' : 'divide by 1 - 0.9^1',
        -550,
        136,
        28,
        ms >= 4 ? COSMOS.ink : COSMOS.dim,
        'mono',
      ).opacity(a),

      glassCell(0, 118, 480, 152, ms >= 5 ? ROLE.good : COSMOS.dim, {
        fill: '#0d2624',
        glow: ms >= 5 ? 9 : 2,
        opacity: a,
      }),
      txt('CORRECTED v_hat', 0, 76, 26, ROLE.good, 'mono').opacity(a),
      txt(
        ms >= 5 ? 'v_hat = 0.25  (sqrt = 0.5)' : 'divide by 1 - 0.999^1',
        0,
        136,
        26,
        ms >= 5 ? COSMOS.ink : COSMOS.dim,
        'mono',
      ).opacity(a),

      glassCell(550, 118, 440, 152, ms >= 6 ? COSMOS.gold : COSMOS.dim, {
        fill: '#261e0e',
        glow: ms >= 6 ? 10 : 2,
        opacity: a,
      }),
      txt('DIRECTION & STEP', 550, 76, 26, COSMOS.gold, 'mono').opacity(a),
      txt(
        ms >= 7 ? 'w: 1.00 -> 0.99' : ms >= 6 ? '0.5 / 0.5 ≈ 1.0' : 'awaiting...',
        550,
        136,
        30,
        ms >= 6 ? COSMOS.gold : COSMOS.dim,
        'mono',
      ).opacity(a),

      txt(
        'Zero-initialized moments shrink early averages toward 0; bias correction divides by (1 - beta^t)',
        0,
        335,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    ];

    return group(...nodes);
  });

  const ratesView = guardedDynamic(showRates, (a) => {
    const rs = rateStep.value;

    // Weight scale: [1.985 .. 2.002] -> x in [-540, 620]
    const wMin = 1.985;
    const wMax = 2.002;
    const wx = (w) => -540 + ((w - wMin) / (wMax - wMin)) * 1160;
    const startX = wx(2.0);
    const savedX = wx(1.995);
    const resetX = wx(1.99);

    const nodes = [
      txt(
        'SCHEDULER DRIFT TEST: w = 2.000   ·   SHARED DIRECTION = +0.50',
        0,
        -215,
        26,
        COSMOS.gold,
        'mono',
      ).opacity(a),
      line([-540, -145], [620, -145], { stroke: COSMOS.muted, width: 2.6 }).opacity(a),
    ];

    [1.988, 1.99, 1.995, 2.0].forEach((tk) => {
      const tx = wx(tk);
      nodes.push(
        line([tx, -156], [tx, -134], {
          stroke: tk === 2.0 ? COSMOS.gold : COSMOS.muted,
          width: 2.6,
        }).opacity(a),
        txt(tk.toFixed(3), tx, -180, 26, tk === 2.0 ? COSMOS.gold : COSMOS.muted, 'mono').opacity(
          a,
        ),
      );
    });

    // Lane 1: Saved LR 0.01
    nodes.push(
      txt('SAVED LR = 0.01', -835, -55, 26, ROLE.good, 'mono', 'left').opacity(a),
      line([-540, -55], [620, -55], { stroke: COSMOS.dim, width: 2.0 }).opacity(a),
      glowDot(startX, -55, { radius: 9, color: COSMOS.gold, opacity: a }),
    );
    if (rs >= 2) {
      nodes.push(
        line([startX, -55], [savedX, -55], { stroke: ROLE.good, width: 5.5 })
          .glow(8, ROLE.good)
          .opacity(a),
        glowDot(savedX, -55, { radius: 11, color: ROLE.good, opacity: a }),
        txt('-0.005 -> 1.995', savedX, -98, 26, ROLE.good, 'mono').opacity(a),
      );
    }

    // Lane 2: Reset LR 0.02
    nodes.push(
      txt('RESET LR = 0.02', -835, 85, 26, ROLE.bad, 'mono', 'left').opacity(a),
      line([-540, 85], [620, 85], { stroke: COSMOS.dim, width: 2.0 }).opacity(a),
      glowDot(startX, 85, { radius: 9, color: COSMOS.gold, opacity: a }),
    );
    if (rs >= 3) {
      nodes.push(
        line([startX, 85], [resetX, 85], { stroke: ROLE.bad, width: 5.5 })
          .glow(8, ROLE.bad)
          .opacity(a),
        glowDot(resetX, 85, { radius: 11, color: ROLE.bad, opacity: a }),
        txt('-0.010 -> 1.990 (2× farther!)', resetX, 134, 26, ROLE.bad, 'mono').opacity(a),
      );
    }

    nodes.push(
      txt(
        rs >= 3
          ? 'Weights matched BEFORE the step; a forward check misses a reset scheduler · verify LR at step 1!'
          : 'Predict: same w=2.0 and direction 0.5; which scheduler moves farther?',
        0,
        320,
        28,
        rs >= 3 ? ROLE.good : COSMOS.gold,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, formula, momentsView, ratesView);

  c.on('adam-mean', () => s.play(mStep.to(1, { duration: remainDuration(c, 'adam-mean', 0.35) })));
  c.on('adam-square', () =>
    s.play(mStep.to(2, { duration: remainDuration(c, 'adam-square', 0.35) })),
  );
  c.on('adam-count', () =>
    s.play(mStep.to(3, { duration: remainDuration(c, 'adam-count', 0.35) })),
  );
  c.on('correct-mean', () =>
    s.play(mStep.to(4, { duration: remainDuration(c, 'correct-mean', 0.35) })),
  );
  c.on('correct-square', () =>
    s.play(mStep.to(5, { duration: remainDuration(c, 'correct-square', 0.35) })),
  );
  c.on('adam-direction', () =>
    s.play(mStep.to(6, { duration: remainDuration(c, 'adam-direction', 0.35) })),
  );
  c.on('adam-displace', () =>
    s.play(mStep.to(7, { duration: remainDuration(c, 'adam-displace', 0.35) })),
  );
  c.on('rate-pair', () => {
    s.play(
      par(
        showMoments.to(0, { duration: 0.2 }),
        delay(showRates.to(1, { duration: 0.25 }), 0.22),
        rateStep.to(1, { duration: 0.35 }),
      ),
    );
  });
  c.after('pt-rate-saved', () =>
    s.play(rateStep.to(2, { duration: remainDuration(c, 'pt-rate-saved', 0.4) })),
  );
  c.after('pt-rate-reset', () =>
    s.play(rateStep.to(3, { duration: remainDuration(c, 'pt-rate-reset', 0.4) })),
  );
}
