import { facts, nextTeamRule } from '../fixtures.mjs';
import { freshIncidentContract } from '../model.mjs';
import { chapterText } from '../defaults.mjs';
import { markMinute, minuteRuler, paperLine } from '../incident-picture.mjs';

const teamRule = { ...facts, ...nextTeamRule };

export function drawFreshBoundary(ctx, scene, state, api) {
  const { C, focus } = api;
  const remove = focus.progress('pf-fresh-remove');
  const receiving = focus.progress('restore-rule') > 0;
  const rule = receiving ? teamRule : facts;
  const ruleHeight = receiving ? focus.progress('read-team-limit') : 1 - remove;
  const available = ruleHeight === 1;
  const incident = freshIncidentContract(available, rule);
  const resultCue = receiving
    ? 'check-restored-rule'
    : remove > 0
      ? 'pf-fresh-fallback'
      : 'pf-fresh-present';
  const settled = available || (!receiving && remove === 1);
  const answered = settled && focus.cue(resultCue)?.phase === 'after';
  let lookupText = 'No applicable line returned';
  if (available)
    lookupText =
      rule.sourceId + '   ·   First page within ' + rule.deadline + ' min of P1 declaration.';
  else if (receiving) lookupText = rule.sourceId + '   ·   Reading the applicable deadline…';
  else if (remove < 1) lookupText = 'Checking the applicable line…';
  const y = 549;
  const x = minuteRuler(ctx, api, y, 50, [0, 10, 20, 30, 40, 50]);
  if (receiving && answered)
    api.line(ctx, x(incident.facts.elapsed), y, x(rule.deadline), y, C.green, 10);
  focus.target('current-rule', () => {
    const owner = receiving
      ? 'Other team’s runbook'
      : remove > 0
        ? 'Runbook lookup'
        : 'Luna’s runbook';
    paperLine(ctx, api, owner, lookupText, 229, available ? C.green : C.muted);
    if (ruleHeight > 0) {
      const mx = x(rule.deadline);
      const height = 64 * ruleHeight;
      api.line(ctx, mx, y - height, mx, y, C.green, 5);
      if (available)
        chapterText(
          ctx,
          api,
          rule.sourceId + ' · limit ' + rule.deadline,
          mx,
          y - 85,
          34,
          C.green,
          'center',
        );
    }
  });
  focus.target('incident-reading', () => {
    markMinute(
      ctx,
      api,
      x(incident.facts.elapsed),
      y,
      'Now · ' + incident.facts.elapsed,
      C.cyan,
      false,
    );
    chapterText(ctx, api, incident.incident + '   /   P1   /   no page sent', 250, 429, 34, C.ink);
  });
  const { action, deadline_minutes, overdue, source_line_ids } = incident.fields;
  focus.target('new-recommendation', () => {
    api.line(ctx, 180, 758, 1730, 758, C.muted, 2);
    chapterText(
      ctx,
      api,
      'Four-field recommendation   /   deadline in minutes since P1 declaration',
      210,
      820,
      31,
      C.muted,
    );
    const color = answered ? C.ink : C.yellow;
    if (answered) {
      chapterText(ctx, api, 'action:', 210, 895, 34, color);
      chapterText(ctx, api, action, 326, 895, 34, color);
    } else chapterText(ctx, api, 'action: ?', 210, 895, 34, color);
    chapterText(ctx, api, 'deadline: ' + (answered ? deadline_minutes : '?'), 675, 895, 34, color);
    chapterText(ctx, api, 'overdue: ' + (answered ? overdue : '?'), 1035, 895, 34, color);
    chapterText(
      ctx,
      api,
      'sources: ' + (answered ? JSON.stringify(source_line_ids) : '?'),
      1370,
      895,
      34,
      color,
    );
  });
  let message = 'Which four fields should Luna hand back?';
  if (!available && remove === 1 && !receiving)
    message = 'What can Luna recommend with this rule missing?';
  if (answered) {
    if (!available) message = 'Missing evidence → needs review; no page is dispatched';
    else if (overdue)
      message =
        incident.facts.elapsed +
        ' > ' +
        deadline_minutes +
        ' → overdue; accepted recommendation only';
    else
      message = deadline_minutes - incident.facts.elapsed + ' minutes left to send the first page';
  }
  chapterText(ctx, api, message, 960, 1004, 36, answered ? C.cyan : C.yellow, 'center');
}
export default {
  id: 'fresh-boundary',
  draw: drawFreshBoundary,
  cues: [
    'read-new-rule',
    'read-new-clock',
    'pf-fresh-present',
    'pf-fresh-remove',
    'pf-fresh-fallback',
    'restore-rule',
    'read-team-limit',
    'check-restored-rule',
  ],
};
