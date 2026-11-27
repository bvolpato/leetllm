// Scene 16: How long until the answer starts? (Serial TTFT, joint p95, and parallel fan-out tail)
import {
  COSMOS,
  FANOUT_ALL_THREE_PROB,
  FANOUT_SINGLE_PROB,
  LATENCY_STAGES,
  LATENCY_TRACES,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  meterBar,
  nearestRank,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function latencyWaterfall(s, c) {
  const act = s.value(0); // 0 = serial TTFT, 1 = 20-req p95, 2 = parallel fan-out
  const stageCount = s.value(0); // 0 .. 5
  const showTtft = s.value(0);
  const showSort = s.value(0);
  const showP95 = s.value(0);
  const showFanout = s.value(0);

  const bgAura = aura(0, 10, 720, '#10345c26', '#2a1a4e18');
  const title = heroTitle(['How Long Until the', 'Answer Starts?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'LATENCY WATERFALL · TTFT, JOINT p95 & PARALLEL FAN-OUT TAIL',
  });

  const ttftTotal = LATENCY_STAGES.reduce((sum, st) => sum + st.ms, 0);
  const sortedTraces = [...LATENCY_TRACES].sort((a, b) => a.total - b.total);
  const p95Total = nearestRank(sortedTraces.map((r) => r.total));
  const p95Rank = Math.ceil(sortedTraces.length * 0.95);
  const stageColors = [COSMOS.blue, COSMOS.cyan, COSMOS.emerald, COSMOS.gold, COSMOS.rose];

  const live = guardedDynamic(s.value(1), () => {
    const activeAct = Math.round(act.value);
    const sc = stageCount.value;
    const sTtft = showTtft.value;
    const sSort = showSort.value;
    const sP95 = showP95.value;
    const sFan = showFanout.value;

    const nodes = [];

    if (activeAct === 0) {
      // ACT 1: Serial TTFT waterfall (120 + 20 + 25 + 50 + 180 = 395 ms)
      const done = sTtft > 0.5;
      nodes.push(
        txt(
          'ONE UNCACHED REQUEST · SERIAL STAGES TO FIRST TOKEN',
          -855,
          -214,
          26,
          COSMOS.cyan,
          'mono',
          'left',
        ),
      );

      let elapsed = 0;
      const barLeft = -820;
      const barSpan = 1640;
      LATENCY_STAGES.forEach((stage, i) => {
        const cx = -660 + i * 330;
        const active = sc >= i + 0.4;
        const segW = (barSpan * stage.ms) / ttftTotal;
        const segX = barLeft + (barSpan * elapsed) / ttftTotal;
        nodes.push(
          glassCell(cx, -104, 300, 126, active ? stageColors[i] : COSMOS.dim, {
            fill: active ? '#10203a' : '#101729',
            glow: active ? 7 : 2,
          }),
          txt(stage.id.toUpperCase(), cx, -132, 26, stageColors[i], 'mono'),
          txt(`${stage.ms} ms`, cx, -80, 38, active ? COSMOS.ink : COSMOS.muted, 'mono'),
          rect(segW - 4, 68, { fill: stageColors[i], radius: 6 })
            .opacity(active ? 0.95 : 0.22)
            .glow(active ? 8 : 0, stageColors[i])
            .at(segX + segW / 2, 48),
        );
        elapsed += stage.ms;
      });

      // Waterfall rail + TTFT readout (withheld until c.after('qx-ttft-result'))
      nodes.push(
        glassCell(0, 212, 1020, 146, done ? COSMOS.gold : COSMOS.muted, {
          fill: done ? '#262010' : '#10182d',
          glow: done ? 10 : 3,
        }),
        txt('TIME TO FIRST DELIVERED TOKEN (TTFT)', 0, 170, 26, COSMOS.muted, 'mono'),
        txt(
          done ? `${ttftTotal} ms` : 'Total = ?',
          0,
          232,
          56,
          done ? COSMOS.gold : COSMOS.cyan,
          'mono',
        ),
        glowDot(-840, 368, { radius: 6, color: done ? COSMOS.gold : COSMOS.cyan }),
        txt(
          done
            ? '120 + 20 + 25 + 50 + 180 = 395 ms before the rest of the answer streams'
            : 'Every rewrite, embedding, retrieval, and rerank stage adds to TTFT',
          -812,
          370,
          28,
          done ? COSMOS.gold : COSMOS.cyan,
          'sans',
          'left',
        ),
      );
      return group(...nodes);
    }

    if (activeAct === 1) {
      // ACT 2: 20 requests x 2 serial stages -> nearest-rank p95 at rank 19
      const sorted = sSort > 0.4;
      const done = sP95 > 0.5;
      const baseY = 266;
      const scale = 1.8;

      nodes.push(
        txt(
          '20 REQUESTS · TWO SERIAL STAGES (A + B IN MS) · SORTED BY TOTAL',
          -855,
          -214,
          26,
          COSMOS.cyan,
          'mono',
          'left',
        ),
        glassCell(-555, -124, 560, 106, COSMOS.blue, { fill: '#10203a', glow: 3 }),
        txt('Requests 1..18:  10 + 10 = 20 ms', -555, -144, 26, COSMOS.ink, 'mono'),
        txt('Stage A p95 = 10 ms  |  Stage B p95 = 10 ms', -555, -100, 26, COSMOS.muted, 'sans'),

        glassCell(15, -124, 520, 106, sorted ? COSMOS.gold : COSMOS.muted, {
          fill: '#141c32',
          glow: sorted ? 8 : 2,
        }),
        txt('#19: 100+10  |  #20: 10+100', 15, -144, 26, COSMOS.gold, 'mono'),
        txt(`Rank ceil(0.95 x 20) = #${p95Rank}`, 15, -100, 26, COSMOS.cyan, 'mono'),

        glassCell(580, -124, 540, 106, done ? COSMOS.rose : COSMOS.gold, {
          fill: done ? '#2a121c' : '#10182d',
          glow: done ? 10 : 3,
        }),
        txt(
          done ? `19th total = ${p95Total} ms` : '19th sorted total = ?',
          580,
          -144,
          30,
          done ? COSMOS.rose : COSMOS.gold,
          'mono',
        ),
        txt(
          done ? 'Naive sum (10+10 = 20 ms) misses stalls!' : 'Sum per request before taking p95',
          580,
          -100,
          26,
          COSMOS.muted,
          'sans',
        ),
      );

      // 20 stacked bars
      sortedTraces.forEach((row, i) => {
        const bx = -790 + i * 82;
        const hA = row.a * scale;
        const hB = row.b * scale;
        const isRank19 = i === p95Rank - 1;
        nodes.push(
          rect(54, hA, { fill: COSMOS.blue, radius: 3 }).at(bx, baseY - hA / 2),
          rect(54, hB, { fill: COSMOS.cyan, radius: 3 }).at(bx, baseY - hA - hB / 2),
          txt(
            String(i + 1),
            bx,
            baseY + 34,
            26,
            isRank19 && (sorted || done) ? COSMOS.gold : COSMOS.muted,
            'mono',
          ),
        );
        if (isRank19 && sorted) {
          nodes.push(
            txt(done ? `${p95Total}` : '?', bx, baseY - hA - hB - 28, 30, COSMOS.gold, 'mono'),
          );
        }
      });

      nodes.push(
        glowDot(-840, 368, { radius: 6, color: done ? COSMOS.rose : COSMOS.gold }),
        txt(
          done
            ? 'Two different requests stalled: joint p95 is 110 ms, not 10 + 10 = 20 ms'
            : 'Stage A and Stage B each have p95 = 10 ms: how long did request #19 take?',
          -812,
          370,
          28,
          done ? COSMOS.rose : COSMOS.gold,
          'sans',
          'left',
        ),
      );
      return group(...nodes);
    }

    // ACT 3: Parallel 3-search fan-out tail probability
    const fanDone = sFan > 0.5;
    nodes.push(
      txt(
        'PARALLEL FAN-OUT · 3 INDEPENDENT SEARCHES · 25 MS DEADLINE',
        -855,
        -214,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
    );

    for (let i = 0; i < 3; i++) {
      const cx = -570 + i * 570;
      nodes.push(
        glassCell(cx, -52, 530, 210, COSMOS.cyan, { fill: '#10203a', glow: 6 }),
        txt(`SEARCH ${i + 1}`, cx, -112, 28, COSMOS.cyan, 'mono'),
        meterBar(cx - 210, -48, 420, 34, FANOUT_SINGLE_PROB, COSMOS.cyan),
        txt('P(<= 25 ms) = 0.95', cx, 12, 30, COSMOS.ink, 'mono'),
      );
    }

    nodes.push(
      glassCell(0, 198, 1380, 166, fanDone ? COSMOS.amber : COSMOS.gold, {
        fill: fanDone ? '#261b10' : '#10182d',
        glow: fanDone ? 10 : 4,
      }),
      txt(
        'ALL THREE MUST FINISH BEFORE FUSION (WAIT FOR SLOWEST)',
        0,
        152,
        26,
        COSMOS.muted,
        'mono',
      ),
      txt(
        fanDone
          ? `P(all 3 on time) = 0.95 x 0.95 x 0.95 = ${FANOUT_ALL_THREE_PROB.toFixed(3)}  (14.3% miss)`
          : 'P(all 3 on time) = 0.95 x 0.95 x 0.95 = ?',
        0,
        222,
        36,
        fanDone ? COSMOS.amber : COSMOS.gold,
        'mono',
      ),
      glowDot(-840, 368, { radius: 6, color: fanDone ? COSMOS.amber : COSMOS.gold }),
      txt(
        fanDone
          ? 'Parallel fan-out amplifies tail risk; measure end-to-end fan-out including fusion'
          : 'When waiting for all three parallel searches, the slowest branch sets latency',
        -812,
        370,
        28,
        fanDone ? COSMOS.amber : COSMOS.gold,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('time-0', () => s.play(stageCount.to(1, { duration: 0.3 })));
  c.on('time-1', () => s.play(stageCount.to(2, { duration: 0.3 })));
  c.on('time-2', () => s.play(stageCount.to(3, { duration: 0.3 })));
  c.on('time-3', () => s.play(stageCount.to(4, { duration: 0.3 })));
  c.on('time-4', () => s.play(stageCount.to(5, { duration: 0.3 })));
  c.after('qx-ttft-result', () => s.play(showTtft.to(1, { duration: 0.45 })));
  c.onBeat(1, () => s.play(act.to(1, { duration: 0.3 })));
  c.on('latency-sort', () => s.play(showSort.to(1, { duration: 0.4 })));
  c.after('qx-percentile-result', () => s.play(showP95.to(1, { duration: 0.45 })));
  c.onBeat(3, () => s.play(act.to(2, { duration: 0.3 })));
  c.after('qx-fanout-result', () =>
    s.play(showFanout.to(1, { duration: remainDuration(c, 'qx-fanout-result', 0.45) })),
  );
}
