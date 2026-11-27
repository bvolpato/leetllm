// Scene 22: Where did the twelve-unit gap appear? Three-rung reference ladder (500 -> 512 -> GPU slot) + pre-cast overflow telemetry.
import {
  COSMOS,
  OVF_449,
  OVF_465_SAT,
  PROJ_ONEHOT,
  aura,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function referenceLadder(s, c) {
  const showGap = s.value(0.35);
  const showTelemetry = s.value(0);

  const bgAura = aura(0, 20, 620, '#5ce1e61f', '#ffd16618');
  const title = heroTitle(['Where Did the', '12-Unit Gap Start?'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.gold,
    eyebrow: 'THREE-RUNG REFERENCE LADDER · PRE-CAST DIAGNOSTICS',
  });

  const live = guardedDynamic(1, () => {
    const gp = showGap.value;
    const tm = showTelemetry.value;

    const rungY = -110;
    const nodes = [
      // Rung 1: Original FP32 Reference
      glassCell(-605, rungY, 430, 210, COSMOS.blue, { fill: '#101a2e', glow: 8 }),
      txt('RUNG 1 · ORIGINAL REF', -605, rungY - 68, 26, COSMOS.blue, 'mono'),
      txt(`${PROJ_ONEHOT.original.at(-1)}`, -605, rungY - 2, 54, COSMOS.blue, 'mono').glow(
        7,
        COSMOS.blue,
      ),
      txt('Original FP32 inputs (CPU)', -605, rungY + 62, 26, COSMOS.muted, 'sans'),

      // Gap 1 arrow (+12 from operand encoding!)
      glowingArc([-386, rungY], [-218, rungY], 0, {
        color: COSMOS.gold,
        width: 3.8,
        opacity: 0.4 + 0.6 * gp,
      }),
      txt('Δ = +12', -302, rungY - 46, 28, COSMOS.gold, 'mono')
        .glow(6, COSMOS.gold)
        .opacity(0.4 + 0.6 * gp),

      // Rung 2: Reconstructed FP8 Reference
      glassCell(0, rungY, 430, 210, COSMOS.gold, { fill: '#1c1812', glow: 9 }),
      txt('RUNG 2 · RECONSTRUCTED', 0, rungY - 68, 26, COSMOS.gold, 'mono'),
      txt(`${PROJ_ONEHOT.reconstructed.at(-1)}`, 0, rungY - 2, 54, COSMOS.gold, 'mono').glow(
        8,
        COSMOS.gold,
      ),
      txt('Visible BEFORE GPU launch!', 0, rungY + 62, 26, COSMOS.gold, 'sans'),

      // Gap 2 arrow (Kernel delta)
      glowingArc([218, rungY], [386, rungY], 0, { color: COSMOS.cyan, width: 3.4 }),
      txt('kernel Δ', 302, rungY - 46, 26, COSMOS.cyan, 'mono'),

      // Rung 3: Device GPU Kernel Output (open slot until device run)
      glassCell(605, rungY, 430, 210, COSMOS.cyan, { fill: '#0e1b2d', dash: [8, 6], glow: 6 }),
      txt('RUNG 3 · GPU KERNEL OUT', 605, rungY - 68, 26, COSMOS.cyan, 'mono'),
      txt('[ device run ]', 605, rungY - 2, 36, COSMOS.cyan, 'mono'),
      txt('= 512: operand · ≠: kernel', 605, rungY + 62, 26, COSMOS.muted, 'sans'),
    ];

    // Bottom half: Beat 1 pre-cast overflow & zero-flush diagnostics
    const opT = 0.2 + 0.8 * tm;
    const botY = 240;
    nodes.push(
      glassCell(-435, botY, 790, 290, COSMOS.emerald, { fill: '#0e1d26', glow: 8, opacity: opT }),
      txt(
        'CEILING-CODE TRIAGE (KEEP PRE-CAST INPUT)',
        -800,
        botY - 102,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ).opacity(opT),
      txt(
        `449 → rounded ${OVF_449.rounded} → stored 448  (no overflow)`,
        -800,
        botY - 38,
        27,
        COSMOS.emerald,
        'mono',
        'left',
      ).opacity(opT),
      txt(
        `465 → rounded ${OVF_465_SAT.rounded} → stored 448  (OVERFLOW!)`,
        -800,
        botY + 22,
        27,
        COSMOS.rose,
        'mono',
        'left',
      ).opacity(opT),
      txt(
        'Code 448 alone cannot distinguish safe fit from clipping',
        -800,
        botY + 86,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(opT),

      glassCell(435, botY, 790, 290, COSMOS.cyan, { fill: '#0e1829', glow: 8, opacity: opT }),
      txt('DIAGNOSTIC TELEMETRY TO LOG', 70, botY - 102, 26, COSMOS.cyan, 'mono', 'left').opacity(
        opT,
      ),
      txt(
        '1. Nonzero inputs flushed to zero (underflow count)',
        70,
        botY - 38,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(opT),
      txt(
        '2. Group maxima, scale factors & input distribution',
        70,
        botY + 22,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(opT),
      txt(
        '3. Rounding mode (RNE / SR) & launched kernel symbol',
        70,
        botY + 86,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(opT),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('lp-reference-ladder-build-0', () =>
    s.play(showGap.to(1, { duration: remainDuration(c, 'lp-reference-ladder-build-0', 0.45) })),
  );
  c.on('lp-reference-ladder-build-1', () =>
    s.play(
      showTelemetry.to(1, { duration: remainDuration(c, 'lp-reference-ladder-build-1', 0.5) }),
    ),
  );
}
