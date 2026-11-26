// Scene 05: Follow the gradient through the cast.
// First FP16 subnormal spacing [0, 2^-24] vs scaled 64-spacing ruler + exact FP32 unscale recovery.
import {
  COSMOS,
  FP16_MIN_SUBNORMAL,
  UNDERFLOW_PLAIN,
  UNDERFLOW_SCALED,
  aura,
  beatRemainDuration,
  fade,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function underflow(s, c) {
  const phase = s.value(0);
  const castZero = s.value(0);
  const showScaledPanel = s.value(0);
  const scaleSlide = s.value(0);
  const showStored = s.value(0);
  const showRecovered = s.value(0);

  const bgAura = aura(40, -20, 660, '#5ce1e620', '#60a5fa14');

  const title = heroTitle(['Rescue a Tiny', 'Gradient'], {
    x: -855,
    y: -445,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.cyan,
    eyebrow: 'FP16 SUBNORMAL SPACING · LOSS SCALING',
  });

  const leftX0 = -800;
  const leftW = 660;
  const rightX0 = 80;
  const rightW = 740;
  const railY = -110;

  const fraction = UNDERFLOW_PLAIN.gradient / FP16_MIN_SUBNORMAL; // 0.25
  const spacings = UNDERFLOW_SCALED.stored / FP16_MIN_SUBNORMAL; // 64

  const rescueEq = glowTex(
    String.raw`2^{-26} \times 256 = 2^{-18} \xrightarrow{\div\,256\;\text{(FP32)}} 2^{-26}`,
    { x: 0, y: 425, size: 38, color: COSMOS.cyan, glow: 7 },
  ).opacity(0);

  const live = guardedDynamic(1, () => {
    const cz = castZero.value;
    const sp = showScaledPanel.value;
    const ss = scaleSlide.value;
    const st = showStored.value;
    const rc = showRecovered.value;

    const gStart = leftX0 + fraction * leftW;
    const gCurX = gStart - cz * fraction * leftW;
    const gCurY = railY - 36 + cz * 36;

    const nodes = [
      // Left subnormal microscope
      txt('UNSCALED: FIRST FP16 SPACING', leftX0 + leftW * 0.5, -245, 26, COSMOS.blue, 'mono'),
      line([leftX0, railY], [leftX0 + leftW, railY], { stroke: COSMOS.blue, width: 4.5 }),
      // Ticks: 0, Halfway (2^-25), 2^-24
      line([leftX0, railY - 22], [leftX0, railY + 22], { stroke: COSMOS.blue, width: 5 }),
      line([leftX0 + leftW * 0.5, railY - 22], [leftX0 + leftW * 0.5, railY + 22], {
        stroke: COSMOS.rose,
        width: 5,
      }).glow(6, COSMOS.rose),
      line([leftX0 + leftW, railY - 22], [leftX0 + leftW, railY + 22], {
        stroke: COSMOS.blue,
        width: 5,
      }),
      txt('0', leftX0, railY + 56, 30, COSMOS.ink, 'mono'),
      txt('2⁻²⁵ (mid)', leftX0 + leftW * 0.5, railY + 56, 26, COSMOS.rose, 'mono'),
      txt('2⁻²⁴', leftX0 + leftW, railY + 56, 30, COSMOS.ink, 'mono'),

      // Yellow gradient marker at 1/4 spacing
      txt('g = 2⁻²⁶', gStart, railY - 92, 32, COSMOS.gold, 'mono').glow(6, COSMOS.gold),
      line([gStart, railY - 62], [gStart, railY - 46], { stroke: COSMOS.gold, width: 3 }),
      glowDot(gCurX, gCurY, {
        radius: 12,
        color: cz > 0.7 ? COSMOS.rose : COSMOS.gold,
        glow: 14,
      }),
    ];

    if (cz > 0.05) {
      nodes.push(
        glowingTrail(
          [
            [gStart, railY - 36],
            [gCurX, gCurY],
          ],
          { color: COSMOS.rose, width: 3.5, glow: 8, opacity: cz },
        ),
      );
    }

    // Right scaled ruler (Beat 1+)
    if (sp > 0.02) {
      nodes.push(
        txt(
          'SCALED ×256: 64 SUBNORMAL SPACINGS',
          rightX0 + rightW * 0.5,
          -245,
          26,
          COSMOS.cyan,
          'mono',
        ).opacity(sp),
        line([rightX0, railY], [rightX0 + rightW, railY], { stroke: '#355070', width: 4 }).opacity(
          sp,
        ),
      );
      for (let i = 0; i <= spacings; i++) {
        const tx = rightX0 + (i / spacings) * rightW;
        const major = i % 16 === 0;
        nodes.push(
          line([tx, railY - (major ? 20 : 8)], [tx, railY + (major ? 20 : 8)], {
            stroke: COSMOS.cyan,
            width: major ? 3.5 : 1.5,
          }).opacity((major ? 0.95 : 0.45) * sp),
        );
        if (major) {
          nodes.push(txt(String(i), tx, railY + 56, 26, COSMOS.muted, 'mono').opacity(sp));
        }
      }
      const curSp = fraction + (spacings - fraction) * ss;
      const sx = rightX0 + (curSp / spacings) * rightW;
      nodes.push(
        glowingTrail(
          [
            [rightX0 + (fraction / spacings) * rightW, railY - 36],
            [sx, railY - 36],
          ],
          { color: COSMOS.gold, width: 4.5, glow: 10, opacity: sp },
        ),
        glowDot(sx, railY - 36, { radius: 11, color: COSMOS.gold, glow: 14, opacity: sp }),
        txt(
          ss > 0.95 ? '64 ticks = 2⁻¹⁸' : 'g × 256',
          Math.min(sx, rightX0 + rightW - 115),
          railY - 86,
          30,
          COSMOS.gold,
          'mono',
        )
          .glow(6, COSMOS.gold)
          .opacity(sp),
      );
    }

    // Lower floating precision ledger (4 aligned columns, zero boxed cards)
    const cols = [-710, -240, 250, 680];
    const headY = 105;
    const row1Y = 205;
    const row2Y = 305;
    nodes.push(
      txt('LOSS SCALE', cols[0], headY, 26, COSMOS.muted, 'mono'),
      txt('BEFORE CAST', cols[1], headY, 26, COSMOS.muted, 'mono'),
      txt('FP16 STORED', cols[2], headY, 26, COSMOS.muted, 'mono'),
      txt('FP32 UNSCALE', cols[3], headY, 26, COSMOS.muted, 'mono'),
      line([-830, headY + 38], [830, headY + 38], { stroke: '#26304a', width: 2 }),

      // Row 1: unscaled
      txt('1', cols[0], row1Y, 36, COSMOS.blue, 'mono'),
      txt('2⁻²⁶', cols[1], row1Y, 36, COSMOS.gold, 'mono'),
      txt(
        cz > 0.5 ? '0 (underflow)' : '?',
        cols[2],
        row1Y,
        34,
        cz > 0.5 ? COSMOS.rose : COSMOS.dim,
        'mono',
      ),
      txt(cz > 0.5 ? '0' : '...', cols[3], row1Y, 34, COSMOS.dim, 'mono'),
    );

    if (sp > 0.02) {
      nodes.push(
        txt('256', cols[0], row2Y, 36, COSMOS.cyan, 'mono').opacity(sp),
        txt(ss > 0.9 ? '2⁻¹⁸' : '2⁻²⁶ × 256', cols[1], row2Y, 36, COSMOS.gold, 'mono').opacity(sp),
        txt(
          st > 0.5 ? `exact ${UNDERFLOW_SCALED.stored.toExponential(2)}` : '?',
          cols[2],
          row2Y,
          32,
          st > 0.5 ? COSMOS.emerald : COSMOS.dim,
          'mono',
        )
          .glow(st > 0.5 ? 6 : 0, COSMOS.emerald)
          .opacity(sp),
        txt(
          rc > 0.5 ? '2⁻²⁶ (exact!)' : '÷ 256 = ?',
          cols[3],
          row2Y,
          34,
          rc > 0.5 ? COSMOS.cyan : COSMOS.dim,
          'mono',
        )
          .glow(rc > 0.5 ? 8 : 0, COSMOS.cyan)
          .opacity(sp),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live, rescueEq);
  runPhase(s, c, phase, 14);

  c.after('underflow-zero-result', () =>
    s.play(
      castZero.to(1, { duration: remainDuration(c, 'underflow-zero-result', 0.45, 0.35, true) }),
    ),
  );
  c.onBeat(1, () => s.play(showScaledPanel.to(1, { duration: beatRemainDuration(c, 1, 0.5) })));
  c.on('underflow-storage-operation', () => s.play(scaleSlide.to(1, { duration: 1.0 })));
  c.after('underflow-stored-result', () =>
    s.play(
      showStored.to(1, { duration: remainDuration(c, 'underflow-stored-result', 0.4, 0.35, true) }),
    ),
  );
  c.after('underflow-recovered-result', () => {
    const dur = remainDuration(c, 'underflow-recovered-result', 0.45, 0.35, true);
    s.play(showRecovered.to(1, { duration: dur }));
    s.play(fade(rescueEq, 1, { duration: dur }));
  });
}
