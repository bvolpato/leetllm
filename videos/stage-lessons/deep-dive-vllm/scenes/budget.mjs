// Scene 11: What comes out of a six-input step? (Continuous batching + chunked prefill over 3 steps: 1+5=6/6, 1+4=5/6 -> "and", 1+1=2/6 -> "sang").
import {
  COSMOS,
  R1_WORDS,
  ROLE,
  SCHED_6,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function budget(s, c) {
  // step:
  // 0 = active-decode (Step 0: reserve R0 decode)
  // 1 = first-prompt-slice (Step 0: place R1 words 0..4 -> 6/6 assigned)
  // 2 = first-return (Step 0 finished -> 5/9 computed, output still waiting)
  // 3 = reserve-again (Step 1: reserve R0 decode)
  // 4 = prompt-tail (Step 1: place R1 words 5..8 -> 5/6 assigned, 1 empty)
  // 5 = first-output (Step 1 finished -> 9/9 computed, R1 samples "and")
  // 6 = both-decode (Step 2: R0 decode + R1 "and" -> 2/6 assigned)
  // 7 = next-output (Step 2 finished -> R1 samples "sang")
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#a78bfa1c', '#6ee7b716');
  const title = heroTitle(['What Comes Out of a', 'Six-Input Step?'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.r1,
    eyebrow: 'UNIFIED TOKEN BUDGET · CHUNKED PREFILL · CONTINUOUS BATCHING',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const stepIdx = st >= 6 ? 2 : st >= 3 ? 1 : 0;
    const row = SCHED_6[stepIdx];
    const computedPrompt = st >= 5 ? 9 : st >= 2 ? 5 : 0;
    const emitted = st >= 7 ? ['and', 'sang'] : st >= 5 ? ['and'] : [];

    // Active slots in current GPU step
    const slots = [];
    if (stepIdx === 0) {
      slots.push({ label: 'R0 decode', col: ROLE.r0 });
      if (st >= 1) {
        for (let k = 0; k < 5; k++) slots.push({ label: R1_WORDS[k], col: ROLE.r1 });
      }
    } else if (stepIdx === 1) {
      slots.push({ label: 'R0 decode', col: ROLE.r0 });
      if (st >= 4) {
        for (let k = 5; k < 9; k++) slots.push({ label: R1_WORDS[k], col: ROLE.r1 });
      }
    } else {
      slots.push({ label: 'R0 decode', col: ROLE.r0 });
      slots.push({ label: 'R1: "and"', col: ROLE.good });
    }

    const nodes = [
      txt(
        `R1 PROMPT PROGRESS: ${computedPrompt} OF 9 COMPUTED (PREFIX REUSE OFF)`,
        -855,
        -255,
        26,
        ROLE.r1,
        'mono',
        'left',
      ),
    ];

    // Row 1: R1 9 prompt tokens
    const wCell = 172;
    const wGap = 16;
    R1_WORDS.forEach((word, i) => {
      const cx = -855 + wCell * 0.5 + i * (wCell + wGap);
      const done = i < computedPrompt;
      nodes.push(
        glassCell(cx, -185, wCell, 76, done ? ROLE.good : ROLE.r1, {
          fill: done ? '#0e2924' : '#18142c',
          glow: done ? 8 : 3,
        }),
        txt(word, cx, -185, 28, done ? ROLE.good : COSMOS.ink, 'mono'),
      );
    });

    // Row 2: GPU Step 6-slot rail
    nodes.push(
      txt(
        `GPU STEP ${row.step}  (${slots.length} OF 6 INPUT POSITIONS ASSIGNED)`,
        -855,
        -78,
        26,
        ROLE.r0,
        'mono',
        'left',
      ),
    );
    const sCell = 266;
    const sGap = 20;
    for (let i = 0; i < 6; i++) {
      const cx = -855 + sCell * 0.5 + i * (sCell + sGap);
      const item = slots[i];
      nodes.push(
        glassCell(cx, -4, sCell, 92, item ? item.col : COSMOS.dim, {
          fill: item ? '#131d33' : '#0a0f1c',
          glow: item ? 9 : 2,
        }),
        txt(item ? item.label : 'empty', cx, -4, 28, item ? COSMOS.ink : COSMOS.dim, 'mono'),
      );
    }

    // Row 3: R1 Output Stream
    nodes.push(txt('R1 SAMPLED OUTPUT STREAM', -855, 114, 26, ROLE.good, 'mono', 'left'));
    if (emitted.length === 0) {
      nodes.push(
        glassCell(-410, 192, 890, 88, COSMOS.dim, { fill: '#0b101d', glow: 3 }),
        txt(
          'Waiting for final prompt position to produce logits...',
          -410,
          192,
          26,
          COSMOS.muted,
          'sans',
        ),
      );
    } else {
      emitted.forEach((tok, i) => {
        const cx = -720 + i * 290;
        nodes.push(
          glassCell(cx, 192, 260, 88, ROLE.good, { fill: '#0e2d25', glow: 11 }),
          txt(`"${tok}"`, cx, 192, 34, ROLE.good, 'mono'),
        );
      });
    }

    // Step ledger badge on lower right
    nodes.push(
      glassCell(470, 192, 740, 88, COSMOS.gold, { fill: '#221b0e', glow: 7 }),
      txt(
        `Step ${row.step}: R0_dec=${row.r0Decode} | R1_pre=${row.r1Prefill} | R1_dec=${row.r1Decode}`,
        470,
        192,
        26,
        COSMOS.gold,
        'mono',
      ),
    );

    const caption =
      st >= 7
        ? 'Active requests change between steps: continuous batching separates input work from reader output'
        : st === 6
          ? 'Step 2 feeds "and" back in beside R0 decode (2 of 6 positions run)'
          : st === 5
            ? 'Final prompt token produces logits -> R1 samples its first output "and"!'
            : st >= 3
              ? 'Step 1 reserves 1 for R0 and runs R1’s last 4 prompt words (1 place stays empty)'
              : st === 2
                ? 'Worker finishes Step 0: 5 prompt words done, reader still waits for first token'
                : 'Step 0 reserves 1 decode place for R0 and fills 5 remaining places with R1 prompt words';

    nodes.push(txt(caption, 0, 368, 26, st >= 5 ? ROLE.good : COSMOS.ink, 'sans'));
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['budget-active-decode', 0],
    ['budget-first-prompt-slice', 1],
    ['budget-first-return', 2, true],
    ['budget-reserve-again', 3],
    ['budget-prompt-tail', 4],
    ['budget-first-output', 5, true],
    ['budget-both-decode', 6],
    ['budget-next-output', 7, true],
  ]);
}
