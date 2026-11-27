// Scene 06: Spend one scheduler budget on decode and unmatched prompt work (6-token mixed budget: 1+5, then 1+4, then 2 decodes).
import {
  BUDGET_STEP_0,
  BUDGET_STEP_1,
  COSMOS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function mixedBudget(s, c) {
  // step: 0=6-token budget + 4 cached, 1=step 0 (1 decode + 5 prefill = 6), 2=4 left,
  // 3=step 1 (1 decode + 4 prefill = 5), 4=out0 selected (KV pending), 5=later decode creates out0 KV, 6=general rule
  const step = s.value(0);

  const bgAura = aura(0, 20, 640, '#6ee7b71a', '#5ce1e618');
  const title = heroTitle(['One Step Budget:', 'Decode Plus Prefill'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.decode,
    eyebrow: 'CHUNKED PREFILL · 6 FRESH INPUT POSITIONS / STEP',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [];

    // Row 1: R1 cached prefix (4 reused KV positions)
    nodes.push(txt('R1 CACHED PREFIX (REUSED KV)', -550, -185, 26, ROLE.radix, 'mono'));
    ['A', 'B', 'C', 'D'].forEach((tok, i) => {
      const cx = -130 + i * 165;
      nodes.push(
        glassCell(cx, -185, 145, 76, ROLE.radix, { fill: '#0e2536', glow: 8 }),
        txt(tok, cx, -185, 32, ROLE.radix, 'mono'),
      );
    });
    nodes.push(txt('0 fresh cost', 625, -185, 26, ROLE.decode, 'mono'));

    // Row 2: Active 6-slot scheduler budget
    const isStep1 = st >= 3;
    const stepSlots = isStep1
      ? ['R0 dec', 'p5', 'p6', 'p7', 'p8', 'free']
      : ['R0 dec', 'p0', 'p1', 'p2', 'p3', 'p4'];
    const activeCount = isStep1 ? BUDGET_STEP_1.spent : st >= 1 ? BUDGET_STEP_0.spent : 1;

    nodes.push(
      txt(
        isStep1 ? 'STEP 1 SCHEDULE (1 + 4 = 5)' : 'STEP 0 SCHEDULE (6-TOKEN BUDGET)',
        0,
        -88,
        26,
        COSMOS.gold,
        'mono',
      ),
    );

    stepSlots.forEach((lbl, i) => {
      const cx = -625 + i * 250;
      const isDec = i === 0;
      const isActive = i < activeCount;
      const col = isDec ? ROLE.decode : isActive ? ROLE.prefill : COSMOS.dim;
      nodes.push(
        glassCell(cx, -10, 224, 96, col, {
          fill: isDec ? '#0d2922' : isActive ? '#10213d' : '#0a0f1c',
          glow: isActive ? 9 : 2,
        }),
        txt(lbl, cx, -10, 30, isActive ? COSMOS.ink : COSMOS.dim, 'mono'),
      );
    });

    // Row 3: R1 9 unmatched prompt positions
    const donePrompt = isStep1 ? 9 : st >= 1 ? BUDGET_STEP_0.prefill : 0;
    nodes.push(
      txt(
        `R1 UNMATCHED PROMPT (9 POSITIONS · ${9 - donePrompt} REMAINING)`,
        0,
        104,
        26,
        COSMOS.muted,
        'mono',
      ),
    );
    for (let i = 0; i < 9; i++) {
      const cx = -640 + i * 160;
      const done = i < donePrompt;
      nodes.push(
        glassCell(cx, 170, 140, 74, done ? ROLE.prefill : COSMOS.dim, {
          fill: done ? '#11223d' : '#0a0f1c',
          glow: done ? 7 : 2,
        }),
        txt(`p${i}`, cx, 170, 28, done ? COSMOS.ink : COSMOS.dim, 'mono'),
      );
    }

    // Selected output vs KV status bar
    if (st >= 4) {
      const kvDone = st >= 5;
      nodes.push(
        glassCell(0, 275, 1180, 68, kvDone ? ROLE.decode : COSMOS.gold, {
          fill: kvDone ? '#0d2922' : '#221c10',
          glow: 9,
        }),
        txt(
          st >= 6
            ? 'Rule: prefill_chunk = min(unmatched, budget - scheduled_decode)'
            : kvDone
              ? 'Next decode consumes out0 as input -> creates out0 KV'
              : 'Step 1 finishes prompt & selects out0 (out0 KV still pending)',
          0,
          275,
          26,
          st >= 6 ? ROLE.radix : kvDone ? ROLE.decode : COSMOS.gold,
          'mono',
        ),
      );
    }

    nodes.push(
      txt(
        st >= 6
          ? 'Larger chunks speed new TTFT; smaller chunks protect active decode ITL.'
          : st >= 3
            ? 'Step 1 spends 1 decode + 4 prefill to finish R1 prompt.'
            : 'Reserve 1 decode slot for R0 first, leaving 5 slots for R1 prefill.',
        0,
        365,
        28,
        COSMOS.ink,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['sg-mixed-budget-beat-0', 0],
    ['sg-budget-five', 1, true],
    ['sg-mixed-budget-beat-1', 2],
    ['sg-budget-second', 3, true],
    ['sg-budget-selected', 4, true],
    ['sg-budget-next', 5, true],
    ['sg-mixed-budget-beat-2', 6],
  ]);
}
