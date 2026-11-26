// Scene 13: A healthy local cache can still miss after routing (Replica A warm vs Replica B cold; longest-prefix-first vs fairness; HiCache tiers).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function replicaLocality(s, c) {
  const phase = s.value(0);
  // step: 0=Replica A warm (KV 12..15) vs Replica B cold, 1=R42 routed to cold B -> miss,
  // 2=longest-prefix-first delays unrelated cold request, 3=HiCache tiered storage (GPU -> Host -> Storage)
  const step = s.value(0);

  const bgAura = aura(0, 20, 640, '#5ce1e61a', '#ff6b8b16');
  const title = heroTitle(['Healthy Local Cache,', 'Cold Replica Miss'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.fail,
    eyebrow: 'REPLICA LOCALITY · CACHE-AWARE ROUTING · HICACHE',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const nodes = [];

    if (st <= 1) {
      const moved = st >= 1;
      // Replica A (warm)
      nodes.push(
        glassCell(-430, -35, 720, 320, ROLE.radix, { fill: '#0e2234', glow: 9 }),
        txt('REPLICA A · WARM RADIX TREE', -430, -145, 28, ROLE.radix, 'mono'),
        txt('Local KV: [12, 13, 14, 15]', -430, -75, 28, COSMOS.ink, 'mono'),
        txt(
          moved ? 'Warm hit available here' : 'R42 hits warm prefix (4/4)',
          -430,
          15,
          28,
          ROLE.decode,
          'mono',
        ),
      );

      // Replica B (cold)
      nodes.push(
        glassCell(430, -35, 720, 320, moved ? ROLE.fail : COSMOS.dim, {
          fill: moved ? '#2a1120' : '#0b101d',
          glow: moved ? 11 : 3,
        }),
        txt('REPLICA B · COLD RADIX TREE', 430, -145, 28, moved ? ROLE.fail : COSMOS.muted, 'mono'),
        txt('Local KV: [ empty ]', 430, -75, 28, COSMOS.dim, 'mono'),
        txt(
          moved ? 'R42 MISSES -> FULL PREFILL!' : 'Independent local tree',
          430,
          15,
          28,
          moved ? ROLE.fail : COSMOS.muted,
          'mono',
        ),
      );

      // Request badge
      const rx = moved ? 430 : -430;
      nodes.push(
        glassCell(rx, 200, 420, 82, COSMOS.gold, { fill: '#221c10', glow: 10 }),
        txt(
          moved ? 'R42 routed -> Replica B' : 'R42 routed -> Replica A',
          rx,
          200,
          28,
          COSMOS.gold,
          'mono',
        ),
      );
    } else if (st === 2) {
      // Cache-aware longest-prefix-first vs unrelated request starvation
      nodes.push(
        txt(
          'CACHE-AWARE SCHEDULER (LONGEST MATCHED PREFIX FIRST)',
          0,
          -205,
          28,
          COSMOS.gold,
          'mono',
        ),
        txt('Warm prefix', -680, -85, 26, ROLE.radix, 'mono'),
        txt('Cold request', -680, 55, 26, ROLE.fail, 'mono'),
      );
      [0, 1, 2].forEach((k) => {
        const cx = -350 + k * 270;
        nodes.push(
          glassCell(cx, -85, 240, 82, ROLE.radix, { fill: '#0e2436', glow: 8 }),
          txt(`Hot #${k + 1}`, cx, -85, 28, ROLE.radix, 'mono'),
        );
      });
      nodes.push(
        glassCell(485, 55, 340, 82, ROLE.fail, { fill: '#2c1120', glow: 10 }),
        txt('Cold (delayed)', 485, 55, 26, ROLE.fail, 'mono'),
        glassCell(0, 210, 1340, 86, COSMOS.gold, { fill: '#1e1a10', glow: 8 }),
        txt(
          'Saves prefill compute, but unrelated requests can wait behind warm arrivals',
          0,
          210,
          28,
          COSMOS.gold,
          'sans',
        ),
      );
    } else {
      // HiCache tiered memory hierarchy
      const tiers = [
        {
          name: 'Tier 1: GPU HBM KV Cache',
          sub: 'Zero-copy immediate reuse',
          y: -155,
          col: ROLE.radix,
        },
        {
          name: 'Tier 2: Host RAM (HiCache)',
          sub: 'Same radix key · PCIe restore latency',
          y: 10,
          col: ROLE.prefill,
        },
        {
          name: 'Tier 3: Storage Backend',
          sub: 'High capacity · byte movement & readiness cost',
          y: 175,
          col: ROLE.grammar,
        },
      ];
      tiers.forEach((tr, i) => {
        nodes.push(
          glassCell(0, tr.y, 1180, 108, tr.col, { fill: '#0f1b32', glow: 9 }),
          txt(tr.name, 0, tr.y - 20, 30, tr.col, 'mono'),
          txt(tr.sub, 0, tr.y + 26, 26, COSMOS.ink, 'sans'),
        );
        if (i < 2) {
          nodes.push(line([0, tr.y + 56], [0, tr.y + 108], { color: COSMOS.gold, width: 3 }));
        }
      });
    }

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-720 + u * 1440, 295, { radius: 6, color: st === 1 ? ROLE.fail : ROLE.radix }),
      txt(
        st >= 3
          ? 'HiCache saves prefill compute on tiered hits while paying byte-transfer time.'
          : st === 2
            ? 'Cache-aware routing trades prefix locality against queue fairness and load balance.'
            : 'Each replica owns its own radix tree unless a router coordinates placement.',
        0,
        355,
        28,
        COSMOS.ink,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['sg-replica-locality-beat-0', 0],
    ['sg-route-cold', 1, true],
    ['sg-replica-locality-beat-1', 2],
    ['sg-tier', 3, true],
  ]);
}
