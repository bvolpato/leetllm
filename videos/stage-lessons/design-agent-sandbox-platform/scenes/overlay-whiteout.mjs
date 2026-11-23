import { heading } from '../../kit-narrated.mjs';
import { scratchView } from '../scratch-view.mjs';

export default function scene(s, c) {
  const v = scratchView();
  const marker = v.upper(0, v.whiteout),
    missing = v.read(0, v.whiteout);
  const stop = v.lookup(0, 2);
  const old = v.receipt('delete config.txt');
  const next = v.ownerTag('Next generation   /   J4   /   generation 5', 'blue');
  const blanks = [v.upper(0), v.upper(1)];
  const waiting = [v.tile(0, 3, '?', 'ink'), v.tile(1, 3, '?', 'ink')];
  const ask = v.receipt('Which names will the new guest find?');
  const dirs = v.receipt('Private upper and work directories share one filesystem.', 'dim');

  s.add(heading(c.title));
  c.take(v.running);
  c.show('remove', old);
  c.swap('whiteout', [v.upperEdit, v.readEdit], [marker, missing], { after: true });
  c.show('lookup', stop);
  c.hide('dispose', [v.oldOwner, marker, missing, v.upperFile, v.readFile, stop, old], {
    after: true,
  });
  c.show('new', [next, blanks, waiting], { after: true });
  c.show('ask', ask);
  c.swap('back', waiting[0], [v.read(0), v.lookup(0, 1)], { after: true, lead: 0 });
  c.hide('back', ask, { after: true, lead: 0 });
  c.swap('absent', waiting[1], [v.read(1), v.lookup(1, 1)], { after: true, lead: 0 });
  c.show('dirs', dirs);
}
