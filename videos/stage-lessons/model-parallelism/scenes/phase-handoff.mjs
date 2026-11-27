// Scene 27: Account for both queues and the transferred history (Prefill-Decode Disaggregation). 8 KV blocks move from Prefill Worker to Decode Worker while both queues and lifecycle stay visible.
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function phaseHandoff(s, c) {
  const p0 = s.value(0);
  const pPhases = s.value(0);
  const p1 = s.value(0);
  const pMove = s.value(0);
  const pQueues = s.value(0);
  const p2 = s.value(0);
  const pTrace = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1c', '#5ce1e61c');
  const title = heroTitle(['Account for Both Queues', 'and Transferred History'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.gpu1,
    eyebrow: 'PREFILL-DECODE DISAGGREGATION · KV HANDOFF',
  });

  const live = guardedDynamic(1, () => {
    const mv = pMove.value;
    const moving = mv > 0.02 && mv < 0.98;
    const qHi = pQueues.value > 0.4;
    const tr = pTrace.value > 0.4 || p2.value > 0.4;
    const ph = pPhases.value > 0.4;

    const nodes = [
      txt(
        tr
          ? 'ADMIT -> TRANSFER KV -> RELEASE SOURCE -> FIRST DECODE STEP'
          : 'REQUEST R1 · COMPATIBLE PREFILL & DECODE WORKER POOLS',
        0,
        -215,
        26,
        tr ? COSMOS.gold : COSMOS.ink,
        'mono',
      ),

      // Prefill worker pool (left)
      glassCell(-495, -10, 620, 310, ROLE.gpu0, { fill: '#10213d', glow: 8 }),
      txt('PREFILL WORKER', -495, -130, 30, ROLE.gpu0, 'mono'),
      txt('Long prompt compute', -495, -92, 26, COSMOS.muted, 'sans'),

      // Decode worker pool (right)
      glassCell(495, -10, 620, 310, ROLE.gpu1, { fill: '#0e2b38', glow: 8 }),
      txt('DECODE WORKER', 495, -130, 30, ROLE.gpu1, 'mono'),
      txt('Interactive token stream', 495, -92, 26, COSMOS.muted, 'sans'),

      // Glowing RDMA / NVLink transfer bridge (positioned cleanly above moving KV blocks)
      glowingArc([-180, -92], [180, -92], -18, {
        color: moving || p1.value > 0.4 ? COSMOS.gold : ROLE.gpu1,
        width: moving ? 4.2 : 2.6,
        opacity: moving ? 0.96 : 0.45,
      }),
      txt(
        moving ? 'KV Transfer' : 'KV Link',
        0,
        -136,
        26,
        moving ? COSMOS.gold : COSMOS.muted,
        'mono',
      ),
    ];

    // 8 KV blocks moving from prefill (-495) to decode (+495)
    for (let i = 0; i < 8; i++) {
      const colIdx = i % 4;
      const rowIdx = Math.floor(i / 4);
      const bx = -690 + colIdx * 130 + mv * 990;
      const by = -32 + rowIdx * 84;
      const col = moving ? COSMOS.gold : mv >= 0.98 ? ROLE.gpu1 : ROLE.gpu0;
      const fill = moving ? '#2a210e' : mv >= 0.98 ? '#0f3644' : '#122c52';
      nodes.push(
        rect(112, 66, { fill, stroke: col, width: 2.4, radius: 8 }).at(bx, by).glow(7, col),
        txt(`KV${i}`, bx, by, 26, col, 'mono'),
      );
    }

    if (tr) {
      nodes.push(
        glassCell(495, 114, 480, 44, ROLE.good, { fill: '#0d2924', glow: 9 }),
        txt('Next token generated!', 495, 114, 26, ROLE.good, 'mono'),
      );
    }

    // Both queues explicitly visible below (clear of worker bottom at +145!)
    nodes.push(
      glassCell(-495, 225, 620, 74, qHi ? ROLE.warn : COSMOS.dim, {
        fill: qHi ? '#291a0d' : '#0d1528',
        glow: qHi ? 9 : 3,
      }),
      txt('Prefill queue: R2, R3', -495, 225, 28, qHi ? ROLE.warn : COSMOS.muted, 'mono'),

      glassCell(495, 225, 620, 74, qHi ? ROLE.warn : COSMOS.dim, {
        fill: qHi ? '#291a0d' : '#0d1528',
        glow: qHi ? 9 : 3,
      }),
      txt('Decode queue: R0, then R1', 495, 225, 28, qHi ? ROLE.warn : COSMOS.muted, 'mono'),

      txt(
        tr
          ? 'Compare both queue delays + exposed handoff against decode stall saved under bursts'
          : 'Mismatched layouts also require cache rearrangement during the handoff',
        0,
        345,
        28,
        COSMOS.ink,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('mp-phase-handoff-0', () =>
    s.play(p0.to(1, { duration: remainDuration(c, 'mp-phase-handoff-0', 0.35) })),
  );
  c.on('mp-phase-handoff-phases', () =>
    s.play(pPhases.to(1, { duration: remainDuration(c, 'mp-phase-handoff-phases', 0.4) })),
  );
  c.on('mp-phase-handoff-1', () =>
    s.play(p1.to(1, { duration: remainDuration(c, 'mp-phase-handoff-1', 0.35) })),
  );
  c.on('mp-phase-handoff-move', () =>
    s.play(pMove.to(1, { duration: remainDuration(c, 'mp-phase-handoff-move', 1.1) })),
  );
  c.on('mp-phase-handoff-queues', () =>
    s.play(pQueues.to(1, { duration: remainDuration(c, 'mp-phase-handoff-queues', 0.45) })),
  );
  c.on('mp-phase-handoff-2', () =>
    s.play(p2.to(1, { duration: remainDuration(c, 'mp-phase-handoff-2', 0.35) })),
  );
  c.on('mp-phase-handoff-trace', () =>
    s.play(pTrace.to(1, { duration: remainDuration(c, 'mp-phase-handoff-trace', 0.45) })),
  );
}
