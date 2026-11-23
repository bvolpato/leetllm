import { policyRequest, policyEvaluation } from '../model.mjs';
import { cueMotion, resultAfter } from '../construction.mjs';
import { text, rect, line, circle } from '../defaults.mjs';
import { point, num } from '../geometry.mjs';

function scoreRequest(ctx, state, api) {
  const { C } = api;
  const f = policyRequest();
  const vec = (values) => '[' + values.map(num).join(', ') + ']';
  const operand = (cue, start, end) => cueMotion(state, cue, 0, start, end) > 0;
  text(ctx, api, 'Supplied scoring layer', 165, 251, 34, C.muted);
  api.focus.target('policy-operands', () => {
    if (operand('policy-operands-ready', 0.37, 0.45))
      text(ctx, api, 'Request  ' + vec(f.x), 165, 343, 45, C.cyan);
    if (operand('policy-base-row', 0.48, 0.57))
      text(ctx, api, 'W₀  ' + vec(f.W[0]), 630, 343, 41, C.blue);
    if (operand('policy-factor-row', 0.65, 0.75)) {
      text(ctx, api, 'A  ' + vec(f.A[0]), 1120, 343, 41, C.yellow);
      text(ctx, api, 'B = ' + num(f.B[0][0]) + '     α / r = 2 / 1', 1120, 406, 34, C.yellow);
    }
  });
  const operands = [
    ['Base score  W₀x', f.base, 'fresh-policy-base', 0.18, C.blue],
    ['Measurement  Ax', f.z, 'fresh-policy-z', 0.38, C.yellow],
    ['B times Ax', f.unscaled, 'fresh-policy-unscaled', 0.55, C.yellow],
    ['Scaled correction', f.correction, 'fresh-policy-correction', 0.7, C.yellow],
  ];
  api.focus.target('policy-arithmetic', () => {
    for (const [i, [label, value, id, end, color]] of operands.entries()) {
      const x = 165 + i * 425;
      text(ctx, api, label, x, 518, 30, color);
      text(
        ctx,
        api,
        resultAfter(state, id, 1, end) ? num(value) : '?',
        x,
        596,
        58,
        color,
        'left',
        'mono',
      );
    }
  });
  const map = (score) => 930 + score * 327;
  const y = 813;
  api.focus.target('policy-ruler', () => {
    line(ctx, api, point(map(-2), y), point(map(2), y), C.muted, 3);
    for (const tick of [-2, -1, 0, 1, 2]) {
      line(
        ctx,
        api,
        point(map(tick), y - (tick === 0 ? 68 : 10)),
        point(map(tick), y + 20),
        tick === 0 ? C.ink : C.muted,
        tick === 0 ? 4 : 2,
      );
      text(ctx, api, num(tick), map(tick), y + 65, 30, C.muted, 'center');
    }
    text(ctx, api, 'Routine review', 425, 713, 35, C.muted, 'center');
    text(ctx, api, 'Escalate at zero or above', 1235, 713, 35, C.ink, 'center');
    if (resultAfter(state, 'fresh-policy-base', 1, 0.18)) {
      const start = map(f.base);
      const motion = cueMotion(state, 'fresh-policy-output', 1, 0.72, 0.88);
      const end = map(f.base + motion * f.correction);
      if (motion > 0) line(ctx, api, point(start, y), point(end, y), C.yellow, 9);
      circle(ctx, api, start, y, 11, C.blue);
      if (motion > 0) circle(ctx, api, end, y, 12, C.yellow);
    }
    const ready = resultAfter(state, 'fresh-policy-output', 1, 0.88);
    text(ctx, api, 'Adapted score', 320, 980, 38, C.ink);
    text(ctx, api, ready ? num(f.output) : '?', 640, 980, 48, C.yellow, 'left', 'mono');
    const decision = resultAfter(state, 'fresh-policy-decision', 1, 0.94);
    text(
      ctx,
      api,
      decision
        ? f.escalate
          ? 'Send to rotation owner'
          : 'Routine review'
        : 'Where does the score land?',
      1045,
      980,
      38,
      decision ? C.green : C.muted,
    );
  });
}

