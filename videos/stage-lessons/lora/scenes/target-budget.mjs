// Scene 16: Spend capacity where the block transforms information: Exact 7B block (4096/11008, r=16) vs Tiny Qwen2 GQA (16/32/8, r=2).
import { delay, par } from 'vizmatic/stage';
import {
  BUDGET_7B,
  BUDGET_7B_SUMS,
  BUDGET_TINY,
  BUDGET_TINY_SUMS,
  COSMOS,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function targetBudget(s, c) {
  const phase = s.value(0);
  const show7B = s.value(1);
  const show7BQV = s.value(0);
  const show7BAll = s.value(0);
  const show7BRatio = s.value(0);
  const showTiny = s.value(0);
  const showTinyQV = s.value(0);
  const showTinyAttn = s.value(0);
  const showTinyAll = s.value(0);

  const bgAura = aura(100, 10, 620, '#5ce1e620', '#ffd16618');
  const title = heroTitle(['Spend Capacity Where', 'Information Transforms'], {
    x: -855,
    y: -420,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'EXACT BLOCK PARAMETER BUDGETS',
  });

  // Part 1: 7B Transformer block (d=4096, mlp=11008, r=16)
  const part7B = guardedDynamic(show7B, (a) => {
    const qv = show7BQV.value;
    const all = show7BAll.value;
    const rat = show7BRatio.value;
    const maxCount = BUDGET_7B[4].count; // gate/up/down = 241,664
    const barMaxW = 680;
    const x0 = -360;

    const nodes = [
      txt(
        '7B BLOCK · d = 4096 · MLP = 11,008 · r = 16',
        855,
        -380,
        26,
        COSMOS.cyan,
        'mono',
        'right',
      ).opacity(a),
    ];

    BUDGET_7B.forEach((row, i) => {
      const y = -215 + i * 74;
      const isQV = row.name === 'q' || row.name === 'v';
      const active = (isQV && qv > 0.2) || all > 0.2;
      const col = i < 4 ? (isQV ? COSMOS.gold : COSMOS.cyan) : COSMOS.emerald;
      const w = (row.count / maxCount) * barMaxW;
      nodes.push(
        txt(`${row.name}_proj`, -855, y, 28, active ? col : COSMOS.muted, 'mono', 'left').opacity(
          a,
        ),
        txt(`${row.out}×${row.input}`, -645, y, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        rect(w, 42, { fill: col, stroke: '#ffffff', width: 1, radius: 5 })
          .at(x0 + w * 0.5, y)
          .glow(active ? 9 : 2, col)
          .opacity((active ? 0.92 : 0.38) * a),
        txt(
          row.count.toLocaleString('en-US'),
          x0 + w + 22,
          y,
          28,
          active ? COSMOS.ink : COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
      );
    });

    // Bottom totals strip
    nodes.push(
      glassCell(-440, 355, 780, 126, COSMOS.gold, {
        fill: '#221c10',
        glow: qv > 0.2 ? 9 : 3,
        opacity: a,
      }),
      txt('Q + V ONLY (r = 16)', -440, 322, 26, COSMOS.muted, 'mono').opacity(a),
      txt(
        qv > 0.3 ? `${BUDGET_7B_SUMS.qv.toLocaleString('en-US')} params` : '2 × 131,072 = ?',
        -440,
        374,
        34,
        COSMOS.gold,
        'mono',
      )
        .glow(qv > 0.3 ? 7 : 0, COSMOS.gold)
        .opacity(a),

      glassCell(440, 355, 780, 126, all > 0.2 ? COSMOS.emerald : '#334268', {
        fill: '#0e2428',
        glow: all > 0.2 ? 10 : 3,
        opacity: a,
      }),
      txt('ALL 7 LINEAR PROJECTIONS', 440, 322, 26, COSMOS.muted, 'mono').opacity(a),
      txt(
        all > 0.3
          ? `${BUDGET_7B_SUMS.all.toLocaleString('en-US')}${rat > 0.3 ? `  (${(BUDGET_7B_SUMS.all / BUDGET_7B_SUMS.qv).toFixed(2)}× Q+V)` : ''}`
          : '4 attn + 3 MLP = ?',
        440,
        374,
        32,
        all > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'mono',
      )
        .glow(all > 0.3 ? 7 : 0, COSMOS.emerald)
        .opacity(a),
    );

    return group(...nodes);
  });

  // Part 2: Tiny Qwen2 GQA fixture (d=16, mlp=32, kv=8, r=2)
  const partTiny = guardedDynamic(showTiny, (a) => {
    const tqv = showTinyQV.value;
    const tatt = showTinyAttn.value;
    const tall = showTinyAll.value;
    const maxCount = BUDGET_TINY[4].count; // 96
    const barMaxW = 660;
    const x0 = -360;

    const nodes = [
      txt(
        'TINY QWEN2 GQA · d=16 · MLP=32 · KV=8 · r=2',
        855,
        -380,
        26,
        COSMOS.emerald,
        'mono',
        'right',
      ).opacity(a),
    ];

    BUDGET_TINY.forEach((row, i) => {
      const y = -215 + i * 74;
      const isGQA = row.name === 'k' || row.name === 'v';
      const col = i < 4 ? (isGQA ? COSMOS.amber : COSMOS.cyan) : COSMOS.emerald;
      const w = (row.count / maxCount) * barMaxW;
      nodes.push(
        txt(`${row.name}_proj`, -855, y, 28, col, 'mono', 'left').opacity(a),
        txt(
          `${row.out}×${row.input}${isGQA ? ' (GQA)' : ''}`,
          -645,
          y,
          26,
          isGQA ? COSMOS.amber : COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
        rect(w, 42, { fill: col, stroke: '#ffffff', width: 1, radius: 5 })
          .at(x0 + w * 0.5, y)
          .glow(8, col)
          .opacity(0.9 * a),
        txt(`${row.count}`, x0 + w + 24, y, 28, COSMOS.ink, 'mono', 'left').opacity(a),
      );
    });

    nodes.push(
      glassCell(-550, 355, 500, 126, COSMOS.gold, {
        fill: '#221c10',
        glow: tqv > 0.2 ? 9 : 3,
        opacity: a,
      }),
      txt('Q + V', -550, 322, 26, COSMOS.muted, 'mono').opacity(a),
      txt(
        tqv > 0.3 ? `${BUDGET_TINY_SUMS.qv} params` : '64 + 48',
        -550,
        374,
        34,
        COSMOS.gold,
        'mono',
      ).opacity(a),

      glassCell(0, 355, 500, 126, COSMOS.cyan, {
        fill: '#102235',
        glow: tatt > 0.2 ? 9 : 3,
        opacity: a,
      }),
      txt('ALL ATTENTION', 0, 322, 26, COSMOS.muted, 'mono').opacity(a),
      txt(
        tatt > 0.3 ? `${BUDGET_TINY_SUMS.attn} params` : 'Q+K+V+O',
        0,
        374,
        34,
        COSMOS.cyan,
        'mono',
      ).opacity(a),

      glassCell(550, 355, 500, 126, COSMOS.emerald, {
        fill: '#0e2528',
        glow: tall > 0.2 ? 10 : 3,
        opacity: a,
      }),
      txt('ALL 7 (EXCL. LM_HEAD)', 550, 322, 26, COSMOS.muted, 'mono').opacity(a),
      txt(
        tall > 0.3 ? `${BUDGET_TINY_SUMS.all} params` : 'attn + MLP',
        550,
        374,
        34,
        COSMOS.emerald,
        'mono',
      ).opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, part7B, partTiny);
  runPhase(s, c, phase, 14);

  c.on('target-budget-1', () => s.play(show7B.to(1, { duration: 0.2 })));
  c.on('target-large-qv', () => s.play(show7BQV.to(1, { duration: 0.4 })));
  c.on('target-budget-2', () => s.play(show7BAll.to(0.5, { duration: 0.3 })));
  c.on('target-large-all', () => s.play(show7BAll.to(1, { duration: 0.4 })));
  c.on('target-large-ratio', () => s.play(show7BRatio.to(1, { duration: 0.4 })));
  c.on('target-budget-3', () => {
    s.play(par(show7B.to(0, { duration: 0.16 }), delay(showTiny.to(1, { duration: 0.2 }), 0.16)));
  });
  c.on('target-tiny-qv', () => s.play(showTinyQV.to(1, { duration: 0.35 })));
  c.on('target-tiny-attention', () => s.play(showTinyAttn.to(1, { duration: 0.35 })));
  c.on('target-tiny-all', () =>
    s.play(showTinyAll.to(1, { duration: remainDuration(c, 'target-tiny-all', 0.4) })),
  );
}
