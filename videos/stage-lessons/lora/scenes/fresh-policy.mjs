// Scene 35: Which change earns a release?: Grand finale double prediction!
// Part 1: Supplied scalar scoring layer prediction (x=[2,1] -> base -1 -> correction +1.5 -> +0.5 Escalate).
// Part 2: Dual 20-ticket release gate (>=19/20 each): Orig 19/18 HOLD -> predict A (P20) vs B (R07) -> A 20/18 HOLD -> B 19/19 PASS + handoff.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  POLICY_REQ,
  arrow,
  aura,
  circle,
  fmtNum,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  policyEvaluation,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function freshPolicy(s, c) {
  const showPart1 = s.value(1);
  const showX = s.value(0);
  const showBaseRow = s.value(0);
  const showFactorRow = s.value(0);

  // Part 1 strict prediction reveals (all triggered via c.after!)
  const revBase = s.value(0);
  const revZ = s.value(0);
  const revUnscaled = s.value(0);
  const revCorr = s.value(0);
  const revOut = s.value(0);
  const revDecision = s.value(0);

  // Part 2: 40-ticket dual release gate
  const showPart2 = s.value(0);
  const revPolicyCount = s.value(0);
  const revRegCount = s.value(0);
  const revHoldOrig = s.value(0);
  const showOptA = s.value(0);
  const showOptB = s.value(0);
  const applyFixA = s.value(0);
  const revVerdictA = s.value(0);
  const applyFixB = s.value(0);
  const revVerdictB = s.value(0);
  const showSave = s.value(0);
  const showResume = s.value(0);

  const bgAura = aura(0, 10, 660, '#ffd1661c', '#6ee7b71a');
  const title = heroTitle(['Which Change', 'Earns a Release?'], {
    x: -855,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.emerald,
    eyebrow: 'FINALE · SCORE & DUAL RELEASE GATE',
  });

  // Part 1: Scoring ruler [-2 .. +2]
  const mapScore = (v) => v * 330;
  const rulerY = 175;

  const part1 = guardedDynamic(showPart1, (a) => {
    const f = POLICY_REQ;
    const rb = revBase.value > 0.5;
    const rz = revZ.value > 0.5;
    const ru = revUnscaled.value > 0.5;
    const rc = revCorr.value > 0.5;
    const ro = revOut.value > 0.5;
    const rd = revDecision.value > 0.5;

    const nodes = [
      txt(
        'SUPPLIED SCORING LAYER · NEGATIVE = ROUTINE · >= 0 = ESCALATE',
        855,
        -380,
        26,
        COSMOS.cyan,
        'mono',
        'right',
      ).opacity(a),

      // Top operands row
      glassCell(-575, -185, 490, 114, showX.value > 0.2 ? COSMOS.cyan : '#334268', {
        fill: '#101d35',
        glow: 7,
        opacity: a,
      }),
      txt('INPUT  x', -575, -214, 26, COSMOS.muted, 'mono').opacity(a),
      txt(`x = [${f.x.join(', ')}]`, -575, -162, 34, COSMOS.cyan, 'mono').opacity(a),

      glassCell(-20, -185, 510, 114, showBaseRow.value > 0.2 ? COSMOS.blue : '#334268', {
        fill: '#101b36',
        glow: 7,
        opacity: a,
      }),
      txt('FROZEN ROW  W_0', -20, -214, 26, COSMOS.muted, 'mono').opacity(a),
      txt(
        `W_0 = [${f.W[0].map((v) => fmtNum(v)).join(', ')}]`,
        -20,
        -162,
        34,
        COSMOS.blue,
        'mono',
      ).opacity(a),

      glassCell(555, -185, 540, 114, showFactorRow.value > 0.2 ? COSMOS.gold : '#334268', {
        fill: '#221c10',
        glow: 7,
        opacity: a,
      }),
      txt('ADAPTER  (α / r = 2)', 555, -214, 26, COSMOS.muted, 'mono').opacity(a),
      txt(`A=[1, −0.5]  B=0.5`, 555, -162, 32, COSMOS.gold, 'mono').opacity(a),
    ];

    // 4 arithmetic step boxes (withholding all answers until their c.after cues!)
    const steps = [
      { label: '1. Base  W_0 x', val: fmtNum(f.base, 2), ready: rb, col: COSMOS.blue, x: -620 },
      { label: '2. Measure  Ax', val: fmtNum(f.z, 2), ready: rz, col: COSMOS.gold, x: -205 },
      {
        label: '3. Expand  B(Ax)',
        val: fmtNum(f.unscaled, 2),
        ready: ru,
        col: COSMOS.gold,
        x: 205,
      },
      { label: '4. Scale  × 2', val: fmtNum(f.correction, 2), ready: rc, col: COSMOS.gold, x: 620 },
    ];
    steps.forEach((st) => {
      nodes.push(
        glassCell(st.x, -18, 385, 134, st.ready ? st.col : '#334268', {
          fill: '#11182c',
          glow: st.ready ? 9 : 2,
          opacity: a,
        }),
        txt(st.label, st.x, -54, 26, COSMOS.muted, 'mono').opacity(a),
        txt(st.ready ? st.val : '?', st.x, 8, 42, st.ready ? st.col : COSMOS.dim, 'mono')
          .glow(st.ready ? 7 : 0, st.col)
          .opacity(a),
      );
    });

    // Threshold ruler [-2 .. +2]
    nodes.push(
      line([mapScore(-2), rulerY], [mapScore(2), rulerY], {
        stroke: '#4c6294',
        width: 3.5,
      }).opacity(a),
      txt('Routine review (< 0)', mapScore(-1.15), rulerY - 58, 26, COSMOS.muted, 'sans').opacity(
        a,
      ),
      txt('Rotation owner (>= 0)', mapScore(1.15), rulerY - 58, 26, COSMOS.emerald, 'sans').opacity(
        a,
      ),
    );
    for (const tick of [-2, -1, 0, 1, 2]) {
      const tx = mapScore(tick);
      nodes.push(
        line([tx, rulerY - (tick === 0 ? 34 : 14)], [tx, rulerY + 18], {
          stroke: tick === 0 ? COSMOS.ink : '#5d6e96',
          width: tick === 0 ? 4 : 2.2,
        }).opacity(a),
        txt(
          fmtNum(tick, 0),
          tx,
          rulerY + 46,
          26,
          tick === 0 ? COSMOS.ink : COSMOS.muted,
          'mono',
        ).opacity(a),
      );
    }

    if (rb) {
      const bx = mapScore(f.base);
      nodes.push(circle(11, COSMOS.blue).at(bx, rulerY).glow(10, COSMOS.blue).opacity(a));
      if (ro) {
        const ox = mapScore(f.output);
        nodes.push(
          arrow([bx, rulerY], [ox, rulerY], { stroke: COSMOS.gold, width: 6.5, tip: 15 })
            .glow(10, COSMOS.gold)
            .opacity(a),
          glowDot(ox, rulerY, { radius: 10, color: COSMOS.emerald, opacity: a }),
        );
      }
    }

    // Bottom prediction / answer verdict strip
    const vCol = rd ? COSMOS.emerald : ro ? COSMOS.gold : COSMOS.cyan;
    const vText = rd
      ? `Adapted score = +${fmtNum(f.output, 2)}  ->  Send to Rotation Owner`
      : ro
        ? `Adapted score = −1 + 1.5 = +${fmtNum(f.output, 2)}`
        : 'Prediction: where will the adapted score land on this ruler?';
    nodes.push(
      glassCell(0, 355, 1660, 118, vCol, { fill: '#10182d', glow: 9, opacity: a }),
      txt(vText, 0, 355, 34, vCol, 'mono').glow(6, vCol).opacity(a),
    );

    return group(...nodes);
  });

  // Part 2: Dual 20-ticket matrix (Policy + Routine) + Candidate A vs Candidate B
  const part2 = guardedDynamic(showPart2, (a) => {
    const pc = revPolicyCount.value > 0.5;
    const rc = revRegCount.value > 0.5;
    const hold0 = revHoldOrig.value > 0.5;
    const optA = showOptA.value > 0.5;
    const optB = showOptB.value > 0.5;
    const fixA = applyFixA.value > 0.5;
    const verA = revVerdictA.value > 0.5;
    const fixB = applyFixB.value > 0.5;
    const verB = revVerdictB.value > 0.5;
    const sv = showSave.value > 0.5;
    const res = showResume.value > 0.5;

    const repairId = fixB ? 'R07' : fixA ? 'P20' : undefined;
    const ev = policyEvaluation(repairId);
    const stageLabel = fixB
      ? 'CANDIDATE B (REPAIRS R07)'
      : fixA
        ? 'CANDIDATE A (REPAIRS P20)'
        : optA || optB
          ? 'COMPARE CANDIDATE A vs CANDIDATE B'
          : 'ORIGINAL CANDIDATE';

    const nodes = [
      txt(
        res
          ? 'RESUME: KEEP ADAPTER + OPTIMIZER + SCHEDULE + DATA POSITION'
          : sv
            ? 'SAVE TOGETHER: ADAPTER B + EXACT BASE REVISION + FORMAT'
            : '40 HELD-OUT TICKETS · RELEASE RULE: >= 19 / 20 (95%) IN EACH SET',
        855,
        -380,
        26,
        res || sv ? COSMOS.gold : COSMOS.emerald,
        'mono',
        'right',
      ).opacity(a),
      txt(stageLabel, -855, -215, 30, COSMOS.cyan, 'mono', 'left').opacity(a),
    ];

    const rowAvail = [pc, rc];
    ev.rows.forEach((row, rIdx) => {
      const y = -105 + rIdx * 155;
      const avail = rowAvail[rIdx];
      nodes.push(
        txt(
          rIdx === 0 ? 'POLICY (20)' : 'ROUTINE (20)',
          -855,
          y,
          28,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(a),
      );
      row.cases.forEach((t, j) => {
        const cx = -575 + j * 58;
        const isTarget =
          (optA && !fixA && !fixB && t.id === 'P20') ||
          (optB && !fixA && !fixB && t.id === 'R07') ||
          (fixA && !fixB && t.id === 'P20') ||
          (fixB && t.id === 'R07');
        const col = !avail ? COSMOS.dim : t.correct ? COSMOS.emerald : COSMOS.rose;
        nodes.push(
          rect(48, 72, {
            fill: isTarget ? '#2c2210' : !avail ? '#11182c' : t.correct ? '#0e2829' : '#2c1322',
            stroke: isTarget ? COSMOS.gold : col,
            width: isTarget ? 3.2 : 1.8,
            radius: 6,
          })
            .at(cx, y)
            .glow(isTarget ? 10 : 0, COSMOS.gold)
            .opacity(a),
          txt(t.id.slice(1), cx, y - 10, 26, col, 'mono').opacity(a),
          txt(!avail ? '·' : t.correct ? '✓' : '×', cx, y + 18, 26, col, 'mono').opacity(a),
        );
      });
      const scoreCol = !avail
        ? COSMOS.muted
        : row.rate >= ev.minimum
          ? COSMOS.emerald
          : COSMOS.rose;
      nodes.push(
        txt(avail ? `${row.correct} / 20` : '? / 20', 615, y - 10, 36, scoreCol, 'mono', 'left')
          .glow(avail ? 6 : 0, scoreCol)
          .opacity(a),
        txt(
          avail ? `${Math.round(row.rate * 100)}%` : 'pending',
          775,
          y - 10,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
      );
    });

    // Bottom verdict + handoff strip (strictly withholds Candidate B winner during prediction!)
    let vHead = 'Each set requires >= 19 / 20 (95%) independently';
    let vSub = 'Pooled accuracy alone can hide a regression failure';
    let vCol = COSMOS.cyan;

    if (verB) {
      vHead = 'PASS: CANDIDATE B (19/20 + 19/20 = 38/40)';
      vSub = 'Both A and B score 38/40 pooled, yet only B clears both 95% gates';
      vCol = COSMOS.emerald;
    } else if (fixB) {
      vHead = 'TRY B: R07 RETURNS TO ROUTINE REVIEW -> 19 / 20 ROUTINE';
      vSub = 'Policy = 19/20 · Routine = 19/20';
      vCol = COSMOS.emerald;
    } else if (verA) {
      vHead = 'HOLD CANDIDATE A: 20/20 POLICY + 18/20 ROUTINE (38/40 POOLED)';
      vSub = 'Routine set still below 19/20 minimum';
      vCol = COSMOS.rose;
    } else if (fixA) {
      vHead = 'TRY A: P20 MOVES TO ROTATION OWNER -> 20 / 20 POLICY';
      vSub = 'Checking routine set...';
      vCol = COSMOS.gold;
    } else if (optB) {
      vHead = 'PREDICTION: A FIXES P20 · B FIXES R07';
      vSub = 'Which candidate reaches >= 19 / 20 in BOTH sets?';
      vCol = COSMOS.gold;
    } else if (optA) {
      vHead = 'CANDIDATE A FIXES P20 (EVERY OTHER TICKET UNCHANGED)';
      vSub = 'Waiting for Candidate B...';
      vCol = COSMOS.gold;
    } else if (hold0) {
      vHead = 'HOLD ORIGINAL: 19/20 POLICY · 18/20 ROUTINE (R07 MISSED!)';
      vSub = 'Keep clean base + separate adapter to inspect missed replies';
      vCol = COSMOS.rose;
    }

    nodes.push(
      glassCell(0, 315, 1680, 185, vCol, { fill: '#10182d', glow: 10, opacity: a }),
      glowDot(-795, 282, { radius: 8, color: vCol, opacity: a }),
      txt(vHead, 10, 282, 32, vCol, 'mono').glow(6, vCol).opacity(a),
      txt(vSub, 0, 352, 28, COSMOS.ink, 'sans').opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, part1, part2);

  // Part 1 cues
  c.on('policy-operands-ready', () => s.play(showX.to(1, { duration: 0.35 })));
  c.on('policy-base-row', () => s.play(showBaseRow.to(1, { duration: 0.35 })));
  c.on('policy-factor-row', () => s.play(showFactorRow.to(1, { duration: 0.35 })));
  c.after('fresh-policy-base', () => s.play(revBase.to(1, { duration: 0.25 })));
  c.after('fresh-policy-z', () => s.play(revZ.to(1, { duration: 0.25 })));
  c.after('fresh-policy-unscaled', () => s.play(revUnscaled.to(1, { duration: 0.25 })));
  c.after('fresh-policy-correction', () => s.play(revCorr.to(1, { duration: 0.25 })));
  c.after('fresh-policy-output', () => s.play(revOut.to(1, { duration: 0.3 })));
  c.after('fresh-policy-decision', () => s.play(revDecision.to(1, { duration: 0.25 })));

  // Part 2 transition & cues
  c.after('fresh-policy-count', () => {
    s.play(
      par(
        showPart1.to(0, { duration: 0.16 }),
        delay(showPart2.to(1, { duration: 0.2 }), 0.16),
        revPolicyCount.to(1, { duration: 0.25 }),
      ),
    );
  });
  c.after('fresh-regression-count', () => s.play(revRegCount.to(1, { duration: 0.25 })));
  c.after('fresh-policy-hold', () => s.play(revHoldOrig.to(1, { duration: 0.25 })));
  c.on('policy-option-a', () => s.play(showOptA.to(1, { duration: 0.3 })));
  c.on('policy-option-b', () => s.play(showOptB.to(1, { duration: 0.3 })));
  c.after('policy-fix-a', () => s.play(applyFixA.to(1, { duration: 0.3 })));
  c.after('policy-verdict-a', () => s.play(revVerdictA.to(1, { duration: 0.25 })));
  c.after('policy-fix-b', () => s.play(applyFixB.to(1, { duration: 0.3 })));
  c.after('policy-verdict-b', () => s.play(revVerdictB.to(1, { duration: 0.25 })));
  c.on('policy-save', () => s.play(showSave.to(1, { duration: 0.3 })));
  c.on('policy-resume', () =>
    s.play(showResume.to(1, { duration: remainDuration(c, 'policy-resume', 0.35) })),
  );
}
