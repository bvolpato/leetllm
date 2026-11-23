import { heading } from '../../kit-narrated.mjs';
import { scratchView } from '../scratch-view.mjs';

export default function scene(s, c) {
  const v = scratchView();
  const blankConfig = v.upper(0),
    blankFile = v.upper(1);
  const waiting = v.tile(0, 3, 'opening…'),
    noFile = v.read(1);
  const readBase = v.read(0),
    copied = v.upper(0, 'base text');
  const upperPath = v.lookup(0, 2),
    lowerPath = v.lookup(0, 1);
  s.add(heading(c.title), v.oldOwner, v.frame, blankConfig, blankFile, waiting, noFile);
  c.show('lookup', upperPath);
  c.swap('fall', upperPath, lowerPath);
  c.swap('read', waiting, readBase, { after: true });
  c.hide('copy', lowerPath);
  c.swap('copy', blankConfig, copied, { after: true });
  c.swap('edit', [copied, readBase], [v.upperEdit, v.readEdit], { after: true });
  c.show('again', upperPath);
  c.hide('output', upperPath);
  c.swap('output', [blankFile, noFile], [v.upperFile, v.readFile], { after: true });
  c.keep(v.running);
}
