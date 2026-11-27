// Scene 06: Shard gradients as well (ZeRO-2): gradients 2 -> 0.5 -> total 3.5 units + reduce-scatter + param all-gather.
import {
  COSMOS,
  ROLE,
  ZERO_1,
  ZERO_2,
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

export default function zero2(s, c) {
  const shardG = s.value(0); // 0 -> 1 shrinks grads 2 -> 0.5
  const showRS = s.value(0);
  const showOwned = s.value(0);
  const showAG = s.value(0);

  const bgAura = aura(0, 20, 640, '#a78bfa1e', '#5ce1e618');
  const title = heroTitle(['ZeRO Stage 2:', 'Shard Gradients Too'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.grads,
    eyebrow: 'REDUCE-SCATTER GRADIENTS · 5 → 3.5 UNITS',
  });

  const live = guardedDynamic(1, () => {
    const sg = shardG.value;
    const rs = showRS.value;
    const ow = showOwned.value;
    const ag = showAG.value;

    const unitPx = 44;
    const baseY = 175;
    const rankXs = [-620, -340, -60, 220];
    const gNow = ZERO_1.gradients + (ZERO_2.gradients - ZERO_1.gradients) * sg;
    const totalNow = ZERO_2.weights + gNow + ZERO_2.optimizer;

    const nodes = [
      txt('WEIGHTS FULL · GRADS & OPTIMIZER SHARDED (1/4)', -200, -210, 28, ROLE.grads, 'mono'),
    ];

    rankXs.forEach((rx, r) => {
      nodes.push(txt(`Rank ${r}`, rx, baseY + 42, 28, COSMOS.ink, 'mono'));
      let curBottom = baseY;
      const hW = ZERO_2.weights * unitPx;
      nodes.push(
        rect(212, hW - 6, { fill: '#132a4f', stroke: ROLE.weights, width: 2.4, radius: 8 }).at(
          rx,
          curBottom - hW * 0.5,
        ),
        txt('W: 2 (full)', rx, curBottom - hW * 0.5, 26, ROLE.weights, 'mono'),
      );
      curBottom -= hW;

      const hG = Math.max(40, gNow * unitPx);
      nodes.push(
        rect(212, hG - 4, { fill: '#231742', stroke: ROLE.grads, width: 2.8, radius: 8 })
          .at(rx, curBottom - hG * 0.5)
          .glow(8, ROLE.grads),
        txt(
          sg > 0.7 ? `G${r}: 0.5` : `G: ${gNow.toFixed(1)}`,
          rx,
          curBottom - hG * 0.5,
          26,
          ROLE.grads,
          'mono',
        ),
      );
      curBottom -= hG;

      const hO = Math.max(44, ZERO_2.optimizer * unitPx);
      nodes.push(
        rect(212, hO - 4, { fill: '#2b2210', stroke: ROLE.opt, width: 2.4, radius: 8 }).at(
          rx,
          curBottom - hO * 0.5,
        ),
        txt(`O${r}: 1`, rx, curBottom - hO * 0.5, 26, ROLE.opt, 'mono'),
      );
    });

    // Right collective contract readout
    nodes.push(
      glassCell(600, -105, 480, 148, ROLE.good, { fill: '#0d2624', glow: 9 }),
      txt('PER RANK TOTAL', 600, -148, 26, COSMOS.muted, 'mono'),
      txt(`${totalNow.toFixed(1)} units`, 600, -90, 48, ROLE.good, 'mono').glow(7, ROLE.good),

      glassCell(610, 92, 520, 188, ag > 0.5 ? ROLE.comm : rs > 0.5 ? ROLE.grads : COSMOS.dim, {
        fill: '#0e1b30',
        glow: rs > 0.5 ? 9 : 3,
      }),
      txt('COLLECTIVE SCHEDULE', 610, 26, 26, COSMOS.muted, 'mono'),
      txt(
        rs > 0.5 ? '1. Reduce-Scatter → own G' : 'All-reduce vs Reduce-scatter',
        610,
        82,
        26,
        ow > 0.5 ? ROLE.grads : COSMOS.ink,
        'mono',
      ),
      txt(
        ag > 0.5 ? '2. All-Gather → new W' : 'Local optimizer updates shard',
        610,
        136,
        26,
        ag > 0.5 ? ROLE.comm : COSMOS.muted,
        'mono',
      ),
    );

    nodes.push(
      txt(
        'Reduce-scatter sums contributions and leaves each rank only its owned gradient shard',
        0,
        355,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('zero2-b1-1', () =>
    s.play(shardG.to(0.5, { duration: remainDuration(c, 'zero2-b1-1', 0.45) })),
  );
  c.on('zero2-b2-1', () =>
    s.play(shardG.to(1, { duration: remainDuration(c, 'zero2-b2-1', 0.5) })),
  );
  c.on('zero2-b3-1', () =>
    s.play(showRS.to(1, { duration: remainDuration(c, 'zero2-b3-1', 0.4) })),
  );
  c.on('zero2-b3-2', () =>
    s.play(showOwned.to(1, { duration: remainDuration(c, 'zero2-b3-2', 0.4) })),
  );
  c.on('zero2-parameter-sync', () =>
    s.play(showAG.to(1, { duration: remainDuration(c, 'zero2-parameter-sync', 0.45) })),
  );
}
