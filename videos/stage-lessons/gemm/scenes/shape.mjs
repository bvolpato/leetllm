// Scene 14: Keep the weights and change the batch: 3D 6x6 weight crystal wall + batch 8 -> 1 token collapse -> 3/8 FLOP/B.
import {
  COSMOS,
  ROLE,
  SHAPE_AI,
  SHAPE_BYTES,
  SHAPE_FLOPS,
  aura,
  buildBatchWeights3d,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function shape(s, c) {
  const batchRatio = s.value(1); // 1 = 8 tokens, 0 = 1 token
  const phase = s.value(0);
  const highlightWeight = s.value(0);
  const showModel = s.value(0);

  const bgAura = aura(370, 25, 520, '#ff6b8b22', '#60a5fa18');
  const { view: batch3d } = buildBatchWeights3d(batchRatio, phase, { x: 380, y: 20, unit: 102 });

  const title = heroTitle(['Keep the Weights,', 'Shrink the Batch'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.b,
    eyebrow: 'PREFILL vs DECODE · WEIGHT REUSE',
  });

  const eq = glowTex(
    '\\frac{72\\text{ FLOPs}}{192\\text{ B}} = \\frac{3}{8} = 0.375\\text{ FLOP/B}',
    {
      x: -510,
      y: 255,
      size: 38,
      color: COSMOS.gold,
    },
  );

  const live = guardedDynamic(1, () => {
    const br = batchRatio.value;
    const hw = highlightWeight.value;
    const sm = showModel.value;
    const activeRows = Math.max(1, Math.round(1 + br * 7));

    const nodes = [
      txt('3D WEIGHT WALL (6 × 6) + TOKEN BATCH', 380, -405, 26, ROLE.b, 'mono').glow(5, ROLE.b),
      txt(
        activeRows > 1
          ? `Prefill batch = ${activeRows} tokens sharing every pink weight`
          : 'Decode batch = 1 token · same 36 weights loaded once',
        380,
        420,
        26,
        activeRows > 1 ? ROLE.good : ROLE.warn,
        'mono',
      ),
    ];

    // Left 2D schematic: active blue token rows feeding 1 fixed pink weight column -> cyan outputs
    nodes.push(
      txt(`TOKENS (B = ${activeRows})`, -760, -175, 26, ROLE.a, 'mono'),
      txt('WEIGHTS (6×6)', -470, -175, 26, ROLE.b, 'mono'),
      txt('OUTPUTS', -195, -175, 26, ROLE.c, 'mono'),
    );

    for (let r = 0; r < 8; r++) {
      const y = -120 + r * 38;
      const alive = r < activeRows;
      const op = alive ? 0.95 : 0.14;
      nodes.push(
        rect(150, 26, {
          fill: r === 0 ? '#183d6e' : '#10213d',
          stroke: r === 0 ? COSMOS.gold : ROLE.a,
          width: r === 0 ? 2.4 : 1.4,
          radius: 5,
        })
          .at(-760, y)
          .opacity(op),
        rect(150, 26, {
          fill: alive ? '#0f3042' : '#0b101d',
          stroke: alive ? ROLE.c : COSMOS.dim,
          width: alive ? 1.8 : 1.0,
          radius: 5,
        })
          .at(-195, y)
          .opacity(op),
      );
    }

    // Fixed 6x6 weight block in center-left (never shrinks!)
    nodes.push(
      rect(168, 228, {
        fill: '#2b1222',
        stroke: hw > 0.5 ? COSMOS.gold : ROLE.b,
        width: hw > 0.5 ? 3.2 : 2.2,
        radius: 10,
      })
        .at(-470, 5)
        .glow(hw > 0.5 ? 10 : 5, ROLE.b),
      txt('36', -470, -12, 46, ROLE.b, 'mono').glow(6, ROLE.b),
      txt('weights', -470, 38, 26, COSMOS.muted, 'sans'),
    );

    if (sm > 0.02) {
      nodes.push(
        txt(
          `Cold batch-1: (6 + 36 + 6) × 4 B = ${SHAPE_BYTES} B · ${SHAPE_FLOPS} FLOPs = ${SHAPE_AI} FLOP/B`,
          -855,
          375,
          26,
          COSMOS.gold,
          'mono',
          'left',
        ).opacity(sm),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, batch3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, batch3d, { theta: -0.22, phi: 0.92 });

  c.on('weight-column', () =>
    s.play(highlightWeight.to(1, { duration: remainDuration(c, 'weight-column', 0.45) })),
  );
  c.on('thin-batch', () =>
    s.play(batchRatio.to(0, { duration: remainDuration(c, 'thin-batch', 0.85) })),
  );
  c.on('shape-model', () => {
    const dur = remainDuration(c, 'shape-model', 0.5);
    s.play(showModel.to(1, { duration: dur }));
  });
  c.show('shape-model', [eq]);
}
