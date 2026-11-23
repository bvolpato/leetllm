import { facts, good } from '../fixtures.mjs';
import { sampleModel } from '../construction.mjs';
import { triageDecision } from '../model.mjs';
import { markMinute, measure, minuteRuler, paperLine } from '../incident-picture.mjs';

export function drawPromptRevision(ctx, scene, state, api) {
  const { C, focus } = api;
  const { revised, sections } = sampleModel('prompt-revision', state);
  const edit = focus.progress('revision-wording');
  const readingFromNow = focus.progress('revision-left') > 0;
  const later = focus.progress('revision-tick') > 0;
  const reply = focus.cue('revision-reply');
  const elapsed = facts.elapsed + Number(later);
  const decision = triageDecision({ ...facts, elapsed });
  const x = minuteRuler(ctx, api, 594, facts.deadline, [0, facts.deadline]);
  paperLine(
    ctx,
    api,
    'Prompt   /   output field',
    sections[3].lines[1],
    250,
    revised ? C.green : C.blue,
    'revised-reference-phrase',
  );
  markMinute(ctx, api, x(0), 594, 'P1 declared', C.ink);
  focus.target('reading-now', () =>
    markMinute(ctx, api, x(elapsed), 594, (later ? 'Test input · ' : 'Now · ') + elapsed, C.cyan),
  );
  markMinute(ctx, api, x(facts.deadline), 594, 'IR-7 limit', C.green);
  focus.target('time-remaining', () => {
    measure(
      ctx,
      api,
      x(elapsed),
      x(facts.deadline),
      770,
      C.cyan,
      readingFromNow ? decision.remaining + ' min left' : 'Time left?',
    );
  });
  focus.target('field-interval', () => {
    let label = 'From declaration?';
    if (readingFromNow) label = 'deadline_minutes = ' + decision.remaining + '?';
    if (revised) label = edit < 1 ? '' : 'deadline_minutes = ' + decision.deadline_minutes;
    measure(
      ctx,
      api,
      x(readingFromNow ? elapsed * (1 - edit) : 0),
      x(facts.deadline),
      925,
      C.yellow,
      label,
    );
  });
  focus.target('revised-page-response', () => {
    if (!reply || reply.phase === 'before') return;
    const flag = reply.phase === 'after' ? good.overdue : '?';
    const label = later
      ? 'Next test input · model reply pending'
      : 'Supplied reply · deadline ' + good.deadline_minutes + ' · overdue ' + flag;
    api.text(ctx, label, 960, 1013, 32, C.green, 'center');
  });
}
export default {
  id: 'prompt-revision',
  draw: drawPromptRevision,
  cues: ['revision-draft', 'revision-left', 'revision-wording', 'revision-reply', 'revision-tick'],
};
