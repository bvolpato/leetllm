// Scene 9: batching - When can the next request start?
// Act 1: Static vs Continuous Batching 6-step schedule (withholding "Step 3" until after `join`!)
//        + Live 4-slot Paged Pool (4 -> 3 blocks as A releases & C joins).
// Act 2: Longer prompt wait (Queue + Prefill) -> Chunked Prefill (budget 4: 1 decode + 3 prompt x 2)
//        -> Disaggregated Prefill & Decode GPUs with KV link transfer.
import { delay, group, par, rect } from 'vizmatic/stage';
import {
  BATCH_POOL,
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  dashedRule,
  driftValue,
  guardedDynamic,
  memCell,
  txt,
} from '../parts.mjs';

export default function batching(s, c) {
  const act1Vis = s.value(1);
  const act2Vis = s.value(0);
  const phase = s.value(0);

  // Act 1 state
  const staticStep = s.value(0); // 1=waits, 2=idle
  const contStep = s.value(0); // 1=continuous, 2=boundary, 3=ask, 4=join (AFTER!)
  const poolStep = s.value(0); // 1=pool, 2=a, 3=b, 4=four, 5=release, 6=c, 7=six, 8=three, 9=scheduler

  // Act 2 state
  const queueStep = s.value(0); // 1=prompt, 2=queue, 3=prefill, 4=first-token
  const chunkStep = s.value(0); // 1=chunk, 2=decode, 3=first-chunk, 4=last-chunk, 5=scores, 6=latency
  const disaggStep = s.value(0); // 1=separate, 2=transfer

  const act1Header = cinemaHeader('CONTINUOUS BATCHING', 'When can the next', 'request start?', {
    x: -860,
    y: -452,
    accent: ROLE.reqC,
    size: 46,
  });

  const act1Aura = group(aura(-280, 40, 480, '#5ce1e61e'), aura(520, 40, 420, '#6ee7b71e'));

  const act1Dyn = guardedDynamic(act1Vis, (a) => {
    const st = staticStep.value;
    const ct = contStep.value;
    const pl = poolStep.value;
    const ph = phase.value;
    const nodes = [];

    const colX = (step) => -710 + (step - 1) * 140;
    const cellW = 124;
    const cellH = 54;

    // Step column headers (Steps 1..6)
    for (let step = 1; step <= 6; step++) {
      nodes.push(txt(`S${step}`, colX(step), -188, 26, COSMOS.muted, 'mono').opacity(a));
    }

    // 1. Static Batch Schedule (y = -125, -60)
    nodes.push(
      txt('STATIC BATCH', -855, -234, 26, ROLE.waste, 'mono', 'left').opacity(a),
      txt('L1', -825, -125, 26, COSMOS.muted, 'mono').opacity(a),
      txt('L2', -825, -60, 26, COSMOS.muted, 'mono').opacity(a),
    );
    for (let step = 1; step <= 6; step++) {
      const cx = colX(step);
      const isA = step <= 2;
      const showIdle = st >= 1.5 && !isA;
      nodes.push(
        rect(cellW, cellH, {
          fill: isA ? '#102b38' : showIdle ? '#2c1220' : '#0f1628',
          stroke: isA ? ROLE.reqA : showIdle ? ROLE.waste : '#29375a',
          width: 2.0,
          radius: 8,
          ...(isA ? {} : { dash: [5, 5] }),
        })
          .at(cx, -125)
          .opacity(a),
        txt(
          isA ? 'A' : showIdle ? 'IDLE' : '',
          cx,
          -125,
          26,
          isA ? ROLE.reqA : ROLE.waste,
          'mono',
        ).opacity(a),
        rect(cellW, cellH, { fill: '#1e1635', stroke: ROLE.reqB, width: 2.0, radius: 8 })
          .at(cx, -60)
          .opacity(a),
        txt('B', cx, -60, 26, ROLE.reqB, 'mono').opacity(a),
      );
    }
    if (st >= 0.5 && ct < 3.5) {
      nodes.push(
        txt('C waits outside until step 6 ends', -360, 6, 26, ROLE.link, 'sans').opacity(a),
      );
    }

    // 2. Continuous Batching Schedule skeleton visible from start of Act 1, lights up on `continuous`..`join`!
    const cA = a * (ct >= 0.5 ? Math.min(1, ct) : 0.42);
    const pulse = 0.65 + 0.35 * Math.sin(ph * 5.2);
    nodes.push(
      txt('CONTINUOUS BATCHING (ITERATION LEVEL)', -855, 56, 26, ROLE.reqC, 'mono', 'left')
        .glow(ct >= 0.5 ? 5 : 0, ROLE.reqC)
        .opacity(cA),
      txt('L1', -825, 112, 26, COSMOS.muted, 'mono').opacity(cA),
      txt('L2', -825, 178, 26, COSMOS.muted, 'mono').opacity(cA),
    );
    for (let step = 1; step <= 6; step++) {
      const cx = colX(step);
      const isA = ct >= 0.5 && step <= 2;
      const isC = ct >= 3.5 && step >= 3;
      const isAsk = ct >= 2.5 && ct < 3.5 && step === 3;
      nodes.push(
        rect(cellW, cellH, {
          fill: isA ? '#102b38' : isC ? '#0e2d25' : isAsk ? '#2e2510' : '#0f1628',
          stroke: isA ? ROLE.reqA : isC ? ROLE.reqC : isAsk ? ROLE.focus : '#29375a',
          width: isAsk || isC ? 2.6 : 2.0,
          radius: 8,
          ...(isA || isC ? {} : { dash: [5, 5] }),
        })
          .at(cx, 112)
          .opacity(cA * (isAsk ? pulse : 1)),
        txt(
          isA ? 'A' : isC ? 'C' : isAsk ? '?' : '',
          cx,
          112,
          26,
          isA ? ROLE.reqA : isC ? ROLE.reqC : ROLE.focus,
          'mono',
        ).opacity(cA),
        rect(cellW, cellH, {
          fill: ct >= 0.5 ? '#1e1635' : '#0f1628',
          stroke: ct >= 0.5 ? ROLE.reqB : '#29375a',
          width: 2.0,
          radius: 8,
          ...(ct >= 0.5 ? {} : { dash: [5, 5] }),
        })
          .at(cx, 178)
          .opacity(cA),
        txt(ct >= 0.5 ? 'B' : '', cx, 178, 26, ROLE.reqB, 'mono').opacity(cA),
      );
    }

    if (ct >= 2.5 && ct < 3.5) {
      nodes.push(
        txt(
          'PREDICT: A just finished step 2. When can C start?',
          -855,
          264,
          28,
          ROLE.focus,
          'sans',
          'left',
        )
          .glow(6, ROLE.focus)
          .opacity(cA),
      );
    } else if (ct >= 3.5) {
      nodes.push(
        txt(
          'Step 3: C takes A’s open lane immediately (Orca)',
          -855,
          264,
          28,
          ROLE.reqC,
          'mono',
          'left',
        )
          .glow(6, ROLE.reqC)
          .opacity(cA),
      );
    }

    // Right panel: Live 4-slot Block Pool (4 blocks -> 3 blocks)
    nodes.push(dashedRule(160, -230, 160, 380, '#283657', 0.65 * a));
    const poolX = 520;
    nodes.push(
      txt('PAGED KV POOL (4 TOKENS / BLOCK)', poolX, -234, 26, ROLE.key, 'mono').opacity(a),
    );
    const afterRelease = pl >= 4.5;
    const blocks = [
      {
        id: 'Blk 0',
        owner: afterRelease ? (pl >= 5.5 ? 'C (3/4)' : 'FREE') : pl >= 1.5 ? 'A (4/4)' : 'free',
        col: afterRelease
          ? pl >= 5.5
            ? ROLE.reqC
            : COSMOS.dim
          : pl >= 1.5
            ? ROLE.reqA
            : COSMOS.dim,
        fill: afterRelease
          ? pl >= 5.5
            ? '#0e2d25'
            : '#0f1628'
          : pl >= 1.5
            ? '#102b38'
            : '#0f1628',
      },
      {
        id: 'Blk 1',
        owner: afterRelease ? 'FREE' : pl >= 1.5 ? 'A (4/4)' : 'free',
        col: afterRelease ? COSMOS.dim : pl >= 1.5 ? ROLE.reqA : COSMOS.dim,
        fill: afterRelease ? '#0f1628' : pl >= 1.5 ? '#102b38' : '#0f1628',
      },
      {
        id: 'Blk 2',
        owner: pl >= 2.5 ? 'B (4/4)' : 'free',
        col: pl >= 2.5 ? ROLE.reqB : COSMOS.dim,
        fill: pl >= 2.5 ? '#1e1635' : '#0f1628',
      },
      {
        id: 'Blk 3',
        owner: pl >= 6.5 ? 'B (2/4)' : pl >= 2.5 ? 'B (1/4)' : 'free',
        col: pl >= 2.5 ? ROLE.reqB : COSMOS.dim,
        fill: pl >= 2.5 ? '#1e1635' : '#0f1628',
      },
    ];
    blocks.forEach((b, idx) => {
      const r = Math.floor(idx / 2);
      const col = idx % 2;
      const cx = 375 + col * 290;
      const cy = -115 + r * 124;
      nodes.push(
        rect(256, 86, {
          fill: b.fill,
          stroke: b.col,
          width: 2.2,
          radius: 12,
          ...(b.col === COSMOS.dim ? { dash: [6, 6] } : {}),
        })
          .at(cx, cy)
          .opacity(a),
        txt(`${b.id}  ${b.owner}`, cx, cy, 26, b.col, 'mono').opacity(a),
      );
    });

    if (pl >= 3.5 && pl < 7.5) {
      nodes.push(
        txt(
          `${BATCH_POOL.beforeTotal} blocks in use (A: 2, B: 2)`,
          poolX,
          126,
          28,
          ROLE.focus,
          'mono',
        ).opacity(a),
      );
    } else if (pl >= 7.5) {
      nodes.push(
        txt(
          `${BATCH_POOL.afterTotal} blocks in use (C: 1, B: 2)`,
          poolX,
          126,
          30,
          ROLE.reqC,
          'mono',
        )
          .glow(7, ROLE.reqC)
          .opacity(a),
      );
    }
    if (pl >= 8.5) {
      nodes.push(
        txt('Batching chooses WHEN  ·  Paging chooses WHERE', 0, 376, 30, ROLE.focus, 'mono')
          .glow(7, ROLE.focus)
          .opacity(a),
      );
    }

    return group(...nodes);
  });

  // ── Act 2: Queue + Prefill -> Chunked Prefill (budget 4) -> Disaggregated GPUs ──
  const act2Header = cinemaHeader(
    'CHUNKED PREFILL & DISAGGREGATION',
    'Sharing each step',
    'without stalls',
    {
      x: -860,
      y: -415,
      accent: ROLE.prefill,
      size: 54,
    },
  );

  const act2Aura = group(aura(-360, 40, 480, '#60a5fa20'), aura(460, 80, 460, '#fb923c20'));

  const act2Dyn = guardedDynamic(act2Vis, (a) => {
    const q = queueStep.value;
    const ch = chunkStep.value;
    const ds = disaggStep.value;
    const ph = phase.value;
    const nodes = [];

    // Top-left: Longer Prompt Wait Breakdown (Queue + Prefill -> First Token)
    nodes.push(
      txt('LONG PROMPT FIRST-TOKEN WAIT', -855, -172, 26, ROLE.prefill, 'mono', 'left').opacity(a),
    );
    const stageBoxes = [
      { lbl: 'Queue Wait', active: q >= 1.5, col: ROLE.link, x: -725 },
      { lbl: 'Prefill GPU', active: q >= 2.5, col: ROLE.prefill, x: -455 },
      { lbl: '1st Token', active: q >= 3.5, col: ROLE.focus, x: -185 },
    ];
    stageBoxes.forEach((sb) => {
      nodes.push(
        memCell(sb.lbl, sb.x, -98, {
          w: 220,
          h: 68,
          fill: sb.active ? '#14243c' : '#0f1628',
          stroke: sb.active ? sb.col : '#2a3759',
          textColor: sb.active ? sb.col : COSMOS.dim,
          glow: sb.active ? 7 : 0,
          opacity: a,
        }),
      );
    });

    // Bottom-left: Chunked Prefill skeleton always visible in Act 2, lights up on `chunk`..`latency`
    const cA = a * (ch >= 0.5 ? Math.min(1, ch) : 0.45);
    nodes.push(
      txt('CHUNKED PREFILL  ·  BUDGET = 4 TOKENS / ITER', -855, 22, 26, ROLE.fresh, 'mono', 'left')
        .glow(ch >= 0.5 ? 5 : 0, ROLE.fresh)
        .opacity(cA),
    );
    const i1Y = 104;
    const i2Y = 196;
    const slotW = 148;

    nodes.push(txt('Iter 1', -855, i1Y, 26, COSMOS.muted, 'mono', 'left').opacity(cA));
    const cxSlot = (k) => -645 + k * 168;
    const i1Items = [
      { lbl: 'B dec', on: ch >= 1.5, col: ROLE.reqB, fill: '#1e1635' },
      { lbl: 'P1', on: ch >= 2.5, col: ROLE.prefill, fill: '#122a48' },
      { lbl: 'P2', on: ch >= 2.5, col: ROLE.prefill, fill: '#122a48' },
      { lbl: 'P3', on: ch >= 2.5, col: ROLE.prefill, fill: '#122a48' },
    ];
    i1Items.forEach((it, k) => {
      nodes.push(
        rect(slotW, 62, {
          fill: it.on ? it.fill : '#0f1628',
          stroke: it.on ? it.col : '#29375a',
          width: 2.2,
          radius: 8,
        })
          .at(cxSlot(k), i1Y)
          .opacity(cA),
        txt(it.lbl, cxSlot(k), i1Y, 26, it.on ? it.col : COSMOS.dim, 'mono').opacity(cA),
      );
    });

    nodes.push(txt('Iter 2', -855, i2Y, 26, COSMOS.muted, 'mono', 'left').opacity(cA));
    const i2Items = [
      { lbl: 'B dec', on: ch >= 1.5, col: ROLE.reqB, fill: '#1e1635' },
      { lbl: 'P4', on: ch >= 3.5, col: ROLE.prefill, fill: '#122a48' },
      { lbl: 'P5', on: ch >= 3.5, col: ROLE.prefill, fill: '#122a48' },
      {
        lbl: ch >= 4.5 ? 'P6 -> y1' : 'P6',
        on: ch >= 3.5,
        col: ch >= 4.5 ? ROLE.focus : ROLE.prefill,
        fill: ch >= 4.5 ? '#2e2510' : '#122a48',
      },
    ];
    i2Items.forEach((it, k) => {
      nodes.push(
        rect(slotW, 62, {
          fill: it.on ? it.fill : '#0f1628',
          stroke: it.on ? it.col : '#29375a',
          width: k === 3 && ch >= 4.5 ? 2.8 : 2.2,
          radius: 8,
        })
          .at(cxSlot(k), i2Y)
          .opacity(cA),
        txt(it.lbl, cxSlot(k), i2Y, 26, it.on ? it.col : COSMOS.dim, 'mono').opacity(cA),
      );
    });

    if (ch >= 5.5) {
      nodes.push(
        txt(
          'Compare prompt TTFT vs B’s smooth decode ITL',
          -855,
          294,
          26,
          ROLE.focus,
          'sans',
          'left',
        )
          .glow(5, ROLE.focus)
          .opacity(cA),
      );
    }

    // Right panel: Disaggregated Prefill & Decode skeleton always visible in Act 2, lights up on `separate`/`transfer`
    const dA = a * (ds >= 0.5 ? Math.min(1, ds) : 0.45);
    nodes.push(
      dashedRule(125, -200, 125, 360, '#283657', 0.65 * a),
      txt('DISAGGREGATED SERVING', 505, -172, 26, ROLE.link, 'mono')
        .glow(ds >= 0.5 ? 5 : 0, ROLE.link)
        .opacity(dA),
      memCell('PREFILL GPU', 505, -62, {
        w: 360,
        h: 92,
        fill: '#132846',
        stroke: ROLE.prefill,
        textColor: ROLE.prefill,
        size: 30,
        glow: ds >= 0.5 ? 8 : 0,
        opacity: dA,
      }),
      memCell('DECODE GPU', 505, 232, {
        w: 360,
        h: 92,
        fill: '#0e2d25',
        stroke: ROLE.fresh,
        textColor: ROLE.fresh,
        size: 30,
        glow: ds >= 0.5 ? 8 : 0,
        opacity: dA,
      }),
    );
    if (ds >= 1.5) {
      nodes.push(
        beamWithPhotons(
          [
            [395, -4],
            [395, 174],
          ],
          ROLE.link,
          ph * 0.8,
          { width: 5.0, glow: 14, photonCount: 3, alpha: dA },
        ),
        txt('KV Cache crosses link', 435, 84, 28, ROLE.link, 'mono', 'left')
          .glow(7, ROLE.link)
          .opacity(dA),
      );
    } else {
      nodes.push(dashedRule(505, -4, 505, 174, ROLE.link, 0.45 * dA));
    }

    return group(...nodes);
  });

  s.add(act1Aura, act1Header, act1Dyn, act2Dyn);
  driftValue(s, c, phase, 9.5, { startOffset: 0.1, endMargin: 0.5 });

  // Beat 0 cues
  c.on('waits', () => {
    s.play(staticStep.to(1, { duration: clampDur(c, c.cue('waits').start, 0.25) }));
  });
  c.on('idle', () => {
    s.play(staticStep.to(2, { duration: clampDur(c, c.cue('idle').start, 0.3) }));
  });

  // Beat 1 cues (PREDICTION: withhold Step 3 until after `join`!)
  c.on('continuous', () => {
    s.play(contStep.to(1, { duration: clampDur(c, c.cue('continuous').start, 0.3) }));
  });
  c.on('boundary', () => {
    s.play(contStep.to(2, { duration: clampDur(c, c.cue('boundary').start, 0.25) }));
  });
  c.on('ask', () => {
    s.play(contStep.to(3, { duration: clampDur(c, c.cue('ask').start, 0.3) }));
  });

  // Beat 2 cue - reveal Step 3 AFTER "Step three" finishes!
  c.after('join', () => {
    s.play(contStep.to(4, { duration: clampDur(c, c.cue('join').end, 0.3) }));
  });

  // Beat 3 cues (Pool: A=2, B=2 -> 4 blocks)
  c.on('pool', () => {
    s.play(poolStep.to(1, { duration: clampDur(c, c.cue('pool').start, 0.25) }));
  });
  c.on('a', () => {
    s.play(poolStep.to(2, { duration: clampDur(c, c.cue('a').start, 0.25) }));
  });
  c.on('b', () => {
    s.play(poolStep.to(3, { duration: clampDur(c, c.cue('b').start, 0.25) }));
  });
  c.after('four', () => {
    s.play(poolStep.to(4, { duration: clampDur(c, c.cue('four').end, 0.25) }));
  });

  // Beat 4 cues (Release A -> C takes 1 -> B adds 6th -> 3 blocks -> scheduler vs paging)
  c.on('release', () => {
    s.play(poolStep.to(5, { duration: clampDur(c, c.cue('release').start, 0.25) }));
  });
  c.on('c', () => {
    s.play(poolStep.to(6, { duration: clampDur(c, c.cue('c').start, 0.25) }));
  });
  c.on('six', () => {
    s.play(poolStep.to(7, { duration: clampDur(c, c.cue('six').start, 0.25) }));
  });
  c.after('three', () => {
    s.play(poolStep.to(8, { duration: clampDur(c, c.cue('three').end, 0.25) }));
  });
  c.on('scheduler', () => {
    s.play(poolStep.to(9, { duration: clampDur(c, c.cue('scheduler').start, 0.3) }));
  });

  // Swap to Act 2 at "a longer prompt arrives"
  c.swap('prompt', [act1Aura, act1Header], [act2Aura, act2Header]);
  c.on('prompt', () => {
    const t = c.cue('prompt').start;
    s.play(
      par(
        act1Vis.to(0, { duration: 0.16 }),
        delay(act2Vis.to(1, { duration: clampDur(c, t + 0.22, 0.28) }), 0.22),
        queueStep.to(1, { duration: clampDur(c, t, 0.25) }),
      ),
    );
  });
  c.on('queue', () => {
    s.play(queueStep.to(2, { duration: clampDur(c, c.cue('queue').start, 0.25) }));
  });
  c.on('prefill', () => {
    s.play(queueStep.to(3, { duration: clampDur(c, c.cue('prefill').start, 0.25) }));
  });
  c.on('first-token', () => {
    s.play(queueStep.to(4, { duration: clampDur(c, c.cue('first-token').start, 0.25) }));
  });

  // Beat 6 cues (Chunked prefill)
  c.on('chunk', () => {
    s.play(chunkStep.to(1, { duration: clampDur(c, c.cue('chunk').start, 0.25) }));
  });
  c.on('decode', () => {
    s.play(chunkStep.to(2, { duration: clampDur(c, c.cue('decode').start, 0.25) }));
  });
  c.on('first-chunk', () => {
    s.play(chunkStep.to(3, { duration: clampDur(c, c.cue('first-chunk').start, 0.25) }));
  });
  c.on('last-chunk', () => {
    s.play(chunkStep.to(4, { duration: clampDur(c, c.cue('last-chunk').start, 0.25) }));
  });
  c.on('scores', () => {
    s.play(chunkStep.to(5, { duration: clampDur(c, c.cue('scores').start, 0.25) }));
  });
  c.on('latency', () => {
    s.play(chunkStep.to(6, { duration: clampDur(c, c.cue('latency').start, 0.25) }));
  });

  // Beat 7 cues (Disaggregated)
  c.on('separate', () => {
    s.play(disaggStep.to(1, { duration: clampDur(c, c.cue('separate').start, 0.3) }));
  });
  c.on('transfer', () => {
    s.play(disaggStep.to(2, { duration: clampDur(c, c.cue('transfer').start, 0.35) }));
  });
}
