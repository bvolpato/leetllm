// Scene 23 (FINALE): Move a spike across a block boundary: 3D dual-block quantization slab + prediction -> 0 -> 704 -> split recovery (~0.00098)!
import {
  COSMOS,
  FRESH_SEPARATE,
  FRESH_TOGETHER,
  afterDuration,
  aura,
  box3d,
  cinematic3d,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  points3d,
  rect,
  remainDuration,
  runPhase,
  siliconSlab3d,
  txt,
  wireframeSlab3d,
} from '../parts.mjs';

export default function freshGroup(s, c) {
  const phase = s.value(0);
  const spikeInA = s.value(0); // 0 = Block B, 1 = Block A
  const askQuestion = s.value(0);
  const revealScaleA = s.value(0);
  const revealTinyZero = s.value(0);
  const revealSpike704 = s.value(0);
  const revealZeroB = s.value(0);
  const splitBack = s.value(0);
  const revealRecovered = s.value(0);

  const bgAura = aura(340, -10, 580, '#ffd16624', '#6ee7b71a');
  const title = heroTitle(['Move a Spike Across', 'a Block Boundary'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'TRANSFER CHALLENGE · SCALE OWNERSHIP',
  });

  // 3D orbiting dual-block quantization stage (Block A at y = -1.0, Block B at y = +1.0)
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.0,
    distance: 15.8,
    unit: 82,
    focus: [0, 0, 0.35],
  }).at(380, -95);

  const blockASlab = siliconSlab3d(2.4, 0.65, -0.35, 0.24, '#133b56', COSMOS.cyan, '#80e5ff', 0.68);
  const blockBSlab = siliconSlab3d(
    2.4,
    0.65,
    -0.35,
    0.24,
    '#1b1d3b',
    COSMOS.violet,
    '#b5a8ff',
    0.62,
  );
  // Shift Block A and Block B along Y using explicit boxes instead of overlapping slabs at [0,0]
  const slabA = box3d(-2.35, -1.55, -0.5, 4.7, 1.15, 0.28, '#133b56', COSMOS.cyan, 0.68);
  const slabB = box3d(-2.35, 0.4, -0.5, 4.7, 1.15, 0.28, '#1b1d3b', COSMOS.violet, 0.62);
  // Tiny 0.001 cell anchored in Block A index 0
  const tinyBox = box3d(-2.15, -1.25, -0.2, 0.55, 0.55, 0.42, '#1d6f8a', COSMOS.cyan, 0.92);

  // Moving glowing wireframe spike cage (700) hopping between Block B (y = +0.97) and Block A (y = -0.97)
  const spikeCenter = () => {
    const inA = spikeInA.value * (1 - splitBack.value);
    const y = 0.97 - inA * 1.94;
    const arcLift = Math.sin(inA * Math.PI) * 0.85;
    return [-0.85, y, 0.68 + arcLift];
  };
  const spikeCage = wireframeSlab3d(spikeCenter, 0.32, 0.32, 0.88, {
    color: COSMOS.gold,
    width: 3.4,
    glow: 11,
  });

  const spikePhotons = points3d(
    () => {
      const [sx, sy, sz] = spikeCenter();
      const p = phase.value;
      const glowPulse = 0.22 * Math.sin(p * 3.5);
      return [
        [sx, sy, sz + 0.92 + glowPulse],
        [-1.88, -0.97, 0.34],
      ];
    },
    {
      colorAt: (i) => (i === 0 ? COSMOS.gold : COSMOS.cyan),
      radius: 7,
      glow: 14,
      blend: 'screen',
      onTop: true,
    },
  );

  // Silence unused slab references cleanly by only adding slabA, slabB, tinyBox, spikeCage, spikePhotons
  void blockASlab;
  void blockBSlab;
  view3d.add(...slabA, ...slabB, ...tinyBox, ...spikeCage, spikePhotons);

  const live = guardedDynamic(1, () => {
    const inA = spikeInA.value;
    const ask = askQuestion.value;
    const scA = revealScaleA.value;
    const t0 = revealTinyZero.value;
    const sp7 = revealSpike704.value;
    const zB = revealZeroB.value;
    const spl = splitBack.value;
    const rec = revealRecovered.value;

    const separated = spl > 0.5;
    const joinedNow = inA > 0.5 && !separated;
    const scaleAText = separated
      ? rec > 0.5
        ? 'S_A = 2^-18'
        : 'recomputing...'
      : scA > 0.5
        ? `S_A = ${FRESH_TOGETHER.scale}`
        : 'S_A = ?';
    const scaleBText = separated
      ? `S_B = ${FRESH_SEPARATE.scales[1]}`
      : zB > 0.5
        ? `S_B = ${FRESH_TOGETHER.zeroScale} (zero-only)`
        : 'S_B = ?';

    const nodes = [
      // 3D labels
      txt('3D DUAL-BLOCK SCALE OWNERSHIP (A & B)', 380, -412, 26, COSMOS.gold, 'mono').glow(
        5,
        COSMOS.gold,
      ),
      txt(
        separated
          ? 'Spike 700 returned to Block B → independent scales'
          : joinedNow
            ? 'Spike 700 joined Block A beside 0.001!'
            : '0.001 in Block A (w_0 = 1) · 700 in Block B',
        380,
        215,
        26,
        separated ? COSMOS.emerald : joinedNow ? COSMOS.amber : COSMOS.cyan,
        'sans',
      ),

      // Left block status cards (STRICT PREDICTION WITHHOLDING until scA / zB!)
      glassCell(-525, -145, 680, 126, joinedNow && scA > 0.5 ? COSMOS.amber : COSMOS.cyan, {
        fill: '#0e1b2d',
        glow: 8,
      }),
      txt('BLOCK A (32 SLOTS · INDEX 0 = 0.001)', -835, -180, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        `${scaleAText} · w_0 = 1`,
        -835,
        -122,
        30,
        separated && rec > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),

      glassCell(-525, 18, 680, 126, COSMOS.violet, { fill: '#17122b', glow: 7 }),
      txt('BLOCK B (32 SLOTS)', -835, -18, 26, COSMOS.violet, 'mono', 'left'),
      txt(
        `${scaleBText}   ·   ${joinedNow ? 'all zeros' : 'holds 700'}`,
        -835,
        40,
        30,
        COSMOS.ink,
        'mono',
        'left',
      ),
    ];

    // Spike check strip (Beat 2: 700 / 2 = 350 -> 352 -> 704)
    if (sp7 > 0.02 && !separated) {
      nodes.push(
        glassCell(-525, 168, 680, 108, COSMOS.amber, { fill: '#1f1712', glow: 8, opacity: sp7 }),
        txt(
          'SPIKE AT INDEX 3 (CHECKED SEPARATELY)',
          -835,
          138,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(sp7),
        txt(
          `700 / 2 = 350 → E4M3 352 → × 2 = ${FRESH_TOGETHER.spike.reconstructed}`,
          -835,
          190,
          28,
          COSMOS.amber,
          'mono',
          'left',
        ).opacity(sp7),
      );
    }

    // Bottom full-width magnified index-0 activation ruler & dot-product answer
    const botY = 358;
    const rx0 = -805;
    const rx1 = 45;
    const ry = 368;
    const firstStep = FRESH_TOGETHER.scale * 2 ** -9; // 2 * 2^-9 = 0.00390625
    const midStep = firstStep * 0.5; // 0.001953125
    const mapR = (v) => rx0 + Math.min(1, v / firstStep) * (rx1 - rx0);

    const outCol = separated
      ? rec > 0.5
        ? COSMOS.emerald
        : COSMOS.gold
      : t0 > 0.5
        ? COSMOS.rose
        : COSMOS.gold;
    const outText = separated
      ? rec > 0.5
        ? `${FRESH_SEPARATE.tiny.reconstructed.toFixed(6)}`
        : '...'
      : t0 > 0.5
        ? `${FRESH_TOGETHER.tiny.reconstructed}`
        : '?';

    nodes.push(
      glassCell(-380, botY, 930, 184, outCol, { fill: '#0d1526', glow: 7 }),
      ...(scA > 0.5
        ? [
            txt(
              separated && rec > 0.5
                ? 'INDEX 0 RULER (SHARED STEP VS RESCUED 2^-18)'
                : 'INDEX 0 ACTIVATION RULER (0 TO FIRST STEP 2 × 2^-9)',
              -805,
              290,
              26,
              COSMOS.muted,
              'mono',
              'left',
            ),
            line([rx0, ry], [rx1, ry], { stroke: '#465885', width: 3.4 }),
            line([mapR(0), ry - 18], [mapR(0), ry + 18], { stroke: COSMOS.muted, width: 3 }),
            txt('0', mapR(0), ry + 48, 26, COSMOS.muted, 'mono'),
            line([mapR(midStep), ry - 16], [mapR(midStep), ry + 16], {
              stroke: COSMOS.amber,
              width: 2.2,
              dash: [6, 5],
            }),
            txt('mid ≈ 0.00195', mapR(midStep), ry + 48, 26, COSMOS.amber, 'mono'),
            line([mapR(firstStep), ry - 18], [mapR(firstStep), ry + 18], {
              stroke: COSMOS.cyan,
              width: 3,
            }),
            txt('step ≈ 0.00391', mapR(firstStep), ry + 48, 26, COSMOS.cyan, 'mono', 'right'),
            glowDot(mapR(0.001), ry - 12, { radius: 7, color: COSMOS.blue }),
            txt('0.001', mapR(0.001), ry - 44, 26, COSMOS.blue, 'mono'),
            ...(t0 > 0.5 && !separated
              ? [glowDot(mapR(0), ry + 14, { radius: 9, color: COSMOS.rose })]
              : []),
            ...(rec > 0.5 && separated
              ? [
                  glowDot(mapR(FRESH_SEPARATE.tiny.reconstructed), ry + 14, {
                    radius: 9,
                    color: COSMOS.emerald,
                  }),
                ]
              : []),
          ]
        : [
            txt(
              'POWER-OF-TWO BLOCK SCALE RULE (INDEX 0 = 0.001)',
              -805,
              294,
              26,
              COSMOS.muted,
              'mono',
              'left',
            ),
            txt(
              'Choose smallest power of two:  S ≥ max|x| / 448',
              -805,
              352,
              28,
              COSMOS.cyan,
              'mono',
              'left',
            ),
            txt(
              'First positive E4M3 step = S × 2^-9  (compare to 0.001)',
              -805,
              408,
              26,
              COSMOS.ink,
              'mono',
              'left',
            ),
          ]),

      // Right finale answer box (STRICT PREDICTION WITHHOLDING!)
      glassCell(475, botY, 720, 178, outCol, { fill: '#121828', glow: 10 }),
      txt(
        separated
          ? 'AFTER RESTORING SEPARATE BLOCKS'
          : ask > 0.5
            ? 'DOT PRODUCT AT INDEX 0 (w_0 = 1)'
            : 'INDEX 0 DOT PRODUCT',
        475,
        296,
        26,
        COSMOS.muted,
        'mono',
      ),
      txt(outText, 475, 360, 48, outCol, 'mono').glow(8, outCol),
      txt(
        separated
          ? rec > 0.5
            ? '256 × 2^-18 ≈ 0.000977 (rescued!)'
            : 'Recomputing independent block scales...'
          : t0 > 0.5
            ? '0.001 < 0.00195 → flushes to zero!'
            : scA > 0.5
              ? '700/448 = 1.5625 → S_A = 2'
              : 'What will index 0 return?',
        475,
        416,
        26,
        outCol,
        'mono',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, view3d, title, live);
  runPhase(s, c, phase, 16);
  orbitScene(s, c, view3d, { theta: -0.2, phi: 0.9 });

  c.on('fresh-join', () =>
    s.play(spikeInA.to(1, { duration: remainDuration(c, 'fresh-join', 0.65) })),
  );
  c.on('fresh-question', () =>
    s.play(askQuestion.to(1, { duration: remainDuration(c, 'fresh-question', 0.4) })),
  );
  c.on('lp-fresh-group-scale', () =>
    s.play(revealScaleA.to(1, { duration: remainDuration(c, 'lp-fresh-group-scale', 0.45) })),
  );
  c.after('lp-fresh-group-tiny', () =>
    s.play(revealTinyZero.to(1, { duration: afterDuration(c, 'lp-fresh-group-tiny', 0.45) })),
  );
  c.after('lp-fresh-group-spike', () =>
    s.play(revealSpike704.to(1, { duration: afterDuration(c, 'lp-fresh-group-spike', 0.45) })),
  );
  c.on('lp-fresh-group-zero', () =>
    s.play(revealZeroB.to(1, { duration: remainDuration(c, 'lp-fresh-group-zero', 0.45) })),
  );
  c.on('fresh-split', () =>
    s.play(splitBack.to(1, { duration: remainDuration(c, 'fresh-split', 0.65) })),
  );
  c.after('fresh-recheck', () =>
    s.play(revealRecovered.to(1, { duration: afterDuration(c, 'fresh-recheck', 0.45) })),
  );
}
