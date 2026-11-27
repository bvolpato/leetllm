// Scene 26: Where did R1 wait? (150 ms arrival-to-first-token ruler: Input 20, Queue 80, Prefill 40, Deliver 10; HOLD prediction on synthesis-question -> open 80ms queue: 20ms Wait [2 needed/1 free] vs 100ms Issue [2 needed/2 free] -> worker handoff R1, 5 inputs, [12,73,90]).
import {
  COSMOS,
  ROLE,
  SYNTHESIS_DURATIONS,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

const PHASES = [
  { name: 'Input', ms: SYNTHESIS_DURATIONS[0], col: ROLE.r0 },
  { name: 'Queue', ms: SYNTHESIS_DURATIONS[1], col: ROLE.r1 },
  { name: 'Prefill', ms: SYNTHESIS_DURATIONS[2], col: ROLE.kv },
  { name: 'Deliver', ms: SYNTHESIS_DURATIONS[3], col: ROLE.good },
];
const TOTAL_MS = 150;

export default function synthesis(s, c) {
  // clockStage: 0..4 additive fill of [Input, Queue, Prefill, Deliver]
  const clockStage = s.value(0);
  // step:
  // 0 = building 150 ms ruler
  // 1 = synthesis-question (PREDICTION HOLD: Which interval would you investigate first?)
  // 2 = synthesis-first-attempt (AFTER: 20 ms -> 5/5 fit, 2 blocks needed / 1 free -> WAIT)
  // 3 = synthesis-second-attempt (AFTER: 100 ms -> 5/5 fit, 2 blocks needed / 2 free -> ISSUE WORK)
  // 4 = synthesis-handoff (AFTER: Worker gets R1 | 5 inputs | table [12, 73, 90])
  const step = s.value(0);

  const bgAura = aura(0, 20, 640, '#a78bfa1c', '#5ce1e618');
  const title = heroTitle(['Where Did R1 Wait?'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 62,
    accent: ROLE.r1,
    eyebrow: 'END-TO-END TRACE · 150 MS TTFT · ADMISSION RECORDS · HANDOFF',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const clk = Math.round(clockStage.value);
    const rulerLeft = -830;
    const rulerW = 1660;
    const xOf = (ms) => rulerLeft + (ms / TOTAL_MS) * rulerW;
    const nodes = [
      txt(
        'R1 ARRIVAL-TO-FIRST-TOKEN RULER (TOTAL = 150 MS)',
        -830,
        -268,
        26,
        COSMOS.ink,
        'mono',
        'left',
      ),
      txt('ILLUSTRATIVE TRACE', 830, -268, 26, COSMOS.muted, 'mono', 'right'),
    ];

    // Proportional 150 ms bar
    let cursor = 0;
    PHASES.forEach(({ name, ms, col }, idx) => {
      const w = xOf(cursor + ms) - xOf(cursor) - 6;
      const cx = xOf(cursor) + w * 0.5;
      const active = clk >= idx + 1;
      const hiQueue = idx === 1 && st >= 2;
      nodes.push(
        txt(name, cx, -214, 26, active ? col : COSMOS.dim, 'mono'),
        glassCell(cx, -145, w, 92, active ? (hiQueue ? COSMOS.gold : col) : COSMOS.dim, {
          fill: active ? (hiQueue ? '#28173d' : '#121d32') : '#0b101d',
          glow: hiQueue ? 12 : active ? 7 : 2,
        }),
        txt(active ? `${ms} ms` : '', cx, -145, 28, active ? COSMOS.ink : COSMOS.dim, 'mono'),
      );
      cursor += ms;
    });

    const elapsedMs = PHASES.slice(0, Math.min(4, clk)).reduce((a, b) => a + b.ms, 0);
    nodes.push(
      txt(
        `Elapsed: ${elapsedMs} ms`,
        xOf(elapsedMs) > 650 ? 830 : Math.max(-740, xOf(elapsedMs)),
        -72,
        26,
        COSMOS.gold,
        'mono',
        xOf(elapsedMs) > 650 ? 'right' : 'center',
      ),
    );

    // Lower area: Prediction prompt during Beat 0, Admission records in Beat 1, Handoff in Beat 2
    if (st <= 1) {
      nodes.push(
        glassCell(0, 125, 1660, 175, st === 1 ? COSMOS.gold : COSMOS.dim, {
          fill: st === 1 ? '#231c0e' : '#0b101d',
          glow: st === 1 ? 10 : 3,
        }),
        txt(
          st === 1
            ? 'PREDICTION: WHICH INTERVAL WOULD YOU INVESTIGATE FIRST?'
            : 'MEASURING R1 ARRIVAL TO FIRST TOKEN...',
          0,
          96,
          30,
          st === 1 ? COSMOS.gold : COSMOS.muted,
          'mono',
        ),
        txt(
          st === 1
            ? 'Input: 20 ms   |   Queue: 80 ms   |   Prefill: 40 ms   |   Deliver: 10 ms'
            : 'Tracing Input -> Queue -> Prefill -> Deliver',
          0,
          156,
          26,
          COSMOS.ink,
          'mono',
        ),
      );
    } else {
      nodes.push(
        txt(
          'ENGINE CORE QUEUE INTERVAL (80 MS): ADMISSION RECORDS FOR R1’S 5 REMAINING INPUTS',
          -830,
          -8,
          26,
          ROLE.r1,
          'mono',
          'left',
        ),
      );

      // Attempt 1 (20 ms -> WAIT)
      nodes.push(
        glassCell(0, 62, 1660, 86, COSMOS.gold, { fill: '#251d0e', glow: 8 }),
        txt('20 ms', -790, 62, 28, COSMOS.ink, 'mono', 'left'),
        txt('Step budget: 5 / 5 fit', -470, 62, 26, ROLE.r0, 'mono'),
        txt('KV pool: 2 blocks needed / 1 free', 110, 62, 26, COSMOS.gold, 'mono'),
        txt('WAIT', 775, 62, 30, ROLE.bad, 'mono', 'right'),
      );

      // Attempt 2 (100 ms -> ISSUE WORK)
      if (st >= 3) {
        nodes.push(
          glassCell(0, 164, 1660, 86, ROLE.good, { fill: '#0e2922', glow: 9 }),
          txt('100 ms', -790, 164, 28, COSMOS.ink, 'mono', 'left'),
          txt('Step budget: 5 / 5 fit', -470, 164, 26, ROLE.r0, 'mono'),
          txt('KV pool: 2 blocks needed / 2 free', 110, 164, 26, ROLE.good, 'mono'),
          txt('ISSUE WORK', 775, 164, 30, ROLE.good, 'mono', 'right'),
        );
      }

      // Worker handoff (Beat 2)
      if (st >= 4) {
        nodes.push(
          glassCell(0, 268, 1660, 84, ROLE.kv, { fill: '#0e2432', glow: 10 }),
          txt(
            'WORKER HANDOFF:   R1   |   5 inputs   |   Block Table [ 12, 73, 90 ]   (private network)',
            0,
            268,
            28,
            ROLE.kv,
            'mono',
          ),
        );
      }
    }

    const caption =
      st >= 4
        ? 'Keep R1’s handoff record intact across runner, attention backend, authenticated API & private worker fabric'
        : st === 3
          ? 'At 100 ms two blocks are free -> R1 admitted (check intervening attempts & scheduler CPU for full wait)'
          : st === 2
            ? 'Opening the 80 ms queue reveals R1 waited for 1 more KV block at 20 ms'
            : 'Follow the longest interval on R1’s arrival-to-first-token clock';

    nodes.push(txt(caption, 0, 388, 26, st === 1 ? COSMOS.gold : COSMOS.ink, 'sans'));
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  c.on('synthesis-input', () => s.play(clockStage.to(1, { duration: 0.2 })));
  c.on('synthesis-queue', () => s.play(clockStage.to(2, { duration: 0.2 })));
  c.on('synthesis-prefill', () => s.play(clockStage.to(3, { duration: 0.2 })));
  c.on('synthesis-deliver', () => s.play(clockStage.to(4, { duration: 0.2 })));
  wireStepCues(s, c, step, [
    ['synthesis-question', 1],
    ['synthesis-first-attempt', 2, true],
    ['synthesis-second-attempt', 3, true],
    ['synthesis-handoff', 4, true],
  ]);
}
