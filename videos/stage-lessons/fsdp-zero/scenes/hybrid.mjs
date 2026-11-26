// Scene 15: Which ranks share one copy? 4 nodes x 8 GPUs (70B): 32-way = 35 GB vs HSDP 8-way (strict hold!) -> 140 GB > 80 GB!
import {
  COSMOS,
  LEDGER_70_32,
  LEDGER_70_8,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function hybrid(s, c) {
  const phase = s.value(0);
  const isHybrid = s.value(0); // 1 = local groups of 8 (hold prediction!)
  const revMem = s.value(0); // 1 = reveal 140 GB > 80 GB

  const bgAura = aura(0, 20, 640, '#60a5fa1c', '#ff6b8b18');
  const title = heroTitle(['Which Ranks Share', 'One Copy?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.warn,
    eyebrow: 'HYBRID SHARDING (HSDP) · 4 NODES × 8 GPUS',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const hy = isHybrid.value > 0.5;
    const rm = revMem.value > 0.5;
    const nodes = [];

    // 4 Node boxes across top
    for (let n = 0; n < 4; n++) {
      const nx = -600 + n * 400;
      nodes.push(
        glassCell(nx, -100, 360, 188, hy ? COSMOS.gold : ROLE.comm, {
          fill: '#0e192d',
          glow: hy ? 8 : 5,
        }),
        txt(`NODE ${n} (8 GPUs)`, nx, -158, 26, hy ? COSMOS.gold : ROLE.comm, 'mono'),
        txt(
          hy ? 'Shards 0..7 (local)' : `Shards ${n * 8}..${n * 8 + 7}`,
          nx,
          -104,
          28,
          COSMOS.ink,
          'mono',
        ),
        txt(
          hy ? 'Rank 0 holds Shard 0' : 'Unique across cluster',
          nx,
          -52,
          26,
          hy ? ROLE.warn : ROLE.good,
          'mono',
        ),
      );
    }

    // Bottom 80 GB capacity scale comparison
    const x0 = -720;
    const capX = x0 + 80 * 7; // 80 GB -> 560px
    nodes.push(
      line([capX, 45], [capX, 74], { stroke: COSMOS.gold, width: 3.0, dash: [8, 6] }).glow(
        6,
        COSMOS.gold,
      ),
      line([capX, 144], [capX, 174], { stroke: COSMOS.gold, width: 3.0, dash: [8, 6] }).glow(
        6,
        COSMOS.gold,
      ),
      line([capX, 244], [capX, 274], { stroke: COSMOS.gold, width: 3.0, dash: [8, 6] }).glow(
        6,
        COSMOS.gold,
      ),
      txt('80 GB CARD', capX, 24, 26, COSMOS.gold, 'mono'),

      // Row 1: 32-way full shard (35 GB)
      txt('32-WAY', x0 - 95, 108, 26, ROLE.good, 'mono'),
      rect(LEDGER_70_32.total * 7, 56, {
        fill: '#0d2b24',
        stroke: ROLE.good,
        width: 2.6,
        radius: 8,
      }).at(x0 + LEDGER_70_32.total * 3.5, 108),
      txt(
        `${LEDGER_70_32.total} GB / GPU (fits, cross-node gather)`,
        capX + 24,
        108,
        26,
        ROLE.good,
        'mono',
        'left',
      ),

      // Row 2: HSDP 8-way (withhold 140 GB until local-memory cue!)
      txt('HSDP 8', x0 - 95, 208, 26, rm ? ROLE.bad : COSMOS.gold, 'mono'),
    );

    if (rm) {
      const w140 = LEDGER_70_8.total * 7; // 980px
      nodes.push(
        rect(w140, 56, { fill: '#30101e', stroke: ROLE.bad, width: 2.8, radius: 8 })
          .at(x0 + w140 * 0.5, 208)
          .glow(10, ROLE.bad),
        txt(
          `1,120 / 8 = ${LEDGER_70_8.total} GB / GPU → EXCEEDS 80 GB CARD!`,
          x0 + 24,
          208,
          28,
          COSMOS.ink,
          'mono',
          'left',
        ),
      );
    } else if (hy) {
      nodes.push(
        txt(
          'Predict: does 8 or 32 divide 1,120 GB per rank?',
          capX + 24,
          208,
          28,
          COSMOS.gold,
          'serif',
          'left',
        ).glow(6, COSMOS.gold),
      );
    } else {
      nodes.push(
        txt(
          'waiting for node-local hybrid sharding...',
          capX + 24,
          208,
          26,
          COSMOS.dim,
          'mono',
          'left',
        ),
      );
    }

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-740 + u * 1480, 310, { radius: 6, color: rm ? ROLE.bad : COSMOS.gold }),
      txt(
        'Divide bytes by the shard-group size (8), not total world size (32)',
        0,
        368,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('local-groups', () =>
    s.play(isHybrid.to(1, { duration: remainDuration(c, 'local-groups', 0.45) })),
  );
  c.on('local-memory', () =>
    s.play(revMem.to(1, { duration: remainDuration(c, 'local-memory', 0.5) })),
  );
}
