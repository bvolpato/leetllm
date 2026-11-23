import { draw } from 'vizmatic/stage';
import { captions, fork, frame, record, ring, signal } from '../parts.mjs';

export default function graph(s, c) {
  frame(s, 'How can risk change both sides?', 'Assumed routing mechanism', 'Trace a path');
  const g = fork(),
    fixed = ring(g.risk);
  const [source, back, direct] = record(s, [
    ['Starting variable', 'Pre-routing risk'],
    ['Backdoor path', 'A ← risk → Y'],
    ['Workflow effect', 'A → Y', 'cyan'],
  ]);
  s.add(g.a, g.y, g.risk);
  c.keep([g.a, g.y]);
  c.show('fork', [draw(g.ra), draw(g.ry)]);
  signal(s, c, 'backdoor', [g.ra, g.ry]);
  c.show('effect', draw(g.ay));
  c.show('condition', fixed);
  back(c, 'condition', 'Blocked at risk', true);
  signal(s, c, 'role', [g.ay]);
  source(c, 'role', 'Assignment');
  captions(s, c, 'A names the workflow assignment. Y names resolution within 24 hours.', [
    ['backdoor', 'A shared cause can produce an association between workflow and resolution.'],
    ['condition', 'Compare tickets at fixed risk to block this backdoor path.'],
    ['role', 'The direction of each arrow determines what adjustment would remove.'],
  ]);
}
