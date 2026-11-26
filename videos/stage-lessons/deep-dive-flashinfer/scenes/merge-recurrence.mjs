// Scene 08: What must a worker return? Exact base-2 LSE recurrence: shift m=2 -> weights [1, 0.5] -> shares [2/3, 1/3] -> parent 2.585.
import {
  COSMOS,
  MERGE_CORRECT,
  ROLE,
  aura,
  glassCell,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainAfter,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function mergeRecurrence(s, c) {
  const phase = s.value(0);
  const origVis = s.value(0);
  const shiftVis = s.value(0);
  const shareVis = s.value(0);
  const parentVis = s.value(0);

  const bgAura = aura(0, 20, 660, '#5ce1e61e', '#6ee7b71a');

  const title = heroTitle(['What Must a', 'Worker Return?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.r2,
    eyebrow: 'COMPOSABLE ATTENTION STATE · (o, b)',
    subtitle: 'Normalized output vector o + base-2 log-sum-exp b = log2(sum exp s)',
  });

  const eqShift = glowTex('m = \\max(2, 1) = 2,\\quad w_A = 2^{0}=1,\\; w_B = 2^{-1}=0.5', {
    x: 255,
    y: -155,
    size: 36,
    color: COSMOS.gold,
    glow: 6,
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const ov = origVis.value;
    const sv = shiftVis.value;
    const shv = shareVis.value;
    const pv = parentVis.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);

    const nodes = [
      // Worker A record on left
      glassCell(-625, -70, 450, 144, ROLE.r0, { fill: '#10213d', glow: 8 * Math.max(0.5, ov) }),
      txt('WORKER A STATE', -625, -112, 26, ROLE.r0, 'mono'),
      txt('o_A = [1, 0]', -625, -66, 30, COSMOS.ink, 'mono'),
      txt('mass 4 -> b_A = 2', -625, -22, 26, COSMOS.gold, 'mono'),

      // Worker B record below Worker A
      glassCell(-625, 130, 450, 144, ROLE.r1, { fill: '#22133d', glow: 8 * Math.max(0.5, ov) }),
      txt('WORKER B STATE', -625, 88, 26, ROLE.r1, 'mono'),
      txt('o_B = [0, 1]', -625, 134, 30, COSMOS.ink, 'mono'),
      txt('mass 2 -> b_B = 1', -625, 178, 26, COSMOS.gold, 'mono'),

      // Converging glowing arcs strictly outside box borders
      glowingArc([-392, -70], [-154, 10], -20, {
        color: ROLE.r0,
        width: 3.6,
        opacity: 0.88,
      }),
      glowingArc([-392, 130], [-154, 50], 20, {
        color: ROLE.r1,
        width: 3.6,
        opacity: 0.88,
      }),
    ];

    // Center merge engine box: shift & relative weights
    nodes.push(
      glassCell(115, 30, 520, 224, sv > 0.5 ? COSMOS.gold : COSMOS.dim, {
        fill: '#131d36',
        glow: sv > 0.5 ? 10 * pulse : 3,
      }),
      txt('SHIFT & NORMALIZE', 115, -48, 26, COSMOS.gold, 'mono'),
      txt(
        sv > 0.5 ? 'w_A = 1.0 · w_B = 0.5' : 'shift m = max(b_A, b_B)',
        115,
        4,
        28,
        sv > 0.5 ? COSMOS.ink : COSMOS.muted,
        'mono',
      ),
      txt(
        sv > 0.5 ? 'total z = 1.0 + 0.5 = 1.5' : 'weights: 2^(b - m)',
        115,
        54,
        28,
        sv > 0.5 ? ROLE.r2 : COSMOS.muted,
        'mono',
      ),
      txt(
        shv > 0.5 ? 'shares: 2/3 and 1/3' : 'Pending relative shares...',
        115,
        104,
        26,
        shv > 0.5 ? ROLE.good : COSMOS.dim,
        'mono',
      ),
    );

    // Right: Parent attention state output
    if (shv > 0.05) {
      const parentB = MERGE_CORRECT.b.toFixed(3);
      nodes.push(
        glowingArc([382, 30], [452, 30], 0, {
          color: ROLE.good,
          width: 3.8,
          opacity: 0.9 * shv,
        }),
        glassCell(662, 30, 404, 240, pv > 0.5 ? ROLE.good : ROLE.r2, {
          fill: pv > 0.5 ? '#0e2b25' : '#102438',
          glow: pv > 0.5 ? 12 * pulse : 7,
          opacity: shv,
        }),
        txt('PARENT STATE', 662, -56, 26, ROLE.good, 'mono').opacity(shv),
        txt('o = [2/3, 1/3]', 662, -4, 34, COSMOS.ink, 'mono').opacity(shv),
        txt(
          pv > 0.5 ? `b = 2 + log2(1.5)` : 'Store parent b...',
          662,
          56,
          26,
          pv > 0.5 ? COSMOS.gold : COSMOS.muted,
          'mono',
        ).opacity(shv),
        txt(pv > 0.5 ? `b ≈ ${parentB} (mass 6)` : '', 662, 104, 28, ROLE.good, 'mono')
          .glow(6, ROLE.good)
          .opacity(pv),
      );
    }

    // Bottom takeaway
    nodes.push(
      glassCell(0, 335, 1620, 108, pv > 0.5 ? ROLE.good : ROLE.r2, { fill: '#0e172a', glow: 7 }),
      txt(
        pv > 0.5
          ? 'Parent (o, b ≈ 2.585) represents all 6 units of mass so later workers can merge again'
          : 'Each worker discards raw scores and returns only normalized o plus scalar log2 mass b',
        0,
        335,
        28,
        pv > 0.5 ? ROLE.good : COSMOS.ink,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, eqShift, live);
  runPhase(s, c, phase, 14);

  c.on('recurrence-original', () =>
    s.play(origVis.to(1, { duration: remainDuration(c, 'recurrence-original', 0.4) })),
  );
  c.on('recurrence-shift', () =>
    s.play(shiftVis.to(1, { duration: remainDuration(c, 'recurrence-shift', 0.45) })),
  );
  c.after('recurrence-shares', () =>
    s.play(shareVis.to(1, { duration: remainAfter(c, 'recurrence-shares', 0.45) })),
  );
  c.after('recurrence-parent', () =>
    s.play(parentVis.to(1, { duration: remainAfter(c, 'recurrence-parent', 0.45) })),
  );
}
