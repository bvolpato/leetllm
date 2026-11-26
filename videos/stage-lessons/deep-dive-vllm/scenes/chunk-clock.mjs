// Scene 12: Two readers on one clock (Cap 6: 8ms + 7ms = 15ms vs Cap 10: 12ms; HOLD prediction on larger-budget -> reveal 12ms, R1 3ms sooner, R0 4ms longer!).
import {
  COSMOS,
  ROLE,
  SCHED_10,
  SCHED_6,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

const OVERHEAD = 2;
const COST_6_A = OVERHEAD + SCHED_6[0].used; // 8 ms
const COST_6_B = OVERHEAD + SCHED_6[1].used; // 7 ms
const TOTAL_6 = COST_6_A + COST_6_B; // 15 ms
const COST_10 = OVERHEAD + SCHED_10[0].used; // 12 ms

export default function chunkClock(s, c) {
  const phase = s.value(0);
  // step:
  // 0 = inputs (slices of 5 and 4 under Cap 6)
  // 1 = cost-eight (8 ms -> R0 token at 8 ms)
  // 2 = cost-seven (+7 ms -> R1 first token at 15 ms)
  // 3 = larger-budget (PREDICTION HOLD: raise cap to 10 -> Which reader gets a token sooner?)
  // 4 = cap-ten (AFTER: 1 decode + 9 prompt = 12 ms together!)
  // 5 = compare (AFTER: R1 starts 3 ms sooner: 12 vs 15 ms)
  // 6 = gap (AFTER: R0 waits 4 ms longer: 12 vs 8 ms)
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1a', '#ffd16618');
  const title = heroTitle(['Two Readers on One Clock:', 'TTFT vs ITL'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.kv,
    eyebrow: 'CHUNKED PREFILL LATENCY · 2 MS SETUP + 1 MS / INPUT',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const xOf = (ms) => -640 + (ms / 15) * 1440;
    const nodes = [];

    // Millisecond ruler axis (0..15 ms)
    const axisY = -215;
    nodes.push(
      txt('ILLUSTRATIVE CLOCK (MS)', 855, -395, 26, COSMOS.muted, 'mono', 'right'),
      line([xOf(0), axisY], [xOf(15), axisY], { color: '#475569', width: 3 }),
    );
    [0, 4, 8, 12, 15].forEach((ms) => {
      const tx = xOf(ms);
      nodes.push(
        line([tx, axisY - 14], [tx, axisY + 14], { color: '#64748b', width: 2.5 }),
        txt(`${ms} ms`, tx, axisY - 38, 26, COSMOS.ink, 'mono'),
      );
    });

    // Track 1: Cap 6 (8 ms + 7 ms = 15 ms)
    const y6 = -85;
    nodes.push(txt('CAP 6', -855, y6, 30, COSMOS.ink, 'mono', 'left'));
    const w8 = xOf(COST_6_A) - xOf(0) - 8;
    const w7 = xOf(TOTAL_6) - xOf(COST_6_A) - 8;
    nodes.push(
      glassCell(xOf(0) + w8 * 0.5, y6, w8, 86, st >= 1 ? ROLE.r0 : COSMOS.dim, {
        fill: st >= 1 ? '#112440' : '#0b101d',
        glow: st >= 1 ? 8 : 2,
      }),
      txt(
        st >= 1 ? '+2 ms + R0 + 5 R1  (8 ms)' : 'Step 0: 1 decode + 5 prompt',
        xOf(0) + w8 * 0.5,
        y6,
        26,
        COSMOS.ink,
        'mono',
      ),

      glassCell(xOf(COST_6_A) + 8 + w7 * 0.5, y6, w7, 86, st >= 2 ? ROLE.r1 : COSMOS.dim, {
        fill: st >= 2 ? '#1f1636' : '#0b101d',
        glow: st >= 2 ? 8 : 2,
      }),
      txt(
        st >= 2 ? '+2 ms + R0 + 4 R1  (7 ms)' : 'Step 1: 1 decode + 4 prompt',
        xOf(COST_6_A) + 8 + w7 * 0.5,
        y6,
        26,
        COSMOS.ink,
        'mono',
      ),
    );

    if (st >= 1) {
      nodes.push(
        glowDot(xOf(COST_6_A), y6 + 68, { radius: 8, color: ROLE.r0 }),
        txt('R0 token: 8 ms', xOf(COST_6_A) - 18, y6 + 72, 26, ROLE.r0, 'mono', 'right'),
      );
    }
    if (st >= 2) {
      nodes.push(
        glowDot(xOf(TOTAL_6), y6 + 68, { radius: 8, color: ROLE.r1 }),
        txt('R1 first token: 15 ms', xOf(TOTAL_6) - 18, y6 + 72, 26, ROLE.r1, 'mono', 'right'),
      );
    }

    // Track 2: Cap 10 (strictly unfilled during prediction hold st === 3!)
    const y10 = 115;
    nodes.push(txt('CAP 10', -855, y10, 30, st >= 3 ? COSMOS.gold : COSMOS.dim, 'mono', 'left'));
    if (st >= 4) {
      const w12 = xOf(COST_10) - xOf(0);
      nodes.push(
        glassCell(xOf(0) + w12 * 0.5, y10, w12, 86, ROLE.kv, { fill: '#0e2632', glow: 10 }),
        txt(
          '+2 ms setup + 1 R0 decode + 9 R1 prompt  =  12 ms',
          xOf(0) + w12 * 0.5,
          y10,
          26,
          COSMOS.ink,
          'mono',
        ),
        glowDot(xOf(COST_10), y10 + 68, { radius: 9, color: ROLE.kv }),
        txt(
          'BOTH R0 & R1 emit at 12 ms',
          xOf(COST_10) - 18,
          y10 + 72,
          26,
          ROLE.kv,
          'mono',
          'right',
        ),
      );
    } else {
      const fullW = xOf(15) - xOf(0);
      nodes.push(
        glassCell(xOf(0) + fullW * 0.5, y10, fullW, 86, st === 3 ? COSMOS.gold : COSMOS.dim, {
          fill: '#0b101d',
          glow: st === 3 ? 7 : 2,
        }),
        txt(
          st === 3
            ? '1 R0 decode + 9 R1 prompt in one step: when do R0 and R1 emit?'
            : 'Cap 10 comparison unlocks next',
          xOf(0) + fullW * 0.5,
          y10,
          26,
          st === 3 ? COSMOS.gold : COSMOS.dim,
          'mono',
        ),
      );
    }

    // Delta badges (only after compare / gap!)
    if (st >= 5) {
      nodes.push(
        glassCell(-420, 265, 760, 74, ROLE.good, { fill: '#0d2922', glow: 9 }),
        txt(
          `R1 TTFT: 15 ms -> 12 ms  (${TOTAL_6 - COST_10} ms SOONER!)`,
          -420,
          265,
          26,
          ROLE.good,
          'mono',
        ),
      );
    }
    if (st >= 6) {
      nodes.push(
        glassCell(420, 265, 760, 74, ROLE.bad, { fill: '#2c1320', glow: 9 }),
        txt(
          `R0 ITL: 8 ms -> 12 ms  (${COST_10 - COST_6_A} ms LONGER!)`,
          420,
          265,
          26,
          ROLE.bad,
          'mono',
        ),
      );
    }

    const caption =
      st >= 6
        ? 'Raising token cap cuts R1 TTFT by 3 ms while stretching R0 ITL by 4 ms; measure both on GPU'
        : st === 5
          ? 'R1 starts 3 ms sooner (12 ms vs 15 ms)'
          : st === 4
            ? 'Cap 10 runs all 10 inputs in 12 ms (2 + 10)'
            : st === 3
              ? 'Predict: With Cap 10, which reader gets a token sooner and which waits longer?'
              : st === 2
                ? 'Cap 6 completes R1 prompt at 15 ms (8 + 7 ms)'
                : st === 1
                  ? 'First 6-input step takes 8 ms -> R0 gets its decode token there'
                  : 'Decode-first budget splits R1’s 9-token prompt into chunks of 5 and 4';

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-780 + u * 1560, 330, { radius: 6, color: st >= 4 ? ROLE.kv : COSMOS.gold }),
      txt(caption, 0, 385, 26, st === 3 ? COSMOS.gold : COSMOS.ink, 'sans'),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['vv-chunk-clock-inputs', 0],
    ['vv-chunk-clock-cost-eight', 1, true],
    ['vv-chunk-clock-cost-seven', 2, true],
    ['vv-chunk-clock-larger-budget', 3],
    ['vv-chunk-clock-cap-ten', 4, true],
    ['vv-chunk-clock-compare', 5, true],
    ['vv-chunk-clock-gap', 6, true],
  ]);
}
