import { dot, indicate } from 'vizmatic/stage';
import { episodeInventoryCheck } from '../../../films/capstone-production-llm-agent/model.mjs';
import { area, heading } from '../../kit-narrated.mjs';
import { C, episodes, episodeStrips, field } from '../parts.mjs';

export default function mutations(s, c) {
  s.add(heading('Can a good draft hide a bad report?'));
  const [stage, ids, foot] = area.rows([8, 0.55, 0.65], 'tight');
  const { heads, strips } = episodeStrips(stage);
  const [, stale, , , forbidden, replay] = strips;
  const duplicate = field(stale.nameArea, episodes[0].name, C.active, 34);
  const wrong = dot(12, C.stored).moveTo(forbidden.points[0]);
  const bool = field(replay.number, 'true', C.blocked, 36);
  const schema = field(replay.words, 'Unexpected field    passed = true', C.blocked, 32);
  const [expectedSlot, reportedSlot] = ids.columns(2, 'normal');
  const expectedId = 'access-agent-fixture-v4';
  const expected = field(expectedSlot, 'Expected   ' + expectedId, C.stored, 31);
  const reported = field(reportedSlot, 'Reported   ' + expectedId, C.stored, 31);
  const foreign = field(reportedSlot, 'Reported   access-agent-fixture-v3', C.blocked, 31);
  const inventory = episodes.map((e) => e.key);
  const missing = inventory.with(1, inventory[0]);
  if (!episodeInventoryCheck(inventory) || episodeInventoryCheck(missing))
    throw Error('Episode inventory drifted.');
  const coverage = field(
    foot,
    'Hold   ·   ' + missing.length + ' rows, ' + new Set(missing).size + ' distinct episodes',
    C.blocked,
  );
  const version = field(foot, 'Hold   ·   report belongs to another candidate', C.blocked);
  const flag = field(foot, 'Hold   ·   forbidden action marked executed', C.blocked);
  const type = field(foot, 'Hold   ·   effect count requires an integer', C.blocked);
  const extra = field(foot, 'Hold   ·   unexpected row field', C.blocked);
  const pass = field(foot, 'Fixture suite pass', C.effect);
  const provenance = field(
    foot,
    'Live release needs trusted run provenance and held-out evidence.',
    C.active,
  );
  s.add(
    heads,
    strips.map((r) => [r.skeleton, r.observed]),
    expected,
    reported,
  );
  c.on('release-mutations-b1', () =>
    s.play(indicate(strips[2].name, { scale: 1, color: C.active })),
  );
  c.swap('duplicate-name', stale.name, duplicate);
  c.show('incomplete-coverage', coverage, { after: true });
  c.swap('restore-inventory', duplicate, stale.name);
  c.hide('restore-inventory', coverage);
  c.swap('wrong-build', reported, foreign);
  c.show('build-verdict', version, { after: true });
  c.swap('release-mutations-b2', forbidden.marks[0][0], wrong);
  c.swap('release-mutations-b2', foreign, reported);
  c.hide('release-mutations-b2', version);
  c.show('forbidden-verdict', flag, { after: true });
  c.swap('reset-flag', wrong, forbidden.marks[0][0]);
  c.hide('reset-flag', flag);
  c.swap('boolean-edit', replay.effect[1], bool);
  c.show('boolean-rejected', type, { after: true });
  c.swap('passed-field', [bool, replay.empty], [replay.effect[1], schema]);
  c.hide('passed-field', type);
  c.show('schema-rejected', extra, { after: true });
  c.swap('release-mutations-b3', schema, replay.empty);
  c.hide('release-mutations-b3', extra);
  c.show('suite-result', pass, { after: true });
  c.swap('trusted-run', pass, provenance);
}
