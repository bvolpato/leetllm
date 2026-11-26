// Scene 09 (code-contract): "Which library tests did this patch pass?"
// HumanEval vs SWE-bench intro -> live loan-period patch showing selected pass vs omitted textbook regression.
import {
  COSMOS,
  ROLE,
  aura,
  fadeIn,
  fadeOut,
  glowRing,
  guardedDynamic,
  heroTitle,
  lumBar,
  runAmbientPhase,
  tweenCue,
  txt,
  verifyInvariant,
} from '../parts.mjs';

const oldRule = { item: 'textbook', days: 28, other: 21 };
const patch = { item: 'new', days: 7, other: 21 };
const cases = [
  { item: 'new', expected: 7, kind: 'FAIL -> PASS (REPAIR)' },
  { item: 'book', expected: 21, kind: 'PASS -> PASS (REGRESSION)' },
  { item: 'textbook', expected: 28, kind: 'OMITTED FROM HARNESS' },
];
export const pythonRule = (ruleObj) =>
  `def days(item):\n    if item == "${ruleObj.item}":\n        return ${ruleObj.days}\n    return ${ruleObj.other}`;
export const assertion = (test) => `assert days("${test.item}") == ${test.expected}`;
export const loanExample = { oldRule, patch, cases };

verifyInvariant(
  cases.map((t) => (t.item === patch.item ? patch.days : patch.other) === t.expected).join(',') ===
    'true,true,false',
  'code-contract selected and omitted assertions must match true,true,false',
);

