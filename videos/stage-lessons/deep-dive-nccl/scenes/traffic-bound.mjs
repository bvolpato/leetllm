// Scene 08: How many bytes leave one GPU? 4 floats (16 B): 3 RS + 3 AG = 6 sends * 4 B = 24 B sent & 24 B recv -> 2(k-1)/k * M = 1.5 M.
import {
  COSMOS,
  RING_4_TRAFFIC,
  ROLE,
  aura,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function trafficBound(s, c) {
  // step: 0..4=concrete 16B->24B sent/recv, 5..8=general 2(k-1)/k M formula, 9..11=bandwidth bound + switch reduction + FP order
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#ffd1661c', '#5ce1e618');
  const title = heroTitle(['How Many Bytes', 'Leave One GPU?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.r2,
    eyebrow: 'RING TRAFFIC BOUND · 2(k-1)/k · M',
  });

  const formula = glowTex('V_{\\text{send}} = 2\\,\\frac{k - 1}{k}\\,M = 1.5\\,M \\; (k=4)', {
    x: 370,
    y: -380,
    size: 38,
    color: COSMOS.gold,
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;

    const nodes = [
      // Top row: Reduce-Scatter 3 sends + All-Gather 3 sends
      glassCell(-430, -105, 760, 198, st >= 1 ? ROLE.r0 : COSMOS.dim, {
        fill: '#0f1d36',
        glow: st >= 1 ? 8 : 2,
      }),
      txt('REDUCE-SCATTER PHASE', -430, -162, 28, ROLE.r0, 'mono'),
      txt('3 hops × 4 B chunk = 12 B sent', -430, -100, 30, COSMOS.ink, 'mono'),
      txt('(k - 1) × (M / k) bytes', -430, -44, 26, COSMOS.muted, 'mono'),

      glassCell(430, -105, 760, 198, st >= 2 ? ROLE.good : COSMOS.dim, {
        fill: st >= 2 ? '#0d2624' : '#0a0f1c',
        glow: st >= 2 ? 8 : 2,
      }),
      txt('ALL-GATHER PHASE', 430, -162, 28, st >= 2 ? ROLE.good : COSMOS.dim, 'mono'),
      txt(
        '3 hops × 4 B chunk = 12 B sent',
        430,
        -100,
        30,
        st >= 2 ? COSMOS.ink : COSMOS.dim,
        'mono',
      ),
      txt('(k - 1) × (M / k) bytes', 430, -44, 26, COSMOS.muted, 'mono'),

      // Bottom row: Total sent/recv + bandwidth-bound & FP caveat
      glassCell(-430, 142, 760, 184, st >= 3 ? COSMOS.gold : COSMOS.dim, {
        fill: st >= 3 ? '#261e0e' : '#0a0f1c',
        glow: st >= 3 ? 10 : 2,
      }),
      txt('TOTAL ON RANK 2 (M = 16 B)', -430, 90, 26, COSMOS.muted, 'mono'),
      txt(
        `SENT: ${RING_4_TRAFFIC.sent} B   ·   RECV: ${RING_4_TRAFFIC.received} B`,
        -430,
        146,
        32,
        st >= 3 ? COSMOS.gold : COSMOS.dim,
        'mono',
      ),
      txt('Factor = 2 × 3 / 4 = 1.50× input (always < 2M)', -430, 198, 26, COSMOS.ink, 'mono'),

      glassCell(430, 142, 760, 184, st >= 9 ? ROLE.comm : COSMOS.dim, {
        fill: st >= 9 ? '#0e222e' : '#0a0f1c',
        glow: st >= 9 ? 9 : 2,
      }),
      txt('MODEL BOUNDARIES', 430, 90, 26, st >= 9 ? ROLE.comm : COSMOS.dim, 'mono'),
      txt(
        'In-network NVSwitch reduction moves fewer bytes',
        430,
        146,
        26,
        st >= 9 ? COSMOS.ink : COSMOS.dim,
        'sans',
      ),
      txt(
        'FP addition order can shift lowest mantissa bits',
        430,
        198,
        26,
        st >= 11 ? ROLE.warn : COSMOS.muted,
        'sans',
      ),
    ];

    nodes.push(
      txt(
        'Ring is bandwidth-optimal for point-to-point links, but 2(k-1) hops grow linearly with rank count',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, formula, live);
  wireStepCues(s, c, step, [
    ['nc-traffic-bound-b0-s0', 0],
    ['nc-traffic-bound-b0-s1', 1],
    ['nc-traffic-bound-b0-s2', 2],
    ['nc-traffic-bound-b0-s3', 3],
    ['nc-traffic-bound-b0-s4', 4],
    ['nc-traffic-bound-b1-s0', 5],
    ['nc-traffic-bound-b1-s1', 6],
    ['nc-traffic-bound-b1-s2', 7],
    ['nc-traffic-bound-b1-s3', 8],
    ['nc-traffic-bound-b2-s0', 9],
    ['nc-traffic-bound-b2-s1', 10],
    ['nc-traffic-bound-b2-s2', 11],
  ]);
}
