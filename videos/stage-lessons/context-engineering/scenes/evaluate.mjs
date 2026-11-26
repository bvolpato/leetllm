// Scene 25: evaluate: "Protect the cases that the average can hide"
// Deterministic source-lookup reader answering 6 source-bound questions:
// Baseline 4/6 (D0,D1,D2,D4) vs Candidate 5/6 (D0,D1,D2,D3,D5) omitting critical D4 -> REJECTED!
import {
  COSMOS,
  EVAL_BASELINE,
  EVAL_CANDIDATE,
  ROLE,
  aura,
  checkMark,
  crossMark,
  ease,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  txt,
} from '../parts.mjs';

export default function evaluate(s, c) {
  const showBase = s.value(0.35);
  const showBaseScore = s.value(0);
  const showCand = s.value(0);
  const showGate = s.value(0);

  const bgAura = aura(0, 20, 820, '#14335c2a', '#2c142624');
  const title = heroTitle(['Protect the cases', 'the average can hide'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.poison,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const bs = ease(showBase.value);
    const bt = ease(showBaseScore.value);
    const cd = ease(showCand.value);
    const gt = ease(showGate.value);

    const xQ = -855;
    const xBase = 165;
    const xCand = 585;

    const nodes = [
      txt('PAIRED SOURCE-LOOKUP QUESTIONS (6)', xQ, -245, 26, COSMOS.muted, 'mono', 'left').opacity(
        alpha,
      ),
      txt('BASELINE', xBase, -245, 26, ROLE.evidence, 'mono', 'center').opacity(alpha),
      txt(
        'CANDIDATE',
        xCand,
        -245,
        26,
        cd > 0.3 ? ROLE.units : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha * (0.55 + 0.45 * cd)),
    ];

    EVAL_BASELINE.rows.forEach((row, i) => {
      const y = -165 + i * 76;
      const candRow = EVAL_CANDIDATE.rows[i];
      const crit = row.critical;
      const qLabel = `${row.question}  (${row.source}${crit ? ', CRITICAL' : ''})`;

      nodes.push(
        txt(qLabel, xQ, y, 28, crit ? ROLE.units : COSMOS.ink, 'sans', 'left').opacity(
          alpha * (0.65 + 0.35 * bs),
        ),
        row.pass
          ? checkMark(xBase - 110, y, 22, ROLE.note, alpha)
          : crossMark(xBase - 110, y, 22, ROLE.poison, alpha),
        txt(
          row.pass ? row.answer : 'unknown',
          xBase - 78,
          y,
          27,
          row.pass ? ROLE.note : ROLE.poison,
          'mono',
          'left',
        ).opacity(alpha),
      );

      // Candidate column (quiet skeleton until B1, illuminates on evaluate-beat-2-focus-1)
      const cOp = alpha * (0.48 + 0.52 * cd);
      if (cd > 0.35) {
        nodes.push(
          candRow.pass
            ? checkMark(xCand - 110, y, 22, ROLE.note, cOp)
            : crossMark(xCand - 110, y, 22, ROLE.poison, cOp),
          txt(
            candRow.pass ? candRow.answer : 'MISSING!',
            xCand - 78,
            y,
            27,
            candRow.pass ? ROLE.note : ROLE.poison,
            'mono',
            'left',
          ).opacity(cOp),
        );
      } else {
        nodes.push(txt('pending', xCand, y, 26, COSMOS.dim, 'mono', 'center').opacity(cOp));
      }
    });

    // Bottom tallies + critical-case release gate
    nodes.push(
      txt(
        bt > 0.3 ? `Baseline: ${EVAL_BASELINE.score} / 6` : 'Baseline: ? / 6',
        xQ,
        320,
        32,
        ROLE.evidence,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        cd > 0.3 ? `Candidate: ${EVAL_CANDIDATE.score} / 6 (+1 avg)` : 'Candidate: ? / 6',
        -110,
        320,
        32,
        ROLE.units,
        'mono',
        'center',
      ).opacity(alpha * (0.5 + 0.5 * cd)),
    );

    if (gt > 0.35) {
      nodes.push(
        crossMark(420, 320, 26, ROLE.poison, alpha * gt),
        txt('CRITICAL GATE: REJECT', 855, 320, 32, ROLE.poison, 'mono', 'right')
          .glow(10, ROLE.poison)
          .opacity(alpha * gt),
      );
    } else {
      nodes.push(
        txt('Protected-case check: pending', 855, 320, 28, COSMOS.muted, 'mono', 'right').opacity(
          alpha * 0.6,
        ),
      );
    }

    nodes.push(
      txt(
        gt > 0.35
          ? 'Higher average (5/6 > 4/6) still fails when rollback authorizer (D4) is dropped.'
          : 'Paired tests make evidence coverage inspectable alongside model reasoning quality.',
        0,
        405,
        29,
        gt > 0.35 ? ROLE.poison : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);

  playCue(s, c, 'evaluate-beat-1-focus-1', (d) => s.play(showBase.to(1, { duration: d })));
  playCue(s, c, 'evaluate-beat-1-focus-2', (d) => s.play(showBaseScore.to(1, { duration: d })));
  playCue(s, c, 'evaluate-beat-2-focus-1', (d) => s.play(showCand.to(1, { duration: d })));
  playCue(s, c, 'evaluate-beat-3-focus-1', (d) => s.play(showGate.to(1, { duration: d })));
}