export default function code(s, c) {
  const phase = s.value(0);
  const showSwe = s.value(0);
  const modeLoan = s.value(0);
  const showOldNew = s.value(0);
  const showOldBook = s.value(0);
  const applyPatch = s.value(0);
  const showPatchTests = s.value(0);
  const showResolved = s.value(0);
  const showOmitted = s.value(0);
  const showAsk = s.value(0);
  const showOmittedFail = s.value(0);
  const showBudget = s.value(0);

  const bgAura = aura(-100, 30, 620, '#13324c38', '#331c2820');
  const title = heroTitle(['Which Library Tests Did', 'This Patch Actually Pass?'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.B,
    eyebrow: 'CODE BENCHMARKS · HUMANEVAL & SWE-BENCH',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.0);
    const loan = modeLoan.value;
    const introOp = fadeOut(loan);
    const loanOp = fadeIn(loan);
    const nodes = [];

    // ACT 1: HumanEval vs SWE-bench contract comparison
    if (introOp > 0.02) {
      const sweOp = showSwe.value;
      nodes.push(
        lumBar(-430, 20, 740, 320, {
          color: ROLE.A,
          fillOpacity: 0.16,
          strokeWidth: 2.6,
          glow: 9,
          radius: 14,
          opacity: introOp,
        }),
        txt('HUMANEVAL', -430, -82, 42, ROLE.A, 'mono').glow(7, ROLE.A).opacity(introOp),
        txt('164 handwritten Python functions', -430, -14, 30, COSMOS.ink, 'sans').opacity(introOp),
        txt('Unit tests grade one standalone function', -430, 44, 26, COSMOS.muted, 'sans').opacity(
          introOp,
        ),
        txt('Scored unit: function pass@k', -430, 108, 26, ROLE.focus, 'mono').opacity(introOp),
        lumBar(430, 20, 740, 320, {
          color: ROLE.B,
          fillOpacity: 0.12 + 0.08 * sweOp,
          strokeWidth: 2.4 + 0.6 * sweOp,
          glow: 6 + 6 * sweOp,
          radius: 14,
          opacity: introOp * (0.35 + 0.65 * sweOp),
        }),
        txt('SWE-BENCH', 430, -82, 42, ROLE.B, 'mono')
          .glow(7 * sweOp, ROLE.B)
          .opacity(introOp * (0.35 + 0.65 * sweOp)),
        txt('2,294 issues across 12 Python repos', 430, -14, 30, COSMOS.ink, 'sans').opacity(
          introOp * (0.35 + 0.65 * sweOp),
        ),
        txt(
          'Docker patch graded by selected repo tests',
          430,
          44,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(introOp * (0.35 + 0.65 * sweOp)),
        txt('Scored unit: Fail-to-Pass + Pass-to-Pass', 430, 108, 26, ROLE.focus, 'mono').opacity(
          introOp * (0.35 + 0.65 * sweOp),
        ),
        txt(
          'Always ask: which tests did the scorer actually execute?',
          0,
          305,
          34,
          ROLE.focus,
          'serif',
        )
          .glow(6, ROLE.focus)
          .opacity(introOp),
      );
    }

    // ACT 2: Live loan-period patch & selected vs omitted test assertions
    if (loanOp > 0.02) {
      const patched = applyPatch.value > 0.5;
      const activeRule = patched ? patch : oldRule;
      const codeCol = patched ? ROLE.B : ROLE.A;
      const codeX = -465;

      nodes.push(
        txt(
          patched ? 'PROPOSED PATCH (days.py)' : 'ORIGINAL FUNCTION (days.py)',
          codeX,
          -205,
          28,
          codeCol,
          'mono',
        )
          .glow(6, codeCol)
          .opacity(loanOp),
        lumBar(codeX, 0, 740, 290, {
          color: codeCol,
          fillOpacity: 0.16,
          strokeWidth: 2.6,
          glow: 9,
          radius: 12,
          opacity: loanOp,
        }),
        txt('def days(item):', codeX - 310, -82, 32, COSMOS.ink, 'mono', 'left').opacity(loanOp),
        txt(
          `    if item == "${activeRule.item}":`,
          codeX - 310,
          -26,
          32,
          ROLE.focus,
          'mono',
          'left',
        )
          .glow(6, ROLE.focus)
          .opacity(loanOp),
        txt(
          `        return ${activeRule.days}`,
          codeX - 310,
          30,
          32,
          ROLE.focus,
          'mono',
          'left',
        ).opacity(loanOp),
        txt(
          `    return ${activeRule.other}`,
          codeX - 310,
          86,
          32,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(loanOp),
      );

      // Right side: 3 test assertion rows
      const testX = 415;
      const rowYs = [-145, 5, 165];
      cases.forEach((tc, i) => {
        const isThird = i === 2;
        const rowVis = isThird ? showOmitted.value : 1;
        if (rowVis < 0.02) return;

        const actual = tc.item === activeRule.item ? activeRule.days : activeRule.other;
        const ok = actual === tc.expected;
        const showRes = isThird
          ? showOmittedFail.value
          : patched
            ? showPatchTests.value
            : i === 0
              ? showOldNew.value
              : showOldBook.value;

        const borderCol =
          showRes > 0.3 ? (ok ? ROLE.pass : ROLE.fail) : isThird ? ROLE.accent : COSMOS.muted;
        nodes.push(
          lumBar(testX, rowYs[i], 790, 118, {
            color: borderCol,
            fillOpacity: showRes > 0.3 ? 0.18 : 0.1,
            strokeWidth: isThird && showRes > 0.3 ? 3.2 : 2.0,
            glow: isThird && showRes > 0.3 ? 12 * pulse : 5,
            radius: 10,
            dash: isThird ? [9, 6] : undefined,
            opacity: loanOp * rowVis,
          }),
          txt(
            tc.kind,
            testX - 365,
            rowYs[i] - 32,
            26,
            isThird ? ROLE.accent : COSMOS.muted,
            'mono',
            'left',
          ).opacity(loanOp * rowVis),
          txt(assertion(tc), testX - 365, rowYs[i] + 18, 30, COSMOS.ink, 'mono', 'left').opacity(
            loanOp * rowVis,
          ),
        );

        if (showRes > 0.02) {
          const rCol = ok ? ROLE.pass : ROLE.fail;
          nodes.push(
            txt(
              `-> ${actual}  ${ok ? 'PASS' : 'FAIL'}`,
              testX + 365,
              rowYs[i] + 18,
              30,
              rCol,
              'mono',
              'right',
            )
              .glow(isThird && !ok ? 11 * pulse : 8, rCol)
              .opacity(loanOp * rowVis * showRes),
          );
        }
      });

      // Bottom status zone with non-overlapping crossfades
      const resOp = showResolved.value * fadeOut(showAsk.value) * fadeOut(showOmittedFail.value);
      const askOp = fadeIn(showAsk.value) * fadeOut(showOmittedFail.value);
      const failOp = fadeIn(showOmittedFail.value) * fadeOut(showBudget.value);
      const budOp = fadeIn(showBudget.value);

      if (resOp > 0.02) {
        nodes.push(
          txt('Selected harness: 2 / 2 PASS -> marked RESOLVED', 0, 335, 36, ROLE.pass, 'mono')
            .glow(8, ROLE.pass)
            .opacity(loanOp * resOp),
        );
      }
      if (askOp > 0.02) {
        nodes.push(
          txt(
            'What does the patched function return for a textbook?',
            0,
            335,
            38,
            ROLE.focus,
            'serif',
          )
            .glow(8, ROLE.focus)
            .opacity(loanOp * askOp),
        );
      }
      if (failOp > 0.02) {
        nodes.push(
          txt(
            '21 days (FAIL) · patch deleted the textbook branch · keep omitted regressions visible',
            0,
            335,
            32,
            ROLE.fail,
            'sans',
          )
            .glow(7, ROLE.fail)
            .opacity(loanOp * failOp),
        );
      }
      if (budOp > 0.02) {
        nodes.push(
          txt(
            'Record Docker image, selected tests, parser, 10-attempt tool calls, timeouts, cost, and patch',
            0,
            335,
            28,
            ROLE.A,
            'sans',
          )
            .glow(6, ROLE.A)
            .opacity(loanOp * budOp),
        );
      }
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'harnesses', showSwe, 1, { duration: 0.45 });
  tweenCue(s, c, 'loan-code', modeLoan, 1, { duration: 0.55 });
  tweenCue(s, c, 'old-new', showOldNew, 1, { duration: 0.4, after: true });
  tweenCue(s, c, 'old-book', showOldBook, 1, { duration: 0.4, after: true });
  c.on('loan-patch', () => {
    s.play(showOldNew.to(0, { duration: 0.2 }));
    s.play(showOldBook.to(0, { duration: 0.2 }));
    s.play(applyPatch.to(1, { duration: 0.45 }));
  });
  tweenCue(s, c, 'selected-tests', showPatchTests, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'harness-resolved', showResolved, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'omitted-test', showOmitted, 1, { duration: 0.45 });
  tweenCue(s, c, 'omitted-ask', showAsk, 1, { duration: 0.4 });
  tweenCue(s, c, 'omitted-fail', showOmittedFail, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'record-budget', showBudget, 1, { duration: 0.5 });
}
