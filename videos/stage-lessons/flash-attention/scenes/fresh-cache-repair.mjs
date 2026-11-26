// Scene 30: Which keys belong to this query?: Finale 8-slot cache repair + position-4 transfer test.
import { par } from 'vizmatic/stage';
import {
  COSMOS,
  FRESH_ABS_4,
  FRESH_ABS_5,
  FRESH_ALL,
  FRESH_UPPER,
  FRESH_VALUES,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function freshCacheRepair(s, c) {
  const phase = s.value(0);
  // modeStage: 0=premise/question, 1=upper-left(2), 2=open(255.25), 3=absolute@5(7), 4=query@4 question, 5=absolute@4(6)
  const stageMode = s.value(0);
  const answerKnown = s.value(0);
  const sum30Known = s.value(0);

  const bgAura = aura(0, 10, 620, '#5ce1e622', '#6ee7b716');
  const title = heroTitle(['Which Keys', 'Belong?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'FINALE · 8-SLOT CACHE (6 VALID, 2 UNUSED)',
  });

  const cellW = 178;
  const stride = 204;
  const xStart = -714;
  const slotY = -55;

  const live = guardedDynamic(1, () => {
    const mode = Math.round(stageMode.value);
    const known = answerKnown.value > 0.5;
    const sum30 = sum30Known.value > 0.5;
    const qPos = mode >= 4 ? 4 : 5;
    const row =
      mode === 1
        ? FRESH_UPPER
        : mode === 2
          ? FRESH_ALL
          : mode === 3
            ? FRESH_ABS_5
            : mode >= 4
              ? FRESH_ABS_4
              : FRESH_ABS_5;
    const showMask = mode === 1 || mode === 2 || mode === 3 || mode === 5;
    const isGood = mode === 3 || mode === 5;

    const nodes = [
      txt('ALL SCORES = 0  ·  EACH ADMITTED KEY GETS WEIGHT 1', 300, -355, 26, COSMOS.cyan, 'mono'),
    ];

    // Query pointer above slot qPos
    const qx = xStart + qPos * stride;
    nodes.push(
      txt(`Query at pos ${qPos}`, qx, -242, 30, COSMOS.gold, 'mono').glow(6, COSMOS.gold),
      line([qx, -214], [qx, -174], { stroke: COSMOS.gold, width: 3.5 }).glow(8, COSMOS.gold),
      glowDot(qx, -174, { radius: 6, color: COSMOS.gold }),
    );

    // 8 cache slots
    for (let i = 0; i < 8; i++) {
      const cx = xStart + i * stride;
      const isValidSlot = i < 6;
      const admitted = showMask && row.allowed[i];
      const droppedFuture = mode === 5 && i === 5;
      const col = droppedFuture
        ? COSMOS.amber
        : admitted
          ? isGood
            ? COSMOS.emerald
            : COSMOS.rose
          : isValidSlot
            ? COSMOS.blue
            : COSMOS.dim;

      nodes.push(
        txt(`p${i}`, cx, -142, 26, col, 'mono'),
        glassCell(cx, slotY, cellW, 108, col, {
          fill: admitted ? (isGood ? '#0d2626' : '#26111c') : isValidSlot ? '#10182b' : '#0b0e19',
          dash: !isValidSlot ? [8, 6] : undefined,
          glow: admitted ? 10 : 0,
        }),
        txt(
          String(FRESH_VALUES[i]),
          cx,
          slotY,
          38,
          isValidSlot || admitted ? COSMOS.ink : COSMOS.dim,
          'mono',
        ),
      );

      if (admitted) {
        nodes.push(
          rect(cellW - 14, 14, {
            fill: isGood ? COSMOS.emerald : COSMOS.rose,
            stroke: null,
            radius: 5,
          })
            .at(cx, slotY + 74)
            .glow(8, isGood ? COSMOS.emerald : COSMOS.rose),
        );
      } else if (droppedFuture) {
        nodes.push(
          txt('FUTURE (OUT)', cx, slotY + 76, 26, COSMOS.amber, 'mono').glow(5, COSMOS.amber),
        );
      }
    }

    // Valid vs unused capacity brackets
    const validMid = xStart + 2.5 * stride;
    const unusedMid = xStart + 6.5 * stride;
    nodes.push(
      line([xStart - 80, 74], [xStart + 5 * stride + 80, 74], { stroke: COSMOS.cyan, width: 2 }),
      txt('6 valid token slots', validMid, 112, 26, COSMOS.cyan, 'mono'),
      line([xStart + 6 * stride - 80, 74], [xStart + 7 * stride + 80, 74], {
        stroke: COSMOS.dim,
        width: 2,
      }),
      txt('2 leftover slots', unusedMid, 112, 26, COSMOS.muted, 'mono'),
    );

    // Bottom formula / verdict box (strictly withholding answers during questions!)
    let header = 'Compare mask contracts on the exact same 8-slot cache';
    let mainLine = 'Which keys belong in the average for query position 5?';
    let mainCol = COSMOS.gold;

    if (mode === 1) {
      header = 'UPPER-LEFT CAUSAL MASK · ADMITS ONLY COL 0';
      mainLine = known ? `Wrong blend = ${FRESH_UPPER.output}` : 'Only slot 0 passes...';
      mainCol = COSMOS.rose;
    } else if (mode === 2) {
      header = 'UNMASKED (ALL 8 SLOTS) · LEAKS TWO 1000s';
      mainLine = known
        ? `Wrong blend = ${FRESH_ALL.output.toFixed(2)}`
        : 'All 8 slots enter the sum...';
      mainCol = COSMOS.rose;
    } else if (mode === 3) {
      header = 'j < valid_length (6)  AND  j <= query_pos (5)';
      mainLine = known
        ? `m = 0  ·  ℓ = 6  ·  N = 42   →   42 / 6 = ${FRESH_ABS_5.output}  (exact)`
        : '6 valid keys pass: 2 + 4 + 6 + 8 + 10 + 12';
      mainCol = COSMOS.emerald;
    } else if (mode === 4) {
      header = 'QUERY MOVES BACK TO POSITION 4 (CACHE UNCHANGED)';
      mainLine = 'Which value drops out, and what does the query return now?';
      mainCol = COSMOS.gold;
    } else if (mode === 5) {
      header = 'SLOT 5 (12) LIES AHEAD OF QUERY 4 → DROPS OUT';
      mainLine = known
        ? `m = 0  ·  ℓ = 5  ·  N = 30   →   30 / 5 = ${FRESH_ABS_4.output}  (verified!)`
        : sum30
          ? '5 keys sum to 30   →   30 / 5 = ?'
          : '12 drops out · remaining: 2, 4, 6, 8, 10';
      mainCol = COSMOS.emerald;
    }

    nodes.push(
      glassCell(0, 295, 1620, 175, mainCol, { fill: '#10182b', glow: 10 }),
      txt(header, 0, 248, 26, COSMOS.muted, 'mono'),
      txt(mainLine, 0, 315, 36, mainCol, 'mono').glow(7, mainCol),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('cache-premise', () => s.play(stageMode.to(0, { duration: 0.01 })));
  c.on('cache-question', () => s.play(answerKnown.to(0, { duration: 0.01 })));

  c.on('upper-mask', () =>
    s.play(par(answerKnown.to(0, { duration: 0.01 }), stageMode.to(1, { duration: 0.01 }))),
  );
  c.after('fa-fresh-two', () => s.play(answerKnown.to(1, { duration: 0.01 })));

  c.on('fa-fresh-unmasked', () =>
    s.play(par(answerKnown.to(0, { duration: 0.01 }), stageMode.to(2, { duration: 0.01 }))),
  );
  c.after('fa-fresh-255', () => s.play(answerKnown.to(1, { duration: 0.01 })));

  c.on('fa-fresh-repair', () =>
    s.play(par(answerKnown.to(0, { duration: 0.01 }), stageMode.to(3, { duration: 0.01 }))),
  );
  c.after('fa-fresh-seven', () => s.play(answerKnown.to(1, { duration: 0.01 })));

  c.on('move-query', () =>
    s.play(par(answerKnown.to(0, { duration: 0.01 }), stageMode.to(4, { duration: 0.01 }))),
  );
  c.on('last-question', () => s.play(sum30Known.to(0, { duration: 0.01 })));

  c.on('future-key', () => s.play(stageMode.to(5, { duration: 0.01 })));
  c.after('five-sum', () => s.play(sum30Known.to(1, { duration: 0.01 })));
  c.after('five-answer', () =>
    s.play(answerKnown.to(1, { duration: remainDuration(c, 'five-answer', 0.05) })),
  );
}
