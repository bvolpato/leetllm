// Scene 18: The state denominator is the actual sharding group (6 replicated + 12/D shardable -> D=2: 12B, D=4: 9B, D=8: 7.5B; unequal token mean 2.5 vs rank mean 5.0).
import {
  COSMOS,
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

export default function optimizer(s, c) {
  // step: 0=6+12 ledger, 1=D=2 (12B), 2=D=4 (9B), 3=D=8 (7.5B), 4=unequal token support, 5=rank mean 5 vs token mean 2.5
  const step = s.value(0);

  const bgAura = aura(0, 15, 640, '#34d3991c', '#60a5fa18');
  const title = heroTitle(['The Actual Sharding', 'Denominator'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.dp,
    eyebrow: 'DISTRIBUTED OPTIMIZER LEDGER · OBJECTIVE WEIGHTING',
  });

  const formulaTex = glowTex(String.raw`\text{bytes/param} = 6 + \frac{12}{D}`, {
    x: 465,
    y: -365,
    size: 42,
    color: COSMOS.gold,
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [];

    if (st < 4) {
      const rows = [
        { d: 1, opt: 12.0, tot: 18.0, label: 'Unsharded (D=1)', active: st === 0 },
        { d: 2, opt: 6.0, tot: 12.0, label: 'Sharding D = 2', active: st === 1 },
        { d: 4, opt: 3.0, tot: 9.0, label: 'Sharding D = 4', active: st === 2 },
        { d: 8, opt: 1.5, tot: 7.5, label: 'DP=4 x CP=2 -> D=8', active: st === 3 },
      ];
      const scale = 56; // 18 bytes -> 1008px
      nodes.push(
        txt(
          'BLUE: 6B REPLICATED (BF16 W + FP32 GRAD)   |   GREEN: 12/D OPTIMIZER (MASTER + ADAM)',
          0,
          -242,
          26,
          COSMOS.muted,
          'mono',
        ),
      );
      rows.forEach((r, idx) => {
        const y = -150 + idx * 112;
        const repW = 6 * scale;
        const optW = r.opt * scale;
        const startX = -380;
        nodes.push(
          txt(r.label, -810, y, 26, r.active ? COSMOS.gold : COSMOS.ink, 'mono', 'left'),
          glassCell(startX + repW / 2, y, repW, 74, ROLE.tp, {
            fill: '#11213a',
            glow: r.active ? 8 : 3,
          }),
          txt('6 B', startX + repW / 2, y, 26, COSMOS.ink, 'mono'),
          glassCell(startX + repW + optW / 2 + 8, y, Math.max(76, optW), 74, ROLE.dp, {
            fill: '#0e2524',
            glow: r.active ? 10 : 4,
          }),
          txt(`${r.opt} B`, startX + repW + optW / 2 + 8, y, 26, ROLE.dp, 'mono'),
          txt(
            `= ${r.tot} B/param`,
            startX + repW + Math.max(76, optW) + 32,
            y,
            28,
            r.active ? COSMOS.gold : COSMOS.ink,
            'mono',
            'left',
          ),
        );
      });
    } else {
      // Beat 2: Unequal token support (Replica A: 1 token grad 10; Replica B: 3 tokens grad 0,0,0)
      nodes.push(
        glassCell(-430, -110, 740, 165, ROLE.tp, { fill: '#101f38', glow: 8 }),
        txt('REPLICA A (1 VALID TOKEN)', -430, -150, 26, ROLE.tp, 'mono'),
        txt('grad = [10]   ->   local mean = 10.0', -430, -82, 28, COSMOS.ink, 'mono'),

        glassCell(430, -110, 740, 165, COSMOS.magenta, { fill: '#291224', glow: 8 }),
        txt('REPLICA B (3 VALID TOKENS)', 430, -150, 26, COSMOS.magenta, 'mono'),
        txt('grad = [0, 0, 0]   ->   local mean = 0.0', 430, -82, 28, COSMOS.ink, 'mono'),

        glassCell(-430, 120, 740, 165, ROLE.bad, { fill: '#2d1222', glow: st >= 5 ? 10 : 4 }),
        txt('EQUAL RANK MEAN (WRONG)', -430, 82, 26, ROLE.bad, 'mono'),
        txt('(10 + 0) / 2 = 5.0', -430, 148, 32, ROLE.bad, 'mono'),

        glassCell(430, 120, 740, 165, ROLE.good, { fill: '#0e2624', glow: st >= 5 ? 10 : 4 }),
        txt('GLOBAL TOKEN MEAN (EXACT)', 430, 82, 26, ROLE.good, 'mono'),
        txt('(10 + 0 + 0 + 0) / 4 = 2.5', 430, 148, 32, ROLE.good, 'mono'),
      );
    }

    nodes.push(
      txt(
        st >= 4
          ? 'A clean collective and matching tensor shapes cannot catch a misweighted loss denominator'
          : 'Activations and temporary buffers sit outside this persistent state ledger',
        0,
        365,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, formulaTex, live);
  wireStepCues(s, c, step, [
    ['optimizer-beat-1-focus-1', 0],
    ['mg-optimizer-first-total', 1],
    ['mg-optimizer-increased-total', 2],
    ['optimizer-beat-2-focus-1', 3],
    ['optimizer-beat-3-focus-1', 4],
    ['optimizer-beat-3-focus-2', 5],
  ]);
}
