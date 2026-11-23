import { boxOf, dot, line, place, rect, to } from 'vizmatic/stage';
import { operation } from '../../../films/capstone-production-llm-agent/model.mjs';
import { area, heading } from '../../kit-narrated.mjs';
import { C, episodeStrips, field, short } from '../parts.mjs';

export default function evaluation(s, c) {
  s.add(heading('What did each episode actually execute?'));
  const [stage, foot] = area.rows([8, 1], 'normal');
  const { heads, strips } = episodeStrips(stage);
  const marker = line(
    strips[0].nameArea.point('top left'),
    strips[0].nameArea.point('bottom left'),
    { width: 5, stroke: C.active },
  );
  const positions = strips.map((r) => [r.nameArea.left - 12, r.nameArea.point('center')[1]]);
  marker.moveTo(positions[0]);
  const row = strips[5];
  const [audit, db] = foot.rows(2, 'none');
  const [topic, resultSlot] = audit.columns([8, 1], 'normal');
  const query = field(topic, 'Evaluator   SELECT COUNT(*) FROM effects', C.stored, 33);
  const receipt = field(db, 'SQLite effects     ' + short(operation) + '…     A300     prod-api', C.stored, 32);
  const origin = [boxOf(row.effect[1]).point('center')[0], resultSlot.point('center')[1]];
  const count = field(row.number, '1', C.effect);
  const target = boxOf(count).point('center');
  count.moveTo(origin);
  const observation = field(topic, 'Grader   ·   reported restore_count 1 = expected 1', C.effect, 33);
  const blocked = dot(9, C.active).moveTo(strips[4].rail.point('left'));
  const subject = (where) => to(marker, (n) => n.moveTo(where), { duration: 0.4 });
  const version = field(topic, 'Candidate   ·   access-agent-fixture-v4', C.stored, 33);
  const suite = field(db, 'Dataset   ·   access-agent-episodes-v2       Grader   ·   trajectory-gate-v2', C.stored, 32);
  const controls = field(topic, 'Runtime limits   ·   steps, tokens, time', C.active, 34);
  const flags = field(topic, 'Dot = executed     × = blocked', C.stored);
  const focus = (i) => to(marker, (n) => n.moveTo(positions[i]), { duration: 0.45 });
  s.add(
    heads,
    strips.map((r) => r.skeleton),
    marker,
  );
  c.on('episode-boundaries', () => {
    s.play(focus(4));
    s.play(focus(5));
  });
  c.show('effect-store', [receipt, query], { lead: 0 });
  c.show('effect-store', count, { lead: -0.5 });
  c.on('effect-store', () => s.play(to(count, (n) => n.moveTo(target), { duration: 0.65 })), 0.85);
  c.swap('effect-store', query, observation, { after: true, lead: 0 });
  c.on('complete-inventory', () =>
    s.play(subject([positions[0][0], boxOf(heads[0]).point('center')[1]])),
  );
  c.swap('complete-inventory', [observation, receipt], [version, suite]);
  c.hide('runtime-limits', marker);
  c.swap('runtime-limits', version, controls);
  c.hide('evaluation-core-3', [controls, suite, count]);
  c.show('evaluation-core-3', flags, { lead: -0.4 });
  c.show('zero-planning', marker);
  c.after('zero-planning', () => s.play(focus(0)));
  c.show('zero-planning', [strips[0].observed, strips[1].observed], { after: true, stagger: true });
  for (const [i, cue] of [
    [2, 'four-actions'],
    [3, 'injected-handoff'],
  ]) {
    c.on(cue, () => s.play(focus(i)));
    c.show(cue, strips[i].observed, { after: true, stagger: true });
  }
  c.on('recorded-false', () => s.play(focus(4)));
  c.show('recorded-false', blocked);
  c.on(
    'recorded-false',
    () => s.play(to(blocked, (n) => n.moveTo(strips[4].points[0]), { duration: 0.65 })),
    0.3,
  );
  c.hide('recorded-false', blocked, { after: true, fade: 0.1 });
  c.show('recorded-false', strips[4].observed, { after: true, lead: 0 });
  c.on('one-replayed-effect', () => s.play(focus(5)));
  c.show('one-replayed-effect', strips[5].observed, { after: true, stagger: true });
}
