// Scene 24: Ticket 104 (Grand Finale). 13 inputs -> 16 workers (2 blocks x 8 threads), strict prediction withholding, and fresh clock transfer.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  FRESH_CLOCK,
  FRESH_REDUCTION,
  FRESH_VALUES,
  TOKEN_VALUES,
  afterDuration,
  aura,
  buildDualClockNodes,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  rule,
  txt,
} from '../parts.mjs';

export default function freshRuntime(s, c) {
  // Part 1: Reduction of 13 inputs across 2 x 8-thread blocks (Beats 0..2)
  const showPart1 = s.value(1);
  const appendProg = s.value(0);
  const predictLit = s.value(0);
  const readsDone = s.value(0);
  const guardsDone = s.value(0);
  const barrierDone = s.value(0);
  const sub0Lit = s.value(0);
  const sub1Lit = s.value(0);
  const countLit = s.value(0);
  const meanLit = s.value(0);

  // Part 2: Fresh clock (hostStart=4..scalarAt=24, eventStart=5..eventEnd=23) (Beats 3..5)
  const showPart2 = s.value(0);
  const clockTime = s.value(FRESH_CLOCK.hostStart);
  const showHostInt = s.value(0);
  const showStreamInt = s.value(0);
  const showLog = s.value(0);

  const bgAura = aura(0, 20, 580, '#5ce1e626', '#6ee7b716');

  const title = heroTitle(['Ticket 104:', 'End-to-End Transfer'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.emerald,
    eyebrow: 'FINALE · 13 INPUTS · 2 × 8 BLOCKS · FRESH CLOCK',
  });

  // Shared x layout for 16 worker slots (8 in Block 0, gap, 8 in Block 1)
  const slotX = (idx) => -805 + idx * 102 + (idx >= 8 ? 60 : 0);

  const part1 = guardedDynamic(showPart1, (a) => {
    const app = appendProg.value;
    const pr = predictLit.value;
    const rd = readsDone.value;
    const gd = guardsDone.value;
    const br = barrierDone.value;
    const s0 = sub0Lit.value;
    const s1 = sub1Lit.value;
    const ct = countLit.value;
    const mn = meanLit.value;

    const visibleInputs =
      TOKEN_VALUES.length + Math.floor(app * (FRESH_VALUES.length - TOKEN_VALUES.length) + 1e-6);

    const nodes = [
      txt(
        pr > 0.5 && rd < 0.5
          ? 'PREDICT: WHICH THREADS READ? WHICH REACH BARRIER? WHAT MEAN APPEARS?'
          : '13 INPUT POSITIONS (T0..T12) -> 2 BLOCKS × 8 THREADS (16 WORKERS)',
        -855,
        -215,
        26,
        pr > 0.5 && rd < 0.5 ? COSMOS.gold : COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
    ];

    // Input strip T0..T12
    for (let i = 0; i < visibleInputs; i++) {
      const cx = slotX(i);
      const isNew = i >= 8;
      const isRealZero = i === 9;
      nodes.push(
        txt(`T${i}`, cx, -162, 26, isRealZero ? COSMOS.emerald : COSMOS.muted, 'mono').opacity(a),
        glassCell(
          cx,
          -106,
          88,
          72,
          isRealZero ? COSMOS.emerald : isNew ? COSMOS.gold : COSMOS.cyan,
          {
            fill: isNew ? '#1d1c12' : '#0e1d2e',
            glow: isNew ? 7 : 5,
            opacity: a,
          },
        ),
        txt(String(FRESH_VALUES[i]), cx, -103, 34, COSMOS.ink, 'mono').opacity(a),
      );
    }

    // Valid count bracket under T0..T12
    if (ct > 0.05) {
      const lx = slotX(0) - 44;
      const rx = slotX(12) + 44;
      nodes.push(
        rule(lx, -48, lx + (rx - lx) * ct, -48, COSMOS.gold, 4)
          .glow(6, COSMOS.gold)
          .opacity(a),
        txt('13 valid input positions', (lx + rx) * 0.5, -18, 26, COSMOS.gold, 'mono').opacity(
          ct * a,
        ),
      );
    }

    // Two 8-thread blocks
    FRESH_REDUCTION.blocks.forEach((blk, bIdx) => {
      const col = bIdx === 0 ? COSMOS.cyan : COSMOS.blue;
      const leftX = slotX(bIdx * 8) - 44;
      const rightX = slotX(bIdx * 8 + 7) + 44;
      const centerX = (leftX + rightX) * 0.5;

      blk.threads.forEach((th) => {
        const cx = slotX(th.index);
        const ready = th.valid ? rd > 0.5 : gd > 0.5;
        const stroke = ready && !th.valid ? COSMOS.gold : col;
        nodes.push(
          glassCell(cx, 88, 88, 74, ready ? stroke : COSMOS.rule, {
            fill: ready && !th.valid ? '#211c12' : '#0f182c',
            glow: ready ? 6 : 0,
            dash: !th.valid ? [6, 5] : undefined,
            opacity: a,
          }),
          txt(
            ready ? String(th.value) : '·',
            cx,
            91,
            34,
            ready ? (!th.valid ? COSMOS.gold : COSMOS.ink) : COSMOS.dim,
            'mono',
          ).opacity(a),
          txt(`i${th.index}`, cx, 152, 26, !th.valid ? COSMOS.rose : COSMOS.muted, 'mono').opacity(
            a,
          ),
        );
      });

      // Block barrier rail
      if (br > 0.05) {
        nodes.push(
          rule(leftX, 186, leftX + (rightX - leftX) * br, 186, COSMOS.emerald, 5)
            .glow(7, COSMOS.emerald)
            .opacity(a),
        );
      }

      const subShown = bIdx === 0 ? s0 > 0.5 : s1 > 0.5;
      nodes.push(
        txt(
          `Block ${bIdx}${br > 0.5 ? ' · 8 at barrier' : ' · 8 threads'}`,
          leftX,
          228,
          28,
          col,
          'mono',
          'left',
        ).opacity(a),
        txt(subShown ? `sum = ${blk.subtotal}` : '', rightX, 228, 32, col, 'mono', 'right')
          .glow(6, col)
          .opacity(a),
      );
    });

    // Quotient readout (strictly withhold 2.6923 until meanLit!)
    const eqText =
      mn > 0.5
        ? `35 ÷ 13 ≈ ${FRESH_REDUCTION.mean.toFixed(4)}  (saved for caller log)`
        : ct > 0.5 && s0 > 0.5 && s1 > 0.5
          ? '(21 + 14) ÷ 13 = ?'
          : 'Pooled feature = ?';
    const eqCol = mn > 0.5 ? COSMOS.emerald : COSMOS.gold;
    nodes.push(
      glassCell(0, 355, 1480, 108, eqCol, { fill: '#0e1d26', glow: 9, opacity: a }),
      txt(eqText, 0, 358, 40, eqCol, 'mono').glow(7, eqCol).opacity(a),
    );
    return group(...nodes);
  });

  // Part 2: Fresh clock (4..24 ms) with strict prediction withholding on 20 ms & 18 ms intervals
  const part2 = guardedDynamic(showPart2, (a) => {
    const t = clockTime.value;
    const hi = showHostInt.value > 0.5;
    const si = showStreamInt.value > 0.5;
    const lg = showLog.value > 0.5;

    const { nodes: clockNodes, run } = buildDualClockNodes({
      clock: FRESH_CLOCK,
      time: t,
      ticks: [4, 9, 14, 19, 24],
      x0: -600,
      x1: 790,
      hostY: -15,
      streamY: 145,
      waiting: true,
      showStreamInterval: si,
      showHostInterval: hi,
      alpha: a,
    });

    const nodes = [
      txt(
        !hi
          ? 'FRESH CLOCK · WHICH TIME BELONGS BESIDE TICKET 104 FOR THE WHOLE TRIP?'
          : 'HOST CALLER INTERVAL (20 ms) VS GPU STREAM EVENTS (18 ms)',
        -855,
        -205,
        26,
        hi ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ).opacity(a),
      ...clockNodes,
    ];

    const fp32Val = Math.fround(FRESH_REDUCTION.mean);
    nodes.push(
      glassCell(0, 345, 1660, 132, lg ? COSMOS.emerald : COSMOS.gold, {
        fill: '#0e1a28',
        glow: 9,
        opacity: a,
      }),
      txt('CALLER LOG · TICKET 104', -790, 310, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt(
        `Python feature (.4f): ${run.reported ? fp32Val.toFixed(4) : '?'}`,
        -790,
        366,
        36,
        run.reported ? COSMOS.cyan : COSMOS.muted,
        'mono',
        'left',
      ).opacity(a),
      txt(
        `GPU events: ${si ? '18 ms' : '?'}`,
        110,
        366,
        36,
        si ? COSMOS.cyan : COSMOS.muted,
        'mono',
      ).opacity(a),
      txt(
        `Caller time: ${lg ? '20 ms' : '?'}`,
        790,
        366,
        38,
        lg ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'right',
      )
        .glow(7, lg ? COSMOS.emerald : COSMOS.gold)
        .opacity(a),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, part1, part2);

  // Beats 0..2 cues
  c.on('fresh-append', () => s.play(appendProg.to(1, { duration: 0.7 })));
  c.on('fresh-predict', () => s.play(predictLit.to(1, { duration: 0.35 })));
  c.on('fresh-reads', () => s.play(readsDone.to(1, { duration: 0.65 })));
  c.on('fresh-guards', () => s.play(guardsDone.to(1, { duration: 0.55 })));
  c.on('fresh-arrivals', () => s.play(barrierDone.to(1, { duration: 0.65 })));
  c.on('fresh-subtotal-0', () => s.play(sub0Lit.to(1, { duration: 0.45 })));
  c.on('fresh-subtotal-1', () => s.play(sub1Lit.to(1, { duration: 0.45 })));
  c.on('fresh-count', () => s.play(countLit.to(1, { duration: 0.55 })));
  // Strict prediction withholding: reveal 2.6923 AFTER fresh-mean phrase
  c.after('fresh-mean', () =>
    s.play(meanLit.to(1, { duration: afterDuration(c, 'fresh-mean', 0.4) })),
  );

  // Beats 3..5 cues
  c.on('fresh-return', () => {
    s.play(
      par(
        showPart1.to(0, { duration: 0.2 }),
        delay(showPart2.to(1, { duration: 0.25 }), 0.22),
        delay(clockTime.to(FRESH_CLOCK.hostReturn, { duration: 0.55 }), 0.25),
      ),
    );
  });
  c.on('fresh-device-end', () => s.play(clockTime.to(FRESH_CLOCK.eventEnd, { duration: 0.85 })));
  c.on('fresh-report', () => s.play(clockTime.to(FRESH_CLOCK.scalarAt, { duration: 0.45 })));
  // Strict prediction withholding: reveal 20 ms, 18 ms, and caller log ONLY after their answer cues!
  c.after('fresh-intervals', () =>
    s.play(showHostInt.to(1, { duration: afterDuration(c, 'fresh-intervals', 0.35) })),
  );
  c.after('fresh-stream-interval', () =>
    s.play(showStreamInt.to(1, { duration: afterDuration(c, 'fresh-stream-interval', 0.35) })),
  );
  c.after('fresh-log', () =>
    s.play(showLog.to(1, { duration: afterDuration(c, 'fresh-log', 0.4) })),
  );
}
