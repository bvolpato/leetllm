import { C, title, line, txt, label, result, sheet, dial, cue } from './art.mjs';
import { facts, nextTeamRule } from '../../../films/prompt-engineering-fundamentals/fixtures.mjs';
import {
  expectedFields,
  triageDecision,
} from '../../../films/prompt-engineering-fundamentals/model.mjs';

const limit = facts.deadline;
export const offeredDeadline = 90;
export const lateMinutes = offeredDeadline - limit;
export const transferIncident = { ...facts, elapsed: 37 };
function register(c, x, y, legend, s) {
  label(c, legend, x, y);
  txt(c, s, x, y + 83, 73, C.ink, 'Serif');
}
export function opening(c, k) {
  title(c, 'When is the first page due?');
  const mark = cue(k, 0, 'thirty minutes');
  const travel = cue(k, 1, 'Follow its hand', 3.5);
  const answer = cue(k, 2, 'Sixty minutes late');
  const hand = offeredDeadline * travel;
  dial(c, {
    hand,
    limit: mark ? limit : null,
    span: [limit, hand, C.red],
    handLabel: k.beat.beatIndex === 0 ? 'SINCE DECLARATION' : 'PROPOSED PAGE',
  });
  sheet(c, 980, 254, 788, 594);
  label(c, 'ON-CALL RUNBOOK     /     IR-7', 1030, 328, C.green);
  txt(c, 'First page due within', 1030, 424, 50, C.ink, 'Serif');
  txt(c, limit + ' min of P1 declaration', 1030, 491, 53, C.green, 'Serif');
  line(c, 1030, 535, 1715, 535, C.hair, 2);
  if (k.beat.beatIndex > 0) {
    label(c, 'ASSISTANT REPLY     /     CITES IR-7', 1030, 599, C.blue);
    txt(c, 'Page within ' + offeredDeadline + ' min', 1030, 686, 59, C.blue, 'Serif');
  } else register(c, 1030, 611, 'INCIDENT CLOCK', 'P1 declared');
  if (answer)
    result(
      c,
      offeredDeadline + ' − ' + limit + ' = ' + lateMinutes + ' min late',
      1030,
      792,
      C.red,
      52,
    );
  else if (travel === 1) result(c, 'How far past the limit?', 1030, 792, C.ink);
  if (cue(k, 2, 'Ask for the deadline'))
    txt(
      c,
      '“Give the deadline in minutes since P1 declaration.”',
      960,
      961,
      44,
      C.ink,
      'Serif',
      'center',
    );
}
export function baseline(c, k) {
  title(c, 'Work out the first-page decision');
  const toLimit = cue(k, 1, 'Watch the clock', 3),
    beyond = cue(k, 1, 'Advance one minute');
  const elapsed = Math.round(facts.elapsed + (limit - facts.elapsed) * toLimit + beyond);
  const missing = cue(k, 2, 'A missing rule');
  const f = { ...facts, elapsed, ruleAvailable: !missing };
  const d = triageDecision(f);
  dial(c, {
    hand: elapsed,
    max: 50,
    limit: missing ? null : limit,
    span: missing ? null : [elapsed, limit, C.green],
  });
  sheet(c, 955, 253, 836, 620);
  label(c, 'INCIDENT SNAPSHOT   /   UNPAGED P1', 1012, 329);
  result(
    c,
    missing ? 'No applicable line' : facts.sourceId + '   ·   ' + limit + ' min',
    1012,
    422,
    missing ? C.red : C.green,
    58,
  );
  line(c, 1012, 470, 1714, 470, C.hair, 2);
  txt(
    c,
    missing ? 'deadline     null' : elapsed + ' > ' + limit + '    ' + String(d.overdue),
    1012,
    574,
    49,
    C.ink,
    'Mono',
  );
  txt(
    c,
    missing ? 'overdue      null' : d.remaining + (d.remaining === 1 ? ' minute left' : ' minutes left'),
    1012,
    659,
    48,
    C.ink,
    'Mono',
  );
  result(c, d.action, 1012, 789, missing ? C.red : C.green, 57);
}
export function revision(c, k) {
  title(c, 'Where do the minutes start?');
  const added = cue(k, 1, 'since P1 declaration');
  const f = triageDecision(facts);
  const trace = cue(k, 0, 'Start at declaration', 1.6);
  dial(c, {
    max: 50,
    hand: facts.elapsed,
    limit,
    span: [facts.elapsed, limit, C.green],
    innerSpan: [0, limit * trace, C.blue],
  });
  sheet(c, 962, 260, 838, 582);
  label(c, 'PROMPT   /   OUTPUT FIELD', 1012, 335);
  txt(c, 'Give the deadline in minutes', 1012, 442, 51, C.ink, 'Serif');
  if (added) {
    txt(c, 'since P1 declaration.', 1012, 513, 54, C.blue, 'Serif');
    line(c, 1012, 530, 1515, 530, C.blue, 3);
  }
  line(c, 1012, 578, 1739, 578, C.hair, 2);
  if (k.beat.beatIndex === 2) {
    label(c, 'SUPPLIED REVISED REPLY', 1012, 647);
    txt(c, 'deadline_minutes   ' + limit, 1012, 722, 41, C.blue, 'Mono');
    txt(c, 'overdue            ' + f.overdue, 1012, 785, 41, C.ink, 'Mono');
  } else {
    result(c, 'From now: ' + f.remaining + ' minutes left', 1012, 676, C.green, 50);
    if (trace === 1) result(c, 'From declaration: ' + limit + ' minutes', 1012, 767, C.blue, 50);
  }
}
export function boundaryPractice(c, k) {
  title(c, 'Which neighboring case should Luna add?');
  const show = cue(k, 1, 'Try minute thirty');
  const test = cue(k, 2, 'Use separate development cases');
  for (const [i, m] of [limit, limit + 1].entries()) {
    const x = 490 + 940 * i;
    const d = triageDecision({ ...facts, elapsed: m });
    if (i || show) {
      dial(c, { x, y: 534, r: 238, max: 50, hand: m, limit });
      txt(c, 'overdue = ' + d.overdue, x, 868, 45, d.overdue ? C.red : C.green, 'Mono', 'center');
    } else {
      sheet(c, 213, 320, 555, 413);
      txt(c, 'Last minute when', x, 484, 49, C.ink, 'Serif', 'center');
      txt(c, 'false was correct?', x, 560, 49, C.ink, 'Serif', 'center');
    }
  }
  if (!show) txt(c, 'Revised reply: false', 1430, 926, 36, C.red, 'Mono', 'center');
  if (test)
    txt(
      c,
      'One example vs. this pair    /    Score separate development cases',
      960,
      954,
      33,
      C.muted,
      'Mono',
      'center',
    );
}
function afterPhrase(k, beat, phrase, captionStart = false) {
  const { beatIndex } = k.beat;
  if (beatIndex !== beat) return beatIndex > beat;
  const { start, end } = k.wordCue(phrase);
  return k.reveal(phrase, end - start, { captionStart }) === 1;
}