function scoreTickets(ctx, state, api) {
  const { C } = api;
  const beat = state.beat;
  const repairA = resultAfter(state, 'policy-fix-a', 4, 0.42);
  const repairB = resultAfter(state, 'policy-fix-b', 5, 0.39);
  const fix = beat === 4 && repairA ? 'P20' : beat >= 5 && repairB ? 'R07' : undefined;
  const evaluation = policyEvaluation(fix);
  const stageName = beat === 4 ? 'Candidate A' : beat >= 5 ? 'Candidate B' : 'Original candidate';
  text(ctx, api, 'Same 40 held-out tickets  ·  pass mark 95% on each set', 155, 242, 37, C.ink);
  text(ctx, api, stageName, 155, 338, 38, C.cyan);
  if (beat === 5 && cueMotion(state, 'policy-save', 5, 0.79, 0.87) > 0) {
    const resume = cueMotion(state, 'policy-resume', 5, 0.88, 0.97) > 0;
    const label = resume ? 'Resume training  ·  optimizer state, schedule, data position'
      : 'Save together  ·  adapter B, exact base revision, ticket format';
    api.focus.target('policy-handoff', () => text(ctx, api, label, 655, 338, 30, C.ink));
  }
  const available = [
    resultAfter(state, 'fresh-policy-count', 2, 0.3),
    resultAfter(state, 'fresh-regression-count', 2, 0.55),
  ];
  api.focus.target('ticket-results', () => {
    for (const [i, row] of evaluation.rows.entries()) {
      api.focus.target(i === 0 ? 'policy-ticket-row' : 'routine-ticket-row', () => {
        const y = 392 + 152 * i;
        text(ctx, api, i === 0 ? 'Policy' : 'Routine', 155, y + 48, 38, C.ink);
        for (const [j, ticket] of row.cases.entries()) {
          const x = 400 + 54 * j;
          const relevant =
            (beat === 3 &&
              ((ticket.id === 'P20' && cueMotion(state, 'policy-option-a', 3, 0.1, 0.31) > 0) ||
                (ticket.id === 'R07' && cueMotion(state, 'policy-option-b', 3, 0.35, 0.58) > 0))) ||
            (beat === 4 && ticket.id === 'P20') ||
            (beat >= 5 && ticket.id === 'R07');
          const color = !available[i] ? C.muted : ticket.correct ? C.green : C.pink;
          rect(ctx, api, x, y, 46, 67, relevant ? C.panel : C.bg, relevant ? C.yellow : color, 5);
          text(ctx, api, ticket.id.slice(1), x + 23, y + 29, 25, color, 'center', 'mono');
          if (available[i]) {
            if (ticket.correct) {
              line(ctx, api, point(x + 13, y + 47), point(x + 21, y + 54), color, 3);
              line(ctx, api, point(x + 21, y + 54), point(x + 34, y + 40), color, 3);
            } else {
              line(ctx, api, point(x + 16, y + 42), point(x + 30, y + 55), color, 3);
              line(ctx, api, point(x + 30, y + 42), point(x + 16, y + 55), color, 3);
            }
          }
        }
        text(
          ctx,
          api,
          available[i] ? row.correct + ' / ' + row.cases.length : '? / 20',
          1530,
          y + 47,
          42,
          C.ink,
          'left',
          'mono',
        );
        if (available[i])
          text(ctx, api, Math.round(100 * row.rate) + '% correct', 1530, y + 91, 29, C.muted);
      });
    }
  });
  api.focus.target('ticket-decision', () => {
    let line1 = 'Each row needs at least 19 correct.',
      line2 = '';
    let color = C.ink;
    if (beat === 2 && resultAfter(state, 'fresh-policy-hold', 2, 0.9)) {
      line1 = 'HOLD  ·  Routine reviews fall one short.';
      line2 = 'R07  ·  12 days old  ·  sent to the owner in error';
      color = C.pink;
    } else if (beat === 3) {
      const optionA = cueMotion(state, 'policy-option-a', 3, 0.1, 0.31) > 0;
      const optionB = cueMotion(state, 'policy-option-b', 3, 0.35, 0.58) > 0;
      line1 = optionB
        ? 'A fixes P20. B fixes R07. Which candidate meets both minimums?'
        : optionA
          ? 'A fixes P20. Every other ticket keeps its original result.'
          : 'Two candidates each correct one more ticket.';
    } else if (beat === 4 || beat >= 5) {
      line1 = beat === 4 ? 'P20  ·  overdue key' : 'R07  ·  12 days old';
      if (fix)
        line1 +=
          beat === 4
            ? '     Routine review → rotation owner'
            : '     Rotation owner → routine review';
      const decision =
        beat === 4
          ? resultAfter(state, 'policy-verdict-a', 4, 0.78)
          : resultAfter(state, 'policy-verdict-b', 5, 0.77);
      if (decision) {
        line2 =
          evaluation.pooled +
          ' / 40 overall     ' +
          (evaluation.deploy
            ? 'PASS  ·  both sets reach 19'
            : 'HOLD  ·  routine reviews still at 18');
        color = evaluation.deploy ? C.green : C.pink;
      }
    }
    text(ctx, api, line1, 155, 770, 39, C.ink);
    if (line2) text(ctx, api, line2, 155, 865, 40, color);
    if (beat >= 5 && resultAfter(state, 'policy-verdict-b', 5, 0.77)) {
      for (const [i, [label, repair]] of [
        ['A', 'P20'],
        ['B', 'R07'],
      ].entries()) {
        const { rows, pooled } = policyEvaluation(repair);
        const summary =
          label + '   ' + rows[0].correct + ' policy + ' + rows[1].correct + ' routine = ' + pooled;
        text(ctx, api, summary, 155 + 860 * i, 973, 33, i === 0 ? C.muted : C.green);
      }
    }
  });
}

export function drawFreshPolicy(ctx, scene, state, api) {
  if (state.beat < 2) scoreRequest(ctx, state, api);
  else scoreTickets(ctx, state, api);
}
export default {
  id: 'fresh-policy',
  draw: drawFreshPolicy,
  cues: [
    'policy-operands-ready',
    'policy-base-row',
    'policy-factor-row',
    'fresh-policy-base',
    'fresh-policy-z',
    'fresh-policy-unscaled',
    'fresh-policy-correction',
    'fresh-policy-output',
    'fresh-policy-decision',
    'fresh-policy-count',
    'fresh-regression-count',
    'fresh-policy-hold',
    'policy-option-a',
    'policy-option-b',
    'policy-fix-a',
    'policy-verdict-a',
    'policy-fix-b',
    'policy-verdict-b',
    'policy-save',
    'policy-resume',
  ],
};
