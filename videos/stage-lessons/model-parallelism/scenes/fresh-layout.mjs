// Scene 31: Will this request fit on both GPUs? Finale with THREE strict prediction holds: (1) new input [-1,3] sum vs mean; (2) 46 GB placement [31, 15] vs 29 GB cap -> -2 GB short / +14 GB spare; (3) move 8 GB -> [23, 23] -> 6 GB free on each!
import {
  COSMOS,
  DENSE_FRESH,
  PLACE_FRESH_BAL,
  PLACE_FRESH_INIT,
  ROLE,
  aura,
  fmtVec,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  mpFresh,
  poolGB,
  rect,
  remainAfterDuration,
  remainDuration,
  swapViews,
  txt,
} from '../parts.mjs';

export default function freshLayout(s, c) {
  const showPartials = s.value(1);
  const showMemory = s.value(0);

  const pInput = s.value(0);
  const pSum = s.value(0);
  const pResult = s.value(0);
  const pRank0 = s.value(0);
  const pRank1 = s.value(0);
  const pDeficit = s.value(0);
  const pRepair = s.value(0);
  const pSix = s.value(0);

  const bgAura = aura(0, 20, 620, '#6ee7b71c', '#ffd16618');
  const title = heroTitle(['Will This Request Fit', 'on Both GPUs?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.good,
    eyebrow: 'FINALE TRANSFER · NEW INPUT & PER-RANK REPAIR',
  });

  const partialsView = guardedDynamic(showPartials, (a) => {
    const inp = pInput.value > 0.4;
    const sm = pSum.value > 0.5;
    const rs = pResult.value > 0.5;

    const nodes = [
      txt(
        'NEW INPUT x = [−1, 3]  ·  SAME A, GeLU, B, AND BIAS [0.5, −0.5]',
        0,
        -210,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),
    ];

    mpFresh.partials.forEach((part, rank) => {
      const cx = rank === 0 ? -430 : 430;
      const col = rank === 0 ? ROLE.gpu0 : ROLE.gpu1;
      nodes.push(
        glassCell(cx, -50, 760, 195, inp ? col : COSMOS.dim, {
          fill: rank === 0 ? '#10213d' : '#0e2b38',
          glow: inp ? 9 : 3,
          opacity: a,
        }),
        txt(`GPU ${rank} PARTIAL`, cx, -104, 28, col, 'mono').opacity(a),
        txt(inp ? fmtVec(part, 4) : '[ · , · ]', cx, -28, 44, COSMOS.ink, 'mono').opacity(a),
      );
    });

    nodes.push(
      glassCell(0, 128, 720, 74, COSMOS.gold, { fill: '#221c0e', glow: 6, opacity: a }),
      txt('Output bias   b = [0.5, −0.5]', 0, 128, 30, COSMOS.gold, 'mono').opacity(a),
    );

    const foot = rs
      ? `Dense & sharded match ≈ ${fmtVec(DENSE_FRESH, 4)} (coord 2 ≈ 15.5)`
      : sm
        ? 'Take their SUM, then add bias once!'
        : 'Predict: take the SUM or MEAN of the two partials before adding bias?';

    nodes.push(
      glassCell(0, 285, 1480, 92, rs ? ROLE.good : COSMOS.gold, {
        fill: rs ? '#0d2924' : '#10182b',
        glow: 9,
        opacity: a,
      }),
      txt(foot, 0, 285, 30, rs ? ROLE.good : COSMOS.gold, 'mono').opacity(a),
    );
    return group(...nodes);
  });

  const memoryView = guardedDynamic(showMemory, (a) => {
    const r0 = pRank0.value;
    const r1 = pRank1.value;
    const def = pDeficit.value > 0.5;
    const rep = pRepair.value;
    const moving = rep > 0.02 && rep < 0.98;
    const six = pSix.value > 0.5;

    const movedGB = PLACE_FRESH_INIT.values[0] - PLACE_FRESH_BAL.values[0]; // 8 GB
    const baseY = 205;
    const scale = 10.2; // 29 GB = 295.8 px, 31 GB = 316.2 px
    const limitY = baseY - poolGB * scale;
    const xs = [110, 560];
    const barW = 240;

    const vals =
      rep >= 0.98
        ? PLACE_FRESH_BAL.values
        : moving
          ? [PLACE_FRESH_BAL.values[0], PLACE_FRESH_INIT.values[1]]
          : PLACE_FRESH_INIT.values;

    const nodes = [
      // Left summary column
      txt('REQUEST HISTORY', -820, -175, 28, COSMOS.muted, 'mono', 'left').opacity(a),
      txt(`${PLACE_FRESH_INIT.groupTotal} GB`, -820, -90, 96, COSMOS.ink, 'mono', 'left')
        .glow(8, ROLE.gpu1)
        .opacity(a),
      txt(
        `Pooled free: ${PLACE_FRESH_INIT.groupCapacity} GB (29 + 29)`,
        -820,
        -8,
        28,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(a),

      glassCell(-520, 128, 600, 148, ROLE.good, { fill: '#0d2622', glow: 8, opacity: a }),
      txt('VERIFIED LAYER OUTPUT', -520, 92, 26, ROLE.good, 'mono').opacity(a),
      txt(`≈ ${fmtVec(DENSE_FRESH, 4)}`, -520, 152, 34, COSMOS.ink, 'mono').opacity(a),

      // 29 GB cap label cleanly between bars
      txt(`${poolGB} GB CAP`, 335, limitY, 26, COSMOS.gold, 'mono').glow(5, COSMOS.gold).opacity(a),
    ];

    xs.forEach((cx, rank) => {
      const assigned = def || rep > 0.02 ? 1 : rank === 0 ? r0 : r1;
      const val = vals[rank];
      const h = val * scale * assigned;
      const col = rank === 0 ? ROLE.gpu0 : ROLE.gpu1;
      const fill = rank === 0 ? '#122c52' : '#0e3240';

      // Baseline & cap ticks beside bar (never crossing bar text)
      nodes.push(
        line([cx - barW * 0.5 - 18, baseY], [cx + barW * 0.5 + 18, baseY], {
          stroke: COSMOS.muted,
          width: 3.0,
        }).opacity(a),
        line([cx - barW * 0.5 - 24, limitY], [cx - barW * 0.5 - 4, limitY], {
          stroke: COSMOS.gold,
          width: 4.5,
        })
          .glow(6, COSMOS.gold)
          .opacity(a),
        line([cx + barW * 0.5 + 4, limitY], [cx + barW * 0.5 + 24, limitY], {
          stroke: COSMOS.gold,
          width: 4.5,
        })
          .glow(6, COSMOS.gold)
          .opacity(a),
        txt(`GPU ${rank}`, cx, baseY + 42, 28, col, 'mono').opacity(a),
      );

      if (h > 4) {
        const barStroke = six
          ? ROLE.good
          : def && !moving && rep < 0.5 && rank === 0
            ? ROLE.bad
            : col;
        nodes.push(
          rect(barW, h, { fill, stroke: barStroke, width: 2.8, radius: 8 })
            .at(cx, baseY - h * 0.5)
            .glow(8, barStroke)
            .opacity(a),
        );
        if (assigned > 0.85 && !moving) {
          nodes.push(txt(`${val} GB`, cx, baseY - h * 0.5, 32, COSMOS.ink, 'mono').opacity(a));
        }
      }

      if (six) {
        nodes.push(
          txt(`${PLACE_FRESH_BAL.free[rank]} GB free`, cx, baseY + 86, 28, ROLE.good, 'mono')
            .glow(6, ROLE.good)
            .opacity(a),
        );
      } else if (def && rep < 0.02) {
        const fr = PLACE_FRESH_INIT.free[rank];
        nodes.push(
          txt(
            fr < 0 ? `${-fr} GB short!` : `${fr} GB spare`,
            cx,
            baseY + 86,
            28,
            fr < 0 ? ROLE.bad : ROLE.good,
            'mono',
          ).opacity(a),
        );
      }
    });

    // Moving 8 GB repair block arcing from GPU 0 to GPU 1
    if (moving) {
      const lift = Math.min(1, rep * 4);
      const slide = Math.max(0, Math.min(1, (rep - 0.25) * 2));
      const land = Math.max(0, (rep - 0.75) * 4);
      const startY = baseY - PLACE_FRESH_INIT.values[0] * scale + movedGB * scale * 0.5;
      const endY = baseY - PLACE_FRESH_BAL.values[1] * scale + movedGB * scale * 0.5;
      const topY = -165;
      const mx = xs[0] + (xs[1] - xs[0]) * slide;
      const my = startY + (topY - startY) * lift + (endY - topY) * land;
      nodes.push(
        rect(barW, movedGB * scale, { fill: '#2c220e', stroke: COSMOS.gold, width: 3.0, radius: 8 })
          .at(mx, my)
          .glow(10, COSMOS.gold)
          .opacity(a),
        txt(`8 GB`, mx, my, 28, COSMOS.gold, 'mono').opacity(a),
      );
    }

    // Top-right status prompt (strictly withholding answers!)
    const prompt = six
      ? 'Fits both GPUs (23/29 GB each -> 6 GB free) · choose lowest $/useful token passing TTFT & TPOT'
      : rep >= 0.98
        ? 'Moved 8 GB to GPU 1 (23 GB each) · Predict: how much room remains on each GPU?'
        : def
          ? 'GPU 0 is 2 GB short · GPU 1 has 14 GB spare'
          : 'Predict: with 29 GB free each, which GPU is short and by how much?';

    nodes.push(
      glassCell(0, 365, 1620, 70, six ? ROLE.good : COSMOS.gold, {
        fill: '#10182b',
        glow: 8,
        opacity: a,
      }),
      txt(prompt, 0, 365, 26, six ? ROLE.good : COSMOS.gold, 'sans').opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, partialsView, memoryView);

  c.after('mp-fresh-layout-input', () =>
    s.play(pInput.to(1, { duration: remainAfterDuration(c, 'mp-fresh-layout-input', 0.4) })),
  );
  c.after('mp-fresh-layout-sum', () =>
    s.play(pSum.to(1, { duration: remainAfterDuration(c, 'mp-fresh-layout-sum', 0.4) })),
  );
  c.after('mp-fresh-layout-result', () =>
    s.play(pResult.to(1, { duration: remainAfterDuration(c, 'mp-fresh-layout-result', 0.4) })),
  );
  c.on('mp-fresh-layout-placement', () => {
    const d = Math.min(0.16, remainDuration(c, 'mp-fresh-layout-placement', 0.16));
    swapViews(s, showPartials, showMemory, d, d);
  });
  c.on('mp-fresh-layout-rank-zero', () =>
    s.play(pRank0.to(1, { duration: remainDuration(c, 'mp-fresh-layout-rank-zero', 0.55) })),
  );
  c.on('mp-fresh-layout-rank-one', () =>
    s.play(pRank1.to(1, { duration: remainDuration(c, 'mp-fresh-layout-rank-one', 0.55) })),
  );
  c.after('mp-fresh-layout-deficit', () =>
    s.play(pDeficit.to(1, { duration: remainAfterDuration(c, 'mp-fresh-layout-deficit', 0.4) })),
  );
  c.on('mp-fresh-layout-repair', () =>
    s.play(pRepair.to(1, { duration: remainDuration(c, 'mp-fresh-layout-repair', 1.1) })),
  );
  c.after('mp-fresh-layout-six', () =>
    s.play(pSix.to(1, { duration: remainAfterDuration(c, 'mp-fresh-layout-six', 0.4) })),
  );
}
