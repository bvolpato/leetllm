// Scene 09: Four logical roles have a stated aggregate state cost (16 B/param + 2520 GB vs 1400 GB + 3D towers)
import {
  BUDGET_FULL,
  BUDGET_NO_CRITIC,
  COSMOS,
  aura,
  buildRoleTowers3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  prefLerp,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function stateBudget(s, c) {
  const phase = s.value(0);
  const sBytes = s.value(0);
  const sWeight = s.value(0);
  const sGrad = s.value(0);
  const sMom = s.value(0);
  const sMast = s.value(0);
  const sFroz = s.value(0);
  const sFour = s.value(0);
  const sTot = s.value(0);
  const sDrop = s.value(0);
  const sRem = s.value(0);
  const sRoll = s.value(0);
  const sAsync = s.value(0);

  const bgAura = aura(425, 20, 560, '#14385c26', '#331c5418');
  const towers3d = buildRoleTowers3d(phase, { x: 465, y: 20, includeCritic: true });

  const title = heroTitle(['Four Logical Roles Have', 'a Stated State Cost'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: '70B PPO MEMORY BUDGET · 16 B/PARAM TRAINABLE vs 2 B/PARAM FROZEN',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const rm = Math.max(sDrop.value, sRem.value);
    const totalGb = prefLerp(BUDGET_FULL.total, BUDGET_NO_CRITIC.total, rm);
    const criticGb = prefLerp(1120, 0, rm);

    // 16-byte trainable strip (width = 768px -> 48px per byte)
    const sx = -855;
    const sy = -152;
    const segs = [
      {
        label: '2B W',
        bytes: 2,
        col: COSMOS.cyan,
        fill: '#10354a',
        on: Math.max(0.75, sWeight.value),
      },
      {
        label: '2B G',
        bytes: 2,
        col: COSMOS.emerald,
        fill: '#103b33',
        on: Math.max(0.75, sGrad.value),
      },
      {
        label: '8B Adam m,v',
        bytes: 8,
        col: COSMOS.violet,
        fill: '#2a1842',
        on: Math.max(0.75, sMom.value),
      },
      {
        label: '4B FP32',
        bytes: 4,
        col: COSMOS.gold,
        fill: '#2b220e',
        on: Math.max(0.75, sMast.value),
      },
    ];

    const nodes = [
      txt(
        '1 TRAINABLE PARAM = 16 BYTES  |  1 FROZEN PARAM = 2 BYTES',
        -855,
        -214,
        26,
        sBytes.value > 0.2 ? COSMOS.gold : COSMOS.cyan,
        'mono',
        'left',
      ),
    ];

    let curX = sx;
    for (const seg of segs) {
      const w = seg.bytes * 48;
      nodes.push(
        rect(w - 6, 62, { fill: seg.fill, stroke: seg.col, width: 2.2, radius: 6 })
          .at(curX + w * 0.5, sy)
          .opacity(seg.on),
        txt(seg.label, curX + w * 0.5, sy + 2, 26, seg.col, 'mono').opacity(seg.on),
      );
      curX += w;
    }

    // Frozen note
    nodes.push(
      txt(
        sFroz.value > 0.2
          ? 'Frozen ref / reward: 2 B/param weights only (140 GB each at 70B)'
          : 'Each trainable 70B backbone = 1,120 GB state',
        -855,
        -94,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    // 70B 4-role bars (max bar width = 520px for 1120 GB)
    const roles = [
      { name: 'Actor (70B)', gb: 1120, col: COSMOS.cyan, fill: '#10354a' },
      {
        name: 'Critic (70B)',
        gb: criticGb,
        col: rm > 0.5 ? COSMOS.dim : COSMOS.violet,
        fill: '#2a1842',
      },
      { name: 'Ref (70B)', gb: 140, col: COSMOS.gold, fill: '#2b220e' },
      { name: 'Reward (70B)', gb: 140, col: COSMOS.emerald, fill: '#103b33' },
    ];

    roles.forEach((r, i) => {
      const ry = -20 + i * 68;
      const bw = Math.max(8, (r.gb / 1120) * 460);
      nodes.push(
        txt(r.name, -855, ry, 26, r.col, 'mono', 'left'),
        rect(bw, 42, { fill: r.fill, stroke: r.col, width: 2, radius: 6 })
          .at(-615 + bw * 0.5, ry)
          .opacity(Math.max(0.75, sFour.value)),
        txt(
          r.gb < 1 ? 'REMOVED (-44.4%)' : `${Math.round(r.gb)} GB`,
          -600 + bw,
          ry,
          26,
          r.col,
          'mono',
          'left',
        ),
      );
    });

    // Aggregate total readout
    nodes.push(
      glassCell(-465, 290, 780, 122, rm > 0.4 ? COSMOS.emerald : COSMOS.gold, {
        fill: rm > 0.4 ? '#0e2824' : '#221c0e',
        glow: sTot.value > 0.2 || rm > 0.4 ? 10 * pulse : 5,
      }),
      txt(
        rm > 0.4
          ? `CRITIC-FREE: ${Math.round(totalGb)} GB (SAVES 44.4%)`
          : `4-ROLE TOTAL: ${Math.round(totalGb)} GB (STATE ONLY)`,
        -465,
        268,
        28,
        rm > 0.4 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ),
      txt(
        sAsync.value > 0.2
          ? 'Async engines overlap rollout & train (track lag)'
          : sRoll.value > 0.2
            ? 'Rollouts add prefill, decode & scoring cost'
            : 'Smaller/shared critics change real placement',
        -465,
        318,
        26,
        COSMOS.muted,
        'sans',
      ),

      // Right 3D caption
      txt('3D 70B ROLE STATE MONOLITHS', 465, -365, 26, COSMOS.cyan, 'mono'),
      txt('Actor 1120 · Critic 1120 · Ref 140 · Reward 140 GB', 465, 396, 26, COSMOS.muted, 'mono'),
    );

    return group(...nodes);
  });

  s.add(bgAura, towers3d, title, live);
  runPhase(s, c, phase, 14);

  c.on('state-budget-b0', () =>
    s.play(sBytes.to(0.5, { duration: remainDuration(c, 'state-budget-b0', 0.4) })),
  );
  c.on('pa-state-bytes', () =>
    s.play(sBytes.to(1, { duration: remainDuration(c, 'pa-state-bytes', 0.4) })),
  );
  c.on('pa-state-weight', () =>
    s.play(sWeight.to(1, { duration: remainDuration(c, 'pa-state-weight', 0.35) })),
  );
  c.on('pa-state-gradient', () =>
    s.play(sGrad.to(1, { duration: remainDuration(c, 'pa-state-gradient', 0.35) })),
  );
  c.on('pa-state-moments', () =>
    s.play(sMom.to(1, { duration: remainDuration(c, 'pa-state-moments', 0.35) })),
  );
  c.on('pa-state-master', () =>
    s.play(sMast.to(1, { duration: remainDuration(c, 'pa-state-master', 0.35) })),
  );
  c.on('pa-state-frozen', () =>
    s.play(sFroz.to(1, { duration: remainDuration(c, 'pa-state-frozen', 0.35) })),
  );
  c.on('state-budget-b1', () =>
    s.play(sFour.to(1, { duration: remainDuration(c, 'state-budget-b1', 0.45) })),
  );
  c.on('pa-state-total', () =>
    s.play(sTot.to(1, { duration: remainDuration(c, 'pa-state-total', 0.45) })),
  );
  c.on('state-budget-b2', () =>
    s.play(sDrop.to(0.45, { duration: remainDuration(c, 'state-budget-b2', 0.45) })),
  );
  c.on('pa-state-remove', () =>
    s.play(sRem.to(1, { duration: remainDuration(c, 'pa-state-remove', 0.65) })),
  );
  c.on('state-budget-b3', () =>
    s.play(sRoll.to(1, { duration: remainDuration(c, 'state-budget-b3', 0.45) })),
  );
  c.on('pa-state-overlap', () =>
    s.play(sAsync.to(1, { duration: remainDuration(c, 'pa-state-overlap', 0.45) })),
  );
}
