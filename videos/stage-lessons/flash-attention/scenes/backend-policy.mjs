// Scene 28: Separate eligibility, completed dispatch and measured benefit: Glowing decision flow diagram.
import {
  COSMOS,
  aura,
  circle,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  rule,
  runPhase,
  txt,
} from '../parts.mjs';

export default function backendPolicy(s, c) {
  const phase = s.value(0);
  const s1 = s.value(0.5);
  const s2 = s.value(0);
  const sErr = s.value(0);
  const s3 = s.value(0);
  const s4 = s.value(0);

  const bgAura = aura(0, 20, 560, '#5ce1e620', '#a78bfa16');
  const title = heroTitle(['Eligibility,', 'Dispatch & Timing'], {
    x: -855,
    y: -410,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'PRODUCTION BACKEND SELECTION',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const a1 = s1.value;
    const a2 = Math.max(0.45, s2.value);
    const ae = Math.max(0.4, sErr.value);
    const a3 = Math.max(0.45, s3.value);
    const a4 = Math.max(0.45, s4.value);
    const u = (p * 0.48) % 1;

    const yMain = -85;
    const x1 = -580;
    const x2 = 0;
    const x3 = 580;
    const yErr = 155;

    const nodes = [
      // Main glowing conduits between 3 circular pipeline nodes (zero boxed bullet cards!)
      glowingArc([x1 + 66, yMain], [x2 - 66, yMain], 0, {
        color: COSMOS.cyan,
        width: 4.2,
        opacity: 0.9 * a1,
      }),
      glowingArc([x2 + 66, yMain], [x3 - 66, yMain], 0, {
        color: COSMOS.gold,
        width: 4.2,
        opacity: 0.9 * a2,
      }),
      glowDot(x1 + 66 + u * (x2 - x1 - 132), yMain, {
        radius: 6.5,
        color: COSMOS.cyan,
        opacity: a1,
      }),
      glowDot(x2 + 66 + u * (x3 - x2 - 132), yMain, {
        radius: 6.5,
        color: COSMOS.gold,
        opacity: a2,
      }),

      // Downward crimson fork from Stage 2 for runtime OOM / device error propagation
      glowingArc([x2, yMain + 66], [x2, yErr - 54], 0, {
        color: COSMOS.rose,
        width: 4.0,
        opacity: 0.9 * ae,
      }),
      glowDot(x2, yMain + 66 + u * (yErr - yMain - 120), {
        radius: 6,
        color: COSMOS.rose,
        opacity: ae,
      }),

      // Stage 1 glowing node
      circle(62, { fill: '#0e1b2d', stroke: COSMOS.cyan, width: 3.2 })
        .at(x1, yMain)
        .glow(10, COSMOS.cyan)
        .opacity(a1),
      txt('1', x1, yMain, 44, COSMOS.cyan, 'mono').glow(6, COSMOS.cyan).opacity(a1),
      txt('PROBE ELIGIBILITY', x1, yMain - 102, 26, COSMOS.cyan, 'mono').opacity(a1),
      txt('Device, dtype, mask, GQA', x1, yMain + 102, 26, COSMOS.ink, 'sans').opacity(a1),
      txt('Fail → permitted fallback', x1, yMain + 144, 26, COSMOS.amber, 'mono').opacity(a1),

      // Stage 2 glowing node
      circle(62, { fill: '#1c1812', stroke: COSMOS.gold, width: 3.2 })
        .at(x2, yMain)
        .glow(a2 > 0.5 ? 12 : 5, COSMOS.gold)
        .opacity(a2),
      txt('2', x2, yMain, 44, COSMOS.gold, 'mono').glow(6, COSMOS.gold).opacity(a2),
      txt('RESTRICTED DISPATCH', x2, yMain - 102, 26, COSMOS.gold, 'mono').opacity(a2),

      // Stage 3 glowing node
      circle(62, { fill: '#0d2224', stroke: COSMOS.emerald, width: 3.2 })
        .at(x3, yMain)
        .glow(a3 > 0.5 ? 12 : 5, COSMOS.emerald)
        .opacity(a3),
      txt('3', x3, yMain, 44, COSMOS.emerald, 'mono').glow(6, COSMOS.emerald).opacity(a3),
      txt('GPU EVIDENCE', x3, yMain - 102, 26, COSMOS.emerald, 'mono').opacity(a3),
      txt('Warm up + sync + trace', x3, yMain + 102, 26, COSMOS.ink, 'sans').opacity(a3),
      txt('Latency + peak memory', x3, yMain + 144, 26, COSMOS.cyan, 'mono').opacity(a3),

      // Crimson OOM propagation beacon
      circle(44, { fill: '#22101c', stroke: COSMOS.rose, width: 3.0 })
        .at(x2, yErr)
        .glow(sErr.value > 0.5 ? 12 : 4, COSMOS.rose)
        .opacity(ae),
      txt('!', x2, yErr, 38, COSMOS.rose, 'mono').glow(6, COSMOS.rose).opacity(ae),
      txt('OOM / DEVICE ERROR → PROPAGATE', x2, yErr + 82, 26, COSMOS.rose, 'mono')
        .glow(sErr.value > 0.5 ? 6 : 0, COSMOS.rose)
        .opacity(ae),
      txt(
        'Silent math fallback hides bugs & uses MORE memory',
        x2,
        yErr + 124,
        26,
        COSMOS.amber,
        'sans',
      ).opacity(ae),

      // Clean floating stack selection footer separated by hairline rule
      rule(-855, 326, 855, 326, '#2a385c', 2.0).opacity(a4),
      txt(
        'STACK:   Transformers attn_implementation   ·   PyTorch SDPBackend   ·   FA4 CuTe pkg',
        0,
        368,
        26,
        COSMOS.violet,
        'mono',
      )
        .glow(s4.value > 0.5 ? 6 : 0, COSMOS.violet)
        .opacity(a4),
      txt(
        'Confirm which kernel actually ran in a GPU profiler trace',
        0,
        414,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a4),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 12);

  c.on('backend-policy-beat-1', () => s.play(s1.to(1, { duration: 0.4 })));
  c.on('backend-policy-beat-2', () => s.play(s2.to(1, { duration: 0.4 })));
  c.on('fa-execution-error', () => s.play(sErr.to(1, { duration: 0.45 })));
  c.on('backend-policy-beat-3', () => s.play(s3.to(1, { duration: 0.45 })));
  c.on('backend-policy-beat-4', () =>
    s.play(s4.to(1, { duration: remainDuration(c, 'backend-policy-beat-4', 0.45) })),
  );
}
