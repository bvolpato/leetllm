// Scene 12: Which rows reach the next check? (Shift-left judge savings, 98/2 false-admission grid, dynamic pool replay)
import {
  COSMOS,
  NOVELTY_EXAMPLE,
  NOVELTY_REPLAY_B,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  maxCosine,
  orderAudit,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function admissionEconomics(s, c) {
  const phase = s.value(0);
  // Act 1: Shift-left calls
  const sTwo = s.value(0);
  const sFour = s.value(0);
  const sCost = s.value(0);
  const sTwelve = s.value(0);
  // Act 2: 98/2 calibration matrix
  const sAct2 = s.value(0);
  const sBad = s.value(0);
  const sDenom = s.value(0);
  // Act 3: Stateful pool novelty + replay
  const sAct3 = s.value(0);
  const sBAdmit = s.value(0);
  const sCompareC = s.value(0);
  const sCReject = s.value(0);
  const sReplay = s.value(0);
  const sVoteFlip = s.value(0);
  const sWithholdB = s.value(0);
  const sPoolAsk = s.value(0);
  const sRecheck = s.value(0);
  const scoreSlide = s.value(0);
  const sCJudge = s.value(0);
  const sCAccept = s.value(0);

  const bgAura = aura(0, 20, 680, '#133a5c28', '#331b4418');

  const title = heroTitle(['Which Rows Reach', 'the Next Check?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'SHIFT-LEFT ECONOMICS · CLASS DENOMINATORS & STATEFUL NOVELTY',
  });

  const { references, proposals, cutoff } = NOVELTY_EXAMPLE;
  const [rowB, rowC] = proposals;
  const bScore = maxCosine(rowB.vector, references); // ~0.7474
  const cVsBScore = maxCosine(rowC.vector, [...references, rowB.vector]); // ~0.999999
  const cVsOrigScore = maxCosine(rowC.vector, references); // ~0.7466

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    // Act 3: Dynamic Pool Novelty + Judge-Withheld Replay
    if (sAct3.value > 0.5) {
      const rep = sReplay.value > 0.5;
      const keptB = !rep && sBAdmit.value > 0.5;
      const compC = !rep && sCompareC.value > 0.3;
      const rejC = !rep && sCReject.value > 0.5;
      const whB = rep && sWithholdB.value > 0.5;
      const askP = rep && sPoolAsk.value > 0.3 && sRecheck.value < 0.3;
      const rechk = rep && sRecheck.value > 0.3;
      const slide = scoreSlide.value;
      const cJdg = rep && sCJudge.value > 0.3;
      const cAcc = rep && sCAccept.value > 0.5;

      const members = ['[1, 0]', '[0, 1]'];
      if (keptB) members.push('B');
      if (cAcc) members.push('C');

      const vote = orderAudit(...(rep && sVoteFlip.value > 0.3 ? NOVELTY_REPLAY_B : rowB).votes);

      // Cosine ruler [0.70, 1.00]
      const leftX = -740;
      const rightX = 740;
      const rulerY = 128;
      const toX = (v) => leftX + ((v - 0.7) / 0.3) * (rightX - leftX);

      let curVal = bScore;
      let curLabel = 'B vs original references [1,0], [0,1]';
      if (rep) {
        curVal = cVsBScore + (cVsOrigScore - cVsBScore) * slide;
        curLabel =
          slide > 0.35
            ? 'Rechecked: C vs original references [1,0], [0,1]'
            : 'Earlier blocked score: C compared with B';
      } else if (compC) {
        curVal = cVsBScore;
        curLabel = 'C compared with accepted pool { [1,0], [0,1], B }';
      }

      const markerX = toX(curVal);
      const cutX = toX(cutoff);
      const markerCol = curVal >= cutoff ? COSMOS.rose : COSMOS.emerald;

      const nodes = [
        txt('ACCEPTED REFERENCE POOL', -815, -182, 26, COSMOS.blue, 'mono', 'left'),
        ...members.map((m, idx) => {
          const mx = -305 + idx * 210;
          const mCol = m === 'C' ? COSMOS.emerald : m === 'B' ? COSMOS.cyan : COSMOS.blue;
          return group(
            glassCell(mx, -182, 180, 68, mCol, { fill: '#102138', glow: 6 }),
            txt(m, mx, -180, 30, mCol, 'mono'),
          );
        }),

        // B judge status row
        glassCell(0, -76, 1620, 76, whB ? COSMOS.rose : COSMOS.cyan, {
          fill: whB ? '#261018' : '#0f1c32',
          glow: whB ? 7 : 3,
        }),
        txt(
          whB
            ? `REPLAY · Row B judge votes: Forward ${vote.forwardA.toFixed(2)} / Reversed ${vote.remappedA.toFixed(2)}  ->  B WITHHELD`
            : `Row B judge votes: Forward ${vote.forwardA.toFixed(2)} / Reversed ${vote.remappedA.toFixed(2)}  ->  ${keptB ? 'B joins pool' : 'stable'}`,
          -775,
          -74,
          26,
          whB ? COSMOS.rose : COSMOS.ink,
          'mono',
          'left',
        ),

        // Cosine ruler
        txt(curLabel, leftX, 20, 28, COSMOS.ink, 'sans', 'left'),
        line([leftX, rulerY], [rightX, rulerY], { stroke: COSMOS.rule, width: 5 }),
        txt('0.70', leftX, rulerY + 52, 26, COSMOS.muted, 'mono'),
        txt('1.00', rightX, rulerY + 52, 26, COSMOS.muted, 'mono'),

        // Cutoff line at 0.82
        line([cutX, rulerY - 46], [cutX, rulerY + 26], { stroke: COSMOS.gold, width: 4.2 }).glow(
          8,
          COSMOS.gold,
        ),
        txt(`cutoff ${cutoff.toFixed(2)}`, cutX, rulerY + 52, 28, COSMOS.gold, 'mono'),

        // Active score dot + label (always matches exact curVal!)
        glowDot(markerX, rulerY, { radius: 11, color: markerCol }),
        txt(
          curVal.toFixed(curVal > 0.99 ? 6 : 4),
          Math.max(leftX + 80, Math.min(rightX - 80, markerX)),
          rulerY - 48,
          32,
          markerCol,
          'mono',
        ),
      ];

      let foot = 'B clears 0.82 cutoff and joins the accepted pool';
      let footCol = COSMOS.cyan;
      if (rejC) {
        foot = 'C matches B (0.999999 >= 0.82) -> C stops at diversity check';
        footCol = COSMOS.rose;
      } else if (rep && !whB && !askP && !rechk) {
        foot = 'Replay B & C: flip judge vote for B';
        footCol = COSMOS.amber;
      } else if (whB && !askP && !rechk) {
        foot = 'B withheld by judge -> only accepted rows stay in pool';
        footCol = COSMOS.rose;
      } else if (askP) {
        foot = 'PREDICT: With B withheld, which references should decide C next?';
        footCol = COSMOS.gold;
      } else if (rechk && !cJdg) {
        foot = 'Use only the 2 original references [1,0] & [0,1] -> C drops to 0.7466';
        footCol = COSMOS.cyan;
      } else if (cJdg && !cAcc) {
        foot = 'C clears novelty (< 0.82) and reaches the judge...';
        footCol = COSMOS.gold;
      } else if (cAcc) {
        foot = 'C wins in both judge orders -> C joins the accepted pool!';
        footCol = COSMOS.emerald;
      }

      nodes.push(
        glassCell(0, 355, 1660, 92, footCol, { fill: '#10182b', glow: 7 }),
        glowDot(-790, 355, { radius: 7, color: footCol }),
        txt(foot, -755, 357, 28, footCol, 'mono', 'left'),
      );
      return group(...nodes);
    }

    // Act 2: 98/2 calibration matrix (100 cells = 20 x 5)
    if (sAct2.value > 0.5) {
      const dn = sDenom.value > 0.3 || sBad.value > 0.3;
      const nodes = [
        txt(
          'CALIBRATION SLICE (100 REVIEWED ROWS) · RUBBER-STAMP JUDGE',
          0,
          -196,
          26,
          COSMOS.blue,
          'mono',
        ),
      ];
      for (let i = 0; i < 100; i++) {
        const col = i % 20;
        const row = Math.floor(i / 20);
        const cx = -760 + col * 80;
        const cy = -104 + row * 68;
        const isBad = i >= 98;
        nodes.push(
          rect(62, 48, {
            fill: isBad ? '#59162b' : '#13305e',
            stroke: isBad ? COSMOS.rose : COSMOS.blue,
            width: isBad ? 3 : 1.6,
            radius: 6,
          })
            .at(cx, cy)
            .glow(isBad ? 10 * pulse : 0, COSMOS.rose),
        );
      }

      nodes.push(
        glassCell(-415, 326, 750, 128, COSMOS.blue, { fill: '#0e1d36', glow: 5 }),
        txt('HEADLINE OVERALL AGREEMENT', -415, 294, 26, COSMOS.muted, 'mono'),
        txt('98 / 100 = 98%', -415, 348, 36, COSMOS.blue, 'mono'),

        glassCell(415, 326, 750, 128, COSMOS.rose, {
          fill: '#281119',
          glow: dn ? 10 * pulse : 4,
        }),
        txt('BAD-CLASS FALSE ADMISSION', 415, 294, 26, COSMOS.rose, 'mono'),
        txt(dn ? '2 / 2 = 100% ADMITTED!' : '? / 2 bad rows', 415, 348, 36, COSMOS.rose, 'mono'),
      );
      return group(...nodes);
    }

    // Act 1: Shift-left judge request count (2x2=4 vs 6x2=12)
    const two = sTwo.value > 0.3;
    const four = sFour.value > 0.3 || sCost.value > 0.3;
    const twelve = sTwelve.value > 0.3;

    const nodes = [
      txt(
        'SHIFT CHEAP FILTERS LEFT BEFORE TWO-ORDER LLM JUDGING',
        0,
        -196,
        26,
        COSMOS.cyan,
        'mono',
      ),
    ];

    for (let i = 0; i < 6; i++) {
      const cx = -675 + i * 270;
      const survives = !two || i < 2;
      const col = survives ? COSMOS.cyan : COSMOS.rose;
      nodes.push(
        glassCell(cx, -88, 224, 96, col, {
          fill: survives ? '#0f2338' : '#26111a',
          glow: survives ? 6 : 2,
          opacity: survives ? 1 : 0.74,
        }),
        txt(`C${i + 1}`, cx, -104, 30, col, 'mono'),
        txt(
          survives ? 'to judge' : 'stopped',
          cx,
          -64,
          26,
          survives ? COSMOS.emerald : COSMOS.rose,
          'mono',
        ),
      );
    }

    // Bar 1: Gated (4 requests)
    nodes.push(
      txt('GATED (2 ROWS x 2 ORDERS)', -815, 86, 26, COSMOS.emerald, 'mono', 'left'),
      rect(four ? 380 : 120, 68, {
        fill: '#0f362f',
        stroke: COSMOS.emerald,
        width: 2.6,
        radius: 8,
      })
        .at(-220 + (four ? 190 : 60), 86)
        .glow(four ? 8 : 2, COSMOS.emerald),
      txt(
        four ? '4 requests  (saves 2/3!)' : 'pending...',
        210,
        88,
        30,
        COSMOS.emerald,
        'mono',
        'left',
      ),

      // Bar 2: Ungated (12 requests)
      txt('UNGATED (6 ROWS x 2 ORDERS)', -815, 210, 26, COSMOS.blue, 'mono', 'left'),
      rect(twelve ? 1020 : 120, 68, {
        fill: '#112548',
        stroke: COSMOS.blue,
        width: 2.6,
        radius: 8,
      })
        .at(-220 + (twelve ? 510 : 60), 210)
        .glow(twelve ? 6 : 2, COSMOS.blue),
      txt(twelve ? '12 requests' : '...', -220 + (twelve ? 510 : 210), 212, 30, COSMOS.ink, 'mono'),

      txt(
        'Supplied votes · real costs also vary with answer length and retries',
        0,
        355,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 16);

  c.on('two-judged', () => s.play(sTwo.to(1, { duration: 0.4 })));
  c.on('gate-cost', () => s.play(sCost.to(1, { duration: 0.4 })));
  c.after('four-calls', () => s.play(sFour.to(1, { duration: 0.35 })));
  c.after('twelve-calls', () => s.play(sTwelve.to(1, { duration: 0.35 })));

  c.on('bad-class', () => {
    s.play(sAct2.to(1, { duration: 0.3 }), sBad.to(1, { duration: 0.4 }));
  });
  c.after('bad-denominator', () => s.play(sDenom.to(1, { duration: 0.35 })));

  c.on('pool-rule', () => s.play(sAct3.to(1, { duration: 0.35 })));
  c.after('pool-b-admitted', () => s.play(sBAdmit.to(1, { duration: 0.35 })));
  c.on('pool-c', () => s.play(sCompareC.to(1, { duration: 0.4 })));
  c.after('pool-c-rejected', () => s.play(sCReject.to(1, { duration: 0.35 })));

  c.on('pool-replay', () => s.play(sReplay.to(1, { duration: 0.35 })));
  c.on('pool-vote-change', () => s.play(sVoteFlip.to(1, { duration: 0.4 })));
  c.after('pool-withhold', () => s.play(sWithholdB.to(1, { duration: 0.35 })));
  c.on('pool-question', () => s.play(sPoolAsk.to(1, { duration: 0.4 })));

  c.after('pool-recheck', () => s.play(sRecheck.to(1, { duration: 0.35 })));
  c.on('pool-new-score', () => s.play(scoreSlide.to(1, { duration: 0.85 })));
  c.on('pool-judge', () => s.play(sCJudge.to(1, { duration: 0.4 })));
  c.after('pool-accept', () =>
    s.play(sCAccept.to(1, { duration: remainDuration(c, 'pool-accept', 0.4) })),
  );
}
