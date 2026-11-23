import {
  assertEqual,
  column,
  indicate,
  passage,
  pipeline,
  place,
  row,
  segmentedBar,
  seq,
} from 'vizmatic/stage';
import { heading, label, namedBox, note } from '../../kit-narrated.mjs';
import { carryIdentity, evidenceFrame, REVIEWED_PARENT } from '../parts.mjs';
import {
  parentAdmission,
  parentPackingFixture,
} from '../../../films/production-retrieval/model.mjs';
import { PARENTS } from '../../../films/production-retrieval/fixtures.mjs';
export default function childToParent(s, c) {
  const f = evidenceFrame(c);
  const [hitsRoom, packedRoom, budgetRoom] = f.work.rows([2.2, 4, 1.2], 'normal');
  const hits = place(
    pipeline(['Child hits', 'Pinned parent', 'Packed once'], {
      width: f.work.width,
      size: 31,
      lanes: 2,
    }),
    hitsRoom,
  );
  const pending = place(
    namedBox('Complete parent · waiting for checks', {
      width: f.work.width,
      height: 300,
      color: 'dim',
      dash: true,
    }),
    packedRoom,
    'top',
  );
  const packed = f.page.slip(REVIEWED_PARENT, {
    width: f.work.width,
    title: 'E1 · eu-access-v2 · checked parent',
    size: 28,
    leading: 1.35,
    titleSize: 29,
    color: 'cyan',
  });
  const session = passage(PARENTS['eu-session-v1'].text, {
    width: f.work.width,
    size: 29,
    leading: 1.3,
    title: 'E2 · eu-session-v1 · checked parent',
    titleSize: 29,
    color: 'pink',
  });
  place(column([packed, session], { gap: 'tight' }), packedRoom, 'top left');
  const mapping = place(
    note('key-a + key-b: eu-key-v2 → eu-access-v2 → E1 · session: eu-session-v1 → E2'),
    f.foot,
  );
  const fixture = parentPackingFixture();
  const budgetNames = place(
    row(
      fixture.budget.parts.map((p) =>
        note(p.label + ' ' + p.tokens, {
          color: p.label.startsWith('E1') ? 'cyan' : p.label.startsWith('E2') ? 'pink' : 'blue',
        }),
      ),
      { gap: 'wide' },
    ),
    f.foot,
  );
  const checks = parentAdmission(
    fixture.run.hits[0].record,
    PARENTS['eu-access-v2'],
    fixture.run.caller,
  );
  assertEqual(checks.accepted, true, 'all parent checks pass');
  const budget = place(
    segmentedBar(
      fixture.budget.parts.map((p) => ({
        name: p.label,
        value: 0,
        color: p.label.startsWith('E1') ? 'cyan' : p.label.startsWith('E2') ? 'pink' : 'blue',
      })),
      {
        width: f.work.inset('normal').width,
        height: 28,
        capacity: fixture.budget.limit,
        size: 34,
        labels: false,
        title: 'Whole request · byte-v1 toy tokenizer',
      },
    ),
    budgetRoom,
  );
  const checkNames = place(note('parent ID · document · version · date · region · ACL'), f.foot);
  s.add(heading(c.title), f.nodes, hits, pending, checkNames);
  carryIdentity(c, f);
  c.on('child-match', () =>
    s.play(f.page.select('automated rotation up to 14 days', { duration: 0.8 })),
  );
  c.on('parent-condition', () =>
    s.play(f.page.select('provided the risk signal is at most 48 hours old.', { duration: 0.8 })),
  );
  c.on('resolve-parent', () =>
    s.play(
      seq(
        hits.put(
          [
            { id: 'key-a', badge: 'eu-access-v2', color: 'cyan' },
            { id: 'key-b', badge: 'eu-access-v2', color: 'cyan' },
          ],
          { duration: 0.4 },
        ),
        hits.move(['key-a', 'key-b'], 'Pinned parent', { duration: 0.9 }),
      ),
    ),
  );
  c.on('check-parent', () => s.play(indicate(checkNames, { scale: 1, color: 'green' })));
  c.hide('pack-sections', pending, { lead: 0, fade: 0.2 });
  c.show('pack-sections', [packed, session], { lead: -0.25, fade: 0.6 });
  const parentLink = f.page.link(REVIEWED_PARENT, packed, { color: 'cyan' });
  c.on('pack-sections', () => s.play(parentLink.enter({ duration: 0.8 })), 0.9);
  c.on('deduplicate', () =>
    s.play(
      seq(
        hits.join('key-b', 'key-a', { duration: 0.8 }),
        hits.move('key-a', 'Packed once', { duration: 0.8 }),
      ),
    ),
  );
  c.swap('pack-sections', checkNames, mapping);
  c.hide('count-complete-request', parentLink);
  c.show('count-complete-request', budget);
  c.swap('count-complete-request', mapping, budgetNames, { after: true });
  c.after('count-complete-request', () =>
    s.play(...fixture.budget.parts.map((p) => budget.resize(p.label, p.tokens, { duration: 1.2 }))),
  );
  c.clear(
    hits.items.map((n) => n.content),
    0.8,
    0.01,
  );
  c.clear(hits.rails, 0.7, 0.2);
}
