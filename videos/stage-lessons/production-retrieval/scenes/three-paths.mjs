import { indicate, pipeline, place, seq } from 'vizmatic/stage';
import { heading, label, note } from '../../kit-narrated.mjs';
import { carryIdentity, evidenceFrame, MOTION, RULE } from '../parts.mjs';
export default function threePaths(s, c) {
  const f = evidenceFrame(c);
  const rooms = f.work.rows(3, 'wide');
  const ingestion = place(
    pipeline(['Parse', 'Version', 'Index'], { width: f.work.width, size: 34, color: 'cyan' }),
    rooms[0],
  );
  const request = place(
    pipeline(['Scope', 'Evidence', 'Answer'], { width: f.work.width, size: 34, color: 'blue' }),
    rooms[1],
  );
  const release = place(
    pipeline(['Replay', 'Evaluate', 'Promote'], { width: f.work.width, size: 34, color: 'green' }),
    rooms[2],
  );
  const inputs = place(label('Luna’s request   ·   ' + RULE.requestDays + ' days stale   /   ' + RULE.requestHours + '-hour signal', { color: 'blue' }), f.foot);
  const fixtures = place(note('Invented policy and timing fixtures'), f.foot, 'left');
  s.add(heading(c.title), f.nodes, fixtures);
  carryIdentity(c, f);
  c.clear([...ingestion.rails, ...request.rails, ...release.rails], 0.7, 0.2);
  c.on('pr-rule', () => s.play(f.page.select('up to 14 days', MOTION)));
  c.swap('pr-inputs', fixtures, inputs);
  c.show('pr-lifetimes', ingestion, { lead: 0.45 });
  c.show('pr-request', request, { lead: 0.45 });
  c.show('pr-release', release, { lead: 0.45 });
  c.on('pr-lifetimes', () =>
    s.play(
      seq(
        ingestion.put({ id: 'policy' }, { duration: 0.4 }),
        ingestion.move('policy', 'Index', { duration: 1.4 }),
      ),
    ),
  );
  c.on('pr-request', () =>
    s.play(
      seq(
        request.put({ id: 'Luna' }, { duration: 0.4 }),
        request.move('Luna', 'Answer', { duration: 1.4 }),
      ),
    ),
  );
  c.on('pr-release', () =>
    s.play(
      seq(
        release.put({ id: 'replay' }, { duration: 0.4 }),
        release.move('replay', 'Promote', { duration: 1.4 }),
      ),
    ),
  );
  c.on('pr-memory', () =>
    s.play(
      ingestion.move('policy', 'Version', MOTION),
      indicate(f.page, { scale: 1, color: 'yellow' }),
    ),
  );
  c.clear(
    [...ingestion.items, ...request.items, ...release.items].map((n) => n.content),
    0.9,
    0.01,
  );
}
