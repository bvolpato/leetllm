// Scene 09: Match independent heads to the output reduction. Q/K/V col shards -> local heads -> W_O row shards -> 2 sum all-reduces / dense layer, plus hybrid blocks.
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function attentionShards(s, c) {
  const phase = s.value(0);
  const pIntro = s.value(0);
  const pProj = s.value(0);
  const pHeads = s.value(0);
  const pOut = s.value(0);
  const pB1 = s.value(0);
  const pAttnSum = s.value(0);
  const pMlpSum = s.value(0);
  const pCount = s.value(0);
  const pB2 = s.value(0);
  const pHybrid = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1c', '#a78bfa18');
  const title = heroTitle(['Match Independent Heads', 'to the Output Reduction'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.gpu0,
    eyebrow: 'ATTENTION + MLP · 2 SUM ALL-REDUCES PER DENSE LAYER',
  });

  const live = guardedDynamic(1, () => {
    const pr = pProj.value;
    const hd = pHeads.value;
    const ot = pOut.value;
    const b1 = pB1.value > 0.5;
    const aSum = pAttnSum.value > 0.5;
    const mSum = pMlpSum.value > 0.5;
    const cnt = pCount.value > 0.5;
    const hyb = pHybrid.value > 0.5 || pB2.value > 0.5;

    const nodes = [
      txt('CLASSIC DENSE TRANSFORMER BLOCK · 2 RANKS', 0, -215, 28, COSMOS.gold, 'mono'),
    ];

    [0, 1].forEach((rank) => {
      const cx = rank === 0 ? -440 : 440;
      const col = rank === 0 ? ROLE.gpu0 : ROLE.gpu1;
      nodes.push(
        txt(`RANK ${rank}  ·  HEADS ${rank === 0 ? '0, 1' : '2, 3'}`, cx, -155, 28, col, 'mono'),
      );

      ['Q', 'K', 'V'].forEach((lbl, k) => {
        const tx = cx - 190 + k * 190;
        const lit = pr > k * 0.28;
        nodes.push(
          rect(144, 68, {
            fill: lit ? (rank === 0 ? '#122a4d' : '#0e303c') : '#0c1322',
            stroke: lit ? col : COSMOS.dim,
            width: lit ? 2.6 : 1.8,
            radius: 10,
          })
            .at(tx, -85)
            .glow(lit ? 8 : 2, col),
          txt(lbl, tx, -85, 32, lit ? COSMOS.ink : COSMOS.dim, 'mono'),
        );
      });

      nodes.push(
        glassCell(cx, 25, 560, 78, hd > 0.5 ? col : COSMOS.dim, {
          fill: hd > 0.5 ? '#10233c' : '#0c1322',
          glow: hd > 0.5 ? 8 : 2,
        }),
        txt(
          hd > 0.5 ? 'Local attention on assigned heads' : 'Local head attention',
          cx,
          25,
          28,
          hd > 0.5 ? COSMOS.ink : COSMOS.dim,
          'sans',
        ),
      );

      if (ot > 0.3) {
        nodes.push(
          glassCell(cx, 128, 560, 68, ROLE.expert, { fill: '#1c1534', glow: 7, opacity: ot }),
          txt('Head slice × matching Wo rows', cx, 128, 26, ROLE.expert, 'mono').opacity(ot),
        );
      }
    });

    if (b1) {
      nodes.push(
        glowingArc([-440, 165], [-160, 232], 18, { color: ROLE.gpu0, width: 3.2 }),
        glowingArc([440, 165], [160, 232], 18, { color: ROLE.gpu1, width: 3.2 }),
        glassCell(-430, 250, 500, 78, aSum ? COSMOS.gold : COSMOS.dim, {
          fill: '#231d0e',
          glow: aSum ? 9 : 3,
        }),
        txt(
          aSum ? '1. Attention SUM All-Reduce' : 'Attention reduction...',
          -430,
          250,
          28,
          aSum ? COSMOS.gold : COSMOS.muted,
          'mono',
        ),
        glassCell(430, 250, 500, 78, mSum ? COSMOS.gold : COSMOS.dim, {
          fill: '#231d0e',
          glow: mSum ? 9 : 3,
        }),
        txt(
          mSum ? '2. MLP SUM All-Reduce' : 'MLP reduction...',
          430,
          250,
          28,
          mSum ? COSMOS.gold : COSMOS.muted,
          'mono',
        ),
      );
    }

    if (cnt && !hyb) {
      nodes.push(
        glassCell(0, 355, 1180, 74, ROLE.good, { fill: '#0d2924', glow: 10 }),
        txt(
          '2 in-layer SUM All-Reduces per dense transformer layer',
          0,
          355,
          28,
          ROLE.good,
          'mono',
        ),
      );
    } else if (hyb) {
      nodes.push(
        glassCell(0, 355, 1540, 74, ROLE.warn, { fill: '#271a0e', glow: 9 }),
        txt(
          'Hybrid blocks (full attn + gated + MoE) change collective counts · keep bias/norm/residual intact',
          0,
          355,
          26,
          ROLE.warn,
          'sans',
        ),
      );
    } else {
      nodes.push(
        txt(
          'Heads run independently; Wo row shards still need one output sum',
          0,
          355,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    nodes.push(
      glowDot(-740 + ((phase.value * 0.55) % 1) * 1480, 425, { radius: 6, color: ROLE.gpu0 }),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('mp-attention-shards-0', () =>
    s.play(pIntro.to(1, { duration: remainDuration(c, 'mp-attention-shards-0', 0.35) })),
  );
  c.on('mp-attention-shards-project', () =>
    s.play(pProj.to(1, { duration: remainDuration(c, 'mp-attention-shards-project', 0.55) })),
  );
  c.on('mp-attention-shards-heads', () =>
    s.play(pHeads.to(1, { duration: remainDuration(c, 'mp-attention-shards-heads', 0.45) })),
  );
  c.on('mp-attention-shards-output', () =>
    s.play(pOut.to(1, { duration: remainDuration(c, 'mp-attention-shards-output', 0.45) })),
  );
  c.on('mp-attention-shards-1', () =>
    s.play(pB1.to(1, { duration: remainDuration(c, 'mp-attention-shards-1', 0.35) })),
  );
  c.after('mp-attention-shards-attention-sum', () =>
    s.play(
      pAttnSum.to(1, {
        duration: remainAfterDuration(c, 'mp-attention-shards-attention-sum', 0.35),
      }),
    ),
  );
  c.after('mp-attention-shards-mlp-sum', () =>
    s.play(
      pMlpSum.to(1, { duration: remainAfterDuration(c, 'mp-attention-shards-mlp-sum', 0.35) }),
    ),
  );
  c.after('mp-attention-shards-count', () =>
    s.play(pCount.to(1, { duration: remainAfterDuration(c, 'mp-attention-shards-count', 0.35) })),
  );
  c.on('mp-attention-shards-2', () =>
    s.play(pB2.to(1, { duration: remainDuration(c, 'mp-attention-shards-2', 0.35) })),
  );
  c.on('mp-attention-shards-hybrid', () =>
    s.play(pHybrid.to(1, { duration: remainDuration(c, 'mp-attention-shards-hybrid', 0.4) })),
  );
}
