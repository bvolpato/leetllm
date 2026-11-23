import { boxOf, circle, dot, fade, line, place, to } from 'vizmatic/stage';
import { actions } from '../../../films/capstone-production-llm-agent/fixtures.mjs';
import { plannerFacts } from '../../../films/capstone-production-llm-agent/model.mjs';
import { chip, label, note } from '../../kit-narrated.mjs';
import { bench, C, field, openBench } from '../parts.mjs';

export default function loop(s, c) {
  openBench(s, c, 'Which observations unlock the draft?');
  const [title, trace, lowerTitle, lower, foot] = bench.rows([1, 3, 1, 3, 1], 'tight');
  const facts = plannerFacts(actions.length);
  const observations = [facts.policy.id, facts.account.id, 'Policy + citation', 'Handoff'];
  const host = field(title, 'Host observations', C.stored);
  const previous = field(title, 'Earlier run   ·   host observations', 'dim');
  const steps = trace.columns(4, 'normal').map((cell, i) => {
    const [action, value, station] = cell.rows([1, 1, 1.4], 'tight');
    return {
      name: place(label(actions[i], { size: 34 }), action),
      result: place(note(observations[i], { color: C.stored }), value),
      ring: place(circle(34, { stroke: 'dim', width: 3, fill: 'surface' }), station),
      point: station.point('center'),
    };
  });
  const rail = line(steps[0].point, steps.at(-1).point, { stroke: 'grid', width: 4 });
  const marks = steps.map((x) => dot(18, C.stored).moveTo(x.point));
  const cursor = dot(10, C.active).moveTo(steps[0].point);
  const copyTitle = field(lowerTitle, 'Planner’s copy', C.stored);
  const needs = field(lowerTitle, 'Inputs for a draft', 'dim');
  const earlyTitle = field(lowerTitle, 'Fresh attempt', C.active);
  const cells = lower.columns(4, 'normal');
  const slots = cells.map((cell) => cell.rows([1, 1, 1], 'tight'));
  const copyPoints = slots.map(([station]) => station.point('center'));
  const copies = steps.slice(0, 2).map((x) => dot(18, C.stored).moveTo(x.point));
  const copyLabels = slots.slice(0, 2).map(([, value], i) =>
    place(note(observations[i], { color: C.stored }), value),
  );
  const gauge = slots
    .slice(1)
    .map(([station, name], i) => [
      place(circle(32, { fill: 'surface', stroke: 'dim', width: 3, dash: [6, 6] }), station),
      place(note(['Policy evidence', 'Account context', 'Draft'][i]), name),
    ]);
  const request = place(chip('Draft request', { color: C.active }), slots[0][0], 'left');
  const stop = [cells[1].left - 12, copyPoints[0][1]];
  const edge = line([stop[0], slots[1][0].top], [stop[0], slots[1][0].bottom], {
    stroke: C.blocked,
    width: 5,
  });
  const guard = field(foot, 'Missing policy and account evidence', C.blocked);
  const copy = field(foot, 'The host retains the original observations.', C.stored);
  const checked = field(foot, 'Host check   ·   verified policy and A300 context', C.stored);
  const proposal = place(chip('Draft proposal', { color: C.active }), slots[2][0]);
  const proposalTip = dot(12, C.active).moveTo(copyPoints[2]);
  const replayTitle = field(title, 'Host observations before drafting', C.stored);
  const done = field(title, 'Host recorded the handoff', C.stored);
  const later = [marks[2], marks[3], steps[2].result, steps[3].result];
  const completed = [...marks, ...steps.flatMap((x) => [x.name, x.result])];
  s.add(
    rail,
    steps.map((x) => [x.name, x.ring]),
    host,
    cursor,
    needs,
    gauge,
  );
  ['policy-evidence', 'account-context', 'cited-draft', 'review-stop'].forEach((cue, i) => {
    if (i) c.on(cue, () => s.play(to(cursor, (n) => n.moveTo(steps[i].point), { duration: 0.6 })));
    c.show(cue, [marks[i], steps[i].result], { after: true });
  });
  c.hide('fresh-attempt', cursor);
  c.swap('fresh-attempt', host, previous);
  c.on('fresh-attempt', () =>
    s.play(...completed.map((node) => fade(node, 0.48)), { duration: 0.3 }),
  );
  c.swap('fresh-attempt', needs, earlyTitle);
  c.show('fresh-attempt', request);
  c.on(
    'fresh-attempt',
    () =>
      s.play(
        to(request, (n) => n.moveTo([stop[0] - boxOf(request).width / 2 - 14, stop[1]]), {
          duration: 0.7,
        }),
      ),
    0.4,
  );
  c.show('early-draft', edge);
  c.show('early-draft', guard, { after: true });
  c.hide('state-transitions', later);
  c.on('state-transitions', () =>
    s.play(...[marks[0], marks[1], steps[0].result, steps[1].result, ...steps.map((x) => x.name)]
      .map((node) => fade(node, 1)), { duration: 0.3 }),
  );
  c.swap('state-transitions', [previous, earlyTitle, gauge, request, guard, edge], replayTitle, { after: true });
  c.show('planner-copy', [copyTitle, copy, copies]);
  c.on('planner-copy', () =>
    s.play(...copies.map((node, i) => to(node, (n) => n.moveTo(copyPoints[i]), { duration: 0.8 }))), 0.35);
  c.show('planner-copy', copyLabels, { after: true });
  c.show('planner-copy', proposal, { after: true, lead: -0.45 });
  c.swap('validated-action', copy, checked);
  c.swap('validated-action', proposal, proposalTip, { lead: 0, fade: 0.15 });
  c.on('validated-action', () =>
    s.play(to(proposalTip, (n) => n.moveTo(steps[2].point), { duration: 0.8 })), 0.4);
  c.swap('validated-action', proposalTip, [marks[2], steps[2].result], { after: true });
  c.after('validated-action', () => s.play(to(cursor, (n) => n.moveTo(steps[2].point), { duration: 0 })));
  c.show('validated-action', cursor, { after: true, lead: -0.6 });
  c.after('validated-action', () => s.play(to(cursor, (n) => n.moveTo(steps[3].point), { duration: 0.6 })), 1.3);
  c.show('validated-action', [marks[3], steps[3].result], { after: true, lead: -1.9 });
  c.swap('validated-action', replayTitle, done, { after: true, lead: -1.9 });
}
