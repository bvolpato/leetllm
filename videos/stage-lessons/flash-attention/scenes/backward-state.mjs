// Scene 16: Compare one saved probability matrix with one saved LSE vector: 32 GiB vs 8 MiB (4,096x).
import {
  COSMOS,
  LSE_MIB,
  SCORE_GIB,
  STATE_RATIO,
  aura,
  box3d,
  cinematic3d,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainDuration,
  rule,
  runPhase,
  txt,
} from '../parts.mjs';

export default function backwardState(s, c) {
  const phase = s.value(0);
  const showFormula = s.value(0.5);
  const showRatio = s.value(0);
  const show64 = s.value(0);

  const bgAura = aura(320, 20, 540, '#ff6b8b22', '#a78bfa20');
  const title = heroTitle(['32 GiB Slab vs', '8 MiB Strip'], {
    x: -855,
    y: -410,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.violet,
    eyebrow: 'SAVED BACKWARD ACTIVATION STATE',
  });

  const eq = glowTex(String.raw`\text{LSE} = m + \log\ell,\qquad P = \exp(S - \text{LSE})`, {
    x: -495,
    y: -175,
    size: 32,
    color: COSMOS.cyan,
  });

  // 3D dramatic contrast: giant 32 GiB P slab vs razor-thin 8 MiB LSE wafer + retained Q/K/V/O
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 15.6,
    unit: 108,
    focus: [0, 0, 0.7],
  }).at(350, 35);

  const probSlab = box3d(-2.5, -1.5, 0, 2.6, 2.8, 2.2, '#b83254', COSMOS.rose, 0.74);
  const lseWafer = box3d(0.95, -1.5, 0, 0.38, 2.8, 0.16, '#6d4aff', COSMOS.violet, 0.92);
  const qkvoBase = box3d(1.7, -1.5, 0, 0.85, 2.8, 0.52, '#166f94', COSMOS.cyan, 0.7);
  view3d.add(...probSlab, ...lseWafer, ...qkvoBase);

  const live = guardedDynamic(1, () => {
    const sf = showFormula.value;
    const sr = showRatio.value;
    const s64 = show64.value;

    const nodes = [
      txt('3D SAVED BACKWARD STATE', 350, -370, 26, COSMOS.muted, 'mono'),
      txt('32 GiB P (FP16)', 155, 385, 26, COSMOS.rose, 'mono'),
      txt('8 MiB LSE', 440, 385, 26, COSMOS.violet, 'mono'),
      txt('Q,K,V,O', 645, 385, 26, COSMOS.cyan, 'mono'),

      // Floating cinema typography + proportional ratio bars (zero boxed cards)
      rule(-855, -110, -210, -110, '#2a385c', 1.8).opacity(sf),
      txt('RETAINED INPUT REFS', -855, -70, 26, COSMOS.cyan, 'mono', 'left').opacity(sf),
      txt('Keep Q, K, V refs + O + LSE (+ RNG)', -855, -22, 26, COSMOS.ink, 'sans', 'left').opacity(
        sf,
      ),
    ];

    if (sr > 0.02) {
      nodes.push(
        rule(-855, 24, -210, 24, '#2a385c', 1.8).opacity(sr),
        txt('PROBABILITY SLAB / LSE RATIO', -855, 64, 26, COSMOS.muted, 'mono', 'left').opacity(sr),
        txt(
          `${STATE_RATIO.toLocaleString('en-US')}× smaller`,
          -855,
          130,
          56,
          COSMOS.violet,
          'mono',
          'left',
        )
          .glow(8, COSMOS.violet)
          .opacity(sr),
        txt(
          `${SCORE_GIB} GiB vs ${LSE_MIB} MiB  ·  32 layers P = 1 TiB`,
          -855,
          190,
          26,
          COSMOS.rose,
          'mono',
          'left',
        ).opacity(sr),
        // Visual bar contrast
        rect(600 * sr, 14, { fill: COSMOS.rose, stroke: null, radius: 4 })
          .at(-855 + 300 * sr, 232)
          .glow(6, COSMOS.rose)
          .opacity(0.88 * sr),
        rect(12, 14, { fill: COSMOS.violet, stroke: null, radius: 3 })
          .at(-849, 256)
          .glow(8, COSMOS.violet)
          .opacity(sr),
      );
    }

    if (s64 > 0.02) {
      nodes.push(
        rule(-855, 288, -210, 288, '#2a385c', 1.8).opacity(s64),
        txt('64 GiB WRITE + READ SAVED', -855, 328, 28, COSMOS.amber, 'mono', 'left')
          .glow(6, COSMOS.amber)
          .opacity(s64),
        txt(
          'Recompute P tile on-chip → discard',
          -855,
          374,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(s64),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, view3d, title, eq, live);
  runPhase(s, c, phase, 10);
  orbitScene(s, c, view3d, { theta: -0.32, phi: 0.96 });

  c.on('backward-state-beat-1', () => s.play(showFormula.to(1, { duration: 0.4 })));
  c.on('backward-state-beat-2', () => s.play(showRatio.to(0.6, { duration: 0.4 })));
  c.on('fa-state-ratio', () => s.play(showRatio.to(1, { duration: 0.45 })));
  c.on('backward-state-beat-3', () =>
    s.play(show64.to(1, { duration: remainDuration(c, 'backward-state-beat-3', 0.5) })),
  );
}
