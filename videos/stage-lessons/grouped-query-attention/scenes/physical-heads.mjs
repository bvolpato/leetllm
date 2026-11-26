// Scene 10: physical-heads - Tensor-parallel KV sharding (TP=4 vs TP=16) and invalid 6-KV/4-rank split.
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  conduitPts,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  lumBar,
  physicalHeads,
  playCue,
  range,
  rule,
  runPhase,
  swapVis,
  txt,
} from '../parts.mjs';

export default function physicalHeadsScene(s, c) {
  const first = physicalHeads(64, 8, 4);
  const second = physicalHeads(64, 8, 16);

  const phase = s.value(0);
  const vSplit = s.value(1); // View 1: 64Q / 8KV on TP=4 -> TP=16
  const vInvalid = s.value(0); // View 2: 24Q / 6KV on 4 ranks (invalid split)

  // View 1 state
  const tpStage = s.value(0); // 0=init, 1=four, 2=trace, 3=first-total, 4=sixteen, 5=perrank, 6=copies, 7=double, 8=saving
  const replicas = s.value(1); // 1 -> 2 on c.after('copies')
  const activeHead = s.value(-1); // 3 on 'trace'

  // View 2 state
  const dealProg = s.value(0); // 0 -> 1 glides 4 KV heads into 4 rank cradles
  const showFail = s.value(0); // 1 on c.after('fails')

  const title1 = heroTitle(['Follow one history', 'across TP ranks'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.gold,
    eyebrow: 'TENSOR PARALLELISM · KV REPLICATION',
  });

  // VIEW 1: 8 Logical KV Identities fanning down to TP=4 (8 copies) -> TP=16 (16 copies)
  const view1 = guardedDynamic(vSplit, (a) => {
    const st = Math.round(tpStage.value);
    const rep = replicas.value;
    const act = Math.round(activeHead.value);
    const split = Math.max(0, Math.min(1, rep - 1));
    const nodes = [];

    const leftX = -855;
    const diagW = 940;
    const pitch = diagW / 8;
    const topY = -165;
    const botY = 170;

    nodes.push(
      txt(
        '8 LOGICAL KV IDENTITIES (KV0 – KV7)',
        leftX + diagW / 2,
        -238,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(a),
      txt(
        'PHYSICAL KV COPIES ON RANKS',
        leftX + diagW / 2,
        298,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(a),
      rule(145, -305, 145, 385, COSMOS.rule, 1.6).opacity(0.6 * a),
    );

    for (const i of range(8)) {
      const cx = leftX + (i + 0.5) * pitch;
      const isKv3 = i === act;
      const col = isKv3 ? ROLE.gold : ROLE.key;

      // Logical head badge
      nodes.push(
        txt(`KV${i}`, cx, topY - 26, 28, col, 'mono', 'center')
          .glow(isKv3 ? 8 : 0, col)
          .opacity(a),
        glowDot(cx, topY + 6, {
          radius: isKv3 ? 7 : 5,
          color: col,
          glow: isKv3 ? 11 : 5,
          opacity: a,
        }),
      );

      // Fan conduits down to 1 copy (TP=4) or 2 copies (TP=16)
      const branches = split > 0.02 ? [-1, 1] : [0];
      for (const sgn of branches) {
        const tx = cx + sgn * (pitch * 0.25) * split;
        const pts = conduitPts([cx, topY + 10], [tx, botY - 30]);
        nodes.push(
          glowingTrail(pts, {
            color: col,
            width: isKv3 ? 4 : 2.2,
            glow: isKv3 ? 10 : 4,
            core: isKv3,
            opacity: (isKv3 ? 1 : 0.65) * a,
          }),
          lumBar(tx, botY - 10, pitch * 0.38, 22, {
            color: ROLE.key,
            fillOpacity: isKv3 ? 0.62 : 0.36,
            strokeWidth: isKv3 ? 2.4 : 1.5,
            glow: isKv3 ? 9 : 3,
            radius: 4,
            opacity: a,
          }),
          lumBar(tx, botY + 18, pitch * 0.38, 22, {
            color: ROLE.value,
            fillOpacity: isKv3 ? 0.62 : 0.36,
            strokeWidth: isKv3 ? 2.4 : 1.5,
            glow: isKv3 ? 9 : 3,
            radius: 4,
            opacity: a,
          }),
        );
      }

      // Rank labels beneath physical blocks (strictly withheld until 'four' / 'copies')
      if (st >= 1 && st < 4) {
        const rankIdx = Math.floor(i / first.kvPerRank);
        nodes.push(
          txt(
            `r${rankIdx}`,
            cx,
            botY + 62,
            26,
            isKv3 ? ROLE.gold : COSMOS.dim,
            'mono',
            'center',
          ).opacity(a),
        );
      } else if (st >= 6) {
        nodes.push(
          txt(
            `r${2 * i}/${2 * i + 1}`,
            cx,
            botY + 62,
            26,
            isKv3 ? ROLE.gold : COSMOS.dim,
            'mono',
            'center',
          ).opacity(a),
        );
      }
    }

    // Right: Floating structured telemetry (zero boxes!)
    const rx = 200;
    nodes.push(
      txt(
        st >= 4 ? '64 Q · 8 KV · TP = 16' : '64 Q · 8 KV · TP = 4',
        rx,
        -225,
        36,
        st >= 4 ? ROLE.gold : ROLE.query,
        'mono',
        'left',
      )
        .glow(6, st >= 4 ? ROLE.gold : ROLE.query)
        .opacity(a),
    );

    if (st >= 1 && st < 4) {
      nodes.push(
        txt(
          `${first.queriesPerRank} queries + ${first.kvPerRank} KV / rank`,
          rx,
          -130,
          30,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(a),
      );
    } else if (st >= 4) {
      nodes.push(
        txt(
          st >= 5 ? `${second.queriesPerRank} queries / rank` : '64 query heads ÷ 16 ranks',
          rx,
          -130,
          30,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(a),
      );
    }

    if (st >= 2 && st < 4) {
      nodes.push(
        txt('KV3 (Q24–Q31)  →  rank 1', rx, -35, 30, ROLE.gold, 'mono', 'left').opacity(a),
      );
    } else if (st >= 4 && st < 6) {
      nodes.push(
        txt('KV3 serves Q24–Q31', rx, -35, 30, COSMOS.muted, 'mono', 'left').opacity(a),
        txt('Which ranks need KV3?', rx, 15, 32, ROLE.gold, 'serif', 'left').opacity(a),
      );
    } else if (st >= 6) {
      nodes.push(
        txt('KV3  →  ranks 6 and 7', rx, -35, 32, ROLE.gold, 'mono', 'left')
          .glow(7, ROLE.gold)
          .opacity(a),
        txt('r6: Q24–27  ·  r7: Q28–31', rx, 18, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      );
    }

    if (st === 3) {
      nodes.push(
        txt(`${first.copies} physical copies`, rx, 115, 38, ROLE.value, 'mono', 'left')
          .glow(7, ROLE.value)
          .opacity(a),
        txt(
          '1 copy per logical KV head (8× saving)',
          rx,
          172,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
      );
    } else if (st >= 4 && st < 7) {
      nodes.push(txt('Physical copies = ?', rx, 125, 36, ROLE.gold, 'mono', 'left').opacity(a));
    } else if (st >= 7) {
      nodes.push(
        txt(`${second.copies} physical copies`, rx, 115, 38, ROLE.alert, 'mono', 'left')
          .glow(8, ROLE.alert)
          .opacity(a),
        txt('1 KV / rank  ·  2× replication', rx, 172, 28, COSMOS.ink, 'mono', 'left').opacity(a),
      );
    }
    if (st >= 8) {
      nodes.push(
        txt('64 / 16 = 4× aggregate saving', rx, 248, 34, ROLE.gold, 'mono', 'left')
          .glow(8, ROLE.gold)
          .opacity(a),
      );
    }

    return group(...nodes);
  });

  // VIEW 2: Invalid split test (24 Q, 6 KV, 4 ranks -> 4 placed, 2 left over!)
  const view2 = guardedDynamic(vInvalid, (a) => {
    const dp = dealProg.value;
    const fl = showFail.value;
    const nodes = [
      txt('TENSOR-PARALLEL DIVISIBILITY CHECK', -855, -425, 26, ROLE.alert, 'mono', 'left').opacity(
        a,
      ),
      txt(
        'Can 4 ranks split 6 KV heads evenly?',
        -855,
        -350,
        50,
        COSMOS.ink,
        'serif',
        'left',
      ).opacity(a),
      txt(
        '24 queries  ·  6 KV heads  ·  4 ranks (6 Q/rank)',
        -855,
        -280,
        30,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(a),
    ];

    // 4 Rank Cradles along the bottom
    const cradleY = 175;
    const cradleW = 290;
    const cradleH = 140;
    const rankXs = range(4).map((r) => -585 + r * 390);
    for (const r of range(4)) {
      const rx = rankXs[r];
      const xl = rx - cradleW / 2;
      const xr = rx + cradleW / 2;
      const yt = cradleY - cradleH / 2;
      const yb = cradleY + cradleH / 2;
      nodes.push(
        line([xl, yt], [xl, yb], { stroke: '#5c71a3', width: 4 }).opacity(a),
        line([xl, yb], [xr, yb], { stroke: '#5c71a3', width: 4 }).opacity(a),
        line([xr, yb], [xr, yt], { stroke: '#5c71a3', width: 4 }).opacity(a),
        txt(`Rank ${r}`, rx, yb + 42, 32, COSMOS.ink, 'mono', 'center').opacity(a),
        txt('6 queries', rx, yb + 82, 26, ROLE.query, 'mono', 'center').opacity(a),
      );
    }

    // 6 KV heads starting in a supply row at y = -115; first 4 glide into ranks 0..3 on 'deal'
    const supplyY = -115;
    const supplyXs = range(6).map((i) => -625 + i * 250);
    for (const i of range(6)) {
      const dealt = i < 4;
      const sx = supplyXs[i];
      const tx = dealt ? rankXs[i] : sx;
      const ty = dealt ? cradleY - 4 : supplyY;
      const cx = sx + (tx - sx) * dp;
      const cy = supplyY + (ty - supplyY) * dp;
      const stranded = !dealt && fl > 0.5;
      const headCol = stranded ? ROLE.alert : ROLE.gold;

      nodes.push(
        txt(`KV${i}`, cx, cy - 38, 32, headCol, 'mono', 'center')
          .glow(stranded ? 10 : 4, headCol)
          .opacity(a),
        lumBar(cx, cy, 130, 22, {
          color: stranded ? ROLE.alert : ROLE.key,
          fillOpacity: 0.52,
          strokeWidth: 2,
          glow: stranded ? 10 : 5,
          radius: 4,
          opacity: a,
        }),
        lumBar(cx, cy + 28, 130, 22, {
          color: stranded ? ROLE.alert : ROLE.value,
          fillOpacity: 0.52,
          strokeWidth: 2,
          glow: stranded ? 10 : 5,
          radius: 4,
          opacity: a,
        }),
      );
    }

    if (fl > 0.02) {
      nodes.push(
        txt(
          '6 KV heads = 4 placed + 2 left over  →  vLLM Llama layout rejects split',
          0,
          410,
          34,
          ROLE.alert,
          'mono',
          'center',
        )
          .glow(8, ROLE.alert)
          .opacity(fl * a),
      );
    }

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.gold, ROLE.key), title1, view1, view2);
  runPhase(s, c, phase, 16);

  playCue(s, c, 'four', (d) => s.play(tpStage.to(1, { duration: Math.min(0.25, d) })), {
    after: true,
    dur: 0.35,
  });
  playCue(
    s,
    c,
    'trace',
    (d) => s.play(tpStage.to(2, { duration: 0.2 }), activeHead.to(3, { duration: d })),
    { dur: 0.45 },
  );
  playCue(s, c, 'first-total', (d) => s.play(tpStage.to(3, { duration: Math.min(0.25, d) })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'sixteen', (d) => s.play(tpStage.to(4, { duration: Math.min(0.25, d) })), {
    dur: 0.35,
  });
  playCue(s, c, 'perrank', (d) => s.play(tpStage.to(5, { duration: Math.min(0.25, d) })), {
    after: true,
    dur: 0.35,
  });
  playCue(
    s,
    c,
    'copies',
    (d) => s.play(tpStage.to(6, { duration: 0.2 }), replicas.to(second.replicas, { duration: d })),
    { after: true, dur: 0.7 },
  );
  playCue(s, c, 'double', (d) => s.play(tpStage.to(7, { duration: Math.min(0.25, d) })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'saving', (d) => s.play(tpStage.to(8, { duration: Math.min(0.25, d) })), {
    after: true,
    dur: 0.35,
  });

  // Switch cleanly to View 2 on 'invalid'
  c.hide('invalid', title1, { fade: 0.2 });
  playCue(s, c, 'invalid', (d) => s.play(swapVis(vSplit, vInvalid, d)), { dur: 0.65 });
  playCue(s, c, 'deal', (d) => s.play(dealProg.to(1, { duration: d })), { dur: 0.85 });
  playCue(s, c, 'fails', (d) => s.play(showFail.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
}
