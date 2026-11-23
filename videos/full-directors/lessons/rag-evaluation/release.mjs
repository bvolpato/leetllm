import {
  C,
  base,
  box,
  round,
  poly,
  line,
  dot,
  word,
  wrap,
  small,
  title,
  pin,
  mark,
  plate,
  leaf,
  cord,
  openFolio,
  score,
  cue,
  smooth,
} from './atelier.mjs';
import {
  june,
  variants,
  answers,
  policyEvaluation,
  abstentionOutcome,
  abstentions,
  grades,
  compareJudge,
  report,
  SLICE_OUTCOMES,
  missingWorkflow,
  sourceNames,
} from './specimens.mjs';

export function abstain(g, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    base(g, 'wood');
    title(g, 'MAYA’S QUESTION', 'Can an executive waive the rollback requirement?', 63, 78, true);
    if (cue(k, 1, 'Her permitted policies'))
      word(g, 'Maya’s permitted policies do not address waivers.', 79, 191, 32, C.cream, 'Sans');
    if (cue(k, 1, 'One possible reply')) {
      leaf(g, 77, 232, 1126, 342);
      small(g, 'POSSIBLE ASSISTANT REPLIES', 111, 276);
      wrap(g, '“The available policy lists no waiver. Ask the policy owner.”', 110, 342, 1051, 40);
    }
    if (cue(k, 1, 'No waiver exists anywhere')) {
      line(g, 111, 427, 1163, 427, C.edge);
      word(g, '“No waiver exists anywhere.”', 112, 476, 34, C.rust, 'Serif');
    }
    if (cue(k, 1, 'goes beyond the evidence'))
      word(g, 'Goes beyond the available policy', 112, 533, 25, C.rust, 'Sans');
    if (b === 1)
      word(
        g,
        'Can the corpus answer?       Did sufficient evidence reach the prompt?',
        79,
        638,
        28,
        C.cream,
        'Serif',
      );
    return;
  }
  if (b >= 4) {
    openFolio(g);
    small(g, 'NO EMITTED POLICY CLAIMS', 92, 111);
    word(g, 'Claim support', 91, 177, 43, C.ink, 'Serif');
    word(g, '0 / 0', 94, 343, 92, C.ink, 'Serif');
    word(g, 'Undefined', 96, 409, 42, C.rust, 'Serif');
    small(g, 'HOW THE EVALUATOR RECORDS IT', 696, 111);
    if (cue(k, 5, 'conventional zero')) {
      word(g, 'Reference harness', 695, 204, 32, C.ink, 'Serif');
      wrap(
        g,
        'Stores zero by convention. On an answerable case it also checks for a claim.',
        695,
        268,
        457,
        26,
      );
    }
    if (b === 5) {
      word(g, 'Short Python evaluator', 695, 427, 32, C.ink, 'Serif');
      wrap(g, 'Returns the abstention for separate grading.', 695, 483, 448, 26);
    }
    return;
  }
  base(g);
  title(g, 'ABSTENTION RUBRIC', 'Grade the reply in its evidence setting.');
  const visible = cue(k, 4, 'give the assistant the rule')
    ? 4
    : cue(k, 3, 'collection has the rule and selection loses it')
      ? 3
      : cue(k, 3, 'collection has no answer')
        ? 2
        : 1;
  const cols = [70, 246, 446, 727, 898, 1070];
  ['Corpus', 'Prompt', 'Response', 'Safe¹', 'Path', 'Task'].forEach((h, i) =>
    small(g, h.toUpperCase(), cols[i], 201),
  );
  const yesNo = (v) => (v ? 'Yes' : 'No');
  abstentions.slice(0, visible).forEach(([corpus, context, response, name], i) => {
    const y = 253 + i * 82;
    box(g, 56, y - 31, 1165, 64, i % 2 ? C.cream : '#e9e0c5');
    const r = abstentionOutcome(corpus, context, response);
    [yesNo(corpus), yesNo(context), name].forEach((v, j) =>
      word(g, v, cols[j], y + 10, 27, C.ink, 'Serif'),
    );
    const reveal =
      i < 2 ||
      (i === 2
        ? cue(k, 4, 'the evidence path and the task both fail')
        : cue(k, 4, 'The task is still unfinished'));
    if (reveal)
      [r.safe, r.evidencePath, r.taskSuccess].forEach((v, j) =>
        mark(g, cols[j + 3] + 28, y, v, 17),
      );
  });
  word(
    g,
    '¹ Safe here means the reply avoided unsupported policy claims.',
    68,
    633,
    25,
    C.slate,
    'Serif',
  );
}
const prettyStage = {
  'pass': 'Pass',
  'admissibility': 'Access and integrity',
  'candidate retrieval': 'Candidate recall',
  'context selection': 'Context recall',
  'claim presence': 'Claim presence',
  'claim review': 'Claim review',
  'answer faithfulness': 'Faithfulness',
  'citation support': 'Cited support',
  'answer completeness': 'Completeness',
};
function rowCase(g, r, x, y, w, show) {
  round(g, x, y, w, 58, 4, C.cream);
  box(g, x, y, 8, 58, show ? (r.result.release ? C.teal : C.rust) : C.brass);
  word(g, r.name, x + 23, y + 38, 25, C.ink, 'Serif');
  if (show)
    word(
      g,
      prettyStage[r.result.firstFailure],
      x + w - 17,
      y + 38,
      21,
      r.result.release ? C.teal : C.rust,
      'Sans',
      600,
      'right',
    );
}
export function defects(g, k) {
  const b = k.beat.beatIndex;
  base(g, 'night');
  if (b === 2) {
    title(g, 'FIXED REGRESSION SUITE', 'Which answers should pass?', 64, 77, true);
    const show = !!cue(k, 3, 'Only the complete answer should pass');
    variants
      .slice(0, 6)
      .forEach((r, i) =>
        rowCase(g, r, 65 + (i % 2) * 590, 185 + Math.floor(i / 2) * 99, 557, show),
      );
    if (show) {
      const trials = variants.slice(0, 6);
      word(
        g,
        trials.filter((v) => v.result.firstFailure === v.expected).length +
          ' / ' +
          trials.length +
          ' expected decisions',
        66,
        561,
        40,
        C.gold,
        'Serif',
      );
      word(
        g,
        'Constructed cases test the harness. Production frequency needs a traffic sample.',
        66,
        625,
        25,
        C.cream,
        'Serif',
      );
    }
    return;
  }
  if (b < 2) {
    const choices = [
      [7, 'search misses the rule', cue(k, 1, 'Remove the rule from search')],
      [5, 'selection drops the rule', cue(k, 1, 'selection dropped it')],
      [2, 'reverse the rollback condition', cue(k, 2, 'reverse a condition')],
      [3, 'attach the drill runbook', cue(k, 2, 'change the citations')],
      [6, 'omit the rollback plan', cue(k, 2, 'omit rollback')],
      [4, 'emit no claims', cue(k, 2, 'return an empty answer')],
    ];
    const selected =
      cue(k, 1, 'Let the rule reach the prompt') && !cue(k, 2, 'reverse a condition')
        ? null
        : choices.filter((r) => r[2]).at(-1);
    const test = selected ? variants[selected[0] - 1] : variants[0];
    title(g, 'CONTROLLED CHANGE', 'Replay one damaged trace', 65, 77, true);
    leaf(g, 64, 157, 1149, 473);
    small(g, 'CHANGE INTRODUCED', 102, 203);
    word(
      g,
      selected ? selected[1] : 'Complete answer and intact trace',
      101,
      268,
      39,
      C.ink,
      'Serif',
    );
    line(g, 103, 294, 1176, 294, C.edge);
    const gate = test.result.firstFailure;
    if (['candidate retrieval', 'context selection', 'pass'].includes(gate)) {
      const ids = (idList) => idList.map((id) => sourceNames[id]).join('  ·  ');
      word(g, 'Candidates', 102, 353, 24, C.slate, 'Sans');
      word(g, ids(test.trace.candidates), 319, 353, 27, C.ink, 'Serif');
      word(g, 'In prompt', 102, 409, 24, C.slate, 'Sans');
      word(g, ids(test.trace.selected), 319, 409, 27, C.ink, 'Serif');
    } else {
      const sample =
        gate === 'answer faithfulness'
          ? test.answer.at(-1).text
          : gate === 'citation support'
            ? 'Each claim cites ' + sourceNames[test.answer[0].citation] + '.'
            : gate === 'claim presence'
              ? 'The answer contains zero policy claims.'
              : 'The reply ends after the approval requirement.';
      wrap(g, sample, 102, 366, 1035, 32);
    }
    line(g, 103, 446, 1176, 446, C.edge);
    small(g, 'FIRST FAILED CHECK', 103, 504);
    word(
      g,
      gate === 'pass' ? 'None  ·  complete trace passes' : prettyStage[gate],
      101,
      577,
      45,
      test.result.release ? C.teal : C.rust,
      'Serif',
    );
    return;
  }
  const mixed = policyEvaluation(variants[6].trace, answers.unsafe, june);
  title(g, 'MIXED DEFECT', 'Search missed the rule. The answer guessed.', 64, 76, true);
  const first = !!cue(k, 4, 'comes candidate recall');
  mixed.stages.forEach((s, i) => {
    const x = 62 + (i % 4) * 300,
      y = 187 + Math.floor(i / 4) * 145;
    const active = first || i === 0;
    round(
      g,
      x,
      y,
      265,
      102,
      5,
      active && s.status === 'fail' ? C.rose : active && s.status === 'pass' ? C.mist : C.ice,
    );
    word(g, prettyStage[s.name], x + 15, y + 42, 24, C.ink, 'Serif');
    if (active)
      word(g, s.status, x + 15, y + 79, 22, s.status === 'fail' ? C.rust : C.slate, 'Mono');
  });
  if (b === 4) {
    word(
      g,
      'Prompt: ' +
        sourceNames[variants[6].trace.selected[0]] +
        '     |     Claims: freeze applies · rollout without a plan',
      65,
      513,
      23,
      C.cream,
      'Sans',
    );
  }
  if (cue(k, 5, 'Neither has support'))
    word(
      g,
      'Separate diagnostic: ' +
        Math.round(mixed.faithfulness * answers.unsafe.length) +
        ' / ' +
        answers.unsafe.length +
        ' claims supported',
      65,
      589,
      39,
      C.gold,
      'Serif',
    );
}
function ticket(g, x, y, id, ok, flag) {
  round(g, x + 2, y + 4, 124, 74, 4, '#1e373630');
  round(g, x, y, 124, 74, 4, flag && !ok ? C.rose : C.cream);
  line(g, x + 82, y + 3, x + 82, y + 71, C.edge, 1);
  word(g, id, x + 13, y + 48, 31, C.ink, 'Mono', 600);
  mark(g, x + 103, y + 37, ok, 11);
}
export function suite(g, k, ending = false) {
  base(g, 'wood');
  const b = k.beat.beatIndex;
  if (!ending && b === 4) {
    openFolio(g);
    small(g, 'PAIRED EVALUATION', 94, 111);
    word(g, 'Same question in both runs', 91, 178, 37, C.ink, 'Serif');
    small(g, 'SAMPLING UNIT', 695, 111);
    word(g, 'Which cases are independent?', 694, 178, 34, C.ink, 'Serif');
    const cases = ['Freeze / F2', 'Hotfix / H1', 'Migration / M1'];
    for (const [i, id] of cases.entries()) {
      const y = 234 + i * 66;
      word(g, id, 93, y, 24, C.ink, 'Mono');
      cord(g, 324, y - 6, 391, y - 6, C.teal, 3);
      word(g, id, 409, y, 24, C.ink, 'Mono');
    }
    word(g, 'Version A', 95, 455, 27, C.slate, 'Serif');
    word(g, 'Version B', 408, 455, 27, C.slate, 'Serif');
    if (cue(k, 5, 'Ten paraphrases')) {
      for (let i = 0; i < 10; i++) leaf(g, 702 + i * 7, 242 + i * 8, 346, 99);
      word(g, 'Same freeze rule', 783, 365, 29, C.ink, 'Serif');
      word(g, '10 phrasings · 1 policy family', 703, 452, 27, C.teal, 'Serif');
    }
    if (cue(k, 5, 'sample real traffic'))
      wrap(
        g,
        'Sample real traffic. Estimate uncertainty across independent questions or policy families.',
        697,
        513,
        470,
        23,
        C.slate,
        'Sans',
      );
    return;
  }
  if (!ending && b >= 5) {
    title(g, 'SECOND RELEASE REPORT', 'Can the second report clear the gate?', 64, 75, true);
    const decided = !!cue(k, 7, 'Hold the build');
    const shown = [
      cue(k, 6, 'Nineteen of twenty'),
      cue(k, 6, 'Thirty-nine of forty'),
      cue(k, 6, 'Migration has no cases'),
    ];
    missingWorkflow.slices.forEach((s, i) => {
      const x = 65 + i * 393;
      leaf(g, x, 185, 358, 310);
      small(g, s.name.toUpperCase(), x + 25, 237);
      if (shown[i]) {
        word(g, s.k + ' / ' + s.n, x + 26, 336, 65, C.ink, 'Serif');
        word(
          g,
          s.n ? (100 * s.k) / s.n + '% correct' : 'No observations',
          x + 26,
          395,
          28,
          C.navy,
          'Serif',
        );
      }
      if (decided)
        plate(
          g,
          s.pass ? 'Meets 95%' : 'Required slice empty',
          x + 24,
          432,
          310,
          s.pass ? C.teal : C.rust,
        );
    });
    word(g, 'n > 0    and    100 × k ≥ 95 × n', 65, 570, 32, C.gold, 'Mono');
    word(
      g,
      decided
        ? 'Hold the build. Collect migration cases.'
        : 'Can this report clear the release rule?',
      65,
      642,
      35,
      C.cream,
      'Serif',
    );
    return;
  }
  title(
    g,
    ending ? 'BUILD RELEASE  /  REPAIRED TRACE PASSED' : 'FIVE SYNTHETIC CASES',
    'Correct release decisions by workflow',
    64,
    75,
    true,
  );
  const showRule = ending
    ? cue(k, 5, 'at least ninety-five percent')
    : cue(k, 2, 'every named slice');
  const solved = ending ? cue(k, 6, 'Hold the release') : cue(k, 3, 'Two of two passes');
  const flag = ending ? cue(k, 6, 'Open the second freeze case') : !!solved;
  // Every ticket stays with its workflow, including both errors.
  const countCues = ending
    ? ['freeze cases split', 'Both hotfix decisions', 'migration decision was wrong']
    : ['Release-freeze has', 'incident-hotfix has', 'schema-migration has'];
  report.slices.forEach((slice, i) => {
    const x = 61 + i * 397,
      w = 369;
    const visible = !!cue(k, ending ? 5 : 1, countCues[i]);
    round(g, x, 174, w, 361, 8, '#d5c7a7', C.ink, 2);
    round(g, x + 12, 188, w - 24, 333, 3, null, '#9d977e', 1);
    word(
      g,
      ['Release freeze', 'Incident hotfix', 'Schema migration'][i],
      x + 23,
      237,
      31,
      C.ink,
      'Serif',
    );
    if (visible) {
      slice.cases.forEach((v, j) => ticket(g, x + 23 + j * 151, 271, v.id, v.correct, flag));
      word(g, slice.k + ' / ' + slice.n, x + 22, 430, 56, C.ink, 'Serif');
      const graded = ending ? solved : slice.pass ? solved : cue(k, 3, 'zero of one fail');
      if (graded)
        plate(
          g,
          slice.pass ? 'Pass' : 'Below 95%',
          x + 23,
          458,
          w - 46,
          slice.pass ? C.teal : C.rust,
        );
    }
  });
  if (ending) {
    if (flag)
      word(
        g,
        'Hold the release. Open ' +
          SLICE_OUTCOMES.filter((v) => !v.correct)
            .map((v) => v.id)
            .join(' and ') +
          '. Trace each failure.',
        63,
        639,
        33,
        C.cream,
        'Serif',
      );
    else if (solved)
      word(g, report.pass ? 'Release' : 'Hold the release', 63, 639, 39, C.gold, 'Serif');
    else if (showRule)
      word(
        g,
        'Every workflow needs at least 95% correct. Can this build ship?',
        63,
        639,
        32,
        C.cream,
        'Serif',
      );
  } else if (showRule) {
    word(g, 'n > 0    and    100 × k ≥ 95 × n', 64, 598, 35, C.gold, 'Mono', 600);
    word(
      g,
      b < 3
        ? 'k = correct decisions     n = cases in each required workflow'
        : 'Two hotfix cases can catch a regression. A population estimate needs a sample.',
      65,
      655,
      24,
      C.cream,
      'Sans',
    );
  } else if (cue(k, 1, 'The overall decision accuracy')) {
    word(
      g,
      SLICE_OUTCOMES.filter((v) => v.correct).length +
        ' / ' +
        SLICE_OUTCOMES.length +
        ' correct overall   =   ' +
        Math.round(100 * report.overall) +
        '%',
      64,
      628,
      38,
      C.cream,
      'Serif',
    );
  }
}
export function judges(g, k) {
  const b = k.beat.beatIndex;
  const excerpt = '“…require incident commander approval and a linked rollback plan before rollout.”';
  if (b < 2) {
    openFolio(g);
    small(g, 'RETRIEVED PASSAGE', 92, 114);
    word(g, 'DEPLOY-17', 91, 179, 48, C.ink, 'Serif');
    wrap(g, excerpt, 92, 268, 467, 34);
    small(g, 'ORIGINAL RAGAS MEASURES', 695, 114);
    const rows = [
      [
        'Claim support',
        'Check each statement against the passage.',
        cue(k, 1, 'checks their support'),
      ],
      [
        'Answer relevance',
        'Compare questions generated from the answer with Maya’s question.',
        cue(k, 2, 'generates questions'),
      ],
      [
        'Context relevance',
        'Extract the sentences that help answer Maya.',
        cue(k, 2, 'it extracts sentences'),
      ],
    ];
    rows.forEach(([h, desc, on], i) => {
      if (!on) return;
      const y = 191 + 139 * i;
      word(g, h, 698, y, 32, C.teal, 'Serif');
      wrap(g, desc, 698, y + 37, 467, 22, C.ink, 'Sans');
    });
    return;
  }
  base(g);
  title(g, 'HELD-OUT CLAIMS  /  SAME POLICY REVISION', 'Compare each verdict with a human label.');
  leaf(g, 56, 144, 1166, 92);
  word(g, excerpt, 79, 199, 30, C.ink, 'Serif', 400, 'left', 1118);
  const col = [73, 559, 805, 997];
  ['Claim', 'Human', 'Judge', 'Comparison'].forEach((s, i) =>
    small(g, s.toUpperCase(), col[i], 302),
  );
  const judged = cue(k, 5, 'judge accepts the first two');
  const finalReject = cue(k, 6, 'false rejection'),
    falseAccept = cue(k, 6, 'false acceptance');
  grades.forEach((r, i) => {
    const y = 363 + i * 83;
    line(g, 72, y + 21, 1203, y + 21, C.edge, 1);
    word(g, r.text, col[0], y, 25, C.ink, 'Serif');
    word(g, r.supported ? 'Supported' : 'Contradicted', col[1], y, 24, C.teal, 'Sans');
    const verdictIn = i === 2 ? cue(k, 5, 'rejects the third') : judged;
    word(g, verdictIn ? (r.verdict ? 'Accept' : 'Reject') : '—', col[2], y, 24, C.navy, 'Sans');
    if (i === 1 ? falseAccept : finalReject)
      word(
        g,
        compareJudge(r),
        col[3],
        y,
        25,
        compareJudge(r) === 'Agrees' ? C.teal : C.rust,
        'Serif',
        600,
      );
  });
  const format = cue(k, 7, 'missing verdict field');
  if (format)
    plate(g, 'Missing verdict → ' + compareJudge({ supported: true }), 75, 586, 590, C.navy);
  else if (judged && !falseAccept)
    word(g, 'Which acceptance could give Maya bad advice?', 75, 623, 32, C.rust, 'Serif');
  else if (b === 3)
    word(
      g,
      'ARES uses human labels to correct aggregate estimates and quantify uncertainty.',
      75,
      621,
      25,
      C.slate,
      'Serif',
    );
  if (b === 7) word(g, 'Access checks stay with the application.', 692, 618, 24, C.slate, 'Serif');
}
