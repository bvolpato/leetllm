// Scene 08: Which norm reaches the optimizer? (4 crisp visual acts).
// Act 1 (Beat 0): Clip-first vs Unscale-first norm bars (1/1024 vs 0.02).
// Act 2 (Beat 1): 3-microbatch FP32 accumulation window at fixed scale 256 -> unscale -> finite -> step.
// Act 3 (Beat 2): Active-token window loss normalization (5 / 6 -> 256 * 5 / 6).
// Act 4 (Beat 3): Unequal-token window (full-token mean -1 vs biased mean of means 0).
import { delay, par } from 'vizmatic/stage';
import {
  ACCUM_END,
  COSMOS,
  UNEQUAL_FIX,
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

export default function ordering(s, c) {
  // Act 1: Clip ordering
  const showAct1 = s.value(1);
  const clipEarly = s.value(0);
  const clipTrue = s.value(0);

  // Act 2: Accumulation window
  const showAct2 = s.value(0);
  const batchStage = s.value(0); // 1, 2, 3
  const didUnscale = s.value(0);
  const didFinite = s.value(0);
  const didStep = s.value(0);

  // Act 3: Active-token loss normalization
  const showAct3 = s.value(0);
  const didNorm = s.value(0);
  const didAmp = s.value(0);

  // Act 4: Unequal-token window
  const showAct4 = s.value(0);
  const didFirst = s.value(0);
  const didGroup = s.value(0);
  const didMean = s.value(0);
  const didWrongMean = s.value(0);

  const bgAura = aura(0, 0, 680, '#5ce1e61e', '#ff6b8b14');

  const title1 = heroTitle(['Unscale Before', 'Clipping'], {
    x: -855,
    y: -445,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.cyan,
    eyebrow: 'GRADIENT NORM ORDERING · SCALE 1024',
  });
  const title2 = heroTitle(['One Scale Across', 'the Whole Window'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: COSMOS.gold,
    eyebrow: '3-MICROBATCH ACCUMULATION · SCALE 256',
  }).opacity(0);
  const title3 = heroTitle(['Normalize Over', 'Active Tokens'], {
    x: -855,
    y: -445,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.emerald,
    eyebrow: 'WINDOW-WIDE MEAN LOSS',
  }).opacity(0);
  const title4 = heroTitle(['Unequal Tokens', 'in One Window'], {
    x: -855,
    y: -445,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.rose,
    eyebrow: 'FULL-TOKEN MEAN VS MEAN OF MEANS',
  }).opacity(0);

  const normFormulaTex = glowTex(String.raw`L = \frac{1 + 1 + 3}{2 + 1 + 3} = \frac{5}{6}`, {
    x: 0,
    y: 145,
    size: 46,
    color: COSMOS.gold,
    glow: 7,
  }).opacity(0);
  const ampFormulaTex = glowTex(String.raw`S \cdot L = 256 \cdot \frac{5}{6} \approx 213.333`, {
    x: 0,
    y: 285,
    size: 46,
    color: COSMOS.emerald,
    glow: 7,
  }).opacity(0);

  // Act 1: Clip-first vs Unscale-first norm comparison
  const act1Live = guardedDynamic(showAct1, (a) => {
    const ce = clipEarly.value;
    const ct = clipTrue.value;
    const norm = 0.02;
    const scale = 1024;
    const scaled = norm * scale; // 20.48
    const earlyVal = Math.min(scaled, 1) / scale; // 1/1024
    const trueVal = Math.min(scaled / scale, 1); // 0.02

    const barL = -420;
    const barR = 760;
    const xNorm = (v) => barL + (v / norm) * (barR - barL);
    const yEarly = -55;
    const yTrue = 215;

    const nodes = [
      txt(
        'Scaled norm: 20.48  (0.02 × 1024)  ·  Clip limit = 1.0',
        820,
        -370,
        28,
        COSMOS.gold,
        'mono',
        'right',
      ).opacity(a),

      // Row 1: Clip first, then unscale
      txt('CLIP FIRST', -840, yEarly, 34, COSMOS.rose, 'mono', 'left').opacity(a),
      txt(
        ce > 0.9 ? `min(20.48, 1) ÷ 1024 = ${earlyVal.toFixed(6)}` : 'min(20.48, 1) ÷ 1024 = ?',
        barL,
        yEarly - 62,
        32,
        ce > 0.9 ? COSMOS.rose : COSMOS.ink,
        'mono',
        'left',
      ).opacity(a),
      line([barL, yEarly], [barR, yEarly], { stroke: '#2c3d61', width: 4 }).opacity(a),
      txt('0', barL, yEarly + 48, 26, COSMOS.muted, 'mono').opacity(a),
      txt('0.02', barR, yEarly + 48, 26, COSMOS.muted, 'mono').opacity(a),

      // Row 2: Unscale first, then clip
      txt('UNSCALE FIRST', -840, yTrue, 34, COSMOS.cyan, 'mono', 'left').opacity(a),
      txt(
        ct > 0.9 ? `min(20.48 ÷ 1024, 1) = ${trueVal}` : 'min(20.48 ÷ 1024, 1) = ?',
        barL,
        yTrue - 62,
        32,
        ct > 0.9 ? COSMOS.cyan : COSMOS.ink,
        'mono',
        'left',
      ).opacity(a),
      line([barL, yTrue], [barR, yTrue], { stroke: '#2c3d61', width: 4 }).opacity(a),
      txt('0', barL, yTrue + 48, 26, COSMOS.muted, 'mono').opacity(a),
      txt('0.02', barR, yTrue + 48, 26, COSMOS.muted, 'mono').opacity(a),
    ];

    // Live contracting early-clip bar (starts at 0.02, collapses to 1/1024!)
    const ex = xNorm(norm + (earlyVal - norm) * ce);
    nodes.push(
      glowingTrail(
        [
          [barL, yEarly],
          [Math.max(barL + 8, ex), yEarly],
        ],
        { color: ce > 0.1 ? COSMOS.rose : COSMOS.gold, width: 10, glow: 12, opacity: a },
      ),
      glowDot(ex, yEarly, {
        radius: 11,
        color: ce > 0.1 ? COSMOS.rose : COSMOS.gold,
        glow: 14,
        opacity: a,
      }),
    );
    if (ce > 0.9) {
      nodes.push(
        txt('20× too small!', barL + 220, yEarly + 54, 28, COSMOS.rose, 'sans', 'left')
          .glow(6, COSMOS.rose)
          .opacity(a),
      );
    }

    // Live true-clip bar (stays at full 0.02!)
    const tx = xNorm(trueVal);
    nodes.push(
      glowingTrail(
        [
          [barL, yTrue],
          [tx, yTrue],
        ],
        {
          color: ct > 0.1 ? COSMOS.cyan : COSMOS.dim,
          width: 10,
          glow: ct > 0.1 ? 12 : 4,
          opacity: a,
        },
      ),
      glowDot(tx, yTrue, {
        radius: 11,
        color: ct > 0.1 ? COSMOS.cyan : COSMOS.dim,
        glow: 14,
        opacity: a,
      }),
    );
    if (ct > 0.9) {
      nodes.push(
        txt('Entire gradient survives!', barL + 220, yTrue + 96, 30, COSMOS.emerald, 'sans', 'left')
          .glow(6, COSMOS.emerald)
          .opacity(a),
      );
    }

    return group(...nodes);
  });

  // Act 2: 3-microbatch accumulation window (scale 256)
  const act2Live = guardedDynamic(showAct2, (a) => {
    const count = Math.min(3, Math.floor(batchStage.value + 0.05));
    const un = didUnscale.value;
    const fi = didFinite.value;
    const st = didStep.value;

    const contribs = ACCUM_END.contributions; // [[0.5, 0], [0, 0.25], [0.25, 0.25]]
    const scale = ACCUM_END.scale; // 256
    const running = contribs
      .slice(0, count)
      .reduce((acc, g) => [acc[0] + g[0] * scale, acc[1] + g[1] * scale], [0, 0]);
    const unscaled = [running[0] / scale, running[1] / scale];

    const nodes = [];
    const mx = [-580, 0, 580];
    contribs.forEach((g, idx) => {
      const done = idx < count;
      const col = done ? COSMOS.cyan : COSMOS.dim;
      nodes.push(
        glowDot(mx[idx], -175, { radius: 20, color: col, glow: done ? 14 : 4, opacity: a }),
        txt(
          `Microbatch ${idx + 1}`,
          mx[idx],
          -238,
          28,
          done ? COSMOS.ink : COSMOS.muted,
          'mono',
        ).opacity(a),
        txt(`[${g[0]}, ${g[1]}]`, mx[idx], -112, 32, col, 'mono').opacity(a),
      );
      if (done) {
        nodes.push(
          txt(
            `×256 → [${g[0] * scale}, ${g[1] * scale}]`,
            mx[idx],
            -62,
            26,
            COSMOS.gold,
            'mono',
          ).opacity(a),
          glowingArc([mx[idx], -32], [0, 56], 24, {
            color: COSMOS.cyan,
            width: 3.5,
            glow: 8,
            opacity: 0.85 * a,
          }),
        );
      }
    });

    // Central FP32 accumulation buffer
    nodes.push(
      txt('FP32 ACCUMULATION BUFFER', 0, 106, 26, COSMOS.gold, 'mono').opacity(a),
      txt(`[ ${running[0]},  ${running[1]} ]`, 0, 168, 56, COSMOS.gold, 'mono')
        .glow(10, COSMOS.gold)
        .opacity(a),
    );

    if (un > 0.05) {
      nodes.push(
        line([0, 205], [0, 262], { stroke: COSMOS.emerald, width: 4 })
          .glow(7, COSMOS.emerald)
          .opacity(un * a),
        txt(
          `UNSCALE ONCE (÷ 256)  →  [ ${unscaled[0]},  ${unscaled[1]} ]`,
          0,
          312,
          36,
          COSMOS.emerald,
          'mono',
        )
          .glow(8, COSMOS.emerald)
          .opacity(un * a),
      );
    }

    const status =
      st > 0.4
        ? 'All finite  ·  clip if needed  ·  ONE optimizer step  ·  update scale once'
        : fi > 0.4
          ? 'Both entries finite  ·  ready for clip & step'
          : 'Hold one fixed scale across all microbatches before unscaling';
    nodes.push(
      txt(status, 0, 420, 28, fi > 0.4 ? COSMOS.emerald : COSMOS.muted, 'sans')
        .glow(fi > 0.4 ? 6 : 0, COSMOS.emerald)
        .opacity(a),
    );

    return group(...nodes);
  });

  // Act 3: Active-token window loss normalization
  const act3Live = guardedDynamic(showAct3, (a) => {
    const dn = didNorm.value;
    const da = didAmp.value;
    const batches = [
      { tokens: 2, lossSum: 1, x: -560 },
      { tokens: 1, lossSum: 1, x: 0 },
      { tokens: 3, lossSum: 3, x: 560 },
    ];
    const nodes = [];
    batches.forEach((b, idx) => {
      nodes.push(
        txt(`BATCH ${idx + 1}`, b.x, -210, 28, COSMOS.cyan, 'mono').opacity(a),
        txt(
          `${b.tokens} active ${b.tokens === 1 ? 'token' : 'tokens'}`,
          b.x,
          -148,
          32,
          COSMOS.ink,
          'sans',
        ).opacity(a),
        txt(`loss sum = ${b.lossSum}`, b.x, -92, 28, COSMOS.gold, 'mono').opacity(a),
      );
      for (let t = 0; t < b.tokens; t++) {
        const dx = (t - (b.tokens - 1) * 0.5) * 44;
        nodes.push(
          glowDot(b.x + dx, -36, { radius: 11, color: COSMOS.cyan, glow: 12, opacity: a }),
        );
      }
      if (dn > 0.1) {
        nodes.push(
          glowingArc([b.x, -10], [0, 44], 18, {
            color: COSMOS.gold,
            width: 3,
            glow: 7,
            opacity: 0.75 * dn * a,
          }),
        );
      }
    });

    nodes.push(
      txt(
        'Checkpoint together:  scaler state  +  optimizer state  +  data position',
        0,
        420,
        28,
        da > 0.4 ? COSMOS.emerald : COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Act 4: Unequal-token window (+2 vs -2, -2, -2)
  const act4Live = guardedDynamic(showAct4, (a) => {
    const df = didFirst.value;
    const dg = didGroup.value;
    const dm = didMean.value;
    const dw = didWrongMean.value;

    const toks = [
      { v: '+2', x: -640, col: COSMOS.blue, active: df },
      { v: '-2', x: -80, col: COSMOS.rose, active: dg },
      { v: '-2', x: 260, col: COSMOS.rose, active: dg },
      { v: '-2', x: 600, col: COSMOS.rose, active: dg },
    ];
    const nodes = [
      txt('GROUP A (1 TOKEN)', -640, -230, 26, COSMOS.blue, 'mono').opacity(a),
      txt('GROUP B (3 TOKENS)', 260, -230, 26, COSMOS.rose, 'mono').opacity(a),
    ];

    toks.forEach((tk) => {
      nodes.push(
        glowDot(tk.x, -145, {
          radius: 24,
          color: tk.active > 0.2 ? tk.col : COSMOS.dim,
          glow: tk.active > 0.2 ? 14 : 4,
          opacity: a,
        }),
        txt(tk.v, tk.x, -76, 36, tk.active > 0.2 ? tk.col : COSMOS.muted, 'mono').opacity(a),
      );
    });

    // Group subtotals
    nodes.push(
      txt(
        df > 0.2 ? 'Sum A = +2  (count 1)' : 'Sum A pending',
        -640,
        22,
        30,
        df > 0.2 ? COSMOS.blue : COSMOS.dim,
        'mono',
      ).opacity(a),
      txt(
        dg > 0.2 ? 'Sum B = -6  (count 3)' : 'Sum B pending',
        260,
        22,
        30,
        dg > 0.2 ? COSMOS.rose : COSMOS.dim,
        'mono',
      ).opacity(a),
    );

    if (dm > 0.05) {
      nodes.push(
        glowingArc([-640, 56], [0, 145], 25, {
          color: COSMOS.emerald,
          width: 4,
          glow: 9,
          opacity: dm * a,
        }),
        glowingArc([260, 56], [0, 145], 25, {
          color: COSMOS.emerald,
          width: 4,
          glow: 9,
          opacity: dm * a,
        }),
        txt(
          `FULL-TOKEN MEAN:  (+2 - 6) / 4 = ${UNEQUAL_FIX.mean}`,
          0,
          195,
          40,
          COSMOS.emerald,
          'mono',
        )
          .glow(8, COSMOS.emerald)
          .opacity(dm * a),
      );
    }

    if (dw > 0.05) {
      nodes.push(
        txt(
          `MEAN OF GROUP MEANS:  (+2 + (-2)) / 2 = ${UNEQUAL_FIX.meanOfMeans}  (over-weights 1-token group!)`,
          0,
          312,
          30,
          COSMOS.rose,
          'mono',
        )
          .glow(6, COSMOS.rose)
          .opacity(dw * a),
      );
    }

    nodes.push(
      txt(
        'Short final window: divide by actual count  ·  All-masked (0 tokens): skip before dividing',
        0,
        425,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  s.add(
    bgAura,
    title1,
    title2,
    title3,
    title4,
    normFormulaTex,
    ampFormulaTex,
    act1Live,
    act2Live,
    act3Live,
    act4Live,
  );

  // Act 1 cues
  c.on('clip-too-early', () => s.play(clipEarly.to(1, { duration: 1.0 })));
  c.on('clip-in-units', () => s.play(clipTrue.to(1, { duration: 0.9 })));

  // Act 2 transition on Beat 1
  c.onBeat(1, () => {
    s.play(
      par(
        showAct1.to(0, { duration: 0.2 }),
        fade(title1, 0, { duration: 0.2 }),
        delay(showAct2.to(1, { duration: 0.25 }), 0.22),
        delay(fade(title2, 1, { duration: 0.25 }), 0.22),
      ),
    );
  });
  c.on('first-batch', () => s.play(batchStage.to(1, { duration: 0.45 })));
  c.on('second-batch', () => s.play(batchStage.to(2, { duration: 0.45 })));
  c.on('third-batch', () => s.play(batchStage.to(3, { duration: 0.45 })));
  c.on('window-unscale', () => s.play(didUnscale.to(1, { duration: 0.45 })));
  c.on('window-finite', () => s.play(didFinite.to(1, { duration: 0.4 })));
  c.on('window-step', () => s.play(didStep.to(1, { duration: 0.4 })));

  // Act 3 transition on Beat 2
  c.onBeat(2, () => {
    s.play(
      par(
        showAct2.to(0, { duration: 0.2 }),
        fade(title2, 0, { duration: 0.2 }),
        delay(showAct3.to(1, { duration: 0.25 }), 0.22),
        delay(fade(title3, 1, { duration: 0.25 }), 0.22),
      ),
    );
  });
  c.on('ordering-b3-1', () => {
    s.play(didNorm.to(1, { duration: 0.5 }));
    s.play(fade(normFormulaTex, 1, { duration: 0.5 }));
  });
  c.on('ordering-b3-2', () => {
    s.play(didAmp.to(1, { duration: 0.5 }));
    s.play(fade(ampFormulaTex, 1, { duration: 0.5 }));
  });

  // Act 4 transition on Beat 3 cue
  c.on('ordering-extension-4', () => {
    s.play(
      par(
        showAct3.to(0, { duration: 0.2 }),
        fade(title3, 0, { duration: 0.2 }),
        fade(normFormulaTex, 0, { duration: 0.2 }),
        fade(ampFormulaTex, 0, { duration: 0.2 }),
        delay(showAct4.to(1, { duration: 0.25 }), 0.22),
        delay(fade(title4, 1, { duration: 0.25 }), 0.22),
      ),
    );
  });
  c.on('unequal-first', () => s.play(didFirst.to(1, { duration: 0.45 })));
  c.on('unequal-group', () => s.play(didGroup.to(1, { duration: 0.55 })));
  c.after('unequal-mean', () =>
    s.play(didMean.to(1, { duration: remainDuration(c, 'unequal-mean', 0.45, 0.35, true) })),
  );
  c.after('unequal-means', () =>
    s.play(didWrongMean.to(1, { duration: remainDuration(c, 'unequal-means', 0.45, 0.35, true) })),
  );
}
