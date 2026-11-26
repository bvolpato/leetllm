// Scene 16: behavior: "Which assistant would follow the incident policy?"
// Checkpoint A (PPL 8.9) vs Checkpoint B (PPL 9.8) against the incident policy
// (blocked, incident_policy_483, automatic rollback: false).
// STRICT WITHHOLDING: Neutral distinct model colors during Beat 0; reveal A's rollback hazard
// and final 1/3 vs 3/3 pass/fail verdicts ONLY AFTER the spoken cues in Beat 1!
import {
  COSMOS,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  ANSWERS,
  ANSWER_CONTRACT,
  ROLE,
  answerChecks,
  cinemaAtmosphere,
  lumBar,
  playCue,
} from '../parts.mjs';

export default function behavior(s, c) {
  const title = heroTitle(['Which assistant follows', 'the incident policy?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.observed,
  });

  const showPpl = s.value(0);
  const showPolicy = s.value(0);
  const showA = s.value(0); // reveals Checkpoint A returned fields
  const showB = s.value(0); // reveals Checkpoint B returned fields
  const flagRollback = s.value(0); // Beat 1: flags A's dangerous rollback
  const showVerdicts = s.value(0); // AFTER behavior-beat-2-focus-2: reveals PASS/FAIL & Send B

  const stageVis = s.value(1);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const sp = showPolicy.value;
    const sA = showA.value;
    const sB = showB.value;
    const fr = flagRollback.value;
    const sv = showVerdicts.value;

    // Top policy target beacon spine (zero boxed card clutter)
    const polY = -230;
    nodes.push(
      txt(
        'POLICY:   status = blocked   ·   source = policy 483   ·   auto rollback = off',
        0,
        polY,
        30,
        ROLE.observed,
        'mono',
        'center',
      )
        .glow(sp > 0.3 ? 8 : 3, ROLE.observed)
        .opacity((0.45 + 0.55 * sp) * alpha),
      glowingTrail(
        [
          [-800, polY + 42],
          [800, polY + 42],
        ],
        { color: ROLE.observed, width: 2.2, glow: 5, core: false, opacity: 0.55 * alpha },
      ),
    );

    const rowLabels = ['Status', 'Source citation', 'Auto rollback'];
    const rowYs = [-15, 115, 245];

    // Left field labels spine
    rowLabels.forEach((lbl, j) => {
      nodes.push(txt(lbl, -830, rowYs[j], 30, COSMOS.muted, 'mono', 'left').opacity(alpha));
    });

    // Two model columns: Checkpoint A (left-center) and Checkpoint B (right)
    const colXs = [-165, 495];
    const baseCols = [ROLE.context, ROLE.prob];
    const dealVals = [sA, sB];

    ANSWERS.forEach((ans, idx) => {
      const cx = colXs[idx];
      const baseCol = baseCols[idx];
      const dealt = dealVals[idx];
      const checks = answerChecks(ans, ANSWER_CONTRACT);
      const isWinner = idx === 1 && sv > 0.5;
      const headCol = isWinner ? ROLE.good : baseCol;

      // Column header + held-out PPL readout
      nodes.push(
        txt(`Checkpoint ${ans.id}`, cx, -135, 38, headCol, 'serif', 'center')
          .glow(isWinner ? 10 : 5, headCol)
          .opacity(alpha),
        txt(`held-out PPL ${ans.ppl}`, cx, -82, 28, COSMOS.muted, 'mono', 'center').opacity(
          (0.4 + 0.6 * showPpl.value) * alpha,
        ),
      );

      const fieldTexts = [
        ans.status,
        ans.source.replaceAll('_', ' '),
        ans.automatic ? 'rollback ON' : 'rollback OFF',
      ];

      fieldTexts.forEach((val, j) => {
        if (dealt < 0.08) return;
        const ry = rowYs[j];
        const pass = checks[j];
        const isRollbackHazard = idx === 0 && j === 2 && fr > 0.35;

        // STRICT WITHHOLDING: stay neutral baseCol until verdict or rollback cue!
        const fCol =
          sv > 0.5 ? (pass ? ROLE.good : ROLE.warn) : isRollbackHazard ? ROLE.warn : baseCol;

        nodes.push(
          lumBar(cx, ry, 430, 74, {
            color: fCol,
            fillOpacity: sv > 0.5 || isRollbackHazard ? 0.28 : 0.16,
            strokeWidth: sv > 0.5 || isRollbackHazard ? 2.8 : 2,
            glow: sv > 0.5 || isRollbackHazard ? 10 : 5,
            radius: 10,
            opacity: dealt * alpha,
          }),
          txt(
            val,
            cx,
            ry,
            30,
            sv > 0.5 || isRollbackHazard ? fCol : COSMOS.ink,
            'mono',
            'center',
          ).opacity(dealt * alpha),
        );

        // PASS / FAIL photon & tag ONLY AFTER sv > 0.5!
        if (sv > 0.5) {
          const badgeX = cx + 265;
          nodes.push(
            glowDot(badgeX - 36, ry, {
              radius: 7,
              color: pass ? ROLE.good : ROLE.warn,
              glow: 11,
              opacity: sv * alpha,
            }),
            txt(
              pass ? 'PASS' : 'FAIL',
              badgeX + 20,
              ry,
              26,
              pass ? ROLE.good : ROLE.warn,
              'mono',
              'center',
            )
              .glow(6, pass ? ROLE.good : ROLE.warn)
              .opacity(sv * alpha),
          );
        }
      });
    });

    // Bottom prompt / verdict line (strictly withheld until sv > 0.5!)
    nodes.push(
      txt(
        sv > 0.5
          ? 'Send B (3/3 pass).  Lower perplexity on A tracked wording, not safe action.'
          : 'Which answer would you send?',
        0,
        375,
        sv > 0.5 ? 32 : 38,
        sv > 0.5 ? ROLE.good : ROLE.observed,
        'serif',
        'center',
      )
        .glow(8, sv > 0.5 ? ROLE.good : ROLE.observed)
        .opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.observed, ROLE.good), title, mainLayer);

  // Beat 0: show PPL -> policy -> A fields -> B fields (NO verdicts!)
  playCue(s, c, 'behavior-beat-1-focus-1', (d) => s.play(showPpl.to(1, { duration: d })), {
    dur: 0.5,
  });
  playCue(s, c, 'behavior-beat-1-focus-2', (d) => s.play(showPolicy.to(1, { duration: d })), {
    dur: 0.5,
  });
  playCue(s, c, 'behavior-answer-fields', (d) => s.play(showA.to(1, { duration: d })), {
    dur: 0.65,
  });
  playCue(s, c, 'behavior-b-fields', (d) => s.play(showB.to(1, { duration: d })), { dur: 0.65 });

  // Beat 1: reveal verdicts AFTER spoken confirmation cues!
  playCue(s, c, 'behavior-beat-2-focus-2', (d) => s.play(showVerdicts.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'behavior-beat-2-focus-1', (d) => s.play(flagRollback.to(1, { duration: d })), {
    dur: 0.5,
  });
}
