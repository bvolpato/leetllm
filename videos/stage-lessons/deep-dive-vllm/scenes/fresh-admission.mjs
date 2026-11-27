// Scene 29: Admission and wait time (Earned transfer with 3 prediction holds: Q asks Adapter B [13 tokens, 10 match A, 3 free blocks, cap 14, 1 decode] -> miss -> 4 blocks > 3 -> WAIT; separate request asks Adapter A -> 8 skip, 5 compute -> 2 blocks, 6/14 inputs -> ADMITTED; timed trace [7,65,24,6]=102ms -> 65ms queue!).
import {
  COSMOS,
  FRESH_DURATIONS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  reuse,
  txt,
  wireStepCues,
} from '../parts.mjs';

const CLOCK_PHASES = [
  { name: 'Input', ms: FRESH_DURATIONS[0], col: ROLE.r0 },
  { name: 'Queue', ms: FRESH_DURATIONS[1], col: ROLE.r1 },
  { name: 'Prefill', ms: FRESH_DURATIONS[2], col: ROLE.kv },
  { name: 'Deliver', ms: FRESH_DURATIONS[3], col: ROLE.good },
];
const FRESH_TOTAL = 102;

export default function freshAdmission(s, c) {
  // Major stage transitions (spaced across beats -> zero film.text_brief):
  // 0 = Beat 0 setup + HOLD 1 (Q asks Adapter B -> Can entire prompt run?)
  // 1 = Beat 1 miss (Adapter B skips 0, computes all 13)
  // 2 = Beat 1 wait (14 inputs fit step, 4 blocks > 3 free -> WAIT)
  // 3 = Beat 2 reset + HOLD 2 (Separate request asks Adapter A -> Does entire prompt fit?)
  // 4 = Beat 3 hit (8 skipped, 5 compute)
  // 5 = Beat 3 admitted (2 new blocks <= 3, 6/14 inputs -> ADMITTED!)
  // 6 = Beat 4 timed clock + HOLD 3 ([7, 65, 24, 6] = 102 ms -> Which interval first?)
  // 7 = Beat 5 diagnosis (65 ms in engine queue -> check token budget & free blocks + dispatch!)
  const stage = s.value(0);
  // Additive visual counters (never swap text rapidly -> zero film.text_brief)
  const showMatch = s.value(0);
  const showPool = s.value(0);
  const placedB = s.value(0); // 0 -> 4 -> 8 -> 12 -> 13
  const placedA = s.value(0); // 0 -> 4 -> 5
  const clockStage = s.value(0); // 0..4
  const dispatchPulse = s.value(0);

  const bgAura = aura(0, 20, 640, '#ffd1661a', '#6ee7b716');
  const title = heroTitle(['Admission & Wait Time:', 'Putting It All Together'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'EARNED TRANSFER · ADAPTER HASH · BLOCKS · STEP BUDGET · TTFT',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(stage.value);
    const nodes = [];

    // ACT II of Scene 29 (Beats 4-5): Independent 102 ms Timed Request for Adapter A
    if (st >= 6) {
      const clk = Math.round(clockStage.value);
      const rulerLeft = -830;
      const rulerW = 1660;
      const xOf = (ms) => rulerLeft + (ms / FRESH_TOTAL) * rulerW;

      nodes.push(
        txt(
          'SEPARATE TIMED REQUEST FOR ADAPTER A (TOTAL = 102 MS)',
          -830,
          -268,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ),
        txt('SUPPLIED TIMINGS', 830, -268, 26, COSMOS.muted, 'mono', 'right'),
      );

      let cursor = 0;
      CLOCK_PHASES.forEach(({ name, ms, col }, idx) => {
        const w = xOf(cursor + ms) - xOf(cursor) - 6;
        const cx = xOf(cursor) + w * 0.5;
        const active = clk >= idx + 1;
        const hiQueue = idx === 1 && st >= 7;
        nodes.push(
          txt(name, cx, -214, 26, active ? col : COSMOS.dim, 'mono'),
          glassCell(cx, -142, w, 96, active ? (hiQueue ? COSMOS.gold : col) : COSMOS.dim, {
            fill: active ? (hiQueue ? '#2c1742' : '#121e34') : '#0b101d',
            glow: hiQueue ? 12 : active ? 7 : 2,
          }),
          txt(active ? `${ms} ms` : '', cx, -142, 26, active ? COSMOS.ink : COSMOS.dim, 'mono'),
        );
        cursor += ms;
      });

      const elapsed = CLOCK_PHASES.slice(0, Math.min(4, clk)).reduce((a, b) => a + b.ms, 0);
      nodes.push(txt(`Elapsed: ${elapsed} ms`, 0, -68, 26, COSMOS.gold, 'mono'));

      if (st === 6) {
        const askReady = clk >= 4;
        nodes.push(
          glassCell(0, 128, 1660, 178, askReady ? COSMOS.gold : COSMOS.dim, {
            fill: askReady ? '#241c0e' : '#0b101d',
            glow: askReady ? 10 : 3,
          }),
          txt(
            askReady
              ? 'PREDICTION: WHICH INTERVAL WOULD YOU OPEN FIRST?'
              : 'TIMING ADAPTER A REQUEST...',
            0,
            96,
            30,
            askReady ? COSMOS.gold : COSMOS.muted,
            'mono',
          ),
          txt(
            askReady
              ? 'Input: 7 ms   |   Queue: 65 ms   |   Prefill: 24 ms   |   Deliver: 6 ms   (Total: 102 ms)'
              : 'Measuring Input -> Queue -> Prefill -> Deliver',
            0,
            158,
            26,
            COSMOS.ink,
            'mono',
          ),
        );
      } else {
        const disp = dispatchPulse.value > 0.5;
        nodes.push(
          glassCell(0, 128, 1660, 198, ROLE.r1, { fill: '#221436', glow: 10 }),
          txt('65 MS OF 102 MS SPENT IN THE ENGINE QUEUE', 0, 74, 30, ROLE.r1, 'mono'),
          txt(
            'Open admission records: did each attempt have BOTH input budget & free blocks?',
            0,
            132,
            26,
            COSMOS.ink,
            'sans',
          ),
          txt(
            disp
              ? 'Both ready? Check scheduler dispatch time!'
              : 'Compare token budget and free-block counts at each attempt',
            0,
            184,
            26,
            disp ? COSMOS.gold : COSMOS.muted,
            'sans',
          ),
        );
      }

      nodes.push(
        txt(
          st >= 7
            ? 'Trace admission records, KV pool counts & scheduler dispatch before changing kernels'
            : 'Read the four supplied intervals on the 102 ms clock',
          0,
          382,
          26,
          st === 6 ? COSMOS.gold : COSMOS.ink,
          'sans',
        ),
      );
      return group(...nodes);
    }

    // ACT I of Scene 29 (Beats 0-3): 13-token prompt under Adapter B vs Adapter A
    const isAdapterA = st >= 3;
    const skipped = isAdapterA && st >= 4 ? reuse(10, 13, 4) : 0; // 8 when Adapter A reveals
    const placed = isAdapterA ? Math.round(placedA.value) : Math.round(placedB.value);

    nodes.push(
      txt(
        `REQUEST Q: ADAPTER ${isAdapterA ? 'A (MATCHES LIVE PREFIX)' : 'B (LIVE PREFIX IS UNDER A)'}`,
        -855,
        -264,
        26,
        isAdapterA ? ROLE.good : ROLE.r1,
        'mono',
        'left',
      ),
      txt('13 TOKENS · BLOCK SIZE 4', 855, -264, 26, COSMOS.muted, 'mono', 'right'),
    );

    // 13 prompt tokens in 4-token groups
    const tw = 114;
    const tg = 10;
    for (let i = 0; i < 13; i++) {
      const bGap = Math.floor(i / 4) * 20;
      const cx = -855 + tw * 0.5 + i * (tw + tg) + bGap;
      const isReused = i < skipped;
      const isMatchSpan = showMatch.value > 0.5 && i < 10;
      const col = isReused ? ROLE.good : isMatchSpan ? ROLE.kv : ROLE.r1;
      nodes.push(
        glassCell(cx, -192, tw, 76, col, {
          fill: isReused ? '#0d2b24' : '#121b30',
          glow: isReused ? 9 : 4,
        }),
        txt(`q${i}`, cx, -192, 26, isReused ? ROLE.good : COSMOS.ink, 'mono'),
      );
    }

    if (showMatch.value > 0.5) {
      nodes.push(
        txt(
          'First 10 token IDs (q0..q9) match a live prefix computed under Adapter A',
          -855,
          -124,
          26,
          ROLE.kv,
          'mono',
          'left',
        ),
      );
    }

    // Free KV Pool (3 free blocks + 4th overflow outline if placed > 12)
    if (showPool.value > 0.5 || st >= 1) {
      nodes.push(
        txt('FREE KV POOL: 3 BLOCKS FREE (4 CELLS EACH)', -855, -42, 26, ROLE.kv, 'mono', 'left'),
        txt('STEP CAP: 14  |  1 ACTIVE DECODE', 855, -42, 26, ROLE.r0, 'mono', 'right'),
      );
      const numBlocks = !isAdapterA && placed > 12 ? 4 : 3;
      for (let b = 0; b < numBlocks; b++) {
        const bx = -855 + b * 435;
        const overflow = b >= 3;
        const bCol = overflow ? ROLE.bad : isAdapterA && st >= 5 && b < 2 ? ROLE.good : ROLE.kv;
        nodes.push(
          txt(
            overflow ? '4TH BLOCK (NONE!)' : `FREE BLOCK ${b + 1}`,
            bx,
            4,
            26,
            bCol,
            'mono',
            'left',
          ),
        );
        for (let j = 0; j < 4; j++) {
          const idx = b * 4 + j;
          const filled = idx < placed;
          const cx = bx + 44 + j * 96;
          nodes.push(
            glassCell(cx, 72, 86, 82, filled ? (overflow ? ROLE.bad : bCol) : COSMOS.dim, {
              fill: filled ? (overflow ? '#2e1220' : '#0f2830') : '#0b101d',
              glow: filled ? 9 : 2,
            }),
            txt(
              filled ? `q${skipped + idx}` : '',
              cx,
              72,
              26,
              overflow ? ROLE.bad : COSMOS.ink,
              'mono',
            ),
          );
        }
      }
    }

    // Verdict / Prediction Box (strictly withheld on HOLD 1 [st===0] and HOLD 2 [st===3]!)
    let boxCol = COSMOS.gold;
    let line1 = 'PREDICTION: Can Q’s entire 13-token prompt run beside the active decode?';
    let line2 = 'Check adapter identity, blocks needed (block size 4), and step cap (14)';
    if (st === 1) {
      boxCol = ROLE.r1;
      line1 = 'ADAPTER B MISS: skip 0  |  must compute all 13 positions';
      line2 = 'Placing 13 positions into 4-cell blocks: 4 -> 8 -> 12 -> 13th overflows!';
    } else if (st === 2) {
      boxCol = ROLE.bad;
      line1 = 'WAIT: 13 + 1 = 14 inputs fit the step, but 4 blocks > 3 free blocks!';
      line2 = 'Whole-prompt proposal waits (a chunked slice of 12 could run in 3 blocks)';
    } else if (st === 3) {
      boxCol = COSMOS.gold;
      line1 = 'POOL RESET (3 FREE BLOCKS) · NEW REQUEST ASKS FOR ADAPTER A';
      line2 = 'PREDICTION: Same 13 tokens & 10 matching positions. Does the entire prompt fit now?';
    } else if (st === 4) {
      boxCol = ROLE.good;
      line1 = 'ADAPTER A HIT: 2 complete blocks cover 8 positions (q8..q9 diverge -> recompute 5)';
      line2 = 'Placing 5 remaining positions: 4 in Block 1 + 1 in Block 2';
    } else if (st === 5) {
      boxCol = ROLE.good;
      line1 = 'ADMITTED: 5 + 1 = 6 of 14 step inputs  |  2 of 3 free blocks  (1 block still free!)';
      line2 = 'Each request kept the exact adapter its caller requested';
    }

    nodes.push(
      glassCell(0, 224, 1710, 128, boxCol, {
        fill: st === 2 ? '#2b1220' : st >= 4 ? '#0d2922' : '#221c0e',
        glow: 9,
      }),
      txt(line1, 0, 196, 26, boxCol, 'mono'),
      txt(line2, 0, 250, 26, COSMOS.ink, 'sans'),
    );

    nodes.push(
      txt(
        st === 0 || st === 3
          ? 'Verify cache compatibility, KV block count & step token cap before predicting'
          : 'Adapter identity decides whether prefix blocks reuse or recompute',
        0,
        382,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);

  // Beat 0 (HOLD 1)
  c.on('vv-fresh-admission-matches', () => s.play(showMatch.to(1, { duration: 0.2 })));
  c.on('vv-fresh-admission-resources', () => s.play(showPool.to(1, { duration: 0.2 })));
  c.on('vv-fresh-admission-whole-prompt', () => s.play(stage.to(0, { duration: 0.1 })));

  // Beat 1 (Adapter B miss -> 4, 8, 12, 13 overflow -> wait)
  c.after('vv-fresh-admission-miss', () => s.play(stage.to(1, { duration: 0.2 })));
  c.after('vv-fresh-admission-first-four', () => s.play(placedB.to(4, { duration: 0.15 })));
  c.after('vv-fresh-admission-next-four', () => s.play(placedB.to(8, { duration: 0.15 })));
  c.after('vv-fresh-admission-third-four', () => s.play(placedB.to(12, { duration: 0.15 })));
  c.after('vv-fresh-admission-overflow', () => s.play(placedB.to(13, { duration: 0.15 })));
  c.after('vv-fresh-admission-memory-wait', () => s.play(stage.to(2, { duration: 0.2 })));

  // Beat 2 (Reset pool, Adapter A -> HOLD 2)
  c.on('vv-fresh-admission-restore-adapter', () => {
    s.play(stage.to(3, { duration: 0.2 }), placedA.to(0, { duration: 0.1 }));
  });

  // Beat 3 (Adapter A hit -> 8 skip, 5 compute -> 4 + 1 -> ADMITTED)
  c.after('vv-fresh-admission-matching-blocks', () => s.play(stage.to(4, { duration: 0.2 })));
  c.after('vv-fresh-admission-hit-counts', () => s.play(stage.to(4, { duration: 0.1 })));
  c.after('vv-fresh-admission-tail-four', () => s.play(placedA.to(4, { duration: 0.15 })));
  c.after('vv-fresh-admission-tail-one', () => s.play(placedA.to(5, { duration: 0.15 })));
  c.after('vv-fresh-admission-hit-admitted', () => s.play(stage.to(5, { duration: 0.2 })));

  // Beat 4 (102 ms clock -> HOLD 3)
  c.on('vv-fresh-admission-input', () => {
    s.play(stage.to(6, { duration: 0.2 }), clockStage.to(1, { duration: 0.2 }));
  });
  c.on('vv-fresh-admission-queue', () => s.play(clockStage.to(2, { duration: 0.2 })));
  c.on('vv-fresh-admission-prefill', () => s.play(clockStage.to(3, { duration: 0.2 })));
  c.on('vv-fresh-admission-delivery', () => s.play(clockStage.to(4, { duration: 0.2 })));
  c.on('vv-fresh-admission-question', () => s.play(stage.to(6, { duration: 0.1 })));

  // Beat 5 (Queue diagnosis & dispatch check)
  c.after('vv-fresh-admission-latency-total', () => s.play(stage.to(7, { duration: 0.2 })));
  c.on('vv-fresh-admission-dispatch', () => s.play(dispatchPulse.to(1, { duration: 0.2 })));
}
