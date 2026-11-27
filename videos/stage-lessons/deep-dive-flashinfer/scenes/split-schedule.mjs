// Scene 18: Place chunks and merge on an execution clock: 4 chunks of 4 on 4 lanes (5, 3.2x) vs 2 lanes (9) + CTA trade-offs.
import {
  COSMOS,
  ROLE,
  SPLIT_2LANE_FINISH,
  SPLIT_4LANE_FINISH,
  SPLIT_4LANE_SPEEDUP,
  SPLIT_SERIAL,
  aura,
  delay,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  par,
  rect,
  remainAfter,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function splitSchedule(s, c) {
  const showClock = s.value(1);
  const laneMode = s.value(0); // 0=4 lanes, 1=2 lanes
  const show4Res = s.value(0);
  const show4Speed = s.value(0);
  const show2Res = s.value(0);
  const showTrade = s.value(0);
  const benchReady = s.value(0);

  const bgAura = aura(0, 20, 660, '#5ce1e61c', '#6ee7b71a');

  const title = heroTitle(['Place Chunks & Merge', 'on a Clock'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.r2,
    eyebrow: 'SPLIT-KV SCHEDULING · CRITICAL PATH',
    subtitle: `Serial = ${SPLIT_SERIAL} units · 4 chunks × 4 units + dependent 1-unit merge`,
  });

  // Shared timeline ruler: t in [0, 10] mapped to x in [-660, 740]
  const mapT = (t) => -660 + (t / 10) * 1400;

  const clockView = guardedDynamic(showClock, (a) => {
    const twoLane = laneMode.value > 0.5;
    const r4 = show4Res.value;
    const sp4 = show4Speed.value;
    const r2 = show2Res.value;

    const nodes = [
      txt(
        twoLane
          ? '2 AVAILABLE WORKER LANES (2 WAVES + MERGE)'
          : '4 AVAILABLE WORKER LANES (1 WAVE + MERGE)',
        0,
        -165,
        28,
        twoLane ? ROLE.warn : ROLE.r2,
        'mono',
      ).opacity(a),
      line([mapT(0), 215], [mapT(10), 215], { stroke: COSMOS.rule, width: 3 }).opacity(a),
    ];

    for (let t = 0; t <= 10; t++) {
      const tx = mapT(t);
      nodes.push(
        line([tx, 205], [tx, 225], { stroke: COSMOS.muted, width: 2.5 }).opacity(a),
        txt(String(t), tx, 252, 26, COSMOS.muted, 'mono').opacity(a),
      );
    }

    if (!twoLane) {
      // 4 parallel chunks on Lanes 0..3 from t=0..4, then 1-unit merge at t=4..5
      for (let ln = 0; ln < 4; ln++) {
        const y = -95 + ln * 74;
        const x0 = mapT(0);
        const x1 = mapT(4);
        nodes.push(
          txt(`Lane ${ln}`, -765, y, 26, ROLE.r0, 'mono').opacity(a),
          rect(x1 - x0 - 6, 54, { fill: '#12315c', stroke: ROLE.r0, width: 2.4, radius: 8 })
            .at((x0 + x1) * 0.5, y)
            .glow(6, ROLE.r0)
            .opacity(a),
          txt(`Chunk ${ln} (4u)`, (x0 + x1) * 0.5, y, 26, COSMOS.ink, 'mono').opacity(a),
        );
      }
      if (r4 > 0.05) {
        const mx0 = mapT(4);
        const mx1 = mapT(5);
        nodes.push(
          rect(mx1 - mx0 - 6, 260, { fill: '#0f382e', stroke: ROLE.good, width: 3.0, radius: 10 })
            .at((mx0 + mx1) * 0.5, 16)
            .glow(10, ROLE.good)
            .opacity(r4 * a),
          txt('M', (mx0 + mx1) * 0.5, 16, 32, ROLE.good, 'mono').opacity(r4 * a),
          txt('t = 5', mx1 + 65, 16, 30, ROLE.good, 'mono')
            .glow(6, ROLE.good)
            .opacity(r4 * a),
        );
      }
    } else {
      // 2 lanes: Wave 1 (Chunks 0,1 at t=0..4), Wave 2 (Chunks 2,3 at t=4..8), Merge at t=8..9
      const rows = [
        { ln: 0, y: -55, c0: 'Chunk 0 (4u)', c1: 'Chunk 2 (4u)' },
        { ln: 1, y: 65, c0: 'Chunk 1 (4u)', c1: 'Chunk 3 (4u)' },
      ];
      rows.forEach((rw) => {
        const x0 = mapT(0);
        const x4 = mapT(4);
        const x8 = mapT(8);
        nodes.push(
          txt(`Lane ${rw.ln}`, -765, rw.y, 26, ROLE.r0, 'mono').opacity(a),
          rect(x4 - x0 - 8, 76, { fill: '#12315c', stroke: ROLE.r0, width: 2.4, radius: 8 })
            .at((x0 + x4) * 0.5, rw.y)
            .opacity(a),
          txt(rw.c0, (x0 + x4) * 0.5, rw.y, 26, COSMOS.ink, 'mono').opacity(a),
          rect(x8 - x4 - 8, 76, { fill: '#2a1d4f', stroke: ROLE.violet, width: 2.4, radius: 8 })
            .at((x4 + x8) * 0.5, rw.y)
            .glow(6, ROLE.violet)
            .opacity(a),
          txt(rw.c1, (x4 + x8) * 0.5, rw.y, 26, COSMOS.ink, 'mono').opacity(a),
        );
      });
      if (r2 > 0.05) {
        const mx0 = mapT(8);
        const mx1 = mapT(9);
        nodes.push(
          rect(mx1 - mx0 - 6, 196, { fill: '#0f382e', stroke: ROLE.warn, width: 3.0, radius: 10 })
            .at((mx0 + mx1) * 0.5, 5)
            .glow(10, ROLE.warn)
            .opacity(r2 * a),
          txt('M', (mx0 + mx1) * 0.5, 5, 32, ROLE.warn, 'mono').opacity(r2 * a),
          txt('t = 9', mx1 + 65, 5, 30, ROLE.warn, 'mono')
            .glow(6, ROLE.warn)
            .opacity(r2 * a),
        );
      }
    }

    // Bottom readout
    let summary = '4 chunks × 4 cost units launch concurrently';
    let sCol = ROLE.r2;
    if (!twoLane && sp4 > 0.5) {
      summary = `4 lanes: finish = ${SPLIT_4LANE_FINISH}u -> idealized speedup = ${SPLIT_SERIAL} / ${SPLIT_4LANE_FINISH} = ${SPLIT_4LANE_SPEEDUP.toFixed(1)}×`;
      sCol = ROLE.good;
    } else if (!twoLane && r4 > 0.5) {
      summary = `All 4 chunks end at t=4; dependent 1-unit merge finishes at t=${SPLIT_4LANE_FINISH}`;
      sCol = COSMOS.gold;
    } else if (twoLane && r2 > 0.5) {
      summary = `2 lanes: 2 waves (8u) + 1u merge = ${SPLIT_2LANE_FINISH}u (extra 4u from Wave 2)`;
      sCol = ROLE.warn;
    }

    nodes.push(
      glassCell(0, 355, 1560, 108, sCol, { fill: '#0e172a', glow: 8, opacity: a }),
      txt(summary, 0, 355, 30, sCol, 'mono').glow(5, sCol).opacity(a),
    );

    return group(...nodes);
  });

  // View 1: Real GPU CTA scheduling trade-offs
  const tradeView = guardedDynamic(showTrade, (a) => {
    const br = benchReady.value;
    const cols = [
      {
        cx: -555,
        h: 'CTA = CUDA THREAD BLOCK',
        l1: 'Parallelism also comes from',
        l2: 'query tiles & attention heads',
        col: ROLE.r0,
      },
      {
        cx: 0,
        h: 'TINY KV CHUNKS',
        l1: 'Cut long-sequence tail,',
        l2: 'but raise scratch & merge cost',
        col: ROLE.warn,
      },
      {
        cx: 555,
        h: 'OCCUPANCY != GOAL',
        l1: 'Max occupancy can hurt',
        l2: 'register headroom & tile reuse',
        col: ROLE.violet,
      },
    ];

    const nodes = [
      txt('REAL GPU SPLIT-KV TRADE-OFFS', 0, -155, 28, COSMOS.cyan, 'mono').opacity(a),
    ];

    cols.forEach((cl) => {
      nodes.push(
        glassCell(cl.cx, 45, 490, 240, cl.col, { fill: '#0e172a', glow: 8, opacity: a }),
        txt(cl.h, cl.cx, -25, 26, cl.col, 'mono').opacity(a),
        txt(cl.l1, cl.cx, 35, 26, COSMOS.ink, 'sans').opacity(a),
        txt(cl.l2, cl.cx, 85, 26, COSMOS.muted, 'sans').opacity(a),
      );
    });

    if (br > 0.05) {
      nodes.push(
        glassCell(0, 295, 1600, 118, ROLE.good, { fill: '#0e2824', glow: 9, opacity: br * a }),
        txt(
          'Benchmark split thresholds on your actual length distribution and target GPU',
          0,
          295,
          28,
          ROLE.good,
          'mono',
        ).opacity(br * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, clockView, tradeView);

  c.on('fi-split-schedule-0', () =>
    s.play(show4Res.to(0.2, { duration: remainDuration(c, 'fi-split-schedule-0', 0.35) })),
  );
  c.on('fi-split-schedule-four', () =>
    s.play(show4Res.to(1, { duration: remainDuration(c, 'fi-split-schedule-four', 0.45) })),
  );
  c.on('fi-split-schedule-speed', () =>
    s.play(show4Speed.to(1, { duration: remainDuration(c, 'fi-split-schedule-speed', 0.4) })),
  );
  c.after('fi-split-schedule-0-result', () =>
    s.play(show4Speed.to(1, { duration: remainAfter(c, 'fi-split-schedule-0-result', 0.25) })),
  );
  c.on('fi-split-schedule-1', () =>
    s.play(laneMode.to(1, { duration: remainDuration(c, 'fi-split-schedule-1', 0.45) })),
  );
  c.on('fi-split-schedule-two', () =>
    s.play(show2Res.to(1, { duration: remainDuration(c, 'fi-split-schedule-two', 0.45) })),
  );
  c.after('fi-split-schedule-1-result', () =>
    s.play(show2Res.to(1, { duration: remainAfter(c, 'fi-split-schedule-1-result', 0.25) })),
  );
  c.on('fi-split-schedule-2', () => {
    s.play(
      par(showClock.to(0, { duration: 0.18 }), delay(showTrade.to(1, { duration: 0.22 }), 0.2)),
    );
  });
  c.on('fi-split-schedule-2-result', () =>
    s.play(benchReady.to(1, { duration: remainDuration(c, 'fi-split-schedule-2-result', 0.4) })),
  );
}
