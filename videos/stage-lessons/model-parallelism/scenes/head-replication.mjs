// Scene 11: A KV head can be replicated after query heads divide. Qwen 16 Q heads, 2 KV heads, d_h=256 (10 full-attn vs 30 gated). TP=2 clean vs TP=8 replicates each KV head 4x!
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
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function headReplication(s, c) {
  const phase = s.value(0);
  const pIntro = s.value(0);
  const pPrem = s.value(0);
  const pHyb = s.value(0);
  const pB1 = s.value(0);
  const pTwo = s.value(0);
  const pEight = s.value(0);
  const pRep = s.value(0);
  const pB2 = s.value(0);
  const pPlat = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1c', '#fb923c16');
  const title = heroTitle(['KV Heads Replicate Once', 'TP Exceeds KV Head Count'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.warn,
    eyebrow: 'GQA SHARDING · 16 Q HEADS · 2 KV HEADS · WIDTH 256',
  });

  const live = guardedDynamic(1, () => {
    const eight = pEight.value > 0.5;
    const rep = pRep.value > 0.5;
    const plat = pPlat.value > 0.5 || pB2.value > 0.5;
    const hyb = pHyb.value > 0.5;
    const n = eight ? 8 : 2;

    const nodes = [
      txt(
        '16 Q HEADS · 2 KV HEADS · d_h = 256 · 10 FULL-ATTN LAYERS',
        0,
        -215,
        26,
        COSMOS.gold,
        'mono',
      ),
    ];

    if (!eight) {
      // TP=2 clean layout: 2 wide rank boxes
      [0, 1].forEach((r) => {
        const cx = r === 0 ? -430 : 430;
        const col = r === 0 ? ROLE.gpu0 : ROLE.gpu1;
        nodes.push(
          glassCell(cx, 15, 760, 340, pTwo.value > 0.3 || pB1.value > 0.3 ? ROLE.good : col, {
            fill: r === 0 ? '#10213d' : '#0e2b38',
            glow: 8,
          }),
          txt(`RANK ${r}  (TP = 2)`, cx - 340, -120, 28, col, 'mono', 'left'),
        );
        for (let j = 0; j < 8; j++) {
          const qx = cx - 260 + (j % 4) * 172;
          const qy = -48 + Math.floor(j / 4) * 74;
          nodes.push(
            rect(144, 54, { fill: '#0b1529', stroke: ROLE.gpu0, width: 2.0, radius: 8 }).at(qx, qy),
            txt(`Q${r * 8 + j}`, qx, qy, 26, COSMOS.ink, 'mono'),
          );
        }
        nodes.push(
          rect(300, 62, { fill: '#0d2b24', stroke: ROLE.good, width: 2.6, radius: 8 })
            .at(cx, 120)
            .glow(8, ROLE.good),
          txt(`KV ${r}  (1x unique)`, cx, 120, 28, ROLE.good, 'mono'),
        );
      });
    } else {
      // TP=8 layout: 2 rows x 4 ranks
      for (let r = 0; r < n; r++) {
        const cx = -630 + (r % 4) * 420;
        const cy = r < 4 ? -65 : 155;
        const kvIdx = r < 4 ? 0 : 1;
        const col = kvIdx === 0 ? ROLE.gpu0 : ROLE.gpu1;
        nodes.push(
          glassCell(cx, cy, 384, 186, rep ? (plat ? ROLE.warn : col) : col, {
            fill: kvIdx === 0 ? '#10213d' : '#0e2b38',
            glow: rep ? 8 : 5,
          }),
          txt(`RANK ${r}`, cx - 165, cy - 62, 26, COSMOS.muted, 'mono', 'left'),
          rect(144, 52, { fill: '#0b1529', stroke: ROLE.gpu0, width: 1.8, radius: 8 }).at(
            cx - 86,
            cy - 4,
          ),
          txt(`Q${r * 2}`, cx - 86, cy - 4, 26, COSMOS.ink, 'mono'),
          rect(144, 52, { fill: '#0b1529', stroke: ROLE.gpu0, width: 1.8, radius: 8 }).at(
            cx + 86,
            cy - 4,
          ),
          txt(`Q${r * 2 + 1}`, cx + 86, cy - 4, 26, COSMOS.ink, 'mono'),
        );
        if (rep) {
          nodes.push(
            rect(320, 54, {
              fill: plat ? '#2e1a0f' : '#12293e',
              stroke: plat ? ROLE.warn : col,
              width: 2.4,
              radius: 8,
            })
              .at(cx, cy + 56)
              .glow(7, plat ? ROLE.warn : col),
            txt(
              `KV ${kvIdx} (copy ${(r % 4) + 1}/4)`,
              cx,
              cy + 56,
              26,
              plat ? ROLE.warn : col,
              'mono',
            ),
          );
        } else {
          nodes.push(txt('KV head: ?', cx, cy + 56, 26, COSMOS.gold, 'mono'));
        }
      }
    }

    const foot = plat
      ? 'TP=2 through TP=8 keep 1 full-history KV head per rank · DCP shards that history'
      : rep
        ? 'At TP=8, four partner ranks replicate each KV head (works when n_kv divides TP)'
        : hyb
          ? '30 other Qwen layers use gated recurrent-style state (budgeted separately)'
          : 'TP=2 divides both 16 Q heads and 2 KV heads cleanly with zero duplication';

    nodes.push(
      txt(foot, 0, 345, 28, plat ? ROLE.warn : rep ? COSMOS.gold : COSMOS.ink, 'sans'),
      glowDot(-740 + ((phase.value * 0.55) % 1) * 1480, 415, {
        radius: 6,
        color: plat ? ROLE.warn : ROLE.gpu1,
      }),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('mp-head-replication-0', () =>
    s.play(pIntro.to(1, { duration: remainDuration(c, 'mp-head-replication-0', 0.35) })),
  );
  c.on('mp-head-replication-premises', () =>
    s.play(pPrem.to(1, { duration: remainDuration(c, 'mp-head-replication-premises', 0.4) })),
  );
  c.on('mp-head-replication-hybrid', () =>
    s.play(pHyb.to(1, { duration: remainDuration(c, 'mp-head-replication-hybrid', 0.4) })),
  );
  c.on('mp-head-replication-1', () =>
    s.play(pB1.to(1, { duration: remainDuration(c, 'mp-head-replication-1', 0.35) })),
  );
  c.on('mp-head-replication-two', () =>
    s.play(pTwo.to(1, { duration: remainDuration(c, 'mp-head-replication-two', 0.35) })),
  );
  c.on('mp-head-replication-eight', () =>
    s.play(pEight.to(1, { duration: remainDuration(c, 'mp-head-replication-eight', 0.45) })),
  );
  c.after('mp-head-replication-replicate', () =>
    s.play(pRep.to(1, { duration: remainAfterDuration(c, 'mp-head-replication-replicate', 0.4) })),
  );
  c.on('mp-head-replication-2', () =>
    s.play(pB2.to(1, { duration: remainDuration(c, 'mp-head-replication-2', 0.35) })),
  );
  c.on('mp-head-replication-plateau', () =>
    s.play(pPlat.to(1, { duration: remainDuration(c, 'mp-head-replication-plateau', 0.4) })),
  );
}
