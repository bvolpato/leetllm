// Scene 12: Handle an empty causal row and a finite-input overflow separately: 2 visual mechanism rails.
import {
  COSMOS,
  FINITE_OVF,
  aura,
  glowDot,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  rule,
  txt,
} from '../parts.mjs';

export default function emptyAndOverflow(s, c) {
  const showInit = s.value(0.5);
  const showEmpty = s.value(0);
  const showZero = s.value(0);
  const showOvf = s.value(0);
  const showReject = s.value(0);

  const bgAura = aura(0, 40, 560, '#a78bfa20', '#ff6b8b16');
  const title = heroTitle(['Edge Cases:', 'Empty & Overflow'], {
    x: -855,
    y: -410,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.rose,
    eyebrow: 'NUMERICAL SAFETY GUARDS',
  });

  const eqInit = glowTex(
    String.raw`m_0 = -\infty,\quad \ell_0 = 0,\quad \mathbf{N}_0 = \mathbf{0}`,
    {
      x: 330,
      y: -355,
      size: 36,
      color: COSMOS.cyan,
    },
  );

  const live = guardedDynamic(1, () => {
    const init = showInit.value;
    const emp = showEmpty.value;
    const zro = showZero.value;
    const ovf = showOvf.value;
    const rej = showReject.value;

    const nodes = [
      // TOP MECHANISM: All-masked 6-slot row -> temp ref 0 -> 0 / 1 = 0
      txt('1. ALL-MASKED ROW (m = −∞)', -855, -210, 26, COSMOS.cyan, 'mono', 'left').opacity(
        Math.max(0.5, init),
      ),
      ...Array.from({ length: 6 }, (_, i) => {
        const sx = -785 + i * 116;
        return group(
          rect(98, 66, { fill: '#12182b', stroke: COSMOS.dim, width: 2, dash: [6, 5], radius: 8 })
            .at(sx, -135)
            .opacity(Math.max(0.55, init)),
          txt('−∞', sx, -135, 28, COSMOS.dim, 'mono').opacity(Math.max(0.55, init)),
        );
      }),
      glowingArc([-140, -135], [140, -135], 0, {
        color: COSMOS.cyan,
        width: 3.6,
        opacity: Math.max(0.45, emp),
      }),
      txt('temp ref = 0', 0, -178, 26, COSMOS.muted, 'mono').opacity(Math.max(0.45, init)),
      txt('avoids (−∞) − (−∞) = NaN', -855, -62, 26, COSMOS.muted, 'sans', 'left').opacity(
        Math.max(0.5, init),
      ),
      // Result node on right
      txt(
        zro > 0.5 ? 'Output = 0 / 1 = 0' : 'Empty row: no softmax distribution',
        180,
        -150,
        zro > 0.5 ? 42 : 28,
        zro > 0.5 ? COSMOS.emerald : COSMOS.cyan,
        'mono',
        'left',
      )
        .glow(zro > 0.5 ? 8 : 4, zro > 0.5 ? COSMOS.emerald : COSMOS.cyan)
        .opacity(Math.max(0.45, emp)),
      txt(
        zro > 0.5 ? 'Empty row gradient = 0' : 'Matches FlashAttention package',
        180,
        -92,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(Math.max(0.35, zro)),

      rule(-855, 28, 855, 28, '#263457', 2.0),

      // BOTTOM MECHANISM: FP64 number line showing mean 1e308 fits while sum 1e308 + 1e308 crosses FP64 MAX!
      txt(
        '2. FINITE-INPUT ACCUMULATOR OVERFLOW',
        -855,
        84,
        26,
        COSMOS.rose,
        'mono',
        'left',
      ).opacity(Math.max(0.5, ovf)),
      line([-855, 225], [820, 225], { stroke: '#465885', width: 3.0 }).opacity(Math.max(0.55, ovf)),
      // FP64 MAX wall at x = 260 (representing ~1.8e308)
      line([260, 145], [260, 295], { stroke: COSMOS.rose, width: 3.2, dash: [8, 6] })
        .glow(8, COSMOS.rose)
        .opacity(Math.max(0.55, ovf)),
      txt('FP64 MAX ≈ 1.8×10³⁰⁸', 260, 118, 26, COSMOS.rose, 'mono').opacity(Math.max(0.55, ovf)),
      // Value bar 1: Mean = 1e308 (safely inside FP64!)
      rect(640, 28, { fill: COSMOS.emerald, stroke: null, radius: 6 })
        .at(-535, 195)
        .glow(7, COSMOS.emerald)
        .opacity(0.88 * Math.max(0.45, ovf)),
      txt(
        `Mean = ${FINITE_OVF.normalized.toExponential(0)} (fits)`,
        -855,
        152,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ).opacity(Math.max(0.45, ovf)),
    ];

    // Unnormalized sum bar shooting past FP64 MAX to Infinity!
    if (rej > 0.02) {
      const barLen = 640 + 820 * rej;
      nodes.push(
        rect(barLen, 28, { fill: COSMOS.rose, stroke: null, radius: 6 })
          .at(-855 + barLen * 0.5, 255)
          .glow(10, COSMOS.rose)
          .opacity(0.92 * rej),
        glowDot(-855 + barLen, 255, { radius: 9, color: COSMOS.rose, opacity: rej }),
        txt(
          `v₁ + v₂ = ${FINITE_OVF.numerator} (OVERFLOW)`,
          300,
          315,
          32,
          COSMOS.rose,
          'mono',
          'left',
        )
          .glow(8, COSMOS.rose)
          .opacity(rej),
        txt(
          `accepted = ${FINITE_OVF.accepted} → raise error (rejects bad shapes & bool block size)`,
          -855,
          385,
          26,
          COSMOS.amber,
          'mono',
          'left',
        ).opacity(rej),
      );
    } else {
      nodes.push(
        txt(
          'Two equally weighted values of 10³⁰⁸',
          -855,
          315,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(Math.max(0.45, ovf)),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, eqInit, live);

  c.on('empty-and-overflow-beat-1', () => s.play(showInit.to(1, { duration: 0.4 })));
  c.on('empty-and-overflow-beat-2', () => s.play(showEmpty.to(1, { duration: 0.45 })));
  c.on('fa-empty-zero', () => s.play(showZero.to(1, { duration: 0.45 })));
  c.on('empty-and-overflow-beat-3', () => s.play(showOvf.to(1, { duration: 0.45 })));
  c.on('fa-overflow', () =>
    s.play(showReject.to(1, { duration: remainDuration(c, 'fa-overflow', 0.45) })),
  );
}
