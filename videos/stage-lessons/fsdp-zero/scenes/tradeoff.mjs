// Scene 12: Trade memory for communication: ZeRO 0->1->2->3 shrinking bars + overlapped next-unit prefetch schedule.
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  perRank,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function tradeoff(s, c) {
  const showComm = s.value(0);
  const showPrefetch = s.value(0);
  const showMeasure = s.value(0);

  const bgAura = aura(0, 20, 640, '#6ee7b71c', '#5ce1e618');
  const title = heroTitle(['Trade Memory for', 'Communication'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.comm,
    eyebrow: 'SHARDING STAGES & PREFETCH OVERLAP',
  });

  const stages = [0, 1, 2, 3].map((st) => {
    const p = perRank(st, 4);
    return { st, total: p.weights + p.gradients + p.optimizer };
  });

  const live = guardedDynamic(1, () => {
    const sc = showComm.value;
    const sp = showPrefetch.value;
    const sm = showMeasure.value;

    const baseY = 175;
    const unitPx = 40;
    const nodes = [txt('PERSISTENT STATE PER RANK', -460, -210, 28, ROLE.good, 'mono')];

    stages.forEach((item, i) => {
      const bx = -730 + i * 180;
      const h = item.total * unitPx;
      const col = i === 3 ? ROLE.good : i === 2 ? ROLE.grads : i === 1 ? ROLE.opt : ROLE.bad;
      nodes.push(
        rect(128, h, { fill: '#122038', stroke: col, width: 2.6, radius: 8 })
          .at(bx, baseY - h * 0.5)
          .glow(7, col),
        txt(String(item.total), bx, baseY - h - 24, 28, col, 'mono'),
        txt(`Z-${item.st}`, bx, baseY + 38, 26, COSMOS.ink, 'mono'),
      );
    });

    // Right: Compute & Prefetch Communication Overlap Timeline
    nodes.push(
      txt('COMPUTE & COLLECTIVE OVERLAP', 415, -210, 28, ROLE.comm, 'mono'),
      txt('COMPUTE', 20, -85, 26, ROLE.weights, 'mono'),
      txt('COMM', 20, 45, 26, ROLE.comm, 'mono'),

      rect(260, 72, { fill: '#122a4d', stroke: ROLE.weights, width: 2.5, radius: 8 }).at(260, -85),
      txt('Unit 0 Fwd', 260, -85, 26, ROLE.weights, 'mono'),

      rect(260, 72, { fill: '#122a4d', stroke: ROLE.weights, width: 2.5, radius: 8 }).at(560, -85),
      txt('Unit 1 Fwd', 560, -85, 26, ROLE.weights, 'mono'),

      rect(240, 72, {
        fill: '#0e2834',
        stroke: sc > 0.5 ? ROLE.comm : COSMOS.dim,
        width: 2.5,
        radius: 8,
      })
        .at(260, 45)
        .glow(sp > 0.5 ? 10 : 4, ROLE.comm),
      txt(sp > 0.5 ? 'Prefetch U1' : 'All-Gather U0', 260, 45, 26, ROLE.comm, 'mono'),

      rect(240, 72, {
        fill: '#1e1538',
        stroke: sp > 0.5 ? ROLE.grads : COSMOS.dim,
        width: 2.5,
        radius: 8,
      })
        .at(560, 45)
        .glow(sp > 0.5 ? 9 : 0, ROLE.grads),
      txt(sp > 0.5 ? 'Prefetch U2' : 'Reduce-Scat', 560, 45, 26, ROLE.grads, 'mono'),
    );

    nodes.push(
      txt(
        sm > 0.5
          ? 'Measure peak memory, step time & GPU utilization together as wrap size changes'
          : 'Prefetch next unit while current unit computes to hide transfer latency',
        0,
        335,
        28,
        sm > 0.5 ? ROLE.good : COSMOS.gold,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('tradeoff-b1-1', () =>
    s.play(showComm.to(1, { duration: remainDuration(c, 'tradeoff-b1-1', 0.45) })),
  );
  c.on('tradeoff-b2-1', () =>
    s.play(showPrefetch.to(1, { duration: remainDuration(c, 'tradeoff-b2-1', 0.45) })),
  );
  c.on('tradeoff-b3-1', () =>
    s.play(showMeasure.to(1, { duration: remainDuration(c, 'tradeoff-b3-1', 0.45) })),
  );
}
