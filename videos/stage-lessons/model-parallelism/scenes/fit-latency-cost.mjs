// Scene 28: Which layout meets both latency targets? TP1 OOM, TP2 (310ms/45ms) vs TP4 (430ms/62ms) vs limits (400ms/55ms) - STRICT HOLD until gate! Then cost/M useful tokens ($6/hr @ 620 -> $2.69/M vs $12/hr @ 900 -> $3.70/M).
import {
  COST_A,
  COST_B,
  COSMOS,
  ROLE,
  aura,
  fmtFixed,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainAfterDuration,
  remainDuration,
  swapViews,
  txt,
} from '../parts.mjs';

export default function fitLatencyCost(s, c) {
  const showLatency = s.value(1);
  const showCost = s.value(0);

  const p0 = s.value(0);
  const pFit = s.value(0);
  const pTwo = s.value(0);
  const pFour = s.value(0);
  const pGate = s.value(0);
  const pRank = s.value(0);
  const pHourly = s.value(0);
  const pDivide = s.value(0);
  const pA = s.value(0);
  const pB = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1c', '#6ee7b716');
  const title = heroTitle(['Which Layout Meets', 'Both Latency Targets?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'FIT -> p95 LATENCY TARGETS -> $/MILLION USEFUL TOKENS',
  });

  const latencyView = guardedDynamic(showLatency, (a) => {
    const fit = pFit.value > 0.3 || p0.value > 0.3;
    const t2 = pTwo.value > 0.5;
    const t4 = pFour.value > 0.5;
    const gt = pGate.value > 0.5;
    const rk = pRank.value > 0.5;

    const ttftX = -500;
    const ttftW = 540;
    const ttftLim = ttftX + (400 / 500) * ttftW;

    const tpotX = 210;
    const tpotW = 420;
    const tpotLim = tpotX + (55 / 75) * tpotW;

    const nodes = [
      txt('FIRST TOKEN (p95 ≤ 400 ms)', ttftX + ttftW * 0.5, -205, 28, COSMOS.ink, 'mono').opacity(
        a,
      ),
      txt(
        'PER OUTPUT TOKEN (p95 ≤ 55 ms)',
        tpotX + tpotW * 0.5,
        -205,
        28,
        COSMOS.ink,
        'mono',
      ).opacity(a),

      // TP=1 OOM row
      txt('TP = 1', -770, -110, 30, ROLE.bad, 'mono', 'left').opacity(a),
      glassCell(60, -110, 1140, 68, ROLE.bad, {
        fill: '#301120',
        glow: fit ? 9 : 4,
        opacity: a,
      }),
      txt(
        'OUT OF MEMORY: 70 GB weights + 16 GB reserve exceed 80 GB card',
        60,
        -110,
        28,
        ROLE.bad,
        'mono',
      ).opacity(a),
    ];

    const cands = [
      { label: 'TP = 2', ttft: 310, tpot: 45, rev: t2, pass: true, y: 20 },
      { label: 'TP = 4', ttft: 430, tpot: 62, rev: t4, pass: false, y: 170 },
    ];

    cands.forEach((cand) => {
      // Keep neutral blue/cyan colors before verdict cue so zero color leak!
      const barCol1 = gt ? (cand.pass ? ROLE.good : ROLE.bad) : ROLE.gpu0;
      const barCol2 = gt ? (cand.pass ? ROLE.good : ROLE.bad) : ROLE.gpu1;
      const barFill1 = gt ? (cand.pass ? '#0d2b24' : '#321222') : '#122b52';
      const barFill2 = gt ? (cand.pass ? '#0d2b24' : '#321222') : '#0e3240';

      nodes.push(
        txt(cand.label, -770, cand.y, 30, COSMOS.ink, 'mono', 'left').opacity(a),
        // TTFT track
        rect(ttftW, 66, { fill: '#0b1222', stroke: COSMOS.dim, width: 1.8, radius: 8 })
          .at(ttftX + ttftW * 0.5, cand.y)
          .opacity(a),
        // TPOT track
        rect(tpotW, 66, { fill: '#0b1222', stroke: COSMOS.dim, width: 1.8, radius: 8 })
          .at(tpotX + tpotW * 0.5, cand.y)
          .opacity(a),
      );

      if (cand.rev) {
        const w1 = (cand.ttft / 500) * ttftW;
        const w2 = (cand.tpot / 75) * tpotW;
        nodes.push(
          rect(w1, 66, { fill: barFill1, stroke: barCol1, width: 2.6, radius: 8 })
            .at(ttftX + w1 * 0.5, cand.y)
            .glow(7, barCol1)
            .opacity(a),
          rect(w2, 66, { fill: barFill2, stroke: barCol2, width: 2.6, radius: 8 })
            .at(tpotX + w2 * 0.5, cand.y)
            .glow(7, barCol2)
            .opacity(a),
          txt(`${cand.ttft} ms`, ttftX + ttftW + 20, cand.y, 26, barCol1, 'mono', 'left').opacity(
            a,
          ),
          txt(`${cand.tpot} ms`, tpotX + tpotW + 20, cand.y, 26, barCol2, 'mono', 'left').opacity(
            a,
          ),
        );
      } else {
        nodes.push(
          txt('?', ttftX + ttftW + 24, cand.y, 28, COSMOS.muted, 'mono', 'left').opacity(a),
          txt('?', tpotX + tpotW + 24, cand.y, 28, COSMOS.muted, 'mono', 'left').opacity(a),
        );
      }

      // Limit ticks above and below each bar (never crossing bar text)
      nodes.push(
        line([ttftLim, cand.y - 48], [ttftLim, cand.y - 34], { stroke: COSMOS.gold, width: 3.4 })
          .glow(6, COSMOS.gold)
          .opacity(a),
        line([ttftLim, cand.y + 34], [ttftLim, cand.y + 48], { stroke: COSMOS.gold, width: 3.4 })
          .glow(6, COSMOS.gold)
          .opacity(a),
        line([tpotLim, cand.y - 48], [tpotLim, cand.y - 34], { stroke: COSMOS.gold, width: 3.4 })
          .glow(6, COSMOS.gold)
          .opacity(a),
        line([tpotLim, cand.y + 34], [tpotLim, cand.y + 48], { stroke: COSMOS.gold, width: 3.4 })
          .glow(6, COSMOS.gold)
          .opacity(a),
      );

      if (gt) {
        nodes.push(
          txt(
            cand.pass ? 'PASS' : 'MISS',
            835,
            cand.y,
            28,
            cand.pass ? ROLE.good : ROLE.bad,
            'mono',
            'right',
          )
            .glow(6, cand.pass ? ROLE.good : ROLE.bad)
            .opacity(a),
        );
      }
    });

    const foot = rk
      ? 'Rank passing layouts by useful tok/s · also inspect slowest per-request token gaps'
      : gt
        ? 'TP=2 clears both limits (310 <= 400 ms, 45 <= 55 ms) · TP=4 misses both despite higher tok/s'
        : 'Predict: which layout clears both yellow p95 latency limits?';

    nodes.push(
      glassCell(0, 325, 1540, 82, gt ? ROLE.good : COSMOS.gold, {
        fill: '#10182b',
        glow: 8,
        opacity: a,
      }),
      txt(foot, 0, 325, 26, gt ? ROLE.good : COSMOS.gold, 'sans').opacity(a),
    );
    return group(...nodes);
  });

  const costView = guardedDynamic(showCost, (a) => {
    const hr = pHourly.value > 0.4;
    const dv = pDivide.value > 0.4;
    const ra = pA.value > 0.5;
    const rb = pB.value > 0.5;

    const plans = [
      {
        name: 'LAYOUT A (2 GPUs)',
        price: 6,
        rate: 620,
        cost: COST_A,
        rev: ra,
        cx: -430,
        col: ROLE.gpu0,
        win: true,
      },
      {
        name: 'LAYOUT B (4 GPUs)',
        price: 12,
        rate: 900,
        cost: COST_B,
        rev: rb,
        cx: 430,
        col: ROLE.gpu1,
        win: false,
      },
    ];

    const nodes = [
      txt(
        'UNIT COST FOR TWO LAYOUTS THAT BOTH PASS LATENCY TARGETS',
        0,
        -210,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),
    ];

    plans.forEach((pl) => {
      const tokHr = (pl.rate * 3600).toLocaleString('en-US');
      const border = pl.rev ? (pl.win ? ROLE.good : ROLE.warn) : pl.col;
      nodes.push(
        glassCell(pl.cx, 48, 760, 400, border, {
          fill: pl.win && pl.rev ? '#0d2622' : '#101d34',
          glow: pl.rev ? 10 : 6,
          opacity: a,
        }),
        txt(pl.name, pl.cx, -110, 30, pl.col, 'mono').opacity(a),
        txt(
          `$${pl.price} / hour   ·   ${pl.rate} useful tok/s`,
          pl.cx,
          -42,
          30,
          COSMOS.ink,
          'mono',
        ).opacity(a),
        txt(
          hr ? `× 3,600 s = ${tokHr} tok/hr` : 'Multiply tok/s by 3,600 s/hr...',
          pl.cx,
          36,
          28,
          hr ? COSMOS.gold : COSMOS.muted,
          'mono',
        ).opacity(a),
        txt(
          dv ? `($${pl.price} ÷ ${tokHr}) × 1,000,000` : 'Hourly price ÷ tokens/hr × 1M',
          pl.cx,
          104,
          26,
          COSMOS.muted,
          'mono',
        ).opacity(a),
        txt(
          pl.rev ? `$${fmtFixed(pl.cost, 2)} / 1M tokens` : '$?.?? / 1M tokens',
          pl.cx,
          184,
          44,
          pl.rev ? (pl.win ? ROLE.good : ROLE.warn) : COSMOS.dim,
          'mono',
        )
          .glow(pl.rev ? 8 : 0, pl.win ? ROLE.good : ROLE.warn)
          .opacity(a),
      );
    });

    nodes.push(
      glassCell(0, 330, 1520, 76, rb ? ROLE.good : COSMOS.gold, {
        fill: '#10182b',
        glow: 8,
        opacity: a,
      }),
      txt(
        rb
          ? 'Layout B is faster (900 tok/s) but costs more ($3.70 vs $2.69/M)'
          : 'Compare hourly GPU spend per million useful tokens across passing layouts',
        0,
        330,
        26,
        rb ? ROLE.good : COSMOS.ink,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, latencyView, costView);

  c.on('mp-fit-latency-cost-0', () =>
    s.play(p0.to(1, { duration: remainDuration(c, 'mp-fit-latency-cost-0', 0.35) })),
  );
  c.on('mp-fit-latency-cost-fit', () =>
    s.play(pFit.to(1, { duration: remainDuration(c, 'mp-fit-latency-cost-fit', 0.35) })),
  );
  c.after('mp-fit-latency-cost-two', () =>
    s.play(pTwo.to(1, { duration: remainAfterDuration(c, 'mp-fit-latency-cost-two', 0.4) })),
  );
  c.after('mp-fit-latency-cost-four', () =>
    s.play(pFour.to(1, { duration: remainAfterDuration(c, 'mp-fit-latency-cost-four', 0.4) })),
  );
  c.after('mp-fit-latency-cost-gate', () =>
    s.play(pGate.to(1, { duration: remainAfterDuration(c, 'mp-fit-latency-cost-gate', 0.4) })),
  );
  c.on('mp-fit-latency-cost-1', () =>
    s.play(pRank.to(1, { duration: remainDuration(c, 'mp-fit-latency-cost-1', 0.4) })),
  );
  c.on('mp-fit-latency-cost-2', () => {
    const d = Math.min(0.16, remainDuration(c, 'mp-fit-latency-cost-2', 0.16));
    swapViews(s, showLatency, showCost, d, d);
  });
  c.on('mp-fit-latency-cost-hourly', () =>
    s.play(pHourly.to(1, { duration: remainDuration(c, 'mp-fit-latency-cost-hourly', 0.4) })),
  );
  c.on('mp-fit-latency-cost-divide', () =>
    s.play(pDivide.to(1, { duration: remainDuration(c, 'mp-fit-latency-cost-divide', 0.4) })),
  );
  c.after('mp-fit-latency-cost-a', () =>
    s.play(pA.to(1, { duration: remainAfterDuration(c, 'mp-fit-latency-cost-a', 0.4) })),
  );
  c.after('mp-fit-latency-cost-b', () =>
    s.play(pB.to(1, { duration: remainAfterDuration(c, 'mp-fit-latency-cost-b', 0.4) })),
  );
}
