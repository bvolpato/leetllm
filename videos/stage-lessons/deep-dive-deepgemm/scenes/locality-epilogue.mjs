// Scene 21: Treat locality and output conversion as contracts.
// Oct localize partitions weight dim across GPU locality domains (keeps EP rank ownership);
// Mutually exclusive epilogues: Identity, Alpha, FP8Quantization, BF16StochasticRounding (no C input!).
import {
  COSMOS,
  ROLE,
  aura,
  buildTmaTmemPipeline3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function localityEpilogue(s, c) {
  const phase = s.value(0);
  const stage3d = s.value(1.5);
  const step = s.value(0); // 1=localize, 2=fallback, 3=4 epilogues, 4=SR assert with C, 5=separate policy, 6=April predates

  const bgAura = aura(445, 20, 520, '#6ee7b720', '#a78bfa1c');
  const { view: pipe3d } = buildTmaTmemPipeline3d(stage3d, phase, { x: 455, y: 15, unit: 92 });

  const title = heroTitle(['Locality & Output', 'Conversion Contracts'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.good,
    eyebrow: 'OCTOBER SM100 · LOCALIZE & EPILOGUE',
    subtitle: 'Domain partitioning and mutually exclusive output modes',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const nodes = [
      txt('3D LOCALITY & EPILOGUE STAGE', 455, -415, 26, ROLE.good, 'mono').glow(5, ROLE.good),
      txt(
        'Green right slab: post-accumulation epilogue conversion',
        455,
        435,
        26,
        COSMOS.muted,
        'sans',
      ),
    ];

    // Top panel: Weight Localization (deep_gemm.localize)
    const locLit = st >= 0.6;
    nodes.push(
      glassCell(-460, -118, 800, 140, locLit ? ROLE.a : COSMOS.dim, {
        fill: '#101d36',
        glow: locLit ? 8 : 0,
      }),
      txt('WEIGHT LOCALIZATION (deep_gemm.localize)', -830, -162, 26, ROLE.a, 'mono', 'left'),
      txt(
        'Splits weight dim across GPU domains (EP stays fixed)',
        -830,
        -118,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        st >= 1.6
          ? 'Unstable SM probe -> warns + falls back to even map'
          : 'Dim % domains == 0; L1, L2 & shared weights must agree',
        -830,
        -74,
        26,
        st >= 1.6 ? ROLE.warn : COSMOS.muted,
        'sans',
        'left',
      ),
    );

    // Middle row: 4 mutually exclusive SM100 epilogues
    const epis = [
      { name: 'Identity', sub: 'direct store', col: ROLE.c, x: -755 },
      { name: 'Alpha', sub: 'scalar scale', col: ROLE.a, x: -558 },
      { name: 'FP8Quant', sub: 'quantize out', col: ROLE.scale, x: -360 },
      { name: 'BF16 SR', sub: 'no C input!', col: st >= 3.6 ? ROLE.bad : ROLE.gold, x: -162 },
    ];
    nodes.push(txt('PICK EXACTLY ONE SM100 EPILOGUE', -860, -6, 26, ROLE.scale, 'mono', 'left'));
    epis.forEach((e) => {
      const lit = st >= 2.6;
      nodes.push(
        glassCell(e.x, 68, 184, 96, lit ? e.col : COSMOS.dim, {
          fill: '#0e172a',
          glow: lit ? 8 : 0,
        }),
        txt(e.name, e.x, 48, 26, lit ? e.col : COSMOS.muted, 'mono'),
        txt(e.sub, e.x, 90, 26, COSMOS.ink, 'sans'),
      );
    });

    // Assertion / Separation callout
    if (st >= 3.6) {
      const msg =
        st >= 5.6
          ? 'April Mega MoE timings predate locality & epilogue'
          : st >= 4.6
            ? 'Rounding != deterministic split != sampling RNG'
            : 'Passing C + BF16StochasticRounding -> ASSERT!';
      const col = st >= 4.6 ? ROLE.gold : ROLE.bad;
      nodes.push(
        glassCell(-460, 232, 800, 90, col, { fill: '#221420', glow: 9 }),
        txt(msg, -460, 232, 26, col, 'sans'),
      );
    }

    nodes.push(
      txt(
        'Record the exact epilogue & reference; benchmark your GPU topology',
        -860,
        365,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, pipe3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, pipe3d, { theta: -0.2, phi: 0.94 });

  c.on('le-loc', () => s.play(step.to(1, { duration: remainDuration(c, 'le-loc', 0.45) })));
  c.on('le-fallback', () =>
    s.play(step.to(2, { duration: remainDuration(c, 'le-fallback', 0.45) })),
  );
  c.on('le-epi', () => {
    const dur = remainDuration(c, 'le-epi', 0.5);
    s.play(step.to(3, { duration: dur }));
    s.play(stage3d.to(3, { duration: dur }));
  });
  c.on('le-sr-assert', () =>
    s.play(step.to(4, { duration: remainDuration(c, 'le-sr-assert', 0.45) })),
  );
  c.on('le-separate', () =>
    s.play(step.to(5, { duration: remainDuration(c, 'le-separate', 0.45) })),
  );
  c.on('le-april', () => s.play(step.to(6, { duration: remainDuration(c, 'le-april', 0.45) })));
}
