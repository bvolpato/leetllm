import { facts } from './fixtures.mjs';
export function triageDecision(f) {
  if (
    !f ||
    f.ruleAvailable !== true ||
    typeof f.sourceId !== 'string' ||
    f.sourceId.trim() === '' ||
    f.severity !== 'P1' ||
    f.pageSent !== false ||
    !Number.isInteger(f.elapsed) ||
    f.elapsed < 0 ||
    !Number.isInteger(f.deadline) ||
    f.deadline < 0
  )
    return {
      action: 'needs_review',
      deadline_minutes: null,
      overdue: null,
      remaining: null,
    };
  return {
    action: 'page_on_call',
    deadline_minutes: f.deadline,
    overdue: f.elapsed > f.deadline,
    remaining: Math.max(0, f.deadline - f.elapsed),
  };
}
export function responseChecks(raw, reference = facts) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      parse: false,
      schema: null,
      policy: null,
      accepted: false,
    };
  }
  const fields = ['action', 'deadline_minutes', 'overdue', 'source_line_ids'];
  const schema =
    parsed !== null &&
    typeof parsed === 'object' &&
    !Array.isArray(parsed) &&
    Object.keys(parsed).sort().join(',') === [...fields].sort().join(',') &&
    ['page_on_call', 'needs_review'].includes(parsed.action) &&
    ((Number.isInteger(parsed.deadline_minutes) && parsed.deadline_minutes >= 0) ||
      parsed.deadline_minutes === null) &&
    (typeof parsed.overdue === 'boolean' || parsed.overdue === null) &&
    Array.isArray(parsed.source_line_ids) &&
    parsed.source_line_ids.every((x) => typeof x === 'string');
  if (!schema)
    return {
      parse: true,
      schema: false,
      policy: null,
      accepted: false,
    };
  const expected = expectedFields(reference);
  const policy =
    parsed.action === expected.action &&
    parsed.deadline_minutes === expected.deadline_minutes &&
    parsed.overdue === expected.overdue &&
    JSON.stringify(parsed.source_line_ids) === JSON.stringify(expected.source_line_ids);
  return {
    parse: true,
    schema: true,
    policy,
    accepted: policy,
  };
}
export function expectedFields(reference) {
  const decision = triageDecision(reference);
  return {
    action: decision.action,
    deadline_minutes: decision.deadline_minutes,
    overdue: decision.overdue,
    source_line_ids: decision.action === 'needs_review' ? [] : [reference.sourceId],
  };
}
export function promptSections(revised = false) {
  return [
    {
      label: 'TASK · instruction role',
      lines: [
        'Recommend the first page for this incident.',
        'Use the supplied runbook and incident snapshot.',
      ],
    },
    {
      label: 'FACTS · user input',
      lines: [
        'IR-7: First page within 30 minutes of P1 declaration.',
        'Current incident: P1; elapsed = 12; page_sent = false.',
      ],
    },
    {
      label: 'EXAMPLE · demonstration',
      lines: [
        'Unpaged P1 at minute 31 → page_on_call;',
        'deadline = 30; overdue = true; source = IR-7.',
      ],
    },
    {
      label: 'OUTPUT · instruction role',
      lines: [
        'Return action, deadline_minutes, overdue, source_line_ids.',
        revised ? 'Deadline: minutes since P1 declaration.' : 'Deadline: in minutes.',
        'Unpaged P1: page_on_call, integer limit, elapsed > limit, [line ID].',
        'Otherwise or missing facts: needs_review, null, null, [].',
      ],
    },
  ];
}
export function freshIncidentContract(ruleAvailable = true, reference = facts) {
  const f = { ...reference, elapsed: 37, ruleAvailable };
  return {
    incident: 'I-37',
    facts: f,
    fields: expectedFields(f),
  };
}
