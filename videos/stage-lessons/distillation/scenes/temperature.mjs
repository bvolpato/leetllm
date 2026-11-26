// Scene 03: Keep the words fixed and turn up the temperature
import {
  COSMOS,
  INITIAL,
  TEACHER,
  WORDS,
  aura,
  buildTempLandscape3d,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  rect,
  remainDuration,
  runPhase,
  stableSoftmax,
  txt,
} from '../parts.mjs';

export default function temperature(s, c) {
  const phase = s.value(0);
  const tempVal = s.value(1);
  const sSame = s.value(0);
  const sLimit = s.value(0);
  const sRule = s.value(0);

  const bgAura = aura(480, 40, 560, '#16355e2a', '#2e1d5214');
  const surf3d = buildTempLandscape3d(phase, tempVal, { x: 500, y: 40 });

  const title = heroTitle(['Turn Up Temperature', 'With Logits Fixed'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'SOFTMAX TEMPERATURE T · EXPOSING DARK KNOWLEDGE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const T = tempVal.value;
    const tProbs = stableSoftmax(TEACHER, T);
    const sProbs = stableSoftmax(INITIAL, T);
    const lim = sLimit.value;
    const sm = sSame.value;
    const baseY = 175;
    const maxH = 260;

    const nodes = [
      // Temperature badge
      glassCell(-660, -196, 360, 74, COSMOS.gold, { fill: '#221b0c', glow: 8 }),
      txt(`T = ${T.toFixed(1)}`, -660, -194, 42, COSMOS.gold, 'mono').glow(6, COSMOS.gold),
      txt(
        lim > 0.45
          ? 'Limit as T -> inf: 1/4 = 0.250 each'
          : sm > 0.3
            ? 'Same T for both · As T -> inf, each prob -> ?'
            : 'Fixed logits z · watch tree rise as T climbs',
        -445,
        -194,
        26,
        lim > 0.45 ? COSMOS.emerald : COSMOS.muted,
        'sans',
        'left',
      ),

      // Teacher bars (left block)
      txt('TEACHER q(T)', -645, -118, 28, COSMOS.blue, 'mono'),
      line([-845, baseY], [-445, baseY], { stroke: COSMOS.rule, width: 2.2 }),
      // 0.25 uniform reference tick on left axis (kept clear of bar labels)
      line([-858, baseY - 0.25 * maxH], [-834, baseY - 0.25 * maxH], {
        stroke: COSMOS.gold,
        width: 3.2,
      }),

      // Student bars (center block)
      txt('STUDENT p(T)', -155, -118, 28, COSMOS.cyan, 'mono'),
      line([-355, baseY], [45, baseY], { stroke: COSMOS.rule, width: 2.2 }),
      line([-368, baseY - 0.25 * maxH], [-344, baseY - 0.25 * maxH], {
        stroke: COSMOS.gold,
        width: 3.2,
      }),
    ];

    WORDS.forEach((word, i) => {
      const tx = -790 + i * 96;
      const sx = -300 + i * 96;
      const th = Math.max(12, tProbs[i] * maxH);
      const sh = Math.max(12, sProbs[i] * maxH);
      const isTree = i === 3;

      nodes.push(
        rect(62, th, {
          fill: isTree ? '#12463b' : '#17386b',
          stroke: isTree ? COSMOS.emerald : COSMOS.blue,
          width: 2.4,
          radius: 6,
        })
          .at(tx, baseY - th * 0.5)
          .glow(isTree ? 7 : 3, isTree ? COSMOS.emerald : COSMOS.blue),
        txt(
          tProbs[i].toFixed(2),
          tx,
          baseY - th - 22,
          26,
          isTree ? COSMOS.emerald : COSMOS.blue,
          'mono',
        ),
        txt(word, tx, baseY + 34, 26, COSMOS.muted, 'mono'),

        rect(62, sh, {
          fill: '#0e3c50',
          stroke: COSMOS.cyan,
          width: 2.4,
          radius: 6,
        })
          .at(sx, baseY - sh * 0.5)
          .glow(3, COSMOS.cyan),
        txt(sProbs[i].toFixed(2), sx, baseY - sh - 22, 26, COSMOS.cyan, 'mono'),
        txt(word, sx, baseY + 34, 26, COSMOS.muted, 'mono'),
      );
    });

    nodes.push(
      txt(
        lim > 0.45
          ? 'Rank order preserved at every finite T > 0 · T^2 scaling follows next'
          : 'Gold axis tick marks the uniform 0.25 floor across 4 tokens',
        -400,
        262,
        26,
        COSMOS.muted,
        'sans',
      ),
      txt('3D SOFTMAX FLATTENING SURFACE', 500, -370, 26, COSMOS.gold, 'mono').glow(5, COSMOS.gold),
      txt('Gold ridge moves toward the 0.25 uniform plane', 500, 408, 26, COSMOS.muted, 'sans'),
    );

    return group(...nodes);
  });

  const eqTemp = glowTex('p_i^{(T)} = \\frac{e^{z_i / T}}{\\sum_j e^{z_j / T}}', {
    x: -400,
    y: 368,
    size: 42,
    color: COSMOS.ink,
    glow: 6,
  });

  s.add(bgAura, surf3d, title, live, eqTemp);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, surf3d, { theta: -0.22, phi: 0.9 });

  c.on('temperature-b1-1', () => s.play(tempVal.to(4, { duration: 1.8 })));
  c.on('temperature-b2-1', () =>
    s.play(sSame.to(1, { duration: remainDuration(c, 'temperature-b2-1', 0.5) })),
  );
  c.on('temperature-b3-1', () => {
    s.play(tempVal.to(16, { duration: remainDuration(c, 'temperature-b3-1', 2.2) }));
    s.play(sLimit.to(1, { duration: 0.2 }));
  });
  c.on('temperature-b3-2', () =>
    s.play(sRule.to(1, { duration: remainDuration(c, 'temperature-b3-2', 0.5) })),
  );
}
