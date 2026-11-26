// Scene 21: Remove duplication inside existing TP groups (Decode Context Parallelism). 8 ranks, 2 KV heads x 4 partner lanes, 32 positions -> pos % 4 == lane cuts 256 -> 64 physical pairs (8 / rank)!
import {
  COSMOS,
  HISTORY_DCP,
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

export default function decodeHistory(s, c) {
  const phase = s.value(0);
  const p0 = s.value(0);
  const pExist = s.value(0);
  const p1 = s.value(0);
  const pPrem = s.value(0);
  const pMod = s.value(0);
  const pEight = s.value(0);
  const p2 = s.value(0);
  const pPhys = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1c', '#6ee7b716');
  const title = heroTitle(['Remove Duplication Inside', 'Existing TP Groups'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.good,
    eyebrow: 'DECODE CONTEXT PARALLELISM (DCP = 4) · ZERO EXTRA GPUS',
  });

  const live = guardedDynamic(1, () => {
    const mod = pMod.value;
    const dcpDone = pEight.value > 0.5 || p2.value > 0.5;
    const phys = pPhys.value > 0.5;

    const nodes = [
      txt(
        pPrem.value > 0.3 || p1.value > 0.3
          ? '8 EXISTING TP RANKS · 2 KV HEADS × 4 LANES · 32 HISTORY POSITIONS'
          : 'DECODE CONTEXT PARALLELISM · 8 EXISTING TP RANKS',
        0,
        -210,
        26,
        COSMOS.gold,
        'mono',
      ),
    ];

    // 8 rows (ranks 0..7), each showing 32 compact glowing token bars (zero tiny text inside!)
    const xBar0 = -360;
    const stepX = 32;
    HISTORY_DCP.ranks.forEach((rk) => {
      const cy = -146 + rk.rank * 48;
      const col = rk.head === 0 ? ROLE.gpu0 : ROLE.gpu1;
      nodes.push(
        txt(`R${rk.rank} · KV${rk.head} · L${rk.lane}`, -840, cy, 26, col, 'mono', 'left'),
        txt(
          dcpDone ? '8 pos' : '32 pos',
          845,
          cy,
          26,
          dcpDone ? ROLE.good : COSMOS.muted,
          'mono',
          'right',
        ),
      );
      for (let pos = 0; pos < 32; pos++) {
        const keep = pos % 4 === rk.lane;
        const dropped = (dcpDone || pos < mod * 32) && !keep;
        nodes.push(
          rect(24, 30, {
            fill: dropped ? '#0a0f1d' : rk.head === 0 ? '#163c73' : '#0f3b4a',
            stroke: dropped ? '#1a233b' : keep && mod > 0.1 ? ROLE.good : col,
            width: dropped ? 1.0 : 2.0,
            radius: 4,
          })
            .at(xBar0 + pos * stepX, cy)
            .opacity(dropped ? 0.32 : 0.96),
        );
      }
    });

    const foot = phys
      ? `256 replicated pairs -> ${HISTORY_DCP.uniquePairs} unique pairs (${HISTORY_DCP.perRank} / rank · 4× less KV!)`
      : dcpDone
        ? 'Lane L owns pos mod 4 == L · each rank holds 8 head-position pairs'
        : mod > 0.05
          ? 'Dealing 32 positions modulo 4 across the 4 partner ranks per KV head...'
          : 'Plain KV replication stores all 32 positions on every partner rank (256 total)';

    nodes.push(
      glassCell(0, 315, 1520, 82, phys ? ROLE.good : dcpDone ? COSMOS.gold : ROLE.gpu0, {
        fill: phys ? '#0d2924' : '#10182b',
        glow: 9,
      }),
      txt(foot, 0, 315, 28, phys ? ROLE.good : dcpDone ? COSMOS.gold : COSMOS.ink, 'mono'),
      glowDot(-740 + ((phase.value * 0.55) % 1) * 1480, 405, {
        radius: 6,
        color: phys ? ROLE.good : ROLE.gpu1,
      }),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('mp-decode-history-0', () =>
    s.play(p0.to(1, { duration: remainDuration(c, 'mp-decode-history-0', 0.35) })),
  );
  c.on('mp-decode-history-existing', () =>
    s.play(pExist.to(1, { duration: remainDuration(c, 'mp-decode-history-existing', 0.4) })),
  );
  c.on('mp-decode-history-1', () =>
    s.play(p1.to(1, { duration: remainDuration(c, 'mp-decode-history-1', 0.35) })),
  );
  c.on('mp-decode-history-premises', () =>
    s.play(pPrem.to(1, { duration: remainDuration(c, 'mp-decode-history-premises', 0.4) })),
  );
  c.on('mp-decode-history-modulo', () =>
    s.play(pMod.to(1, { duration: remainDuration(c, 'mp-decode-history-modulo', 1.1) })),
  );
  c.after('mp-decode-history-eight', () =>
    s.play(pEight.to(1, { duration: remainAfterDuration(c, 'mp-decode-history-eight', 0.4) })),
  );
  c.on('mp-decode-history-2', () =>
    s.play(p2.to(1, { duration: remainDuration(c, 'mp-decode-history-2', 0.35) })),
  );
  c.after('mp-decode-history-physical', () =>
    s.play(pPhys.to(1, { duration: remainAfterDuration(c, 'mp-decode-history-physical', 0.45) })),
  );
}
