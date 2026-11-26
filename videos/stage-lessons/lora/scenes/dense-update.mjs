// Scene 04: Keep the base, learn a correction: 3D monolith split W_0 + ΔW -> parallel vectors -> thin factors B·A.
import {
  COSMOS,
  FWD_SCALE2,
  aura,
  box3d,
  cinematic3d,
  glassCell,
  glowDot,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line3d,
  orbitScene,
  points3d,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function denseUpdate(s, c) {
  const phase = s.value(0);
  const hlBase = s.value(0);
  const hlCorr = s.value(0);
  const baseOut = s.value(0);
  const corrOut = s.value(0);
  const sumOut = s.value(0);
  const freezeMode = s.value(0);
  const factorMode = s.value(0);
  const rankMode = s.value(0);

  const bgAura = aura(320, 10, 560, '#5ce1e622', '#ffd16618');
  const title = heroTitle(['Keep the Base,', 'Learn a Correction'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'ADDITIVE WEIGHT DECOMPOSITION',
  });

  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 15.6,
    unit: 94,
    focus: [0, 0, 0.2],
  }).at(330, -15);

  // Frozen W_0 slab + parallel trainable delta slab
  const w0Slab = box3d(-2.7, -1.1, -1.3, 2.2, 2.2, 2.6, '#1a3a74', COSMOS.blue, 0.72);
  const deltaSlab = box3d(0.7, -1.1, -1.3, 1.8, 2.2, 2.6, '#876314', COSMOS.gold, 0.56);
  const thinA = box3d(0.8, -1.0, -1.25, 1.6, 2.0, 0.35, '#a87b16', COSMOS.gold, 0.85);
  const thinB = box3d(0.8, -1.0, 0.9, 1.6, 2.0, 0.35, '#13778c', COSMOS.cyan, 0.85);

  const streams = [
    line3d([-1.6, 0, -2.2], [-1.6, 0, 2.2], {
      color: COSMOS.blue,
      width: 3.4,
      glow: 9,
      blend: 'screen',
      onTop: true,
    }),
    line3d([1.6, 0, -2.2], [1.6, 0, 2.2], {
      color: COSMOS.gold,
      width: 3.4,
      glow: 9,
      blend: 'screen',
      onTop: true,
    }),
    line3d([-1.6, 0, 2.2], [0, 0, 2.75], {
      color: COSMOS.blue,
      width: 3.0,
      glow: 8,
      blend: 'screen',
      onTop: true,
    }),
    line3d([1.6, 0, 2.2], [0, 0, 2.75], {
      color: COSMOS.emerald,
      width: 3.2,
      glow: 9,
      blend: 'screen',
      onTop: true,
    }),
  ];

  const photons = points3d(
    () => {
      const ph = phase.value;
      const u = (ph * 0.5) % 1;
      const v = (ph * 0.5 + 0.5) % 1;
      return [
        [-1.6, 0, -2.2 + u * 4.4],
        [1.6, 0, -2.2 + v * 4.4],
        [0, 0, 2.75],
      ];
    },
    {
      colorAt: (idx) => (idx === 0 ? COSMOS.blue : idx === 1 ? COSMOS.gold : COSMOS.emerald),
      radius: 6.5,
      glow: 12,
      blend: 'screen',
      onTop: true,
    },
  );

  view3d.add(...w0Slab, ...deltaSlab, ...thinA, ...thinB, ...streams, photons);

  const eq = glowTex(String.raw`(W_0 + \Delta W)x = W_0 x + \Delta W x`, {
    x: 330,
    y: 400,
    size: 38,
    color: COSMOS.gold,
  });

  const live = guardedDynamic(1, () => {
    const bo = baseOut.value;
    const co = corrOut.value;
    const so = sumOut.value;
    const fm = freezeMode.value;
    const fac = factorMode.value;
    const rm = rankMode.value;

    const nodes = [
      txt('FROZEN W_0', 140, -395, 26, COSMOS.blue, 'mono').glow(6, COSMOS.blue),
      txt(
        fac > 0.4 ? 'THIN FACTORS B·A' : 'CORRECTION ΔW',
        535,
        -395,
        26,
        COSMOS.gold,
        'mono',
      ).glow(6, COSMOS.gold),

      // Base path readout
      glassCell(-560, -148, 590, 118, hlBase.value > 0.2 || fm > 0.2 ? COSMOS.blue : '#3a4c78', {
        fill: '#101d38',
        glow: 8,
      }),
      txt('PRETRAINED PATH  W_0 x', -825, -180, 26, COSMOS.blue, 'mono', 'left'),
      txt(
        bo > 0.3
          ? `Base vector = [${FWD_SCALE2.base.join(', ')}] (frozen)`
          : 'Original matrix weights',
        -825,
        -124,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ),

      // Correction path readout
      glassCell(-560, 12, 590, 118, hlCorr.value > 0.2 || fac > 0.2 ? COSMOS.gold : '#3a4c78', {
        fill: '#231d11',
        glow: 8,
      }),
      txt(
        fac > 0.4 ? 'TRAINABLE FACTORS  (α/r)B(Ax)' : 'CORRECTION PATH  ΔW x',
        -825,
        -20,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        co > 0.3
          ? `ΔW x = [${FWD_SCALE2.correction.join(', ')}] (trainable)`
          : 'Learns task adjustment',
        -825,
        36,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ),

      // Combined sum readout
      glassCell(-560, 178, 590, 118, so > 0.3 ? COSMOS.emerald : '#3a4c78', {
        fill: so > 0.3 ? '#0e2528' : '#11182c',
        glow: so > 0.3 ? 10 : 3,
      }),
      txt('SUMMED OUTPUT', -825, 146, 26, COSMOS.muted, 'mono', 'left'),
      txt(
        so > 0.3
          ? `[${FWD_SCALE2.base.join(', ')}] + [${FWD_SCALE2.correction.join(', ')}] = [${FWD_SCALE2.output.join(', ')}]`
          : 'Adds both path outputs',
        -825,
        202,
        30,
        so > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'mono',
        'left',
      ).glow(so > 0.3 ? 7 : 0, COSMOS.emerald),
    ];

    if (rm > 0.05) {
      nodes.push(
        glassCell(-560, 355, 590, 96, COSMOS.cyan, { fill: '#102234', glow: 9, opacity: rm }),
        txt('RANK CONSTRAINT: rank(BA) <= r', -560, 355, 28, COSMOS.cyan, 'mono')
          .glow(6, COSMOS.cyan)
          .opacity(rm),
      );
    } else {
      nodes.push(
        glowingArc([-235, -148], [-190, 178], 0, { color: COSMOS.blue, width: 3, opacity: 0.6 }),
        glowDot(-235, 12, { radius: 6, color: COSMOS.gold }),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, view3d, title, eq, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, view3d, { theta: -0.26, phi: 0.96 });

  c.on('dense-update-b1-1', () => s.play(hlBase.to(1, { duration: 0.35 })));
  c.on('dense-update-b1-2', () => s.play(hlCorr.to(1, { duration: 0.35 })));
  c.on('dense-base-output', () => s.play(baseOut.to(1, { duration: 0.4 })));
  c.on('dense-correction-output', () => s.play(corrOut.to(1, { duration: 0.4 })));
  c.on('dense-output-sum', () => s.play(sumOut.to(1, { duration: 0.45 })));
  c.on('dense-update-b2-1', () => s.play(freezeMode.to(1, { duration: 0.4 })));
  c.on('dense-update-b2-2', () => s.play(factorMode.to(1, { duration: 0.45 })));
  c.on('dense-update-b3-1', () =>
    s.play(rankMode.to(1, { duration: remainDuration(c, 'dense-update-b3-1', 0.45) })),
  );
}
