// Scene 10: Which schedule finishes first? Alpha-Beta crossover: 1 KB (Tree 8.05 vs Ring 12.03), 200 KB (Tie 18 vs 18), 1 MB (Hold! -> Ring 42 vs Tree 58!).
import {
  COST_1K_RING,
  COST_1K_TREE,
  COST_1M_RING,
  COST_1M_TREE,
  COST_200K_RING,
  COST_200K_TREE,
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function cost(s, c) {
  // step: 0=starts, 1=1KB small, 2=1KB tree wins, 3=200KB size, 4=200KB fill, 5=200KB tie 18us, 6=1MB size, 7=1MB predict (hold!), 8=ring 42, 9=tree 58, 10=result 42 vs 58, 11=rule
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#ffd1661c', '#6ee7b718');
  const title = heroTitle(['Which Schedule', 'Finishes First?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.r2,
    eyebrow: 'ALPHA-BETA CROSSOVER · RING VS TREE',
  });

  const formula = glowTex('T \\approx R\\cdot\\alpha + \\frac{V}{B}', {
    x: 420,
    y: -380,
    size: 40,
    color: COSMOS.gold,
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);

    const is1M = st >= 6;
    const is200K = st >= 3 && !is1M;
    const ringC = is1M ? COST_1M_RING : is200K ? COST_200K_RING : COST_1K_RING;
    const treeC = is1M ? COST_1M_TREE : is200K ? COST_200K_TREE : COST_1K_TREE;

    const showRingPayload = (!is1M && st >= 1) || st >= 8;
    const showTreePayload = (!is1M && st >= 1) || st >= 9;
    const showTotal = (st >= 2 && !is200K && !is1M) || (is200K && st >= 5) || st >= 10;

    // 1 us = 16.5 px -> 60 us = 990 px (x0 = -480 .. +510)
    const x0 = -480;
    const px = 16.5;
    const rStartW = ringC.startup * px;
    const tStartW = treeC.startup * px;
    const rPayW = showRingPayload ? Math.max(8, ringC.payload * px) : 0;
    const tPayW = showTreePayload ? Math.max(8, treeC.payload * px) : 0;

    const sizeLabel = is1M
      ? 'PAYLOAD = 1 MB / rank (1.5 MB moved)'
      : is200K
        ? 'PAYLOAD = 200 KB / rank (300 KB moved)'
        : 'PAYLOAD = 1 KB / rank (1.5 KB moved)';

    const nodes = [
      txt(sizeLabel, 0, -215, 30, COSMOS.gold, 'mono'),

      // Ring bar
      txt('RING (50 GB/s)', -845, -80, 26, ROLE.r0, 'mono', 'left'),
      rect(rStartW, 74, { fill: '#1a2342', stroke: ROLE.r0, width: 2.6, radius: 8 }).at(
        x0 + rStartW * 0.5,
        -80,
      ),
      txt('12 us', x0 + rStartW * 0.5, -80, 26, ROLE.r0, 'mono'),

      // Tree bar
      txt('TREE (30 GB/s)', -845, 55, 26, ROLE.good, 'mono', 'left'),
      rect(tStartW, 74, { fill: '#122c28', stroke: ROLE.good, width: 2.6, radius: 8 }).at(
        x0 + tStartW * 0.5,
        55,
      ),
      txt('8 us', x0 + tStartW * 0.5, 55, 26, ROLE.good, 'mono'),
    ];

    if (rPayW > 0) {
      nodes.push(
        rect(rPayW, 74, { fill: '#0e2838', stroke: ROLE.comm, width: 2.8, radius: 8 })
          .at(x0 + rStartW + rPayW * 0.5, -80)
          .glow(8, ROLE.comm),
      );
      if (rPayW > 90) {
        nodes.push(
          txt(
            `+${ringC.payload.toFixed(0)} us`,
            x0 + rStartW + rPayW * 0.5,
            -80,
            26,
            COSMOS.ink,
            'mono',
          ),
        );
      }
    }
    if (tPayW > 0) {
      nodes.push(
        rect(tPayW, 74, { fill: '#2a1d10', stroke: COSMOS.gold, width: 2.8, radius: 8 })
          .at(x0 + tStartW + tPayW * 0.5, 55)
          .glow(8, COSMOS.gold),
      );
      if (tPayW > 90) {
        nodes.push(
          txt(
            `+${treeC.payload.toFixed(0)} us`,
            x0 + tStartW + tPayW * 0.5,
            55,
            26,
            COSMOS.ink,
            'mono',
          ),
        );
      }
    }

    // Totals on right
    nodes.push(
      txt(
        showTotal ? `${ringC.total.toFixed(is1M || is200K ? 0 : 1)} us` : is1M ? '?' : '...',
        555,
        -80,
        34,
        st >= 10 ? ROLE.good : ROLE.r0,
        'mono',
        'left',
      ),
      txt(
        showTotal ? `${treeC.total.toFixed(is1M || is200K ? 0 : 1)} us` : is1M ? '?' : '...',
        555,
        55,
        34,
        st >= 10 ? ROLE.bad : ROLE.good,
        'mono',
        'left',
      ),
    );

    const verdict =
      st >= 10
        ? '1 MB: Ring wins (42 us vs 58 us)! Leave NCCL auto-selection on & measure on real GPUs'
        : st >= 7
          ? 'Predict at 1 MB: does Ring (12 us start, 50 GB/s) or Tree (8 us start, 30 GB/s) win?'
          : st === 6
            ? '1 MB payload (1.5 MB moved)'
            : st === 5
              ? '200 KB tie: 18 us each!'
              : st >= 3
                ? '200 KB: adding payload transfer'
                : st === 2
                  ? '1 KB: Tree wins!'
                  : '6 ring starts (12 us) vs 4 tree starts (8 us)';

    nodes.push(txt(verdict, 0, 320, 28, st >= 10 ? ROLE.good : COSMOS.gold, 'sans'));
    return group(...nodes);
  });

  s.add(bgAura, title, formula, live);
  wireStepCues(s, c, step, [
    ['cost-starts', 0],
    ['cost-small', 1],
    ['cost-first', 2, true],
    ['cost-mid-size', 3, true],
    ['cost-mid-fill', 4],
    ['cost-tie', 5, true],
    ['cost-big-size', 6, true],
    ['cost-guess', 7],
    ['cost-large', 8],
    ['cost-tree', 9],
    ['cost-result', 10, true],
    ['cost-rule', 11],
  ]);
}
