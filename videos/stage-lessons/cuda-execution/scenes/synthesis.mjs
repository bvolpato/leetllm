// Scene 19: Can fewer bytes raise the upper bound? Glowing Roofline curve (40 GB/s slope, 100 GFLOP/s ceiling) with prediction withholding.
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  markDecoration,
  remainDuration,
  roofline,
  rule,
  txt,
} from '../parts.mjs';

export default function synthesis(s, c) {
  const bytesVal = s.value(4000);
  const showPoint = s.value(0);
  const showTrail1 = s.value(0);
  const showTrail2 = s.value(0);

  const bgAura = aura(-120, 40, 560, '#5ce1e622', '#ffd16618');

  const title = heroTitle(['Arithmetic Intensity', 'and the Roofline Bound'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'ROOFLINE MODEL · 40 GB/s BANDWIDTH · 100 GFLOP/s COMPUTE',
  });

  const eqRoof = glowTex('P \\le \\min(100,\\; 40 \\cdot I)', {
    x: 545,
    y: 350,
    size: 46,
    color: COSMOS.gold,
  });

  const live = guardedDynamic(1, () => {
    const b = Math.max(250, bytesVal.value);
    const rf = roofline(1000 / b);
    const ptShown = showPoint.value;
    const t1 = showTrail1.value;
    const t2 = showTrail2.value;

    // Plot rectangle on left/center
    const px0 = -740;
    const px1 = 220;
    const py0 = 290; // y = 0
    const py1 = -160; // y = 120
    const sx = (iVal) => px0 + (iVal / 4.5) * (px1 - px0);
    const sy = (gflop) => py0 - (gflop / 120) * (py0 - py1);

    const nodes = [
      // Axes
      rule(px0, py0, px1, py0, COSMOS.muted, 3),
      rule(px0, py0, px0, py1, COSMOS.muted, 3),
      txt(
        'Arithmetic intensity I (FLOP / byte)',
        (px0 + px1) * 0.5,
        py0 + 78,
        28,
        COSMOS.muted,
        'sans',
      ),
      txt('Upper bound (GFLOP/s)', px0 - 15, py1 - 36, 26, COSMOS.muted, 'mono', 'left'),
    ];

    // Grid & ticks (mark background grid lines as decoration per P5)
    for (const xTick of [0, 1, 2, 3, 4]) {
      const tx = sx(xTick);
      nodes.push(
        markDecoration(rule(tx, py0, tx, py1, '#1b2640', 1.5)),
        txt(String(xTick), tx, py0 + 34, 26, COSMOS.muted, 'mono'),
      );
    }
    for (const yTick of [0, 40, 80, 100, 120]) {
      const ty = sy(yTick);
      const isCeil = yTick === 100;
      nodes.push(
        markDecoration(rule(px0, ty, px1, ty, isCeil ? '#40341a' : '#1b2640', isCeil ? 2 : 1.5)),
        txt(
          String(yTick),
          px0 - 20,
          ty + 4,
          26,
          isCeil ? COSMOS.gold : COSMOS.muted,
          'mono',
          'right',
        ),
      );
    }

    // Glowing Roofline curve: slope 40*I up to ridge I=2.5 (100 GFLOP/s), then flat
    const roofPts = Array.from({ length: 91 }, (_, k) => {
      const iv = (k / 90) * 4.5;
      return [sx(iv), sy(Math.min(100, 40 * iv))];
    });
    nodes.push(
      glowingTrail(roofPts, {
        gradientColors: [COSMOS.cyan, COSMOS.cyan, COSMOS.gold],
        width: 5,
        glow: 10,
      }),
      // Ridge point vertical marker
      markDecoration(rule(sx(2.5), sy(100), sx(2.5), py0, COSMOS.gold, 2).opacity(0.45)),
      txt('ridge I = 2.5', sx(2.5) + 18, sy(50), 26, COSMOS.gold, 'mono', 'left'),
      txt('memory-bound slope', sx(0.18), sy(86), 26, COSMOS.cyan, 'sans', 'left'),
      txt('compute ceiling (100)', sx(3.45), sy(112), 26, COSMOS.gold, 'mono'),
    );

    // Ghost markers for prior positions
    if (t1 > 0.5) {
      nodes.push(
        glowDot(sx(0.25), sy(10), { radius: 8, color: COSMOS.muted, glow: 4, opacity: 0.7 }),
      );
    }
    if (t2 > 0.5) {
      nodes.push(
        glowDot(sx(1.0), sy(40), { radius: 8, color: COSMOS.muted, glow: 4, opacity: 0.7 }),
      );
    }

    // Active glowing kernel point
    if (ptShown > 0.05) {
      const atCeil = rf.intensity >= 2.5;
      const pCol = atCeil ? COSMOS.emerald : COSMOS.gold;
      nodes.push(
        glowDot(sx(rf.intensity), sy(rf.bound), {
          radius: 13,
          color: pCol,
          glow: 16,
          opacity: ptShown,
        }),
      );
    }

    // Right-hand live ledger
    const regime = rf.intensity >= 2.5 ? 'COMPUTE-BOUND' : 'MEMORY-BOUND';
    const regCol = rf.intensity >= 2.5 ? COSMOS.emerald : COSMOS.cyan;
    nodes.push(
      glassCell(545, 35, 560, 445, regCol, { fill: '#0e1729', glow: 8 }),
      txt('KERNEL LEDGER', 545, -148, 26, COSMOS.muted, 'mono'),
      txt('1,000 FLOPs (fixed)', 305, -80, 32, COSMOS.ink, 'mono', 'left'),
      txt(
        `${Math.round(rf.bytes).toLocaleString('en')} bytes moved`,
        305,
        -10,
        34,
        COSMOS.blue,
        'mono',
        'left',
      ),
      txt(
        ptShown > 0.5 ? `I = ${rf.intensity.toFixed(2)} FLOP/B` : 'I = ?',
        305,
        68,
        36,
        COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        ptShown > 0.5 ? `Bound = ${rf.bound.toFixed(1)} GFLOP/s` : 'Bound = ?',
        305,
        142,
        38,
        regCol,
        'mono',
        'left',
      ).glow(7, regCol),
      txt(ptShown > 0.5 ? regime : 'computing...', 545, 215, 28, regCol, 'mono'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live, eqRoof);

  c.on('build-intensity', () => s.play(showPoint.to(1, { duration: 0.65 })));
  c.on('reuse-bytes', () => {
    s.play(showTrail1.to(1, { duration: 0.1 }));
    s.play(bytesVal.to(1000, { duration: 1.25 }));
  });
  c.on('reach-compute', () => {
    s.play(showTrail2.to(1, { duration: 0.1 }));
    s.play(bytesVal.to(250, { duration: remainDuration(c, 'reach-compute', 1.4) }));
  });
}
