// Scene 01: How far do the weights stick out? 70B BF16 = 140 GB vs 80 GB card -> 60 GB overhang (strict hold!) -> 16 shards = 8.75 GB.
import {
  COSMOS,
  LEDGER_70_16,
  ROLE,
  aura,
  buildGpuRing3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const ringHeight = s.value(1.0);
  const phase = s.value(0);
  const showReq = s.value(0);
  const revOver = s.value(0);
  const showNext = s.value(0);
  const cut16 = s.value(0);
  const dealt = s.value(0);
  const owned = s.value(0);

  const bgAura = aura(420, 20, 520, '#60a5fa22', '#6ee7b718');
  const { view: ring3d } = buildGpuRing3d(ringHeight, phase, {
    x: 445,
    y: 25,
    unit: 100,
    gpus: 8,
    color: ROLE.weights,
  });

  const title = heroTitle(['How Far Do the', 'Weights Stick Out?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.weights,
    eyebrow: '70B BF16 · 80 GB GPU CAPACITY',
  });

  const live = guardedDynamic(1, () => {
    const rq = showReq.value;
    const ov = revOver.value;
    const nx = showNext.value;
    const ct = cut16.value;
    const dl = dealt.value;
    const ow = owned.value;

    // 80 GB card bar width = 360px (4.5 px / GB); 140 GB = 630px!
    const x0 = -830;
    const capW = 80 * 4.5; // 360
    const fullW = LEDGER_70_16.full.weights * 4.5; // 630
    const shardW = LEDGER_70_16.parts.weights * 4.5; // 39.4

    const nodes = [
      txt('3D MULTI-GPU SHARD RING', 445, -405, 26, ROLE.comm, 'mono').glow(5, ROLE.comm),
      txt(
        dl > 0.5 ? '16 equal shards: 8.75 GB per rank' : 'DDP replicates full 140 GB on every rank',
        445,
        420,
        26,
        dl > 0.5 ? ROLE.good : ROLE.bad,
        'mono',
      ),

      // 80 GB limit marker (ticks above and below bars so line never crosses bar text)
      line([x0 + capW, -188], [x0 + capW, -118], {
        stroke: COSMOS.gold,
        width: 3.0,
        dash: [8, 6],
      }).glow(6, COSMOS.gold),
      line([x0 + capW, 124], [x0 + capW, 195], {
        stroke: COSMOS.gold,
        width: 3.0,
        dash: [8, 6],
      }).glow(6, COSMOS.gold),
      txt('80 GB CARD LIMIT', x0 + capW, -214, 26, COSMOS.gold, 'mono'),

      // Rank 0 bar
      txt('RANK 0', x0, -148, 26, ROLE.weights, 'mono', 'left'),
      rect(capW, 68, { fill: '#0d182b', stroke: COSMOS.muted, width: 1.8, radius: 8 }).at(
        x0 + capW * 0.5,
        -76,
      ),
    ];

    if (dl > 0.5) {
      nodes.push(
        rect(shardW, 68, { fill: '#0f3630', stroke: ROLE.good, width: 2.8, radius: 8 })
          .at(x0 + shardW * 0.5, -76)
          .glow(10, ROLE.good),
        txt(
          ow > 0.5 ? `${LEDGER_70_16.parts.weights} GB (1/16)` : '1 / 16 shard',
          x0 + shardW + 22,
          -76,
          28,
          ROLE.good,
          'mono',
          'left',
        ),
      );
    } else {
      const wNow = rq > 0.5 ? fullW : 350;
      nodes.push(
        rect(wNow, 68, {
          fill: rq > 0.5 ? '#2c1222' : '#122546',
          stroke: rq > 0.5 ? ROLE.bad : ROLE.weights,
          width: 2.6,
          radius: 8,
        })
          .at(x0 + wNow * 0.5, -76)
          .glow(8, rq > 0.5 ? ROLE.bad : ROLE.weights),
        txt('70B × 2 B = 140 GB', x0 + 18, -76, 28, COSMOS.ink, 'mono', 'left'),
      );
      if (ct > 0.5) {
        for (let k = 1; k < 16; k++) {
          const sx = x0 + (k * fullW) / 16;
          nodes.push(
            line([sx, -118], [sx, -108], { stroke: COSMOS.gold, width: 2.0 }).opacity(0.9),
          );
        }
      }
      if (ov > 0.5) {
        nodes.push(
          txt('+60 GB OVERHANG!', x0 + capW + 24, -148, 28, ROLE.bad, 'mono', 'left').glow(
            6,
            ROLE.bad,
          ),
        );
      }
    }

    // Rank 1 bar (shows DDP duplication or sharded neighbor)
    nodes.push(
      txt('RANK 1', x0, 26, 26, COSMOS.muted, 'mono', 'left'),
      rect(capW, 68, { fill: '#0d182b', stroke: COSMOS.muted, width: 1.8, radius: 8 }).at(
        x0 + capW * 0.5,
        84,
      ),
    );
    if (dl > 0.5) {
      nodes.push(
        rect(shardW, 68, { fill: '#0f3630', stroke: ROLE.good, width: 2.8, radius: 8 }).at(
          x0 + shardW * 0.5,
          84,
        ),
        txt('8.75 GB (rank 1)', x0 + shardW + 22, 84, 28, ROLE.good, 'mono', 'left'),
      );
    } else if (nx > 0.5) {
      nodes.push(
        rect(fullW, 68, { fill: '#2c1222', stroke: ROLE.bad, width: 2.4, radius: 8 }).at(
          x0 + fullW * 0.5,
          84,
        ),
        txt('DDP: full 140 GB copy again', x0 + 18, 84, 26, ROLE.bad, 'mono', 'left'),
      );
    }

    // Bottom status / prediction prompt
    const foot =
      ow > 0.5
        ? 'ZeRO shards training state across ranks · next: count grads & optimizer'
        : dl > 0.5
          ? 'Sharded 16 ways: 8.75 GB / rank'
          : ov > 0.5
            ? 'DDP copies all 140 GB onto every rank (+60 GB past 80 GB)'
            : rq > 0.5
              ? 'Predict: how many GB stick out past an 80 GB GPU?'
              : '70B BF16 weights vs an 80 GB card';
    nodes.push(
      txt(foot, -855, 295, 28, ow > 0.5 || dl > 0.5 ? ROLE.good : COSMOS.gold, 'sans', 'left'),
    );

    return group(...nodes);
  });

  s.add(bgAura, ring3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, ring3d, { theta: -0.18, phi: 0.92 });

  c.on('weight-request', () =>
    s.play(showReq.to(1, { duration: remainDuration(c, 'weight-request', 0.45) })),
  );
  c.after('first-copy', () =>
    s.play(revOver.to(1, { duration: remainDuration(c, 'first-copy', 0.4) })),
  );
  c.after('second-copy', () =>
    s.play(showNext.to(1, { duration: remainDuration(c, 'second-copy', 0.45) })),
  );
  c.on('cut-replica', () =>
    s.play(cut16.to(1, { duration: remainDuration(c, 'cut-replica', 0.4) })),
  );
  c.after('deal-weights', () => {
    const dur = remainDuration(c, 'deal-weights', 0.55);
    s.play(dealt.to(1, { duration: dur }));
    s.play(ringHeight.to(0.24, { duration: dur }));
  });
  c.on('owned-weights', () =>
    s.play(owned.to(1, { duration: remainDuration(c, 'owned-weights', 0.4) })),
  );
}