export function transfer(c, k) {
  title(c, "Luna's next incident");
  const initialRule = afterPhrase(k, 0, 'It allows thirty minutes');
  const lookupEmpty = afterPhrase(k, 2, 'the lookup returns no applicable rule');
  const replacementFound = afterPhrase(k, 4, 'service returns IR-9');
  const replacementReady = afterPhrase(k, 4, 'forty-five minutes from P1 declaration');
  const rule = replacementReady ? nextTeamRule : initialRule && !lookupEmpty ? facts : null;
  const snapshot = {
    ...transferIncident,
    ...(rule === nextTeamRule ? nextTeamRule : {}),
    ruleAvailable: Boolean(rule),
  };
  const fields = expectedFields(snapshot);
  const spokenFields = new Set();
  let span;
  let comparison;

  if (rule === facts) {
    if (afterPhrase(k, 1, 'Recommend paging now', 'Recommend paging now')) spokenFields.add('action');
    if (afterPhrase(k, 1, 'Thirty-seven is past thirty')) {
      span = [rule.deadline, snapshot.elapsed, C.red];
      comparison = snapshot.elapsed + ' > ' + rule.deadline + ' · past the limit';
    }
    if (afterPhrase(k, 1, 'The deadline is thirty', 'The deadline is thirty'))
      spokenFields.add('deadline_minutes');
    if (afterPhrase(k, 1, 'overdue is true', 'overdue is true')) spokenFields.add('overdue');
    if (afterPhrase(k, 1, 'the source is IR-7', 'and the source is IR-7'))
      spokenFields.add('source_line_ids');
  } else if (rule === nextTeamRule) {
    if (afterPhrase(k, 5, 'Recommend paging now', 'Recommend paging now')) spokenFields.add('action');
    if (afterPhrase(k, 5, 'Cite IR-9', 'Cite IR-9')) spokenFields.add('source_line_ids');
    if (afterPhrase(k, 5, 'enter forty-five for the deadline', 'and enter forty-five'))
      spokenFields.add('deadline_minutes');
    if (afterPhrase(k, 5, 'eight minutes remain', 'eight minutes remain')) {
      const { remaining } = triageDecision(snapshot);
      span = [snapshot.elapsed, rule.deadline, C.green];
      comparison = rule.deadline + ' − ' + snapshot.elapsed + ' = ' + remaining + ' min left';
    }
    if (afterPhrase(k, 5, 'overdue is false', 'so overdue is false')) spokenFields.add('overdue');
  } else if (lookupEmpty && !replacementFound) {
    if (afterPhrase(k, 3, 'Send the case for review', 'Send the case for review'))
      spokenFields.add('action');
    if (afterPhrase(k, 3, 'deadline and overdue flag null', 'Leave the deadline')) {
      spokenFields.add('deadline_minutes');
      spokenFields.add('overdue');
    }
    if (afterPhrase(k, 3, 'empty list of sources', 'with an empty list of sources'))
      spokenFields.add('source_line_ids');
  }

  dial(c, {
    y: 480,
    r: 291,
    hand: snapshot.elapsed,
    max: 50,
    limit: rule?.deadline ?? null,
    limitArrival: rule === nextTeamRule ? cue(k, 4, 'Follow the green marker', 0.7) : 1,
    span,
  });
  if (comparison)
    txt(c, comparison, 506, 831, 48, span[2], 'Serif', 'center');

  sheet(c, 940, 234, 872, 655);
  label(c, 'INCIDENT I-37    /    UNPAGED P1', 989, 311);
  const ruleText = rule
    ? rule.sourceId + '   ·   ' + rule.deadline + ' min from declaration'
    : replacementFound
      ? nextTeamRule.sourceId + '   ·   Reading deadline'
      : lookupEmpty
        ? 'No applicable rule'
        : 'Runbook lookup';
  result(c, ruleText, 989, 397, rule ? C.green : C.muted, 49);
  line(c, 989, 435, 1759, 435, C.hair, 2);
  label(c, 'RECOMMENDATION', 989, 490, C.blue);
  Object.entries(fields).forEach(([field, value], j) => {
    const y = 554 + 66 * j;
    txt(c, field, 989, y, 35, C.ink, 'Mono');
    if (spokenFields.has(field))
      txt(c, JSON.stringify(value), 1749, y, 40, C.blue, 'Mono', 'right');
    else line(c, 1408, y + 6, 1749, y + 6, C.hair, 2);
  });

  if (afterPhrase(k, 5, 'Give that recommendation to the engineer')) {
    const dispatchCheck = afterPhrase(k, 5, 'since this snapshot');
    label(c, 'HANDOFF', 989, 829);
    txt(
      c,
      dispatchCheck ? 'Dispatcher rechecks page status' : 'Engineer receives recommendation',
      1180,
      829,
      37,
      C.ink,
      'Serif',
    );
  }
}
