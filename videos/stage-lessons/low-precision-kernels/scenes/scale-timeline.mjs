// Scene 09: When is the maximum available? Current scaling (2 reads) vs Delayed scaling (1 read + history) vs reverse-lag flush.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  aura,
  delayedScaleReplay,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  roundTrip,
  txt,
} from '../parts.mjs';

const TENSOR_VALS = [4, 16, 64, 700, -2, -8, -32, -250];
const REVERSE_RT = roundTrip(0.001, 500 / 448);

export default function scaleTimeline(s, c) {
  const showCurrent = s.value(1);
  const curScan = s.value(0);
  const curSecond = s.value(0);

  const showDelayed = s.value(0);
  const delScan = s.value(0);
  const delHist = s.value(0);

  const showReverse = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1e', '#ffd16618');
  const title = heroTitle(['When Is the', 'Max Ready?'], {
    x: -855,
    y: -415,
    size: 60,
    lineHeight: 70,
    accent: COSMOS.gold,
    eyebrow: 'CURRENT SCALING VS DELAYED SCALING',
  });

  // Helper: draw the 8-element tensor strip
  const drawStrip = (y, activeCount, highlightIdx, accentCol, op) => {
    const cellW = 148;
    const gap = 10;
    const totalW = 8 * cellW + 7 * gap;
    const x0 = -totalW * 0.5;
    const out = [];
    for (let i = 0; i < 8; i++) {
      const cx = x0 + i * (cellW + gap) + cellW * 0.5;
      const scanned = i < activeCount;
      const isPeak = i === highlightIdx;
      const stroke = isPeak ? COSMOS.gold : scanned ? accentCol : '#2c3a5e';
      const fill = isPeak ? '#261e10' : scanned ? '#12253a' : '#0d1425';
      out.push(
        rect(cellW, 66, { fill, stroke, width: isPeak ? 3 : 2, radius: 8 })
          .at(cx, y)
          .glow(isPeak || scanned ? 6 : 0, stroke)
          .opacity(op),
        txt(String(TENSOR_VALS[i]), cx, y, 28, isPeak ? COSMOS.gold : COSMOS.ink, 'mono').opacity(
          op,
        ),
      );
    }
    return out;
  };

  // Part 1: Current scaling (2 reads before GEMM)
  const partCurrent = guardedDynamic(showCurrent, (a) => {
    const sc = curScan.value;
    const sc2 = curSecond.value;
    const pass1Count = Math.min(8, Math.floor(sc * 8.5));
    const pass2Count = Math.min(8, Math.floor(sc2 * 8.5));

    const nodes = [
      txt(
        'CURRENT SCALING · TWO TENSOR READS ON DEVICE',
        420,
        -365,
        26,
        COSMOS.cyan,
        'mono',
      ).opacity(a),
      txt(
        'PASS 1: SCAN TENSOR TO FIND TODAY’S AMAX (= 700)',
        -628,
        -205,
        26,
        COSMOS.blue,
        'mono',
        'left',
      ).opacity(a),
      ...drawStrip(-128, pass1Count, 3, COSMOS.blue, a),
      txt(
        pass1Count >= 4 ? 'amax = 700 → compute S = 700 / 448' : 'scanning tensor for amax...',
        0,
        -40,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),
      txt(
        'PASS 2: REREAD SAME VALUES TO SCALE & CAST TO FP8',
        -628,
        65,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity((0.25 + 0.75 * sc2) * a),
      ...drawStrip(142, pass2Count, 3, COSMOS.cyan, (0.25 + 0.75 * sc2) * a),
      glassCell(0, 325, 1340, 118, COSMOS.cyan, { fill: '#0e1b2d', glow: 8, opacity: a }),
      txt(
        '2 READS TO QUANTIZE + LATER GEMM READ (STAY ON DEVICE · NO HOST SYNC)',
        0,
        325,
        26,
        COSMOS.ink,
        'mono',
      ).opacity(a),
    ];
    return group(...nodes);
  });

  // Part 2: Delayed scaling (1 read using prior history [10, 8, 6])
  const partDelayed = guardedDynamic(showDelayed, (a) => {
    const ds = delScan.value;
    const dh = delHist.value;
    const replay = delayedScaleReplay(ds);
    const oldHist = [10, 8, 6];
    const newHist = replay.history;

    const nodes = [
      txt(
        'DELAYED SCALING · ONE TENSOR READ + HISTORY WINDOW',
        420,
        -365,
        26,
        COSMOS.gold,
        'mono',
      ).opacity(a),
      // History box left
      glassCell(-470, -145, 720, 128, COSMOS.blue, { fill: '#101a2e', glow: 7, opacity: a }),
      txt('PRIOR AMAX HISTORY (NO MARGIN)', -470, -182, 26, COSMOS.muted, 'mono').opacity(a),
      txt(
        `[ ${oldHist.join(' ,  ')} ]   →   max = 10`,
        -470,
        -124,
        34,
        COSMOS.blue,
        'mono',
      ).opacity(a),
      // Today's scale box right
      glassCell(410, -145, 760, 128, COSMOS.gold, { fill: '#1d1912', glow: 8, opacity: a }),
      txt('TODAY’S SCALE READY BEFORE SCAN', 410, -182, 26, COSMOS.muted, 'mono').opacity(a),
      txt('S_today = 10 / 448   (stale for 700!)', 410, -124, 32, COSMOS.gold, 'mono').opacity(a),

      // Single cast+track scan
      txt(
        'SINGLE PASS: CAST WITH S = 10/448 + TRACK NEW AMAX',
        -628,
        -5,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      ...drawStrip(75, replay.count, 3, COSMOS.cyan, a),
      txt(
        '1 tensor read instead of 2 · records today’s amax = 700 in flight',
        0,
        166,
        28,
        COSMOS.cyan,
        'mono',
      ).opacity(a),

      // Next-step history box (fades in cleanly on delHist, zero brief placeholder text!)
      ...(dh > 0.02
        ? [
            glassCell(0, 325, 1180, 122, COSMOS.emerald, {
              fill: '#0e2224',
              glow: 9,
              opacity: dh * a,
            }),
            txt('HISTORY UPDATED FOR NEXT ITERATION', 0, 290, 26, COSMOS.muted, 'mono').opacity(
              dh * a,
            ),
            txt(
              `Next window: [ ${newHist.join(' ,  ')} ]   (700 enters history)`,
              0,
              345,
              32,
              COSMOS.emerald,
              'mono',
            )
              .glow(6, COSMOS.emerald)
              .opacity(dh * a),
          ]
        : []),
    ];
    return group(...nodes);
  });

  // Part 3: Opposite lag hazard (history still has 500 while today's input is 0.001 -> flushes to 0)
  const partReverse = guardedDynamic(showReverse, (a) => {
    const nodes = [
      txt(
        'OPPOSITE SHIFT: STALE LARGE SCALE FLUSHES SMALL INPUTS',
        340,
        -365,
        26,
        COSMOS.rose,
        'mono',
      ).opacity(a),
      glassCell(-435, -75, 750, 190, COSMOS.amber, { fill: '#1e1612', glow: 8, opacity: a }),
      txt('RETAINED OUTLIER IN HISTORY', -435, -135, 26, COSMOS.muted, 'mono').opacity(a),
      txt('amax_hist = 500', -435, -75, 42, COSMOS.amber, 'mono').glow(6, COSMOS.amber).opacity(a),
      txt(
        'S = 500 / 448 ≈ 1.116   ·   min step ≈ 0.00218',
        -435,
        -14,
        26,
        COSMOS.ink,
        'mono',
      ).opacity(a),

      glassCell(435, -75, 750, 190, COSMOS.rose, { fill: '#221020', glow: 10, opacity: a }),
      txt('TODAY’S TINY INPUT', 435, -135, 26, COSMOS.muted, 'mono').opacity(a),
      txt(`x = 0.001  →  x̂ = ${REVERSE_RT.reconstructed}`, 435, -75, 42, COSMOS.rose, 'mono')
        .glow(8, COSMOS.rose)
        .opacity(a),
      txt('0.001 < 0.5 × 0.00218 (flushes to zero!)', 435, -14, 26, COSMOS.ink, 'mono').opacity(a),

      glassCell(0, 235, 1520, 154, COSMOS.cyan, { fill: '#0e192c', glow: 7, opacity: a }),
      txt('BOTH DELAYED-SCALING FAILURE MODES', 0, 195, 26, COSMOS.cyan, 'mono').opacity(a),
      txt(
        'Too small (10 vs 500) → clips spike to 10     ·     Too large (500 vs 0.001) → flushes tiny values to 0',
        0,
        255,
        28,
        COSMOS.ink,
        'sans',
      ).opacity(a),
    ];
    return group(...nodes);
  });

  s.add(bgAura, title, partCurrent, partDelayed, partReverse);

  c.on('lp-scale-timeline-build-0', () =>
    s.play(curScan.to(1, { duration: remainDuration(c, 'lp-scale-timeline-build-0', 1.4) })),
  );
  c.on('lp-scale-timeline-second', () =>
    s.play(curSecond.to(1, { duration: remainDuration(c, 'lp-scale-timeline-second', 1.1) })),
  );

  c.on('lp-scale-timeline-build-1', () => {
    s.play(
      par(
        showCurrent.to(0, { duration: 0.2 }),
        delay(showDelayed.to(1, { duration: 0.25 }), 0.22),
        delay(
          delScan.to(1, { duration: remainDuration(c, 'lp-scale-timeline-build-1', 1.6) }),
          0.28,
        ),
      ),
    );
  });
  c.on('lp-scale-timeline-history', () =>
    s.play(delHist.to(1, { duration: remainDuration(c, 'lp-scale-timeline-history', 0.45) })),
  );

  c.on('lp-scale-timeline-build-2', () => {
    s.play(
      par(showDelayed.to(0, { duration: 0.2 }), delay(showReverse.to(1, { duration: 0.28 }), 0.22)),
    );
  });
}
