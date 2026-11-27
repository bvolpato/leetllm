// Scene 13: How FP8 stores a spike (4 luminous acts including an orbiting 3D MXFP8 32+1 byte cube cluster!).
// Act 1 (Beat 0): OCP FP8 E4M3 (max 448, no Inf) vs E5M2 (max 57,344, with Inf) 8-bit ribbons.
// Act 2 (Beat 1): Spike 512 through Current scaling (512/448 -> restores 512) vs Delayed (8/448 -> clamps to 8).
// Act 3 (Beat 2): Orbiting 3D MXFP8 32-element block (4x8 FP8 cubes) + 1 radiant E8M0 scale cube = 33 bytes.
// Act 4 (Beat 3): E4M3 saturation cliff at 448 (input 500 -> 448, error 52, vs NaN when unsaturated).
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  SAT_FP8_FIX,
  SPIKE_FP8_FIX,
  aura,
  bitFieldRibbon,
  box3d,
  cinematic3d,
  fade,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function fp8Contract(s, c) {
  // Act 1: E4M3 vs E5M2 bit fields
  const showAct1 = s.value(1);
  const bitsProg = s.value(0.2);
  const e4Limit = s.value(0);
  const e5Limit = s.value(0);

  // Act 2: Current vs Delayed spike
  const showAct2 = s.value(0);
  const spikeIn = s.value(0);
  const curScale = s.value(0);
  const curRes = s.value(0);
  const delRes = s.value(0);

  // Act 3: 3D MXFP8 32+1 byte block
  const showAct3 = s.value(0);
  const mxElems = s.value(0);
  const mxScale = s.value(0);
  const mxTotal = s.value(0);

  // Act 4: Saturation cliff
  const showAct4 = s.value(0);
  const satSlide = s.value(0);
  const satErr = s.value(0);

  const bgAura = aura(120, 0, 680, '#a78bfa22', '#60a5fa14');

  const title1 = heroTitle(['OCP FP8', 'Bit Encodings'], {
    x: -855,
    y: -445,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.blue,
    eyebrow: '8-BIT RANGE VS RESOLUTION',
  });
  const title2 = heroTitle(['One Spike,', 'Two Scales'], {
    x: -855,
    y: -445,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.gold,
    eyebrow: 'CURRENT VS DELAYED FP8 SCALING',
  }).opacity(0);
  const title3 = heroTitle(['MXFP8 Block', 'Microscaling'], {
    x: -855,
    y: -445,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.cyan,
    eyebrow: '32 FP8 VALUES + 1 E8M0 SCALE',
  }).opacity(0);
  const title4 = heroTitle(['Saturation', 'vs NaN Cliff'], {
    x: -855,
    y: -445,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.rose,
    eyebrow: 'OCP E4M3 HAS NO INFINITY',
  }).opacity(0);

  // 3D MXFP8 32-byte array + 1 gold E8M0 scale cube (Act 3)
  const mxView3d = cinematic3d({
    theta: -0.74,
    phi: 1.06,
    distance: 15.2,
    unit: 96,
    focus: [0.3, 0, 0.25],
  })
    .at(285, 10)
    .opacity(0);

  const mxCubes = [];
  for (let r = 0; r < 4; r++) {
    for (let col = 0; col < 8; col++) {
      const x0 = -3.2 + col * 0.72;
      const y0 = -1.4 + r * 0.72;
      mxCubes.push(...box3d(x0, y0, 0, 0.56, 0.56, 0.56, '#1f64b0', COSMOS.cyan, 0.74));
    }
  }
  const scaleCube = box3d(3.2, -0.45, 0, 0.92, 0.92, 0.92, '#c8921f', COSMOS.gold, 0.88);
  mxView3d.add(...mxCubes, ...scaleCube);

  // Act 1: E4M3 vs E5M2 8-bit luminous ribbons
  const act1Live = guardedDynamic(showAct1, (a) => {
    const bp = bitsProg.value;
    const e4 = e4Limit.value;
    const e5 = e5Limit.value;

    const r4 = bitFieldRibbon({
      x: -440,
      y: -120,
      totalWidth: 1180,
      height: 76,
      signBits: 1,
      expBits: 4,
      fracBits: 3,
      expColor: COSMOS.blue,
      fracColor: COSMOS.emerald,
      opacity: a,
      reveal: bp,
      showBitGlyphs: true,
    });
    const r5 = bitFieldRibbon({
      x: -440,
      y: 165,
      totalWidth: 1180,
      height: 76,
      signBits: 1,
      expBits: 5,
      fracBits: 2,
      expColor: COSMOS.violet,
      fracColor: COSMOS.emerald,
      opacity: a,
      reveal: bp,
      showBitGlyphs: true,
    });

    const nodes = [
      txt('E4M3', -790, -120, 44, COSMOS.blue, 'mono', 'left').glow(7, COSMOS.blue).opacity(a),
      txt('1s · 4e · 3m', -790, -68, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      r4.group,
      txt(
        e4 > 0.5
          ? 'max finite 448  ·  NO infinity (favored for forward)'
          : 'range & special values...',
        150,
        -25,
        30,
        e4 > 0.5 ? COSMOS.blue : COSMOS.dim,
        'mono',
      )
        .glow(e4 > 0.5 ? 6 : 0, COSMOS.blue)
        .opacity(a),

      txt('E5M2', -790, 165, 44, COSMOS.violet, 'mono', 'left').glow(7, COSMOS.violet).opacity(a),
      txt('1s · 5e · 2m', -790, 217, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      r5.group,
      txt(
        e5 > 0.5
          ? 'max finite 57,344  ·  INCLUDES infinity (favored for gradients)'
          : 'range & special values...',
        150,
        260,
        30,
        e5 > 0.5 ? COSMOS.violet : COSMOS.dim,
        'mono',
      )
        .glow(e5 > 0.5 ? 6 : 0, COSMOS.violet)
        .opacity(a),
    ];
    return group(...nodes);
  });

  // Act 2: Spike 512 through Current vs Delayed scaling
  const act2Live = guardedDynamic(showAct2, (a) => {
    const sp = spikeIn.value;
    const cs = curScale.value;
    const cr = curRes.value;
    const dr = delRes.value;

    const curFix = SPIKE_FP8_FIX[0]; // amax 512 -> restored 512
    const delFix = SPIKE_FP8_FIX[1]; // amax 8 -> restored 8

    const rows = [
      {
        name: 'CURRENT SCALING',
        sub: 'live amax = 512',
        y: -115,
        stepStr: cs > 0.3 ? 'step = 512 / 448' : 'scanning amax...',
        restored: cr > 0.5 ? `Restores ${curFix.restored} (exact!)` : 'q × step = ?',
        ready: cr > 0.5,
        col: COSMOS.emerald,
      },
      {
        name: 'DELAYED SCALING',
        sub: 'stale amax = 8',
        y: 165,
        stepStr: 'step = 8 / 448',
        restored: dr > 0.5 ? `Restores ${delFix.restored} (clipped!)` : 'q × step = ?',
        ready: dr > 0.5,
        col: COSMOS.rose,
      },
    ];

    const nodes = [
      txt(
        'BOTH PATHS CLAMP AT E4M3 CEILING = 448',
        820,
        -370,
        26,
        COSMOS.gold,
        'mono',
        'right',
      ).opacity(a),
    ];

    for (const r of rows) {
      nodes.push(
        txt(r.name, -830, r.y - 22, 30, r.col, 'mono', 'left').opacity(a),
        txt(r.sub, -830, r.y + 22, 26, COSMOS.muted, 'mono', 'left').opacity(a),

        // Spike input -> Step -> Clamp 448 -> Restored
        glowDot(-360, r.y, {
          radius: 18,
          color: sp > 0.2 ? COSMOS.gold : COSMOS.dim,
          glow: 12,
          opacity: a,
        }),
        txt(sp > 0.2 ? 'Spike 512' : 'Input', -360, r.y - 54, 28, COSMOS.gold, 'mono').opacity(a),

        glowingTrail(
          [
            [-325, r.y],
            [-35, r.y],
          ],
          { color: r.col, width: 4, glow: 8, opacity: (0.35 + 0.65 * sp) * a },
        ),
        txt(r.stepStr, -180, r.y + 46, 26, r.col, 'mono').opacity(a),

        glowDot(0, r.y, { radius: 18, color: COSMOS.blue, glow: 10, opacity: a }),
        txt('Clamp 448', 0, r.y - 54, 28, COSMOS.blue, 'mono').opacity(a),

        glowingTrail(
          [
            [35, r.y],
            [335, r.y],
          ],
          { color: r.ready ? r.col : COSMOS.dim, width: 4.5, glow: 9, opacity: a },
        ),
        glowDot(370, r.y, {
          radius: 20,
          color: r.ready ? r.col : COSMOS.dim,
          glow: 14,
          opacity: a,
        }),
        txt(r.restored, 420, r.y, 32, r.ready ? r.col : COSMOS.dim, 'mono', 'left')
          .glow(r.ready ? 7 : 0, r.col)
          .opacity(a),
      );
    }

    nodes.push(
      txt(
        'Hybrid FP8 recipe: E4M3 forward operands  ·  E5M2 gradients  ·  wider FP32 accumulation',
        0,
        410,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Act 3: 3D MXFP8 telemetry overlay
  const act3Live = guardedDynamic(showAct3, (a) => {
    const el = mxElems.value;
    const sc = mxScale.value;
    const tot = mxTotal.value;
    const count = Math.round(32 * el);

    const nodes = [
      txt('3D MICROSCALING BLOCK (4 × 8 + SCALE)', 285, -390, 26, COSMOS.cyan, 'mono')
        .glow(5, COSMOS.cyan)
        .opacity(a),
      txt('ELEMENT BYTES', -855, -165, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt(`${count} × 1 B = ${count} B`, -855, -102, 46, COSMOS.cyan, 'mono', 'left')
        .glow(7, COSMOS.cyan)
        .opacity(a),
      txt('SHARED BLOCK SCALE', -855, 15, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt(
        sc > 0.3 ? '1 × E8M0 = 1 B' : 'pending...',
        -855,
        78,
        42,
        sc > 0.3 ? COSMOS.gold : COSMOS.dim,
        'mono',
        'left',
      )
        .glow(sc > 0.3 ? 8 : 0, COSMOS.gold)
        .opacity(a),
      txt('BLOCK PAYLOAD TOTAL', -855, 195, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt(
        tot > 0.3 ? '33 bytes / 32 vals' : '32 + 1 = ?',
        -855,
        258,
        46,
        tot > 0.3 ? COSMOS.emerald : COSMOS.dim,
        'mono',
        'left',
      )
        .glow(tot > 0.3 ? 8 : 0, COSMOS.emerald)
        .opacity(a),
      txt(
        'Each 32-value block carries its own power-of-two E8M0 scale',
        -855,
        385,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(a),
    ];
    return group(...nodes);
  });

  // Act 4: Saturation cliff (500 -> 448, error 52, vs NaN)
  const act4Live = guardedDynamic(showAct4, (a) => {
    const ss = satSlide.value;
    const se = satErr.value;

    const railL = -720;
    const railR = 720;
    const xVal = (v) => railL + (v / 520) * (railR - railL);
    const axisY = -30;
    const xMax = xVal(SAT_FP8_FIX.maximum); // 448
    const xIn = xVal(SAT_FP8_FIX.input); // 500
    const curVal = SAT_FP8_FIX.input + (SAT_FP8_FIX.stored - SAT_FP8_FIX.input) * ss;
    const curX = xVal(curVal);

    const nodes = [
      txt('INPUT VALUE: 500  →  OCP E4M3', 820, -370, 30, COSMOS.gold, 'mono', 'right').opacity(a),
      line([railL, axisY], [railR, axisY], { stroke: '#2c3d61', width: 4.5 }).opacity(a),
      // Saturation ceiling wall at 448
      line([xMax, axisY - 120], [xMax, axisY + 80], {
        stroke: COSMOS.rose,
        width: 5,
        dash: [8, 5],
      })
        .glow(9, COSMOS.rose)
        .opacity(a),
      txt('E4M3 MAX · 448', xMax, axisY - 150, 28, COSMOS.rose, 'mono')
        .glow(6, COSMOS.rose)
        .opacity(a),
      txt('0', railL, axisY + 52, 28, COSMOS.muted, 'mono').opacity(a),
      txt('448', xMax, axisY + 110, 30, COSMOS.rose, 'mono').opacity(a),
      txt('500', xIn, axisY + 52, 30, COSMOS.gold, 'mono').opacity(a),

      // Clamping trail & photon
      glowingTrail(
        [
          [xIn, axisY - 36],
          [curX, axisY - 36],
        ],
        { color: COSMOS.gold, width: 5, glow: 10, opacity: (0.2 + 0.8 * ss) * a },
      ),
      glowDot(curX, axisY - 36, { radius: 13, color: COSMOS.gold, glow: 15, opacity: a }),

      // Comparison outcomes below
      txt(
        ss > 0.5 ? 'SATURATION ON:  clamps to 448 (finite)' : 'SATURATION ON:  pending...',
        -760,
        210,
        32,
        ss > 0.5 ? COSMOS.emerald : COSMOS.dim,
        'mono',
        'left',
      )
        .glow(ss > 0.5 ? 6 : 0, COSMOS.emerald)
        .opacity(a),
      txt(
        se > 0.5
          ? `Lost ${SAT_FP8_FIX.error} (500 - 448)  ·  SATURATION OFF: can emit NaN`
          : 'Check silent clip error vs NaN',
        -760,
        290,
        32,
        se > 0.5 ? COSMOS.rose : COSMOS.muted,
        'mono',
        'left',
      )
        .glow(se > 0.5 ? 6 : 0, COSMOS.rose)
        .opacity(a),
      txt(
        'Track saturation rates, scale history, non-finite steps, and held-out quality vs BF16 baseline',
        0,
        420,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    ];
    return group(...nodes);
  });

  s.add(bgAura, title1, title2, title3, title4, mxView3d, act1Live, act2Live, act3Live, act4Live);

  // Act 1 cues
  c.on('fp8-contract-b1', () => s.play(bitsProg.to(1, { duration: 0.9 })));
  c.after('fp8-e4-limit', () =>
    s.play(e4Limit.to(1, { duration: remainDuration(c, 'fp8-e4-limit', 0.4, 0.35, true) })),
  );
  c.after('fp8-e5-limit', () =>
    s.play(e5Limit.to(1, { duration: remainDuration(c, 'fp8-e5-limit', 0.4, 0.35, true) })),
  );

  // Act 2 transition & cues
  c.on('fp8-contract-b2', () => {
    s.play(
      par(
        showAct1.to(0, { duration: 0.2 }),
        fade(title1, 0, { duration: 0.2 }),
        delay(showAct2.to(1, { duration: 0.25 }), 0.22),
        delay(fade(title2, 1, { duration: 0.25 }), 0.22),
      ),
    );
  });
  c.on('fp8-spike', () => s.play(spikeIn.to(1, { duration: 0.55 })));
  c.on('fp8-current-scale', () => s.play(curScale.to(1, { duration: 0.45 })));
  c.after('fp8-current-result', () =>
    s.play(curRes.to(1, { duration: remainDuration(c, 'fp8-current-result', 0.4, 0.35, true) })),
  );
  c.after('fp8-delayed-result', () =>
    s.play(delRes.to(1, { duration: remainDuration(c, 'fp8-delayed-result', 0.4, 0.35, true) })),
  );

  // Act 3 transition (3D MXFP8 cube block) & cues
  c.on('fp8-contract-b3', () => {
    const orbitDur = Math.max(
      1.0,
      Math.min(8.0, c.cue('fp8-contract-b4').start - c.cue('fp8-contract-b3').start - 0.5),
    );
    s.play(
      par(
        showAct2.to(0, { duration: 0.2 }),
        fade(title2, 0, { duration: 0.2 }),
        delay(showAct3.to(1, { duration: 0.25 }), 0.22),
        delay(fade(title3, 1, { duration: 0.25 }), 0.22),
        delay(fade(mxView3d, 1, { duration: 0.35 }), 0.22),
        delay(mxView3d.orbit({ theta: -0.22, phi: 0.92 }, { duration: orbitDur }), 0.25),
      ),
    );
  });
  c.on('mx-elements', () => s.play(mxElems.to(1, { duration: 0.85 })));
  c.on('mx-scale', () => s.play(mxScale.to(1, { duration: 0.45 })));
  c.on('mx-total', () => s.play(mxTotal.to(1, { duration: 0.45 })));

  // Act 4 transition & cues
  c.on('fp8-contract-b4', () => {
    s.play(
      par(
        showAct3.to(0, { duration: 0.2 }),
        fade(title3, 0, { duration: 0.2 }),
        fade(mxView3d, 0, { duration: 0.2 }),
        delay(showAct4.to(1, { duration: 0.25 }), 0.22),
        delay(fade(title4, 1, { duration: 0.25 }), 0.22),
      ),
    );
  });
  c.on('fp8-saturation', () => s.play(satSlide.to(1, { duration: 0.9 })));
  c.after('fp8-error', () =>
    s.play(satErr.to(1, { duration: remainDuration(c, 'fp8-error', 0.4, 0.35, true) })),
  );
}
