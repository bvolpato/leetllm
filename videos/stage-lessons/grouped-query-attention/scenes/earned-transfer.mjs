// Scene 20: earned-transfer - Finale transfer: 48Q/6KV on TP=12 (Q19 -> KV2 -> r4/r5) + 12 MiB rank admission.
import {
  COSMOS,
  ROLE,
  cacheBytes,
  cinemaAtmosphere,
  conduitPts,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  kvGroupForQuery,
  line,
  lumBar,
  physicalHeads,
  playCue,
  range,
  rect,
  rule,
  runPhase,
  swapVis,
  txt,
} from '../parts.mjs';

export default function earnedTransfer(s, c) {
  const queries = 48;
  const heads = 6;
  const ranks = 12;
  const targetQ = 19;
  const layout = physicalHeads(queries, heads, ranks);
  const owner = kvGroupForQuery(targetQ, queries, heads); // 2

  const perRankMiB = (tokens) =>
    cacheBytes({
      layers: 32,
      batch: 1,
      tokens,
      kvHeads: layout.kvPerRank,
      width: 64,
      bytes: 2,
    }) /
    2 ** 20;
  const fullMiB = perRankMiB(1024); // 8
  const shortMiB = perRankMiB(512); // 4
  const limitMiB = 12;
  const aggMiB = ranks * fullMiB; // 96
  const mhaMiB = queries * fullMiB; // 384
  const perTokKiB = perRankMiB(1) * 1024; // 8 KiB

  const phase = s.value(0);
  const vMap = s.value(1); // View 1: 48Q -> 6 KV -> 12 ranks + memory math
  const vRank = s.value(0); // View 2: Single rank 12 MiB admission test

  // View 1 state
  const showSize = s.value(0);
  const showQ19 = s.value(0);
  const showGroup = s.value(0);
  const copyPhase = s.value(0); // 0=logical only, 1=partition, 2=replicas(12 copies)
  const showCopies = s.value(0);
  const showDims = s.value(0);
  const costStage = s.value(0); // 0=none, 1=unit, 2=logical, 3=aggregate, 4=mha

  // View 2 state
  const showWaiting = s.value(0);
  const showAsk = s.value(0);
  const showFit = s.value(0);
  const fillC = s.value(0); // 0 -> 4 MiB glides into remaining 12 MiB slot
  const showWait = s.value(0);
  const showGrowth = s.value(0);

  const title1 = heroTitle(['Which history', 'serves query 19?'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.gold,
    eyebrow: 'TRANSFER CHALLENGE · 48 Q · 6 KV · 12 RANKS',
  });

  // VIEW 1: 48 Query dots -> 6 Logical KV identities -> 12 Physical Rank Copies
  const view1 = guardedDynamic(vMap, (a) => {
    const sz = showSize.value;
    const q19 = showQ19.value;
    const grp = showGroup.value;
    const cp = copyPhase.value;
    const sc = showCopies.value;
    const dm = showDims.value;
    const cs = Math.round(costStage.value);

    const leftX = -855;
    const diagW = 920;
    const qPitch = diagW / queries;
    const kvPitch = diagW / heads;
    const dotY = -225;
    const kvY = -75;
    const botY = 210;

    const nodes = [
      rule(125, -310, 125, 385, COSMOS.rule, 1.6).opacity(0.6 * a),
      txt(
        '48 QUERY HEADS (Q0 – Q47)',
        leftX + diagW / 2,
        -268,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(a),
    ];

    // 48 Query constellation dots
    for (const i of range(queries)) {
      const qx = leftX + (i + 0.5) * qPitch;
      const is19 = i === targetQ && q19 > 0.5;
      nodes.push(
        glowDot(qx, dotY, {
          radius: is19 ? 8.5 : 4,
          color: is19 ? ROLE.gold : ROLE.query,
          glow: is19 ? 14 : 4,
          opacity: a,
        }),
      );
    }

    // 6 Logical KV identities & their fan-out to 12 physical rank copies
    const split = Math.max(0, Math.min(1, cp - 1));
    for (const g of range(heads)) {
      const gx = leftX + (g + 0.5) * kvPitch;
      const isOwner = g === owner && grp > 0.5;
      const col = isOwner ? ROLE.gold : ROLE.key;
      const rStart = g * 8;
      const rEnd = rStart + 7;

      if (sz > 0.02) {
        nodes.push(
          txt(
            `${rStart}–${rEnd}`,
            gx,
            -172,
            26,
            isOwner ? ROLE.gold : COSMOS.muted,
            'mono',
            'center',
          )
            .glow(isOwner ? 7 : 0, ROLE.gold)
            .opacity(sz * a),
        );
      }

      nodes.push(
        txt(`KV${g}`, gx, kvY - 26, 30, col, 'mono', 'center')
          .glow(isOwner ? 9 : 0, col)
          .opacity(a),
        glowDot(gx, kvY + 6, {
          radius: isOwner ? 7 : 5,
          color: col,
          glow: isOwner ? 11 : 5,
          opacity: a,
        }),
      );

      if (cp < 0.05) {
        // Logical KV slabs + dashed ghost physical rank slots below (keeps canvas balanced from t=0)
        nodes.push(
          lumBar(gx, kvY + 46, kvPitch * 0.44, 18, {
            color: ROLE.key,
            fillOpacity: 0.45,
            glow: 4,
            radius: 3,
            opacity: a,
          }),
          lumBar(gx, kvY + 70, kvPitch * 0.44, 18, {
            color: ROLE.value,
            fillOpacity: 0.45,
            glow: 4,
            radius: 3,
            opacity: a,
          }),
          rect(kvPitch * 0.36, 46, {
            fill: '#0c1324',
            stroke: '#2c3d66',
            width: 1.6,
            radius: 5,
            dash: [6, 5],
          })
            .at(gx - kvPitch * 0.24, botY)
            .opacity(0.75 * a),
          rect(kvPitch * 0.36, 46, {
            fill: '#0c1324',
            stroke: '#2c3d66',
            width: 1.6,
            radius: 5,
            dash: [6, 5],
          })
            .at(gx + kvPitch * 0.24, botY)
            .opacity(0.75 * a),
        );
      } else {
        const branches = split > 0.02 ? [-1, 1] : [0];
        for (const sgn of branches) {
          const tx = gx + sgn * (kvPitch * 0.25) * split;
          const pts = conduitPts([gx, kvY + 10], [tx, botY - 30]);
          nodes.push(
            glowingTrail(pts, {
              color: col,
              width: isOwner ? 4 : 2.2,
              glow: isOwner ? 10 : 4,
              core: isOwner,
              opacity: (isOwner ? 1 : 0.65) * a,
            }),
            lumBar(tx, botY - 12, kvPitch * 0.38, 22, {
              color: ROLE.key,
              fillOpacity: isOwner ? 0.62 : 0.36,
              strokeWidth: isOwner ? 2.4 : 1.5,
              glow: isOwner ? 9 : 3,
              radius: 4,
              opacity: a,
            }),
            lumBar(tx, botY + 16, kvPitch * 0.38, 22, {
              color: ROLE.value,
              fillOpacity: isOwner ? 0.62 : 0.36,
              strokeWidth: isOwner ? 2.4 : 1.5,
              glow: isOwner ? 9 : 3,
              radius: 4,
              opacity: a,
            }),
          );
        }
        if (split > 0.7) {
          nodes.push(
            txt(
              `r${2 * g}/r${2 * g + 1}`,
              gx,
              botY + 62,
              26,
              isOwner ? ROLE.gold : COSMOS.dim,
              'mono',
              'center',
            ).opacity(a),
          );
        }
      }
    }

    // Right: Floating telemetry & aggregate byte math
    const rx = 175;
    nodes.push(
      txt('48 Q · 6 KV · 12 RANKS', rx, -255, 32, ROLE.query, 'mono', 'left').opacity(a),
      txt(
        'PHYSICAL RANK SLOTS (TP = 12)',
        leftX + diagW / 2,
        botY + 95,
        26,
        COSMOS.dim,
        'mono',
        'center',
      ).opacity(a),
      txt(
        grp > 0.5 ? `⌊19 / 8⌋ = KV${owner}  (Q16–Q23)` : 'Q19  →  which KV group?',
        rx,
        -165,
        34,
        ROLE.gold,
        'mono',
        'left',
      )
        .glow(7, ROLE.gold)
        .opacity(a),
    );

    if (cp >= 0.8) {
      nodes.push(
        txt('12 ranks  →  4 queries / rank', rx, -90, 28, COSMOS.ink, 'mono', 'left').opacity(a),
      );
    }
    if (split > 0.6) {
      nodes.push(
        txt('KV2 replicated on ranks 4 & 5', rx, -35, 28, ROLE.gold, 'mono', 'left').opacity(a),
      );
    }
    if (sc > 0.5) {
      nodes.push(
        txt('6 logical × 2 = 12 physical copies', rx, 20, 30, ROLE.key, 'mono', 'left')
          .glow(6, ROLE.key)
          .opacity(a),
      );
    }

    if (cs >= 1) {
      nodes.push(
        rule(rx, 72, 855, 72, COSMOS.rule, 1.5).opacity(0.6 * a),
        txt(`1 physical head = ${fullMiB} MiB`, rx, 118, 32, ROLE.key, 'mono', 'left').opacity(a),
      );
    }
    if (cs >= 2) {
      nodes.push(
        txt(
          `Logical (6 heads):  ${heads * fullMiB} MiB`,
          rx,
          174,
          28,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
      );
    }
    if (cs >= 3) {
      nodes.push(
        txt(`Physical (12 copies):  ${aggMiB} MiB`, rx, 230, 34, ROLE.gold, 'mono', 'left')
          .glow(8, ROLE.gold)
          .opacity(a),
      );
    }
    if (cs >= 4) {
      nodes.push(
        txt(
          `MHA (48 heads):  ${mhaMiB} MiB  (4× saving)`,
          rx,
          290,
          30,
          ROLE.value,
          'mono',
          'left',
        ).opacity(a),
      );
    }

    if (dm > 0.02) {
      nodes.push(
        txt(
          '2 arrays × 32 layers × 1,024 positions × width 64 × 2 B = 8 MiB / physical head',
          0,
          440,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(dm * a),
      );
    }

    return group(...nodes);
  });

  // VIEW 2: Single Representative Rank (12 MiB Budget) -> Resident A (8 MiB) + Waiting B (1024) vs C (512)
  const view2 = guardedDynamic(vRank, (a) => {
    const wt = showWaiting.value;
    const ask = showAsk.value;
    const fit = showFit.value;
    const fc = fillC.value;
    const wB = showWait.value;
    const gr = showGrowth.value;

    const barLeft = -460;
    const barW = 1140;
    const barH = 78;
    const barY = -90;
    const px = (mib) => (mib / limitMiB) * barW;

    const nodes = [
      txt(
        'PER-RANK ADMISSION DECISION · 12 IDENTICAL RANKS',
        -855,
        -425,
        26,
        ROLE.gold,
        'mono',
        'left',
      ).opacity(a),
      txt(
        'Which waiting cache fits on every rank?',
        -855,
        -350,
        50,
        COSMOS.ink,
        'serif',
        'left',
      ).opacity(a),
      txt(
        '12 MiB raw KV allowance per rank  ·  Resident A already uses 8 MiB (1,024 pos)',
        -855,
        -278,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(a),

      // 12 MiB capacity bar
      txt('12 MiB limit', -855, barY, 38, ROLE.gold, 'mono', 'left').opacity(a),
      rect(barW, barH, { fill: '#0d1527', stroke: '#2c3d68', width: 2, radius: 8 })
        .at(barLeft + barW / 2, barY)
        .opacity(a),
      // Resident A (8 MiB)
      lumBar(barLeft + px(fullMiB) / 2, barY, px(fullMiB) - 4, barH - 6, {
        color: ROLE.key,
        fillOpacity: 0.48,
        strokeWidth: 2.2,
        glow: 8,
        radius: 6,
        opacity: a,
      }),
      txt(
        'Resident A · 1,024 pos · 8 MiB',
        barLeft + px(fullMiB) / 2,
        barY,
        30,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(a),
      // Gold 12 MiB right boundary line
      line([barLeft + barW, barY - 56], [barLeft + barW, barY + 56], {
        stroke: ROLE.gold,
        width: 4.5,
      })
        .glow(10, ROLE.gold)
        .opacity(a),
      txt('12 MiB', barLeft + barW + 22, barY, 30, ROLE.gold, 'mono', 'left').opacity(a),
    ];

    // Open headroom indicator before C fills it
    if (fc < 0.05) {
      nodes.push(
        txt('4 MiB free', barLeft + px(fullMiB + 2), barY, 30, ROLE.gold, 'mono', 'center')
          .glow(6, ROLE.gold)
          .opacity(a),
      );
    } else {
      const cw = Math.max(8, px(fc));
      nodes.push(
        lumBar(barLeft + px(fullMiB) + cw / 2, barY, cw - 4, barH - 6, {
          color: ROLE.value,
          fillOpacity: 0.56,
          strokeWidth: 2.6,
          glow: 11,
          radius: 6,
          opacity: a,
        }),
      );
      if (fc > shortMiB * 0.9) {
        nodes.push(
          txt(
            'C · 4 MiB',
            barLeft + px(fullMiB) + px(shortMiB) / 2,
            barY,
            30,
            COSMOS.ink,
            'mono',
            'center',
          ).opacity(Math.min(1, (fc - shortMiB * 0.9) / (shortMiB * 0.1)) * a),
        );
      }
    }

    // Two Waiting Request Rows below the bar
    if (wt > 0.02) {
      const yB = 105;
      const yC = 235;
      // Waiting B (1,024 positions -> 8 MiB -> waits!)
      nodes.push(
        txt('Waiting B', -855, yB, 38, wB > 0.5 ? ROLE.alert : COSMOS.ink, 'mono', 'left').opacity(
          wt * a,
        ),
        lumBar(barLeft + px(fullMiB) / 2, yB, px(fullMiB) - 4, 52, {
          color: wB > 0.5 ? ROLE.alert : ROLE.pos,
          fillOpacity: 0.25,
          strokeWidth: 2.2,
          dash: [8, 5],
          glow: wB > 0.5 ? 9 : 4,
          radius: 7,
          opacity: wt * a,
        }),
        txt(
          wB > 0.5 ? '1,024 pos · 8 MiB' : '1,024 positions',
          barLeft + px(fullMiB) / 2,
          yB,
          28,
          wB > 0.5 ? ROLE.alert : COSMOS.ink,
          'mono',
          'center',
        ).opacity(wt * a),
        ...(wB > 0.5
          ? [
              txt(
                '→ WAITS (> 4 MiB free)',
                barLeft + px(fullMiB) + 26,
                yB,
                28,
                ROLE.alert,
                'mono',
                'left',
              )
                .glow(7, ROLE.alert)
                .opacity(wt * a),
            ]
          : []),

        // Waiting C (512 positions -> 4 MiB -> fits!)
        txt(
          fc > 0.5 ? 'Resident C' : 'Waiting C',
          -855,
          yC,
          38,
          fit > 0.5 ? ROLE.value : COSMOS.ink,
          'mono',
          'left',
        ).opacity(wt * a),
        lumBar(barLeft + px(shortMiB) / 2, yC, px(shortMiB) - 4, 52, {
          color: fit > 0.5 ? ROLE.value : ROLE.query,
          fillOpacity: 0.28,
          strokeWidth: 2.4,
          dash: fit > 0.5 ? undefined : [8, 5],
          glow: fit > 0.5 ? 10 : 4,
          radius: 7,
          opacity: wt * a,
        }),
        txt(
          fit > 0.5 ? '512 pos  ·  4 MiB  →  FITS EXACTLY' : '512 positions',
          barLeft + px(shortMiB) + 28,
          yC,
          28,
          fit > 0.5 ? ROLE.value : COSMOS.ink,
          'mono',
          'left',
        ).opacity(wt * a),
      );
    }

    // Bottom floating verdict & growth cost
    const footText =
      gr > 0.5
        ? `Bar is full (12 / 12 MiB): 1 more token costs ${perTokKiB} KiB on every rank`
        : fc > 0.5
          ? 'Resident A (8 MiB) + Resident C (4 MiB) = 12 MiB on every rank'
          : ask > 0.5
            ? 'Predict: With 4 MiB free per rank, does B (1,024) or C (512) fit?'
            : 'Every identical rank must fit the resident and admitted KV slices';
    nodes.push(
      txt(
        footText,
        0,
        412,
        30,
        gr > 0.5 ? ROLE.gold : ask > 0.5 && fc < 0.5 ? ROLE.gold : ROLE.value,
        'sans',
        'center',
      )
        .glow(gr > 0.5 || (ask > 0.5 && fc < 0.5) ? 6 : 0, ROLE.gold)
        .opacity(a),
    );

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.gold, ROLE.value), title1, view1, view2);
  runPhase(s, c, phase, 18);

  playCue(s, c, 'size', (d) => s.play(showSize.to(1, { duration: d })), { after: true, dur: 0.4 });
  playCue(s, c, 'ask-group', (d) => s.play(showQ19.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'group', (d) => s.play(showGroup.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'partition', (d) => s.play(copyPhase.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(s, c, 'replicas', (d) => s.play(copyPhase.to(2, { duration: d })), {
    after: true,
    dur: 0.6,
  });
  playCue(s, c, 'copies', (d) => s.play(showCopies.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'dimensions', (d) => s.play(showDims.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'unit', (d) => s.play(costStage.to(1, { duration: Math.min(0.25, d) })), {
    after: true,
    dur: 0.3,
  });
  playCue(s, c, 'logical', (d) => s.play(costStage.to(2, { duration: Math.min(0.25, d) })), {
    after: true,
    dur: 0.3,
  });
  playCue(s, c, 'aggregate', (d) => s.play(costStage.to(3, { duration: Math.min(0.25, d) })), {
    after: true,
    dur: 0.3,
  });
  playCue(s, c, 'mha', (d) => s.play(costStage.to(4, { duration: Math.min(0.25, d) })), {
    after: true,
    dur: 0.3,
  });

  // Switch cleanly to View 2 on 'rack'
  c.hide('rack', title1, { fade: 0.2 });
  playCue(s, c, 'rack', (d) => s.play(swapVis(vMap, vRank, d)), { dur: 0.65 });
  playCue(s, c, 'waiting', (d) => s.play(showWaiting.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'ask', (d) => s.play(showAsk.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'fit', (d) => s.play(showFit.to(1, { duration: d })), { after: true, dur: 0.4 });
  playCue(s, c, 'fill', (d) => s.play(fillC.to(shortMiB, { duration: d })), {
    after: true,
    dur: 0.6,
  });
  playCue(s, c, 'wait', (d) => s.play(showWait.to(1, { duration: d })), { after: true, dur: 0.4 });
  playCue(s, c, 'growth', (d) => s.play(showGrowth.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
}
