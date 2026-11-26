// Scene 10: What lives through the optimizer step? FSDP2 1B unit on 4 ranks: 1GB FP32 shard + 2GB BF16 gather + 4GB FP32 grad -> free -> 1GB reduced -> zero_grad.
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function dtypeLifecycle(s, c) {
  const phase = s.value(0);
  const bf16Copy = s.value(0); // 2 GB temp compute copy
  const gradGb = s.value(0); // 0 -> 4 GB local -> 1 GB reduced -> 0 cleared
  const updated = s.value(0);

  const bgAura = aura(0, 20, 640, '#60a5fa1c', '#a78bfa18');
  const title = heroTitle(['What Lives Through', 'the Optimizer Step?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.opt,
    eyebrow: 'FSDP2 DTYPE LIFETIME · 1B UNIT ON 4 RANKS',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const bf = bf16Copy.value;
    const gr = gradGb.value;
    const up = updated.value;

    const pxPerGb = 110;
    const baseY = 175;
    const cols = [
      {
        label: 'FP32 W shard',
        gb: 1,
        col: up > 0.5 ? ROLE.good : ROLE.weights,
        x: -640,
        note: up > 0.5 ? 'UPDATED!' : 'master = shard',
      },
      { label: 'FP32 m + v', gb: 2, col: ROLE.opt, x: -240, note: 'persistent' },
      {
        label: 'BF16 gather',
        gb: 2 * bf,
        col: ROLE.comm,
        x: 160,
        note: bf > 0.5 ? '2 GB temp' : 'freed',
      },
      {
        label: 'FP32 grad',
        gb: gr,
        col: ROLE.grads,
        x: 560,
        note: gr > 0.4 ? 'live FP32' : 'cleared (None)',
      },
    ];

    const nodes = [
      txt('RANK 0 ALLOCATION SNAPSHOT (16 B / PARAM BUDGET)', 0, -250, 28, COSMOS.gold, 'mono'),
    ];

    cols.forEach((cItem) => {
      const h = Math.max(18, cItem.gb * pxPerGb);
      nodes.push(
        txt(cItem.label, cItem.x, baseY + 42, 26, cItem.col, 'mono'),
        txt(cItem.note, cItem.x, baseY + 84, 26, COSMOS.muted, 'sans'),
      );
      if (cItem.gb > 0.08) {
        nodes.push(
          rect(240, h, { fill: '#122038', stroke: cItem.col, width: 2.8, radius: 10 })
            .at(cItem.x, baseY - h * 0.5)
            .glow(8, cItem.col),
          txt(`${cItem.gb.toFixed(1)} GB`, cItem.x, baseY - h - 26, 28, cItem.col, 'mono'),
        );
      } else {
        nodes.push(
          rect(240, 36, {
            fill: '#0b101d',
            stroke: COSMOS.dim,
            width: 1.8,
            radius: 8,
            dash: [8, 6],
          }).at(cItem.x, baseY - 18),
          txt('0 GB', cItem.x, baseY - 62, 26, COSMOS.dim, 'mono'),
        );
      }
    });

    const total = 1 + 2 + 2 * bf + gr;
    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-760 + u * 1520, 315, { radius: 6, color: up > 0.5 ? ROLE.good : ROLE.comm }),
      txt(
        `Live unit tensors on Rank 0: ${total.toFixed(1)} GB  ·  zero_grad(set_to_none=True) frees gradient shard`,
        0,
        372,
        28,
        up > 0.5 ? ROLE.good : COSMOS.gold,
        'mono',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('full-weights', () =>
    s.play(bf16Copy.to(1, { duration: remainDuration(c, 'full-weights', 0.45) })),
  );
  c.on('full-gradient', () =>
    s.play(gradGb.to(4, { duration: remainDuration(c, 'full-gradient', 0.5) })),
  );
  c.on('free-weights', () =>
    s.play(bf16Copy.to(0, { duration: remainDuration(c, 'free-weights', 0.45) })),
  );
  c.on('reduce-gradient', () =>
    s.play(gradGb.to(1, { duration: remainDuration(c, 'reduce-gradient', 0.5) })),
  );
  c.on('update-shard', () =>
    s.play(updated.to(1, { duration: remainDuration(c, 'update-shard', 0.45) })),
  );
  c.on('clear-gradient', () =>
    s.play(gradGb.to(0, { duration: remainDuration(c, 'clear-gradient', 0.45) })),
  );
}
