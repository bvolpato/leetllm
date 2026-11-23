import { facts, good } from '../fixtures.mjs';
import { expectedFields, responseChecks } from '../model.mjs';
import { chapterText } from '../defaults.mjs';

const fieldCues = ['incoming-action', 'incoming-deadline', 'incoming-overdue', 'incoming-source'];

export function drawCompleteResponse(ctx, scene, state, api) {
  const { C, focus } = api;
  const started = (id) => focus.progress(id) > 0;
  const finished = (id) => focus.cue(id)?.phase === 'after';
  const winner = finished('change-deadline');
  const candidate = { ...good, deadline_minutes: winner ? 90 : facts.deadline };
  const entries = Object.entries(candidate);
  const count = fieldCues.filter(started).length;
  const closed = finished('close-object');
  const lines = [
    '{',
    ...entries
      .slice(0, count)
      .map(
        ([key, value], i) =>
          '  "' + key + '": ' + JSON.stringify(value) + (i < entries.length - 1 ? ',' : ''),
      ),
  ];
  if (closed) lines.push('}');
  const checks = responseChecks(lines.join('\n'));
  const parsed = finished(winner ? 'reparse-object' : 'parse-object');
  const types = finished(winner ? 'recheck-types' : 'check-types');
  const evidence = started('align-fields');
  const inspected = finished(winner ? 'compare-deadline' : 'accept-reference');
  const expected = expectedFields(facts);

  const status = (x, label, result, ready, target) =>
    focus.target(target, () => {
      chapterText(ctx, api, label, x, 260, 30, C.muted);
      chapterText(
        ctx,
        api,
        ready ? (result ? 'Pass' : 'Fail') : 'Pending',
        x,
        329,
        54,
        ready ? (result ? C.green : C.pink) : C.muted,
      );
    });
  status(202, '1   Parse JSON', checks.parse, parsed, 'json-check');
  status(764, '2   Check field types', checks.schema, types, 'type-check');
  status(1320, '3   Compare with IR-7', checks.policy, inspected, 'policy-check');
  api.line(ctx, 180, 376, 1730, 376, C.muted, 2);
  chapterText(
    ctx,
    api,
    winner ? 'Vote winner · 4 replies' : 'Minority answer · 1 reply',
    200,
    460,
    38,
    C.blue,
  );
  chapterText(ctx, api, 'IR-7  /  unpaged P1  /  minute 12', 1025, 460, 34, C.cyan);
  const firstY = 539,
    step = 65;
  lines.forEach((line, i) => {
    const target = line === '}' ? 'object-end' : 'response-field-' + i;
    focus.target(target, () => {
      const mismatch = inspected && !checks.policy && i === 2;
      chapterText(ctx, api, line, 200, firstY + i * step, 36, mismatch ? C.pink : C.ink);
    });
  });
  if (count === entries.length && !closed)
    focus.target('object-end', () => {
      const y = firstY + lines.length * step;
      api.line(ctx, 200, y, 224, y, C.blue, 3);
    });
  const rowCue = focus.progress('compare-deadline');
  focus.target('reference-fields', () => {
    if (!evidence) return;
    entries.forEach(([key], i) => {
      const y = firstY + (i + 1) * step;
      const matches = JSON.stringify(candidate[key]) === JSON.stringify(expected[key]);
      const drawValue = () =>
        chapterText(ctx, api, JSON.stringify(expected[key]), 1230, y, 39, C.ink);
      if (key === 'deadline_minutes') focus.target('reference-deadline', drawValue);
      else drawValue();
      if (inspected)
        chapterText(
          ctx,
          api,
          matches ? '=' : '≠',
          1040,
          y,
          43,
          matches ? C.green : C.pink,
          'center',
        );
    });
    if (rowCue > 0) {
      const y = firstY + 2 * step + 17;
      api.line(ctx, 235, y, 235 + 1090 * rowCue, y, C.pink, 4);
    }
  });
  const caption = !closed
    ? count === entries.length
      ? 'Can the parser finish this object yet?'
      : 'Receiving reply text'
    : !evidence
      ? 'Complete JSON object'
      : !inspected
        ? winner
          ? 'Which field would make you reject this reply?'
          : 'Does each field agree with the trusted incident?'
        : checks.accepted
          ? 'Accepted recommendation for engineer review'
          : 'Rejected · the cited line gives 30 minutes';
  chapterText(
    ctx,
    api,
    caption,
    960,
    992,
    36,
    inspected && !checks.accepted ? C.pink : C.yellow,
    'center',
  );
}
export default {
  id: 'complete-response',
  draw: drawCompleteResponse,
  cues: [
    ...fieldCues,
    'close-object',
    'parse-object',
    'check-types',
    'align-fields',
    'accept-reference',
    'change-deadline',
    'reparse-object',
    'recheck-types',
    'compare-deadline',
  ],
};
