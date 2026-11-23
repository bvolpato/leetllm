import { completed, spoken } from '../construction.mjs';

const examples = [
  { claim: '“The commander must sign off.”', human: 'Supported', judge: 'Accept' },
  { claim: '“The plan can wait until later.”', human: 'Contradicted', judge: 'Accept' },
  { claim: '“A rollback plan must be linked.”', human: 'Supported', judge: 'Reject' },
];

export function drawJudgeCalibration(ctx, scene, state, api) {
  const { C, text, line } = api;
  const beat = state.beat ?? 0;
  if (beat === 0) {
    text(ctx, 'DEPLOY-17', 145, 295, 35, C.cyan);
    text(ctx, '“Approval and a linked rollback plan before rollout.”', 145, 391, 52, C.ink);
    const readouts = [
      ['Claim support', 'Does the passage establish “approval is required”?'],
      ['Answer relevance', 'Compare a question generated from the answer with Maya’s question.'],
      ['Context relevance', 'Identify the sentences in the prompt that help answer Maya.'],
    ];
    ['judge-claims', 'judge-question', 'judge-sentences'].forEach((cue, i) => {
      const y = 550 + i * 142;
      api.focus.target('method', () => {
        if (spoken(state, cue, 0) > 0) {
          text(ctx, readouts[i][0], 145, y, 38, C.blue);
          text(ctx, readouts[i][1], 575, y, 33, C.ink);
        }
      });
    });
    return;
  }

  const judged = spoken(state, 'compare-verdicts', 2) > 0;
  const falseAccept = completed(state, 'judge-false-accept', 3);
  const graded = completed(state, 'judge-errors', 3);
  text(ctx, 'Policy excerpt', 145, 261, 28, C.cyan);
  text(
    ctx,
    '“…require incident commander approval and a linked rollback plan before rollout.”',
    145,
    333,
    39,
    C.ink,
  );
  const cols = [145, 855, 1180, 1450];
  ['Claim in the freeze case', 'Human label', 'Judge', 'Comparison'].forEach((s, i) =>
    text(ctx, s, cols[i], 461, 31, C.muted),
  );
  line(ctx, 145, 498, 1772, 498, C.muted, 2);

  examples.forEach((e, i) => {
    const y = 594 + i * 100;
    const observed = (e.human === 'Supported') === (e.judge === 'Accept');
    api.focus.target('human-labels', () => {
      text(ctx, e.claim, cols[0], y, 38, C.ink);
      text(ctx, e.human, cols[1], y, 34, C.cyan);
    });
    api.focus.target('verdicts', () => {
      text(ctx, judged ? e.judge : '·', cols[2], y, 36, judged ? C.ink : C.muted);
    });
    api.focus.target('comparison', () => {
      const verdict = observed ? 'Agrees' : e.judge === 'Accept' ? 'False accept' : 'False reject';
      const assessed = i === 1 ? falseAccept : graded;
      text(
        ctx,
        assessed ? verdict : '?',
        cols[3],
        y,
        34,
        assessed ? (observed ? C.green : C.pink) : C.muted,
      );
    });
  });
  api.focus.target('format', () => {
    const format = spoken(state, 'judge-format', 3) > 0;
    const prompt = format
      ? 'Missing verdict field   →   count a format failure separately.'
      : graded
        ? 'Compare each prediction with its independent label.'
        : falseAccept
          ? 'The plan is due before rollout.'
          : judged
            ? 'Which acceptance could give Maya bad advice?'
            : 'Illustrative held-out cases';
    text(ctx, prompt, 145, 962, 37, C.ink);
  });
}

export default {
  id: 'judge-calibration',
  draw: drawJudgeCalibration,
  cues: [
    'judge-claims',
    'judge-question',
    'judge-sentences',
    'human-labels',
    'compare-verdicts',
    'judge-false-accept',
    'judge-errors',
    'judge-format',
  ],
};
